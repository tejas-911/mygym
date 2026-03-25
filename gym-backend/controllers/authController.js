const db = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.login = async (req, res) => {
    const { email, password, role } = req.body;
    
    try {
        if (role === 'admin') {
            if (email === 'admin@gym.com' && password === 'admin123') {
                const token = jwt.sign({ role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '1d' });
                return res.json({ token, role: 'admin', user: { name: 'Admin', email } });
            }
            return res.status(401).json({ message: 'Invalid admin credentials' });
        }
        
        let table = role === 'trainer' ? 'Trainer' : 'Member';
        const [rows] = await db.query(`SELECT * FROM ${table} WHERE email = ?`, [email]);
        
        if (rows.length === 0) return res.status(404).json({ message: 'User not found' });
        
        const user = rows[0];
        const validPass = await bcrypt.compare(password, user.password);
        if (!validPass) return res.status(401).json({ message: 'Invalid password' });
        
        const id = role === 'trainer' ? user.trainer_id : user.member_id;
        const token = jwt.sign({ id, role, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1d' });
        
        res.json({ token, role, user: { id, name: user.name, email: user.email } });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
