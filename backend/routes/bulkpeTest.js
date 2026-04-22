const express = require('express');
const router = express.Router();
const bulkpeService = require('../services/bulkpeService');

// Test Bulkpe connection and fetch balance
router.get('/balance', async (req, res) => {
  try {
    console.log('🧪 Testing Bulkpe balance fetch...');
    
    const result = await bulkpeService.fetchBalance();
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Bulkpe connection successful',
        data: {
          balance: result.balance,
          accountNumber: result.accountNumber,
          businessName: result.businessName
        }
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Bulkpe connection failed',
        error: result.error
      });
    }
  } catch (error) {
    console.error('❌ Bulkpe test error:', error);
    res.status(500).json({
      success: false,
      message: 'Bulkpe test failed',
      error: error.message
    });
  }
});

// Test UPI payout (small amount)
router.post('/test-upi-payout', async (req, res) => {
  try {
    const { upiId, amount = 1, beneficiaryName = 'Test User' } = req.body;
    
    if (!upiId) {
      return res.status(400).json({
        success: false,
        message: 'UPI ID is required'
      });
    }

    console.log('🧪 Testing Bulkpe UPI payout:', { upiId, amount, beneficiaryName });
    
    const result = await bulkpeService.initiateUPIPayout(
      amount,
      upiId,
      beneficiaryName,
      `TEST-${Date.now()}`,
      'Test payout from People app'
    );
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Test UPI payout initiated',
        data: {
          transactionId: result.transactionId,
          referenceId: result.referenceId,
          status: result.status
        }
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Test UPI payout failed',
        error: result.error
      });
    }
  } catch (error) {
    console.error('❌ Test UPI payout error:', error);
    res.status(500).json({
      success: false,
      message: 'Test UPI payout failed',
      error: error.message
    });
  }
});

// Test bank payout (small amount)
router.post('/test-bank-payout', async (req, res) => {
  try {
    const { 
      accountNumber, 
      ifsc, 
      amount = 1, 
      beneficiaryName = 'Test User' 
    } = req.body;
    
    if (!accountNumber || !ifsc) {
      return res.status(400).json({
        success: false,
        message: 'Account number and IFSC are required'
      });
    }

    console.log('🧪 Testing Bulkpe bank payout:', { 
      accountNumber, 
      ifsc, 
      amount, 
      beneficiaryName 
    });
    
    const result = await bulkpeService.initiateBankPayout(
      amount,
      accountNumber,
      ifsc,
      beneficiaryName,
      `TEST-${Date.now()}`,
      'Test bank payout from People app'
    );
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Test bank payout initiated',
        data: {
          transactionId: result.transactionId,
          referenceId: result.referenceId,
          status: result.status
        }
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Test bank payout failed',
        error: result.error
      });
    }
  } catch (error) {
    console.error('❌ Test bank payout error:', error);
    res.status(500).json({
      success: false,
      message: 'Test bank payout failed',
      error: error.message
    });
  }
});

module.exports = router;
