import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import * as patientModel from '../models/patientModel';
import { validateRegisterInput, validateLoginInput } from '../utils/validators';
import { publishPatientUpdated } from '../config/rabbitmq';
import { AuthenticatedRequest } from '../middleware/auth';

export async function register(req: Request, res: Response): Promise<void> {
  try {
    const error = validateRegisterInput(req.body);
    if (error) {
      res.status(400).json({ error });
      return;
    }

    const existing = await patientModel.findByEmail(req.body.email);
    if (existing) {
      res.status(400).json({ error: 'Email already registered' });
      return;
    }

    const patient = await patientModel.createPatient(req.body);
    res.status(201).json({ message: 'Patient registered', patient });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const error = validateLoginInput(req.body);
    if (error) {
      res.status(400).json({ error });
      return;
    }

    const patient = await patientModel.findByEmail(req.body.email);
    if (!patient) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const match = await bcrypt.compare(req.body.password, patient.password_hash);
    if (!match) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const token = jwt.sign(
      { patientId: patient.id, email: patient.email } as object,
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES_IN || '2h' } as jwt.SignOptions
    );

    res.status(200).json({ message: 'Login successful', token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const id = req.params.id as string;
    if (Number(id) !== req.user?.patientId) {
      res.status(403).json({ error: 'You may only view your own profile' });
      return;
    }
    const patient = await patientModel.getPatientById(id);
    if (!patient) {
      res.status(404).json({ error: 'Patient not found' });
      return;
    }
    res.status(200).json(patient);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function updateProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const id = req.params.id as string;
    if (Number(id) !== req.user?.patientId) {
      res.status(403).json({ error: 'You may only update your own profile' });
      return;
    }
    const updated = await patientModel.updatePatient(id, req.body);
    if (!updated) {
      res.status(404).json({ error: 'Patient not found' });
      return;
    }

    const published = publishPatientUpdated({
      patientId: updated.id,
      patientName: updated.full_name,
      patientContact: updated.phone,
      updatedAt: updated.updated_at,
    });

    if (!published) {
      console.warn(`[patient-service] Profile ${updated.id} updated, but queue is down. Reminder cache will not sync.`);
    }

    res.status(200).json({ message: 'Profile updated', patient: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function deleteProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const id = req.params.id as string;
    if (Number(id) !== req.user?.patientId) {
      res.status(403).json({ error: 'You may only delete your own profile' });
      return;
    }
    const deleted = await patientModel.deletePatient(id);
    if (!deleted) {
      res.status(404).json({ error: 'Patient not found' });
      return;
    }
    res.status(200).json({ message: 'Patient deleted', patient: deleted });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}
