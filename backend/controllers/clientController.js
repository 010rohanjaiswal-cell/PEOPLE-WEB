// In-memory store for demo (replace with DB in production)
const { inMemoryJobs, saveJobsToFile } = require('./sharedJobsStore');

const postJob = async (req, res) => {
  try {
    console.log('📝 postJob - req.user:', req.user);
    console.log('📝 postJob - req.user._id:', req.user?._id);
    console.log('📝 postJob - req.user.id:', req.user?.id);
    console.log('📝 postJob - req.user.userId:', req.user?.userId);
    
    const clientId = req.user?._id || req.user?.id || req.user?.userId || 'client-dev';
    const { title, address, pincode, budget, category, gender, description } = req.body;

    console.log('📝 postJob - final clientId:', clientId);
    console.log('📝 postJob - job data:', { title, address, pincode, budget, category, gender, description });

    if (!title || !address || !pincode || !budget || !category || !gender) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const job = {
      id: 'job-' + Date.now(),
      title,
      address,
      pincode,
      budget: Number(budget),
      category,
      gender,
      description: description || '', // Optional field
      status: 'open',
      clientId,
      createdAt: new Date().toISOString(),
      offers: []
    };
    
    console.log('📝 postJob - created job:', job);
    inMemoryJobs.unshift(job);
    console.log('📝 postJob - total jobs after posting:', inMemoryJobs.length);
    console.log('📝 postJob - job added to in-memory store with clientId:', clientId);
    console.log('📝 postJob - current timestamp:', new Date().toISOString());
    
    // Save to file for persistence
    saveJobsToFile();

    res.json({ success: true, job });
  } catch (error) {
    console.error('❌ postJob error:', error);
    res.status(500).json({ success: false, message: 'Failed to post job' });
  }
};

const getMyJobs = async (req, res) => {
  try {
    console.log('🔍 getMyJobs - req.user:', req.user);
    console.log('🔍 getMyJobs - req.user._id:', req.user?._id);
    console.log('🔍 getMyJobs - req.user.id:', req.user?.id);
    console.log('🔍 getMyJobs - req.user.userId:', req.user?.userId);
    
    const clientId = req.user?._id || req.user?.id || req.user?.userId || 'client-dev';
    console.log('🔍 getMyJobs - final clientId:', clientId);
    console.log('🔍 getMyJobs - total jobs in store:', inMemoryJobs.length);
    console.log('🔍 getMyJobs - all jobs:', inMemoryJobs.map(j => ({ id: j.id, clientId: j.clientId, status: j.status })));
    
    // Show jobs that are active (open, assigned, in-progress, work_done, completed) but not fully_completed or cancelled
    const activeStatuses = ['open', 'assigned', 'in-progress', 'work_done', 'completed'];
    const jobs = inMemoryJobs.filter(j => 
      String(j.clientId) === String(clientId) && 
      activeStatuses.includes(j.status)
    );
    
    console.log('🔍 getMyJobs - activeStatuses:', activeStatuses);
    console.log('🔍 getMyJobs - clientId type:', typeof clientId, 'value:', clientId);
    console.log('🔍 getMyJobs - filtered jobs:', jobs.length);
    console.log('🔍 getMyJobs - filtered jobs details:', jobs);
    
    // Additional debug: show jobs that match clientId but have different status
    const clientJobs = inMemoryJobs.filter(j => String(j.clientId) === String(clientId));
    console.log('🔍 getMyJobs - all client jobs (any status):', clientJobs.map(j => ({ id: j.id, status: j.status })));
    
    res.json({ success: true, jobs });
  } catch (error) {
    console.error('❌ getMyJobs error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch jobs' });
  }
};

const getJobHistory = async (req, res) => {
  try {
    const clientId = req.user?._id || req.user?.id || req.user?.userId || 'client-dev';
    const jobs = inMemoryJobs.filter(j => String(j.clientId) === String(clientId) && j.status === 'fully_completed');
    res.json({ success: true, jobs });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch job history' });
  }
};

