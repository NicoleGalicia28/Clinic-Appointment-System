const appointmentModel = require('../models/appointmentModel');
const { validateAppointmentInput } = require('../utils/validators');
const { publishAppointmentCreated } = require('../config/rabbitmq');

// POST /api/appointments  (secured)
// Creates the appointment, THEN publishes a message so the Reminder
// Service can pick it up asynchronously — the patient does not wait
// for an SMS to be sent before getting a response.
async function createAppointment(req, res) {
  try {
    const error = validateAppointmentInput(req.body);
    if (error) return res.status(400).json({ error });

    const reminderQueued = false; // set true below only if publish succeeds
    const appointment = await appointmentModel.createAppointment({
      ...req.body,
      reminderQueued
    });

    // Fire-and-forget publish: this is the asynchronous step.
    const published = publishAppointmentCreated({
      appointmentId: appointment.id,
      patientId: appointment.patient_id,
      patientName: appointment.patient_name,
      patientContact: appointment.patient_contact,
      doctorName: appointment.doctor_name,
      appointmentDate: appointment.appointment_date,
      appointmentTime: appointment.appointment_time
    });

    if (!published) {
      console.warn(`[booking-service] Appointment ${appointment.id} saved, but queue is down. Reminder will not fire.`);
    }

    return res.status(201).json({
      message: 'Appointment booked successfully',
      reminderQueued: published,
      appointment
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// GET /api/appointments  (public — this is the deliberately unsecured read endpoint)
async function getAllAppointments(req, res) {
  try {
    const appointments = await appointmentModel.getAllAppointments();
    return res.status(200).json(appointments);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// GET /api/appointments/:id  (public)
async function getAppointmentById(req, res) {
  try {
    const appointment = await appointmentModel.getAppointmentById(req.params.id);
    if (!appointment) return res.status(404).json({ error: 'Appointment not found' });
    return res.status(200).json(appointment);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// PUT /api/appointments/:id  (secured)
async function updateAppointment(req, res) {
  try {
    const updated = await appointmentModel.updateAppointment(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Appointment not found' });
    return res.status(200).json({ message: 'Appointment updated', appointment: updated });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// DELETE /api/appointments/:id  (secured)
async function deleteAppointment(req, res) {
  try {
    const deleted = await appointmentModel.deleteAppointment(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Appointment not found' });
    return res.status(200).json({ message: 'Appointment cancelled', appointment: deleted });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = {
  createAppointment, getAllAppointments, getAppointmentById,
  updateAppointment, deleteAppointment
};
