const db = require('../db');

exports.getReports = async (req, res) => {
    try {
        const [activeMembers] = await db.query("SELECT COUNT(*) as count FROM Member WHERE status='Active'");
        const [expiredSubs] = await db.query("SELECT COUNT(*) as count FROM Subscription WHERE status='Expired' OR end_date < CURDATE()");
        
        // Monthly revenue
        const [revenue] = await db.query(`
            SELECT DATE_FORMAT(payment_date, '%Y-%m') as month, SUM(amount) as total 
            FROM Payment GROUP BY month ORDER BY month ASC LIMIT 6
        `);

        // Popular workout
        const [popularWorkout] = await db.query(`
            SELECT w.plan_name, COUNT(m.member_id) as count 
            FROM Workout_Plan w JOIN Member_Workout m ON w.workout_id = m.workout_id 
            GROUP BY w.workout_id ORDER BY count DESC LIMIT 1
        `);

        // Trainer with most members
        const [topTrainer] = await db.query(`
            SELECT t.name, COUNT(m.member_id) as count 
            FROM Trainer t JOIN Member_Workout m ON t.trainer_id = m.trainer_id 
            GROUP BY t.trainer_id ORDER BY count DESC LIMIT 1
        `);

        // Members absent this week
        const [absentMembers] = await db.query(`
            SELECT COUNT(*) as count FROM Member m 
            WHERE m.status='Active' AND m.member_id NOT IN (
                SELECT member_id FROM Attendance WHERE date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
            )
        `);

        // Equipment needing maintenance
        const [equipmentAlerts] = await db.query(`
            SELECT equipment_name, condition_status FROM Equipment 
            WHERE condition_status IN ('Needs Repair', 'Out of Order')
        `);

        // Top supplement
        const [topSupplement] = await db.query(`
            SELECT s.name, SUM(qs.quantity) as sold 
            FROM Supplement s JOIN Supplement_Sale qs ON s.supplement_id = qs.supplement_id 
            GROUP BY s.supplement_id ORDER BY sold DESC LIMIT 1
        `);

        // Attendance over last 7 days
        const [attendanceStats] = await db.query(`
            SELECT DATE_FORMAT(date, '%Y-%m-%d') as day, COUNT(*) as count 
            FROM Attendance 
            GROUP BY day ORDER BY day ASC LIMIT 7
        `);

        // Member growth
        const [memberGrowth] = await db.query(`
            SELECT DATE_FORMAT(join_date, '%b %Y') as month, COUNT(*) as count 
            FROM Member 
            GROUP BY month ORDER BY MIN(join_date) ASC LIMIT 6
        `);

        res.json({
            activeMembers: activeMembers[0]?.count || 0,
            expiredSubs: expiredSubs[0]?.count || 0,
            revenue: revenue,
            popularWorkout: popularWorkout[0] || null,
            topTrainer: topTrainer[0] || null,
            absentMembers: absentMembers[0]?.count || 0,
            equipmentAlerts: equipmentAlerts,
            topSupplement: topSupplement[0] || null,
            attendanceStats: attendanceStats,
            memberGrowth: memberGrowth
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
