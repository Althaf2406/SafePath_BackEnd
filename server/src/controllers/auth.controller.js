const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { JWT_SECRET } = require('../middleware/auth.middleware');

const SALT_ROUNDS = 12;
const TOKEN_EXPIRY = '7d';

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Format a users row into the User shape the iOS app expects.
 * Includes auth_token when provided.
 */
function formatUser(row, authToken = null) {
  return {
    id:                row.id,
    name:              row.name,
    email:             row.email,
    phone:             row.phone || null,
    profile_image_url: row.profile_image_url || null,
    created_at:        row.created_at,
    family_group_ids:  [], // populated separately when needed
    auth_token:        authToken || null,
    refresh_token:     null,
  };
}

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name },
    JWT_SECRET,
    { expiresIn: TOKEN_EXPIRY }
  );
}

// ── POST /api/auth/register ───────────────────────────────────────────────────

async function register(req, res, next) {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, error: 'name, email, and password are required.' });
    }

    // Check duplicate email
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ success: false, error: 'An account with this email already exists.' });
    }

    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

    const { rows } = await pool.query(
      `INSERT INTO users (name, email, password_hash, phone)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, phone, profile_image_url, created_at`,
      [name.trim(), email.toLowerCase().trim(), password_hash, phone || null]
    );

    const user = rows[0];
    const token = signToken(user);

    res.status(201).json(formatUser(user, token));
  } catch (err) {
    next(err);
  }
}

// ── POST /api/auth/login ──────────────────────────────────────────────────────

async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'email and password are required.' });
    }

    const { rows } = await pool.query(
      `SELECT id, name, email, phone, profile_image_url, password_hash, created_at
       FROM users WHERE email = $1`,
      [email.toLowerCase().trim()]
    );

    if (rows.length === 0) {
      return res.status(401).json({ success: false, error: 'Invalid email or password.' });
    }

    const user = rows[0];
    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      return res.status(401).json({ success: false, error: 'Invalid email or password.' });
    }

    const token = signToken(user);
    res.json(formatUser(user, token));
  } catch (err) {
    next(err);
  }
}

// ── POST /api/auth/logout ─────────────────────────────────────────────────────

async function logout(req, res) {
  // JWT is stateless — client simply discards the token.
  // Future: add token to a denylist table here.
  res.status(204).send();
}

// ── GET /api/user/profile ─────────────────────────────────────────────────────

async function getProfile(req, res, next) {
  try {
    const { rows } = await pool.query(
      `SELECT id, name, email, phone, profile_image_url, created_at
       FROM users WHERE id = $1`,
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found.' });
    }

    // Fetch all family group IDs for this user
    const groupRows = await pool.query(
      `SELECT group_id FROM family_members WHERE user_id = $1`,
      [req.user.id]
    );
    const familyGroupIds = groupRows.rows.map((r) => r.group_id);

    const formatted = formatUser(rows[0]);
    formatted.family_group_ids = familyGroupIds;

    res.json(formatted);
  } catch (err) {
    next(err);
  }
}

// ── PUT /api/user/profile ─────────────────────────────────────────────────────

async function updateProfile(req, res, next) {
  try {
    const { name, phone, profile_image_url } = req.body;

    const fields = [];
    const values = [];
    let idx = 1;

    if (name)              { fields.push(`name = $${idx++}`);              values.push(name.trim()); }
    if (phone !== undefined) { fields.push(`phone = $${idx++}`);           values.push(phone || null); }
    if (profile_image_url !== undefined) { fields.push(`profile_image_url = $${idx++}`); values.push(profile_image_url || null); }

    if (fields.length === 0) {
      return res.status(400).json({ success: false, error: 'No fields to update.' });
    }

    fields.push(`updated_at = NOW()`);
    values.push(req.user.id);

    const { rows } = await pool.query(
      `UPDATE users SET ${fields.join(', ')} WHERE id = $${idx}
       RETURNING id, name, email, phone, profile_image_url, created_at`,
      values
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found.' });
    }

    res.json(formatUser(rows[0]));
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, logout, getProfile, updateProfile };
