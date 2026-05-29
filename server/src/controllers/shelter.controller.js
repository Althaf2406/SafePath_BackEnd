const shelterService = require('../services/shelter.service');

/**
 * GET /api/shelters
 */
async function getAllShelters(req, res, next) {
  try {
    const shelters = await shelterService.getAllShelters();
    res.json({ success: true, count: shelters.length, data: shelters });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/shelters/:id
 */
async function getShelterById(req, res, next) {
  try {
    const shelter = await shelterService.getShelterById(req.params.id);
    if (!shelter) {
      return res.status(404).json({ success: false, error: 'Shelter not found.' });
    }
    res.json({ success: true, data: shelter });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/shelters/nearby?lat=&lng=&radiusKm=
 */
async function getNearbyShelters(req, res, next) {
  try {
    const lat = parseFloat(req.query.lat);
    const lng = parseFloat(req.query.lng);
    const radiusKm = parseFloat(req.query.radiusKm) || 10;

    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({
        success: false,
        error: 'lat and lng query parameters are required and must be numbers.',
      });
    }

    const shelters = await shelterService.getNearbyShelters(lat, lng, radiusKm);
    res.json({
      success: true,
      count: shelters.length,
      userLocation: { lat, lng },
      radiusKm,
      data: shelters,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/shelters/recommended?lat=&lng=&disasterType=
 */
async function getRecommendedShelters(req, res, next) {
  try {
    const lat = parseFloat(req.query.lat);
    const lng = parseFloat(req.query.lng);
    const disasterType = req.query.disasterType || null;

    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({
        success: false,
        error: 'lat and lng query parameters are required and must be numbers.',
      });
    }

    const shelters = await shelterService.getRecommendedShelters(lat, lng, disasterType);
    res.json({
      success: true,
      count: shelters.length,
      userLocation: { lat, lng },
      disasterType,
      data: shelters,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/shelters/:id/status
 */
async function updateShelterStatus(req, res, next) {
  try {
    const { capacity } = req.body;
    const updated = await shelterService.updateShelterStatus(req.params.id, {
      capacity,
    });
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Shelter not found or no fields to update.' });
    }
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAllShelters,
  getShelterById,
  getNearbyShelters,
  getRecommendedShelters,
  updateShelterStatus
};

