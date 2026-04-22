// Minimal payment controller that doesn't require external dependencies
const { inMemoryJobs, saveJobsToFile } = require('./sharedJobsStore');

// Test payment service availability
const testPaymentService = async (req, res) => {
  try {
    console.log('🧪 Testing payment service availability...');
    
    // Test if dependencies are available
    let axiosAvailable = false;
    let cryptoAvailable = false;
    
    try {
      require('axios');
      axiosAvailable = true;
      console.log('✅ axios is available');
    } catch (e) {
      console.log('❌ axios not available:', e.message);
    }
    
    try {
      require('crypto-js');
      cryptoAvailable = true;
      console.log('✅ crypto-js is available');
    } catch (e) {
      console.log('❌ crypto-js not available:', e.message);
    }
    
    res.json({
      success: true,
      message: 'Payment service test completed',
      dependencies: {
        axios: axiosAvailable,
        cryptoJs: cryptoAvailable
      },
      paymentServiceAvailable: false,
      status: 'minimal_controller'
    });
    
  } catch (error) {
    console.error('❌ Payment service test failed:', error);
    res.status(500).json({
      success: false,
      message: 'Payment service test failed',
      error: error.message
    });
  }
};

// Create UPI payment request
const createUPIPayment = async (req, res) => {
  res.status(503).json({
    success: false,
    message: 'Payment service dependencies not installed on server'
  });
};

// Verify UPI payment
const verifyUPIPayment = async (req, res) => {
  res.status(503).json({
    success: false,
    message: 'Payment service dependencies not installed on server'
  });
};

// Get payment status
const getPaymentStatus = async (req, res) => {
  res.status(503).json({
    success: false,
    message: 'Payment service dependencies not installed on server'
  });
};

module.exports = {
  createUPIPayment,
  verifyUPIPayment,
  getPaymentStatus,
  testPaymentService
};
