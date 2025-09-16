// In-memory store for demo (replace with DB in production)
const { inMemoryJobs } = require('./sharedJobsStore');

const postJob = async (req, res) => {
  try {
    const clientId = req.user?._id || req.user?.id || req.user?.userId || 'client-dev';
    const { title, address, pincode, budget, category, gender } = req.body;

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
    inMemoryJobs.unshift(job);

    res.json({ success: true, job });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to post job' });
  }
};

const getMyJobs = async (req, res) => {
  try {
    const clientId = req.user?._id || req.user?.id || req.user?.userId || 'client-dev';
    const jobs = inMemoryJobs.filter(j => j.clientId === clientId && j.status !== 'completed');
    res.json({ success: true, jobs });
  } catch (error) {
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
