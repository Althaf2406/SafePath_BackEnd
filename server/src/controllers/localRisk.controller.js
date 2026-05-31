const localRiskService =
  require('../services/localRisk.service');

exports.getLocalRiskProfile =
async (req, res, next) => {

  try {

    const lat =
      Number(req.query.lat);

    const lng =
      Number(req.query.lng);

    if (
      Number.isNaN(lat) ||
      Number.isNaN(lng)
    ) {
      return res.status(400).json({
        success: false,
        error:
          'Latitude and longitude are required'
      });
    }

    const profile =
      await localRiskService
        .generateRiskProfile(
          lat,
          lng
        );

    res.json({
      success: true,
      data: profile
    });

  } catch (err) {
    next(err);
  }
};