// Debug controller for troubleshooting job posting and retrieval
const { inMemoryJobs, saveJobsToFile } = require('./sharedJobsStore');
const databaseService = require('../services/databaseService');
const User = require('../models/User');

const debugJobs = async (req, res) => {
  try {
    const clientId = req.user?._id || req.user?.id || req.user?.userId || 'client-dev';

    // Prefer MongoDB for persistence
    let allJobs = [];
    try {
      allJobs = await databaseService.getAllJobs();
    } catch (e) {
      // Fallback to in-memory/file if DB not available
      allJobs = inMemoryJobs;
    }

    const myActiveJobs = allJobs.filter(j => String(j.clientId) === String(clientId) && j.status !== 'completed');
    const myCompletedJobs = allJobs.filter(j => String(j.clientId) === String(clientId) && j.status === 'completed');
    const otherJobs = allJobs.filter(j => String(j.clientId) !== String(clientId));

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
        totalJobs: allJobs.length,
        allJobs: allJobs.map(job => ({
          id: job.id,
          title: job.title,
          clientId: job.clientId,
          status: job.status,
          createdAt: job.createdAt
        }))
      },
      filteredJobs: {
        myActiveJobs: myActiveJobs,
        myCompletedJobs: myCompletedJobs,
        otherJobs: otherJobs
      },
      filteringDebug: {
        clientIdType: typeof clientId,
        clientIdValue: clientId,
        jobClientIds: allJobs.map(j => ({ id: j.id, clientId: j.clientId, clientIdType: typeof j.clientId })),
        comparisonResults: allJobs.map(j => ({
          id: j.id,
          jobClientId: j.clientId,
          extractedClientId: clientId,
          isEqual: j.clientId === clientId,
          strictEqual: j.clientId === clientId,
          looseEqual: j.clientId == clientId,
          stringEqual: String(j.clientId) === String(clientId)
        }))
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
    // Clear MongoDB jobs first
    const result = await databaseService.clearAllJobs();
    
    // Also clear in-memory/file for legacy compatibility
    const beforeCount = inMemoryJobs.length;
    inMemoryJobs.length = 0; // Clear the array
    saveJobsToFile();
    
    res.json({ 
      success: true, 
      message: `Cleared ${result.deletedCount} MongoDB jobs and ${beforeCount} legacy in-memory jobs.`
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
      budget: 10,
      category: 'Test',
      gender: 'Any',
      status: 'open',
      clientId: clientId,
      createdAt: new Date(),
      offers: []
    };

    // Persist to MongoDB
    const created = await databaseService.createJob(testJob);

    res.json({ 
      success: true, 
      message: 'Test job added',
      job: created,
      totalJobs: (await databaseService.getAllJobs()).length
    });
  } catch (error) {
    console.error('Add test job error:', error);
    res.status(500).json({ success: false, message: 'Failed to add test job', error: error.message });
  }
};

// Simple payment service debug
const debugPayment = async (req, res) => {
  try {
    const debugInfo = {
      timestamp: new Date().toISOString(),
      dependencies: {
        axios: testModule('axios'),
        cryptoJs: testModule('crypto-js')
      },
      services: {
        paymentService: testPaymentService(),
        paymentController: testPaymentController()
      },
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        PAYMENT_REDIRECT_URL: process.env.PAYMENT_REDIRECT_URL
      }
    };

    res.json({
      success: true,
      message: 'Payment debug completed',
      debugInfo
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Payment debug failed',
      error: error.message
    });
  }
};

// Helper function to test module loading
function testModule(moduleName) {
  try {
    require(moduleName);
    return { available: true };
  } catch (error) {
    return { available: false, error: error.message };
  }
}

