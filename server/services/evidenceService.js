const axios = require('axios');
const cheerio = require('cheerio');

// Simple in-memory cache (per instance). Keeps Railway costs/latency down.
const CACHE_TTL_MS = Number(process.env.EVIDENCE_CACHE_TTL_MS || 6 * 60 * 60 * 1000); // 6h
const cache = new Map(); // key -> { expiresAt, value }

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

async function fetchHtml(url, timeoutMs = 8000) {
  const resp = await axios.get(url, {
    timeout: timeoutMs,
    maxRedirects: 5,
    headers: {
      // Be transparent + reduce blocks
      'User-Agent': process.env.EVIDENCE_UA || 'OpenRiceBot/1.0 (+https://openrice.example)',
      Accept: 'text/html,application/xhtml+xml'
    }
  });
  return String(resp.data || '');
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
    description: desc,
    headings: pickTop(h, 8),
    listItems: pickTop(li, 15)
  };
}

async function fetchWebsiteEvidence(websiteUrl) {
  if (!websiteUrl) return null;
  if (process.env.ENABLE_WEBSITE_SCRAPE !== 'true') return null;

  const cacheKey = `web:${websiteUrl}`;
  const cached = cacheGet(cacheKey);
  if (cached) return cached;

  try {
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

    let menuPageItems = [];
    let menuPageSnippets = [];
    for (const link of uniqueMenuLinks) {
      try {
        const mh = await fetchHtml(link, 8000);
        const $$ = cheerio.load(mh);
        const mjson = extractJsonLd($$);
        const mitems = extractMenuItemsFromJsonLd(mjson);
        menuPageItems = menuPageItems.concat(mitems);
        const snips = extractTextSnippets($$);
        menuPageSnippets.push({ url: link, ...snips });
      } catch {
        // ignore per-page
      }
    }

    const baseSnips = extractTextSnippets($);
    const allMenuItems = pickTop(
      Array.from(new Set(menuItems.concat(menuPageItems))).filter(Boolean),
      20
    );

    const result = {
      websiteUrl,
      base: baseSnips,
      menuLinks: uniqueMenuLinks,
      menuItems: allMenuItems,
      menuPages: menuPageSnippets
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
    'id,displayName,websiteUri,types,priceLevel,rating,userRatingCount,regularOpeningHours,currentOpeningHours,reviews',
    'id,displayName,websiteUri,types,priceLevel,rating,userRatingCount,regularOpeningHours,currentOpeningHours'
  ];

  for (const mask of masks) {
    try {
      const resp = await axios.get(`https://places.googleapis.com/v1/places/${pid}`, {
        headers: { ...baseHeaders, 'X-Goog-FieldMask': mask },
        params: { languageCode: 'zh-TW' },
        timeout: 8000
      });

      const place = resp.data || {};
      const reviews = pickTop(place.reviews, 3).map((r) => ({
        rating: r.rating ?? null,
        text: cleanText(r?.text?.text || r?.originalText?.text || ''),
        publishTime: r.publishTime ?? null
      })).filter(r => r.text);

      const result = {
        placeId: pid,
        name: place.displayName?.text || null,
        websiteUri: place.websiteUri || null,
        rating: place.rating || null,
        userRatingCount: place.userRatingCount || null,
        types: place.types || [],
        priceLevel: place.priceLevel || null,
        openingNow: place.currentOpeningHours?.openNow ?? null,
        reviews
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
  const maxPlaces = Number(process.env.EVIDENCE_MAX_PLACES || 3);
  const ids = pickTop(placeIds, maxPlaces).map(normalizePlaceId);

  const out = new Map();
  // small concurrency (avoid hammering websites/APIs)
  for (const pid of ids) {
    const placeEv = await fetchPlacesEvidence(pid, googleApiKey);
    const webEv = placeEv?.websiteUri ? await fetchWebsiteEvidence(placeEv.websiteUri) : null;
    out.set(pid, {
      place: placeEv,
      website: webEv
    });
  }
  return out;
}

module.exports = {
  fetchEvidenceForPlaces,
  normalizePlaceId
};


