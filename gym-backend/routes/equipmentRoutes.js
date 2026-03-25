const express = require('express');
const router = express.Router();
const equipmentController = require('../controllers/equipmentController');
router.get('/', equipmentController.getEquipment);
router.get('/maintenance', equipmentController.getMaintenance);
module.exports = router;
