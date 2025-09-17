// In-memory store for demo (replace with DB in production)
const { inMemoryJobs } = require('./sharedJobsStore');

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
    
    const jobs = inMemoryJobs.filter(j => String(j.clientId) === String(clientId) && j.status !== 'completed');
    console.log('🔍 getMyJobs - filtered jobs:', jobs.length);
    console.log('🔍 getMyJobs - filtered jobs details:', jobs);
    
    res.json({ success: true, jobs });
  } catch (error) {
    console.error('❌ getMyJobs error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch jobs' });
  }
};

const getJobHistory = async (req, res) => {
  try {
    const clientId = req.user?._id || req.user?.id || req.user?.userId || 'client-dev';
    const jobs = inMemoryJobs.filter(j => String(j.clientId) === String(clientId) && j.status === 'completed');
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
  res.json({ success: true, message: 'Payment processed successfully' });
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
