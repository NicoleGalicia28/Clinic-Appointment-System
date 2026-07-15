require('dotenv').config();
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10
});

async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS patients (
      id INT AUTO_INCREMENT PRIMARY KEY,
      full_name VARCHAR(150) NOT NULL,
      email VARCHAR(150) NOT NULL UNIQUE,
      phone VARCHAR(50) NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('[patient-service] patients table ready');
}

module.exports = { pool, initDb };
