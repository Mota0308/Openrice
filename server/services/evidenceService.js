const axios = require('axios');
const cheerio = require('cheerio');
const { createWorker } = require('tesseract.js');

// Simple in-memory cache (per instance). Keeps Railway costs/latency down.
const CACHE_TTL_MS = Number(process.env.EVIDENCE_CACHE_TTL_MS || 6 * 60 * 60 * 1000); // 6h
const cache = new Map(); // key -> { expiresAt, value }

const RESPECT_ROBOTS = (process.env.EVIDENCE_RESPECT_ROBOTS || 'true') === 'true';
const MIN_DELAY_MS = Number(process.env.EVIDENCE_MIN_DELAY_MS || 1200); // per host
const MAX_HTML_BYTES = Number(process.env.EVIDENCE_MAX_HTML_BYTES || 1_000_000);
const ALLOWED_DOMAINS = (process.env.EVIDENCE_ALLOWED_DOMAINS || '')
  .split(',')
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);
const BLOCKED_DOMAINS = (process.env.EVIDENCE_BLOCKED_DOMAINS || '')
  .split(',')
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

const hostLastFetchAt = new Map(); // host -> ts

function cacheGet(key) {
  const hit = cache.get(key);
  if (!hit) return null;
  if (Date.now() > hit.expiresAt) {
    cache.delete(key);
    return null;
  }
  return hit.value;
}

function cacheSet(key, value, ttlMs = CACHE_TTL_MS) {
  cache.set(key, { expiresAt: Date.now() + ttlMs, value });
}

function normalizePlaceId(placeId) {
  if (!placeId) return placeId;
  return String(placeId).startsWith('places/') ? String(placeId).replace('places/', '') : String(placeId);
}

function getHost(url) {
  try {
    return new URL(url).host.toLowerCase();
  } catch {
    return '';
  }
}

function hostMatchesList(host, list) {
  return list.some((d) => host === d || host.endsWith(`.${d}`));
}

function isHostAllowed(host) {
  if (!host) return false;
  if (BLOCKED_DOMAINS.length && hostMatchesList(host, BLOCKED_DOMAINS)) return false;
  if (ALLOWED_DOMAINS.length) return hostMatchesList(host, ALLOWED_DOMAINS);
  return true;
}

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function rateLimitHost(url) {
  const host = getHost(url);
  if (!host) return;
  const last = hostLastFetchAt.get(host) || 0;
  const wait = last + MIN_DELAY_MS - Date.now();
  if (wait > 0) await sleep(wait);
  hostLastFetchAt.set(host, Date.now());
}

function pickTop(arr, n) {
  return (Array.isArray(arr) ? arr : []).filter(Boolean).slice(0, n);
}

function cleanText(s) {
  return String(s || '')
    .replace(/\s+/g, ' ')
    .replace(/\u00A0/g, ' ')
    .trim();
}

function looksLikeMenuLink(href) {
  if (!href) return false;
  const h = href.toLowerCase();
  return (
    h.includes('menu') ||
    h.includes('菜單') ||
    h.includes('menu=') ||
    h.includes('meals') ||
    h.includes('food') ||
    h.includes('dinner') ||
    h.includes('lunch')
  );
}

function absoluteUrl(base, href) {
  try {
    return new URL(href, base).toString();
  } catch {
    return null;
  }
}

function parseRobotsTxt(txt) {
  const lines = String(txt || '')
    .split('\n')
    .map((l) => l.split('#')[0].trim())
    .filter(Boolean);

  const groups = [];
  let current = null;
  for (const line of lines) {
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim().toLowerCase();
    const value = line.slice(idx + 1).trim();
    if (key === 'user-agent') {
      const ua = value.toLowerCase();
      if (!current || current.hasRules) {
        current = { agents: [], allow: [], disallow: [], hasRules: false };
        groups.push(current);
      }
      current.agents.push(ua);
    } else if ((key === 'allow' || key === 'disallow') && current) {
      current.hasRules = true;
      if (value) current[key].push(value);
      else if (key === 'disallow') current.disallow.push('/'); // Disallow: (empty) = allow all per spec-ish; but keep safe? We'll not do this.
    }
  }
  return groups;
}

