const User = require('../models/User');
const databaseService = require('../services/databaseService');

// Submit verification documents
const submitVerification = async (req, res) => {
  try {
    const user = req.user;
    const { fullName, dateOfBirth, gender, address, aadhaarFront, aadhaarBack, panCard, profilePhoto } = req.body;

    if (user.role !== 'freelancer') {
      return res.status(403).json({
        success: false,
        message: 'Only freelancers can submit verification documents'
      });
    }

    // Update user verification documents
    user.verificationDocuments = {
      aadhaarFront,
      aadhaarBack,
      panCard,
      address,
      dateOfBirth: new Date(dateOfBirth),
      gender
    };
    user.verificationStatus = 'pending';
    user.fullName = fullName;
    if (profilePhoto) {
      user.profilePhoto = profilePhoto;
    }
    await user.save();

    console.log('✅ Verification documents submitted for user:', user._id);

    res.json({
      success: true,
      message: 'Verification documents submitted successfully',
      status: 'pending',
      submittedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Verification submission error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit verification documents'
    });
  }
};

// Get verification status
const getVerificationStatus = async (req, res) => {
  try {
    const user = req.user;

    if (user.role !== 'freelancer') {
      return res.status(403).json({
        success: false,
        message: 'Only freelancers can check verification status'
      });
    }

    // If no documents have ever been submitted, return null so UI shows the form
    if (!user.verificationDocuments || !user.verificationDocuments.aadhaarFront) {
      return res.json({
        success: true,
        data: null
      });
    }

    return res.json({
      success: true,
      data: {
        status: user.verificationStatus,
        submittedAt: user.updatedAt,
        documents: user.verificationDocuments
      }
    });

  } catch (error) {
    console.error('Verification status check error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check verification status'
    });
  }
};

  // Get wallet information
const getWallet = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    // Fetch fresh user from DB to avoid stale wallet values
    const fresh = await User.findById(userId);
    const wallet = fresh?.wallet || req.user.wallet || { balance: 0, totalEarnings: 0 };

    res.json({
      success: true,
      data: {
        balance: wallet.balance || 0,
        totalEarnings: wallet.totalEarnings || 0,
        transactions: Array.isArray(wallet.transactions) ? wallet.transactions : [],
        currency: 'INR',
        freelancerId: fresh?.freelancerId || req.user.freelancerId || null
      }
    });

  } catch (error) {
    console.error('Wallet fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch wallet information'
    });
  }
};

// Request withdrawal (persist)
const Withdrawal = require('../models/Withdrawal');
const requestWithdrawal = async (req, res) => {
  try {
    const user = req.user;
    const { amount, upiId } = req.body;

    const numericAmount = Number(amount);
    if (!numericAmount || numericAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid amount' });
    }
    if (!upiId || typeof upiId !== 'string') {
      return res.status(400).json({ success: false, message: 'UPI ID is required' });
    }

    if ((user.wallet?.balance || 0) < numericAmount) {
      return res.status(400).json({ success: false, message: 'Insufficient balance' });
    }

    const wr = await Withdrawal.create({
      userId: user._id,
      role: user.role,
      amount: numericAmount,
      upiId,
      status: 'pending'
    });

    return res.json({ success: true, message: 'Withdrawal request submitted successfully', request: wr });

  } catch (error) {
    console.error('Withdrawal request error:', error);
    return res.status(500).json({ success: false, message: 'Failed to submit withdrawal request', error: error.message });
  }
};

// Get withdrawal history
const getWithdrawalHistory = async (req, res) => {
  try {
    const user = req.user;
    const items = await Withdrawal.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    return res.json({ success: true, data: items });
  } catch (error) {
    console.error('Withdrawal history error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch withdrawal history' });
  }
};

  // Get assigned jobs
