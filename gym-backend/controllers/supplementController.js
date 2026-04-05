const db = require('../db');

exports.getSupplements = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM Supplement');
        res.json(rows);
    } catch (error) { res.status(500).json({ error: error.message }); }
};

exports.getSales = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM Supplement_Sale');
        res.json(rows);
    } catch (error) { res.status(500).json({ error: error.message }); }
};

exports.recordSale = async (req, res) => {
    try {
        const { member_id, supplement_id, quantity, sale_date, payment_method, total_amount } = req.body;
        if (!member_id || !supplement_id || !quantity || !sale_date) {
            return res.status(400).json({ error: 'Member, supplement, quantity, and sale date are required.' });
        }
        if (Number(quantity) <= 0) {
            return res.status(400).json({ error: 'Quantity must be at least 1.' });
        }
        
        // Start transaction
        const connection = await db.getConnection();
        await connection.beginTransaction();

        try {
            const [[supplement]] = await connection.query(
                'SELECT stock_quantity, price FROM Supplement WHERE supplement_id = ?',
                [supplement_id]
            );

            if (!supplement) {
                throw new Error('Selected supplement was not found.');
            }

            if (Number(supplement.stock_quantity) < Number(quantity)) {
                throw new Error(`Only ${supplement.stock_quantity} unit(s) available in stock.`);
            }

            const computedTotal = Number(total_amount) > 0
                ? Number(total_amount)
                : Number(supplement.price) * Number(quantity);

            await connection.query(
                'INSERT INTO Supplement_Sale (member_id, supplement_id, quantity, sale_date, total_amount) VALUES (?, ?, ?, ?, ?)',
                [member_id, supplement_id, quantity, sale_date, computedTotal]
            );

            // Record transaction in Payment DB (dynamic payment_method)
            await connection.query(
                'INSERT INTO Payment (subscription_id, amount, payment_date, payment_method) VALUES (?, ?, ?, ?)',
                [null, computedTotal, sale_date, payment_method || 'Cash']
            );

            await connection.commit();
            res.status(201).json({ message: 'Sale recorded and stock updated' });
        } catch (err) {
            await connection.rollback();
            throw err;
        } finally {
            connection.release();
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.restockSupplement = async (req, res) => {
    try {
        const { id } = req.params;
        const { quantity } = req.body;

        if (!quantity || Number(quantity) <= 0) {
            return res.status(400).json({ error: 'Restock quantity must be greater than zero.' });
        }

        const [result] = await db.query(
            'UPDATE Supplement SET stock_quantity = stock_quantity + ? WHERE supplement_id = ?',
            [Number(quantity), id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Supplement not found.' });
        }

        res.json({ message: 'Supplement restocked successfully.' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
