// In-memory store for demo (replace with DB in production)
const { inMemoryJobs } = require('./sharedJobsStore');

const postJob = async (req, res) => {
  try {
    const clientId = req.user?._id || req.user?.id || req.user?.userId || 'client-dev';
    const { title, address, pincode, budget, category, gender } = req.body;

    console.log('📝 postJob - clientId:', clientId);
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
    const clientId = req.user?._id || req.user?.id || req.user?.userId || 'client-dev';
    console.log('🔍 getMyJobs - clientId:', clientId);
    console.log('🔍 getMyJobs - total jobs in store:', inMemoryJobs.length);
    console.log('🔍 getMyJobs - all jobs:', inMemoryJobs.map(j => ({ id: j.id, clientId: j.clientId, status: j.status })));
    
    const jobs = inMemoryJobs.filter(j => j.clientId === clientId && j.status !== 'completed');
    console.log('🔍 getMyJobs - filtered jobs:', jobs.length);
    
    res.json({ success: true, jobs });
  } catch (error) {
    console.error('❌ getMyJobs error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch jobs' });
  }
};

const getJobHistory = async (req, res) => {
  try {
    const clientId = req.user?._id || req.user?.id || req.user?.userId || 'client-dev';
    const jobs = inMemoryJobs.filter(j => j.clientId === clientId && j.status === 'completed');
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

module.exports = {
  postJob,
  getMyJobs,
  getJobHistory,
  acceptOffer,
  rejectOffer,
  payJob
};
