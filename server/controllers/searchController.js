const axios = require('axios');
const OpenAI = require('openai');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Restaurant = require('../models/Restaurant');
const { fetchEvidenceForPlaces } = require('../services/evidenceService');

// AI Provider 配置
const AI_PROVIDER = process.env.AI_PROVIDER || 'ollama'; // 'ollama', 'openai', 或 'gemini'

// Ollama 配置
const OLLAMA_API_URL = process.env.OLLAMA_API_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama2:7b';

// OpenAI 初始化（如果使用）
const openai = AI_PROVIDER === 'openai' ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
}) : null;

// Gemini 初始化（如果使用）
const genAI = AI_PROVIDER === 'gemini' && process.env.GEMINI_API_KEY 
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

function getOpenAIModel() {
  return process.env.OPENAI_MODEL || 'gpt-4o-mini';
}

function getGeminiModel() {
  return process.env.GEMINI_MODEL || 'gemini-pro';
}

// 统一的 AI 调用函数，支持 Ollama、OpenAI 和 Gemini
async function callAI(messages, systemPrompt, responseFormat = 'json_object') {
  const provider = AI_PROVIDER.toLowerCase();
  
  if (provider === 'ollama') {
    // 构建 prompt
    let fullPrompt = systemPrompt ? `${systemPrompt}\n\n` : '';
    
    // 处理消息数组
    for (const msg of messages) {
      if (msg.role === 'system') {
        // System prompt 已经在上面处理了
      } else if (msg.role === 'user') {
        fullPrompt += `${msg.content}\n\n`;
      } else if (msg.role === 'assistant') {
        // Ollama 支持对话历史，但为了简化，这里只处理 user 消息
      }
    }
    
    // 如果要求 JSON 格式，在 prompt 中明确说明
    if (responseFormat === 'json_object') {
      fullPrompt += '\n請以 JSON 格式回覆，不要包含任何 markdown 格式或其他文字。只輸出有效的 JSON 物件。';
    }
    
    try {
      console.log(`Calling Ollama API at ${OLLAMA_API_URL} with model ${OLLAMA_MODEL}`);
      
      const response = await axios.post(`${OLLAMA_API_URL}/api/generate`, {
        model: OLLAMA_MODEL,
        prompt: fullPrompt,
        stream: false,
        options: {
          temperature: 0.85, // 提高多样性（从 0.7 提高到 0.85）
          top_p: 0.95,       // 提高多样性（从 0.9 提高到 0.95）
          num_predict: 2000, // 限制输出长度
        }
      }, {
        timeout: 60000 // 60 秒超时（Ollama 可能需要更长时间）
      });
      
      let content = response.data.response;
      
      if (!content) {
        throw new Error('Ollama returned empty response');
      }
      
      // 清理可能的 markdown 代码块
      let cleanedText = content.trim();
      if (cleanedText.startsWith('```json')) {
        cleanedText = cleanedText.replace(/^```json\s*/s, '').replace(/\s*```$/s, '');
      } else if (cleanedText.startsWith('```')) {
        cleanedText = cleanedText.replace(/^```\s*/s, '').replace(/\s*```$/s, '');
      }
      
      return {
        content: cleanedText,
        provider: 'ollama'
      };
    } catch (error) {
      console.error('Ollama API error:', error.message);
      if (error.response) {
        console.error('Ollama API response:', error.response.data);
      }
      throw error;
    }
  } else if (provider === 'gemini') {
    if (!genAI) {
      throw new Error('Gemini API key not configured. Please set GEMINI_API_KEY environment variable.');
    }
    
    const model = genAI.getGenerativeModel({ model: getGeminiModel() });
    
    // Gemini 使用不同的消息格式
    // 将 system prompt 和 user messages 合并
    let fullPrompt = systemPrompt ? `${systemPrompt}\n\n` : '';
    
    // 处理消息数组
    for (const msg of messages) {
      if (msg.role === 'system') {
        fullPrompt += `${msg.content}\n\n`;
      } else if (msg.role === 'user') {
        fullPrompt += `${msg.content}\n\n`;
      } else if (msg.role === 'assistant') {
        // Gemini 不支持 assistant 消息在 prompt 中，跳过
      }
    }
    
    // 如果要求 JSON 格式，在 prompt 中明确说明
    if (responseFormat === 'json_object') {
      fullPrompt += '\n請以 JSON 格式回覆，不要包含任何 markdown 格式或其他文字。';
    }
    
    try {
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
        generationConfig: {
          temperature: 0.85,  // 提高多样性
          topP: 0.95,        // 提高多样性
          maxOutputTokens: 2000,
        },
      });
      const response = await result.response;
      const text = response.text();
      
      // 清理可能的 markdown 代码块
      let cleanedText = text.trim();
      if (cleanedText.startsWith('```json')) {
        cleanedText = cleanedText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanedText.startsWith('```')) {
        cleanedText = cleanedText.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      return {
        content: cleanedText,
        provider: 'gemini'
      };
    } catch (error) {
      console.error('Gemini API error:', error.message);
      throw error;
    }
  } else if (provider === 'openai') {
    if (!openai) {
      throw new Error('OpenAI API key not configured. Please set OPENAI_API_KEY environment variable.');
    }
    
    // 合并 system prompt 到 messages
    const formattedMessages = [];
    if (systemPrompt) {
      formattedMessages.push({
        role: 'system',
        content: systemPrompt
      });
    }
    formattedMessages.push(...messages.filter(m => m.role !== 'system'));
    
    try {
      const completion = await openai.chat.completions.create({
        model: getOpenAIModel(),
        temperature: 0.85,  // 提高多样性
        top_p: 0.95,        // 提高多样性
        response_format: responseFormat === 'json_object' ? { type: 'json_object' } : undefined,
        messages: formattedMessages
      });
      
      const content = completion?.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error('OpenAI returned empty content');
      }
      
      return {
        content,
        provider: 'openai'
      };
    } catch (error) {
      console.error('OpenAI API error:', error.message);
      throw error;
    }
  } else {
    throw new Error(`Unsupported AI provider: ${provider}. Supported providers: 'ollama', 'openai', 'gemini'`);
  }
}

