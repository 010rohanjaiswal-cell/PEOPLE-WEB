const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const clientRoutes = require('./routes/client');
const freelancerRoutes = require('./routes/freelancer');
const adminRoutes = require('./routes/admin');
const jobRoutes = require('./routes/jobs');
const debugRoutes = require('./routes/debug');

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());

// Rate limiting - configured for production scale
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10000, // limit each IP to 10,000 requests per 15 minutes (suitable for millions of users)
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
// Apply general rate limiting
app.use(limiter);

// More restrictive rate limiting for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 auth requests per 15 minutes
  message: 'Too many authentication attempts from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply auth rate limiting to authentication routes
app.use('/api/auth', authLimiter);

// CORS configuration - allow configured origins and any localhost port
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',')
  : [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002',
      'https://your-frontend-domain.com'
    ];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser requests (no origin)
    if (!origin) return callback(null, true);
    // Allow explicit list or any localhost:* origin
    const isWhitelisted = allowedOrigins.includes(origin) || /^(http:\/\/|https:\/\/)localhost:\d+$/.test(origin);
    if (isWhitelisted) {
      return callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}`);
      return callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✅ Connected to MongoDB');
})
.catch((error) => {
  console.error('❌ MongoDB connection error:', error);
  process.exit(1);
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Freelancing Platform Backend is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// Dependency check endpoint
app.get('/dependencies', (req, res) => {
  const dependencies = {
    axios: false,
    cryptoJs: false,
    paymentService: false
  };
  
  try {
    require('axios');
    dependencies.axios = true;
  } catch (e) {
    console.log('❌ axios not available');
  }
  
  try {
    require('crypto-js');
    dependencies.cryptoJs = true;
  } catch (e) {
    console.log('❌ crypto-js not available');
  }
  
  try {
    require('./services/paymentService');
    dependencies.paymentService = true;
  } catch (e) {
    console.log('❌ payment service not available');
  }
  
  res.json({
    dependencies,
    allAvailable: dependencies.axios && dependencies.cryptoJs && dependencies.paymentService,
    message: dependencies.axios && dependencies.cryptoJs && dependencies.paymentService 
      ? 'All payment dependencies are available' 
      : 'Some payment dependencies are missing'
  });
});

// Payment service test endpoint
app.get('/test-payment-service', async (req, res) => {
  try {
    const paymentService = require('./services/paymentService');
    
    // Test dependency check
    const dependencyTest = paymentService.testDependencies();
    
    // Test amount calculation
    const amounts = paymentService.calculateAmounts(100);
    
    res.json({
      success: true,
      dependencyTest,
      amounts,
      message: 'Payment service is working correctly'
    });
  } catch (error) {
    res.json({
      success: false,
      error: error.message,
      message: 'Payment service test failed'
    });
  }
});

// Test payment controller specifically
app.get('/test-payment-controller', async (req, res) => {
  try {
    // Simulate the same loading logic as payment controller
    let paymentService;
    let paymentServiceAvailable = false;

    const loadPaymentService = async () => {
      if (!paymentService && !paymentServiceAvailable) {
        try {
          paymentService = require('./services/paymentService');
          paymentServiceAvailable = true;
          console.log('✅ Payment service dependencies loaded successfully');
        } catch (error) {
          console.warn('⚠️ Full payment service not available, using minimal service:', error.message);
          try {
            paymentService = require('./services/paymentServiceMinimal');
            paymentServiceAvailable = true;
            console.log('✅ Minimal payment service loaded successfully');
          } catch (minimalError) {
            console.error('❌ Failed to load any payment service:', minimalError);
            paymentServiceAvailable = false;
            throw new Error('Payment service not available');
          }
        }
      }
      return paymentService;
    };

    const service = await loadPaymentService();
    const dependencyTest = service.testDependencies();
    const amounts = service.calculateAmounts(100);

    res.json({
      success: true,
      serviceLoaded: !!service,
      serviceAvailable: paymentServiceAvailable,
      dependencyTest,
      amounts,
      message: 'Payment controller test successful'
    });
  } catch (error) {
    res.json({
      success: false,
      error: error.message,
      message: 'Payment controller test failed'
    });
  }
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/client', clientRoutes);
app.use('/api/freelancer', freelancerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/commission', require('./routes/commission'));
// Try to load payment routes, but don't fail if unavailable
try {
  app.use('/api/payment', require('./routes/payment'));
  console.log('✅ Payment routes loaded successfully');
} catch (error) {
  console.warn('⚠️ Payment routes not available:', error.message);
  // Add a dummy route for graceful degradation
  app.use('/api/payment', (req, res) => {
    res.status(503).json({ success: false, message: 'Payment service temporarily unavailable' });
  });
}

// Process successful payment
const processSuccessfulPayment = async (orderId, req, res) => {
  try {
    console.log('🔄 Processing successful payment for order:', orderId);
    
    // Extract job ID from order ID (format: ORDER_jobId_timestamp)
    const jobIdMatch = orderId.match(/ORDER_(.+)_\d+/);
    if (!jobIdMatch) {
      console.error('❌ Could not extract job ID from order ID:', orderId);
      return res.json({ 
        success: false, 
        message: 'Invalid order ID format',
        orderId: orderId 
      });
    }
    
    const jobId = jobIdMatch[1];
    console.log('📋 Extracted job ID:', jobId);
    
    // Load jobs data
    const fs = require('fs');
    const path = require('path');
    const jobsFile = path.join(__dirname, 'data/jobs.json');
    
    if (!fs.existsSync(jobsFile)) {
      console.error('❌ Jobs file not found');
      return res.json({ 
        success: false, 
        message: 'Jobs data not found',
        orderId: orderId 
      });
    }
    
    const jobsData = JSON.parse(fs.readFileSync(jobsFile, 'utf8'));
    const jobs = jobsData.jobs || [];
    
    // Find the job
    const jobIndex = jobs.findIndex(job => job.id === jobId);
    if (jobIndex === -1) {
      console.error('❌ Job not found:', jobId);
      return res.json({ 
        success: false, 
        message: 'Job not found',
        orderId: orderId 
      });
    }
    
    const job = jobs[jobIndex];
    
    // Check if job is in work_done status
    if (job.status !== 'work_done') {
      console.log('⚠️ Job not in work_done status:', job.status);
      return res.json({ 
        success: false, 
        message: 'Job not ready for payment',
        orderId: orderId 
      });
    }
    
    // Update job status to completed
    job.status = 'completed';
    job.paymentMethod = 'upi';
    job.paidAt = new Date().toISOString();
    job.paymentOrderId = orderId;
    
    console.log('✅ Job status updated to completed');
    
    // Credit freelancer's wallet
    const User = require('./models/User');
    const freelancerId = job.assignedFreelancer?.id;
    const jobAmount = job.budget;
    
    if (freelancerId) {
      try {
        const freelancer = await User.findById(freelancerId);
        if (freelancer) {
          // Calculate freelancer's portion (90% of job amount)
          const freelancerAmount = Math.round(jobAmount * 0.9 * 100) / 100;
          
          // Update wallet balance
          freelancer.wallet.balance = (freelancer.wallet.balance || 0) + freelancerAmount;
          freelancer.wallet.totalEarnings = (freelancer.wallet.totalEarnings || 0) + freelancerAmount;
          
          // Add transaction record
          if (!freelancer.wallet.transactions) {
            freelancer.wallet.transactions = [];
          }
          
          freelancer.wallet.transactions.unshift({
            id: 'txn-' + Date.now(),
            type: 'credit',
            amount: freelancerAmount,
            description: `Payment for job: ${job.title}`,
            clientName: job.clientName || 'Unknown Client',
            jobId: job.id,
            totalAmount: jobAmount,
            commission: Math.round(jobAmount * 0.1 * 100) / 100,
            paymentOrderId: orderId,
            createdAt: new Date().toISOString()
          });
          
          await freelancer.save();
          console.log('💰 Freelancer wallet credited:', { 
            freelancerId, 
            jobAmount, 
            freelancerAmount, 
            commission: Math.round(jobAmount * 0.1 * 100) / 100 
          });
        } else {
          console.log('⚠️ Freelancer not found:', freelancerId);
        }
      } catch (walletError) {
        console.error('❌ Wallet credit error:', walletError);
        // Don't fail the payment if wallet update fails
      }
    }
    
    // Save updated jobs data
    fs.writeFileSync(jobsFile, JSON.stringify(jobsData, null, 2));
    console.log('💾 Jobs data saved');
    
    res.json({ 
      success: true, 
      message: 'Payment processed successfully',
      orderId: orderId,
      jobId: jobId
    });
    
  } catch (error) {
    console.error('❌ Error processing successful payment:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Payment processing failed',
      orderId: orderId 
    });
  }
};

// Manual payment processing endpoint (for testing when callback doesn't work)
app.post('/payment/process/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    console.log('🔄 Manual payment processing for order:', orderId);
    
    await processSuccessfulPayment(orderId, req, res);
  } catch (error) {
    console.error('❌ Manual payment processing error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Manual payment processing failed' 
    });
  }
});

// Payment callback endpoint (for PhonePe redirects)
app.post('/payment/callback', (req, res) => {
  try {
    console.log('🔄 Payment callback POST received:');
    console.log('  Body:', req.body);
    console.log('  Query:', req.query);
    console.log('  Headers:', req.headers);
    
    // PhonePe sends payment status in the request body
    const { 
      orderId, 
      state, 
      code, 
      message, 
      data,
      // Alternative parameter names
      merchantOrderId,
      status,
      response,
      // Nested data
      order_id,
      payment_status
    } = req.body;
    
    // Try to extract order ID from different possible fields
    const finalOrderId = orderId || merchantOrderId || order_id || req.body['order_id'] || req.body['merchant_order_id'];
    const finalState = state || status || payment_status || req.body['payment_status'] || req.body['state'];
    
    console.log('  Extracted orderId:', finalOrderId);
    console.log('  Extracted state:', finalState);
    
    if (finalState === 'SUCCESS' || finalState === 'success') {
      console.log('✅ Payment successful for order:', finalOrderId);
      
      // Process successful payment
      processSuccessfulPayment(finalOrderId, req, res);
    } else {
      console.log('❌ Payment failed for order:', finalOrderId, 'State:', finalState);
      res.json({ 
        success: false, 
        message: 'Payment failed',
        orderId: finalOrderId,
        state: finalState 
      });
    }
  } catch (error) {
    console.error('❌ Payment callback error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Callback processing failed' 
    });
  }
});

// Payment callback GET endpoint (for browser redirects)
app.get('/payment/callback', (req, res) => {
  try {
    console.log('🔄 Payment callback GET received:');
    console.log('  Query params:', req.query);
    console.log('  Body:', req.body);
    console.log('  Headers:', req.headers);
    
    // PhonePe might send data in different formats
    const { 
      orderId, 
      state, 
      code, 
      message,
      // Alternative parameter names
      merchantOrderId,
      status,
      response
    } = req.query;
    
    // Try to extract order ID from different possible fields
    const finalOrderId = orderId || merchantOrderId || req.query['order_id'] || req.query['merchant_order_id'];
    const finalState = state || status || req.query['payment_status'] || req.query['state'];
    
    console.log('  Extracted orderId:', finalOrderId);
    console.log('  Extracted state:', finalState);
    
    if (finalState === 'SUCCESS' || finalState === 'success') {
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/success?orderId=${finalOrderId}`);
    } else {
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/failed?orderId=${finalOrderId}&state=${finalState}`);
    }
  } catch (error) {
    console.error('❌ Payment callback GET error:', error);
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/error`);
  }
});

