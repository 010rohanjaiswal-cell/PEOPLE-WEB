const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  address: {
    type: String,
    required: true
  },
  pincode: {
    type: String,
    required: true
  },
  budget: {
    type: Number,
    required: true,
    min: 0
  },
  category: {
    type: String,
    required: true
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Any'],
    default: 'Any'
  },
  status: {
    type: String,
    enum: ['open', 'assigned', 'in-progress', 'work_done', 'completed', 'cancelled'],
    default: 'open',
    index: true
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  assignedFreelancer: {
    id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    fullName: String,
    profilePhoto: String,
    freelancerId: String
  },
  assignedAt: {
    type: Date
  },
  pickupMethod: {
    type: String,
    enum: ['direct', 'pickup'],
    default: 'direct'
  },
  workDoneAt: {
    type: Date
  },
  workDoneBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  completedAt: {
    type: Date
  },
  offers: [{
    freelancerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    amount: Number,
    message: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  paymentDetails: {
    orderId: String,
    paymentMethod: {
      type: String,
      enum: ['upi', 'cash', 'card']
    },
    totalAmount: Number,
    commission: Number,
    freelancerAmount: Number,
    paymentUrl: String,
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'cancelled'],
      default: 'pending'
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    completedAt: Date,
    phonepeOrderId: String,
    transactionId: String
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for better performance
jobSchema.index({ clientId: 1, status: 1 });
jobSchema.index({ 'assignedFreelancer.id': 1, status: 1 });
jobSchema.index({ status: 1, createdAt: -1 });
jobSchema.index({ category: 1, status: 1 });

// Update the updatedAt field before saving
jobSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Job', jobSchema);