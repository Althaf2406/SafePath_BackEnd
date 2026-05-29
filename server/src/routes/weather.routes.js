const { Router } = require('express');
const ctrl = require('../controllers/weather.controller');

const router = Router();

router.get('/', ctrl.getWeatherAlert);

module.exports = router;