app.use('/api/debug', debugRoutes);
app.use('/api/debug-payment', require('./routes/debugPayment'));

// Test payment controller loading
app.get('/api/test-payment-controller', (req, res) => {
  try {
    const paymentController = require('./controllers/paymentController');
    res.json({
      success: true,
      message: 'Payment controller loaded successfully',
      functions: Object.keys(paymentController)
    });
  } catch (error) {
    res.json({
      success: false,
      message: 'Payment controller failed to load',
      error: error.message
    });
  }
});

// Test payment service with specific job
app.get('/api/payment-test/:jobId', (req, res) => {
  try {
    const { jobId } = req.params;
    const debugInfo = {
      timestamp: new Date().toISOString(),
      jobId: jobId,
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
      },
      testResults: {}
    };

    // Test payment service methods
    try {
      let service = null;
      try {
        service = require('./services/paymentService');
      } catch (e) {
        service = require('./services/paymentServiceMinimal');
      }

      // Test calculateAmounts
      const testAmounts = service.calculateAmounts(1000);
      debugInfo.testResults.calculateAmounts = {
        success: true,
        result: testAmounts
      };

      // Test createPaymentRequest (without actually calling PhonePe)
      debugInfo.testResults.createPaymentRequest = {
        methodAvailable: typeof service.createPaymentRequest === 'function',
        isAsync: true
      };

    } catch (error) {
      debugInfo.testResults.error = error.message;
    }

    res.json({
      success: true,
      message: 'Payment service test completed',
      debugInfo
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Payment service test failed',
      error: error.message
    });
  }
});

