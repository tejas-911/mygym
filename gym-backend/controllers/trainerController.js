const db = require('../db');

exports.getStats = async (req, res) => {
    try {
        const [[{ total }]]   = await db.query('SELECT COUNT(*) AS total FROM Trainer');
        const [[{ clients }]] = await db.query(`
            SELECT COUNT(DISTINCT member_id) AS clients
            FROM (
                SELECT mw.member_id
                FROM Member_Workout mw
                WHERE (mw.start_date IS NULL OR mw.start_date <= CURDATE())
                  AND (mw.end_date IS NULL OR mw.end_date >= CURDATE())
                UNION
                SELECT md.member_id
                FROM Member_Diet md
                WHERE (md.start_date IS NULL OR md.start_date <= CURDATE())
                  AND (md.end_date IS NULL OR md.end_date >= CURDATE())
            ) active_assignments
        `);
        const [[{ sessions }]]= await db.query(
            "SELECT COUNT(*) AS sessions FROM Class_Schedule WHERE scheduled_date = CURDATE()"
        );
        // Team performance: ratio of active-client trainers to total, scaled
        const [[{ busy }]] = await db.query(
            'SELECT COUNT(DISTINCT trainer_id) AS busy FROM Member_Workout'
        );
        const performance = total > 0 ? Math.min(Math.round((busy / total) * 100), 99) : 0;
        res.json({ total_trainers: total, sessions_today: sessions, active_clients: clients, performance });
    } catch (error) { res.status(500).json({ error: error.message }); }
};

exports.getAllTrainers = async (req, res) => {
    try {
        const limit  = parseInt(req.query.limit)  || 6;
        const offset = parseInt(req.query.offset) || 0;

        const [rows] = await db.query(
            `SELECT t.*,
                    COUNT(DISTINCT COALESCE(mw.member_id, md.member_id)) AS active_clients
             FROM Trainer t
             LEFT JOIN Member_Workout mw
                    ON mw.trainer_id = t.trainer_id
                   AND (mw.start_date IS NULL OR mw.start_date <= CURDATE())
                   AND (mw.end_date IS NULL OR mw.end_date >= CURDATE())
             LEFT JOIN Member_Diet md
                    ON md.trainer_id = t.trainer_id
                   AND (md.start_date IS NULL OR md.start_date <= CURDATE())
                   AND (md.end_date IS NULL OR md.end_date >= CURDATE())
             GROUP BY t.trainer_id
             ORDER BY t.trainer_id ASC
             LIMIT ? OFFSET ?`,
            [limit, offset]
        );
        const [[{ total }]] = await db.query('SELECT COUNT(*) AS total FROM Trainer');
        res.json({ trainers: rows, total });
    } catch (error) { res.status(500).json({ error: error.message }); }
};

exports.getTrainerById = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM Trainer WHERE trainer_id = ?', [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ message: 'Trainer not found' });
        res.json(rows[0]);
    } catch (error) { res.status(500).json({ error: error.message }); }
};

exports.createTrainer = async (req, res) => {
    try {
        const { name, specialization, phone, salary, hire_date, email, password } = req.body;
        if (!name) return res.status(400).json({ message: 'Name is required' });
        const [result] = await db.query(
            'INSERT INTO Trainer (name, specialization, phone, salary, hire_date, email, password) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [
                name,
                specialization || null,
                phone || null,
                salary || null,
                hire_date || null,
                email || 'trainer@example.com',
                password || '$2a$10$tZ2yN7M7d32K0o0dF.ZlO.P936kHjQpX8qO8mH2g6E.E7oHtzN1Ua'
            ]
        );
        res.status(201).json({ id: result.insertId, message: 'Trainer created' });
    } catch (error) { res.status(500).json({ error: error.message }); }
};

exports.updateTrainer = async (req, res) => {
    try {
        const { name, specialization, phone, salary, hire_date, email, password } = req.body;
        await db.query(
            'UPDATE Trainer SET name=?, specialization=?, phone=?, salary=?, hire_date=?, email=?, password=COALESCE(?, password) WHERE trainer_id=?',
            [name, specialization, phone, salary, hire_date, email || null, password || null, req.params.id]
        );
        res.json({ message: 'Trainer updated' });
    } catch (error) { res.status(500).json({ error: error.message }); }
};

exports.deleteTrainer = async (req, res) => {
    try {
        await db.query('DELETE FROM Trainer WHERE trainer_id = ?', [req.params.id]);
        res.json({ message: 'Trainer deleted' });
    } catch (error) { res.status(500).json({ error: error.message }); }
};
