const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');

// Create dummy controller for graceful degradation
const paymentController = {
  testPaymentService: (req, res) => {
    res.json({
      success: true,
      message: 'Payment service test endpoint working',
      status: 'dummy_controller'
    });
  },
  createUPIPayment: (req, res) => res.status(503).json({ success: false, message: 'Payment service temporarily unavailable' }),
  verifyUPIPayment: (req, res) => res.status(503).json({ success: false, message: 'Payment service temporarily unavailable' }),
  getPaymentStatus: (req, res) => res.status(503).json({ success: false, message: 'Payment service temporarily unavailable' })
};

// Try to load real payment controller, but don't fail if it's not available
let realController = null;
try {
  realController = require('../controllers/paymentController');
  console.log('✅ Payment controller loaded successfully');
} catch (error) {
  console.warn('⚠️ Payment controller not available, trying minimal controller:', error.message);
  try {
    realController = require('../controllers/paymentControllerMinimal');
    console.log('✅ Minimal payment controller loaded successfully');
  } catch (minimalError) {
    console.warn('⚠️ Minimal payment controller not available, using dummy controller:', minimalError.message);
  }
}

// Use real controller if available, otherwise use dummy
if (realController) {
  paymentController.createUPIPayment = realController.createUPIPayment;
  paymentController.verifyUPIPayment = realController.verifyUPIPayment;
  paymentController.getPaymentStatus = realController.getPaymentStatus;
  paymentController.testPaymentService = realController.testPaymentService;
}

// Payment routes
router.get('/test', paymentController.testPaymentService);
router.post('/upi/:jobId', authMiddleware.verifyToken, paymentController.createUPIPayment);
router.post('/verify', authMiddleware.verifyToken, paymentController.verifyUPIPayment);
router.get('/status/:jobId', authMiddleware.verifyToken, paymentController.getPaymentStatus);

module.exports = router;
