const { Router } = require('express');
const ctrl = require('../controllers/disasterGuide.controller');

const router = Router();

router.get('/', ctrl.getAllGuides);

module.exports = router;
