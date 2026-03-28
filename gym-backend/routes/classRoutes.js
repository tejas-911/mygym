const express = require('express');
const router = express.Router();
const c = require('../controllers/classController');

router.get('/stats',    c.getStats);
router.get('/week',     c.getWeekClasses);
router.get('/upcoming', c.getUpcoming);
router.get('/',         c.getAllClasses);
router.post('/',        c.addClass);
router.put('/:id',      c.updateClass);
router.delete('/:id',   c.deleteClass);

module.exports = router;
