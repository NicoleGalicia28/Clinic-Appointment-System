import { config } from 'dotenv';
config();
import express, { Request, Response } from 'express';
import cors from 'cors';
import morgan from 'morgan';

import { initDb } from './config/db';
import { connectRabbitMQ } from './config/rabbitmq';
import { startAppointmentConsumer } from './consumers/appointmentConsumer';
import { startPatientUpdateConsumer } from './consumers/patientUpdateConsumer';
import Reminder from './models/reminderModel';

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.get('/health', (_req: Request, res: Response) =>
  res.status(200).json({ service: 'reminder-service', status: 'ok' })
);

app.get('/api/reminders', async (_req: Request, res: Response) => {
  try {
    const reminders = await Reminder.find().sort({ createdAt: -1 });
    res.status(200).json(reminders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.use((_req: Request, res: Response) =>
  res.status(404).json({ error: 'Route not found' })
);

const PORT = process.env.PORT || 4003;

async function start(): Promise<void> {
  await initDb();
  const channel = await connectRabbitMQ();
  await startAppointmentConsumer(channel);
  await startPatientUpdateConsumer(channel);
  app.listen(PORT, () => console.log(`[reminder-service] running on port ${PORT}`));
}

start().catch((err: Error) => {
  console.error('[reminder-service] Fatal startup error:', err);
  process.exit(1);
});
