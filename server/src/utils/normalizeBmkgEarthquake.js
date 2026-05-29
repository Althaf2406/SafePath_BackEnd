const { v4: uuidv4 } = require('crypto');
const { mapSeverity, recommendedAction } = require('./severityMapper');

/**
 * Parse BMKG coordinate string like "-2.45,101.23" or "2.45 LS - 101.23 BT"
 * into { latitude, longitude }.
 */
function parseCoordinates(coordStr) {
  if (!coordStr) return { latitude: 0, longitude: 0 };

  // Format A: "-2.45,101.23"
  if (coordStr.includes(',')) {
    const parts = coordStr.split(',').map((s) => parseFloat(s.trim()));
    if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      return { latitude: parts[0], longitude: parts[1] };
    }
  }

  // Format B: "2.45 LS - 101.23 BT"  (LS = Lintang Selatan = South, BT = Bujur Timur = East)
  const match = coordStr.match(
    /([\d.]+)\s*(LS|LU)\s*[-–]\s*([\d.]+)\s*(BT|BB)/i
  );
  if (match) {
    let lat = parseFloat(match[1]);
    let lng = parseFloat(match[3]);
    if (match[2].toUpperCase() === 'LS') lat = -lat; // South
    if (match[4].toUpperCase() === 'BB') lng = -lng; // West (unlikely for Indonesia)
    return { latitude: lat, longitude: lng };
  }

  return { latitude: 0, longitude: 0 };
}

/**
 * Parse BMKG DateTime string to ISO 8601.
 * BMKG uses formats like "2024-01-15T10:30:00+00:00" or "15/01/2024 10:30:00 WIB".
 */
function parseDateTime(dtStr) {
  if (!dtStr) return new Date().toISOString();
  const d = new Date(dtStr);
  if (!isNaN(d.getTime())) return d.toISOString();
  return new Date().toISOString();
}

/**
 * Check whether the tsunami string indicates potential danger.
 */
function hasTsunamiPotential(potensi) {
  if (!potensi) return false;
  const lower = potensi.toLowerCase();
  return (
    lower.includes('berpotensi tsunami') ||
    lower.includes('tsunami') && !lower.includes('tidak berpotensi')
  );
}

/**
 * Normalize a single BMKG earthquake object into SafePath DisasterAlert format.
 *
 * @param {Object} eq       BMKG earthquake data object
 * @param {string} subType  'autogempa' | 'gempaterkini' | 'gempadirasakan'
 * @returns {Object}        normalized DisasterAlert
 */
function normalizeEarthquake(eq, subType) {
  const coords = parseCoordinates(eq.Coordinates || eq.coordinates);
  const mag = parseFloat(eq.Magnitude || eq.magnitude) || 0;
  const tsunami = hasTsunamiPotential(eq.Potensi || eq.potensi || '');
  const severity = mapSeverity(mag, tsunami);

  return {
    id: `bmkg-${subType}-${coords.latitude}-${coords.longitude}-${mag}-${Date.now()}`,
    type: tsunami ? 'earthquake_tsunami' : 'earthquake',
    severity,
    magnitude: mag,
    latitude: coords.latitude,
    longitude: coords.longitude,
    locationName: eq.Wilayah || eq.wilayah || eq.Area || eq.area || 'Unknown',
    instruction: recommendedAction(severity, tsunami),
    timestamp: parseDateTime(eq.DateTime || eq.dateTime || eq.Tanggal),
    source: 'BMKG',
    sourceUrl: 'https://data.bmkg.go.id',
    tsunamiPotential: tsunami,
    depth: eq.Kedalaman || eq.kedalaman || null,
    feltDescription: eq.Dirasakan || eq.dirasakan || null,
  };
}

module.exports = { normalizeEarthquake, parseCoordinates, parseDateTime, hasTsunamiPotential };
