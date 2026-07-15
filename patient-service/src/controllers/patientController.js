const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const patientModel = require('../models/patientModel');
const { validateRegisterInput, validateLoginInput } = require('../utils/validators');
const { publishPatientUpdated } = require('../config/rabbitmq');

// POST /api/patients/register  (public)
async function register(req, res) {
  try {
    const error = validateRegisterInput(req.body);
    if (error) return res.status(400).json({ error });

    const existing = await patientModel.findByEmail(req.body.email);
    if (existing) return res.status(400).json({ error: 'Email already registered' });

    const patient = await patientModel.createPatient(req.body);
    return res.status(201).json({ message: 'Patient registered', patient });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// POST /api/patients/login  (public) -> issues JWT
async function login(req, res) {
  try {
    const error = validateLoginInput(req.body);
    if (error) return res.status(400).json({ error });

    const patient = await patientModel.findByEmail(req.body.email);
    if (!patient) return res.status(401).json({ error: 'Invalid email or password' });

    const match = await bcrypt.compare(req.body.password, patient.password_hash);
    if (!match) return res.status(401).json({ error: 'Invalid email or password' });

    const token = jwt.sign(
      { patientId: patient.id, email: patient.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '2h' }
    );

    return res.status(200).json({ message: 'Login successful', token });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// GET /api/patients/:id  (secured)
async function getProfile(req, res) {
  try {
    if (Number(req.params.id) !== req.user.patientId) {
      return res.status(403).json({ error: 'You may only view your own profile' });
    }
    const patient = await patientModel.getPatientById(req.params.id);
    if (!patient) return res.status(404).json({ error: 'Patient not found' });
    return res.status(200).json(patient);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// PUT /api/patients/:id  (secured)
// This is the write side of the data-synchronization scenario:
// after updating MySQL (source of truth), we publish an event so the
// Reminder Service can refresh its MongoDB cache.
async function updateProfile(req, res) {
  try {
    if (Number(req.params.id) !== req.user.patientId) {
      return res.status(403).json({ error: 'You may only update your own profile' });
    }
    const updated = await patientModel.updatePatient(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Patient not found' });

    publishPatientUpdated({
      patientId: updated.id,
      patientName: updated.full_name,
      patientContact: updated.phone,
      updatedAt: updated.updated_at
    });

    return res.status(200).json({ message: 'Profile updated', patient: updated });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// DELETE /api/patients/:id  (secured)
async function deleteProfile(req, res) {
  try {
    if (Number(req.params.id) !== req.user.patientId) {
      return res.status(403).json({ error: 'You may only delete your own profile' });
    }
    const deleted = await patientModel.deletePatient(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Patient not found' });
    return res.status(200).json({ message: 'Patient deleted', patient: deleted });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = { register, login, getProfile, updateProfile, deleteProfile };
