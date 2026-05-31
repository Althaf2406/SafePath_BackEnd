const cache = require('./cache.service');
const { normalizeEarthquake } = require('../utils/normalizeBmkgEarthquake');

const BMKG_URLS = {
  autogempa: 'https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json',
  gempaterkini: 'https://data.bmkg.go.id/DataMKG/TEWS/gempaterkini.json',
  gempadirasakan: 'https://data.bmkg.go.id/DataMKG/TEWS/gempadirasakan.json',
};

const CACHE_KEY = 'bmkg_all_alerts';
const CACHE_TTL = parseInt(process.env.BMKG_CACHE_TTL_MS) || 300_000; // 5 min

/**
 * Fetch a single BMKG endpoint and return the raw JSON body.
 */
async function fetchBmkg(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'SafePath/1.0' },
  });
  if (!res.ok) {
    console.error(`BMKG fetch failed: ${url} — ${res.status}`);
    return null;
  }
  return res.json();
}

/**
 * Extract the earthquake array from each BMKG response format.
 */
function extractQuakes(json, subType) {
  if (!json) return [];

  try {
    if (subType === 'autogempa') {
      // { Infogempa: { gempa: { ... } } }  ← single object
      const g = json?.Infogempa?.gempa;
      return g ? [g] : [];
    }
    // gempaterkini and gempadirasakan return arrays
    const arr = json?.Infogempa?.gempa;
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

/**
 * Fetch all three BMKG earthquake feeds, normalize, de-duplicate, sort.
 * @returns {Array<Object>} normalized DisasterAlert[]
 */
async function getAllAlerts() {
  const cached = cache.get(CACHE_KEY);
  if (cached) return cached;

  const [autoRes, terkiniRes, dirasakanRes] = await Promise.all([
    fetchBmkg(BMKG_URLS.autogempa),
    fetchBmkg(BMKG_URLS.gempaterkini),
    fetchBmkg(BMKG_URLS.gempadirasakan),
  ]);

  const alerts = [];
  const seen = new Set();

  const sources = [
    { data: autoRes, type: 'autogempa' },
    { data: terkiniRes, type: 'gempaterkini' },
    { data: dirasakanRes, type: 'gempadirasakan' },
  ];

  for (const { data, type } of sources) {
    const quakes = extractQuakes(data, type);
    for (const eq of quakes) {
      const normalized = normalizeEarthquake(eq, type);
      // De-duplicate by coordinate+magnitude+timestamp
      const key = `${normalized.latitude}:${normalized.longitude}:${normalized.magnitude}:${normalized.timestamp}`;
      if (!seen.has(key)) {
        seen.add(key);
        alerts.push(normalized);
      }
    }
  }

  // Sort by timestamp descending (latest first)
  alerts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  cache.set(CACHE_KEY, alerts, CACHE_TTL);
  return alerts;
}

async function getLatestEarthquake() {

  const alerts = await getAllAlerts();

  if (!alerts.length) {
    return null;
  }

  return alerts[0];
}

module.exports = { getAllAlerts, getLatestEarthquake };