function normalizePriceLevel(priceLevel) {
  if (priceLevel === null || priceLevel === undefined) return null;
  if (typeof priceLevel === 'number') {
    if (Number.isFinite(priceLevel) && priceLevel >= 0 && priceLevel <= 4) return priceLevel;
    return null;
  }
  const s = String(priceLevel).trim().toUpperCase();
  const map = {
    PRICE_LEVEL_UNSPECIFIED: null,
    PRICE_LEVEL_FREE: 0,
    PRICE_LEVEL_INEXPENSIVE: 1,
    PRICE_LEVEL_MODERATE: 2,
    PRICE_LEVEL_EXPENSIVE: 3,
    PRICE_LEVEL_VERY_EXPENSIVE: 4
  };
  if (Object.prototype.hasOwnProperty.call(map, s)) return map[s];
  // Sometimes old style string numbers
  const n = Number(s);
  if (Number.isFinite(n) && n >= 0 && n <= 4) return n;
  return null;
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

// 检查并确保 AI 解释的多样性
function ensureDiversity(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return items;
  }

  // 检查 reason 开头的多样性
  const reasonStarters = items.map(item => {
    const reason = item?.reason || '';
    // 提取前 15 个字符作为"开头"
    return reason.substring(0, 15).trim().toLowerCase();
  });

  const uniqueStarters = new Set(reasonStarters);
  const diversityRatio = uniqueStarters.size / reasonStarters.length;

  if (diversityRatio < 0.6) {
    console.warn(`Warning: Reason diversity is low (${(diversityRatio * 100).toFixed(1)}%). Consider regenerating.`);
    console.warn('Reason starters:', Array.from(uniqueStarters).slice(0, 5));
  } else {
    console.log(`Reason diversity: ${(diversityRatio * 100).toFixed(1)}% (${uniqueStarters.size}/${reasonStarters.length} unique)`);
  }

  // 检查 highlights 的多样性（检查是否有太多重复的 highlights）
  const allHighlights = items.flatMap(item => item?.highlights || []);
  const highlightCounts = new Map();
  allHighlights.forEach(h => {
    const key = h.trim().toLowerCase().substring(0, 20);
    highlightCounts.set(key, (highlightCounts.get(key) || 0) + 1);
  });

  const repeatedHighlights = Array.from(highlightCounts.entries())
    .filter(([_, count]) => count > 2)
    .map(([key, count]) => ({ key, count }));

  if (repeatedHighlights.length > 0) {
    console.warn(`Warning: Found ${repeatedHighlights.length} frequently repeated highlights`);
    repeatedHighlights.slice(0, 3).forEach(({ key, count }) => {
      console.warn(`  - "${key}..." appears ${count} times`);
    });
  }

  return items;
}

