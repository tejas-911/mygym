const db = require('../db');

exports.getEquipment = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM Equipment');
        res.json(rows);
    } catch (error) { res.status(500).json({ error: error.message }); }
};

exports.getMaintenance = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM Maintenance');
        res.json(rows);
    } catch (error) { res.status(500).json({ error: error.message }); }
};
