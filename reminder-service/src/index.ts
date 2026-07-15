import { config } from 'dotenv';
config();
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import morgan from 'morgan';

import { initDb } from './config/db';
import { connectRabbitMQ } from './config/rabbitmq';
import { startAppointmentConsumer } from './consumers/appointmentConsumer';
import { startPatientUpdateConsumer } from './consumers/patientUpdateConsumer';
import reminderRoutes from './routes/reminderRoutes';

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.get('/health', (_req: Request, res: Response) =>
  res.status(200).json({ service: 'reminder-service', status: 'ok' })
);

app.use('/api/reminders', reminderRoutes);

app.use((_req: Request, res: Response) =>
  res.status(404).json({ error: 'Route not found' })
);

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Unexpected server error' });
});

const PORT = process.env.PORT || 4003;

async function start(): Promise<void> {
  await initDb();

  try {
    const channel = await connectRabbitMQ();
    await startAppointmentConsumer(channel);
    await startPatientUpdateConsumer(channel);
  } catch (err: any) {
    console.warn('[reminder-service] RabbitMQ unavailable. HTTP server will start without consumers.');
  }

  app.listen(PORT, () => console.log(`[reminder-service] running on port ${PORT}`));
}

start().catch((err: Error) => {
  console.error('[reminder-service] Fatal startup error:', err);
  process.exit(1);
});