function normText(s) {
  return String(s || '').trim();
}

function uniqStrings(arr) {
  const out = [];
  const seen = new Set();
  for (const v of Array.isArray(arr) ? arr : []) {
    const s = normText(v);
    if (!s) continue;
    const k = s.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(s);
  }
  return out;
}

function isGenericDishName(s) {
  const t = normText(s);
  if (!t) return true;
  const generic = new Set([
    '招牌菜',
    '熱門主食',
    '特色小食',
    '甜品',
    '飲品',
    '湯品',
    '點心',
    '前菜',
    '拼盤',
    '主食',
    '小食',
    '套餐',
    '飲料',
    '特色菜',
    '推薦菜'
  ]);
  if (generic.has(t)) return true;
  // Often fallback-style combos like "壽司/刺身" are not restaurant-specific.
  if (t.includes('/') || t.includes('／')) return true;
  // Too short usually means category (e.g. "火鍋") rather than a dish.
  if (t.length <= 2) return true;
  return false;
}

function pickUnique(arr, usedSet, n) {
  const out = [];
  for (const v of arr) {
    const s = normText(v);
    if (!s) continue;
    const k = s.toLowerCase();
    if (usedSet.has(k)) continue;
    usedSet.add(k);
    out.push(s);
    if (out.length >= n) break;
  }
  // If still not enough, allow reuse (but keep order).
  if (out.length < n) {
    for (const v of arr) {
      const s = normText(v);
      if (!s) continue;
      if (out.includes(s)) continue;
      out.push(s);
      if (out.length >= n) break;
    }
  }
  return out;
}

