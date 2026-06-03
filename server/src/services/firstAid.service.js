const pool = require('../config/db');

/**
 * Fetch all first aid guides from PostgreSQL.
 */
async function getAllFirstAidGuides() {
  const { rows } = await pool.query(
    `SELECT 
        id, 
        title, 
        category, 
        short_description AS "shortDescription", 
        steps, 
        icon_name AS "iconName", 
        required_kit AS "requiredKit", 
        detailed_steps AS "detailedSteps" 
     FROM first_aid_guides 
     ORDER BY created_at ASC`
  );
  return rows;
}

module.exports = {
  getAllFirstAidGuides,
};
