const User = require('../models/User');

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
    const user = req.user;

    res.json({
      success: true,
      data: {
        balance: user.wallet.balance,
        totalEarnings: user.wallet.totalEarnings,
      currency: 'INR',
      freelancerId: user.freelancerId || null
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

// Request withdrawal
const requestWithdrawal = async (req, res) => {
  try {
    const user = req.user;
    const { amount, upiId } = req.body;

    if (user.wallet.balance < amount) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient balance'
      });
    }

    // In a real implementation, you'd create a withdrawal request record
    console.log('💰 Withdrawal request:', { userId: user._id, amount, upiId });

    res.json({
      success: true,
      message: 'Withdrawal request submitted successfully',
      requestId: 'req_' + Date.now()
    });

  } catch (error) {
    console.error('Withdrawal request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit withdrawal request'
    });
  }
};

// Get withdrawal history
const getWithdrawalHistory = async (req, res) => {
  try {
    const user = req.user;

    // In a real implementation, you'd fetch from a withdrawals collection
    res.json({
      success: true,
      data: []
    });

  } catch (error) {
    console.error('Withdrawal history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch withdrawal history'
    });
  }
};

// Get assigned jobs
const getAssignedJobs = async (req, res) => {
  try {
    const user = req.user;
    const freelancerId = String(user._id);

    console.log('📋 getAssignedJobs - freelancerId:', freelancerId);

    // Get jobs from in-memory store where this freelancer is assigned
    const { inMemoryJobs } = require('./sharedJobsStore');
    const assignedJobs = Array.isArray(inMemoryJobs) 
      ? inMemoryJobs.filter(job => 
          job.status === 'assigned' && 
          job.assignedFreelancer && 
          String(job.assignedFreelancer.id) === freelancerId
        )
      : [];

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

// Mark job as complete
const markJobComplete = async (req, res) => {
  try {
    const { jobId } = req.params;
    const user = req.user;

    // In a real implementation, you'd update the job status
    console.log('✅ Job marked complete:', { jobId, userId: user._id });

    res.json({
      success: true,
      message: 'Job marked as complete successfully'
    });

  } catch (error) {
    console.error('Mark job complete error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark job as complete'
    });
  }
};

// Pick up a job (direct assignment)
const pickupJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    const user = req.user;

    console.log('🎯 Freelancer picking up job:', jobId);
    console.log('👤 Freelancer ID:', user._id);

    // In a real implementation, you'd update the job status and assign it to the freelancer
    res.json({
      success: true,
      message: 'Job picked up successfully',
      jobId,
      freelancerId: user._id
    });

  } catch (error) {
    console.error('Pickup job error:', error);
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

    // Save to in-memory job store so client can view offers
    const { inMemoryJobs } = require('./sharedJobsStore');
    const job = Array.isArray(inMemoryJobs) ? inMemoryJobs.find(j => (j.id || (j._id && String(j._id))) === jobId) : null;
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

    const { inMemoryJobs } = require('./sharedJobsStore');
    const job = Array.isArray(inMemoryJobs) ? inMemoryJobs.find(j => (j.id || (j._id && String(j._id))) === jobId) : null;
    
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
  markJobComplete
};
