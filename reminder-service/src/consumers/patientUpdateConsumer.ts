import { Channel } from 'amqplib';
import Reminder from '../models/reminderModel';
import { QUEUE_PATIENT_UPDATED } from './queueNames';

interface PatientUpdateMessage {
  patientId: number;
  patientName: string;
  patientContact: string;
  updatedAt: string;
}

function validateMessage(data: any): data is PatientUpdateMessage {
  return (
    typeof data.patientId === 'number' &&
    typeof data.patientName === 'string' &&
    typeof data.patientContact === 'string' &&
    typeof data.updatedAt === 'string'
  );
}

export async function startPatientUpdateConsumer(channel: Channel): Promise<void> {
  await channel.prefetch(1);
  await channel.assertQueue(QUEUE_PATIENT_UPDATED, { durable: true });

  channel.consume(QUEUE_PATIENT_UPDATED, async (msg) => {
    if (!msg) return;
    try {
      const data = JSON.parse(msg.content.toString());

      if (!validateMessage(data)) {
        console.error('[reminder-service] Invalid patient.updated message — missing required fields');
        channel.nack(msg, false, false);
        return;
      }

      console.log(`[reminder-service] received patient.updated for patient #${data.patientId}`);

      const incomingUpdatedAt = new Date(data.updatedAt);
      const affected = await Reminder.find({ patientId: data.patientId });

      for (const reminder of affected) {
        if (incomingUpdatedAt <= reminder.lastSyncedAt) {
          console.warn(`[reminder-service] Stale patient.updated event ignored for appointment #${reminder.appointmentId}`);
          continue;
        }

        const contactChangedAfterSend = reminder.status === 'sent';

        reminder.patientName = data.patientName;
        reminder.patientContactCache = data.patientContact;
        reminder.lastSyncedAt = incomingUpdatedAt;
        reminder.contactStale = contactChangedAfterSend;

        await reminder.save();

        if (contactChangedAfterSend) {
          console.warn(`[reminder-service] Contact changed AFTER reminder was sent for appointment #${reminder.appointmentId} — flagged contactStale.`);
        }
      }

      channel.ack(msg);
    } catch (err) {
      console.error('[reminder-service] Error processing patient.updated message:', err);
      channel.nack(msg, false, false);
    }
  });

  console.log('[reminder-service] listening on queue:', QUEUE_PATIENT_UPDATED);
}
