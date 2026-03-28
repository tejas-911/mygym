const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/dbFeaturesController');

// ── Views ─────────────────────────────────────────────────────
router.get('/views/member-dashboard',  ctrl.getMemberDashboard);
router.get('/views/monthly-revenue',   ctrl.getMonthlyRevenue);
router.get('/views/daily-attendance',  ctrl.getDailyAttendance);
router.get('/views/equipment-health',  ctrl.getEquipmentHealth);

// ── Stored Procedures ────────────────────────────────────────
router.post('/procedures/register-member',     ctrl.callRegisterMember);
router.post('/procedures/renew-subscription',  ctrl.callRenewSubscription);
router.get('/procedures/performance-report',   ctrl.callPerformanceReport);

// ── Functions ────────────────────────────────────────────────
router.get('/functions/all',                   ctrl.getAllFunctionResults);
router.get('/functions/member-age/:id',        ctrl.getMemberAge);
router.get('/functions/subscription-status/:id', ctrl.getSubscriptionStatus);
router.get('/functions/member-revenue/:id',    ctrl.getMemberRevenue);

// ── Triggers / Audit Log ─────────────────────────────────────
router.get('/audit-log',         ctrl.getAuditLog);
router.post('/trigger-test',     ctrl.triggerTestPayment);

module.exports = router;
