const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function run() {
    console.log('Connecting to db:', process.env.DB_HOST, process.env.DB_NAME, process.env.DB_USER);
    const db = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'gym_db',
        multipleStatements: true
    });

    try {
        const sql = fs.readFileSync(path.join(__dirname, 'sql', 'views.sql'), 'utf8');
        await db.query(sql);
        console.log('Views re-created successfully.');
    } catch (e) {
        console.error(e);
    }
    await db.end();
}

run();
