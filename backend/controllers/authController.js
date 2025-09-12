const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Authenticate user with Firebase token
const authenticate = async (req, res) => {
  try {
    const { idToken, role } = req.body;

    if (!idToken || !role) {
      return res.status(400).json({
        success: false,
        message: 'Firebase token and role are required'
      });
    }

    // In a real implementation, you would verify the Firebase token here
    // For now, we'll simulate the verification
    console.log('🔐 Authenticating user with role:', role);
    console.log('📱 Firebase token received');

    // Check if user exists
    let user = await User.findOne({ 
      // In real implementation, you'd extract phone number from Firebase token
      phoneNumber: '+919876543210' // This should come from Firebase token
    });

    if (!user) {
      // Create new user
      user = new User({
        firebaseUid: 'mock-firebase-uid',
        phoneNumber: '+919876543210',
        role: role,
        fullName: 'New User',
        profileSetupCompleted: false
      });
      await user.save();
      console.log('✅ New user created');
    } else {
      // Update last login
      user.lastLogin = new Date();
      await user.save();
      console.log('✅ Existing user authenticated');
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.json({
      success: true,
      token: token,
      user: {
        id: user._id,
        phoneNumber: user.phoneNumber,
        role: user.role,
        fullName: user.fullName,
        profilePhoto: user.profilePhoto,
        profileSetupCompleted: user.profileSetupCompleted,
        verificationStatus: user.verificationStatus
      },
      isNewUser: !user.profileSetupCompleted,
      needsProfileSetup: !user.profileSetupCompleted
    });

  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication failed'
    });
  }
};

// Logout user
const logout = async (req, res) => {
  try {
    // In a real implementation, you might want to blacklist the token
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Logout failed'
    });
  }
};

// Switch user role
const switchRole = async (req, res) => {
  try {
    const { newRole } = req.body;
    const user = req.user;

    if (!newRole || !['client', 'freelancer'].includes(newRole)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be client or freelancer'
      });
    }

    if (newRole === user.role) {
      return res.status(400).json({
        success: false,
        message: 'You are already in this role'
      });
    }

    // Check if user has active jobs (simplified check)
    // In real implementation, you'd check actual job status
    const hasActiveJobs = false; // This should be a real check

    if (hasActiveJobs) {
      return res.status(400).json({
        success: false,
        message: 'You still have an active job. Complete it before switching role.'
      });
    }

    // Update user role
    user.role = newRole;
    await user.save();

    // Generate new token with updated role
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.json({
      success: true,
      message: 'Role switched successfully',
      token: token,
      user: {
        id: user._id,
        phoneNumber: user.phoneNumber,
        role: user.role,
        fullName: user.fullName,
        profilePhoto: user.profilePhoto,
        profileSetupCompleted: user.profileSetupCompleted
      }
    });

  } catch (error) {
    console.error('Role switch error:', error);
    res.status(500).json({
      success: false,
      message: 'Role switch failed'
    });
  }
};

// Check if user can switch role
const canSwitchRole = async (req, res) => {
  try {
    const user = req.user;

    // Check if user has active jobs (simplified check)
    const hasActiveJobs = false; // This should be a real check

    res.json({
      success: true,
      canSwitch: !hasActiveJobs,
      currentRole: user.role,
      message: hasActiveJobs 
        ? 'You have active jobs. Complete them before switching role.'
        : 'You can switch roles'
    });

  } catch (error) {
    console.error('Can switch role check error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check role switch eligibility'
    });
  }
};

module.exports = {
  authenticate,
  logout,
  switchRole,
  canSwitchRole
};
