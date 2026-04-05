const db = require('../db');

exports.getDietPlans = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM Diet_Plan');
        res.json(rows);
    } catch (error) { res.status(500).json({ error: error.message }); }
};

exports.assignDiet = async (req, res) => {
    try {
        const { member_id, diet_id, trainer_id, start_date, end_date } = req.body;
        if (!member_id || !diet_id || !start_date || !end_date) {
            return res.status(400).json({ message: 'Member, diet, start date, and end date are required.' });
        }
        if (new Date(end_date) < new Date(start_date)) {
            return res.status(400).json({ message: 'End date cannot be before start date.' });
        }
        await db.query(
            `INSERT INTO Member_Diet (member_id, diet_id, trainer_id, start_date, end_date)
             VALUES (?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE
                trainer_id = VALUES(trainer_id),
                start_date = VALUES(start_date),
                end_date = VALUES(end_date)`,
            [member_id, diet_id, trainer_id || null, start_date, end_date]
        );
        res.status(201).json({ message: 'Diet assigned' });
    } catch (error) { res.status(500).json({ error: error.message }); }
};
