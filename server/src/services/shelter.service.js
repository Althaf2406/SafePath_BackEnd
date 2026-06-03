const pool = require('../config/db');
const { haversineKm } = require('../utils/haversine');

/**
 * Fetch all active shelters from PostgreSQL.
 */
async function getAllShelters() {
  return [
    {
      id: 1,
      name: "GOR Bung Tomo Surabaya",
      address: "Jl. Joyoboyo No.1, Sawunggaling, Wonokromo, Surabaya",
      latitude: -7.3071,
      longitude: 112.7358,
      capacity: 1200,
      availableCapacity: 1000,
      contact: "08123456789",
      facilities: ["water", "food", "toilet", "sleeping_area"],
      shelterType: "open_area",
      disasterTypeSupported: ["earthquake"],
      isOpenArea: true,
      buildingLevel: 1,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 2,
      name: "Balai Pemuda Surabaya",
      address: "Jl. Gubernur Suryo No.15, Genteng, Surabaya",
      latitude: -7.2619,
      longitude: 112.7487,
      capacity: 500,
      availableCapacity: 200,
      contact: "08987654321",
      facilities: ["water", "toilet", "charging"],
      shelterType: "building",
      disasterTypeSupported: ["flood"],
      isOpenArea: false,
      buildingLevel: 2,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];
}

/**
 * Fetch a single shelter by ID.
 */
async function getShelterById(id) {
  const all = await getAllShelters();
  return all.find(s => s.id == id) || null;
}

/**
 * Fetch shelters near a coordinate, within radiusKm.
 */
async function getNearbyShelters(lat, lng, radiusKm) {
  const all = await getAllShelters();
  return all
    .map((s) => ({
      ...s,
      distanceKm: Math.round(haversineKm(lat, lng, s.latitude, s.longitude) * 100) / 100,
    }))
    .filter((s) => s.distanceKm <= radiusKm)
    .sort((a, b) => a.distanceKm - b.distanceKm);
}

/**
 * Get recommended shelters based on user coordinate and active disaster type.
 * Recommendations follow specific rules:
 * - Flood: prioritize building_level >= 3, shelter_type = 'building'
 * - Earthquake: prioritize is_open_area = true, shelter_type = 'open_area'
 * - Tsunami: prioritize building_level >= 4, shelter_type = 'vertical_shelter'
 * - Unknown: return nearest
 */
async function getRecommendedShelters(lat, lng, disasterType) {
  const all = await getAllShelters();
  
  const scored = all.map((s) => {
    const distanceKm = Math.round(haversineKm(lat, lng, s.latitude, s.longitude) * 100) / 100;
    let score = 0;
    
    // Smart recommendation scoring rules
    if (disasterType) {
      const type = disasterType.toLowerCase();
      
      if (type === 'flood') {
        if (s.buildingLevel >= 3) score += 50;
        if (s.shelterType === 'building') score += 30;
        if (s.disasterTypeSupported.includes('flood')) score += 20;
      } 
      else if (type === 'earthquake') {
        if (s.isOpenArea === true) score += 50;
        if (s.shelterType === 'open_area') score += 30;
        if (s.disasterTypeSupported.includes('earthquake')) score += 20;
      }
      else if (type === 'tsunami') {
        if (s.buildingLevel >= 4) score += 50;
        if (s.shelterType === 'vertical_shelter') score += 30;
        if (s.disasterTypeSupported.includes('tsunami')) score += 20;
      }
    }
    
    return {
      ...s,
      distanceKm,
      recommendationScore: score
    };
  });
  
  // Sort primarily by recommendation score (descending), secondarily by distance (ascending)
  return scored.sort((a, b) => {
    if (b.recommendationScore !== a.recommendationScore) {
      return b.recommendationScore - a.recommendationScore;
    }
    return a.distanceKm - b.distanceKm;
  });
}

/**
 * Update shelter status and capacity.
 */
async function updateShelterStatus(id, { capacity }) {
  const fields = [];
  const values = [];
  let idx = 1;

  if (capacity !== undefined) {
    fields.push(`capacity = $${idx++}`);
    values.push(capacity);
  }

  if (fields.length === 0) return null;

  fields.push(`updated_at = NOW()`);
  values.push(id);

  const { rows } = await pool.query(
    `UPDATE shelters SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
    values
  );
  return rows[0] || null;
}

module.exports = {
  getAllShelters,
  getShelterById,
  getNearbyShelters,
  getRecommendedShelters,
  updateShelterStatus
};

