const geolib = require('geolib');
const bmkgService = require('./bmkg.service');

/**
 * Convert static risk level into score
 */
function staticRiskToScore(risk) {
  switch (risk?.toLowerCase()) {
    case 'high':
      return 3;

    case 'medium':
      return 2;

    default:
      return 1;
  }
}

/**
 * Convert BMKG severity into score
 */
function severityToScore(severity) {
  switch (severity?.toLowerCase()) {
    case 'critical':
      return 4;

    case 'high':
      return 3;

    case 'medium':
      return 2;

    default:
      return 1;
  }
}

/**
 * Convert distance from earthquake to score
 */
function distanceToScore(distanceMeters) {

  const km = distanceMeters / 1000;

  if (km <= 50)
    return 3;

  if (km <= 100)
    return 2;

  return 1;
}

/**
 * Convert final score into risk level
 */
function scoreToRisk(score) {

  if (score >= 9)
    return 'Critical';

  if (score >= 7)
    return 'High';

  if (score >= 5)
    return 'Medium';

  return 'Low';
}

/**
 * Generate Local Risk Profile
 */
async function generateRiskProfile(
  userLat,
  userLng
) {

  const alerts =
    await bmkgService.getAllAlerts();

  if (!alerts.length) {
    return {
      finalRisk: 'Unknown',
      message: 'No BMKG alert available'
    };
  }

  const earthquake = alerts[0];

  const distance =
    geolib.getDistance(
      {
        latitude: userLat,
        longitude: userLng
      },
      {
        latitude: earthquake.latitude,
        longitude: earthquake.longitude
      }
    );

  /**
   * TEMPORARY STATIC RISK
   *
   * nanti ganti dengan PostgreSQL
   */
  const staticRisk = 'Medium';

  const staticScore =
    staticRiskToScore(
      staticRisk
    );

  const severityScore =
    severityToScore(
      earthquake.severity
    );

  const distanceScore =
    distanceToScore(
      distance
    );

  const finalScore =
    staticScore +
    severityScore +
    distanceScore;

  let finalRisk =
    scoreToRisk(
      finalScore
    );

  /**
   * Tsunami Override
   */
  if (
    earthquake.tsunamiPotential
  ) {
    finalRisk = 'Critical';
  }

  return {

    disasterType:
      earthquake.type,

    location:
      earthquake.locationName,

    staticRisk,

    earthquakeSeverity:
      earthquake.severity,

    magnitude:
      earthquake.magnitude,

    tsunamiPotential:
      earthquake.tsunamiPotential,

    depth:
      earthquake.depth,

    distanceKm:
      Number(
        (distance / 1000).toFixed(2)
      ),

    finalScore,

    finalRisk,

    recommendation:
      earthquake.instruction,

    timestamp:
      earthquake.timestamp
  };
}

module.exports = {
  generateRiskProfile
};