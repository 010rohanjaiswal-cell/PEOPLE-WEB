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
  // Legacy compatibility: some deployments have a unique index on `phone`
  // Ensure it's populated to avoid duplicate null index errors
  phone: {
    type: String,
    default: null
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
  freelancerId: {
    type: String,
    default: null,
    index: true,
    sparse: true,
    unique: false
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
    },
    transactions: [{
      id: String,
      type: {
        type: String,
        enum: ['credit', 'debit']
      },
      amount: Number,
      description: String,
      clientName: String,
      jobId: String,
      totalAmount: Number,
      commission: Number,
      paymentOrderId: String,
      createdAt: {
        type: Date,
        default: Date.now
      }
    }]
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
userSchema.index({ freelancerId: 1 }, { sparse: true });

module.exports = mongoose.model('User', userSchema);
