const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const authMiddleware = require('../middleware/authMiddleware');

// Payment routes
router.post('/upi/:jobId', authMiddleware.verifyToken, paymentController.createUPIPayment);
router.post('/verify', authMiddleware.verifyToken, paymentController.verifyUPIPayment);
router.get('/status/:jobId', authMiddleware.verifyToken, paymentController.getPaymentStatus);

module.exports = router;
