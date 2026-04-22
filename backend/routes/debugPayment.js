const express = require('express');
const router = express.Router();
const debugPaymentController = require('../controllers/debugPaymentController');

// Debug routes for payment service
router.get('/health', debugPaymentController.healthCheck);
router.get('/payment-debug', debugPaymentController.debugPaymentService);

module.exports = router;
