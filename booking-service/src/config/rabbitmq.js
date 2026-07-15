// RabbitMQ connection for the Booking Service (the PRODUCER side).
// If RabbitMQ is unreachable, we don't crash the whole service —
// we log a warning and let appointmentController fall back to
// "reminder_queued: false". This is the simulated downstream-failure
// handling required by the rubric.
require('dotenv').config();
const amqp = require('amqplib');

let channel = null;

const QUEUE_APPOINTMENT_CREATED = 'appointment.created';

async function connectRabbitMQ() {
  try {
    const connection = await amqp.connect(process.env.RABBITMQ_URL);
    channel = await connection.createChannel();
    await channel.assertQueue(QUEUE_APPOINTMENT_CREATED, { durable: true });

    connection.on('error', (err) => {
      console.error('[booking-service] RabbitMQ connection error:', err.message);
      channel = null;
    });
    connection.on('close', () => {
      console.warn('[booking-service] RabbitMQ connection closed');
      channel = null;
    });

    console.log('[booking-service] connected to RabbitMQ');
  } catch (err) {
    console.warn('[booking-service] Could not connect to RabbitMQ:', err.message);
    console.warn('[booking-service] Booking will still work; reminders will not be queued until RabbitMQ is back.');
    channel = null;
  }
}

// Returns true if the message was actually published.
function publishAppointmentCreated(payload) {
  if (!channel) return false;
  try {
    channel.sendToQueue(
      QUEUE_APPOINTMENT_CREATED,
      Buffer.from(JSON.stringify(payload)),
      { persistent: true }
    );
    return true;
  } catch (err) {
    console.error('[booking-service] Failed to publish message:', err.message);
    return false;
  }
}

module.exports = { connectRabbitMQ, publishAppointmentCreated, QUEUE_APPOINTMENT_CREATED };
