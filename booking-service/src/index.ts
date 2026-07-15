import { config } from 'dotenv';
config();
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import morgan from 'morgan';

import { initDb } from './config/db';
import { connectRabbitMQ } from './config/rabbitmq';
import appointmentRoutes from './routes/appointmentRoutes';

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.get('/health', (_req: Request, res: Response) =>
  res.status(200).json({ service: 'booking-service', status: 'ok' })
);

app.use('/api/appointments', appointmentRoutes);

app.use((_req: Request, res: Response) =>
  res.status(404).json({ error: 'Route not found' })
);

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Unexpected server error' });
});

const PORT = process.env.PORT || 4001;

async function start(): Promise<void> {
  await initDb();
  await connectRabbitMQ();
  app.listen(PORT, () => console.log(`[booking-service] running on port ${PORT}`));
}

start();
