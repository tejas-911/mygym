const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');

router.get('/', attendanceController.getAllAttendance);
router.post('/', attendanceController.createAttendance);
router.post('/checkin', attendanceController.checkIn);
router.post('/checkout', attendanceController.checkOut);
router.get('/today', attendanceController.getTodayAttendance);
router.get('/stats', attendanceController.getStats);

module.exports = router;