function isPathAllowedByRobots(pathname, rules) {
  const allow = rules.allow || [];
  const disallow = rules.disallow || [];
  // Longest match wins
  let best = { type: 'allow', len: 0 };
  for (const p of allow) {
    if (p === '/' || pathname.startsWith(p)) {
      if (p.length > best.len) best = { type: 'allow', len: p.length };
    }
  }
  for (const p of disallow) {
    if (!p) continue;
    if (p === '/' || pathname.startsWith(p)) {
      if (p.length > best.len) best = { type: 'disallow', len: p.length };
    }
  }
  return best.type !== 'disallow';
}

async function getRobotsRulesForUrl(url) {
  if (!RESPECT_ROBOTS) return null;
  let u;
  try {
    u = new URL(url);
  } catch {
    return null;
  }
  const host = u.host.toLowerCase();
  const cacheKey = `robots:${host}`;
  const cached = cacheGet(cacheKey);
  if (cached !== null) return cached; // can be null

  const robotsUrl = `${u.protocol}//${u.host}/robots.txt`;
  try {
    await rateLimitHost(robotsUrl);
    const resp = await axios.get(robotsUrl, {
      timeout: 4000, // 方案 4: 优化超时，从 6000ms 减少到 4000ms
      maxRedirects: 3,
      responseType: 'text',
      maxContentLength: 200_000,
      headers: {
        'User-Agent': process.env.EVIDENCE_UA || 'OpenRiceBot/1.0 (+contact: admin@openrice.local)',
        Accept: 'text/plain,*/*'
      }
    });
    const groups = parseRobotsTxt(resp.data);
    // choose best group: our UA token, else '*'
    const ua = (process.env.EVIDENCE_ROBOTS_UA || 'openricebot').toLowerCase();
    let group =
      groups.find((g) => g.agents.some((a) => a !== '*' && ua.includes(a))) ||
      groups.find((g) => g.agents.includes('*')) ||
      null;

    const rules = group ? { allow: group.allow, disallow: group.disallow } : null;
    cacheSet(cacheKey, rules, 12 * 60 * 60 * 1000); // 12h
    return rules;
  } catch {
    cacheSet(cacheKey, null, 12 * 60 * 60 * 1000);
    return null;
  }
}

// 方案 4: 优化网站抓取超时，默认从 8000ms 减少到 5000ms
async function fetchHtml(url, timeoutMs = 5000) {
  const host = getHost(url);
  if (!isHostAllowed(host)) {
    throw new Error(`Host not allowed for scraping: ${host}`);
  }

  const rules = await getRobotsRulesForUrl(url);
  if (rules) {
    const u = new URL(url);
    if (!isPathAllowedByRobots(u.pathname || '/', rules)) {
      throw new Error(`Blocked by robots.txt: ${u.pathname}`);
    }
  }

  await rateLimitHost(url);
  const resp = await axios.get(url, {
    timeout: timeoutMs,
    maxRedirects: 5,
    responseType: 'text',
    maxContentLength: MAX_HTML_BYTES,
    maxBodyLength: MAX_HTML_BYTES,
    headers: {
      // Be transparent + reduce blocks (overrideable)
      'User-Agent': process.env.EVIDENCE_UA || 'OpenRiceBot/1.0 (+contact: admin@openrice.local)',
      'Accept-Language': 'zh-TW,zh;q=0.9,en;q=0.6',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
    }
  });
  const contentType = String(resp.headers?.['content-type'] || '').toLowerCase();
  if (contentType && !contentType.includes('text/html') && !contentType.includes('application/xhtml')) {
    throw new Error(`Unsupported content-type: ${contentType}`);
  }
  const html = String(resp.data || '');
  if (!html || html.length < 50) throw new Error('Empty/too short HTML');
  return html;
}

function extractJsonLd($) {
  const out = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    const raw = $(el).text();
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      out.push(parsed);
    } catch {
      // ignore
    }
  });
  return out;
}

function flattenJsonLd(node, acc = []) {
  if (!node) return acc;
  if (Array.isArray(node)) {
    node.forEach((x) => flattenJsonLd(x, acc));
    return acc;
  }
  if (typeof node === 'object') {
    acc.push(node);
    Object.values(node).forEach((v) => flattenJsonLd(v, acc));
  }
  return acc;
}

