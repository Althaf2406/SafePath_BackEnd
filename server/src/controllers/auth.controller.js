const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { JWT_SECRET } = require('../middleware/auth.middleware');

const SALT_ROUNDS = 12;
const TOKEN_EXPIRY = '7d';

// ── Helpers ──────────────────────────────────────────────────────────────────

async function formatUser(row, authToken = null) {
  // Fetch the groups this user actually belongs to from family_members
  const { rows: groupRows } = await pool.query(
    `SELECT DISTINCT group_id FROM family_members WHERE user_id = $1`,
    [row.id]
  );
  const familyGroupIds = groupRows.map(r => String(r.group_id));

  return {
    id:                      String(row.id),
    name:                    row.name,
    email:                   row.email,
    phone:                   row.phone || null,
    profile_image_url:       row.profile_image_url || null,
    blood_type:              row.blood_type || null,
    medical_conditions:      row.medical_conditions || null,
    emergency_contact_name:  row.emergency_contact_name || null,
    emergency_contact_phone: row.emergency_contact_phone || null,
    last_latitude:           row.latitude || null,
    last_longitude:          row.longitude || null,
    location_updated_at:     row.location_updated_at || null,
    device_token:            row.device_token || null,
    preferences:             row.preferences || null,
    created_at:              row.created_at,
    family_group_ids:        familyGroupIds,
    auth_token:              authToken || null,
    refresh_token:           null,
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

    const emailLower = email.toLowerCase().trim();

    // Check if email already exists
    const checkRes = await pool.query('SELECT id FROM users WHERE email = $1', [emailLower]);
    if (checkRes.rows.length > 0) {
      return res.status(400).json({ success: false, error: 'Email already in use.' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // Create user in Postgres
    const insertRes = await pool.query(
      `INSERT INTO users (name, email, password_hash, phone)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [name.trim(), emailLower, hashedPassword, phone || null]
    );

    const newUser = insertRes.rows[0];
    const token = signToken(newUser);
    
    res.status(201).json(await formatUser(newUser, token));
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

    const userRes = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    
    if (userRes.rows.length === 0) {
      return res.status(401).json({ success: false, error: 'Invalid credentials.' });
    }

    const user = userRes.rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Invalid credentials.' });
    }
    
    const token = signToken(user);
    res.json(await formatUser(user, token));
  } catch (err) {
    next(err);
  }
}

// ── POST /api/auth/logout ─────────────────────────────────────────────────────

async function logout(req, res) {
  res.status(204).send();
}

// ── GET /api/user/profile ─────────────────────────────────────────────────────

async function getProfile(req, res, next) {
  try {
    const userRes = await pool.query('SELECT * FROM users WHERE id = $1', [req.user.id]);

    if (userRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found.' });
    }

    res.json(await formatUser(userRes.rows[0]));
  } catch (err) {
    next(err);
  }
}

// ── PUT /api/user/profile ─────────────────────────────────────────────────────

async function updateProfile(req, res, next) {
  try {
    const { 
      name, phone, profile_image_url, latitude, longitude,
      emergency_contact_name, emergency_contact_phone,
      blood_type, medical_conditions, preferences, device_token
    } = req.body;

    // First check if user exists
    const userRes = await pool.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found.' });
    }

    const updateRes = await pool.query(
      `UPDATE users 
       SET name = COALESCE($1, name),
           phone = COALESCE($2, phone),
           profile_image_url = COALESCE($3, profile_image_url),
           latitude = COALESCE($4, latitude),
           longitude = COALESCE($5, longitude),
           emergency_contact_name = COALESCE($6, emergency_contact_name),
           emergency_contact_phone = COALESCE($7, emergency_contact_phone),
           blood_type = COALESCE($8, blood_type),
           medical_conditions = COALESCE($9, medical_conditions),
           preferences = COALESCE($10, preferences),
           device_token = COALESCE($11, device_token),
           updated_at = NOW()
       WHERE id = $12
       RETURNING *`,
      [
        name, phone, profile_image_url, latitude, longitude,
        emergency_contact_name, emergency_contact_phone,
        blood_type, medical_conditions, preferences, device_token,
        req.user.id
      ]
    );

    res.json(await formatUser(updateRes.rows[0]));
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, logout, getProfile, updateProfile };
