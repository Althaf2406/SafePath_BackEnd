const pool = require('../config/db');

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Format an emergency_statuses row into the iOS EmergencyStatus shape.
 */
function formatStatus(row) {
  return {
    id:               row.id,
    user_id:          row.user_id,
    user_name:        row.user_name || null,
    status:           row.status,
    message:          row.message || null,
    latitude:         row.latitude || null,
    longitude:        row.longitude || null,
    is_sos:           row.is_sos,
    escalation_level: row.escalation_level,
    responder_id:     row.responder_id || null,
    responder_name:   row.responder_name || null,
    resolved_at:      row.resolved_at || null,
    updated_at:       row.updated_at,
  };
}

/**
 * Compute escalation_level from status string.
 */
function escalationFromStatus(status, isSOS = false) {
  if (isSOS || status === 'sos')         return 3; // high
  if (status === 'need_help')            return 1; // low
  if (status === 'evacuating')           return 2; // medium
  return 0;                                        // none
}

// ── POST /api/emergency/status ────────────────────────────────────────────────
// UPSERT — one row per user; updates in place.

async function updateStatus(req, res, next) {
  try {
    const { status, message, latitude, longitude } = req.body;

    const validStatuses = ['safe', 'need_help', 'evacuating', 'sos', 'unknown'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `status must be one of: ${validStatuses.join(', ')}`,
      });
    }

    const isSOS = status === 'sos';
    const escalationLevel = escalationFromStatus(status, isSOS);

    const { rows } = await pool.query(
      `INSERT INTO emergency_statuses
         (user_id, status, message, latitude, longitude, is_sos, escalation_level, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
       RETURNING *`,
      [req.user.id, status, message || null, latitude || null, longitude || null, isSOS, escalationLevel]
    );

    // Mirror status in family_members for all groups this user belongs to
    await pool.query(
      `UPDATE family_members
       SET status = $1, is_safe = $2, last_updated = NOW()
       WHERE user_id = $3`,
      [status, isSOS ? false : status === 'safe' ? true : null, req.user.id]
    );

    res.json(formatStatus(rows[0]));
  } catch (err) {
    next(err);
  }
}

// ── GET /api/emergency/status/:userID ────────────────────────────────────────

async function fetchStatus(req, res, next) {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM emergency_statuses WHERE user_id = $1',
      [req.params.userID]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'No emergency status found for this user.' });
    }

    res.json(formatStatus(rows[0]));
  } catch (err) {
    next(err);
  }
}

// ── GET /api/emergency/family/:groupID/statuses ───────────────────────────────

async function fetchFamilyStatuses(req, res, next) {
  try {
    const { rows } = await pool.query(
      `SELECT es.*, u.name as user_name
       FROM emergency_statuses es
       JOIN family_members fm ON fm.user_id = es.user_id
       JOIN users u ON es.user_id = u.id
       WHERE fm.group_id = $1
       ORDER BY es.updated_at DESC
       LIMIT 50`,
      [req.params.groupID]
    );

    res.json(rows.map(formatStatus));
  } catch (err) {
    next(err);
  }
}

// ── POST /api/emergency/sos ───────────────────────────────────────────────────

async function triggerSOS(req, res, next) {
  try {
    const { latitude, longitude, message } = req.body;

    const { rows } = await pool.query(
      `INSERT INTO emergency_statuses
         (user_id, status, message, latitude, longitude, is_sos, escalation_level, updated_at)
       VALUES ($1, 'sos', $2, $3, $4, true, 3, NOW())
       RETURNING *`,
      [req.user.id, message || 'SOS triggered — immediate assistance needed.', latitude || null, longitude || null]
    );

    // Mirror SOS in all family_members rows for this user
    await pool.query(
      `UPDATE family_members
       SET status = 'sos', is_safe = false, last_updated = NOW()
       WHERE user_id = $1`,
      [req.user.id]
    );

    res.status(201).json(formatStatus(rows[0]));
  } catch (err) {
    next(err);
  }
}

// ── POST /api/emergency/sos/:sosID/resolve ────────────────────────────────────
// iOS sends this as POST (per APIEndpoint.swift method mapping)

async function resolveSOS(req, res, next) {
  try {
    const { rows } = await pool.query(
      `UPDATE emergency_statuses
       SET is_sos           = false,
           status           = 'safe',
           escalation_level = 0,
           resolved_at      = NOW(),
           responder_id     = $1,
           responder_name   = $2,
           updated_at       = NOW()
       WHERE id = $3
       RETURNING *`,
      [req.user.id, req.user.name, req.params.sosID]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'SOS record not found.' });
    }

    // Update family_members status back to safe
    await pool.query(
      `UPDATE family_members
       SET status = 'safe', is_safe = true, last_updated = NOW()
       WHERE user_id = $1`,
      [rows[0].user_id]
    );

    res.json(formatStatus(rows[0]));
  } catch (err) {
    next(err);
  }
}

module.exports = {
  updateStatus,
  fetchStatus,
  fetchFamilyStatuses,
  triggerSOS,
  resolveSOS,
};
