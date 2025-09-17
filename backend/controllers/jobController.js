// const Job = require('../models/Job'); // Using mock data for now
const { inMemoryJobs } = require('./sharedJobsStore') || {};

// Get available jobs for freelancers
const getAvailableJobs = async (req, res) => {
  try {
    console.log('🔍 Fetching available jobs (real, no mock fallback)');

    const jobs = Array.isArray(inMemoryJobs)
      ? inMemoryJobs.filter(job => job.status === 'open')
      : [];

    return res.json({ success: true, jobs, total: jobs.length });
  } catch (error) {
    console.error('Error fetching available jobs:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch available jobs'
    });
  }
};

// Get job by ID
const getJobById = async (req, res) => {
  try {
    const { jobId } = req.params;
    console.log('🔍 Fetching job by ID:', jobId);

    const job = Array.isArray(inMemoryJobs)
      ? inMemoryJobs.find(j => (j.id || (j._id && String(j._id))) === jobId)
      : null;

    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    return res.json({ success: true, job });
  } catch (error) {
    console.error('Error fetching job:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch job'
    });
  }
};

// Apply for a job
const applyForJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    const { coverLetter, proposedAmount } = req.body;
    const freelancerId = req.user.userId;
    
    console.log('📝 Freelancer applying for job:', jobId);
    console.log('👤 Freelancer ID:', freelancerId);
    
    // Mock application - in production, this would save to database
    const application = {
      id: 'app-' + Date.now(),
      jobId,
      freelancerId,
      coverLetter,
      proposedAmount,
      status: 'pending',
      appliedAt: new Date()
    };

    res.json({
      success: true,
      message: 'Application submitted successfully',
      application
    });
  } catch (error) {
    console.error('Error applying for job:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to apply for job'
    });
  }
};

// Pick up a job (direct assignment)
const pickupJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    const freelancerId = req.user.userId;
    
    console.log('🎯 Freelancer picking up job:', jobId);
    console.log('👤 Freelancer ID:', freelancerId);
    
    // Mock job pickup - in production, this would update the database
    const assignment = {
      id: 'assign-' + Date.now(),
      jobId,
      freelancerId,
      status: 'assigned',
      assignedAt: new Date()
    };

    res.json({
      success: true,
      message: 'Job picked up successfully',
      assignment
    });
  } catch (error) {
    console.error('Error picking up job:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to pickup job'
    });
  }
};

module.exports = {
  getAvailableJobs,
  getJobById,
  applyForJob,
  pickupJob
};
