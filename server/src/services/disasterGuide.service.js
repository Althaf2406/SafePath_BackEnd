const pool = require('../config/db');

/**
 * Fetch all disaster preparation guides from PostgreSQL.
 */
async function getAllGuides() {
  const { rows } = await pool.query(
    `SELECT 
        id, 
        disaster_type AS "disasterType", 
        title, 
        description, 
        handling_procedures AS "handlingProcedures", 
        icon_name AS "iconName" 
     FROM disaster_preparation_guides 
     ORDER BY created_at ASC`
  );
  return rows;
}

module.exports = {
  getAllGuides,
};
