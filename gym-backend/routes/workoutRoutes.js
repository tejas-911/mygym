const express = require('express');
const router = express.Router();
const workoutController = require('../controllers/workoutController');
router.get('/plans', workoutController.getWorkoutPlans);
router.get('/plans/:id/exercises', workoutController.getWorkoutExercises);
router.get('/exercises', workoutController.getExercises);
router.post('/assign', workoutController.assignWorkout);
module.exports = router;
