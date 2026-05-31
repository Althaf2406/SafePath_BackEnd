const express = require('express');
const controller = require('../controllers/localRisk.controller');

const router = express.Router();

router.get('/', controller.getLocalRiskProfile);

module.exports = router;