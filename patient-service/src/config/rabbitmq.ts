import { config } from 'dotenv';
config();
import amqplib from 'amqplib';

let channel: amqplib.Channel | null = null;

export const QUEUE_PATIENT_UPDATED = 'patient.updated';

export async function connectRabbitMQ(): Promise<void> {
  try {
    const connection = await amqplib.connect(process.env.RABBITMQ_URL!);
    channel = await connection.createChannel();
    await channel.assertQueue(QUEUE_PATIENT_UPDATED, { durable: true });

    connection.on('close', () => {
      channel = null;
    });
    console.log('[patient-service] connected to RabbitMQ');
  } catch (err: any) {
    console.warn('[patient-service] Could not connect to RabbitMQ:', err.message);
    channel = null;
  }
}

interface PatientUpdatePayload {
  patientId: number;
  patientName: string;
  patientContact: string;
  updatedAt: string;
}

export function publishPatientUpdated(payload: PatientUpdatePayload): boolean {
  if (!channel) return false;
  channel.sendToQueue(
    QUEUE_PATIENT_UPDATED,
    Buffer.from(JSON.stringify(payload)),
    { persistent: true }
  );
  return true;
}
