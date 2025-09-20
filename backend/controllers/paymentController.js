const { inMemoryJobs, saveJobsToFile } = require('./sharedJobsStore');

// Lazy load payment service to avoid build issues
let paymentService;
let paymentServiceAvailable = false;

const getPaymentService = () => {
  if (!paymentService && !paymentServiceAvailable) {
    try {
      paymentService = require('../services/paymentService');
      paymentServiceAvailable = true;
      console.log('✅ Full payment service loaded successfully');
    } catch (error) {
      console.warn('⚠️ Full payment service not available, using minimal service:', error.message);
      try {
        paymentService = require('../services/paymentServiceMinimal');
        paymentServiceAvailable = true;
        console.log('✅ Minimal payment service loaded successfully');
      } catch (minimalError) {
        console.error('❌ Failed to load any payment service:', minimalError);
        paymentServiceAvailable = false;
        throw new Error('Payment service not available');
      }
    }
  }
  return paymentService;
};

// Async version for loading payment service
const loadPaymentService = async () => {
  if (!paymentService && !paymentServiceAvailable) {
    try {
      paymentService = require('../services/paymentService');
      paymentServiceAvailable = true;
      console.log('✅ Payment service dependencies loaded successfully');
    } catch (error) {
      console.warn('⚠️ Full payment service not available, using minimal service:', error.message);
      try {
        paymentService = require('../services/paymentServiceMinimal');
        paymentServiceAvailable = true;
        console.log('✅ Minimal payment service loaded successfully');
      } catch (minimalError) {
        console.error('❌ Failed to load any payment service:', minimalError);
        paymentServiceAvailable = false;
        throw new Error('Payment service not available');
      }
    }
  }
  return paymentService;
};

// Create UPI payment request
const createUPIPayment = async (req, res) => {
  try {
    const { jobId } = req.params;
    const clientId = req.user?._id || req.user?.id || req.user?.userId || 'client-dev';

    console.log('💳 createUPIPayment - jobId:', jobId);
    console.log('💳 createUPIPayment - clientId:', clientId);
    console.log('💳 createUPIPayment - user:', req.user);

    // Load jobs from file system
    const fs = require('fs');
    const path = require('path');
    const jobsFile = path.join(__dirname, '../data/jobs.json');
    
    if (!fs.existsSync(jobsFile)) {
      console.error('❌ Jobs file not found');
      return res.status(404).json({ success: false, message: 'Jobs data not found' });
    }
    
    const jobsData = JSON.parse(fs.readFileSync(jobsFile, 'utf8'));
    const jobs = jobsData.jobs || [];
    
    // Find the job
    const jobIndex = jobs.findIndex(j => (j.id || (j._id && String(j._id))) === jobId);
    if (jobIndex === -1) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }
    
    const job = jobs[jobIndex];
    
    // Check if client owns the job (bypass for test jobs or debug mode)
    const isDebugMode = process.env.NODE_ENV === 'development' || req.headers['x-debug-mode'] === 'true';
    const isTestJob = job.id.startsWith('test-job-');
    
    if (String(job.clientId) !== String(clientId) && !isTestJob && !isDebugMode) {
      return res.status(403).json({ success: false, message: 'You can only pay for your own jobs' });
    }
    
    // Log when bypassing ownership check
    if (isTestJob || isDebugMode) {
      console.log('🧪 createUPIPayment - Bypassing ownership check:', {
        jobId: job.id,
        reason: isTestJob ? 'test job' : 'debug mode',
        clientId: clientId,
        jobClientId: job.clientId
      });
    }
    
    // Check if job is in work_done status
    if (job.status !== 'work_done') {
      return res.status(400).json({ 
        success: false, 
        message: 'Job must be marked as work done before payment' 
      });
    }

    // Load payment service
    const paymentService = await loadPaymentService();
    if (!paymentService) {
      return res.status(503).json({
        success: false,
        message: 'Payment service not available'
      });
    }

    // Debug: Test the payment service
    console.log('🔍 createUPIPayment - testing payment service...');
    const dependencyTest = paymentService.testDependencies();
    console.log('🔍 createUPIPayment - dependency test result:', dependencyTest);
    
    if (!dependencyTest.success) {
      console.error('❌ createUPIPayment - payment service dependency test failed:', dependencyTest);
      return res.status(503).json({
        success: false,
        message: 'Payment service dependencies not available',
        details: dependencyTest
      });
    }

    // Calculate amounts
    console.log('💳 createUPIPayment - calculating amounts for budget:', job.budget);
    const amounts = paymentService.calculateAmounts(job.budget);
    console.log('💳 createUPIPayment - calculated amounts:', amounts);
    
    // Generate unique order ID
    const orderId = `ORDER_${jobId}_${Date.now()}`;
    console.log('💳 createUPIPayment - generated orderId:', orderId);
    
    // Create payment request
    console.log('💳 createUPIPayment - calling payment service...');
    const paymentResult = await paymentService.createPaymentRequest(
      amounts.totalAmount,
      orderId,
      clientId,
      jobId,
      job.title
    );
    console.log('💳 createUPIPayment - payment service result:', paymentResult);

    if (!paymentResult.success) {
      console.error('❌ createUPIPayment - payment service failed:', paymentResult);
      return res.status(500).json({
        success: false,
        message: 'Failed to create payment request',
        error: paymentResult.error,
        details: paymentResult
      });
    }

    // Store payment details in job
    job.paymentDetails = {
      orderId,
      paymentMethod: 'upi',
      totalAmount: amounts.totalAmount,
      commission: amounts.commission,
      freelancerAmount: amounts.freelancerAmount,
      paymentUrl: paymentResult.paymentUrl,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    // Save updated jobs data
    fs.writeFileSync(jobsFile, JSON.stringify(jobsData, null, 2));
    console.log('💾 Jobs data saved');

    console.log('💳 createUPIPayment - payment request created:', orderId);
    console.log('💳 createUPIPayment - amounts:', amounts);

    res.json({
      success: true,
      message: 'Payment request created successfully',
      paymentUrl: paymentResult.paymentUrl,
      orderId,
      amounts
    });

  } catch (error) {
    console.error('❌ createUPIPayment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create payment request'
    });
  }
};

