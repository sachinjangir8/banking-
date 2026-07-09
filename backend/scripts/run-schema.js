const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function runSchema() {
    console.log('Connecting to PostgreSQL to initialize schema...');
    const client = new Client({
        host: process.env.DB_HOST || '127.0.0.1',
        port: process.env.DB_PORT || 5432,
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || '1234567',
        database: process.env.DB_NAME || 'banking_db'
    });

    try {
        await client.connect();
        const schemaPath = path.join(__dirname, '../schema.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');

        console.log('Executing schema.sql...');
        await client.query(schemaSql);
        console.log('Schema initialized successfully!');
    } catch (err) {
        console.error('Error running schema:', err.message);
    } finally {
        await client.end();
        process.exit();
    }
}

runSchema();
