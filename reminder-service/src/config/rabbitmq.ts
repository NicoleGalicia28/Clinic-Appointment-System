import { config } from 'dotenv';
config();
import amqplib from 'amqplib';

let channel: amqplib.Channel | null = null;

export function getChannel(): amqplib.Channel | null {
  return channel;
}

export async function connectRabbitMQ(): Promise<amqplib.Channel> {
  try {
    const connection = await amqplib.connect(process.env.RABBITMQ_URL!);
    const ch: amqplib.Channel = await connection.createChannel();

    ch.on('error', (err: Error) => {
      console.error('[reminder-service] RabbitMQ channel error:', err.message);
      channel = null;
    });

    connection.on('error', (err: Error) => {
      console.error('[reminder-service] RabbitMQ connection error:', err.message);
      channel = null;
    });

    connection.on('close', () => {
      console.warn('[reminder-service] RabbitMQ connection closed');
      channel = null;
    });

    channel = ch;
    console.log('[reminder-service] connected to RabbitMQ');
    return ch;
  } catch (err: any) {
    console.warn('[reminder-service] Could not connect to RabbitMQ:', err.message);
    console.warn('[reminder-service] HTTP server will start; consumers will not run until RabbitMQ is back.');
    throw err;
  }
}
