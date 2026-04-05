const db = require('../db');

async function getDbNowParts() {
    const [[row]] = await db.query(
        'SELECT CURDATE() AS today, DATE_FORMAT(NOW(), "%Y-%m-%d %H:%i:%s") AS now_value'
    );
    return row;
}

async function hasAttendanceForDate(memberId, dateValue) {
    const [[row]] = await db.query(
        'SELECT COUNT(*) AS cnt FROM Attendance WHERE member_id = ? AND date = ?',
        [memberId, dateValue]
    );
    return row.cnt > 0;
}

exports.getAllAttendance = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM Attendance ORDER BY check_in_time DESC');
        res.json(rows);
    } catch (error) { res.status(500).json({ error: error.message }); }
};

exports.createAttendance = async (req, res) => {
    try {
        const { member_id, check_in_time, check_out_time, date } = req.body;
        if (!member_id || !check_in_time || !date) {
            return res.status(400).json({ message: 'Member ID, check-in time, and date are required' });
        }

        if (await hasAttendanceForDate(member_id, date)) {
            return res.status(400).json({ message: 'This member already has attendance recorded for that day' });
        }

        const [result] = await db.query(
            'INSERT INTO Attendance (member_id, check_in_time, check_out_time, date) VALUES (?, ?, ?, ?)',
            [member_id, check_in_time, check_out_time, date]
        );
        res.status(201).json({ id: result.insertId, message: 'Attendance logged' });
    } catch (error) { res.status(500).json({ error: error.message }); }
};

exports.checkIn = async (req, res) => {
    try {
        const { member_id } = req.body;
        if (!member_id) return res.status(400).json({ message: 'Member ID is required' });

        const [members] = await db.query('SELECT * FROM Member WHERE member_id = ?', [member_id]);
        if (members.length === 0) return res.status(404).json({ message: 'Member not found' });

        const member = members[0];
        const { today, now_value: checkInTime } = await getDbNowParts();

        if (await hasAttendanceForDate(member_id, today)) {
            return res.status(400).json({ message: `${member.name} already has attendance recorded for today` });
        }

        await db.query(
            'INSERT INTO Attendance (member_id, check_in_time, date) VALUES (?, ?, ?)',
            [member_id, checkInTime, today]
        );

        const timeStr = new Date(checkInTime.replace(' ', 'T')).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
        res.status(201).json({ message: 'Check-in successful', member_name: member.name, member_status: member.status, time: timeStr });
    } catch (error) { res.status(500).json({ error: error.message }); }
};

exports.checkOut = async (req, res) => {
    try {
        const { member_id } = req.body;
        if (!member_id) return res.status(400).json({ message: 'Member ID is required' });

        const [members] = await db.query('SELECT * FROM Member WHERE member_id = ?', [member_id]);
        if (members.length === 0) return res.status(404).json({ message: 'Member not found' });

        const member = members[0];
        const { today, now_value: checkOutTime } = await getDbNowParts();

        const [existing] = await db.query(
            'SELECT * FROM Attendance WHERE member_id = ? AND date = ? AND check_out_time IS NULL ORDER BY check_in_time DESC LIMIT 1',
            [member_id, today]
        );
        if (existing.length === 0) return res.status(400).json({ message: `${member.name} is not currently checked in` });

        await db.query(
            'UPDATE Attendance SET check_out_time = ? WHERE attendance_id = ?',
            [checkOutTime, existing[0].attendance_id]
        );

        const timeStr = new Date(checkOutTime.replace(' ', 'T')).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
        res.json({ message: 'Check-out successful', member_name: member.name, time: timeStr });
    } catch (error) { res.status(500).json({ error: error.message }); }
};

exports.getTodayAttendance = async (req, res) => {
    try {
        const { today } = await getDbNowParts();
        const limit = parseInt(req.query.limit) || 20;
        const offset = parseInt(req.query.offset) || 0;

        const [rows] = await db.query(
            `SELECT a.attendance_id, a.member_id, m.name, m.status as member_status,
                    a.check_in_time, a.check_out_time, a.date,
                    TIMESTAMPDIFF(MINUTE, a.check_in_time, IFNULL(a.check_out_time, NOW())) as duration_minutes
             FROM Attendance a
             JOIN Member m ON a.member_id = m.member_id
             WHERE a.date = ?
             ORDER BY a.check_in_time DESC
             LIMIT ? OFFSET ?`,
            [today, limit, offset]
        );

        const [countResult] = await db.query('SELECT COUNT(*) as total FROM Attendance WHERE date = ?', [today]);

        res.json({ records: rows, total: countResult[0].total });
    } catch (error) { res.status(500).json({ error: error.message }); }
};

exports.getStats = async (req, res) => {
    try {
        const { today } = await getDbNowParts();

        const [[{ currently_inside }]] = await db.query(
            'SELECT COUNT(*) as currently_inside FROM Attendance WHERE date = ? AND check_out_time IS NULL', [today]
        );

        const [[{ checked_in_today }]] = await db.query(
            'SELECT COUNT(*) as checked_in_today FROM Attendance WHERE date = ?', [today]
        );

        const [[avgRow]] = await db.query(
            `SELECT AVG(TIMESTAMPDIFF(MINUTE, check_in_time, check_out_time)) as avg_session
             FROM Attendance WHERE date = ? AND check_out_time IS NOT NULL`, [today]
        );
        const avg_session = Math.round(avgRow.avg_session) || 0;

        const [peakRows] = await db.query(
            `SELECT HOUR(check_in_time) as hour, COUNT(*) as cnt
             FROM Attendance WHERE date = ?
             GROUP BY HOUR(check_in_time)
             ORDER BY cnt DESC LIMIT 1`, [today]
        );
        let peak_hour = null;
        if (peakRows.length > 0) {
            const h = peakRows[0].hour;
            const fmt = (hr) => {
                const period = hr < 12 ? 'AM' : 'PM';
                const display = hr % 12 === 0 ? 12 : hr % 12;
                return `${display} ${period}`;
            };
            peak_hour = `${fmt(h)}-${fmt(h + 1)}`;
        }

        res.json({ currently_inside, checked_in_today, avg_session, peak_hour });
    } catch (error) { res.status(500).json({ error: error.message }); }
};
