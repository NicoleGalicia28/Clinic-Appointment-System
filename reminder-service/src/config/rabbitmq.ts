import { config } from 'dotenv';
config();
import amqplib from 'amqplib';

export async function connectRabbitMQ(): Promise<amqplib.Channel> {
  const connection = await amqplib.connect(process.env.RABBITMQ_URL!);
  const channel: amqplib.Channel = await connection.createChannel();

  connection.on('close', () => {
    console.warn('[reminder-service] RabbitMQ connection closed, will need a restart to reconnect');
  });

  return channel;
}