// 用證據把 suggestedDishes 變成「店家專屬」並做跨店去重，避免每家都一樣
function applyRestaurantSpecificSuggestions(items, evidenceArr, restaurantsArr, cuisineHint) {
  if (!Array.isArray(items) || items.length === 0) return items;

  const evidenceById = new Map(
    (Array.isArray(evidenceArr) ? evidenceArr : [])
      .map((e) => [e?.placeId, e])
      .filter(([k]) => k)
  );

  const restaurantById = new Map(
    (Array.isArray(restaurantsArr) ? restaurantsArr : [])
      .map((r) => [r?.placeId, r])
      .filter(([k]) => k)
  );

  const usedDishes = new Set();

  return items.map((it) => {
    const placeId = it?.placeId;
    const ev = placeId ? evidenceById.get(placeId) : null;
    const r = placeId ? restaurantById.get(placeId) : null;

    const menuItems = uniqStrings(ev?.website?.menuItems);
    const menuCandidates = uniqStrings(ev?.website?.menuCandidates);
    const candidates = uniqStrings(menuItems.concat(menuCandidates)).filter((x) => !isGenericDishName(x));

    // If we have restaurant-specific evidence, always prefer that.
    if (candidates.length > 0) {
      const chosen = pickUnique(candidates, usedDishes, 4);
      return { ...it, suggestedDishes: chosen };
    }

    // No evidence: at least remove generic buckets & de-dupe across restaurants.
    const aiDishes = uniqStrings(it?.suggestedDishes).filter((x) => !isGenericDishName(x));
    if (aiDishes.length > 0) {
      const chosen = pickUnique(aiDishes, usedDishes, 4);
      return { ...it, suggestedDishes: chosen };
    }

    // Still empty: infer from restaurant name/types so each restaurant has different-ish suggestions
    const inferred = inferFallbackDishesFromNameAndTypes(r || { placeId }, cuisineHint).filter((x) => !isGenericDishName(x));
    if (inferred.length > 0) {
      const chosen = pickUnique(inferred, usedDishes, 4);
      return { ...it, suggestedDishes: chosen };
    }

    return it;
  });
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

function inferFallbackDishesFromNameAndTypes(r, cuisine) {
  const name = normText(r?.name).toLowerCase();
  const types = (Array.isArray(r?.types) ? r.types : []).map((t) => String(t || '').toLowerCase());

  const candidates = [];
  const add = (arr) => {
    for (const x of arr) {
      const s = normText(x);
      if (s) candidates.push(s);
    }
  };

  // Simple heuristics by name keywords (zh/en)
  if (name.includes('羊肉粉') || (name.includes('羊肉') && name.includes('粉'))) add(['羊肉粉', '酸辣羊肉粉', '清湯羊肉粉']);
  if (name.includes('牛腩') && (name.includes('麵') || name.includes('面'))) add(['清湯牛腩麵', '咖喱牛腩', '牛筋腩']);
  if (name.includes('牛肉') && name.includes('粉')) add(['牛肉粉', '酸辣牛肉粉', '清湯牛肉粉']);
  if (name.includes('米粉')) add(['米粉', '湯粉', '乾撈米粉']);
  if (name.includes('ramen') || name.includes('拉麵') || name.includes('ラーメン')) add(['豚骨拉麵', '醬油拉麵', '沾麵']);
  if (name.includes('sushi') || name.includes('壽司') || name.includes('鮨')) add(['握壽司', '刺身拼盤', '卷物']);
  if (name.includes('yakitori') || name.includes('燒鳥') || name.includes('串燒')) add(['串燒拼盤', '燒雞翼', '燒牛舌']);
  if (name.includes('bbq') || name.includes('烤肉')) add(['烤肉拼盤', '五花肉', '牛舌']);
  if (name.includes('hotpot') || name.includes('火鍋') || name.includes('麻辣')) add(['麻辣湯底', '鴛鴦鍋', '手切牛肉']);
  if (name.includes('steak') || name.includes('牛排')) add(['熟成牛排', '前菜沙拉', '甜品']);
  if (name.includes('pizza') || name.includes('披薩')) add(['瑪格麗特披薩', '焗烤', '沙拉']);
  if (name.includes('cafe') || name.includes('咖啡')) add(['咖啡', '蛋糕', '輕食']);
  if (name.includes('dim sum') || name.includes('點心') || name.includes('飲茶')) add(['蝦餃', '燒賣', '腸粉']);

  // Heuristics by Google types
  if (types.includes('bar') || types.includes('pub')) add(['精釀啤酒', '下酒小食', '雞翼']);

  // Fall back to cuisine suggestions but avoid generic buckets & vary selection by seed
  const cuisineDefaults = cuisineToSuggestedDishes(cuisine).filter((x) => !isGenericDishName(x));
  add(cuisineDefaults);

  // De-dupe & pick a varied subset
  const unique = uniqStrings(candidates).filter((x) => !isGenericDishName(x));
  const seed = simpleHash(r?.placeId || r?.name || '');
  if (unique.length <= 4) return unique;

  // rotate selection based on seed so different restaurants don't always show same first 4
  const start = seed % unique.length;
  const rotated = unique.slice(start).concat(unique.slice(0, start));
  return rotated.slice(0, 4);
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
        normalizePriceLevel(r.priceLevel) !== null ? `價位：${'$'.repeat(normalizePriceLevel(r.priceLevel))}` : null,
        r.openingHours?.openNow === true ? '目前顯示營業中' : null
      ].filter(Boolean),
      // 注意：Google Places 不提供完整菜單；這裡僅給「可能適合嘗試」的方向
      suggestedDishes: preferredDishes.length
        ? preferredDishes.slice(0, 4)
        : inferFallbackDishesFromNameAndTypes(r, cuisine),
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
    // 检查是否有可用的 AI 配置
    const hasOllama = AI_PROVIDER === 'ollama' && OLLAMA_API_URL;
    const hasOpenAI = AI_PROVIDER === 'openai' && process.env.OPENAI_API_KEY;
    const hasGemini = AI_PROVIDER === 'gemini' && process.env.GEMINI_API_KEY;
    
    if (!hasOllama && !hasOpenAI && !hasGemini) {
      console.log(`No ${AI_PROVIDER} configuration found, using fallback explanation`);
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
    const evidence = compactRestaurants.map((r, index) => {
      const ev = evidenceMap.get(r.placeId);
      return {
        placeId: r.placeId,
        restaurantIndex: index, // 添加索引，让 AI 知道这是第几家，用于生成不同的表达方式
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

    let aiResponse;
    try {
      console.log(`Calling ${AI_PROVIDER.toUpperCase()} API for explanation...`);
      
      const systemPrompt = '你是餐廳推薦解說助手，要能「理解用戶意圖」後再解釋為什麼推薦。\n\n' +
        '【核心原則】每間餐廳的解釋必須獨特且多樣化，絕對不能使用相同的句式或模板。\n\n' +
        
        '【多樣性要求 - 嚴格執行】\n' +
        '1. 每家餐廳的 reason 必須使用不同的開頭和句式：\n' +
        '   - 第1家（restaurantIndex=0）：可以用「這家餐廳...」「這間店...」開頭\n' +
        '   - 第2家（restaurantIndex=1）：用「如果你想要...」「考慮到你的需求...」開頭\n' +
        '   - 第3家（restaurantIndex=2）：用「特別推薦...」「值得一試的是...」開頭\n' +
        '   - 第4家（restaurantIndex=3）：用「這間店...」「這家...」開頭\n' +
        '   - 第5家（restaurantIndex=4）：用「考慮到...」「基於你的偏好...」開頭\n' +
        '   - 第6家及以後：繼續變化，可以用「另一個選擇是...」「如果你喜歡...」「這裡的...」等\n' +
        '   每家用不同的表達方式，絕對不要重複相同的開頭。\n\n' +
        
        '2. 每家餐廳的 highlights 必須從不同角度切入，每家用不同的角度組合：\n' +
        '   - 角度1：菜式特色（如果有證據，優先使用）\n' +
        '   - 角度2：氛圍/環境/風格\n' +
        '   - 角度3：價位/性價比\n' +
        '   - 角度4：評論中的具體反饋（引用評論片段）\n' +
        '   - 角度5：營業狀態/便利性/位置\n' +
        '   - 角度6：類型匹配度/符合需求\n' +
        '   - 角度7：熱度/人氣/評價數\n' +
        '   每家至少涵蓋 3-4 個不同角度，不要重複相同角度組合。\n\n' +
        
        '3. 避免重複用詞，用不同的詞彙表達相同概念：\n' +
        '   - 評分高 → 口碑不錯 / 評價良好 / 獲得高分 / 深受好評 / 評分亮眼\n' +
        '   - 評價多 → 人氣旺 / 討論度高 / 受歡迎 / 評價豐富 / 熱門選擇\n' +
        '   - 類型匹配 → 符合你的需求 / 貼近你的偏好 / 正是你要找的 / 符合條件\n' +
        '   - 營業中 → 目前營業 / 正在營業 / 現在開門 / 可立即前往\n' +
        '   每家用不同的詞彙，避免重複。\n\n' +
        
        '4. 每家的 reason 長度和結構要有變化：\n' +
        '   - 有些用 1 句話簡潔說明（例如：第1、3、5家）\n' +
        '   - 有些用 2 句話詳細解釋（例如：第2、4、6家）\n' +
        '   - 有些先說優點再說原因\n' +
        '   - 有些先說原因再說優點\n' +
        '   - 有些用並列結構，有些用因果結構\n\n' +
        
        '5. 根據 restaurantIndex 調整表達風格：\n' +
        '   - Index 0-2：可以用較正式的語氣\n' +
        '   - Index 3-5：可以用較輕鬆的語氣\n' +
        '   - Index 6+：可以用較親切的語氣\n' +
        '   讓每家的語氣都有細微差異。\n\n' +
        
        '【證據使用】\n' +
        '你只能根據輸入的餐廳資料（名稱/地址/評分/價位/類型/營業時間等）與使用者查詢/意圖來解釋；\n' +
        '不要捏造店家真實菜單、確定的配料、裝潢細節、折扣、服務特色。\n' +
        '如果 evidence 提供了「評論片段」或「官網菜單/段落」，你可以引用它們來做更有依據的推論；\n' +
        '若沒有證據，請保持保守並標註為推測。\n\n' +
        
        '【強制要求】\n' +
        '每家餐廳的 highlights 必須包含至少 1 條「具體內容」：\n' +
        '- 優先使用 evidence.website.menuItems / evidence.website.menuCandidates 的菜名；\n' +
        '- 或引用 evidence.place.editorialSummary 的關鍵片語；\n' +
        '- 或引用 evidence.place.reviews 的一小段（不要超過 20 字）。\n' +
        '如果真的完全沒有任何具體證據，才可以用「類型/價位/是否營業」等資訊，但此時 confidence 必須是 low，且不要把評分當作主亮點。\n\n' +
        
        '【菜式/配料輸出規則（用來解決「每家都一樣」）】\n' +
        '1. suggestedDishes 必須「店家專屬」：\n' +
        '   - 若 evidence.website.menuItems 或 evidence.website.menuCandidates 有內容：請從該店清單中挑 2-4 個最貼近用戶意圖的菜名；不同餐廳之間不要重複同一組菜名。\n' +
        '   - 若沒有官網菜單候選：可用評論片段/摘要推斷；或直接從餐廳名稱中抽取明顯的菜式關鍵詞（例如：羊肉粉、牛腩麵、拉麵、壽司、燒鳥、烤肉、火鍋）作為其中 1-2 項。\n' +
        '     以上推斷必須用推測語氣，且不同餐廳不要重複同一組。\n' +
        '   - 禁止輸出過於泛用的詞（例如：招牌菜、熱門主食、特色小食、甜品、飲品、拼盤、套餐）。\n' +
        '2. suggestedIngredients 同理：\n' +
        '   - 若菜名/評論中明顯包含食材詞可提取（例如：牛肉、海鮮、芝士、豚骨、麻辣等），可列 2-4 個；\n' +
        '   - 沒有證據就留空陣列 []，不要硬編。\n\n' +
        
        '你可以給「可能適合嘗試」的菜式/配料/風格方向，但必須明確用推測語氣（例如：可能、或許、通常、建議先確認菜單）。\n\n' +
        
        '【輸出格式】\n' +
        '輸出 JSON：{summary: string, items: [{placeId: string, reason: string, highlights: string[], suggestedDishes: string[], suggestedIngredients: string[], suggestedStyle: string[], confidence: "low"|"medium"|"high", evidenceNotes: string[]}], disclaimer: string}\n' +
        '每家 reason 1-2 句話，highlights 3-5 點（必須多樣化，不能重複），文字用繁體中文。\n\n' +
        
        '【最後提醒】\n' +
        '記住：每間餐廳都是獨特的，你的解釋也必須是獨特的。絕對不要使用模板化的表達方式。\n' +
        '根據 restaurantIndex 使用不同的開頭、角度、詞彙和結構，讓每家的解釋都與眾不同。';
      
      aiResponse = await callAI(
        [
          {
            role: 'user',
            content: JSON.stringify({
              query,
              analysis,
              restaurants: compactRestaurants,
              evidence
            })
          }
        ],
        systemPrompt,
        'json_object'
      );
      
      console.log(`${AI_PROVIDER.toUpperCase()} API call successful`);
    } catch (aiErr) {
      console.error(`${AI_PROVIDER.toUpperCase()} API call failed:`, aiErr.message);
      console.error('AI error details:', aiErr.response?.data || aiErr);
      return buildFallbackExplanation(query, analysis, restaurants);
    }

    const raw = aiResponse?.content;
    if (!raw) {
      console.warn(`${AI_PROVIDER.toUpperCase()} returned empty content, using fallback`);
      return buildFallbackExplanation(query, analysis, restaurants);
    }

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (parseErr) {
      console.error(`Failed to parse ${AI_PROVIDER.toUpperCase()} response:`, parseErr.message);
      console.error('Raw response:', raw.substring(0, 200));
      return buildFallbackExplanation(query, analysis, restaurants);
    }

    if (!parsed || typeof parsed !== 'object') {
      console.warn(`${AI_PROVIDER.toUpperCase()} returned invalid format, using fallback`);
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
    
    // 检查并确保多样性
    const diverseItems = ensureDiversity(normalizedItems);
    // 用 evidence 覆寫 suggestedDishes（優先菜單證據）+ 跨餐廳去重
    const restaurantSpecificItems = applyRestaurantSpecificSuggestions(
      diverseItems,
      evidence,
      compactRestaurants,
      analysis?.cuisine || null
    );
    
    return {
      summary: parsed.summary || fallback.summary,
      items: restaurantSpecificItems,
      disclaimer:
        parsed.disclaimer ||
        '提示：Google Places 不提供完整菜單/食材資訊；「菜式/配料/風格」多為推測與常見搭配方向，實際以店家菜單與現場為準。'
    };
  } catch (e) {
    console.error('AI explanation error:', e.message);
    return buildFallbackExplanation(query, analysis, restaurants);
  }
}

// 使用 AI 分析用戶的自然語言搜索
async function analyzeSearchQuery(query) {
  try {
    // 检查是否有可用的 AI 配置
    const hasOllama = AI_PROVIDER === 'ollama' && OLLAMA_API_URL;
    const hasOpenAI = AI_PROVIDER === 'openai' && process.env.OPENAI_API_KEY;
    const hasGemini = AI_PROVIDER === 'gemini' && process.env.GEMINI_API_KEY;
    
    if (!hasOllama && !hasOpenAI && !hasGemini) {
      console.warn(`${AI_PROVIDER.toUpperCase()} is not configured, using fallback analysis`);
      throw new Error(`${AI_PROVIDER.toUpperCase()} not configured`);
    }

    const systemPrompt = "你是一個餐廳搜索助手，請『理解用戶意圖』而不是只抽關鍵字。請以 JSON 回傳以下欄位（沒有就給 null 或 []）：\n" +
      "- cuisine: 菜系（例：日式/火鍋/韓式）\n" +
      "- atmosphere: 氛圍/場合（例：約會/家庭/朋友聚會/商務）\n" +
      "- priceRange: 價格偏好（例：平價/中價位/高檔）\n" +
      "- preferredDishes: 使用者明確想吃的菜式（array，例如：麻辣鍋、壽司、牛排）\n" +
      "- ingredients: 使用者提到的食材/配料偏好（array，例如：牛肉、海鮮、蔬菜、芝士）\n" +
      "- dietary: 飲食限制/需求（array，例如：素食、清真、無麩質、低卡、無辣）\n" +
      "- style: 風格偏好（array，例如：精緻、傳統、現代、打卡、安靜）\n" +
      "- occasion: 用餐情境（例：生日/紀念日/工作餐）\n" +
      "- constraints: 其他條件（array，例如：要開到很晚、可訂位、可帶小孩）\n" +
      "只輸出 JSON 物件。";

    const aiResponse = await callAI(
      [
        {
          role: "user",
          content: query
        }
      ],
      systemPrompt,
      'json_object'
    );

    if (!aiResponse || !aiResponse.content) {
      throw new Error(`Invalid ${AI_PROVIDER.toUpperCase()} response format`);
    }

    const analysis = JSON.parse(aiResponse.content);
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
    console.error(`${AI_PROVIDER.toUpperCase()} API error:`, error.message);
    console.error('AI error details:', error.response?.data || error);
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
        price_level: normalizePriceLevel(place.priceLevel),
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
            priceLevel: normalizePriceLevel(place.price_level),
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

