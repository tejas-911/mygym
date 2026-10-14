const express = require('express');
const router = express.Router();
const ec = require('../controllers/equipmentController');

router.get('/stats', ec.getStats);
router.get('/maintenance', ec.getMaintenance);
router.get('/', ec.getEquipment);
router.post('/', ec.addEquipment);
router.post('/:id/repair', ec.repairEquipment);
router.post('/:id/send-repair', ec.sendToRepair);

module.exports = router;
