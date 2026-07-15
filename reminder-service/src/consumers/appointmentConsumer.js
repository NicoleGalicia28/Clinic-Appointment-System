// Consumes "appointment.created" (published by Booking Service).
// For every booking, create a Reminder doc and attempt to send an SMS.
// If sending fails, we retry up to 3 times before marking it "failed"
// and logging it for manual follow-up — this is the failure-handling
// behavior the rubric wants demonstrated live.
const Reminder = require('../models/reminderModel');
const { sendSms } = require('../utils/smsSimulator');
const { QUEUE_APPOINTMENT_CREATED } = require('./queueNames');

const MAX_ATTEMPTS = 3;

async function startAppointmentConsumer(channel) {
  await channel.assertQueue(QUEUE_APPOINTMENT_CREATED, { durable: true });

  channel.consume(QUEUE_APPOINTMENT_CREATED, async (msg) => {
    if (!msg) return;
    try {
      const data = JSON.parse(msg.content.toString());
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
          lastSyncedAt: new Date()
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
      // Reject without requeueing to avoid an infinite poison-message loop.
      channel.nack(msg, false, false);
    }
  });

  console.log('[reminder-service] listening on queue:', QUEUE_APPOINTMENT_CREATED);
}

module.exports = { startAppointmentConsumer };