const acceptOffer = async (req, res) => {
  try {
    const { jobId } = req.params;
    const { freelancerId } = req.body;
    const clientId = req.user?._id || req.user?.id || req.user?.userId || 'client-dev';
    
    console.log('✅ acceptOffer - jobId:', jobId);
    console.log('✅ acceptOffer - freelancerId:', freelancerId);
    console.log('✅ acceptOffer - clientId:', clientId);
    
    // Find the job
    const jobIndex = inMemoryJobs.findIndex(j => (j.id || (j._id && String(j._id))) === jobId);
    if (jobIndex === -1) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }
    
    const job = inMemoryJobs[jobIndex];
    
    // Check if client owns the job
    if (String(job.clientId) !== String(clientId)) {
      return res.status(403).json({ success: false, message: 'You can only accept offers for your own jobs' });
    }
    
    // Check if job is still open
    if (job.status !== 'open') {
      return res.status(400).json({ 
        success: false, 
        message: 'Job is no longer available for offers' 
      });
    }
    
    // Find the offer from the specified freelancer
    if (!Array.isArray(job.offers)) {
      return res.status(404).json({ success: false, message: 'No offers found for this job' });
    }
    
    const offerIndex = job.offers.findIndex(offer => String(offer.freelancer.id) === String(freelancerId));
    if (offerIndex === -1) {
      return res.status(404).json({ success: false, message: 'Offer not found' });
    }
    
    const acceptedOffer = job.offers[offerIndex];
    
    // Mark the accepted offer as accepted
    job.offers[offerIndex] = {
      ...acceptedOffer,
      status: 'accepted',
      acceptedAt: new Date().toISOString()
    };
    
    // Mark all other offers as rejected
    job.offers.forEach((offer, index) => {
      if (index !== offerIndex) {
        offer.status = 'rejected';
        offer.rejectedAt = new Date().toISOString();
      }
    });
    
    // Update job status to assigned
    job.status = 'assigned';
    job.assignedFreelancer = {
      id: acceptedOffer.freelancer.id,
      fullName: acceptedOffer.freelancer.fullName,
      profilePhoto: acceptedOffer.freelancer.profilePhoto,
      freelancerId: acceptedOffer.freelancer.freelancerId
    };
    job.assignedAt = new Date().toISOString();
    job.acceptedOffer = acceptedOffer;
    
    console.log('✅ acceptOffer - job updated successfully');
    console.log('✅ acceptOffer - assigned freelancer:', job.assignedFreelancer);
    
    // Save to file for persistence
    saveJobsToFile();
    
    res.json({ 
      success: true, 
      message: 'Offer accepted successfully',
      job: job,
      acceptedOffer: acceptedOffer
    });
  } catch (error) {
    console.error('❌ acceptOffer error:', error);
    res.status(500).json({ success: false, message: 'Failed to accept offer' });
  }
};

const rejectOffer = async (req, res) => {
  try {
    const { jobId } = req.params;
    const { freelancerId } = req.body;
    const clientId = req.user?._id || req.user?.id || req.user?.userId || 'client-dev';
    
    console.log('❌ rejectOffer - jobId:', jobId);
    console.log('❌ rejectOffer - freelancerId:', freelancerId);
    console.log('❌ rejectOffer - clientId:', clientId);
    
    // Find the job
    const jobIndex = inMemoryJobs.findIndex(j => (j.id || (j._id && String(j._id))) === jobId);
    if (jobIndex === -1) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }
    
    const job = inMemoryJobs[jobIndex];
    
    // Check if client owns the job
    if (String(job.clientId) !== String(clientId)) {
      return res.status(403).json({ success: false, message: 'You can only reject offers for your own jobs' });
    }
    
    // Find the offer from the specified freelancer
    if (!Array.isArray(job.offers)) {
      return res.status(404).json({ success: false, message: 'No offers found for this job' });
    }
    
    const offerIndex = job.offers.findIndex(offer => String(offer.freelancer.id) === String(freelancerId));
    if (offerIndex === -1) {
      return res.status(404).json({ success: false, message: 'Offer not found' });
    }
    
    // Mark the offer as rejected
    job.offers[offerIndex] = {
      ...job.offers[offerIndex],
      status: 'rejected',
      rejectedAt: new Date().toISOString()
    };
    
    console.log('❌ rejectOffer - offer rejected successfully');
    
    // Save to file for persistence
    saveJobsToFile();
    
    res.json({ 
      success: true, 
      message: 'Offer rejected successfully',
      job: job
    });
  } catch (error) {
    console.error('❌ rejectOffer error:', error);
    res.status(500).json({ success: false, message: 'Failed to reject offer' });
  }
};

const payJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    const { paymentMethod } = req.body;
    const clientId = req.user?._id || req.user?.id || req.user?.userId || 'client-dev';

    console.log('💳 payJob - jobId:', jobId);
    console.log('💳 payJob - paymentMethod:', paymentMethod);
    console.log('💳 payJob - clientId:', clientId);

    // Find the job
    const jobIndex = inMemoryJobs.findIndex(j => (j.id || (j._id && String(j._id))) === jobId);
    if (jobIndex === -1) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }
    
    const job = inMemoryJobs[jobIndex];
    
    // Check if client owns the job
    if (String(job.clientId) !== String(clientId)) {
      return res.status(403).json({ success: false, message: 'You can only pay for your own jobs' });
    }
    
    // Check if job is in work_done status
    if (job.status !== 'work_done') {
      return res.status(400).json({ 
        success: false, 
        message: 'Job must be marked as work done before payment' 
      });
    }

    // Update job status to completed
    job.status = 'completed';
    job.paymentMethod = paymentMethod;
    job.paidAt = new Date().toISOString();
    job.paidBy = clientId;

    console.log('💳 payJob - job marked as completed');
    console.log('💳 payJob - payment method:', paymentMethod);
    
    // Credit freelancer's wallet
    const User = require('../models/User');
    const freelancerId = job.assignedFreelancer.id;
    const jobAmount = job.budget;
    
    try {
      const freelancer = await User.findById(freelancerId);
      if (freelancer) {
        // Update wallet balance
        freelancer.wallet.balance = (freelancer.wallet.balance || 0) + jobAmount;
        freelancer.wallet.totalEarnings = (freelancer.wallet.totalEarnings || 0) + jobAmount;
        
        // Add transaction record
        if (!freelancer.wallet.transactions) {
          freelancer.wallet.transactions = [];
        }
        
        freelancer.wallet.transactions.unshift({
          id: 'txn-' + Date.now(),
          type: 'credit',
          amount: jobAmount,
          description: `Payment for job: ${job.title}`,
          clientName: req.user.fullName,
          jobId: job.id,
          createdAt: new Date().toISOString()
        });
        
        await freelancer.save();
        console.log('💰 payJob - freelancer wallet credited:', { freelancerId, amount: jobAmount });
      } else {
        console.log('⚠️ payJob - freelancer not found:', freelancerId);
      }
    } catch (walletError) {
      console.error('❌ payJob - wallet credit error:', walletError);
      // Don't fail the payment if wallet update fails
    }

    // For cash payments, add commission entry to freelancer's ledger
    if (paymentMethod === 'cash') {
      try {
        const commissionController = require('./commissionController');
        const commission = Math.round(jobAmount * 0.1 * 100) / 100; // 10% commission
        
        // Add commission entry
        const commissionEntry = {
          freelancerId: freelancerId,
          jobId: job.id,
          jobTitle: job.title,
          clientName: req.user.fullName || 'Unknown Client',
          amount: commission,
          totalAmount: jobAmount
        };
        
        // Create a mock request/response for the commission controller
        const mockReq = {
          body: commissionEntry,
          user: req.user
        };
        
        const mockRes = {
          json: (data) => {
            if (data.success) {
              console.log('✅ payJob - commission entry added:', data.entry);
            } else {
              console.error('❌ payJob - commission entry failed:', data.message);
            }
          },
          status: (code) => ({
            json: (data) => {
              console.error(`❌ payJob - commission entry error ${code}:`, data.message);
            }
          })
        };
        
        await commissionController.addCommissionEntry(mockReq, mockRes);
      } catch (commissionError) {
        console.error('❌ payJob - commission entry error:', commissionError);
        // Don't fail the payment if commission entry fails
      }
    }
    
    // Save to file for persistence
    saveJobsToFile();

    res.json({ 
      success: true, 
      message: 'Payment processed successfully',
      job: job
    });
  } catch (error) {
    console.error('❌ payJob error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to process payment' 
    });
  }
};

const updateJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    const clientId = req.user?._id || req.user?.id || req.user?.userId || 'client-dev';
    const { title, address, pincode, budget, category, gender, description } = req.body;
    
    console.log('✏️ updateJob - jobId:', jobId);
    console.log('✏️ updateJob - clientId:', clientId);
    console.log('✏️ updateJob - update data:', { title, address, pincode, budget, category, gender, description });
    
    // Find the job
    const jobIndex = inMemoryJobs.findIndex(j => (j.id || (j._id && String(j._id))) === jobId);
    if (jobIndex === -1) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }
    
    const job = inMemoryJobs[jobIndex];
    
    // Check if client owns the job
    if (String(job.clientId) !== String(clientId)) {
      return res.status(403).json({ success: false, message: 'You can only edit your own jobs' });
    }
    
    // Check if job can be edited (not assigned and no accepted offers)
    if (job.status === 'assigned' || job.status === 'in-progress' || job.status === 'completed') {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot edit job that has been assigned to a freelancer' 
      });
    }
    
    // Check if any offers have been accepted
    const hasAcceptedOffers = Array.isArray(job.offers) && 
      job.offers.some(offer => offer.status === 'accepted');
    
    if (hasAcceptedOffers) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot edit job with accepted offers' 
      });
    }
    
    // Validate required fields
    if (!title || !address || !pincode || !budget || !category || !gender) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    
    // Update the job
    inMemoryJobs[jobIndex] = {
      ...job,
      title,
      address,
      pincode,
      budget: Number(budget),
      category,
      gender,
      description: description || '',
      updatedAt: new Date().toISOString()
    };
    
    console.log('✏️ updateJob - job updated successfully');
    console.log('✏️ updateJob - updated job:', inMemoryJobs[jobIndex]);
    
    // Save to file for persistence
    saveJobsToFile();
    
    res.json({ success: true, message: 'Job updated successfully', job: inMemoryJobs[jobIndex] });
  } catch (error) {
    console.error('❌ updateJob error:', error);
    res.status(500).json({ success: false, message: 'Failed to update job' });
  }
};

const deleteJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    const clientId = req.user?._id || req.user?.id || req.user?.userId || 'client-dev';
    
    console.log('🗑️ deleteJob - jobId:', jobId);
    console.log('🗑️ deleteJob - clientId:', clientId);
    
    // Find the job
    const jobIndex = inMemoryJobs.findIndex(j => (j.id || (j._id && String(j._id))) === jobId);
    if (jobIndex === -1) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }
    
    const job = inMemoryJobs[jobIndex];
    
    // Check if client owns the job
    if (String(job.clientId) !== String(clientId)) {
      return res.status(403).json({ success: false, message: 'You can only delete your own jobs' });
    }
    
    // Check if job can be deleted (not assigned and no accepted offers)
    if (job.status === 'assigned' || job.status === 'in-progress' || job.status === 'completed') {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot delete job that has been assigned to a freelancer' 
      });
    }
    
    // Check if any offers have been accepted
    const hasAcceptedOffers = Array.isArray(job.offers) && 
      job.offers.some(offer => offer.status === 'accepted');
    
    if (hasAcceptedOffers) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot delete job with accepted offers' 
      });
    }
    
    // Delete the job
    inMemoryJobs.splice(jobIndex, 1);
    console.log('🗑️ deleteJob - job deleted successfully');
    console.log('🗑️ deleteJob - remaining jobs:', inMemoryJobs.length);
    
    // Save to file for persistence
    saveJobsToFile();
    
    res.json({ success: true, message: 'Job deleted successfully' });
  } catch (error) {
    console.error('❌ deleteJob error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete job' });
  }
};

module.exports = {
  postJob,
  getMyJobs,
  getJobHistory,
  acceptOffer,
  rejectOffer,
  payJob,
  updateJob,
  deleteJob
};
