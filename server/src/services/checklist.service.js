const pool = require('../config/db');

/**
 * Fetch all checklist items for a given user.
 */
async function getUserChecklists(userId) {
  const { rows } = await pool.query(
    `SELECT 
        id, 
        name, 
        is_checked AS "isChecked", 
        category, 
        quantity, 
        priority, 
        disaster_type AS "disasterType"
     FROM custom_checklists
     WHERE user_id = $1
     ORDER BY created_at DESC`,
    [userId]
  );
  return rows;
}

/**
 * Create a new checklist item for a user.
 */
async function createChecklistItem(userId, data) {
  const { 
    name, 
    isChecked = false, 
    category, 
    quantity = 1, 
    priority = 'Medium', 
    disasterType = null 
  } = data;
  
  const { rows } = await pool.query(
    `INSERT INTO custom_checklists (user_id, name, is_checked, category, quantity, priority, disaster_type)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING 
        id, 
        name, 
        is_checked AS "isChecked", 
        category, 
        quantity, 
        priority, 
        disaster_type AS "disasterType"`,
    [userId, name, isChecked, category, quantity, priority, disasterType]
  );
  return rows[0];
}

/**
 * Delete a checklist item by ID for a specific user.
 */
async function deleteChecklistItem(userId, id) {
  const { rowCount } = await pool.query(
    `DELETE FROM custom_checklists WHERE id = $1 AND user_id = $2`,
    [id, userId]
  );
  return rowCount > 0;
}

/**
 * Update a checklist item by ID for a specific user.
 */
async function updateChecklistItem(userId, id, data) {
  const {
    name,
    isChecked,
    category,
    quantity,
    priority,
    disasterType
  } = data;

  const { rows } = await pool.query(
    `UPDATE custom_checklists
     SET
       name          = COALESCE($1, name),
       is_checked    = COALESCE($2, is_checked),
       category      = COALESCE($3, category),
       quantity      = COALESCE($4, quantity),
       priority      = COALESCE($5, priority),
       disaster_type = COALESCE($6, disaster_type),
       updated_at    = NOW()
     WHERE id = $7 AND user_id = $8
     RETURNING
       id,
       name,
       is_checked    AS "isChecked",
       category,
       quantity,
       priority,
       disaster_type AS "disasterType"`,
    [name ?? null, isChecked ?? null, category ?? null, quantity ?? null, priority ?? null, disasterType ?? null, id, userId]
  );
  return rows[0] || null;
}

module.exports = {
  getUserChecklists,
  createChecklistItem,
  deleteChecklistItem,
  updateChecklistItem
};
