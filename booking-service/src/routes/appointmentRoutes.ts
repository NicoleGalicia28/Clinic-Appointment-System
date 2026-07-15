import { Router } from 'express';
import * as controller from '../controllers/appointmentController';
import { verifyToken } from '../middleware/auth';

const router = Router();

router.get('/', controller.getAllAppointments);
router.get('/:id', controller.getAppointmentById);
router.post('/', verifyToken, controller.createAppointment);
router.put('/:id', verifyToken, controller.updateAppointment);
router.delete('/:id', verifyToken, controller.deleteAppointment);

export default router;
