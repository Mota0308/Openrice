const axios = require('axios');
const OpenAI = require('openai');
const Restaurant = require('../models/Restaurant');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

// 使用 OpenAI 分析用戶的自然語言搜索
async function analyzeSearchQuery(query) {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "你是一個餐廳搜索助手。分析用戶的搜索查詢，提取以下信息：餐廳類型（如：日式、中式、火鍋等）、氛圍（如：適合約會、家庭聚餐等）、價格範圍、其他要求。以 JSON 格式返回結果。"
        },
        {
          role: "user",
          content: query
        }
      ],
      response_format: { type: "json_object" }
    });

    const analysis = JSON.parse(completion.choices[0].message.content);
    return analysis;
  } catch (error) {
    console.error('OpenAI API error:', error);
    // 如果 API 失敗，返回基本分析
    return {
      cuisine: extractCuisine(query),
      atmosphere: extractAtmosphere(query),
      priceRange: null
    };
  }
}

// 簡單的關鍵詞提取（備用方案）
function extractCuisine(query) {
  const cuisines = {
    '日式': ['日式', '日本', '壽司', '拉麵', '日料'],
    '中式': ['中式', '中餐', '川菜', '粵菜', '湘菜'],
    '火鍋': ['火鍋', '麻辣鍋', '涮涮鍋'],
    '西式': ['西式', '西餐', '牛排', '義大利', '法式'],
    '韓式': ['韓式', '韓國', '烤肉', '韓料'],
    '泰式': ['泰式', '泰國', '泰菜']
  };

  for (const [cuisine, keywords] of Object.entries(cuisines)) {
    if (keywords.some(keyword => query.includes(keyword))) {
      return cuisine;
    }
  }
  return null;
}

function extractAtmosphere(query) {
  const atmospheres = {
    '約會': ['約會', '浪漫', '情侶'],
    '家庭': ['家庭', '聚餐', '帶小孩'],
    '商務': ['商務', '會議', '工作'],
    '朋友': ['朋友', '聚會', '聚餐']
  };

  for (const [atmosphere, keywords] of Object.entries(atmospheres)) {
    if (keywords.some(keyword => query.includes(keyword))) {
      return atmosphere;
    }
  }
  return null;
}

// 使用 Google Places API 搜索餐廳
async function searchGooglePlaces(location, query, analysis) {
  try {
    // 構建搜索關鍵詞
    let searchQuery = query;
    if (analysis.cuisine) {
      searchQuery = `${analysis.cuisine} ${query}`;
    }

    // 使用 Text Search API
    const response = await axios.get('https://maps.googleapis.com/maps/api/place/textsearch/json', {
      params: {
        query: searchQuery,
        location: `${location.lat},${location.lng}`,
        radius: 5000, // 5km 範圍
        type: 'restaurant',
        key: GOOGLE_MAPS_API_KEY,
        language: 'zh-TW'
      }
    });

    if (response.data.status === 'OK') {
      return response.data.results;
    } else {
      console.error('Google Places API error:', response.data.status);
      return [];
    }
  } catch (error) {
    console.error('Google Places API request error:', error);
    return [];
  }
}

// 獲取餐廳詳細信息
async function getPlaceDetails(placeId) {
  try {
    const response = await axios.get('https://maps.googleapis.com/maps/api/place/details/json', {
      params: {
        place_id: placeId,
        fields: 'name,formatted_address,geometry,rating,user_ratings_total,price_level,types,photos,formatted_phone_number,website,opening_hours',
        key: GOOGLE_MAPS_API_KEY,
        language: 'zh-TW'
      }
    });

    if (response.data.status === 'OK') {
      return response.data.result;
    }
    return null;
  } catch (error) {
    console.error('Place Details API error:', error);
    return null;
  }
}

// 主搜索控制器
exports.searchRestaurants = async (req, res) => {
  try {
    const { query, location } = req.body;

    if (!query) {
      return res.status(400).json({ error: '搜索查詢不能為空' });
    }

    if (!location || !location.lat || !location.lng) {
      return res.status(400).json({ error: '需要提供位置信息' });
    }

    // 1. 使用 AI 分析搜索查詢
    const analysis = await analyzeSearchQuery(query);
    console.log('Search analysis:', analysis);

    // 2. 使用 Google Places API 搜索
    const places = await searchGooglePlaces(location, query, analysis);

    // 3. 獲取詳細信息並格式化結果
    const restaurants = await Promise.all(
      places.slice(0, 20).map(async (place) => {
        const details = await getPlaceDetails(place.place_id);
        
        if (!details) return null;

        // 保存或更新餐廳到數據庫
        const restaurantData = {
          placeId: place.place_id,
          name: details.name,
          address: details.formatted_address,
          location: {
            lat: details.geometry.location.lat,
            lng: details.geometry.location.lng
          },
          rating: details.rating || 0,
          userRatingsTotal: details.user_ratings_total || 0,
          priceLevel: details.price_level,
          types: details.types || [],
          phoneNumber: details.formatted_phone_number,
          website: details.website,
          openingHours: details.opening_hours ? {
            openNow: details.opening_hours.open_now,
            weekdayText: details.opening_hours.weekday_text || []
          } : null
        };

        // 如果有照片，獲取照片 URL
        if (details.photos && details.photos.length > 0) {
          restaurantData.photos = [
            `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${details.photos[0].photo_reference}&key=${GOOGLE_MAPS_API_KEY}`
          ];
        }

        // 保存到數據庫
        await Restaurant.findOneAndUpdate(
          { placeId: place.place_id },
          restaurantData,
          { upsert: true, new: true }
        );

        return {
          ...restaurantData,
          distance: place.distance || null
        };
      })
    );

    // 過濾掉 null 值
    const validRestaurants = restaurants.filter(r => r !== null);

    res.json({
      success: true,
      count: validRestaurants.length,
      restaurants: validRestaurants,
      analysis: analysis
    });

  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: '搜索失敗，請稍後再試' });
  }
};

