const express = require('express');
const router = express.Router();
const debugController = require('../controllers/debugController');
const authMiddleware = require('../middleware/authMiddleware');

// Debug routes (only in development)
if (process.env.NODE_ENV !== 'production') {
  router.get('/jobs', authMiddleware.verifyToken, debugController.debugJobs);
  router.post('/clear-jobs', authMiddleware.verifyToken, debugController.clearJobs);
  router.post('/add-test-job', authMiddleware.verifyToken, debugController.addTestJob);
}

module.exports = router;
