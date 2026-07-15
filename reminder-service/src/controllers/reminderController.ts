import { Request, Response } from 'express';
import Reminder from '../models/reminderModel';

export async function getAllReminders(_req: Request, res: Response): Promise<void> {
  try {
    const reminders = await Reminder.find().sort({ createdAt: -1 });
    res.status(200).json(reminders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getReminderById(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params.id as string;
    const reminder = await Reminder.findById(id);
    if (!reminder) {
      res.status(404).json({ error: 'Reminder not found' });
      return;
    }
    res.status(200).json(reminder);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}
