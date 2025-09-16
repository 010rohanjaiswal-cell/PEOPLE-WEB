const User = require('../models/User');

// Get freelancer verifications
const getFreelancerVerifications = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = { role: 'freelancer' };
    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
      filter.verificationStatus = status;
    }

    const verifications = await User.find(filter)
      .select('_id fullName phoneNumber verificationStatus verificationDocuments createdAt updatedAt')
      .sort({ updatedAt: -1 });

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

// Search users by phone number
const searchUsers = async (req, res) => {
  try {
    const { phoneNumber } = req.query;
    
    if (!phoneNumber || phoneNumber.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid phone number (at least 10 digits)'
      });
    }

    // Search for users with matching phone number (supporting both phone and phoneNumber fields)
    const users = await User.find({
      $or: [
        { phoneNumber: { $regex: phoneNumber, $options: 'i' } },
        { phone: { $regex: phoneNumber, $options: 'i' } }
      ]
    })
    .select('_id fullName phoneNumber phone email role verificationStatus profilePhoto createdAt updatedAt wallet verificationDocuments')
    .sort({ createdAt: -1 });

    console.log(`🔍 Search for phone: ${phoneNumber}`);
    console.log(`📊 Found ${users.length} users:`, users.map(u => ({ 
      id: u._id, 
      name: u.fullName, 
      role: u.role, 
      phone: u.phoneNumber || u.phone 
    })));

    // For role-switching users, show them in both client and freelancer tabs
    // Check if user has ever been a client or freelancer based on their profile data
    const clients = [];
    const freelancers = [];

    users.forEach(user => {
      // If user has client-related data (posted jobs, etc.) or is currently a client
      if (user.role === 'client' || user.wallet?.balance > 0 || user.profileSetupCompleted) {
        clients.push({
          ...user.toObject(),
          displayRole: 'client',
          isCurrentRole: user.role === 'client'
        });
      }
      
      // If user has freelancer-related data (verification docs, etc.) or is currently a freelancer
      if (user.role === 'freelancer' || user.verificationDocuments || user.verificationStatus) {
        freelancers.push({
          ...user.toObject(),
          displayRole: 'freelancer',
          isCurrentRole: user.role === 'freelancer'
        });
      }
    });

    console.log(`👥 Clients: ${clients.length}, Freelancers: ${freelancers.length}`);

    res.json({
      success: true,
      data: {
        clients,
        freelancers,
        total: users.length
      }
    });

  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search users'
    });
  }
};

// Get user profile by ID
const getUserProfile = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findById(id)
      .select('-__v'); // Exclude version field

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user
    });

  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user profile'
    });
  }
};

module.exports = {
  getFreelancerVerifications,
  approveFreelancer,
  rejectFreelancer,
  getWithdrawalRequests,
  approveWithdrawal,
  rejectWithdrawal,
  searchUsers,
  getUserProfile
};
