const bmkgService = require('../services/bmkg.service');
const { haversineKm } = require('../utils/haversine');

/**
 * GET /api/disaster-alert
 * Returns all normalized BMKG disaster alerts sorted by latest timestamp.
 */
async function getAllAlerts(req, res, next) {
  try {
    const alerts = await bmkgService.getAllAlerts();
    res.json({
      success: true,
      count: alerts.length,
      source: 'BMKG',
      data: alerts,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/disaster-alert/nearby?lat=&lng=&radiusKm=
 * Returns disaster alerts near the given coordinate.
 */
async function getNearbyAlerts(req, res, next) {
  try {
    const lat = parseFloat(req.query.lat);
    const lng = parseFloat(req.query.lng);
    const radiusKm = parseFloat(req.query.radiusKm) || 100;

    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({
        success: false,
        error: 'lat and lng query parameters are required and must be numbers.',
      });
    }

    const allAlerts = await bmkgService.getAllAlerts();

    const nearby = allAlerts
      .map((alert) => {
        const distanceKm =
          Math.round(haversineKm(lat, lng, alert.latitude, alert.longitude) * 100) / 100;
        return {
          ...alert,
          distanceKm,
          isNearby: distanceKm <= radiusKm,
        };
      })
      .filter((a) => a.isNearby)
      .sort((a, b) => a.distanceKm - b.distanceKm);

    res.json({
      success: true,
      count: nearby.length,
      source: 'BMKG',
      userLocation: { lat, lng },
      radiusKm,
      data: nearby,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/disaster-alert/trigger
 * Simulates triggering a push notification to users.
 */
async function triggerAlert(req, res, next) {
  try {
    // In a real app, you would integrate with FCM (Firebase Cloud Messaging), APNs, or OneSignal here.
    const { title, body, type, priority, deep_link_action } = req.body;
    
    const notificationPayload = {
      id: require('crypto').randomUUID(),
      title: title || 'Flood Warning',
      body: body || 'A Flood alert has been issued in your area. Tap here to view the preparation guide and checklist.',
      type: type || 'prep_guide',
      priority: priority || 'high',
      deep_link_action: deep_link_action || 'open_prep_guide',
      is_read: false,
      timestamp: new Date().toISOString()
    };

    console.log('[PUSH NOTIFICATION SIMULATION] Sending Alert:');
    console.log(JSON.stringify(notificationPayload, null, 2));

    res.status(200).json({
      success: true,
      message: 'Push notification simulated successfully.',
      simulatedPayload: notificationPayload
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getAllAlerts, getNearbyAlerts, triggerAlert };
