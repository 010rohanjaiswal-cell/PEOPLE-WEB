const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');

// Try to load payment controller, but don't fail if it's not available
let paymentController;
try {
  paymentController = require('../controllers/paymentController');
} catch (error) {
  console.warn('Payment controller not available:', error.message);
  // Create dummy controller for graceful degradation
  paymentController = {
    createUPIPayment: (req, res) => res.status(503).json({ success: false, message: 'Payment service temporarily unavailable' }),
    verifyUPIPayment: (req, res) => res.status(503).json({ success: false, message: 'Payment service temporarily unavailable' }),
    getPaymentStatus: (req, res) => res.status(503).json({ success: false, message: 'Payment service temporarily unavailable' })
  };
}

// Payment routes
router.post('/upi/:jobId', authMiddleware.verifyToken, paymentController.createUPIPayment);
router.post('/verify', authMiddleware.verifyToken, paymentController.verifyUPIPayment);
router.get('/status/:jobId', authMiddleware.verifyToken, paymentController.getPaymentStatus);

module.exports = router;
