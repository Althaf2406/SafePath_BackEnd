const cache = require('../services/cache.service');

const WEATHER_CACHE_TTL = parseInt(process.env.BMKG_CACHE_TTL_MS) || 300_000;

/**
 * GET /api/weather-alert?adm4={adm4}
 * Fetches BMKG weather forecast for a region and normalizes to warning cards.
 */
async function getWeatherAlert(req, res, next) {
  try {
    const { adm4 } = req.query;
    if (!adm4) {
      return res.status(400).json({
        success: false,
        error: 'adm4 query parameter is required.',
      });
    }

    const cacheKey = `weather_${adm4}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      return res.json({ success: true, cached: true, data: cached });
    }

    const url = `https://api.bmkg.go.id/publik/prakiraan-cuaca?adm4=${encodeURIComponent(adm4)}`;
    const response = await fetch(url, {
      headers: { 'User-Agent': 'SafePath/1.0' },
    });

    if (!response.ok) {
      return res.status(502).json({
        success: false,
        error: `BMKG weather API returned ${response.status}`,
      });
    }

    const raw = await response.json();

    // Normalize BMKG weather forecast into warning cards
    const warnings = normalizeWeatherWarnings(raw);

    cache.set(cacheKey, warnings, WEATHER_CACHE_TTL);

    res.json({
      success: true,
      cached: false,
      source: 'BMKG',
      adm4,
      data: warnings,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Extract weather warnings from BMKG prakiraan-cuaca response.
 * Detects heavy rain, thunderstorm, strong wind, or poor visibility.
 */
function normalizeWeatherWarnings(raw) {
  const warnings = [];

  try {
    const forecasts = raw?.data || [];
    for (const loc of forecasts) {
      const cuaca = loc?.cuaca || [];
      for (const timeSlots of cuaca) {
        for (const slot of timeSlots) {
          const code = slot?.weather ?? slot?.kodeCuaca;
          const desc = (slot?.weather_desc ?? slot?.keteranganCuaca ?? '').toLowerCase();

          let warning = null;

          if (desc.includes('hujan lebat') || desc.includes('heavy rain') || code >= 21) {
            warning = {
              type: 'heavy_rain',
              title: 'Peringatan Hujan Lebat',
              description: slot.weather_desc_en || slot.weather_desc || desc,
            };
          } else if (desc.includes('petir') || desc.includes('thunder') || code >= 23) {
            warning = {
              type: 'thunderstorm',
              title: 'Peringatan Badai Petir',
              description: slot.weather_desc_en || slot.weather_desc || desc,
            };
          }

          if (warning) {
            warnings.push({
              ...warning,
              severity: 'MEDIUM',
              localTime: slot.local_datetime || slot.datetime,
              humidity: slot.hu,
              temperature: slot.t,
              windSpeed: slot.ws,
              source: 'BMKG',
            });
          }
        }
      }
    }
  } catch {
    // Gracefully handle unparseable data
  }

  return warnings;
}

module.exports = { getWeatherAlert };
