const { inMemoryJobs, saveJobsToFile } = require('./sharedJobsStore');

// Lazy load payment service to avoid build issues
let paymentService;
const getPaymentService = () => {
  if (!paymentService) {
    try {
      paymentService = require('../services/paymentService');
    } catch (error) {
      console.error('Failed to load payment service:', error);
      throw new Error('Payment service not available');
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

    // Find the job
    const jobIndex = inMemoryJobs.findIndex(j => (j.id || (j._id && String(j._id))) === jobId);
    if (jobIndex === -1) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }
    
    const job = inMemoryJobs[jobIndex];
    
    // Check if client owns the job
    if (String(job.clientId) !== String(clientId)) {
      return res.status(403).json({ success: false, message: 'You can only pay for your own jobs' });
    }
    
    // Check if job is in work_done status
    if (job.status !== 'work_done') {
      return res.status(400).json({ 
        success: false, 
        message: 'Job must be marked as work done before payment' 
      });
    }

    // Calculate amounts
    const amounts = getPaymentService().calculateAmounts(job.budget);
    
    // Generate unique order ID
    const orderId = `ORDER_${jobId}_${Date.now()}`;
    
    // Create payment request
    const paymentResult = await getPaymentService().createPaymentRequest(
      amounts.totalAmount,
      orderId,
      clientId,
      jobId,
      job.title
    );

    if (!paymentResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to create payment request',
        error: paymentResult.error
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

    // Save to file for persistence
    saveJobsToFile();

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

    // Verify payment with PhonePe
    const verificationResult = await getPaymentService().verifyPayment(orderId);
    
    if (!verificationResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to verify payment',
        error: verificationResult.error
      });
    }

    const paymentData = verificationResult.data.data;
    const isSuccess = paymentData.state === 'COMPLETED' && paymentData.responseCode === 'PAYMENT_SUCCESS';

    if (isSuccess) {
      // Find job by order ID
      const jobIndex = inMemoryJobs.findIndex(job => 
        job.paymentDetails && job.paymentDetails.orderId === orderId
      );

      if (jobIndex !== -1) {
        const job = inMemoryJobs[jobIndex];
        
        // Update job status to completed
        job.status = 'completed';
        job.paymentMethod = 'upi';
        job.paidAt = new Date().toISOString();
        job.paidBy = job.clientId;
        job.paymentDetails.status = 'completed';
        job.paymentDetails.transactionId = paymentData.transactionId;

        // Credit freelancer's wallet
        const User = require('../models/User');
        const freelancerId = job.assignedFreelancer.id;
        const freelancerAmount = job.paymentDetails.freelancerAmount;
        
        try {
          const freelancer = await User.findById(freelancerId);
          if (freelancer) {
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
              clientName: req.user.fullName,
              jobId: job.id,
              commission: job.paymentDetails.commission,
              totalAmount: job.paymentDetails.totalAmount,
              createdAt: new Date().toISOString()
            });
            
            await freelancer.save();
            console.log('💰 verifyUPIPayment - freelancer wallet credited:', { freelancerId, amount: freelancerAmount });
          }
        } catch (walletError) {
          console.error('❌ verifyUPIPayment - wallet credit error:', walletError);
        }
        
        // Save to file for persistence
        saveJobsToFile();
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

module.exports = {
  createUPIPayment,
  verifyUPIPayment,
  getPaymentStatus
};
