const db = require('../db');

// Uses sp_gym_performance_report STORED PROCEDURE + vw_monthly_revenue VIEW + Audit_Log (from TRIGGERS)
exports.getReports = async (req, res) => {
    try {
        const month = parseInt(req.query.month) || new Date().getMonth() + 1;
        const year = parseInt(req.query.year) || new Date().getFullYear();

        let membership = null, revenue = [], attendance = null, topMembers = [], equipmentAlerts = [];

        // ── Try calling the stored procedure ──
        try {
            const [results] = await db.query('CALL sp_gym_performance_report(?, ?)', [month, year]);
            // MySQL2 returns multiple result sets as array elements
            // The procedure returns pairs: label row + data rows
            membership = results[1]?.[0] || null;
            revenue = results[3] || [];
            attendance = results[5]?.[0] || null;
            topMembers = results[7] || [];
            equipmentAlerts = results[9] || [];
        } catch (procErr) {
            // Fallback: manual queries if procedure doesn't exist
            const [[activeRow]] = await db.query("SELECT COUNT(*) as count FROM Member WHERE status='Active'");
            const [[expiredRow]] = await db.query("SELECT COUNT(*) as count FROM Subscription WHERE status='Expired' OR end_date < CURDATE()");
            const [[absentRow]] = await db.query(`
                SELECT COUNT(*) as count FROM Member m
                WHERE m.status='Active' AND m.member_id NOT IN (
                    SELECT member_id FROM Attendance WHERE date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
                )
            `);
            membership = {
                total_members: (activeRow.count || 0) + (absentRow.count || 0),
                active_members: activeRow.count || 0,
                inactive_members: 0,
                new_this_month: 0
            };
            const [eqAlerts] = await db.query("SELECT equipment_id, equipment_name, condition_status, location FROM Equipment WHERE condition_status IN ('Needs Repair', 'Out of Order')");
            equipmentAlerts = eqAlerts;
        }

        // ── Construct Monthly Revenue (Rolling 12 Months) ──
        let monthlyRevenue = [];
        try {
            // Aggregate SUM from view (view is grouped by plan/method)
            const [rows] = await db.query(`
                SELECT payment_month, SUM(total_revenue) as total_revenue, SUM(transaction_count) as transaction_count 
                FROM vw_monthly_revenue 
                GROUP BY payment_month 
                ORDER BY payment_month ASC
            `);
            monthlyRevenue = rows;
        } catch (viewErr) {
            const [rows] = await db.query(`
                SELECT DATE_FORMAT(payment_date, '%Y-%m') as payment_month, SUM(amount) as total_revenue, COUNT(*) as transaction_count
                FROM Payment 
                GROUP BY payment_month 
                ORDER BY payment_month ASC
            `);
            monthlyRevenue = rows;
        }

        // Generate rolling 12 months (up to current month of requested year/month)
        const rollingMonths = [];
        const endDate = new Date(year, month - 1, 1);
        for (let i = 11; i >= 0; i--) {
            const d = new Date(endDate);
            d.setMonth(d.getMonth() - i);
            const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            const found = monthlyRevenue.find(r => r.payment_month === ym);
            rollingMonths.push(found || { payment_month: ym, total_revenue: 0, transaction_count: 0 });
        }
        monthlyRevenue = rollingMonths;

        // ── Popular workout / trainer / supplement (always direct queries) ──
        const [popularWorkout] = await db.query(`
            SELECT w.plan_name, COUNT(m.member_id) as count
            FROM Workout_Plan w JOIN Member_Workout m ON w.workout_id = m.workout_id
            GROUP BY w.workout_id, w.plan_name ORDER BY count DESC LIMIT 1
        `);
        const [topTrainer] = await db.query(`
            SELECT t.name, COUNT(m.member_id) as count
            FROM Trainer t JOIN Member_Workout m ON t.trainer_id = m.trainer_id
            GROUP BY t.trainer_id, t.name ORDER BY count DESC LIMIT 1
        `);
        const [topSupplement] = await db.query(`
            SELECT s.name, SUM(qs.quantity) as sold
            FROM Supplement s JOIN Supplement_Sale qs ON s.supplement_id = qs.supplement_id
            GROUP BY s.supplement_id, s.name ORDER BY sold DESC LIMIT 1
        `);
        const [[absentMembers]] = await db.query(`
            SELECT COUNT(*) as count FROM Member m
            WHERE m.status='Active' AND m.member_id NOT IN (
                SELECT member_id FROM Attendance WHERE date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
            )
        `);
        const [memberGrowth] = await db.query(`
            SELECT DATE_FORMAT(join_date, '%b %Y') as month, COUNT(*) as count
            FROM Member GROUP BY month ORDER BY MIN(join_date) ASC LIMIT 6
        `);

        // ── Subscription Status Breakdown (isolated — never blocks the response) ──
        let subscriptionStats = { active_subs: 0, expired_subs: 0, cancelled_subs: 0, total_subs: 0 };
        try {
            const [[row]] = await db.query(`
                SELECT
                    IFNULL(SUM(CASE WHEN status = 'Active'    THEN 1 ELSE 0 END), 0) AS active_subs,
                    IFNULL(SUM(CASE WHEN status = 'Expired'   THEN 1 ELSE 0 END), 0) AS expired_subs,
                    IFNULL(SUM(CASE WHEN status = 'Cancelled' THEN 1 ELSE 0 END), 0) AS cancelled_subs,
                    COUNT(*) AS total_subs
                FROM Subscription
            `);
            subscriptionStats = row;
        } catch (e) { /* use defaults */ }

        // ── Revenue by Plan — no status filter (column may not exist yet) ──
        let revenueByPlan = [];
        try {
            const [rows] = await db.query(`
                SELECT mp.plan_name,
                       IFNULL(SUM(p.amount), 0) AS total_revenue,
                       COUNT(*) AS transactions
                FROM Payment p
                JOIN Subscription s    ON p.subscription_id = s.subscription_id
                JOIN Membership_Plan mp ON s.plan_id = mp.plan_id
                WHERE YEAR(p.payment_date) = ?
                GROUP BY mp.plan_id, mp.plan_name
                ORDER BY total_revenue DESC
            `, [year]);
            revenueByPlan = rows;
        } catch (e) { 
            console.error('Error fetching revenueByPlan:', e.message);
        }

        // ── Revenue by Payment Method ──
        let revenueByMethod = [];
        try {
            const [rows] = await db.query(`
                SELECT payment_method,
                       IFNULL(SUM(amount), 0) AS total,
                       COUNT(*) AS count
                FROM Payment
                WHERE YEAR(payment_date) = ?
                GROUP BY payment_method
                ORDER BY total DESC
            `, [year]);
            revenueByMethod = rows;
        } catch (e) { 
            console.error('Error fetching revenueByMethod:', e.message);
        }

        // ── Year Revenue Totals ──
        let revenueTotals = { total_revenue: 0, total_transactions: 0, pending_count: 0, refunded_count: 0 };
        try {
            // Check if status column exists to decide query shape
            const [cols] = await db.query(`
                SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
                WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Payment' AND COLUMN_NAME = 'status'
            `);
            const hasStatusCol = cols.length > 0;

            if (hasStatusCol) {
                const [[row]] = await db.query(`
                    SELECT
                        IFNULL(SUM(CASE WHEN IFNULL(status,'Paid') IN ('Paid') THEN amount ELSE 0 END), 0) AS total_revenue,
                        IFNULL(COUNT(*), 0) AS total_transactions,
                        IFNULL(COUNT(CASE WHEN status = 'Pending'  THEN 1 END), 0) AS pending_count,
                        IFNULL(COUNT(CASE WHEN status = 'Refunded' THEN 1 END), 0) AS refunded_count
                    FROM Payment WHERE YEAR(payment_date) = ?
                `, [year]);
                revenueTotals = row;
            } else {
                const [[row]] = await db.query(`
                    SELECT
                        IFNULL(SUM(amount), 0) AS total_revenue,
                        COUNT(*) AS total_transactions,
                        0 AS pending_count,
                        0 AS refunded_count
                    FROM Payment WHERE YEAR(payment_date) = ?
                `, [year]);
                revenueTotals = row;
            }
        } catch (e) { 
            console.error('Error fetching revenueTotals:', e.message);
        }

        // ── Audit Log (populated by TRIGGERS) ──
        let auditLog = [];
        try {
            const [logs] = await db.query('SELECT * FROM Audit_Log ORDER BY changed_at DESC LIMIT 20');
            auditLog = logs;
        } catch (e) { /* table not yet created */ }

        // ── Equipment Health VIEW ──
        let equipmentHealth = [];
        try {
            const [rows] = await db.query('SELECT * FROM vw_equipment_health ORDER BY maintenance_flag DESC');
            equipmentHealth = rows;
        } catch (e) { /* view not yet created */ }

        res.json({
            report_month: month,
            report_year: year,
            membership,
            revenue,
            attendance,
            topMembers,
            equipmentAlerts,
            monthlyRevenue,
            popularWorkout: popularWorkout[0] || null,
            topTrainer: topTrainer[0] || null,
            topSupplement: topSupplement[0] || null,
            absentMembers: absentMembers?.count || 0,
            memberGrowth,
            auditLog,
            equipmentHealth,
            subscriptionStats,
            revenueByPlan,
            revenueByMethod,
            revenueTotals
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Renew subscription using sp_renew_subscription STORED PROCEDURE
exports.renewSubscription = async (req, res) => {
    try {
        const { member_id, plan_id, payment_method } = req.body;
        try {
            await db.query('CALL sp_renew_subscription(?, ?, ?, @sub_id, @msg)', [member_id, plan_id, payment_method]);
            const [[result]] = await db.query('SELECT @sub_id AS subscription_id, @msg AS message');
            const status = result.subscription_id > 0 ? 201 : 400;
            res.status(status).json(result);
        } catch (procErr) {
            res.status(500).json({ error: procErr.message, hint: 'Run advanced_db_features.sql to create stored procedures.' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
