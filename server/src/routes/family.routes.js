const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth.middleware');
const {
  createGroup,
  fetchGroup,
  fetchAllGroups,
  inviteMember,
  removeMember,
  updateMemberStatus,
  shareLocation,
  fetchFamilyLocations,
} = require('../controllers/family.controller');

// All family routes require authentication
router.use(requireAuth);

// ── Group ─────────────────────────────────────────────────────────────────────
router.post('/group',           createGroup);
router.get('/groups',           fetchAllGroups);
router.get('/group/:groupID',   fetchGroup);

// ── Members ───────────────────────────────────────────────────────────────────
router.post('/group/:groupID/invite',                        inviteMember);
router.delete('/group/:groupID/member/:memberID',            removeMember);
router.put('/group/:groupID/member/:memberID/status',        updateMemberStatus);

// ── Location ──────────────────────────────────────────────────────────────────
router.post('/location',                                     shareLocation);
router.get('/group/:groupID/locations',                      fetchFamilyLocations);

module.exports = router;
