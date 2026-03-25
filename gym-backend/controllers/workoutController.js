const db = require('../db');

exports.getWorkoutPlans = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM Workout_Plan');
        res.json(rows);
    } catch (error) { res.status(500).json({ error: error.message }); }
};

exports.getExercises = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM Exercise');
        res.json(rows);
    } catch (error) { res.status(500).json({ error: error.message }); }
};

exports.assignWorkout = async (req, res) => {
    try {
        const { member_id, workout_id, trainer_id, start_date, end_date } = req.body;
        await db.query(
            'INSERT INTO Member_Workout (member_id, workout_id, trainer_id, start_date, end_date) VALUES (?, ?, ?, ?, ?)',
            [member_id, workout_id, trainer_id, start_date, end_date]
        );
        res.status(201).json({ message: 'Workout assigned' });
    } catch (error) { res.status(500).json({ error: error.message }); }
};