function extractMenuItemsFromJsonLd(jsonlds) {
  const flat = flattenJsonLd(jsonlds, []);
  const names = [];
  for (const obj of flat) {
    const t = obj['@type'];
    if (!t) continue;
    const type = Array.isArray(t) ? t.join(',') : String(t);
    // Common schema.org types: Menu, MenuSection, MenuItem
    if (type.includes('MenuItem')) {
      if (obj.name) names.push(cleanText(obj.name));
    }
    if (type.includes('MenuSection') && obj.hasMenuItem) {
      const items = Array.isArray(obj.hasMenuItem) ? obj.hasMenuItem : [obj.hasMenuItem];
      for (const it of items) {
        if (it?.name) names.push(cleanText(it.name));
      }
    }
    if (type.includes('Menu') && obj.hasMenuSection) {
      const sections = Array.isArray(obj.hasMenuSection) ? obj.hasMenuSection : [obj.hasMenuSection];
      for (const s of sections) {
        if (s?.name) names.push(cleanText(s.name));
      }
    }
  }
  // Dedup keep order
  const seen = new Set();
  const dedup = [];
  for (const n of names) {
    if (!n) continue;
    const key = n.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    dedup.push(n);
  }
  return dedup;
}

function extractTextSnippets($) {
  const title = cleanText($('title').first().text());
  const desc = cleanText($('meta[name="description"]').attr('content'));
  const ogDesc = cleanText($('meta[property="og:description"]').attr('content'));
  const h = [];
  $('h1,h2,h3').each((_, el) => {
    const t = cleanText($(el).text());
    if (t) h.push(t);
  });
  const li = [];
  $('li').each((_, el) => {
    const t = cleanText($(el).text());
    // avoid overly long list items
    if (t && t.length <= 80) li.push(t);
  });
  return {
    title,
    description: desc || ogDesc,
    headings: pickTop(h, 8),
    listItems: pickTop(li, 15)
  };
}

function isProbablyDishName(t) {
  if (!t) return false;
  const s = cleanText(t);
  if (s.length < 2 || s.length > 32) return false;
  // avoid generic UI words
  const bad = ['首頁', '關於', '聯絡', '預約', '訂位', '電話', '地址', '營業', '隱私', '條款', 'cookie', 'login', 'sign'];
  if (bad.some((b) => s.toLowerCase().includes(b))) return false;
  // require some letters / CJK
  if (!/[A-Za-z\u4e00-\u9fff]/.test(s)) return false;
  return true;
}

function isValidDishName(name) {
  if (!name || name.length < 2 || name.length > 30) return false;
  
  // 排除非菜品词汇
  const excludeWords = [
    '餐廳', '服務', '環境', '價格', '味道', '推薦', '不錯', '很好', '好吃', '一般', '普通',
    'restaurant', 'service', 'price', 'taste', 'good', 'nice', 'ok', 'average',
    '老闆', '店員', '服務員', '老闆娘', 'staff', 'owner', 'waiter'
  ];
  
  const lower = name.toLowerCase();
  if (excludeWords.some(w => lower.includes(w))) return false;
  
  // 必须包含中文字符或常见菜品关键词
  return /[\u4e00-\u9fff]/.test(name) || 
         /(ramen|sushi|hotpot|bbq|steak|pizza|pasta|noodle|rice|soup)/i.test(name);
}

