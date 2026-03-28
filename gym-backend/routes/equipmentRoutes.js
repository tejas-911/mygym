const express = require('express');
const router = express.Router();
const equipmentController = require('../controllers/equipmentController');

router.get('/stats', equipmentController.getStats);
router.get('/maintenance', equipmentController.getMaintenance);
router.get('/', equipmentController.getEquipment);
router.post('/', equipmentController.addEquipment);

module.exports = router;
