const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '1234567',
  database: process.env.DB_NAME || 'banking_db',
  max: 10,
  idleTimeoutMillis: 30000
});

module.exports = pool;
