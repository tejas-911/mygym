const db = require('../db');

function deriveCategory(name = '') {
    const n = name.toLowerCase();
    if (/treadmill|bike|cycle|elliptical|rowing|cardio|spin|runner/.test(n)) return 'Cardio';
    if (/rack|barbell|dumbbell|weight|plate|bench|squat|press|deadlift|cable|strength|power|curl/.test(n)) return 'Strength';
    if (/massage|foam|stretch|recovery|yoga|sauna|pool|steam/.test(n)) return 'Recovery';
    return 'General';
}

function deriveStatus(condition) {
    if (condition === 'Out of Order') return 'Out of Order';
    if (condition === 'Needs Repair') return 'Out of Order';
    return 'Available';
}

exports.getEquipment = async (req, res) => {
    try {
        const search = req.query.search || '';
        const param = `%${search}%`;
        const [rows] = await db.query(
            `SELECT e.*,
                    (SELECT MAX(m.maintenance_date) FROM Maintenance m WHERE m.equipment_id = e.equipment_id) AS last_serviced
             FROM Equipment e
             WHERE e.equipment_name LIKE ? OR e.location LIKE ? OR e.condition_status LIKE ?
             ORDER BY e.equipment_id ASC`,
            [param, param, param]
        );
        const enriched = rows.map(r => ({
            ...r,
            category: deriveCategory(r.equipment_name),
            display_status: deriveStatus(r.condition_status),
            last_serviced: r.last_serviced || r.purchase_date
        }));
        res.json(enriched);
    } catch (error) { res.status(500).json({ error: error.message }); }
};

exports.addEquipment = async (req, res) => {
    try {
        const { equipment_name, purchase_date, condition_status, location } = req.body;
        if (!equipment_name) return res.status(400).json({ message: 'Equipment name is required' });
        const [result] = await db.query(
            'INSERT INTO Equipment (equipment_name, purchase_date, condition_status, location) VALUES (?, ?, ?, ?)',
            [equipment_name, purchase_date || null, condition_status || 'Good', location || null]
        );
        res.status(201).json({ id: result.insertId, message: 'Equipment added' });
    } catch (error) { res.status(500).json({ error: error.message }); }
};

exports.getMaintenance = async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT m.*, e.equipment_name, e.condition_status
             FROM Maintenance m
             JOIN Equipment e ON m.equipment_id = e.equipment_id
             JOIN (
                SELECT equipment_id, MAX(maintenance_id) AS latest_maintenance_id
                FROM Maintenance
                GROUP BY equipment_id
             ) latest
               ON latest.latest_maintenance_id = m.maintenance_id
             ORDER BY
                CASE
                    WHEN e.condition_status IN ('Needs Repair', 'Out of Order') THEN 0
                    ELSE 1
                END,
                m.maintenance_date DESC`
        );
        const today = new Date();
        const enriched = rows.map(r => {
            const mDate = new Date(r.maintenance_date);
            const diffDays = Math.round((mDate - today) / (1000 * 60 * 60 * 24));
            let label = '';
            if (r.condition_status === 'Needs Repair' || r.condition_status === 'Out of Order') label = 'Urgent';
            else if (diffDays < 0) label = `Past Due (${Math.abs(diffDays)} day${Math.abs(diffDays) !== 1 ? 's' : ''})`;
            else if (diffDays === 0) label = 'Today';
            else if (diffDays === 1) label = 'Tomorrow';
            else label = mDate.toLocaleDateString('en-US', { weekday: 'short', day: '2-digit', month: 'short' });
            return { ...r, days_diff: diffDays, date_label: label };
        });
        res.json(enriched);
    } catch (error) { res.status(500).json({ error: error.message }); }
};

exports.getStats = async (req, res) => {
    try {
        const [[{ total }]] = await db.query('SELECT COUNT(*) AS total FROM Equipment');
        const [[{ good }]] = await db.query(
            "SELECT COUNT(*) AS good FROM Equipment WHERE condition_status IN ('New','Good')"
        );
        const [[{ maintenance_due }]] = await db.query(
            "SELECT COUNT(*) AS maintenance_due FROM Equipment WHERE condition_status IN ('Needs Repair','Out of Order')"
        );
        const [[{ this_month }]] = await db.query(
            "SELECT COUNT(*) AS this_month FROM Equipment WHERE purchase_date >= DATE_FORMAT(NOW(),'%Y-%m-01')"
        );

        const active = total - maintenance_due;
        const utilization = total > 0 ? ((active / total) * 100).toFixed(1) : 0;
        const reliability_score = total > 0 ? Math.round((good / total) * 1000) : 0;

        // Try vw_equipment_health VIEW for enriched health data
        let equipmentHealth = [];
        try {
            const [rows] = await db.query('SELECT * FROM vw_equipment_health ORDER BY maintenance_flag DESC');
            equipmentHealth = rows;
        } catch (e) { /* view not yet created */ }

        res.json({ total, active, utilization, maintenance_due, this_month, reliability_score, equipmentHealth });
    } catch (error) { res.status(500).json({ error: error.message }); }
};

exports.repairEquipment = async (req, res) => {
    try {
        const { id } = req.params;
        await db.query(
            "UPDATE Equipment SET condition_status = 'Good' WHERE equipment_id = ?",
            [id]
        );
        await db.query(
            "INSERT INTO Maintenance (equipment_id, maintenance_date, description, cost) VALUES (?, CURDATE(), ?, ?)",
            [id, 'Equipment repaired and returned to service.', 0]
        );
        res.json({ message: 'Equipment marked as repaired' });
    } catch (error) { res.status(500).json({ error: error.message }); }
};

exports.sendToRepair = async (req, res) => {
    try {
        const { id } = req.params;
        const { description, cost } = req.body;
        
        // 1. Update status to Needs Repair
        await db.query(
            "UPDATE Equipment SET condition_status = 'Needs Repair' WHERE equipment_id = ?",
            [id]
        );

        // 2. Log Maintenance entry if provided (or default)
        await db.query(
            "INSERT INTO Maintenance (equipment_id, maintenance_date, description, cost) VALUES (?, CURDATE(), ?, ?)",
            [id, description || 'Equipment sent to repair for maintenance.', cost || 0]
        );

        res.json({ message: 'Equipment sent to repair and maintenance logged.' });
    } catch (error) { res.status(500).json({ error: error.message }); }
};
