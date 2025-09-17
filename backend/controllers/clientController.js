// In-memory store for demo (replace with DB in production)
const { inMemoryJobs } = require('./sharedJobsStore');

const postJob = async (req, res) => {
  try {
    console.log('📝 postJob - req.user:', req.user);
    console.log('📝 postJob - req.user._id:', req.user?._id);
    console.log('📝 postJob - req.user.id:', req.user?.id);
    console.log('📝 postJob - req.user.userId:', req.user?.userId);
    
    const clientId = req.user?._id || req.user?.id || req.user?.userId || 'client-dev';
    const { title, address, pincode, budget, category, gender } = req.body;

    console.log('📝 postJob - final clientId:', clientId);
    console.log('📝 postJob - job data:', { title, address, pincode, budget, category, gender });

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
  res.json({ success: true, message: 'Offer accepted successfully' });
};

const rejectOffer = async (req, res) => {
  res.json({ success: true, message: 'Offer rejected successfully' });
};

const payJob = async (req, res) => {
  res.json({ success: true, message: 'Payment processed successfully' });
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
  deleteJob
};
