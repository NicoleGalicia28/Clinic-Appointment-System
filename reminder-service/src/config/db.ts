import { config } from 'dotenv';
config();
import mongoose from 'mongoose';

export async function initDb(): Promise<void> {
  await mongoose.connect(process.env.MONGO_URI!);
  console.log('[reminder-service] connected to MongoDB');
}
