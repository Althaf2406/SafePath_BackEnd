const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth.middleware');
const {
  updateStatus,
  fetchStatus,
  fetchFamilyStatuses,
  triggerSOS,
  resolveSOS,
} = require('../controllers/emergency.controller');

// All emergency routes require authentication
router.use(requireAuth);

// ── Status ────────────────────────────────────────────────────────────────────
router.post('/status',                      updateStatus);
router.get('/status/:userID',               fetchStatus);
router.get('/family/:groupID/statuses',     fetchFamilyStatuses);

// ── SOS ───────────────────────────────────────────────────────────────────────
router.post('/sos',                         triggerSOS);
router.post('/sos/:sosID/resolve',          resolveSOS);  // iOS uses POST for this

module.exports = router;
