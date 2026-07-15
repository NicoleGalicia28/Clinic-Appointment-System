import mongoose, { Schema, Document } from 'mongoose';

export interface IReminder extends Document {
  appointmentId: number;
  patientId: number;
  patientName: string;
  patientContactCache: string;
  doctorName: string;
  appointmentDate: string;
  appointmentTime: string;
  status: 'pending' | 'sent' | 'failed';
  smsAttempts: number;
  lastSyncedAt: Date;
  contactStale: boolean;
  createdAt: Date;
}

const reminderSchema = new Schema<IReminder>({
  appointmentId: { type: Number, required: true, unique: true },
  patientId: { type: Number, required: true },
  patientName: { type: String, required: true },
  patientContactCache: { type: String, required: true },
  doctorName: { type: String, required: true },
  appointmentDate: { type: String, required: true },
  appointmentTime: { type: String, required: true },
  status: { type: String, default: 'pending' },
  smsAttempts: { type: Number, default: 0 },
  lastSyncedAt: { type: Date, default: Date.now },
  contactStale: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model<IReminder>('Reminder', reminderSchema);
