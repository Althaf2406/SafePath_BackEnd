const localRiskService = require('../services/localRisk.service');

function getIconForDisaster(type) {
  const t = (type || '').toLowerCase();
  if (t.includes('gempa') || t.includes('earthquake')) return 'waveform.path.ecg';
  if (t.includes('tsunami')) return 'water.waves';
  if (t.includes('banjir') || t.includes('flood') || t.includes('hujan')) return 'cloud.heavyrain';
  if (t.includes('angin') || t.includes('wind')) return 'wind';
  if (t.includes('api') || t.includes('fire')) return 'flame';
  if (t.includes('gunung') || t.includes('volcano')) return 'mountain.2';
  return 'exclamationmark.triangle';
}

exports.getLocalRiskProfile = async (req, res, next) => {
  try {
    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);

    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      return res.status(400).json({
        success: false,
        error: 'Latitude and longitude are required'
      });
    }

    // 1. Calculate risk dynamically (distance, severity, BMKG alerts)
    const profile = await localRiskService.generateRiskProfile(lat, lng);

    // 2. Map into the simple RiskProfile array expected by iOS frontend
    const riskProfiles = [];

    // Main Disaster (Dynamic Type)
    const mainType = profile.disasterType || "Gempabumi";
    riskProfiles.push({
      id: "risk-main",
      type: mainType,
      iconName: getIconForDisaster(mainType),
      level: profile.finalRisk || "Low"
    });

    // Secondary Disaster (Tsunami Potential)
    // Tsunami is returned as a boolean flag from BMKG, not as a separate disaster alert.
    if (profile.tsunamiPotential) {
      riskProfiles.push({
        id: "risk-tsunami",
        type: "Tsunami",
        iconName: getIconForDisaster("Tsunami"),
        level: "Critical"
      });
    }

    res.json({
      success: true,
      data: riskProfiles
    });

  } catch (err) {
    next(err);
  }
};