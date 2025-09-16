const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  title: { type: String, required: true },
  address: { type: String, required: true },
  pincode: { type: String, required: true },
  budget: { type: Number, required: true, min: 10 },
  category: { type: String, required: true },
  gender: { type: String, enum: ['Male', 'Female', 'Any'], required: true },
  status: { type: String, enum: ['open', 'assigned', 'completed', 'cancelled'], default: 'open' },
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  offers: [
    {
      freelancerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      amount: Number,
      coverLetter: String,
      status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
      createdAt: { type: Date, default: Date.now }
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model('Job', jobSchema);


