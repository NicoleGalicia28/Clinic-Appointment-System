const express = require('express');
const router = express.Router();
const controller = require('../controllers/patientController');
const { verifyToken } = require('../middleware/auth');

// Public
router.post('/register', controller.register);
router.post('/login', controller.login);

// Secured
router.get('/:id', verifyToken, controller.getProfile);
router.put('/:id', verifyToken, controller.updateProfile);
router.delete('/:id', verifyToken, controller.deleteProfile);

module.exports = router;
