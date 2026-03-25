const db = require('../db');

exports.getAllPayments = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM Payment');
        res.json(rows);
    } catch (error) { res.status(500).json({ error: error.message }); }
};

exports.createPayment = async (req, res) => {
    try {
        const { subscription_id, amount, payment_date, payment_method } = req.body;
        const [result] = await db.query(
            'INSERT INTO Payment (subscription_id, amount, payment_date, payment_method) VALUES (?, ?, ?, ?)',
            [subscription_id, amount, payment_date, payment_method]
        );
        res.status(201).json({ id: result.insertId, message: 'Payment created' });
    } catch (error) { res.status(500).json({ error: error.message }); }
};
