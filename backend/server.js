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

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/client', clientRoutes);
app.use('/api/freelancer', freelancerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/jobs', jobRoutes);
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
app.use('/api/debug', debugRoutes);
app.use('/api/debug-payment', require('./routes/debugPayment'));

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
