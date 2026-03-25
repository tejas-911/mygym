const express = require('express');
const router = express.Router();
const dietController = require('../controllers/dietController');
router.get('/plans', dietController.getDietPlans);
router.post('/assign', dietController.assignDiet);
module.exports = router;
