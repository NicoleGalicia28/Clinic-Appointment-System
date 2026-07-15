// MySQL connection pool for the Booking Service.
// A pool (not a single connection) lets Express handle many
// simultaneous requests without waiting on one DB connection.
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

// Creates the appointments table if it doesn't exist yet.
// This means a teammate can `npm start` right after cloning
// without running a separate migration step.
async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS appointments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      patient_id INT NOT NULL,
      patient_name VARCHAR(150) NOT NULL,
      patient_contact VARCHAR(50) NOT NULL,
      doctor_name VARCHAR(150) NOT NULL,
      appointment_date DATE NOT NULL,
      appointment_time VARCHAR(20) NOT NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'booked',
      reminder_queued BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('[booking-service] appointments table ready');
}

module.exports = { pool, initDb };
