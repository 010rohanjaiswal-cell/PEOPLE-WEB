const express = require('express');
const router = express.Router();
const freelancerController = require('../controllers/freelancerController');
const authMiddleware = require('../middleware/authMiddleware');

// Freelancer routes
router.post('/submit-verification', authMiddleware.verifyToken, freelancerController.submitVerification);
router.get('/verification-status', authMiddleware.verifyToken, freelancerController.getVerificationStatus);
router.get('/wallet', authMiddleware.verifyToken, freelancerController.getWallet);
router.post('/request-withdrawal', authMiddleware.verifyToken, freelancerController.requestWithdrawal);
router.get('/withdrawal-history', authMiddleware.verifyToken, freelancerController.getWithdrawalHistory);
router.get('/assigned-jobs', authMiddleware.verifyToken, freelancerController.getAssignedJobs);
router.post('/pickup-job/:jobId', authMiddleware.verifyToken, freelancerController.pickupJob);
router.post('/make-offer/:jobId', authMiddleware.verifyToken, freelancerController.makeOffer);
router.post('/mark-complete/:jobId', authMiddleware.verifyToken, freelancerController.markJobComplete);

module.exports = router;
