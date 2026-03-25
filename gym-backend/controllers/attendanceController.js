const db = require('../db');

exports.getAllAttendance = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM Attendance');
        res.json(rows);
    } catch (error) { res.status(500).json({ error: error.message }); }
};

exports.createAttendance = async (req, res) => {
    try {
        const { member_id, check_in_time, check_out_time, date } = req.body;
        const [result] = await db.query(
            'INSERT INTO Attendance (member_id, check_in_time, check_out_time, date) VALUES (?, ?, ?, ?)',
            [member_id, check_in_time, check_out_time, date]
        );
        res.status(201).json({ id: result.insertId, message: 'Attendance logged' });
    } catch (error) { res.status(500).json({ error: error.message }); }
};
