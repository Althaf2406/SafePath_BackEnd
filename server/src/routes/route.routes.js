const { Router } = require('express');
const ctrl = require('../controllers/route.controller');

const router = Router();

router.get('/', ctrl.getEvacuationRoute);

module.exports = router;
