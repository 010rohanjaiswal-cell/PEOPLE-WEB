const Job = require('../models/Job');

// Get available jobs for freelancers
const getAvailableJobs = async (req, res) => {
  try {
    console.log('🔍 Fetching available jobs');
    
    // Mock jobs for now - in production, this would query the database
    const mockJobs = [
      {
        id: 'job-1',
        title: 'Website Development',
        description: 'Create a modern website for a small business',
        category: 'Web Development',
        budget: 15000,
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        location: 'Remote',
        status: 'open',
        clientId: 'client-1',
        createdAt: new Date()
      },
      {
        id: 'job-2',
        title: 'Mobile App Design',
        description: 'Design UI/UX for a mobile application',
        category: 'Design',
        budget: 25000,
        deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
        location: 'Mumbai',
        status: 'open',
        clientId: 'client-2',
        createdAt: new Date()
      },
      {
        id: 'job-3',
        title: 'Content Writing',
        description: 'Write blog posts for a tech company',
        category: 'Writing',
        budget: 8000,
        deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
        location: 'Remote',
        status: 'open',
        clientId: 'client-3',
        createdAt: new Date()
      }
    ];

    res.json({
      success: true,
      jobs: mockJobs,
      total: mockJobs.length
    });
  } catch (error) {
    console.error('Error fetching available jobs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch available jobs'
    });
  }
};

// Get job by ID
const getJobById = async (req, res) => {
  try {
    const { jobId } = req.params;
    console.log('🔍 Fetching job:', jobId);
    
    // Mock job - in production, this would query the database
    const mockJob = {
      id: jobId,
      title: 'Website Development',
      description: 'Create a modern website for a small business',
      category: 'Web Development',
      budget: 15000,
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      location: 'Remote',
      status: 'open',
      clientId: 'client-1',
      createdAt: new Date()
    };

    res.json({
      success: true,
      job: mockJob
    });
  } catch (error) {
    console.error('Error fetching job:', error);
    res.status(500).json({
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
