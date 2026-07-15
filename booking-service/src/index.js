require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const { initDb } = require('./config/db');
const { connectRabbitMQ } = require('./config/rabbitmq');
const appointmentRoutes = require('./routes/appointmentRoutes');

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Public health check — handy for the demo and for Postman smoke tests.
app.get('/health', (req, res) => res.status(200).json({ service: 'booking-service', status: 'ok' }));

app.use('/api/appointments', appointmentRoutes);

// 404 handler for unknown routes
app.use((req, res) => res.status(404).json({ error: 'Route not found' }));

// Generic error handler (catches anything thrown/next(err))
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Unexpected server error' });
});

const PORT = process.env.PORT || 4001;

async function start() {
  await initDb();
  await connectRabbitMQ(); // does not throw even if RabbitMQ is down
  app.listen(PORT, () => console.log(`[booking-service] running on port ${PORT}`));
}

start();
