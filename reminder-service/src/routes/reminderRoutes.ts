import { Router } from 'express';
import * as controller from '../controllers/reminderController';

const router = Router();

router.get('/', controller.getAllReminders);
router.get('/:id', controller.getReminderById);

export default router;
