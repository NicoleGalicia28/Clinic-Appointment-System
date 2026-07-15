require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const { initDb } = require('./config/db');
const { connectRabbitMQ } = require('./config/rabbitmq');
const { startAppointmentConsumer } = require('./consumers/appointmentConsumer');
const { startPatientUpdateConsumer } = require('./consumers/patientUpdateConsumer');
const Reminder = require('./models/reminderModel');

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.get('/health', (req, res) => res.status(200).json({ service: 'reminder-service', status: 'ok' }));

// Public read endpoint — mainly for the demo, so the panel can see
// reminders that were created asynchronously without touching Mongo directly.
app.get('/api/reminders', async (req, res) => {
  try {
    const reminders = await Reminder.find().sort({ createdAt: -1 });
    res.status(200).json(reminders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.use((req, res) => res.status(404).json({ error: 'Route not found' }));

const PORT = process.env.PORT || 4003;

async function start() {
  await initDb();
  const channel = await connectRabbitMQ();
  await startAppointmentConsumer(channel);
  await startPatientUpdateConsumer(channel);
  app.listen(PORT, () => console.log(`[reminder-service] running on port ${PORT}`));
}

start().catch((err) => {
  console.error('[reminder-service] Fatal startup error:', err);
  process.exit(1);
});
