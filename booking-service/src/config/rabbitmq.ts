import { config } from 'dotenv';
config();
import amqplib from 'amqplib';

let channel: amqplib.Channel | null = null;

export const QUEUE_APPOINTMENT_CREATED = 'appointment.created';

export async function connectRabbitMQ(): Promise<void> {
  try {
    const connection = await amqplib.connect(process.env.RABBITMQ_URL!);
    channel = await connection.createChannel();
    await channel.assertQueue(QUEUE_APPOINTMENT_CREATED, { durable: true });

    connection.on('error', (err: Error) => {
      console.error('[booking-service] RabbitMQ connection error:', err.message);
      channel = null;
    });
    connection.on('close', () => {
      console.warn('[booking-service] RabbitMQ connection closed');
      channel = null;
    });

    console.log('[booking-service] connected to RabbitMQ');
  } catch (err: any) {
    console.warn('[booking-service] Could not connect to RabbitMQ:', err.message);
    console.warn('[booking-service] Booking will still work; reminders will not be queued until RabbitMQ is back.');
    channel = null;
  }
}

interface AppointmentPayload {
  appointmentId: number;
  patientId: number;
  patientName: string;
  patientContact: string;
  doctorName: string;
  appointmentDate: string;
  appointmentTime: string;
}

export function publishAppointmentCreated(payload: AppointmentPayload): boolean {
  if (!channel) return false;
  try {
    channel.sendToQueue(
      QUEUE_APPOINTMENT_CREATED,
      Buffer.from(JSON.stringify(payload)),
      { persistent: true }
    );
    return true;
  } catch (err: any) {
    console.error('[booking-service] Failed to publish message:', err.message);
    return false;
  }
}
