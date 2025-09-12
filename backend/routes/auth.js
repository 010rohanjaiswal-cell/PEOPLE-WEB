const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

// Authentication routes
router.post('/authenticate', authController.authenticate);
router.post('/logout', authMiddleware.verifyToken, authController.logout);
router.post('/switch-role', authMiddleware.verifyToken, authController.switchRole);
router.get('/can-switch-role', authMiddleware.verifyToken, authController.canSwitchRole);

module.exports = router;
