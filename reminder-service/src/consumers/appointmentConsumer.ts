import { Channel } from 'amqplib';
import Reminder from '../models/reminderModel';
import { sendSms } from '../utils/smsSimulator';
import { QUEUE_APPOINTMENT_CREATED } from './queueNames';

const MAX_ATTEMPTS = 3;

interface AppointmentMessage {
  appointmentId: number;
  patientId: number;
  patientName: string;
  patientContact: string;
  doctorName: string;
  appointmentDate: string;
  appointmentTime: string;
}

function validateMessage(data: any): data is AppointmentMessage {
  return (
    typeof data.appointmentId === 'number' &&
    typeof data.patientId === 'number' &&
    typeof data.patientName === 'string' &&
    typeof data.patientContact === 'string' &&
    typeof data.doctorName === 'string' &&
    typeof data.appointmentDate === 'string' &&
    typeof data.appointmentTime === 'string'
  );
}

export async function startAppointmentConsumer(channel: Channel): Promise<void> {
  await channel.prefetch(1);
  await channel.assertQueue(QUEUE_APPOINTMENT_CREATED, { durable: true });

  channel.consume(QUEUE_APPOINTMENT_CREATED, async (msg) => {
    if (!msg) return;
    try {
      const data = JSON.parse(msg.content.toString());

      if (!validateMessage(data)) {
        console.error('[reminder-service] Invalid appointment.created message — missing required fields');
        channel.nack(msg, false, false);
        return;
      }

      console.log(`[reminder-service] received appointment.created for appointment #${data.appointmentId}`);

      const reminder = await Reminder.findOneAndUpdate(
        { appointmentId: data.appointmentId },
        {
          appointmentId: data.appointmentId,
          patientId: data.patientId,
          patientName: data.patientName,
          patientContactCache: data.patientContact,
          doctorName: data.doctorName,
          appointmentDate: data.appointmentDate,
          appointmentTime: data.appointmentTime,
          lastSyncedAt: new Date(),
        },
        { upsert: true, new: true }
      );

      let sent = false;
      let attempts = 0;
      while (!sent && attempts < MAX_ATTEMPTS) {
        attempts += 1;
        sent = sendSms(
          reminder.patientContactCache,
          `Reminder: appointment with ${reminder.doctorName} on ${reminder.appointmentDate} at ${reminder.appointmentTime}`
        );
      }

      reminder.status = sent ? 'sent' : 'failed';
      reminder.smsAttempts = attempts;
      await reminder.save();

      if (!sent) {
        console.error(`[reminder-service] Giving up on appointment #${data.appointmentId} after ${attempts} attempts. Flagged for manual follow-up.`);
      }

      channel.ack(msg);
    } catch (err) {
      console.error('[reminder-service] Error processing appointment.created message:', err);
      channel.nack(msg, false, false);
    }
  });

  console.log('[reminder-service] listening on queue:', QUEUE_APPOINTMENT_CREATED);
}
