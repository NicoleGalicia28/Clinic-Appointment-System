// Consumes "patient.updated" (published by Patient Service when a
// patient edits their contact info in MySQL).
//
// THIS IS THE DATA-SYNCHRONIZATION + CONFLICT-HANDLING SCENARIO:
// MySQL (patient-service) is the source of truth for contact info.
// MongoDB (reminder-service) keeps a denormalized cached copy so it
// doesn't have to call Patient Service synchronously every time it
// sends a reminder. That cache can go stale, so we apply a simple
// "last write wins, but only if newer" rule:
//   - if the incoming update is NEWER than what we have cached, apply it.
//   - if a reminder for that patient was already marked "sent" using the
//     OLD contact info, we flag it contactStale=true instead of silently
//     rewriting history, so staff can be alerted.
const Reminder = require('../models/reminderModel');
const { QUEUE_PATIENT_UPDATED } = require('./queueNames');

async function startPatientUpdateConsumer(channel) {
  await channel.assertQueue(QUEUE_PATIENT_UPDATED, { durable: true });

  channel.consume(QUEUE_PATIENT_UPDATED, async (msg) => {
    if (!msg) return;
    try {
      const data = JSON.parse(msg.content.toString());
      console.log(`[reminder-service] received patient.updated for patient #${data.patientId}`);

      const incomingUpdatedAt = new Date(data.updatedAt);
      const affected = await Reminder.find({ patientId: data.patientId });

      for (const reminder of affected) {
        // Conflict rule: only overwrite the cache if this update is
        // actually newer than what we last synced.
        if (incomingUpdatedAt <= reminder.lastSyncedAt) {
          console.warn(`[reminder-service] Stale patient.updated event ignored for appointment #${reminder.appointmentId}`);
          continue;
        }

        const contactChangedAfterSend = reminder.status === 'sent';

        reminder.patientName = data.patientName;
        reminder.patientContactCache = data.patientContact;
        reminder.lastSyncedAt = incomingUpdatedAt;
        reminder.contactStale = contactChangedAfterSend; // flag for staff review

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

module.exports = { startPatientUpdateConsumer };
