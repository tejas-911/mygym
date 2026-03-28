const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

router.get('/stats', paymentController.getStats);
router.get('/trend/monthly', paymentController.getMonthlyTrend);
router.get('/trend/daily', paymentController.getDailyTrend);
router.get('/', paymentController.getAllPayments);
router.post('/', paymentController.createPayment);

module.exports = router;
