const { Router } = require('express');
const ctrl = require('../controllers/checklist.controller');
const { requireAuth } = require('../middleware/auth.middleware');

const router = Router();

// Protect all checklist routes with authentication
router.use(requireAuth);

router.get('/', ctrl.getUserChecklists);
router.post('/', ctrl.createChecklistItem);
router.delete('/:id', ctrl.deleteChecklistItem);

module.exports = router;
