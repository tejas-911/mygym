const db = require('../db');

// Uses vw_member_dashboard VIEW + fn_member_age, fn_subscription_status_label, fn_total_revenue_by_member FUNCTIONS (updated)
exports.getAllMembers = async (req, res) => {
    try {
        // Try the enriched query first (requires advanced_db_features.sql to be run)
        try {
            const [rows] = await db.query(`
                SELECT
                    m.member_id,
                    m.name           AS member_name,
                    m.gender,
                    m.phone,
                    m.email,
                    m.date_of_birth,
                    m.join_date,
                    m.status         AS member_status,
                    fn_member_age(m.member_id)                AS age,
                    fn_subscription_status_label(m.member_id) AS subscription_status_label,
                    fn_total_revenue_by_member(m.member_id)   AS lifetime_revenue,
                    -- subscription info via correlated subquery
                    (SELECT s.subscription_id FROM Subscription s WHERE s.member_id = m.member_id ORDER BY s.end_date DESC LIMIT 1) AS subscription_id,
                    (SELECT mp.plan_name FROM Subscription s JOIN Membership_Plan mp ON s.plan_id = mp.plan_id WHERE s.member_id = m.member_id ORDER BY s.end_date DESC LIMIT 1) AS plan_name,
                    (SELECT mp.price FROM Subscription s JOIN Membership_Plan mp ON s.plan_id = mp.plan_id WHERE s.member_id = m.member_id ORDER BY s.end_date DESC LIMIT 1) AS plan_price,
                    (SELECT s.start_date FROM Subscription s WHERE s.member_id = m.member_id ORDER BY s.end_date DESC LIMIT 1) AS subscription_start,
                    (SELECT s.end_date FROM Subscription s WHERE s.member_id = m.member_id ORDER BY s.end_date DESC LIMIT 1) AS subscription_end,
                    (SELECT s.status FROM Subscription s WHERE s.member_id = m.member_id ORDER BY s.end_date DESC LIMIT 1) AS subscription_status,
                    (SELECT DATEDIFF(s.end_date, CURDATE()) FROM Subscription s WHERE s.member_id = m.member_id ORDER BY s.end_date DESC LIMIT 1) AS days_remaining,
                    IFNULL((SELECT SUM(p.amount) FROM Subscription s JOIN Payment p ON p.subscription_id = s.subscription_id WHERE s.member_id = m.member_id), 0) AS total_paid,
                    (SELECT COUNT(*) FROM Attendance a WHERE a.member_id = m.member_id) AS total_visits
                FROM Member m
                ORDER BY m.member_id
            `);
            return res.json(rows);
        } catch (viewErr) {
            // Fallback to plain query if functions not yet created
            const [rows] = await db.query('SELECT * FROM Member ORDER BY member_id');
            return res.json(rows);
        }
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

// Uses sp_register_member STORED PROCEDURE for validated insertion
exports.createMember = async (req, res) => {
    try {
        const { name, gender, phone, email, date_of_birth } = req.body;

        try {
            // Call stored procedure with validation
            await db.query(
                'CALL sp_register_member(?, ?, ?, ?, ?, @new_id, @msg)',
                [name, gender || 'Male', phone, email, date_of_birth || null]
            );
            const [[result]] = await db.query('SELECT @new_id AS member_id, @msg AS message');

            if (result.member_id > 0) {
                return res.status(201).json({ id: result.member_id, message: result.message });
            } else {
                return res.status(400).json({ message: result.message });
            }
        } catch (procErr) {
            // Fallback: direct insert if procedure not yet created
            const [result] = await db.query(
                'INSERT INTO Member (name, gender, phone, email, date_of_birth, join_date, status) VALUES (?, ?, ?, ?, ?, CURDATE(), ?)',
                [name, gender, phone, email, date_of_birth, 'Active']
            );
            return res.status(201).json({ id: result.insertId, message: 'Member created' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateMember = async (req, res) => {
    try {
        const { name, gender, phone, email, date_of_birth, join_date, status } = req.body;
        await db.query(
            'UPDATE Member SET name=?, gender=?, phone=?, email=?, date_of_birth=?, join_date=?, status=? WHERE member_id=?',
            [name, gender || 'Male', phone || null, email || null, date_of_birth || null, join_date || null, status, req.params.id]
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
