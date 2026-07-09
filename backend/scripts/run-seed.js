const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function runSeed() {
    console.log('Connecting to PostgreSQL to seed data...');
    const client = new Client({
        host: process.env.DB_HOST || '127.0.0.1',
        port: process.env.DB_PORT || 5432,
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || '1234567',
        database: process.env.DB_NAME || 'banking_db'
    });

    try {
        await client.connect();
        const seedPath = path.join(__dirname, '../seed.sql');
        const seedSql = fs.readFileSync(seedPath, 'utf8');

        console.log('Executing seed.sql...');
        await client.query(seedSql);
        console.log('Seed data inserted successfully!');
    } catch (err) {
        console.error('Error running seed:', err.message);
    } finally {
        await client.end();
        process.exit();
    }
}

runSeed();
