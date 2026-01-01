const mongoose = require('mongoose');

const freelancerVerificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  fullName: {
    type: String,
    required: true
  },
  dob: {
    type: String,
    required: true
  },
  gender: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  aadhaarFront: {
    type: String,
    default: null
  },
  aadhaarBack: {
    type: String,
    default: null
  },
  panCard: {
    type: String,
    default: null
  },
  profilePhoto: {
    type: String,
    default: null
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  rejectionReason: {
    type: String,
    default: null
  }
}, {
  timestamps: true,
  collection: 'freelancerverifications'
});

module.exports = mongoose.model('FreelancerVerification', freelancerVerificationSchema);