const getAssignedJobs = async (req, res) => {
  try {
    const user = req.user;
    const freelancerId = String(user._id);

    console.log('📋 getAssignedJobs - freelancerId:', freelancerId);

    // Get jobs from MongoDB where this freelancer is assigned
    const allJobs = await databaseService.getAllJobs();
    const assignedJobs = allJobs.filter(job => 
      (job.status === 'assigned' || job.status === 'work_done' || job.status === 'completed') && 
      job.assignedFreelancer && 
      String(job.assignedFreelancer.id) === freelancerId
    );

    console.log('📋 getAssignedJobs - found jobs:', assignedJobs.length);
    console.log('📋 getAssignedJobs - jobs:', assignedJobs.map(j => ({ id: j.id, title: j.title, status: j.status })));

    res.json({
      success: true,
      data: assignedJobs
    });

  } catch (error) {
    console.error('Assigned jobs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch assigned jobs'
    });
  }
};

// Get freelancer order history (completed/fully_completed)
const getOrderHistory = async (req, res) => {
  try {
    const freelancerId = String(req.user._id);
    const allJobs = await databaseService.getAllJobs();
    const orders = allJobs.filter(job => 
      (job.status === 'completed' || job.status === 'fully_completed') &&
      job.assignedFreelancer && String(job.assignedFreelancer.id) === freelancerId
    );
    res.json({ success: true, data: orders });
  } catch (error) {
    console.error('Order history error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch order history' });
  }
};

// Mark job as work done
const markJobComplete = async (req, res) => {
  try {
    const { jobId } = req.params;
    const user = req.user;
    const freelancerId = String(user._id);

    console.log('✅ markJobComplete - jobId:', jobId);
    console.log('✅ markJobComplete - freelancerId:', freelancerId);

    // Find the job in MongoDB
    const job = await databaseService.getJobById(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }
    console.log('✅ markJobComplete - found job:', { id: job.id, title: job.title, status: job.status });

    // Check if job is assigned to this freelancer
    if (job.status !== 'assigned' || !job.assignedFreelancer || String(job.assignedFreelancer.id) !== freelancerId) {
      return res.status(400).json({
        success: false,
        message: 'Job is not assigned to you or cannot be marked as complete'
      });
    }

    // Update job status to work done
    const updateData = {
      status: 'work_done',
      workDoneAt: new Date(),
      workDoneBy: freelancerId
    };

    const updatedJob = await databaseService.updateJob(jobId, updateData);

    console.log('✅ markJobComplete - job marked as work done');
    console.log('✅ markJobComplete - work done at:', updatedJob.workDoneAt);

    res.json({
      success: true,
      message: 'Work marked as done successfully',
      job: updatedJob
    });

  } catch (error) {
    console.error('❌ markJobComplete error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark job as complete'
    });
  }
};

// Mark job as fully completed (after payment received)
const markJobFullyComplete = async (req, res) => {
  try {
    const { jobId } = req.params;
    const user = req.user;
    const freelancerId = String(user._id);

    console.log('✅ markJobFullyComplete - jobId:', jobId);
    console.log('✅ markJobFullyComplete - freelancerId:', freelancerId);

    // Load job from MongoDB
    const job = await databaseService.getJobById(jobId);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }
    console.log('✅ markJobFullyComplete - found job:', { id: job.id, title: job.title, status: job.status });

    // Check if job is completed (payment received)
    if (job.status !== 'completed' || !job.assignedFreelancer || String(job.assignedFreelancer.id) !== freelancerId) {
      return res.status(400).json({
        success: false,
        message: 'Job must be completed (payment received) before marking as fully complete'
      });
    }

    // Update job status to fully completed in MongoDB
    const updateData = {
      status: 'fully_completed',
      fullyCompletedAt: new Date(),
      fullyCompletedBy: freelancerId
    };
    const updatedJob = await databaseService.updateJob(jobId, updateData);

    console.log('✅ markJobFullyComplete - job marked as fully completed');
    console.log('✅ markJobFullyComplete - fully completed at:', updatedJob.fullyCompletedAt);

    res.json({
      success: true,
      message: 'Job marked as fully completed successfully',
      job: updatedJob
    });

  } catch (error) {
    console.error('❌ markJobFullyComplete error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark job as fully complete'
    });
  }
};

