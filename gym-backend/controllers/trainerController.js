const db = require('../db');

exports.getAllTrainers = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM Trainer');
        res.json(rows);
    } catch (error) { res.status(500).json({ error: error.message }); }
};

exports.getTrainerById = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM Trainer WHERE trainer_id = ?', [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ message: 'Trainer not found' });
        res.json(rows[0]);
    } catch (error) { res.status(500).json({ error: error.message }); }
};

exports.createTrainer = async (req, res) => {
    try {
        const { name, specialization, phone, salary, hire_date } = req.body;
        const [result] = await db.query(
            'INSERT INTO Trainer (name, specialization, phone, salary, hire_date) VALUES (?, ?, ?, ?, ?)',
            [name, specialization, phone, salary, hire_date]
        );
        res.status(201).json({ id: result.insertId, message: 'Trainer created' });
    } catch (error) { res.status(500).json({ error: error.message }); }
};

exports.updateTrainer = async (req, res) => {
    try {
        const { name, specialization, phone, salary, hire_date } = req.body;
        await db.query(
            'UPDATE Trainer SET name=?, specialization=?, phone=?, salary=?, hire_date=? WHERE trainer_id=?',
            [name, specialization, phone, salary, hire_date, req.params.id]
        );
        res.json({ message: 'Trainer updated' });
    } catch (error) { res.status(500).json({ error: error.message }); }
};

exports.deleteTrainer = async (req, res) => {
    try {
        await db.query('DELETE FROM Trainer WHERE trainer_id = ?', [req.params.id]);
        res.json({ message: 'Trainer deleted' });
    } catch (error) { res.status(500).json({ error: error.message }); }
};
