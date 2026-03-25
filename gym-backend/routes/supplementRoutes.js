const express = require('express');
const router = express.Router();
const supplementController = require('../controllers/supplementController');
router.get('/', supplementController.getSupplements);
router.get('/sales', supplementController.getSales);
router.post('/sale', supplementController.recordSale);
module.exports = router;
