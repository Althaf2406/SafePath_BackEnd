const express = require('express');
const cors = require('cors');

const disasterAlertRoutes = require('./routes/disasterAlert.routes');
const shelterRoutes = require('./routes/shelter.routes');
const weatherRoutes = require('./routes/weather.routes');
const routeRoutes = require('./routes/route.routes');
// const itemRoutes = require('./routes/item.routes');
const localRiskRoutes = require('./routes/localRisk.routes');

// Person 2 — Auth, Family & Emergency routes
const authRoutes      = require('./routes/auth.routes');
const familyRoutes    = require('./routes/family.routes');
const emergencyRoutes = require('./routes/emergency.routes');

const app = express();


// ── Middleware ───────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── Health check ────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'SafePath API', timestamp: new Date().toISOString() });
});

// ── Existing API routes ──────────────────────────────────────────────────────
app.use('/api/disaster-alert',    disasterAlertRoutes);
app.use('/api/shelters',          shelterRoutes);
app.use('/api/weather-alert',     weatherRoutes);
app.use('/api/evacuation-route',  routeRoutes);
// app.use('/api/items',          itemRoutes);
app.use('/api/local-risk-profile', localRiskRoutes);

// ── Person 2: Auth / Family / Emergency ─────────────────────────────────────
app.use('/api', authRoutes);          // /api/auth/register, /api/auth/login, /api/user/profile
app.use('/api/family', familyRoutes); // /api/family/group, /api/family/location …
app.use('/api/emergency', emergencyRoutes); // /api/emergency/status, /api/emergency/sos …

// ── 404 fallback ────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'Endpoint not found.' });
});

// ── Global error handler ────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' ? 'Internal server error.' : err.message,
  });
});

module.exports = app;
