const axios = require('axios');
const OpenAI = require('openai');
const Restaurant = require('../models/Restaurant');
const { fetchEvidenceForPlaces } = require('../services/evidenceService');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

function getOpenAIModel() {
  return process.env.OPENAI_MODEL || 'gpt-4o-mini';
}

function simpleHash(str) {
  const s = String(str || '');
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function pickTop(arr, n) {
  return (Array.isArray(arr) ? arr : []).filter(Boolean).slice(0, n);
}

function asArrayOfStrings(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean).map(String);
  if (typeof value === 'string') {
    // 支援用頓號/逗號/空格分隔
    return value
      .split(/[、,，\n]/g)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

function cuisineToSuggestedDishes(cuisine) {
  const map = {
    '日式': ['壽司/刺身', '拉麵', '天婦羅', '燒鳥'],
    '中式': ['小菜/前菜', '招牌熱炒', '湯品', '點心'],
    '火鍋': ['招牌湯底', '手切牛/羊', '海鮮拼盤', '自製丸類/餃類'],
    '西式': ['牛排', '意大利麵', '沙拉', '甜品'],
    '韓式': ['烤肉拼盤', '泡菜鍋', '拌飯', '炸雞'],
    '泰式': ['冬陰功', '青咖喱', '炒河粉', '芒果糯米飯']
  };
  return map[cuisine] || ['招牌菜', '熱門主食', '特色小食', '甜品/飲品'];
}

function buildFallbackExplanation(query, analysis, restaurants) {
  const cuisine = analysis?.cuisine || null;
  const atmosphere = analysis?.atmosphere || null;
  const preferredDishes = asArrayOfStrings(analysis?.preferredDishes);
  const ingredients = asArrayOfStrings(analysis?.ingredients);
  const style = asArrayOfStrings(analysis?.style);
  const dietary = asArrayOfStrings(analysis?.dietary);
  const tags = [cuisine && `菜系：${cuisine}`, atmosphere && `氛圍：${atmosphere}`].filter(Boolean);

  const items = restaurants.slice(0, 20).map((r) => {
    const seed = simpleHash(r.placeId || r.name || '');
    const bits = [];
    if (cuisine) bits.push(`符合你要的「${cuisine}」方向`);
    if (atmosphere) bits.push(`更偏「${atmosphere}」取向（以類型/熱度推斷）`);
    if (preferredDishes.length) bits.push(`你提到想吃：${preferredDishes.slice(0, 3).join('、')}`);
    if (ingredients.length) bits.push(`你偏好配料：${ingredients.slice(0, 3).join('、')}`);
    if (style.length) bits.push(`你偏好風格：${style.slice(0, 3).join('、')}`);
    if (dietary.length) bits.push(`飲食需求：${dietary.slice(0, 3).join('、')}`);
    if (r.rating && r.rating >= 4.2) bits.push(`評分較高（${Number(r.rating).toFixed(1)}）`);
    if (r.userRatingsTotal && r.userRatingsTotal >= 200) bits.push(`評價數較多（${r.userRatingsTotal}）`);
    const openNowHint = r.openingHours?.openNow === true ? '而且目前顯示為營業中' : null;
    const templates = [
      () => `這家我優先放進來，因為${bits[0] || '類型與你的搜尋接近'}${openNowHint ? `，${openNowHint}` : ''}。`,
      () => `如果你想找「${query}」，這家在類型/熱度上比較貼近${openNowHint ? `，${openNowHint}` : ''}。`,
      () => `這家符合你的方向：${pickTop(bits, 2).join('；')}${openNowHint ? `；${openNowHint}` : ''}。`,
      () => `把它列進推薦的原因是：${pickTop(bits, 2).join('；')}。`
    ];
    const reason = templates[seed % templates.length]();

    return {
      placeId: r.placeId,
      reason,
      highlights: [
        cuisine ? `偏向 ${cuisine} 類型` : '餐廳類型匹配',
        preferredDishes.length ? `你想吃：${preferredDishes.slice(0, 2).join('、')}` : null,
        ingredients.length ? `配料偏好：${ingredients.slice(0, 2).join('、')}` : null,
        r.rating ? `評分：${Number(r.rating).toFixed(1)}` : null,
        r.userRatingsTotal ? `評價：${r.userRatingsTotal}` : null,
        r.priceLevel ? `價位：${'$'.repeat(r.priceLevel)}` : null,
        r.openingHours?.openNow === true ? '目前顯示營業中' : null
      ].filter(Boolean),
      // 注意：Google Places 不提供完整菜單；這裡僅給「可能適合嘗試」的方向
      suggestedDishes: preferredDishes.length ? preferredDishes.slice(0, 4) : cuisineToSuggestedDishes(cuisine),
      suggestedIngredients: ingredients.length ? ingredients.slice(0, 6) : [],
      suggestedStyle: style.length ? style.slice(0, 4) : [],
      confidence: 'low'
    };
  });

  return {
    summary: `我根據你的需求「${query}」${tags.length ? `（${tags.join('，')}）` : ''}，優先挑選附近餐廳中類型匹配、評分/熱度較高的選項，並為每家整理一個推薦理由。`,
    items,
    disclaimer: '提示：Google Places 不提供完整菜單/食材資訊；「菜式/配料/風格」多為推測與常見搭配方向，實際以店家菜單與現場為準。'
  };
}

async function generateResultsExplanation(query, analysis, restaurants) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      console.log('No OpenAI API key, using fallback explanation');
      return buildFallbackExplanation(query, analysis, restaurants);
    }

    const compactRestaurants = restaurants.slice(0, 12).map(r => ({
      placeId: r.placeId,
      name: r.name,
      address: r.address,
      rating: r.rating,
      userRatingsTotal: r.userRatingsTotal,
      priceLevel: r.priceLevel,
      types: r.types,
      openingHours: r.openingHours
    }));

    console.log('Generating explanation for', compactRestaurants.length, 'restaurants');

    // Evidence layer (reviews + website menu snippets). Default: places only; website scrape must be explicitly enabled.
    let evidenceMap = new Map();
    try {
      console.log('Fetching evidence for places...');
      evidenceMap = await fetchEvidenceForPlaces(
        compactRestaurants.map(r => r.placeId),
        GOOGLE_MAPS_API_KEY
      );
      console.log('Evidence fetched for', evidenceMap.size, 'places');
    } catch (evidenceErr) {
      console.warn('Evidence fetch failed, continuing without evidence:', evidenceErr.message);
      console.warn('Evidence error stack:', evidenceErr.stack);
      // Continue without evidence - don't break the search
    }
    const evidence = compactRestaurants.map((r) => {
      const ev = evidenceMap.get(r.placeId);
      return {
        placeId: r.placeId,
        place: ev?.place
          ? {
              websiteUri: ev.place.websiteUri,
              openingNow: ev.place.openingNow,
              primaryTypeDisplayName: ev.place.primaryTypeDisplayName,
              editorialSummary: ev.place.editorialSummary,
              attributes: {
                takeout: ev.place.takeout,
                delivery: ev.place.delivery,
                dineIn: ev.place.dineIn,
                reservable: ev.place.reservable,
                outdoorSeating: ev.place.outdoorSeating,
                liveMusic: ev.place.liveMusic,
                menuForChildren: ev.place.menuForChildren,
                servesBeer: ev.place.servesBeer,
                servesWine: ev.place.servesWine,
                servesVegetarianFood: ev.place.servesVegetarianFood
              },
              reviews: (ev.place.reviews || []).map((x) => ({
                rating: x.rating,
                text: x.text
              }))
            }
          : null,
        website: ev?.website
          ? {
              websiteUrl: ev.website.websiteUrl,
              menuItems: (ev.website.menuItems || []).slice(0, 12),
              menuCandidates: (ev.website.menuCandidates || []).slice(0, 12),
              description: ev.website.base?.description || null,
              headings: (ev.website.base?.headings || []).slice(0, 6)
            }
          : null
      };
    });

    let completion;
    try {
      console.log('Calling OpenAI API for explanation...');
      completion = await openai.chat.completions.create({
        model: getOpenAIModel(),
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content:
              '你是餐廳推薦解說助手，要能「理解用戶意圖」後再解釋為什麼推薦。' +
              '你只能根據輸入的餐廳資料（名稱/地址/評分/價位/類型/營業時間等）與使用者查詢/意圖來解釋；' +
              '不要捏造店家真實菜單、確定的配料、裝潢細節、折扣、服務特色。' +
              '如果 evidence 提供了「評論片段」或「官網菜單/段落」，你可以引用它們來做更有依據的推論；' +
              '若沒有證據，請保持保守並標註為推測。' +
              '【強制】每家餐廳的 highlights 必須包含至少 1 條「具體內容」：' +
              '優先使用 evidence.website.menuItems / evidence.website.menuCandidates 的菜名；' +
              '或引用 evidence.place.editorialSummary 的關鍵片語；' +
              '或引用 evidence.place.reviews 的一小段（不要超過 20 字）。' +
              '如果真的完全沒有任何具體證據，才可以用「類型/價位/是否營業」等資訊，但此時 confidence 必須是 low，且不要把評分當作主亮點。' +
              '你可以給「可能適合嘗試」的菜式/配料/風格方向，但必須明確用推測語氣（例如：可能、或許、通常、建議先確認菜單）。' +
              '【重要】避免模板化：每家餐廳的 reason 句式要有差異，不要全部只寫「評分高/評價多」。' +
              '每家至少涵蓋 2 個角度（從：用戶意圖匹配、可能菜式/配料、風格/氛圍、評論證據、官網菜單證據、價位、是否營業中、類型匹配、熱度）。' +
              '輸出 JSON：{summary: string, items: [{placeId: string, reason: string, highlights: string[], suggestedDishes: string[], suggestedIngredients: string[], suggestedStyle: string[], confidence: \"low\"|\"medium\"|\"high\", evidenceNotes: string[]}], disclaimer: string}。' +
              '每家 reason 1-2 句話，highlights 3-5 點（要多樣化），文字用繁體中文。'
          },
          {
            role: 'user',
            content: JSON.stringify({
              query,
              analysis,
              restaurants: compactRestaurants,
              evidence
            })
          }
        ]
      });
      console.log('OpenAI API call successful');
    } catch (openaiErr) {
      console.error('OpenAI API call failed:', openaiErr.message);
      console.error('OpenAI error details:', openaiErr.response?.data || openaiErr);
      return buildFallbackExplanation(query, analysis, restaurants);
    }

    const raw = completion?.choices?.[0]?.message?.content;
    if (!raw) {
      console.warn('OpenAI returned empty content, using fallback');
      return buildFallbackExplanation(query, analysis, restaurants);
    }

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (parseErr) {
      console.error('Failed to parse OpenAI response:', parseErr.message);
      console.error('Raw response:', raw.substring(0, 200));
      return buildFallbackExplanation(query, analysis, restaurants);
    }

    if (!parsed || typeof parsed !== 'object') {
      console.warn('OpenAI returned invalid format, using fallback');
      return buildFallbackExplanation(query, analysis, restaurants);
    }

    // 兜底：確保字段存在
    const fallback = buildFallbackExplanation(query, analysis, restaurants);
    const normalizedItems = Array.isArray(parsed.items)
      ? parsed.items.map((it) => ({
          placeId: it?.placeId,
          reason: it?.reason || null,
          highlights: Array.isArray(it?.highlights) ? it.highlights : [],
          suggestedDishes: Array.isArray(it?.suggestedDishes) ? it.suggestedDishes : [],
          suggestedIngredients: Array.isArray(it?.suggestedIngredients) ? it.suggestedIngredients : [],
          suggestedStyle: Array.isArray(it?.suggestedStyle) ? it.suggestedStyle : [],
          confidence: ['low', 'medium', 'high'].includes(it?.confidence) ? it.confidence : 'low',
          evidenceNotes: Array.isArray(it?.evidenceNotes) ? it.evidenceNotes.slice(0, 4) : []
        }))
      : fallback.items;
    return {
      summary: parsed.summary || fallback.summary,
      items: normalizedItems,
      disclaimer:
        parsed.disclaimer ||
        '提示：Google Places 不提供完整菜單/食材資訊；「菜式/配料/風格」多為推測與常見搭配方向，實際以店家菜單與現場為準。'
    };
  } catch (e) {
    console.error('AI explanation error:', e.message);
    return buildFallbackExplanation(query, analysis, restaurants);
  }
}

