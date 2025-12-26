const User = require('../models/User');
const bulkpeService = require('../services/bulkpeService');

// Get freelancer verifications
const getFreelancerVerifications = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = { role: 'freelancer' };
    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
      filter.verificationStatus = status;
    }

    const verifications = await User.find(filter)
      .select('_id fullName phoneNumber verificationStatus verificationDocuments profilePhoto createdAt updatedAt')
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
    // Assign freelancerId if not set: 5-9 digit numeric string
    if (!user.freelancerId) {
      // Helper to generate 5-9 digit numeric ID
      const generateId = () => {
        const length = Math.floor(Math.random() * 5) + 5; // 5 to 9
        let s = '';
        for (let i = 0; i < length; i++) {
          s += Math.floor(Math.random() * 10).toString();
        }
        // Ensure it does not start with 0 for readability
        if (s[0] === '0') s = '1' + s.slice(1);
        return s;
      };

      let newId = generateId();
      // Best-effort uniqueness check
      let tries = 0;
      while (tries < 5) {
        // eslint-disable-next-line no-await-in-loop
        const existing = await User.findOne({ freelancerId: newId });
        if (!existing) break;
        newId = generateId();
        tries += 1;
      }
      user.freelancerId = newId;
    }
    await user.save();

    res.json({
      success: true,
      message: 'Freelancer approved successfully',
      freelancerId: user.freelancerId
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

// Get withdrawal requests (pending)
const Withdrawal = require('../models/Withdrawal');
const getWithdrawalRequests = async (req, res) => {
  try {
    const items = await Withdrawal.find({ status: 'pending' })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();
    res.json({ success: true, data: items });
  } catch (error) {
    console.error('Get withdrawal requests error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch withdrawal requests' });
  }
};

// Approve withdrawal
const approveWithdrawal = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find the withdrawal request
    const withdrawal = await Withdrawal.findById(id);
    if (!withdrawal) {
      return res.status(404).json({
        success: false,
        message: 'Withdrawal request not found'
      });
    }

    if (withdrawal.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Withdrawal request is not pending'
      });
    }

    // Get user details for payout
    const user = await User.findById(withdrawal.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user has sufficient balance
    if (!user.wallet || user.wallet.balance < withdrawal.amount) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient balance'
      });
    }

    console.log('🚀 Processing withdrawal payout via Bulkpe:', {
      userId: user._id,
      amount: withdrawal.amount,
      upiId: withdrawal.upiId,
      bankDetails: withdrawal.bankDetails
    });

    // Process payout via Bulkpe
    const payoutResult = await bulkpeService.processWithdrawalRequest({
      amount: withdrawal.amount,
      upiId: withdrawal.upiId,
      bankDetails: withdrawal.bankDetails,
      beneficiaryName: user.fullName
    });

    if (payoutResult.success) {
      // Update withdrawal status
      withdrawal.status = 'processing';
      withdrawal.bulkpeTransactionId = payoutResult.transactionId;
      withdrawal.bulkpeReferenceId = payoutResult.referenceId;
      withdrawal.approvedAt = new Date();
      await withdrawal.save();

      // Deduct amount from user's wallet
      user.wallet.balance -= withdrawal.amount;
      
      // Add transaction record
      if (!user.wallet.transactions) {
        user.wallet.transactions = [];
      }
      
      user.wallet.transactions.push({
        type: 'withdrawal',
        amount: -withdrawal.amount,
        description: `Withdrawal payout - ${payoutResult.transactionId}`,
        status: 'processing',
        bulkpeTransactionId: payoutResult.transactionId,
        createdAt: new Date()
      });
      
      await user.save();

      res.json({
        success: true,
        message: 'Withdrawal approved and payout initiated',
        transactionId: payoutResult.transactionId,
        status: payoutResult.status
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to process payout',
        error: payoutResult.error
      });
    }

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

// Search users by phone number (or get all users if no query)
const searchUsers = async (req, res) => {
  try {
    const { phoneNumber } = req.query;
    
    console.log('🔍 Admin searchUsers called with phoneNumber:', phoneNumber);
    
    let query = {};
    
    // If phoneNumber is provided and not empty, filter by it
    if (phoneNumber && typeof phoneNumber === 'string' && phoneNumber.trim().length > 0) {
      query = {
        $or: [
          { phoneNumber: { $regex: phoneNumber.trim(), $options: 'i' } },
          { phone: { $regex: phoneNumber.trim(), $options: 'i' } }
        ]
      };
      console.log('🔍 Filtering users by phone number:', phoneNumber.trim());
    } else {
      console.log('📋 No phone number filter - returning all users');
    }
    // If no phoneNumber provided, get all users

    // Search for users with matching phone number (supporting both phone and phoneNumber fields)
    console.log('🔍 MongoDB query:', JSON.stringify(query, null, 2));
    
    const users = await User.find(query)
    .select('_id fullName phoneNumber phone email role verificationStatus profilePhoto createdAt updatedAt wallet verificationDocuments')
    .sort({ createdAt: -1 })
    .lean(); // Use lean() for better performance and to ensure we get plain objects

    console.log(`🔍 Search for phone: ${phoneNumber || '(all users)'}`);
    console.log(`📊 Found ${users.length} users in database`);
    
    if (users.length > 0) {
      console.log(`📊 Sample users:`, users.slice(0, 3).map(u => ({ 
        id: u._id, 
        name: u.fullName, 
        role: u.role, 
        phone: u.phoneNumber || u.phone 
      })));
    } else {
      console.log('⚠️ No users found. Checking if User model is connected...');
      const totalUsers = await User.countDocuments({});
      console.log(`📊 Total users in database: ${totalUsers}`);
    }

    // For role-switching users, prioritize freelancer data and show in both tabs
    const clients = [];
    const freelancers = [];

    users.forEach(user => {
      // user is already a plain object due to .lean(), no need for toObject()
      const userObj = user;
      
      // If user has freelancer data, show them in freelancer tab
      if (userObj.verificationDocuments || userObj.verificationStatus || userObj.role === 'freelancer') {
        freelancers.push({
          ...userObj,
          displayRole: 'freelancer',
          isCurrentRole: userObj.role === 'freelancer'
        });
      }
      
      // If user has APPROVED freelancer data, also show in client tab with freelancer details
      if (userObj.verificationDocuments && userObj.verificationStatus === 'approved') {
        clients.push({
          ...userObj,
          displayRole: 'client',
          isCurrentRole: userObj.role === 'client',
          hasApprovedFreelancerData: true // Flag to indicate this user has approved freelancer data
        });
      } else {
        // User only has client data or unapproved freelancer data, show only in client tab
        clients.push({
          ...userObj,
          displayRole: 'client',
          isCurrentRole: userObj.role === 'client',
          hasApprovedFreelancerData: false
        });
      }
    });

    console.log(`👥 Clients: ${clients.length}, Freelancers: ${freelancers.length}`);

    // Ensure we always return the correct format (object with clients, freelancers, total)
    // Never return an array directly in data field
    const responseData = {
      clients: Array.isArray(clients) ? clients : [],
      freelancers: Array.isArray(freelancers) ? freelancers : [],
      total: typeof users.length === 'number' ? users.length : 0
    };

    console.log('📤 Sending response with format:', {
      hasClients: Array.isArray(responseData.clients),
      hasFreelancers: Array.isArray(responseData.freelancers),
      clientsCount: responseData.clients.length,
      freelancersCount: responseData.freelancers.length,
      total: responseData.total
    });

    res.json({
      success: true,
      data: responseData
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
