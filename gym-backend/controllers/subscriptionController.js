const db = require('../db');

exports.getAllSubscriptions = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT s.*, m.name as member_name, mp.plan_name 
            FROM Subscription s
            JOIN Member m ON s.member_id = m.member_id
            JOIN Membership_Plan mp ON s.plan_id = mp.plan_id
            ORDER BY s.subscription_id DESC
        `);
        res.json(rows);
    } catch (error) { res.status(500).json({ error: error.message }); }
};

exports.createSubscription = async (req, res) => {
    try {
        const { member_id, plan_id, start_date, end_date, status } = req.body;
        const [result] = await db.query(
            'INSERT INTO Subscription (member_id, plan_id, start_date, end_date, status) VALUES (?, ?, ?, ?, ?)',
            [member_id, plan_id, start_date, end_date, status || 'Active']
        );
        res.status(201).json({ id: result.insertId, message: 'Subscription created' });
    } catch (error) { res.status(500).json({ error: error.message }); }
};
