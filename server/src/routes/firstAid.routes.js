const { Router } = require('express');
const ctrl = require('../controllers/firstAid.controller');

const router = Router();

router.get('/', ctrl.getAllFirstAidGuides);

module.exports = router;
