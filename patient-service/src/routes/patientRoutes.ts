import { Router } from 'express';
import * as controller from '../controllers/patientController';
import { verifyToken } from '../middleware/auth';

const router = Router();

router.post('/register', controller.register);
router.post('/login', controller.login);
router.get('/:id', verifyToken, controller.getProfile);
router.put('/:id', verifyToken, controller.updateProfile);
router.delete('/:id', verifyToken, controller.deleteProfile);

export default router;