// 方案 C: 从评论文本中提取菜品提及
function extractDishesFromReviews(reviews) {
  if (!Array.isArray(reviews) || reviews.length === 0) return [];
  
  const dishMentions = new Map(); // dishName -> count
  
  // 常见菜品提取模式
  const dishPatterns = [
    // 模式1: "吃了/點了/試了/推薦/必點/招牌 XXX"
    /(?:吃了|點了|試了|推薦|必點|招牌|特色|必試|必食|必叫)(.{1,15}?)(?:，|。|$|，|！|!)/g,
    // 模式2: "XXX拉麵/壽司/火鍋/燒肉/牛排"
    /(.{2,12}?)(?:拉麵|壽司|火鍋|燒肉|牛排|pizza|pasta|飯|麵|湯|雞|魚|牛|豬|羊|蝦|蟹)/g,
    // 模式3: "推薦/必試/招牌 XXX"
    /(?:推薦|必試|招牌|特色|必食|必叫)(.{2,15}?)(?:，|。|$|，|！|!)/g,
    // 模式4: "XXX 不錯/好吃/推薦"
    /(.{2,15}?)(?:不錯|好吃|推薦|必點|招牌|特色)(?:，|。|$)/g
  ];
  
  for (const review of reviews) {
    const text = review.text || '';
    if (!text || text.length < 10) continue;
    
    // 提取明确的菜品提及
    for (const pattern of dishPatterns) {
      const matches = Array.from(text.matchAll(pattern));
      for (const match of matches) {
        const dishName = cleanText(match[1] || match[0]);
        if (isValidDishName(dishName)) {
          dishMentions.set(dishName, (dishMentions.get(dishName) || 0) + 1);
        }
      }
    }
    
    // 提取价格格式的菜品：XXX $XX 或 XXX HK$XX
    const priceMatches = Array.from(text.matchAll(/(.{2,20}?)\s*(HK\$|\$)\s*\d+/g));
    for (const match of priceMatches) {
      const dishName = cleanText(match[1]);
      if (isValidDishName(dishName)) {
        dishMentions.set(dishName, (dishMentions.get(dishName) || 0) + 1);
      }
    }
    
    // 提取常见菜品关键词附近的文本
    const dishKeywords = [
      '拉麵', '壽司', '火鍋', '燒肉', '牛排', 'pizza', 'pasta', 
      '燒鵝', '叉燒', '點心', '燒賣', '蝦餃', '腸粉', '牛腩', '羊肉'
    ];
    for (const keyword of dishKeywords) {
      const keywordRegex = new RegExp(`(.{0,10}?)${keyword}(.{0,10}?)?`, 'gi');
      const matches = Array.from(text.matchAll(keywordRegex));
      for (const match of matches) {
        const fullText = (match[1] || '') + keyword + (match[2] || '');
        const dishName = cleanText(fullText);
        if (isValidDishName(dishName) && dishName.length <= 20) {
          dishMentions.set(dishName, (dishMentions.get(dishName) || 0) + 1);
        }
      }
    }
  }
  
  // 按提及次数排序，返回最常被提到的菜品
  return Array.from(dishMentions.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15) // 返回前 15 个最常提到的菜品
    .map(([name]) => name)
    .filter(Boolean);
}

function extractMenuCandidates($) {
  const out = [];
  // 1) price-like rows: "XXX HK$88" / "$88"
  $('body')
    .text()
    .split('\n')
    .map((x) => cleanText(x))
    .filter((x) => x.length > 0 && x.length <= 80)
    .forEach((line) => {
      if (!/(HK\$|\$)\s?\d{2,4}/i.test(line)) return;
      // take left part as dish name
      const name = cleanText(line.replace(/(HK\$|\$)\s?\d{2,4}.*/i, ''));
      if (isProbablyDishName(name)) out.push(name);
    });

  // 2) common menu containers
  $('[class*="menu"],[id*="menu"],[class*="dish"],[class*="item"],[class*="food"]').each((_, el) => {
    const t = cleanText($(el).text());
    if (isProbablyDishName(t)) out.push(t);
  });

  // 3) list items as fallback (already filtered in snippets, but dish-like)
  $('li').each((_, el) => {
    const t = cleanText($(el).text());
    if (isProbablyDishName(t)) out.push(t);
  });

  const seen = new Set();
  const dedup = [];
  for (const n of out) {
    const k = n.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    dedup.push(n);
    if (dedup.length >= 30) break;
  }
  return dedup;
}

