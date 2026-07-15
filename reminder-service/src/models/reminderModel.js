const mongoose = require('mongoose');

// This document doubles as (a) the reminder record and (b) a cached,
// denormalized copy of the patient's contact info — this cache is what
// gets synchronized whenever Patient Service publishes "patient.updated".
const reminderSchema = new mongoose.Schema({
  appointmentId: { type: Number, required: true, unique: true },
  patientId: { type: Number, required: true },
  patientName: String,
  patientContactCache: String,
  doctorName: String,
  appointmentDate: String,
  appointmentTime: String,
  status: { type: String, default: 'pending' }, // pending | sent | failed
  smsAttempts: { type: Number, default: 0 },
  lastSyncedAt: { type: Date, default: Date.now }, // when contact cache was last updated
  contactStale: { type: Boolean, default: false }, // flips true if a conflict was detected
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Reminder', reminderSchema);
