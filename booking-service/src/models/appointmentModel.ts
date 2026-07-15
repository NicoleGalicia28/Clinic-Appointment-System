import { pool } from '../config/db';

export interface Appointment {
  id: number;
  patient_id: number;
  patient_name: string;
  patient_contact: string;
  doctor_name: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  reminder_queued: boolean;
  created_at: string;
}

interface CreateAppointmentData {
  patientId: number;
  patientName: string;
  patientContact: string;
  doctorName: string;
  appointmentDate: string;
  appointmentTime: string;
  reminderQueued: boolean;
}

interface UpdateAppointmentData {
  doctorName?: string;
  appointmentDate?: string;
  appointmentTime?: string;
  status?: string;
}

export async function createAppointment(data: CreateAppointmentData): Promise<Appointment> {
  const [result] = await pool.query(
    `INSERT INTO appointments
      (patient_id, patient_name, patient_contact, doctor_name, appointment_date, appointment_time, status, reminder_queued)
     VALUES (?, ?, ?, ?, ?, ?, 'booked', ?)`,
    [
      data.patientId, data.patientName, data.patientContact,
      data.doctorName, data.appointmentDate, data.appointmentTime,
      data.reminderQueued,
    ]
  );
  const inserted = await getAppointmentById((result as any).insertId);
  return inserted!;
}

export async function getAllAppointments(): Promise<Appointment[]> {
  const [rows] = await pool.query('SELECT * FROM appointments ORDER BY appointment_date, appointment_time');
  return rows as Appointment[];
}

export async function getAppointmentById(id: number | string): Promise<Appointment | null> {
  const [rows] = await pool.query('SELECT * FROM appointments WHERE id = ?', [id]);
  return (rows as Appointment[])[0] || null;
}

export async function updateAppointment(id: number | string, data: UpdateAppointmentData): Promise<Appointment | null> {
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
      id,
    ]
  );
  return getAppointmentById(id);
}

export async function deleteAppointment(id: number | string): Promise<Appointment | null> {
  const existing = await getAppointmentById(id);
  if (!existing) return null;
  await pool.query('DELETE FROM appointments WHERE id = ?', [id]);
  return existing;
}
