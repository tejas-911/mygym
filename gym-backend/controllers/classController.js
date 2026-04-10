const db = require('../db');


function computeStatus(r) {
    const { registered, capacity, scheduled_date, scheduled_time, duration_minutes } = r;
    
    // now in local time parts
    const now = new Date();
    
    // Create Date objects using local components to match the DB string
    // scheduled_date is YYYY-MM-DD, scheduled_time is HH:mm:ss
    const [y, m, d] = scheduled_date.split('-').map(Number);
    const [hh, mm, ss] = scheduled_time.split(':').map(Number);
    
    const classStart = new Date(y, m - 1, d, hh, mm, ss || 0);
    const classEnd   = new Date(classStart.getTime() + (duration_minutes || 60) * 60000);
    
    if (now > classEnd) return 'Completed';
    if (now > classStart) return 'In Progress';
    if (registered >= capacity) return 'Full';
    if (registered >= capacity * 0.9) return 'Waitlist';
    return 'Booking Open';
}

function formatTimeLabel(dateStr) {
    const now = new Date();
    const toS = (dt) => {
        const y = dt.getFullYear();
        const m = String(dt.getMonth() + 1).padStart(2, '0');
        const d = String(dt.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    };
    
    const today = toS(now);
    const tmrDt = new Date(now); tmrDt.setDate(now.getDate() + 1);
    const tomorrow = toS(tmrDt);

    if (dateStr === today) return 'TODAY';
    if (dateStr === tomorrow) return 'TOMORROW';
    
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit' }).toUpperCase();
}

exports.getStats = async (req, res) => {
    try {
        const [[{ classes_today }]] = await db.query(
            'SELECT COUNT(*) AS classes_today FROM Class_Schedule WHERE scheduled_date = CURDATE()'
        );
        const [[{ total_bookings }]] = await db.query(
            'SELECT COALESCE(SUM(registered), 0) AS total_bookings FROM Class_Schedule WHERE scheduled_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)'
        );
        const [[{ avg_capacity }]] = await db.query(
            'SELECT ROUND(AVG(CASE WHEN capacity > 0 THEN (registered / capacity) * 100 ELSE 0 END), 1) AS avg_capacity FROM Class_Schedule WHERE capacity > 0'
        );
        const [[{ full_today }]] = await db.query(
            'SELECT COUNT(*) AS full_today FROM Class_Schedule WHERE scheduled_date = CURDATE() AND capacity > 0 AND registered >= capacity'
        );
        res.json({ classes_today, total_bookings, avg_capacity: avg_capacity || 0, full_today: full_today || 0 });
    } catch (error) { res.status(500).json({ error: error.message }); }
};

exports.getWeekClasses = async (req, res) => {
    try {
        // weekStart = Monday of requested week (YYYY-MM-DD string, sent from frontend)
        const raw = req.query.weekStart || (() => {
            const n = new Date();
            return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}-${String(n.getDate()).padStart(2,'0')}`;
        })();

        // Parse as local date (avoid UTC shift from new Date('YYYY-MM-DD'))
        const [y, mo, dy] = raw.split('-').map(Number);
        const start = new Date(y, mo - 1, dy);
        // Snap to Monday
        const dow = start.getDay();
        const diff = dow === 0 ? -6 : 1 - dow;
        start.setDate(start.getDate() + diff);
        const end = new Date(start); end.setDate(start.getDate() + 6);

        // Format as local date strings for the SQL query
        const fmt = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
        const startStr = fmt(start);
        const endStr   = fmt(end);

        const [rows] = await db.query(
            `SELECT *, 
                    DATE_FORMAT(scheduled_date, '%Y-%m-%d') AS scheduled_date,
                    DATE_FORMAT(scheduled_time,'%h:%i %p') AS time_display
             FROM Class_Schedule
             WHERE scheduled_date BETWEEN ? AND ?
             ORDER BY scheduled_date ASC, scheduled_time ASC`,
            [startStr, endStr]
        );

        const enriched = rows.map(r => ({
            ...r,
            status: computeStatus(r)
        }));

        res.json({
            classes: enriched,
            week_start: start.toISOString().split('T')[0],
            week_end: end.toISOString().split('T')[0]
        });
    } catch (error) { res.status(500).json({ error: error.message }); }
};

exports.getUpcoming = async (req, res) => {
    try {
        const status = req.query.status || 'all';

        let query = `SELECT *, 
                            DATE_FORMAT(scheduled_date, '%Y-%m-%d') AS scheduled_date,
                            DATE_FORMAT(scheduled_time,'%H:%i') AS time_display
                     FROM Class_Schedule
                     WHERE scheduled_date >= CURDATE()
                     ORDER BY scheduled_date ASC, scheduled_time ASC
                     LIMIT 20`;

        const [rows] = await db.query(query);

        let enriched = rows.map(r => ({
            ...r,
            status: computeStatus(r),
            date_label: formatTimeLabel(r.scheduled_date)
        }));

        if (status !== 'all') {
            enriched = enriched.filter(r => r.status.toLowerCase().replace(' ', '_') === status);
        }

        res.json(enriched);
    } catch (error) { res.status(500).json({ error: error.message }); }
};

exports.getAllClasses = async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT *, 
                    DATE_FORMAT(scheduled_date, '%Y-%m-%d') AS scheduled_date,
                    DATE_FORMAT(scheduled_time,'%h:%i %p') AS time_display
             FROM Class_Schedule ORDER BY scheduled_date DESC, scheduled_time ASC`
        );
        res.json(rows.map(r => ({ ...r, status: computeStatus(r) })));
    } catch (error) { res.status(500).json({ error: error.message }); }
};

exports.addClass = async (req, res) => {
    try {
        const { class_name, trainer_name, scheduled_date, scheduled_time, duration_minutes, capacity, color } = req.body;
        if (!class_name || !scheduled_date || !scheduled_time) {
            return res.status(400).json({ message: 'Class name, date, and time are required' });
        }
        const [result] = await db.query(
            `INSERT INTO Class_Schedule (class_name, trainer_name, scheduled_date, scheduled_time, duration_minutes, capacity, color)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [class_name, trainer_name || 'Unassigned', scheduled_date, scheduled_time,
             duration_minutes || 60, capacity || 20, color || 'lime']
        );
        res.status(201).json({ id: result.insertId, message: 'Class created' });
    } catch (error) {
        res.status(500).json({ message: error.message }); 
    }
};

exports.updateClass = async (req, res) => {
    try {
        const { id } = req.params;
        const { class_name, trainer_name, scheduled_date, scheduled_time, duration_minutes, capacity, registered, color } = req.body;

        // Fetch current to check if status is completed
        const [existing] = await db.query("SELECT *, DATE_FORMAT(scheduled_date, '%Y-%m-%d') AS scheduled_date FROM Class_Schedule WHERE class_id = ?", [id]);
        if (existing.length === 0) return res.status(404).json({ message: 'Class not found' });
        
        const cur = existing[0];
        const prevStatus = computeStatus(cur);

        // If trying to increase registration for a completed class, block it
        if (prevStatus === 'Completed' && registered > cur.registered) {
            return res.status(400).json({ message: 'Cannot book seats for a completed class' });
        }

        await db.query(
            `UPDATE Class_Schedule SET class_name=?, trainer_name=?, scheduled_date=?, scheduled_time=?,
             duration_minutes=?, capacity=?, registered=?, color=? WHERE class_id=?`,
            [class_name, trainer_name, scheduled_date, scheduled_time, duration_minutes, capacity, registered, color, id]
        );
        res.json({ message: 'Class updated' });
    } catch (error) {
        console.error('Class Update Error:', error);
        res.status(500).json({ message: error.message }); 
    }
};

exports.deleteClass = async (req, res) => {
    try {
        await db.query('DELETE FROM Class_Schedule WHERE class_id = ?', [req.params.id]);
        res.json({ message: 'Class deleted' });
    } catch (error) { res.status(500).json({ error: error.message }); }
};