// Create test jobs for debugging
app.post('/api/debug-create-jobs', (req, res) => {
  try {
    const { inMemoryJobs, saveJobsToFile } = require('./controllers/sharedJobsStore');
    
    const testJobs = [
      {
        id: `test-job-${Date.now()}-1`,
        title: 'Test Job 1 - Website Design',
        description: 'Create a simple website design for testing payment functionality',
        clientId: 'test-client-1',
        budget: 10,
        status: 'work_done',
        createdAt: new Date().toISOString(),
        assignedFreelancer: {
          id: 'test-freelancer-1',
          name: 'Test Freelancer 1'
        }
      },
      {
        id: `test-job-${Date.now()}-2`,
        title: 'Test Job 2 - Logo Design',
        description: 'Design a logo for testing payment gateway integration',
        clientId: 'test-client-2',
        budget: 10,
        status: 'work_done',
        createdAt: new Date().toISOString(),
        assignedFreelancer: {
          id: 'test-freelancer-2',
          name: 'Test Freelancer 2'
        }
      },
      {
        id: `test-job-${Date.now()}-3`,
        title: 'Test Job 3 - Content Writing',
        description: 'Write content for testing commission calculation',
        clientId: 'test-client-3',
        budget: 10,
        status: 'work_done',
        createdAt: new Date().toISOString(),
        assignedFreelancer: {
          id: 'test-freelancer-3',
          name: 'Test Freelancer 3'
        }
      },
      {
        id: `test-job-${Date.now()}-4`,
        title: 'Test Job 4 - Data Entry',
        description: 'Data entry task for testing UPI payment flow',
        clientId: 'test-client-4',
        budget: 10,
        status: 'work_done',
        createdAt: new Date().toISOString(),
        assignedFreelancer: {
          id: 'test-freelancer-4',
          name: 'Test Freelancer 4'
        }
      }
    ];
    
    // Add test jobs to inMemoryJobs
    testJobs.forEach(job => {
      inMemoryJobs.push(job);
    });
    
    // Save to file
    saveJobsToFile();
    
    res.json({
      success: true,
      message: `Created ${testJobs.length} test jobs successfully`,
      jobs: testJobs.map(job => ({
        id: job.id,
        title: job.title,
        status: job.status,
        budget: job.budget
      }))
    });
  } catch (error) {
    console.error('Error creating test jobs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create test jobs',
      error: error.message
    });
  }
});

