const User = require('../models/User');

// Complete profile setup
const profileSetup = async (req, res) => {
  try {
    const user = req.user;
    const { fullName, profilePhoto } = req.body;

    user.fullName = fullName;
    user.profilePhoto = profilePhoto;
    user.profileSetupCompleted = true;
    await user.save();

    res.json({
      success: true,
      message: 'Profile setup completed successfully',
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
    console.error('Profile setup error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete profile setup'
    });
  }
};

// Get user profile
const getProfile = async (req, res) => {
  try {
    const user = req.user;

    res.json({
      success: true,
      data: {
        id: user._id,
        phoneNumber: user.phoneNumber,
        role: user.role,
        fullName: user.fullName,
        profilePhoto: user.profilePhoto,
        profileSetupCompleted: user.profileSetupCompleted,
        verificationStatus: user.verificationStatus
      }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile'
    });
  }
};

// Update profile
const updateProfile = async (req, res) => {
  try {
    const user = req.user;
    const { fullName, profilePhoto } = req.body;

    if (fullName) user.fullName = fullName;
    if (profilePhoto) user.profilePhoto = profilePhoto;
    
    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
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
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile'
    });
  }
};

// Get active jobs status
const getActiveJobsStatus = async (req, res) => {
  try {
    const user = req.user;

    // In a real implementation, you'd check actual job status
    const hasActiveJobs = false;

    res.json({
      success: true,
      data: {
        hasActiveJobs,
        canSwitchRole: !hasActiveJobs
      }
    });

  } catch (error) {
    console.error('Active jobs status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check active jobs status'
    });
  }
};

module.exports = {
  profileSetup,
  getProfile,
  updateProfile,
  getActiveJobsStatus
};
