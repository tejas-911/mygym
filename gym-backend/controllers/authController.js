const db = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.login = async (req, res) => {
    const { email, password } = req.body;
    
    try {
        // 1. Check Hardcoded Admin
        if (email === 'admin@gym.com' && password === 'admin123') {
            const token = jwt.sign({ role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '1d' });
            return res.json({ token, role: 'admin', user: { name: 'Admin', email } });
        }
        
        // 2. Check Trainer Table
        const [trainers] = await db.query('SELECT * FROM Trainer WHERE email = ?', [email]);
        if (trainers.length > 0) {
            const user = trainers[0];
            const validPass = await bcrypt.compare(password, user.password);
            if (validPass) {
                const token = jwt.sign({ id: user.trainer_id, role: 'trainer', email: user.email }, process.env.JWT_SECRET, { expiresIn: '1d' });
                return res.json({ token, role: 'trainer', user: { id: user.trainer_id, name: user.name, email: user.email } });
            }
        }

        // 3. Check Member Table
        const [members] = await db.query('SELECT * FROM Member WHERE email = ?', [email]);
        if (members.length > 0) {
            const user = members[0];
            const validPass = await bcrypt.compare(password, user.password);
            if (validPass) {
                const token = jwt.sign({ id: user.member_id, role: 'member', email: user.email }, process.env.JWT_SECRET, { expiresIn: '1d' });
                return res.json({ token, role: 'member', user: { id: user.member_id, name: user.name, email: user.email } });
            }
            return res.status(401).json({ message: 'Invalid password' });
        }
        
        return res.status(404).json({ message: 'User identifier not recognized' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