// Test PhonePe API directly
app.get('/api/debug-phonepe-test', async (req, res) => {
  try {
    let service = null;
    try {
      service = require('./services/paymentService');
    } catch (e) {
      service = require('./services/paymentServiceMinimal');
    }

    // Test with minimal data
    const testResult = await service.createPaymentRequest(1000, 'test-order-123', 'test-user', 'test-job', 'Test Job');
    
    res.json({
      success: true,
      message: 'PhonePe API test completed',
      result: testResult
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'PhonePe API test failed',
      error: error.message,
      stack: error.stack
    });
  }
});

// Test PhonePe API configuration
app.get('/api/debug-phonepe-config', (req, res) => {
  try {
    let service = null;
    try {
      service = require('./services/paymentService');
    } catch (e) {
      service = require('./services/paymentServiceMinimal');
    }

    const dependencyTest = service.testDependencies ? service.testDependencies() : { success: false, error: 'testDependencies method not available' };
    
    const config = {
      merchantId: service.merchantId,
      saltKey: service.saltKey ? '***' + service.saltKey.slice(-4) : 'Not set',
      saltIndex: service.saltIndex,
      baseUrl: service.baseUrl,
      redirectUrl: service.redirectUrl,
      dependenciesAvailable: service.dependenciesAvailable || false,
      dependencyTest: dependencyTest
    };

    res.json({
      success: true,
      message: 'PhonePe configuration retrieved',
      config: config
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get PhonePe configuration',
      error: error.message
    });
  }
});

