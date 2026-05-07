const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../..', '.env') });

const { Pool } = require('pg');

console.log("DB URL:", process.env.DATABASE_URL);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.on('error', (err) => {
  console.error('Unexpected DB error', err);
});

module.exports = { query: (text, params) => pool.query(text, params) };