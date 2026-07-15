require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const { initDb } = require('./config/db');
const { connectRabbitMQ } = require('./config/rabbitmq');
const patientRoutes = require('./routes/patientRoutes');

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.get('/health', (req, res) => res.status(200).json({ service: 'patient-service', status: 'ok' }));

app.use('/api/patients', patientRoutes);

app.use((req, res) => res.status(404).json({ error: 'Route not found' }));
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Unexpected server error' });
});

const PORT = process.env.PORT || 4002;

async function start() {
  await initDb();
  await connectRabbitMQ();
  app.listen(PORT, () => console.log(`[patient-service] running on port ${PORT}`));
}

start();
