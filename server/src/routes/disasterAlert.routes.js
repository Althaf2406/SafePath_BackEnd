const { Router } = require('express');
const ctrl = require('../controllers/disasterAlert.controller');

const router = Router();

router.get('/', ctrl.getAllAlerts);
router.get('/nearby', ctrl.getNearbyAlerts);

module.exports = router;
