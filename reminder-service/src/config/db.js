require('dotenv').config();
const mongoose = require('mongoose');

async function initDb() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('[reminder-service] connected to MongoDB');
}

module.exports = { initDb };
