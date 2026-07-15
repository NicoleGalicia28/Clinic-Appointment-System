const express = require('express');
const router = express.Router();
const controller = require('../controllers/appointmentController');
const { verifyToken } = require('../middleware/auth');

// Public read endpoints (comparison point for the security demo)
router.get('/', controller.getAllAppointments);
router.get('/:id', controller.getAppointmentById);

// Secured, state-changing endpoints
router.post('/', verifyToken, controller.createAppointment);
router.put('/:id', verifyToken, controller.updateAppointment);
router.delete('/:id', verifyToken, controller.deleteAppointment);

module.exports = router;
