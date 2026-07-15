const { pool } = require('../config/db');
const bcrypt = require('bcryptjs');

async function createPatient({ fullName, email, phone, password }) {
  const passwordHash = await bcrypt.hash(password, 10);
  const [result] = await pool.query(
    `INSERT INTO patients (full_name, email, phone, password_hash) VALUES (?, ?, ?, ?)`,
    [fullName, email, phone, passwordHash]
  );
  return getPatientById(result.insertId);
}

async function findByEmail(email) {
  const [rows] = await pool.query('SELECT * FROM patients WHERE email = ?', [email]);
  return rows[0] || null;
}

async function getPatientById(id) {
  const [rows] = await pool.query(
    'SELECT id, full_name, email, phone, updated_at, created_at FROM patients WHERE id = ?',
    [id]
  );
  return rows[0] || null;
}

async function updatePatient(id, { fullName, phone }) {
  const existing = await getPatientById(id);
  if (!existing) return null;
  await pool.query(
    'UPDATE patients SET full_name = ?, phone = ? WHERE id = ?',
    [fullName ?? existing.full_name, phone ?? existing.phone, id]
  );
  return getPatientById(id);
}

async function deletePatient(id) {
  const existing = await getPatientById(id);
  if (!existing) return null;
  await pool.query('DELETE FROM patients WHERE id = ?', [id]);
  return existing;
}

module.exports = { createPatient, findByEmail, getPatientById, updatePatient, deletePatient };
