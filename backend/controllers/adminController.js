const User = require('../models/User');

// Get freelancer verifications
const getFreelancerVerifications = async (req, res) => {
  try {
    const verifications = await User.find({
      role: 'freelancer',
      verificationStatus: 'pending'
    }).select('_id fullName phoneNumber verificationDocuments createdAt');

    res.json({
      success: true,
      data: verifications
    });

  } catch (error) {
    console.error('Get verifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch verifications'
    });
  }
};

// Approve freelancer
const approveFreelancer = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.verificationStatus = 'approved';
    await user.save();

    res.json({
      success: true,
      message: 'Freelancer approved successfully'
    });

  } catch (error) {
    console.error('Approve freelancer error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve freelancer'
    });
  }
};

// Reject freelancer
const rejectFreelancer = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.verificationStatus = 'rejected';
    await user.save();

    res.json({
      success: true,
      message: 'Freelancer rejected successfully'
    });

  } catch (error) {
    console.error('Reject freelancer error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject freelancer'
    });
  }
};

// Get withdrawal requests
const getWithdrawalRequests = async (req, res) => {
  try {
    // In a real implementation, you'd fetch from a withdrawals collection
    res.json({
      success: true,
      data: []
    });

  } catch (error) {
    console.error('Get withdrawal requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch withdrawal requests'
    });
  }
};

// Approve withdrawal
const approveWithdrawal = async (req, res) => {
  try {
    const { id } = req.params;
    
    // In a real implementation, you'd update the withdrawal status
    res.json({
      success: true,
      message: 'Withdrawal approved successfully'
    });

  } catch (error) {
    console.error('Approve withdrawal error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve withdrawal'
    });
  }
};

// Reject withdrawal
const rejectWithdrawal = async (req, res) => {
  try {
    const { id } = req.params;
    
    // In a real implementation, you'd update the withdrawal status
    res.json({
      success: true,
      message: 'Withdrawal rejected successfully'
    });

  } catch (error) {
    console.error('Reject withdrawal error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject withdrawal'
    });
  }
};

module.exports = {
  getFreelancerVerifications,
  approveFreelancer,
  rejectFreelancer,
  getWithdrawalRequests,
  approveWithdrawal,
  rejectWithdrawal
};
