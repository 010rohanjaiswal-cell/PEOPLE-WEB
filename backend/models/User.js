const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firebaseUid: {
    type: String,
    required: true,
    unique: true
  },
  phoneNumber: {
    type: String,
    required: true,
    unique: true
  },
  role: {
    type: String,
    enum: ['client', 'freelancer', 'admin'],
    required: true
  },
  fullName: {
    type: String,
    required: true
  },
  profilePhoto: {
    type: String,
    default: null
  },
  profileSetupCompleted: {
    type: Boolean,
    default: false
  },
  verificationStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  verificationDocuments: {
    aadhaarFront: String,
    aadhaarBack: String,
    panCard: String,
    address: String,
    dateOfBirth: Date,
    gender: String
  },
  wallet: {
    balance: {
      type: Number,
      default: 0
    },
    totalEarnings: {
      type: Number,
      default: 0
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for better query performance
userSchema.index({ firebaseUid: 1 });
userSchema.index({ phoneNumber: 1 });
userSchema.index({ role: 1 });

module.exports = mongoose.model('User', userSchema);
