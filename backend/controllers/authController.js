const jwt = require('jsonwebtoken');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// For development, we'll use a simplified authentication approach
// In production, you should properly configure Firebase Admin SDK

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

    console.log('🔐 Authenticating user with role:', role);
    console.log('📱 Firebase token received');

    // For development: Extract phone number from the request body
    // In production, you should verify the Firebase token properly
    const { phoneNumber } = req.body;
    
    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required'
      });
    }

    console.log('📱 Phone number from request:', phoneNumber);

    // Check if user exists by either phoneNumber or legacy phone
    let user = await User.findOne({
      $or: [
        { phoneNumber: phoneNumber },
        { phone: phoneNumber }
      ]
    });

    if (!user) {
      // Create new user
      user = new User({
        firebaseUid: 'dev-' + Date.now(), // Mock Firebase UID for development
        phoneNumber: phoneNumber,
        phone: phoneNumber,
        role: role,
        fullName: 'New User',
        profileSetupCompleted: false
      });
      await user.save();
      console.log('✅ New user created:', user._id);
    } else {
      // Update last login and role if changed
      user.lastLogin = new Date();
      // Backfill legacy 'phone' field only if not conflicting with existing doc
      if (!user.phone) {
        const phoneConflict = await User.findOne({ phone: phoneNumber, _id: { $ne: user._id } });
        if (!phoneConflict) {
          user.phone = phoneNumber;
        } else {
          console.warn('⚠️ Skipping setting legacy phone due to conflict with another user');
        }
      }
      if (user.role !== role) {
        user.role = role;
        console.log('🔄 User role updated to:', role);
      }
      await user.save();
      console.log('✅ Existing user authenticated:', user._id);
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
      needsProfileSetup: !user.profileSetupCompleted,
      needsVerification: user.role === 'freelancer' && (!user.verificationDocuments || !user.verificationDocuments.aadhaarFront)
    });

  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication failed',
      error: error && (error.message || String(error))
    });
  }
};

// Admin email/password login (non-Firebase)
const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD; // plain or bcrypt hash
    const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH; // optional bcrypt hash

    if (!adminEmail || (!adminPassword && !adminPasswordHash)) {
      return res.status(500).json({ success: false, message: 'Admin credentials are not configured' });
    }

    if (email !== adminEmail) {
      return res.status(403).json({ success: false, message: 'Invalid credentials' });
    }

    let passwordValid = false;
    if (adminPasswordHash) {
      passwordValid = await bcrypt.compare(password, adminPasswordHash);
    } else if (adminPassword) {
      passwordValid = password === adminPassword;
    }

    if (!passwordValid) {
      return res.status(403).json({ success: false, message: 'Invalid credentials' });
    }

    // Ensure an admin user record exists or create a lightweight one
    let user = await User.findOne({ role: 'admin', phoneNumber: { $exists: true } }).lean();

    const adminUserPayload = {
      id: user?._id || 'admin-user',
      email: adminEmail,
      role: 'admin',
      fullName: 'Admin User',
      isAdmin: true
    };

    const token = jwt.sign(
      { userId: adminUserPayload.id, role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    return res.json({
      success: true,
      token,
      user: adminUserPayload
    });
  } catch (error) {
    console.error('Admin login error:', error);
    return res.status(500).json({ success: false, message: 'Admin login failed' });
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
  canSwitchRole,
  adminLogin
};
