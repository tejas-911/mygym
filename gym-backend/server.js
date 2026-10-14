// Gym Ecosystem Backend Server (Port 5001)
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { errorMiddleware } = require('./middleware/errorMiddleware');
const { verifyToken } = require('./middleware/authMiddleware');

const app = express();

app.use(cors());
app.use(express.json());

// Routes
const memberRoutes = require('./routes/memberRoutes');
const trainerRoutes = require('./routes/trainerRoutes');
const planRoutes = require('./routes/planRoutes');
const subscriptionRoutes = require('./routes/subscriptionRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const authRoutes = require('./routes/authRoutes');
const workoutRoutes = require('./routes/workoutRoutes');
const dietRoutes = require('./routes/dietRoutes');
const equipmentRoutes = require('./routes/equipmentRoutes');
const supplementRoutes = require('./routes/supplementRoutes');
const reportsRoutes = require('./routes/reportsRoutes');
const classRoutes  = require('./routes/classRoutes');
const dbFeaturesRoutes = require('./routes/dbFeaturesRoutes');

// Login is public; every other /api route needs a valid JWT
app.use('/api/auth', authRoutes);
app.use('/api', verifyToken);

app.use('/api/members', memberRoutes);
app.use('/api/trainers', trainerRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/workouts', workoutRoutes);
app.use('/api/diets', dietRoutes);
app.use('/api/equipment', equipmentRoutes);
app.use('/api/supplements', supplementRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/db', dbFeaturesRoutes);

// Global error handling middleware (must be last)
app.use(errorMiddleware);

const PORT = process.env.PORT || 5000;

// Schema Migration for Payment -> Member link
const db = require('./db');
async function migrateSchema() {
    try {
        const [cols] = await db.query("SHOW COLUMNS FROM Payment LIKE 'member_id'");
        if (cols.length === 0) {
            console.log("Migrating Payment table: Adding member_id...");
            await db.query("ALTER TABLE Payment ADD COLUMN member_id INT NULL");
            await db.query("ALTER TABLE Payment ADD FOREIGN KEY (member_id) REFERENCES Member(member_id) ON DELETE SET NULL");
            console.log("Migration complete.");
        }
    } catch (e) {
        console.error("Migration failed:", e.message);
    }
}
migrateSchema();

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
