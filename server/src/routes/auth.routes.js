const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth.middleware');
const {
  register,
  login,
  logout,
  getProfile,
  updateProfile,
} = require('../controllers/auth.controller');

// ── Public ────────────────────────────────────────────────────────────────────
router.post('/auth/register', register);
router.post('/auth/login',    login);

// ── Protected ─────────────────────────────────────────────────────────────────
router.post('/auth/logout',   requireAuth, logout);
router.get('/user/profile',   requireAuth, getProfile);
router.put('/user/profile',   requireAuth, updateProfile);

module.exports = router;
