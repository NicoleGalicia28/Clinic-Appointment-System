// Data-access layer. Controllers never touch SQL directly —
// they call these functions instead. This keeps concerns separated
// (business logic vs. persistence), which is part of "design quality".
const { pool } = require('../config/db');

async function createAppointment(data) {
  const [result] = await pool.query(
    `INSERT INTO appointments
      (patient_id, patient_name, patient_contact, doctor_name, appointment_date, appointment_time, status, reminder_queued)
     VALUES (?, ?, ?, ?, ?, ?, 'booked', ?)`,
    [
      data.patientId, data.patientName, data.patientContact,
      data.doctorName, data.appointmentDate, data.appointmentTime,
      data.reminderQueued
    ]
  );
  return getAppointmentById(result.insertId);
}

async function getAllAppointments() {
  const [rows] = await pool.query('SELECT * FROM appointments ORDER BY appointment_date, appointment_time');
  return rows;
}

async function getAppointmentById(id) {
  const [rows] = await pool.query('SELECT * FROM appointments WHERE id = ?', [id]);
  return rows[0] || null;
}

async function updateAppointment(id, data) {
  const existing = await getAppointmentById(id);
  if (!existing) return null;

  await pool.query(
    `UPDATE appointments SET
      doctor_name = ?, appointment_date = ?, appointment_time = ?, status = ?
     WHERE id = ?`,
    [
      data.doctorName ?? existing.doctor_name,
      data.appointmentDate ?? existing.appointment_date,
      data.appointmentTime ?? existing.appointment_time,
      data.status ?? existing.status,
      id
    ]
  );
  return getAppointmentById(id);
}

async function deleteAppointment(id) {
  const existing = await getAppointmentById(id);
  if (!existing) return null;
  await pool.query('DELETE FROM appointments WHERE id = ?', [id]);
  return existing;
}

module.exports = {
  createAppointment, getAllAppointments, getAppointmentById,
  updateAppointment, deleteAppointment
};
