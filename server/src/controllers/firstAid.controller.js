const firstAidService = require('../services/firstAid.service');

/**
 * GET /api/first-aid
 */
async function getAllFirstAidGuides(req, res, next) {
  try {
    const guides = await firstAidService.getAllFirstAidGuides();
    res.json(guides);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAllFirstAidGuides,
};
