import { Request, Response } from 'express';
import * as appointmentModel from '../models/appointmentModel';
import { validateAppointmentInput } from '../utils/validators';
import { publishAppointmentCreated } from '../config/rabbitmq';
import { JwtPayload } from 'jsonwebtoken';

interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}

export async function createAppointment(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const error = validateAppointmentInput(req.body);
    if (error) {
      res.status(400).json({ error });
      return;
    }

    const reminderQueued = false;
    const appointment = await appointmentModel.createAppointment({
      ...req.body,
      reminderQueued,
    });

    const published = publishAppointmentCreated({
      appointmentId: appointment.id,
      patientId: appointment.patient_id,
      patientName: appointment.patient_name,
      patientContact: appointment.patient_contact,
      doctorName: appointment.doctor_name,
      appointmentDate: appointment.appointment_date,
      appointmentTime: appointment.appointment_time,
    });

    if (!published) {
      console.warn(`[booking-service] Appointment ${appointment.id} saved, but queue is down. Reminder will not fire.`);
    }

    res.status(201).json({
      message: 'Appointment booked successfully',
      reminderQueued: published,
      appointment,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getAllAppointments(_req: Request, res: Response): Promise<void> {
  try {
    const appointments = await appointmentModel.getAllAppointments();
    res.status(200).json(appointments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getAppointmentById(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params.id as string;
    const appointment = await appointmentModel.getAppointmentById(id);
    if (!appointment) {
      res.status(404).json({ error: 'Appointment not found' });
      return;
    }
    res.status(200).json(appointment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function updateAppointment(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params.id as string;
    const updated = await appointmentModel.updateAppointment(id, req.body);
    if (!updated) {
      res.status(404).json({ error: 'Appointment not found' });
      return;
    }
    res.status(200).json({ message: 'Appointment updated', appointment: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function deleteAppointment(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params.id as string;
    const deleted = await appointmentModel.deleteAppointment(id);
    if (!deleted) {
      res.status(404).json({ error: 'Appointment not found' });
      return;
    }
    res.status(200).json({ message: 'Appointment cancelled', appointment: deleted });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}