// Test payment service
function testPaymentService() {
  try {
    const service = require('../services/paymentService');
    return { available: true, hasCalculateAmounts: typeof service.calculateAmounts === 'function' };
  } catch (error) {
    try {
      const minimalService = require('../services/paymentServiceMinimal');
      return { available: true, type: 'minimal', hasCalculateAmounts: typeof minimalService.calculateAmounts === 'function' };
    } catch (minimalError) {
      return { available: false, error: error.message };
    }
  }
}

// Test payment controller
function testPaymentController() {
  try {
    const controller = require('../controllers/paymentController');
    return { available: true, hasCreateUPIPayment: typeof controller.createUPIPayment === 'function' };
  } catch (error) {
    try {
      const minimalController = require('../controllers/paymentControllerMinimal');
      return { available: true, type: 'minimal', hasCreateUPIPayment: typeof minimalController.createUPIPayment === 'function' };
    } catch (minimalError) {
      return { available: false, error: error.message };
    }
  }
}

const updateJobStatus = async (req, res) => {
  try {
    const { jobId } = req.params;
    const { status } = req.body;

    // Update in MongoDB
    const updated = await databaseService.updateJob(jobId, { status });
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    res.json({ 
      success: true, 
      message: `Job status updated to ${status}`,
      job: updated
    });
  } catch (error) {
    console.error('Update job status error:', error);
    res.status(500).json({ success: false, message: 'Failed to update job status', error: error.message });
  }
};

// Create a test freelancer user
const createTestFreelancer = async (req, res) => {
  try {
    const phone = req.body?.phone || ('+91' + Math.floor(9000000000 + Math.random()*99999999));
    const user = new User({
      phone,
      role: 'freelancer',
      fullName: req.body?.fullName || 'Test Freelancer',
      verificationStatus: 'approved',
      wallet: { balance: 0, totalEarnings: 0, transactions: [] }
    });
    await user.save();
    res.json({ success: true, freelancer: { _id: user._id, phone: user.phone, fullName: user.fullName } });
  } catch (error) {
    console.error('Create test freelancer error:', error);
    res.status(500).json({ success: false, message: 'Failed to create test freelancer', error: error.message });
  }
};

// Assign a job to a freelancer directly
const assignJobToFreelancer = async (req, res) => {
  try {
    const { jobId, freelancerId } = req.body;
    if (!jobId || !freelancerId) {
      return res.status(400).json({ success: false, message: 'jobId and freelancerId are required' });
    }

    const user = await User.findById(freelancerId);
    if (!user) return res.status(404).json({ success: false, message: 'Freelancer not found' });

    const updated = await databaseService.updateJob(jobId, {
      status: 'assigned',
      assignedFreelancer: {
        id: user._id,
        fullName: user.fullName,
        profilePhoto: user.profilePhoto || null,
        freelancerId: user.freelancerId || null
      },
      assignedAt: new Date(),
      pickupMethod: 'direct'
    });

    if (!updated) return res.status(404).json({ success: false, message: 'Job not found' });
    res.json({ success: true, job: updated });
  } catch (error) {
    console.error('Assign job error:', error);
    res.status(500).json({ success: false, message: 'Failed to assign job', error: error.message });
  }
};

// Mark work done
const markWorkDone = async (req, res) => {
  try {
    const { jobId, freelancerId } = req.body;
    const updated = await databaseService.updateJob(jobId, {
      status: 'work_done',
      workDoneAt: new Date(),
      workDoneBy: freelancerId
    });
    if (!updated) return res.status(404).json({ success: false, message: 'Job not found' });
    res.json({ success: true, job: updated });
  } catch (error) {
    console.error('Mark work done error:', error);
    res.status(500).json({ success: false, message: 'Failed to mark work done', error: error.message });
  }
};

module.exports.createTestFreelancer = createTestFreelancer;
module.exports.assignJobToFreelancer = assignJobToFreelancer;
module.exports.markWorkDone = markWorkDone;

module.exports = {
  debugJobs,
  clearJobs,
  addTestJob,
  debugPayment,
  updateJobStatus
};
