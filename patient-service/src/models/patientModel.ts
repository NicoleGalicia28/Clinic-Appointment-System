import { pool } from '../config/db';
import bcrypt from 'bcryptjs';

export interface Patient {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  updated_at: string;
  created_at: string;
}

interface PatientWithPassword extends Patient {
  password_hash: string;
}

interface CreatePatientData {
  fullName: string;
  email: string;
  phone: string;
  password: string;
}

interface UpdatePatientData {
  fullName?: string;
  phone?: string;
}

export async function createPatient(data: CreatePatientData): Promise<Patient> {
  const passwordHash = await bcrypt.hash(data.password, 10);
  const [result] = await pool.query(
    `INSERT INTO patients (full_name, email, phone, password_hash) VALUES (?, ?, ?, ?)`,
    [data.fullName, data.email, data.phone, passwordHash]
  );
  const created = await getPatientById((result as any).insertId);
  return created!;
}

export async function findByEmail(email: string): Promise<PatientWithPassword | null> {
  const [rows] = await pool.query('SELECT * FROM patients WHERE email = ?', [email]);
  return (rows as PatientWithPassword[])[0] || null;
}

export async function getPatientById(id: number | string): Promise<Patient | null> {
  const [rows] = await pool.query(
    'SELECT id, full_name, email, phone, updated_at, created_at FROM patients WHERE id = ?',
    [id]
  );
  return (rows as Patient[])[0] || null;
}

export async function updatePatient(id: number | string, data: UpdatePatientData): Promise<Patient | null> {
  const existing = await getPatientById(id);
  if (!existing) return null;
  await pool.query(
    'UPDATE patients SET full_name = ?, phone = ? WHERE id = ?',
    [data.fullName ?? existing.full_name, data.phone ?? existing.phone, id]
  );
  return getPatientById(id);
}

export async function deletePatient(id: number | string): Promise<Patient | null> {
  const existing = await getPatientById(id);
  if (!existing) return null;
  await pool.query('DELETE FROM patients WHERE id = ?', [id]);
  return existing;
}
