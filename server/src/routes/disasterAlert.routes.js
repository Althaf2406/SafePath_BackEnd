const { Router } = require('express');
const ctrl = require('../controllers/disasterAlert.controller');

const router = Router();

router.get('/', ctrl.getAllAlerts);
router.get('/nearby', ctrl.getNearbyAlerts);
router.post('/trigger', ctrl.triggerAlert); // Push notification simulation

module.exports = router;
