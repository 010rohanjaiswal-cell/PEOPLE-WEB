const express = require('express');
const router = express.Router();
const clientController = require('../controllers/clientController');
const authMiddleware = require('../middleware/authMiddleware');

// Client routes
router.post('/post-job', authMiddleware.verifyToken, clientController.postJob);
router.get('/my-jobs', authMiddleware.verifyToken, clientController.getMyJobs);
router.get('/job-history', authMiddleware.verifyToken, clientController.getJobHistory);
router.post('/accept-offer/:jobId', authMiddleware.verifyToken, clientController.acceptOffer);
router.post('/reject-offer/:jobId', authMiddleware.verifyToken, clientController.rejectOffer);
router.post('/pay/:jobId', authMiddleware.verifyToken, clientController.payJob);
router.put('/job/:jobId', authMiddleware.verifyToken, clientController.updateJob);
router.delete('/job/:jobId', authMiddleware.verifyToken, clientController.deleteJob);

module.exports = router;
