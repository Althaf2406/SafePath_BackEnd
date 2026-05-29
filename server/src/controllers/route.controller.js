const axios = require('axios');

/**
 * GET /api/evacuation-route?originLat=&originLng=&destLat=&destLng=
 * Calculates real walking route using the public OSRM (Open Source Routing Machine) API.
 */
async function getEvacuationRoute(req, res, next) {
  try {
    const originLat = parseFloat(req.query.originLat);
    const originLng = parseFloat(req.query.originLng);
    const destLat = parseFloat(req.query.destLat);
    const destLng = parseFloat(req.query.destLng);

    if (isNaN(originLat) || isNaN(originLng) || isNaN(destLat) || isNaN(destLng)) {
      return res.status(400).json({
        success: false,
        error: 'originLat, originLng, destLat, and destLng query parameters are required and must be numbers.',
      });
    }

    // Call public OSRM walking profile endpoint
    const url = `http://router.project-osrm.org/route/v1/foot/${originLng},${originLat};${destLng},${destLat}?overview=full&geometries=geojson`;
    const response = await axios.get(url);

    if (response.data.code !== 'Ok') {
      return res.status(500).json({
        success: false,
        error: 'OSRM route generation failed.',
      });
    }

    const routeData = response.data.routes[0];
    res.json({
      success: true,
      data: {
        distanceMeters: routeData.distance,
        expectedTravelTimeSeconds: routeData.duration,
        geometry: routeData.geometry, // GeoJSON format for frontend path rendering
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getEvacuationRoute };
