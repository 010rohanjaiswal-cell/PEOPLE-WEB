const express = require('express');
const router = express.Router();
const debugController = require('../controllers/debugController');
const authMiddleware = require('../middleware/authMiddleware');

// Debug routes (available in all environments for testing)
router.get('/jobs', authMiddleware.verifyToken, debugController.debugJobs);
router.post('/clear-jobs', authMiddleware.verifyToken, debugController.clearJobs);
router.post('/add-test-job', authMiddleware.verifyToken, debugController.addTestJob);

// Fallback debug routes without auth for testing
router.get('/jobs-public', debugController.debugJobs);
router.post('/clear-jobs-public', debugController.clearJobs);
router.post('/add-test-job-public', debugController.addTestJob);

// Payment debug route (always available)
router.get('/payment', debugController.debugPayment);

// Update job status for testing
router.post('/update-job-status/:jobId', debugController.updateJobStatus);

module.exports = router;
