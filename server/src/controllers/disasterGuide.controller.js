const disasterGuideService = require('../services/disasterGuide.service');

/**
 * GET /api/disaster-guides
 */
async function getAllGuides(req, res, next) {
  try {
    const guides = await disasterGuideService.getAllGuides();
    res.json(guides);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAllGuides,
};
