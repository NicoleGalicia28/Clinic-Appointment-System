import { config } from 'dotenv';
config();
import mysql, { Pool, RowDataPacket, ResultSetHeader } from 'mysql2/promise';

const pool: Pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
});

export async function initDb(): Promise<void> {
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

export { pool, RowDataPacket, ResultSetHeader };
