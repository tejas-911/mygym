const db = require('../db');

exports.getAllMembers = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM Member');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getMemberById = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM Member WHERE member_id = ?', [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ message: 'Member not found' });
        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.createMember = async (req, res) => {
    try {
        const { name, gender, phone, email, date_of_birth, join_date, status } = req.body;
        const [result] = await db.query(
            'INSERT INTO Member (name, gender, phone, email, date_of_birth, join_date, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [name, gender, phone, email, date_of_birth, join_date, status || 'Active']
        );
        res.status(201).json({ id: result.insertId, message: 'Member created' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateMember = async (req, res) => {
    try {
        const { name, gender, phone, email, date_of_birth, join_date, status } = req.body;
        await db.query(
            'UPDATE Member SET name=?, gender=?, phone=?, email=?, date_of_birth=?, join_date=?, status=? WHERE member_id=?',
            [name, gender, phone, email, date_of_birth, join_date, status, req.params.id]
        );
        res.json({ message: 'Member updated' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.deleteMember = async (req, res) => {
    try {
        await db.query('DELETE FROM Member WHERE member_id = ?', [req.params.id]);
        res.json({ message: 'Member deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
