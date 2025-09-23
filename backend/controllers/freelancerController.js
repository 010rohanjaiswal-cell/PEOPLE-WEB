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
  markJobFullyComplete
};
