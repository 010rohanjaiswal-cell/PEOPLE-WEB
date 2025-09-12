const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');

// User routes
router.post('/profile-setup', authMiddleware.verifyToken, userController.profileSetup);
router.get('/profile', authMiddleware.verifyToken, userController.getProfile);
router.put('/update-profile', authMiddleware.verifyToken, userController.updateProfile);
router.get('/active-jobs-status', authMiddleware.verifyToken, userController.getActiveJobsStatus);

module.exports = router;