// Test UPI payment without authentication (for debugging)
app.post('/api/debug-payment-test/:jobId', (req, res) => {
  try {
    const { jobId } = req.params;
    console.log('🧪 Debug payment test for job:', jobId);
    
    // Import payment controller
    const paymentController = require('./controllers/paymentController');
    
    // Create a mock request object
    const mockReq = {
      params: { jobId },
      user: { _id: 'debug-user', id: 'debug-user', userId: 'debug-user' },
      headers: { 'x-debug-mode': 'true' }
    };
    
    // Create a mock response object
    const mockRes = {
      status: (code) => ({
        json: (data) => {
          console.log('🧪 Debug payment test result:', { status: code, data });
          res.status(code).json(data);
        }
      }),
      json: (data) => {
        console.log('🧪 Debug payment test result:', { status: 200, data });
        res.json(data);
      }
    };
    
    // Call the payment controller
    paymentController.createUPIPayment(mockReq, mockRes);
    
  } catch (error) {
    console.error('❌ Debug payment test error:', error);
    res.status(500).json({
      success: false,
      message: 'Debug payment test failed',
      error: error.message
    });
  }
});

// List all jobs for debugging
app.get('/api/debug-jobs', (req, res) => {
  try {
    const { inMemoryJobs } = require('./controllers/sharedJobsStore');
    const jobs = Array.isArray(inMemoryJobs) ? inMemoryJobs : [];
    
    const jobSummary = jobs.map(job => ({
      id: job.id,
      title: job.title,
      status: job.status,
      clientId: job.clientId,
      budget: job.budget,
      createdAt: job.createdAt,
      assignedFreelancer: job.assignedFreelancer ? {
        id: job.assignedFreelancer.id,
        name: job.assignedFreelancer.name
      } : null
    }));
    
    res.json({
      success: true,
      message: 'Jobs retrieved successfully',
      totalJobs: jobs.length,
      jobs: jobSummary
    });
  } catch (error) {
    console.error('Error listing jobs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to list jobs',
      error: error.message
    });
  }
});

// Simple payment debug endpoint
app.get('/api/payment-debug', (req, res) => {
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
});

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
    const service = require('./services/paymentService');
    return { available: true, hasCalculateAmounts: typeof service.calculateAmounts === 'function' };
  } catch (error) {
    try {
      const minimalService = require('./services/paymentServiceMinimal');
      return { available: true, type: 'minimal', hasCalculateAmounts: typeof minimalService.calculateAmounts === 'function' };
    } catch (minimalError) {
      return { available: false, error: error.message };
    }
  }
}

// Test payment controller
function testPaymentController() {
  try {
    const controller = require('./controllers/paymentController');
    return { available: true, hasCreateUPIPayment: typeof controller.createUPIPayment === 'function' };
  } catch (error) {
    try {
      const minimalController = require('./controllers/paymentControllerMinimal');
      return { available: true, type: 'minimal', hasCreateUPIPayment: typeof minimalController.createUPIPayment === 'function' };
    } catch (minimalError) {
      return { available: false, error: error.message };
    }
  }
}

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
    path: req.originalUrl
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);
  
  res.status(error.status || 500).json({
    success: false,
    message: error.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`📡 API base URL: http://localhost:${PORT}/api`);
  console.log(`🌐 CORS enabled for origins: ${allowedOrigins.join(', ')}`);
});

module.exports = app;
