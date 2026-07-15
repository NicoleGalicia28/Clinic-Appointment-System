// RabbitMQ producer for Patient Service.
// Publishes "patient.updated" whenever contact info changes, so the
// Reminder Service can keep its cached copy in sync (see reminder-service
// /src/consumers/patientUpdateConsumer.js for the conflict-handling logic).
require('dotenv').config();
const amqp = require('amqplib');

let channel = null;
const QUEUE_PATIENT_UPDATED = 'patient.updated';

async function connectRabbitMQ() {
  try {
    const connection = await amqp.connect(process.env.RABBITMQ_URL);
    channel = await connection.createChannel();
    await channel.assertQueue(QUEUE_PATIENT_UPDATED, { durable: true });

    connection.on('close', () => { channel = null; });
    console.log('[patient-service] connected to RabbitMQ');
  } catch (err) {
    console.warn('[patient-service] Could not connect to RabbitMQ:', err.message);
    channel = null;
  }
}

function publishPatientUpdated(payload) {
  if (!channel) return false;
  channel.sendToQueue(
    QUEUE_PATIENT_UPDATED,
    Buffer.from(JSON.stringify(payload)),
    { persistent: true }
  );
  return true;
}

module.exports = { connectRabbitMQ, publishPatientUpdated, QUEUE_PATIENT_UPDATED };
