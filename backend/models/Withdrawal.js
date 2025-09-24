const mongoose = require('mongoose');

const withdrawalSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  role: {
    type: String,
    enum: ['freelancer', 'client', 'admin'],
    default: 'freelancer'
  },
  amount: {
    type: Number,
    required: true,
    min: 1
  },
  upiId: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'paid'],
    default: 'pending',
    index: true
  },
  notes: String
}, { timestamps: true });

withdrawalSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Withdrawal', withdrawalSchema);