// Pick up a job (direct assignment)
const pickupJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    const user = req.user;
    const freelancerId = String(user._id);

    console.log('🎯 pickupJob - jobId:', jobId);
    console.log('🎯 pickupJob - freelancerId:', freelancerId);

    // Get job from MongoDB
    const job = await databaseService.getJobById(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    console.log('🎯 pickupJob - found job:', { id: job.id, title: job.title, status: job.status });

    // Check if job is available for pickup
    if (job.status !== 'open') {
      return res.status(400).json({
        success: false,
        message: 'Job is not available for pickup'
      });
    }

    // Check if freelancer already has an offer for this job
    if (job.offers && Array.isArray(job.offers)) {
      const existingOffer = job.offers.find(offer => String(offer.freelancerId) === freelancerId);
      if (existingOffer) {
        return res.status(400).json({
          success: false,
          message: 'You already have an offer for this job'
        });
      }
    }

    // Assign job to freelancer
    const updateData = {
      status: 'assigned',
      assignedFreelancer: {
        id: freelancerId,
        fullName: user.fullName,
        profilePhoto: user.profilePhoto || null,
        freelancerId: user.freelancerId || null
      },
      assignedAt: new Date(),
      pickupMethod: 'direct'
    };

    // Mark any existing offers as rejected since job is now assigned
    if (job.offers && Array.isArray(job.offers)) {
      job.offers.forEach(offer => {
        if (offer.status !== 'accepted') {
          offer.status = 'rejected';
          offer.rejectedAt = new Date().toISOString();
        }
      });
      updateData.offers = job.offers;
    }

    console.log('✅ pickupJob - job assigned successfully');
    console.log('✅ pickupJob - assigned freelancer:', updateData.assignedFreelancer);

    const updatedJob = await databaseService.updateJob(jobId, updateData);

    res.json({
      success: true,
      message: 'Job picked up successfully',
      job: updatedJob
    });

  } catch (error) {
    console.error('❌ pickupJob error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to pickup job'
    });
  }
};

// Make an offer for a job
const makeOffer = async (req, res) => {
  try {
    const { jobId } = req.params;
    const { amount, coverLetter, message } = req.body;
    const user = req.user;

    console.log('💰 Freelancer making offer for job:', jobId);
    console.log('👤 Freelancer ID:', user._id);
    console.log('💵 Offer amount:', amount);

    // Find the job in MongoDB
    const job = await databaseService.getJobById(jobId);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    // Enforce 5-minute cooldown per freelancer per job
    const COOLDOWN_MS = 5 * 60 * 1000;
    const now = Date.now();
    const freelancerId = String(user._id);
    
    // Check cooldown from job's cooldown tracking
    if (!job.cooldowns) job.cooldowns = {};
    const lastOfferTime = job.cooldowns[freelancerId];
    
    if (lastOfferTime) {
      const remaining = COOLDOWN_MS - (now - lastOfferTime);
      if (remaining > 0) {
        return res.status(429).json({
          success: false,
          message: 'Please wait before sending another offer',
          retryAfterMs: remaining
        });
      }
    }

    const offer = {
      id: 'offer-' + Date.now(),
      amount: Number(amount),
      message: message || coverLetter || '',
      submittedAt: new Date().toISOString(),
      freelancer: {
        id: freelancerId,
        fullName: user.fullName,
        profilePhoto: user.profilePhoto || null,
        freelancerId: user.freelancerId || null
      }
    };

    if (!Array.isArray(job.offers)) job.offers = [];
    
    // Remove any existing offers from this freelancer and add the new one
    job.offers = job.offers.filter(o => String(o.freelancer.id) !== freelancerId);
    job.offers.unshift(offer);
    
    // Store cooldown timestamp
    job.cooldowns[freelancerId] = now;
    
    // Save to MongoDB
    await databaseService.updateJob(jobId, { 
      offers: job.offers,
      cooldowns: job.cooldowns 
    });

    res.json({
      success: true,
      message: 'Offer submitted successfully',
      jobId,
      offer
    });
  } catch (error) {
    console.error('Make offer error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit offer'
    });
  }
};

