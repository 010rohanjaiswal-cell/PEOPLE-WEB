const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middleware/authMiddleware');

// Admin routes
router.get('/freelancer-verifications', authMiddleware.verifyToken, authMiddleware.verifyAdmin, adminController.getFreelancerVerifications);
router.post('/approve-freelancer/:id', authMiddleware.verifyToken, authMiddleware.verifyAdmin, adminController.approveFreelancer);
router.post('/reject-freelancer/:id', authMiddleware.verifyToken, authMiddleware.verifyAdmin, adminController.rejectFreelancer);
router.get('/withdrawal-requests', authMiddleware.verifyToken, authMiddleware.verifyAdmin, adminController.getWithdrawalRequests);
router.post('/approve-withdrawal/:id', authMiddleware.verifyToken, authMiddleware.verifyAdmin, adminController.approveWithdrawal);
router.post('/reject-withdrawal/:id', authMiddleware.verifyToken, authMiddleware.verifyAdmin, adminController.rejectWithdrawal);

module.exports = router;
