const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
// const pool = require('../config/db'); // Database call disabled for mock
const { JWT_SECRET } = require('../middleware/auth.middleware');

const SALT_ROUNDS = 12;
const TOKEN_EXPIRY = '7d';

// ── Mock Database ─────────────────────────────────────────────────────────────
const mockUsers = [];

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Format a users row into the User shape the iOS app expects.
 * Includes auth_token when provided.
 */
function formatUser(row, authToken = null) {
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
    family_group_ids:        row.family_group_ids || [],
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
    const existingUser = mockUsers.find(u => u.email === emailLower);
    if (existingUser) {
      return res.status(400).json({ success: false, error: 'Email already in use.' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // Create user
    const newUser = {
      id: String(Date.now()), // Simple mock ID
      name: name.trim(),
      email: emailLower,
      password_hash: hashedPassword,
      phone: phone || null,
      profile_image_url: null,
      blood_type: null,
      medical_conditions: null,
      emergency_contact_name: null,
      emergency_contact_phone: null,
      latitude: null,
      longitude: null,
      location_updated_at: null,
      device_token: null,
      preferences: null,
      created_at: new Date().toISOString().split('.')[0] + "Z"
    };
    
    mockUsers.push(newUser);

    const token = signToken(newUser);
    res.status(201).json(formatUser(newUser, token));
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

    // Find user
    const user = mockUsers.find(u => u.email === email.toLowerCase().trim());

    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid credentials.' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Invalid credentials.' });
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
  res.status(204).send();
}

// ── GET /api/user/profile ─────────────────────────────────────────────────────

async function getProfile(req, res, next) {
  try {
    const user = mockUsers.find(u => u.id === String(req.user.id));

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found.' });
    }

    const formatted = formatUser(user);
    res.json(formatted);
  } catch (err) {
    next(err);
  }
}

// ── PUT /api/user/profile ─────────────────────────────────────────────────────

async function updateProfile(req, res, next) {
  try {
    const { 
      name, phone, profile_image_url, latitude, longitude,
      blood_type, medical_conditions, emergency_contact_name, emergency_contact_phone, device_token,
      preferences
    } = req.body;

    const userIndex = mockUsers.findIndex(u => u.id === String(req.user.id));
    
    if (userIndex === -1) {
      return res.status(404).json({ success: false, error: 'User not found.' });
    }
    
    const user = mockUsers[userIndex];
    let hasChanges = false;
    let isLocationUpdated = false;

    if (name)              { user.name = name.trim(); hasChanges = true; }
    if (phone !== undefined) { user.phone = phone || null; hasChanges = true; }
    if (profile_image_url !== undefined) { user.profile_image_url = profile_image_url || null; hasChanges = true; }
    if (blood_type !== undefined) { user.blood_type = blood_type || null; hasChanges = true; }
    if (medical_conditions !== undefined) { user.medical_conditions = medical_conditions || null; hasChanges = true; }
    if (emergency_contact_name !== undefined) { user.emergency_contact_name = emergency_contact_name || null; hasChanges = true; }
    if (emergency_contact_phone !== undefined) { user.emergency_contact_phone = emergency_contact_phone || null; hasChanges = true; }
    if (device_token !== undefined) { user.device_token = device_token || null; hasChanges = true; }
    if (preferences !== undefined) { user.preferences = preferences; hasChanges = true; }
    
    if (latitude !== undefined) { 
      user.latitude = latitude || null; 
      isLocationUpdated = true;
      hasChanges = true;
    }
    if (longitude !== undefined) { 
      user.longitude = longitude || null; 
      isLocationUpdated = true;
      hasChanges = true;
    }

    if (isLocationUpdated) {
      user.location_updated_at = new Date().toISOString();
    }

    if (!hasChanges) {
      return res.status(400).json({ success: false, error: 'No fields to update.' });
    }

    user.updated_at = new Date().toISOString();
    
    res.json(formatUser(user));
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, logout, getProfile, updateProfile };