// Check cooldown status for a job
const checkCooldownStatus = async (req, res) => {
  try {
    const { jobId } = req.params;
    const user = req.user;
    const freelancerId = String(user._id);

    const job = await databaseService.getJobById(jobId);
    
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    const COOLDOWN_MS = 5 * 60 * 1000;
    const now = Date.now();
    
    if (!job.cooldowns || !job.cooldowns[freelancerId]) {
      return res.json({
        success: true,
        canMakeOffer: true,
        remainingMs: 0
      });
    }

    const lastOfferTime = job.cooldowns[freelancerId];
    const remaining = COOLDOWN_MS - (now - lastOfferTime);
    
    if (remaining <= 0) {
      return res.json({
        success: true,
        canMakeOffer: true,
        remainingMs: 0
      });
    }

    return res.json({
      success: true,
      canMakeOffer: false,
      remainingMs: remaining
    });

  } catch (error) {
    console.error('Check cooldown status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check cooldown status'
    });
  }
};

// Pay dues (commission) via PhonePe
const payDues = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const fresh = await User.findById(userId);
    
    if (!fresh) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const wallet = fresh.wallet || { balance: 0, transactions: [] };
    const transactions = Array.isArray(wallet.transactions) ? wallet.transactions : [];

    // Calculate total unpaid commission
    const unpaidCommission = transactions
      .filter(tx => tx.commission && tx.commission > 0 && !tx.duesPaid)
      .reduce((sum, tx) => sum + (tx.commission || 0), 0);

    if (unpaidCommission <= 0) {
      return res.status(400).json({
        success: false,
        message: 'No dues to pay'
      });
    }

    // Load payment service
    const loadPaymentService = async () => {
      try {
        return require('../services/paymentService');
      } catch (error) {
        console.warn('Payment service not available:', error.message);
        return null;
      }
    };

    const paymentService = await loadPaymentService();
    if (!paymentService) {
      return res.status(503).json({
        success: false,
        message: 'Payment service not available'
      });
    }

    // Create payment order ID
    const orderId = `DUES_${userId}_${Date.now()}`;

    // Create PhonePe payment request
    const paymentResult = await paymentService.createPaymentRequest(
      unpaidCommission,
      orderId,
      userId,
      null, // jobId - not applicable for dues
      'Commission Dues Payment'
    );

    if (!paymentResult.success) {
      return res.status(500).json({
        success: false,
        message: paymentResult.error || 'Failed to create payment request'
      });
    }

    // Store payment order ID in user's wallet for tracking
    if (!fresh.wallet.duesPayments) {
      fresh.wallet.duesPayments = [];
    }
    fresh.wallet.duesPayments.push({
      orderId,
      amount: unpaidCommission,
      status: 'pending',
      createdAt: new Date(),
      phonepeOrderId: paymentResult.phonepeOrderId || null
    });
    await fresh.save();

    const responseData = {
      success: true,
      message: 'Payment request created successfully',
      paymentUrl: paymentResult.paymentUrl,
      orderId: orderId, // Always return our order ID
      amount: unpaidCommission
    };
    
    // Add PhonePe order ID if available
    if (paymentResult.phonepeOrderId) {
      responseData.phonepeOrderId = paymentResult.phonepeOrderId;
    }
    
    console.log('✅ Dues payment request created:', {
      orderId,
      amount: unpaidCommission,
      hasPaymentUrl: !!paymentResult.paymentUrl
    });
    
    res.json(responseData);

  } catch (error) {
    console.error('Pay dues error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process dues payment',
      error: error.message
    });
  }
};

module.exports = {
  submitVerification,
  getVerificationStatus,
  getWallet,
  requestWithdrawal,
  getWithdrawalHistory,
  getAssignedJobs,
  pickupJob,
  makeOffer,
  checkCooldownStatus,
  markJobComplete,
  markJobFullyComplete,
  getOrderHistory,
  payDues
};
