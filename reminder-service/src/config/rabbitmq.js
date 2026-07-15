// RabbitMQ connection for the Reminder Service (the CONSUMER side).
require('dotenv').config();
const amqp = require('amqplib');

async function connectRabbitMQ() {
  const connection = await amqp.connect(process.env.RABBITMQ_URL);
  const channel = await connection.createChannel();

  connection.on('close', () => {
    console.warn('[reminder-service] RabbitMQ connection closed, will need a restart to reconnect');
  });

  return channel;
}

module.exports = { connectRabbitMQ };
