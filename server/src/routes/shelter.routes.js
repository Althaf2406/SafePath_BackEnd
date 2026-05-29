const { Router } = require('express');
const ctrl = require('../controllers/shelter.controller');

const router = Router();

router.get('/', ctrl.getAllShelters);
router.get('/recommended', ctrl.getRecommendedShelters);
router.get('/nearby', ctrl.getNearbyShelters);
router.get('/:id', ctrl.getShelterById);
router.patch('/:id/status', ctrl.updateShelterStatus);

module.exports = router;