// 使用 OpenAI 分析用戶的自然語言搜索
async function analyzeSearchQuery(query) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      console.warn('OPENAI_API_KEY is not set, using fallback analysis');
      throw new Error('OpenAI API key not configured');
    }

    const completion = await openai.chat.completions.create({
      model: getOpenAIModel(),
      messages: [
        {
          role: "system",
          content:
            "你是一個餐廳搜索助手，請『理解用戶意圖』而不是只抽關鍵字。請以 JSON 回傳以下欄位（沒有就給 null 或 []）：\n" +
            "- cuisine: 菜系（例：日式/火鍋/韓式）\n" +
            "- atmosphere: 氛圍/場合（例：約會/家庭/朋友聚會/商務）\n" +
            "- priceRange: 價格偏好（例：平價/中價位/高檔）\n" +
            "- preferredDishes: 使用者明確想吃的菜式（array，例如：麻辣鍋、壽司、牛排）\n" +
            "- ingredients: 使用者提到的食材/配料偏好（array，例如：牛肉、海鮮、蔬菜、芝士）\n" +
            "- dietary: 飲食限制/需求（array，例如：素食、清真、無麩質、低卡、無辣）\n" +
            "- style: 風格偏好（array，例如：精緻、傳統、現代、打卡、安靜）\n" +
            "- occasion: 用餐情境（例：生日/紀念日/工作餐）\n" +
            "- constraints: 其他條件（array，例如：要開到很晚、可訂位、可帶小孩）\n" +
            "只輸出 JSON 物件。"
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
    // 正規化：確保 array 欄位是 array
    return {
      cuisine: analysis.cuisine ?? null,
      atmosphere: analysis.atmosphere ?? null,
      priceRange: analysis.priceRange ?? null,
      preferredDishes: asArrayOfStrings(analysis.preferredDishes),
      ingredients: asArrayOfStrings(analysis.ingredients),
      dietary: asArrayOfStrings(analysis.dietary),
      style: asArrayOfStrings(analysis.style),
      occasion: analysis.occasion ?? null,
      constraints: asArrayOfStrings(analysis.constraints)
    };
  } catch (error) {
    console.error('OpenAI API error:', error.message);
    console.error('OpenAI error details:', error.response?.data || error);
    // 如果 API 失敗，返回基本分析
    return {
      cuisine: extractCuisine(query),
      atmosphere: extractAtmosphere(query),
      priceRange: null,
      preferredDishes: [],
      ingredients: [],
      dietary: [],
      style: [],
      occasion: null,
      constraints: []
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

// 使用 Google Places API (New) 搜索餐廳
async function searchGooglePlaces(location, query, analysis) {
  try {
    // 構建搜索關鍵詞
    let searchQuery = query;
    if (analysis.cuisine) {
      searchQuery = `${analysis.cuisine} ${query}`;
    }

    console.log('Searching Google Places (New API) with:', {
      query: searchQuery,
      location: `${location.lat},${location.lng}`,
      radius: 5000
    });

    // 使用新的 Places API (New) - Text Search
    // 注意：新 API 需要启用 Places API (New) 而不是旧的 Places API
    const response = await axios.post(
      'https://places.googleapis.com/v1/places:searchText',
      {
        textQuery: searchQuery,
        maxResultCount: 20,
        locationBias: {
          circle: {
            center: {
              latitude: location.lat,
              longitude: location.lng
            },
            radius: 5000.0 // 5km in meters
          }
        },
        includedType: 'restaurant',
        languageCode: 'zh-TW'
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY,
          'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.priceLevel,places.types,places.photos,places.nationalPhoneNumber,places.websiteUri,places.regularOpeningHours,places.currentOpeningHours'
        }
      }
    );

    console.log('Google Places API (New) response:', {
      resultsCount: response.data.places ? response.data.places.length : 0
    });

    // 新 API 返回格式不同
    if (response.data.places && response.data.places.length > 0) {
      // 转换新 API 格式到旧格式，以便后续处理
      const convertedResults = response.data.places.map(place => {
        // 標準化 place ID：移除 "places/" 前綴（如果存在）
        let normalizedPlaceId = place.id;
        if (place.id && place.id.startsWith('places/')) {
          normalizedPlaceId = place.id.replace('places/', '');
        }
        
        return {
        place_id: normalizedPlaceId,
        name: place.displayName?.text || '',
        formatted_address: place.formattedAddress || '',
        geometry: {
          location: {
            lat: place.location?.latitude || location.lat,
            lng: place.location?.longitude || location.lng
          }
        },
        rating: place.rating || 0,
        user_ratings_total: place.userRatingCount || 0,
        price_level: place.priceLevel || null,
        types: place.types || [],
        photos: place.photos || [],
        formatted_phone_number: place.nationalPhoneNumber || null,
        website: place.websiteUri || null,
        opening_hours: place.regularOpeningHours || place.currentOpeningHours || null
      };
      });

      return { success: true, results: convertedResults };
    } else {
      console.log('No results found for query:', searchQuery);
      return { success: true, results: [], message: '未找到符合條件的餐廳' };
    }
  } catch (error) {
    console.error('Google Places API (New) request error:', error.message);
    if (error.response) {
      console.error('API Response status:', error.response.status);
      console.error('API Response data:', JSON.stringify(error.response.data, null, 2));
      
      // 处理新 API 的错误格式
      if (error.response.data?.error) {
        const apiError = error.response.data.error;
        if (apiError.message?.includes('API key not valid') || apiError.message?.includes('permission denied')) {
          throw new Error(`API 請求被拒絕: ${apiError.message || '請檢查 API 密鑰和權限設置'}`);
        } else if (apiError.message?.includes('quota') || apiError.message?.includes('limit')) {
          throw new Error('API 配額已用完，請稍後再試');
        } else {
          throw new Error(`API 錯誤: ${apiError.message || '未知錯誤'}`);
        }
      }
    }
    throw error; // 重新拋出錯誤，讓上層處理
  }
}

// 獲取餐廳詳細信息 (使用新的 Places API)
async function getPlaceDetails(placeId) {
  try {
    // 使用新的 Places API (New) - Get Place
    const response = await axios.get(
      `https://places.googleapis.com/v1/places/${placeId}`,
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY,
          'X-Goog-FieldMask': 'id,displayName,formattedAddress,location,rating,userRatingCount,priceLevel,types,photos,nationalPhoneNumber,websiteUri,regularOpeningHours,currentOpeningHours'
        },
        params: {
          languageCode: 'zh-TW'
        }
      }
    );

    if (response.data) {
      // 转换新 API 格式到旧格式
      const place = response.data;
      return {
        place_id: place.id,
        name: place.displayName?.text || '',
        formatted_address: place.formattedAddress || '',
        geometry: {
          location: {
            lat: place.location?.latitude || 0,
            lng: place.location?.longitude || 0
          }
        },
        rating: place.rating || 0,
        user_ratings_total: place.userRatingCount || 0,
        price_level: place.priceLevel || null,
        types: place.types || [],
        photos: place.photos || [],
        formatted_phone_number: place.nationalPhoneNumber || null,
        website: place.websiteUri || null,
        opening_hours: place.regularOpeningHours || place.currentOpeningHours || null
      };
    }
    return null;
  } catch (error) {
    console.error('Place Details API (New) error:', error.message);
    if (error.response) {
      console.error('API Response:', error.response.data);
    }
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

    // 3. 格式化結果（新 API 已经返回了足够的信息，不需要额外调用 getPlaceDetails）
    console.log('Processing', places.length, 'places...');
    const restaurants = await Promise.all(
      places.slice(0, 20).map(async (place, index) => {
        try {
          console.log(`Processing place ${index + 1}/${Math.min(places.length, 20)}:`, place.place_id);

          // 新 API 的 searchText 已经返回了详细信息，直接使用
          const restaurantData = {
            placeId: place.place_id,
            name: place.name || '',
            address: place.formatted_address || '',
            location: {
              lat: place.geometry.location.lat,
              lng: place.geometry.location.lng
            },
            rating: place.rating || 0,
            userRatingsTotal: place.user_ratings_total || 0,
            priceLevel: place.price_level || null,
            types: place.types || [],
            phoneNumber: place.formatted_phone_number || null,
            website: place.website || null,
            openingHours: place.opening_hours ? {
              openNow: place.opening_hours.open_now || false,
              weekdayText: place.opening_hours.weekday_text || []
            } : null
          };

          // 如果有照片，獲取照片 URL
          // 新 API 的照片格式：photos[0].name 或 photos[0].uri
          if (place.photos && place.photos.length > 0) {
            const photo = place.photos[0];
            // 新 API 使用 name 字段，格式为 "places/{place_id}/photos/{photo_id}"
            if (photo.name) {
              // 使用新的照片 API
              restaurantData.photos = [
                `https://places.googleapis.com/v1/${photo.name}/media?maxWidthPx=400&key=${GOOGLE_MAPS_API_KEY}`
              ];
            } else if (photo.uri) {
              // 如果直接提供 URI
              restaurantData.photos = [photo.uri];
            } else if (photo.photo_reference) {
              // 兼容旧格式
              restaurantData.photos = [
                `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${photo.photo_reference}&key=${GOOGLE_MAPS_API_KEY}`
              ];
            }
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

    // 4. AI 講解（可透過 explain=false 關閉）
    const shouldExplain = req.body.explain !== false;
    let explanation = null;
    let restaurantsWithReasons = validRestaurants;

    if (shouldExplain) {
      explanation = await generateResultsExplanation(query, analysis, validRestaurants);
      const reasonMap = new Map(
        (explanation.items || []).map((it) => [it.placeId, it])
      );
      restaurantsWithReasons = validRestaurants.map((r) => {
        const it = reasonMap.get(r.placeId);
        return {
          ...r,
          aiReason: it?.reason || null,
          aiHighlights: it?.highlights || null,
          aiSuggestedDishes: it?.suggestedDishes || null
          ,
          aiSuggestedIngredients: it?.suggestedIngredients || null,
          aiSuggestedStyle: it?.suggestedStyle || null,
          aiConfidence: it?.confidence || null,
          aiEvidenceNotes: it?.evidenceNotes || null
        };
      });
    }

    res.json({
      success: true,
      count: restaurantsWithReasons.length,
      restaurants: restaurantsWithReasons,
      analysis: analysis,
      explanation
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

