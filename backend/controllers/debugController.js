// Debug controller for troubleshooting job posting and retrieval
const { inMemoryJobs } = require('./sharedJobsStore');

const debugJobs = async (req, res) => {
  try {
    const clientId = req.user?._id || req.user?.id || req.user?.userId || 'client-dev';
    
    const debugInfo = {
      timestamp: new Date().toISOString(),
      user: {
        raw: req.user,
        clientId: clientId,
        extractedFrom: {
          _id: req.user?._id,
          id: req.user?.id,
          userId: req.user?.userId
        }
      },
      jobsStore: {
        totalJobs: inMemoryJobs.length,
        allJobs: inMemoryJobs.map(job => ({
          id: job.id,
          title: job.title,
          clientId: job.clientId,
          status: job.status,
          createdAt: job.createdAt
        }))
      },
      filteredJobs: {
        myActiveJobs: inMemoryJobs.filter(j => j.clientId === clientId && j.status !== 'completed'),
        myCompletedJobs: inMemoryJobs.filter(j => j.clientId === clientId && j.status === 'completed'),
        otherJobs: inMemoryJobs.filter(j => j.clientId !== clientId)
      }
    };
    
    res.json({ success: true, debug: debugInfo });
  } catch (error) {
    console.error('Debug error:', error);
    res.status(500).json({ success: false, message: 'Debug failed', error: error.message });
  }
};

const clearJobs = async (req, res) => {
  try {
    const beforeCount = inMemoryJobs.length;
    inMemoryJobs.length = 0; // Clear the array
    const afterCount = inMemoryJobs.length;
    
    res.json({ 
      success: true, 
      message: `Cleared ${beforeCount} jobs. Now ${afterCount} jobs in store.` 
    });
  } catch (error) {
    console.error('Clear jobs error:', error);
    res.status(500).json({ success: false, message: 'Failed to clear jobs', error: error.message });
  }
};

const addTestJob = async (req, res) => {
  try {
    const clientId = req.user?._id || req.user?.id || req.user?.userId || 'client-dev';
    
    const testJob = {
      id: 'test-job-' + Date.now(),
      title: 'Test Job - ' + new Date().toLocaleTimeString(),
      address: 'Test Address',
      pincode: '123456',
      budget: 1000,
      category: 'Test',
      gender: 'Any',
      status: 'open',
      clientId: clientId,
      createdAt: new Date().toISOString(),
      offers: []
    };
    
    inMemoryJobs.unshift(testJob);
    
    res.json({ 
      success: true, 
      message: 'Test job added',
      job: testJob,
      totalJobs: inMemoryJobs.length
    });
  } catch (error) {
    console.error('Add test job error:', error);
    res.status(500).json({ success: false, message: 'Failed to add test job', error: error.message });
  }
};

module.exports = {
  debugJobs,
  clearJobs,
  addTestJob
};