// Verify UPI payment
const verifyUPIPayment = async (req, res) => {
  try {
    const { orderId } = req.body;
    
    console.log('🔍 verifyUPIPayment - orderId:', orderId);

    // Load payment service
    const paymentService = await loadPaymentService();
    if (!paymentService) {
      return res.status(503).json({
        success: false,
        message: 'Payment service not available'
      });
    }

    // Verify payment with PhonePe
    const verificationResult = await paymentService.verifyPayment(orderId);
    
    console.log('🔍 verifyUPIPayment - verification result:', verificationResult);
    
    if (!verificationResult.success) {
      console.error('❌ verifyUPIPayment - verification failed:', verificationResult.error);
      return res.status(500).json({
        success: false,
        message: 'Failed to verify payment',
        error: verificationResult.error
      });
    }

    const paymentData = verificationResult.data;
    console.log('🔍 verifyUPIPayment - payment data:', paymentData);
    
    const isSuccess = paymentData.state === 'COMPLETED' || paymentData.state === 'SUCCESS';
    console.log('🔍 verifyUPIPayment - isSuccess:', isSuccess, 'state:', paymentData.state);

    if (isSuccess) {
      // Load jobs from file system
      const fs = require('fs');
      const path = require('path');
      const jobsFile = path.join(__dirname, '../data/jobs.json');
      
      if (!fs.existsSync(jobsFile)) {
        console.error('❌ Jobs file not found');
        return res.json({ 
          success: false, 
          message: 'Jobs data not found' 
        });
      }
      
      const jobsData = JSON.parse(fs.readFileSync(jobsFile, 'utf8'));
      const jobs = jobsData.jobs || [];
      
      // Extract job ID from order ID (format: ORDER_jobId_timestamp)
      const jobIdMatch = orderId.match(/ORDER_(.+)_\d+/);
      if (!jobIdMatch) {
        console.error('❌ Could not extract job ID from order ID:', orderId);
        return res.json({ 
          success: false, 
          message: 'Invalid order ID format' 
        });
      }
      
      const jobId = jobIdMatch[1];
      console.log('📋 Extracted job ID:', jobId);
      
      // Find the job
      const jobIndex = jobs.findIndex(job => job.id === jobId);
      if (jobIndex === -1) {
        console.error('❌ Job not found:', jobId);
        return res.json({ 
          success: false, 
          message: 'Job not found' 
        });
      }
      
      const job = jobs[jobIndex];
        
        // Update job status to completed
        job.status = 'completed';
        job.paymentMethod = 'upi';
        job.paidAt = new Date().toISOString();
        job.paymentOrderId = orderId;

        // Credit freelancer's wallet
        const User = require('../models/User');
        const freelancerId = job.assignedFreelancer?.id;
        const jobAmount = job.budget;
        
        if (freelancerId) {
          try {
            const freelancer = await User.findById(freelancerId);
            if (freelancer) {
              // Calculate freelancer's portion (90% of job amount)
              const freelancerAmount = Math.round(jobAmount * 0.9 * 100) / 100;
              
              // Update wallet balance
              freelancer.wallet.balance = (freelancer.wallet.balance || 0) + freelancerAmount;
              freelancer.wallet.totalEarnings = (freelancer.wallet.totalEarnings || 0) + freelancerAmount;
              
              // Add transaction record
              if (!freelancer.wallet.transactions) {
                freelancer.wallet.transactions = [];
              }
              
              freelancer.wallet.transactions.unshift({
                id: 'txn-' + Date.now(),
                type: 'credit',
                amount: freelancerAmount,
                description: `Payment for job: ${job.title}`,
                clientName: job.clientName || 'Unknown Client',
                jobId: job.id,
                totalAmount: jobAmount,
                commission: Math.round(jobAmount * 0.1 * 100) / 100,
                paymentOrderId: orderId,
                createdAt: new Date().toISOString()
              });
              
              await freelancer.save();
              console.log('💰 verifyUPIPayment - freelancer wallet credited:', { 
                freelancerId, 
                jobAmount, 
                freelancerAmount, 
                commission: Math.round(jobAmount * 0.1 * 100) / 100 
              });
            } else {
              console.log('⚠️ Freelancer not found:', freelancerId);
            }
          } catch (walletError) {
            console.error('❌ verifyUPIPayment - wallet credit error:', walletError);
            // Don't fail the payment if wallet update fails
          }
        }
        
        // Save updated jobs data
        fs.writeFileSync(jobsFile, JSON.stringify(jobsData, null, 2));
        console.log('💾 Jobs data saved');
      }
    }

    res.json({
      success: true,
      isSuccess,
      paymentData: paymentData,
      message: isSuccess ? 'Payment verified successfully' : 'Payment verification failed'
    });

  } catch (error) {
    console.error('❌ verifyUPIPayment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify payment'
    });
  }
};

