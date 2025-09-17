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

    // In a real implementation, you'd fetch from a jobs collection
    res.json({
      success: true,
      data: []
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

    const offer = {
      id: 'offer-' + Date.now(),
      amount: Number(amount),
      message: message || coverLetter || '',
      submittedAt: new Date().toISOString(),
      freelancer: {
        id: String(user._id),
        fullName: user.fullName,
        profilePhoto: user.profilePhoto || null,
        freelancerId: user.freelancerId || null
      }
    };

    if (!Array.isArray(job.offers)) job.offers = [];
    job.offers.unshift(offer);

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

module.exports = {
  submitVerification,
  getVerificationStatus,
  getWallet,
  requestWithdrawal,
  getWithdrawalHistory,
  getAssignedJobs,
  pickupJob,
  makeOffer,
  markJobComplete
};