// 方案 B: 从餐牌图片提取菜单（OCR）
async function extractMenuFromImages($, baseUrl) {
  if (process.env.ENABLE_MENU_OCR !== 'true') return [];
  
  const menuImageUrls = [];
  
  // 1. 查找所有可能是菜单的图片
  $('img[src]').each((_, el) => {
    const src = $(el).attr('src');
    const alt = $(el).attr('alt') || '';
    const title = $(el).attr('title') || '';
    const parentText = $(el).parent().text().toLowerCase();
    const className = $(el).attr('class') || '';
    const id = $(el).attr('id') || '';
    
    // 判断是否可能是菜单图片
    const menuKeywords = ['menu', '菜單', '餐牌', 'メニュー', 'menu-', '-menu', 'dish', 'food'];
    const hasMenuKeyword = 
      menuKeywords.some(k => 
        alt.toLowerCase().includes(k) || 
        title.toLowerCase().includes(k) ||
        src.toLowerCase().includes(k) ||
        className.toLowerCase().includes(k) ||
        id.toLowerCase().includes(k) ||
        parentText.includes(k)
      );
    
    if (hasMenuKeyword) {
      const absUrl = absoluteUrl(baseUrl, src);
      if (absUrl && (absUrl.endsWith('.jpg') || absUrl.endsWith('.jpeg') || 
                     absUrl.endsWith('.png') || absUrl.endsWith('.webp'))) {
        menuImageUrls.push(absUrl);
      }
    }
  });
  
  // 2. 对每张菜单图片进行 OCR（最多处理 3 张，避免太慢）
  const menuItems = [];
  const maxImages = Number(process.env.OCR_MAX_IMAGES || 3);
  const ocrTimeout = Number(process.env.OCR_TIMEOUT_MS || 30000); // 默认 30 秒超时
  
  for (const imgUrl of menuImageUrls.slice(0, maxImages)) {
    try {
      console.log(`Performing OCR on menu image: ${imgUrl}`);
      
      // 使用 Promise.race 实现超时
      const ocrPromise = (async () => {
        const worker = await createWorker('chi_sim+eng'); // 简体中文 + 英文
        try {
          const { data: { text } } = await worker.recognize(imgUrl);
          return text;
        } finally {
          await worker.terminate();
        }
      })();
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('OCR timeout')), ocrTimeout)
      );
      
      const text = await Promise.race([ocrPromise, timeoutPromise]);
      
      if (text && text.length > 10) {
        const dishes = extractDishNamesFromOCRText(text);
        menuItems.push(...dishes);
        console.log(`Extracted ${dishes.length} dishes from menu image`);
      }
    } catch (error) {
      console.warn(`OCR failed for menu image ${imgUrl}:`, error.message);
      // 继续处理其他图片，不阻塞
    }
  }
  
  // 去重
  const seen = new Set();
  return menuItems.filter(item => {
    const key = item.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// 从 OCR 文本中提取菜品名称
function extractDishNamesFromOCRText(text) {
  const dishes = [];
  const lines = text.split('\n').map(l => cleanText(l)).filter(l => l.length > 0);
  
  for (const line of lines) {
    // 匹配价格格式：菜品名 $XX 或 HK$XX
    const priceMatch = line.match(/^(.+?)\s*(HK\$|\$|¥|元)\s*\d+/i);
    if (priceMatch) {
      const dishName = cleanText(priceMatch[1]);
      if (isValidDishName(dishName)) {
        dishes.push(dishName);
      }
    }
    
    // 匹配常见菜品关键词
    const dishKeywords = [
      '拉麵', '壽司', '火鍋', '燒肉', '牛排', 'pizza', 'pasta',
      '燒鵝', '叉燒', '點心', '燒賣', '蝦餃', '腸粉', '牛腩', '羊肉',
      '飯', '麵', '湯', '雞', '魚', '牛', '豬', '羊', '蝦', '蟹'
    ];
    
    for (const keyword of dishKeywords) {
      if (line.includes(keyword) && line.length <= 30) {
        const dishName = cleanText(line);
        if (isValidDishName(dishName)) {
          dishes.push(dishName);
          break; // 每行只匹配一个关键词
        }
      }
    }
  }
  
  return dishes.slice(0, 20); // 最多返回 20 个
}

async function fetchWebsiteEvidence(websiteUrl) {
  if (!websiteUrl) return null;
  if (process.env.ENABLE_WEBSITE_SCRAPE !== 'true') return null;

  const cacheKey = `web:${websiteUrl}`;
  const cached = cacheGet(cacheKey);
  if (cached) return cached;

  try {
    const host = getHost(websiteUrl);
    if (!isHostAllowed(host)) {
      cacheSet(cacheKey, null, 6 * 60 * 60 * 1000);
      return null;
    }

    const html = await fetchHtml(websiteUrl);
    const $ = cheerio.load(html);

    const jsonlds = extractJsonLd($);
    const menuItems = extractMenuItemsFromJsonLd(jsonlds);

    // Find up to 2 menu-like links and fetch them
    const menuLinks = [];
    $('a[href]').each((_, el) => {
      const href = $(el).attr('href');
      if (!looksLikeMenuLink(href)) return;
      const abs = absoluteUrl(websiteUrl, href);
      if (!abs) return;
      menuLinks.push(abs);
    });

    const uniqueMenuLinks = [];
    const seen = new Set();
    for (const u of menuLinks) {
      if (seen.has(u)) continue;
      seen.add(u);
      uniqueMenuLinks.push(u);
      if (uniqueMenuLinks.length >= 2) break;
    }

    // If no explicit menu links, try common paths
    if (uniqueMenuLinks.length === 0) {
      const common = ['/menu', '/menus', '/food', '/餐牌', '/菜單', '/メニュー'];
      for (const p of common) {
        const candidate = absoluteUrl(websiteUrl, p);
        if (!candidate) continue;
        uniqueMenuLinks.push(candidate);
        if (uniqueMenuLinks.length >= 2) break;
      }
    }

    let menuPageItems = [];
    let menuPageSnippets = [];
    let menuCandidates = [];
    for (const link of uniqueMenuLinks) {
      try {
        const mh = await fetchHtml(link, 8000);
        const $$ = cheerio.load(mh);
        const mjson = extractJsonLd($$);
        const mitems = extractMenuItemsFromJsonLd(mjson);
        menuPageItems = menuPageItems.concat(mitems);
        const snips = extractTextSnippets($$);
        menuPageSnippets.push({ url: link, ...snips });
        menuCandidates = menuCandidates.concat(extractMenuCandidates($$));
      } catch {
        // ignore per-page
      }
    }

    const baseSnips = extractTextSnippets($);
    
    // 方案 B: 从餐牌图片提取菜单（OCR）
    const menuImageItems = await extractMenuFromImages($, websiteUrl);
    
    const allMenuItems = pickTop(
      Array.from(new Set(menuItems.concat(menuPageItems).concat(menuImageItems))).filter(Boolean),
      25
    );
    const allCandidates = pickTop(Array.from(new Set(menuCandidates)).filter(Boolean), 20);

    const result = {
      websiteUrl,
      base: baseSnips,
      menuLinks: uniqueMenuLinks,
      menuItems: allMenuItems,
      menuCandidates: allCandidates,
      menuPages: menuPageSnippets,
      menuImageItems: menuImageItems // 新增：从图片 OCR 提取的菜品
    };
    cacheSet(cacheKey, result);
    return result;
  } catch {
    cacheSet(cacheKey, null, 30 * 60 * 1000); // negative cache 30m
    return null;
  }
}

async function fetchPlacesEvidence(placeId, googleApiKey) {
  if (!googleApiKey) return null;
  const pid = normalizePlaceId(placeId);
  const cacheKey = `places:${pid}`;
  const cached = cacheGet(cacheKey);
  if (cached) return cached;

  const baseHeaders = {
    'Content-Type': 'application/json',
    'X-Goog-Api-Key': googleApiKey
  };

  // Try with reviews; if field mask rejected, fallback to without.
  const masks = [
    // rich mask (may fail if some fields not enabled for project)
    'id,displayName,websiteUri,types,primaryType,primaryTypeDisplayName,priceLevel,rating,userRatingCount,regularOpeningHours,currentOpeningHours,editorialSummary,reviews,takeout,delivery,dineIn,reservable,servesBeer,servesWine,servesVegetarianFood,outdoorSeating,liveMusic,menuForChildren',
    'id,displayName,websiteUri,types,priceLevel,rating,userRatingCount,regularOpeningHours,currentOpeningHours,reviews',
    'id,displayName,websiteUri,types,priceLevel,rating,userRatingCount,regularOpeningHours,currentOpeningHours'
  ];

  for (const mask of masks) {
    try {
      // 方案 4: 优化超时设置，从 8000ms 减少到 5000ms，加快响应速度
      const timeout = Number(process.env.PLACES_EVIDENCE_TIMEOUT_MS || 5000);
      const resp = await axios.get(`https://places.googleapis.com/v1/places/${pid}`, {
        headers: { ...baseHeaders, 'X-Goog-FieldMask': mask },
        params: { languageCode: 'zh-TW' },
        timeout: timeout
      });

      const place = resp.data || {};
      const reviews = pickTop(place.reviews, 5).map((r) => ({
        rating: r.rating ?? null,
        text: cleanText(r?.text?.text || r?.originalText?.text || ''),
        publishTime: r.publishTime ?? null
      })).filter(r => r.text);

      // 方案 C: 从评论中提取菜品
      const dishesFromReviews = extractDishesFromReviews(reviews);

      const result = {
        placeId: pid,
        name: place.displayName?.text || null,
        websiteUri: place.websiteUri || null,
        primaryType: place.primaryType || null,
        primaryTypeDisplayName: place.primaryTypeDisplayName?.text || null,
        editorialSummary: place.editorialSummary?.text || null,
        rating: place.rating || null,
        userRatingCount: place.userRatingCount || null,
        types: place.types || [],
        priceLevel: place.priceLevel || null,
        openingNow: place.currentOpeningHours?.openNow ?? null,
        // boolean attributes (if available)
        takeout: place.takeout ?? null,
        delivery: place.delivery ?? null,
        dineIn: place.dineIn ?? null,
        reservable: place.reservable ?? null,
        outdoorSeating: place.outdoorSeating ?? null,
        liveMusic: place.liveMusic ?? null,
        menuForChildren: place.menuForChildren ?? null,
        servesBeer: place.servesBeer ?? null,
        servesWine: place.servesWine ?? null,
        servesVegetarianFood: place.servesVegetarianFood ?? null,
        reviews,
        dishesFromReviews // 新增：从评论提取的菜品
      };

      cacheSet(cacheKey, result);
      return result;
    } catch (e) {
      // try next mask
      continue;
    }
  }

  cacheSet(cacheKey, null, 30 * 60 * 1000);
  return null;
}

async function fetchEvidenceForPlaces(placeIds, googleApiKey) {
  try {
    const maxPlaces = Number(process.env.EVIDENCE_MAX_PLACES || 3);
    const ids = pickTop(placeIds, maxPlaces).map(normalizePlaceId);

    const out = new Map();
    
    // 方案 1: 并行化证据获取（而不是串行）
    // 这样可以同时获取多个餐厅的证据，大幅减少总时间
    const evidencePromises = ids.map(async (pid) => {
      try {
        // 并行获取 Places 证据
        const placeEv = await fetchPlacesEvidence(pid, googleApiKey);
        let webEv = null;
        
        if (placeEv?.websiteUri) {
          try {
            // 网站证据获取也并行，但设置超时避免阻塞太久
            const websiteTimeout = Number(process.env.WEBSITE_EVIDENCE_TIMEOUT_MS || 5000);
            webEv = await Promise.race([
              fetchWebsiteEvidence(placeEv.websiteUri),
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Website fetch timeout')), websiteTimeout)
              )
            ]);
          } catch (webErr) {
            // 网站证据获取失败不影响整体流程
            if (webErr.message !== 'Website fetch timeout') {
              console.warn(`Website evidence fetch failed for ${pid}:`, webErr.message);
            }
            // Continue without website evidence
          }
        }
        
        return { pid, place: placeEv, website: webEv };
      } catch (placeErr) {
        console.warn(`Places evidence fetch failed for ${pid}:`, placeErr.message);
        return { pid, place: null, website: null };
      }
    });
    
    // 等待所有证据获取完成（并行执行）
    const results = await Promise.all(evidencePromises);
    
    // 构建结果 Map
    results.forEach(({ pid, place, website }) => {
      out.set(pid, { place, website });
    });
    
    return out;
  } catch (err) {
    console.error('fetchEvidenceForPlaces error:', err.message);
    // Return empty map on error - don't break the search
    return new Map();
  }
}

module.exports = {
  fetchEvidenceForPlaces,
  normalizePlaceId
};


