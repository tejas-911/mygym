const db = require('../db');

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Cache the status column check so we don't hit INFORMATION_SCHEMA every request
let _hasStatusCol = null;
async function hasStatusColumn() {
    if (_hasStatusCol !== null) return _hasStatusCol;
    const [cols] = await db.query(`
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Payment' AND COLUMN_NAME = 'status'
    `);
    _hasStatusCol = cols.length > 0;
    return _hasStatusCol;
}

// ── GET /api/payments ─────────────────────────────────────────────────────────
exports.getAllPayments = async (req, res) => {
    try {
        const search = req.query.search || '';
        const limit  = parseInt(req.query.limit)  || 10;
        const offset = parseInt(req.query.offset) || 0;
        const searchParam = `%${search}%`;

        const useStatus = await hasStatusColumn();

        const statusCol = useStatus
            ? "IFNULL(p.status, 'Paid') AS status"
            : "'Paid' AS status";

        const [rows] = await db.query(
            `SELECT p.payment_id, p.subscription_id, p.amount, p.payment_date, p.payment_method,
                    ${statusCol},
                    m.name AS member_name, m.member_id,
                    mp.plan_name
             FROM Payment p
             LEFT JOIN Subscription s  ON p.subscription_id = s.subscription_id
             LEFT JOIN Member m        ON s.member_id = m.member_id
             LEFT JOIN Membership_Plan mp ON s.plan_id = mp.plan_id
             WHERE (m.name LIKE ? OR mp.plan_name LIKE ? OR p.payment_method LIKE ?)
             ORDER BY p.payment_date DESC, p.payment_id DESC
             LIMIT ? OFFSET ?`,
            [searchParam, searchParam, searchParam, limit, offset]
        );

        const [[{ total }]] = await db.query(
            `SELECT COUNT(*) AS total
             FROM Payment p
             LEFT JOIN Subscription s  ON p.subscription_id = s.subscription_id
             LEFT JOIN Member m        ON s.member_id = m.member_id
             LEFT JOIN Membership_Plan mp ON s.plan_id = mp.plan_id
             WHERE (m.name LIKE ? OR mp.plan_name LIKE ? OR p.payment_method LIKE ?)`,
            [searchParam, searchParam, searchParam]
        );

        res.json({ records: rows, total });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ── POST /api/payments ────────────────────────────────────────────────────────
exports.createPayment = async (req, res) => {
    try {
        const { subscription_id, amount, payment_date, payment_method } = req.body;

        if (!subscription_id || !amount || !payment_date || !payment_method) {
            return res.status(400).json({ message: 'All fields are required.' });
        }
        if (parseFloat(amount) <= 0) {
            return res.status(400).json({ message: 'Amount must be greater than zero.' });
        }

        const useStatus = await hasStatusColumn();
        let result;

        if (useStatus) {
            [result] = await db.query(
                'INSERT INTO Payment (subscription_id, amount, payment_date, payment_method, status) VALUES (?, ?, ?, ?, ?)',
                [subscription_id, amount, payment_date, payment_method, 'Paid']
            );
        } else {
            [result] = await db.query(
                'INSERT INTO Payment (subscription_id, amount, payment_date, payment_method) VALUES (?, ?, ?, ?)',
                [subscription_id, amount, payment_date, payment_method]
            );
        }

        // Reset the cache so new payments are visible immediately
        _hasStatusCol = null;

        res.status(201).json({ id: result.insertId, message: 'Payment recorded successfully.' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ── GET /api/payments/stats ───────────────────────────────────────────────────
exports.getStats = async (req, res) => {
    try {
        const useStatus = await hasStatusColumn();

        let revRow;
        if (useStatus) {
            [[revRow]] = await db.query(`
                SELECT
                    SUM(CASE WHEN DATE_FORMAT(payment_date,'%Y-%m') = DATE_FORMAT(NOW(),'%Y-%m')
                             AND IFNULL(status,'Paid') = 'Paid' THEN amount ELSE 0 END) AS this_month,
                    SUM(CASE WHEN DATE_FORMAT(payment_date,'%Y-%m') = DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 1 MONTH),'%Y-%m')
                             AND IFNULL(status,'Paid') = 'Paid' THEN amount ELSE 0 END) AS last_month,
                    COUNT(CASE WHEN YEARWEEK(payment_date,1) = YEARWEEK(NOW(),1)
                               AND IFNULL(status,'Paid') = 'Paid' THEN 1 END) AS successful_this_week,
                    COUNT(CASE WHEN DATE_FORMAT(payment_date,'%Y-%m') = DATE_FORMAT(NOW(),'%Y-%m')
                               AND IFNULL(status,'Paid') = 'Paid' THEN 1 END) AS successful_this_month,
                    COUNT(CASE WHEN IFNULL(status,'Paid') = 'Pending' THEN 1 END) AS pending_payments,
                    COUNT(*) AS total_all
                FROM Payment
            `);
        } else {
            [[revRow]] = await db.query(`
                SELECT
                    SUM(CASE WHEN DATE_FORMAT(payment_date,'%Y-%m') = DATE_FORMAT(NOW(),'%Y-%m')
                             THEN amount ELSE 0 END) AS this_month,
                    SUM(CASE WHEN DATE_FORMAT(payment_date,'%Y-%m') = DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 1 MONTH),'%Y-%m')
                             THEN amount ELSE 0 END) AS last_month,
                    COUNT(CASE WHEN YEARWEEK(payment_date,1) = YEARWEEK(NOW(),1) THEN 1 END) AS successful_this_week,
                    COUNT(CASE WHEN DATE_FORMAT(payment_date,'%Y-%m') = DATE_FORMAT(NOW(),'%Y-%m') THEN 1 END) AS successful_this_month,
                    0 AS pending_payments,
                    COUNT(*) AS total_all
                FROM Payment
            `);
        }

        const [[{ expired_count }]] = await db.query(
            `SELECT COUNT(*) AS expired_count FROM Subscription WHERE status = 'Expired'`
        );

        const pending    = revRow.pending_payments || 0;
        const thisMonth  = parseFloat(revRow.this_month)  || 0;
        const lastMonth  = parseFloat(revRow.last_month)  || 0;
        const pctChange  = lastMonth > 0
            ? (((thisMonth - lastMonth) / lastMonth) * 100).toFixed(1)
            : null;
        const paidThisMonth = revRow.successful_this_month || 0;
        const successRate = (paidThisMonth + pending) > 0
            ? ((paidThisMonth / (paidThisMonth + pending)) * 100).toFixed(1)
            : '100.0';

        res.json({
            this_month_revenue:   thisMonth,
            last_month_revenue:   lastMonth,
            pct_change:           pctChange,
            pending_count:        pending,
            expired_count,
            successful_this_week: revRow.successful_this_week || 0,
            success_rate:         successRate
        });
    } catch (error) { res.status(500).json({ error: error.message }); }
};

// ── GET /api/payments/trend/monthly ──────────────────────────────────────────
exports.getMonthlyTrend = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT YEAR(payment_date) AS year, MONTH(payment_date) AS month, SUM(amount) AS total
            FROM Payment
            WHERE payment_date >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
            GROUP BY YEAR(payment_date), MONTH(payment_date)
            ORDER BY year ASC, month ASC
        `);

        const data = rows.map(r => ({ name: MONTH_NAMES[r.month - 1], revenue: parseFloat(r.total) || 0 }));

        const result = [];
        const now = new Date();
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthName = MONTH_NAMES[d.getMonth()];
            const found = data.find(x => x.name === monthName);
            result.push(found || { name: monthName, revenue: 0 });
        }

        res.json(result);
    } catch (error) { res.status(500).json({ error: error.message }); }
};

// ── GET /api/payments/trend/daily ────────────────────────────────────────────
exports.getDailyTrend = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT DATE(payment_date) AS day, SUM(amount) AS total
            FROM Payment
            WHERE payment_date >= DATE_SUB(NOW(), INTERVAL 30 DAY)
            GROUP BY DATE(payment_date)
            ORDER BY day ASC
        `);

        const data = rows.map(r => ({
            name:    new Date(r.day).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
            revenue: parseFloat(r.total) || 0
        }));

        res.json(data);
    } catch (error) { res.status(500).json({ error: error.message }); }
};
