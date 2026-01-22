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
    if (!process.env.OPENAI_API_KEY) {
      console.warn('OPENAI_API_KEY is not set, using fallback analysis');
      throw new Error('OpenAI API key not configured');
    }

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

    if (!completion.choices || !completion.choices[0] || !completion.choices[0].message) {
      throw new Error('Invalid OpenAI response format');
    }

    const analysis = JSON.parse(completion.choices[0].message.content);
    return analysis;
  } catch (error) {
    console.error('OpenAI API error:', error.message);
    console.error('OpenAI error details:', error.response?.data || error);
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

    console.log('Searching Google Places with:', {
      query: searchQuery,
      location: `${location.lat},${location.lng}`,
      radius: 5000
    });

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

    console.log('Google Places API response status:', response.data.status);
    console.log('Google Places API response:', {
      status: response.data.status,
      resultsCount: response.data.results ? response.data.results.length : 0,
      errorMessage: response.data.error_message
    });

    // 處理不同的 API 狀態
    if (response.data.status === 'OK') {
      return { success: true, results: response.data.results };
    } else if (response.data.status === 'ZERO_RESULTS') {
      console.log('No results found for query:', searchQuery);
      return { success: true, results: [], message: '未找到符合條件的餐廳' };
    } else if (response.data.status === 'REQUEST_DENIED') {
      console.error('Google Places API REQUEST_DENIED:', response.data.error_message);
      throw new Error(`API 請求被拒絕: ${response.data.error_message || '請檢查 API 密鑰和權限設置'}`);
    } else if (response.data.status === 'OVER_QUERY_LIMIT') {
      console.error('Google Places API OVER_QUERY_LIMIT');
      throw new Error('API 配額已用完，請稍後再試');
    } else if (response.data.status === 'INVALID_REQUEST') {
      console.error('Google Places API INVALID_REQUEST:', response.data.error_message);
      throw new Error(`無效的請求: ${response.data.error_message || '請檢查搜索參數'}`);
    } else {
      console.error('Google Places API error:', response.data.status, response.data.error_message);
      throw new Error(`API 錯誤: ${response.data.status} - ${response.data.error_message || '未知錯誤'}`);
    }
  } catch (error) {
    console.error('Google Places API request error:', error.message);
    if (error.response) {
      console.error('API Response:', error.response.data);
    }
    throw error; // 重新拋出錯誤，讓上層處理
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
    console.log('Search request received:', {
      query: req.body.query,
      location: req.body.location,
      timestamp: new Date().toISOString()
    });

    const { query, location } = req.body;

    if (!query) {
      console.error('Search error: query is empty');
      return res.status(400).json({ error: '搜索查詢不能為空' });
    }

    if (!location || !location.lat || !location.lng) {
      console.error('Search error: location is invalid', location);
      return res.status(400).json({ error: '需要提供位置信息' });
    }

    // 檢查 API 密鑰
    if (!GOOGLE_MAPS_API_KEY) {
      console.error('GOOGLE_MAPS_API_KEY is not set');
      return res.status(500).json({ 
        error: 'Google Maps API 密鑰未配置，請聯繫管理員',
        success: false
      });
    }

    // 1. 使用 AI 分析搜索查詢
    let analysis;
    try {
      analysis = await analyzeSearchQuery(query);
      console.log('Search analysis:', analysis);
    } catch (error) {
      console.error('Analysis error, using fallback:', error);
      // 使用備用分析
      analysis = {
        cuisine: extractCuisine(query),
        atmosphere: extractAtmosphere(query),
        priceRange: null
      };
    }

    // 2. 使用 Google Places API 搜索
    let placesResult;
    try {
      placesResult = await searchGooglePlaces(location, query, analysis);
      console.log('Google Places results:', placesResult.results ? placesResult.results.length : 0, 'places found');
    } catch (error) {
      console.error('Google Places search error:', error);
      return res.status(500).json({ 
        error: `搜索失敗: ${error.message}`,
        success: false,
        analysis: analysis
      });
    }

    // 檢查是否有結果
    if (!placesResult || !placesResult.results || placesResult.results.length === 0) {
      return res.json({
        success: true,
        count: 0,
        restaurants: [],
        analysis: analysis,
        message: placesResult?.message || '未找到符合條件的餐廳，請嘗試其他搜索關鍵詞'
      });
    }

    const places = placesResult.results;

    // 3. 獲取詳細信息並格式化結果
    console.log('Processing', places.length, 'places...');
    const restaurants = await Promise.all(
      places.slice(0, 20).map(async (place, index) => {
        try {
          console.log(`Processing place ${index + 1}/${Math.min(places.length, 20)}:`, place.place_id);
          const details = await getPlaceDetails(place.place_id);
          
          if (!details) {
            console.warn('No details found for place:', place.place_id);
            return null;
          }

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
          try {
            await Restaurant.findOneAndUpdate(
              { placeId: place.place_id },
              restaurantData,
              { upsert: true, new: true }
            );
          } catch (dbError) {
            console.error('Database error for place', place.place_id, ':', dbError.message);
            // 繼續處理，即使數據庫保存失敗
          }

          return {
            ...restaurantData,
            distance: place.distance || null
          };
        } catch (placeError) {
          console.error(`Error processing place ${place.place_id}:`, placeError.message);
          console.error('Place error stack:', placeError.stack);
          return null; // 返回 null，稍後過濾掉
        }
      })
    );

    // 過濾掉 null 值
    const validRestaurants = restaurants.filter(r => r !== null);
    console.log('Valid restaurants:', validRestaurants.length);

    if (validRestaurants.length === 0) {
      return res.json({
        success: true,
        count: 0,
        restaurants: [],
        analysis: analysis,
        message: '未找到符合條件的餐廳，請嘗試其他搜索關鍵詞'
      });
    }

    res.json({
      success: true,
      count: validRestaurants.length,
      restaurants: validRestaurants,
      analysis: analysis
    });

  } catch (error) {
    console.error('Search error:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    // 返回詳細的錯誤信息（僅在開發環境）
    const errorResponse = {
      error: '搜索失敗，請稍後再試',
      success: false,
      ...(process.env.NODE_ENV !== 'production' && {
        details: error.message,
        stack: error.stack
      })
    };
    
    res.status(500).json(errorResponse);
  }
};