// Get payment status
const getPaymentStatus = async (req, res) => {
  try {
    const { jobId } = req.params;
    const clientId = req.user?._id || req.user?.id || req.user?.userId || 'client-dev';

    // Find the job
    const jobIndex = inMemoryJobs.findIndex(j => (j.id || (j._id && String(j._id))) === jobId);
    if (jobIndex === -1) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }
    
    const job = inMemoryJobs[jobIndex];
    
    // Check if client owns the job
    if (String(job.clientId) !== String(clientId)) {
      return res.status(403).json({ success: false, message: 'You can only check payment for your own jobs' });
    }

    const paymentDetails = job.paymentDetails || {};
    
    res.json({
      success: true,
      paymentDetails: {
        status: paymentDetails.status || 'not_initiated',
        orderId: paymentDetails.orderId,
        totalAmount: paymentDetails.totalAmount,
        commission: paymentDetails.commission,
        freelancerAmount: paymentDetails.freelancerAmount,
        paymentMethod: paymentDetails.paymentMethod,
        createdAt: paymentDetails.createdAt
      }
    });

  } catch (error) {
    console.error('❌ getPaymentStatus error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get payment status'
    });
  }
};

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
    
    // Try to get payment service
    let service = null;
    let testAmounts = null;
    let serviceInfo = null;
    
    try {
      service = getPaymentService();
      console.log('🧪 Payment service loaded successfully');
      
      // Test amount calculation
      testAmounts = service.calculateAmounts(1000);
      console.log('🧪 Test amounts calculation:', testAmounts);
      
      serviceInfo = {
        merchantId: service.merchantId,
        baseUrl: service.baseUrl,
        redirectUrl: service.redirectUrl
      };
    } catch (serviceError) {
      console.log('❌ Payment service not available:', serviceError.message);
    }
    
    res.json({
      success: true,
      message: 'Payment service test completed',
      dependencies: {
        axios: axiosAvailable,
        cryptoJs: cryptoAvailable
      },
      paymentServiceAvailable: paymentServiceAvailable,
      testAmounts,
      serviceInfo
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

module.exports = {
  createUPIPayment,
  verifyUPIPayment,
  getPaymentStatus,
  testPaymentService
};
