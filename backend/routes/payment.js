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
try {
  const realController = require('../controllers/paymentController');
  console.log('✅ Payment controller loaded successfully');
  // Override with real controller
  Object.assign(paymentController, realController);
} catch (error) {
  console.warn('⚠️ Payment controller not available, trying minimal controller:', error.message);
  try {
    const minimalController = require('../controllers/paymentControllerMinimal');
    console.log('✅ Minimal payment controller loaded successfully');
    // Override with minimal controller
    Object.assign(paymentController, minimalController);
  } catch (minimalError) {
    console.warn('⚠️ Minimal payment controller not available, using dummy controller:', minimalError.message);
  }
}

// Payment routes
router.get('/test', paymentController.testPaymentService);
router.post('/upi/:jobId', authMiddleware.verifyToken, paymentController.createUPIPayment);
router.post('/verify', authMiddleware.verifyToken, paymentController.verifyUPIPayment);
router.get('/status/:jobId', authMiddleware.verifyToken, paymentController.getPaymentStatus);

module.exports = router;
