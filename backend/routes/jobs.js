const express = require('express');
const router = express.Router();
const jobController = require('../controllers/jobController');
const authMiddleware = require('../middleware/authMiddleware');

// Job routes
router.get('/available', authMiddleware.verifyToken, jobController.getAvailableJobs);
router.get('/:jobId', authMiddleware.verifyToken, jobController.getJobById);
router.post('/:jobId/apply', authMiddleware.verifyToken, jobController.applyForJob);
router.post('/:jobId/pickup', authMiddleware.verifyToken, jobController.pickupJob);

module.exports = router;
