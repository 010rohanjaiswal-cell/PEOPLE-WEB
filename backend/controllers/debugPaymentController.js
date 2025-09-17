// Comprehensive debug tool for payment service issues
const { inMemoryJobs, saveJobsToFile } = require('./sharedJobsStore');

// Main debug endpoint
const debugPaymentService = async (req, res) => {
  const debugInfo = {
    timestamp: new Date().toISOString(),
    server: {
      nodeVersion: process.version,
      platform: process.platform,
      environment: process.env.NODE_ENV,
      uptime: process.uptime()
    },
    dependencies: {},
    services: {},
    routes: {},
    errors: []
  };

  try {
    console.log('🔍 Starting comprehensive payment service debug...');

    // Test 1: Check Node.js modules
    console.log('🔍 Testing Node.js modules...');
    debugInfo.dependencies.nodeModules = {
      fs: testModule('fs'),
      path: testModule('path'),
      crypto: testModule('crypto'),
      buffer: testModule('buffer'),
      url: testModule('url'),
      querystring: testModule('querystring')
    };

    // Test 2: Check npm packages
    console.log('🔍 Testing npm packages...');
    debugInfo.dependencies.npmPackages = {
      axios: testModule('axios'),
      cryptoJs: testModule('crypto-js'),
      express: testModule('express'),
      mongoose: testModule('mongoose'),
      jsonwebtoken: testModule('jsonwebtoken')
    };

    // Test 3: Check file system access
    console.log('🔍 Testing file system access...');
    debugInfo.services.fileSystem = testFileSystem();

    // Test 4: Check shared jobs store
    console.log('🔍 Testing shared jobs store...');
    debugInfo.services.jobsStore = testJobsStore();

    // Test 5: Test payment service loading
    console.log('🔍 Testing payment service loading...');
    debugInfo.services.paymentService = testPaymentServiceLoading();

    // Test 6: Test payment controller loading
    console.log('🔍 Testing payment controller loading...');
    debugInfo.services.paymentController = testPaymentControllerLoading();

    // Test 7: Test environment variables
    console.log('🔍 Testing environment variables...');
    debugInfo.environment = testEnvironmentVariables();

    // Test 8: Test PhonePe API connectivity
    console.log('🔍 Testing PhonePe API connectivity...');
    debugInfo.services.phonePeAPI = await testPhonePeAPI();

    // Test 9: Test payment service methods
    console.log('🔍 Testing payment service methods...');
    debugInfo.services.paymentMethods = testPaymentServiceMethods();

    console.log('✅ Debug completed successfully');
    debugInfo.status = 'success';
    debugInfo.message = 'Debug completed successfully';

  } catch (error) {
    console.error('❌ Debug failed:', error);
    debugInfo.errors.push({
      type: 'debug_error',
      message: error.message,
      stack: error.stack
    });
    debugInfo.status = 'error';
    debugInfo.message = 'Debug failed with errors';
  }

  res.json(debugInfo);
};

// Helper function to test module loading
function testModule(moduleName) {
  try {
    const module = require(moduleName);
    return {
      available: true,
      type: typeof module,
      hasDefaultExport: module.default !== undefined,
      hasNamedExports: Object.keys(module).length > 0
    };
  } catch (error) {
    return {
      available: false,
      error: error.message
    };
  }
}

// Test file system access
function testFileSystem() {
  try {
    const fs = require('fs');
    const path = require('path');
    
    // Test if we can read current directory
    const currentDir = process.cwd();
    const files = fs.readdirSync(currentDir);
    
    // Test if we can write to a temp file
    const tempFile = path.join(currentDir, 'temp-debug-test.txt');
    fs.writeFileSync(tempFile, 'debug test');
    fs.unlinkSync(tempFile);
    
    return {
      available: true,
      currentDirectory: currentDir,
      canRead: true,
      canWrite: true,
      filesInCurrentDir: files.length
    };
  } catch (error) {
    return {
      available: false,
      error: error.message
    };
  }
}

// Test jobs store
function testJobsStore() {
  try {
    return {
      available: true,
      jobsCount: inMemoryJobs ? inMemoryJobs.length : 0,
      hasSaveFunction: typeof saveJobsToFile === 'function',
      jobsArray: Array.isArray(inMemoryJobs)
    };
  } catch (error) {
    return {
      available: false,
      error: error.message
    };
  }
}

// Test payment service loading
function testPaymentServiceLoading() {
  const results = {
    fullService: { available: false },
    minimalService: { available: false }
  };

  // Test full payment service
  try {
    const fullService = require('../services/paymentService');
    results.fullService = {
      available: true,
      hasCalculateAmounts: typeof fullService.calculateAmounts === 'function',
      hasCreatePaymentRequest: typeof fullService.createPaymentRequest === 'function',
      hasVerifyPayment: typeof fullService.verifyPayment === 'function'
    };
  } catch (error) {
    results.fullService = {
      available: false,
      error: error.message
    };
  }

  // Test minimal payment service
  try {
    const minimalService = require('../services/paymentServiceMinimal');
    results.minimalService = {
      available: true,
      hasCalculateAmounts: typeof minimalService.calculateAmounts === 'function',
      hasCreatePaymentRequest: typeof minimalService.createPaymentRequest === 'function',
      hasVerifyPayment: typeof minimalService.verifyPayment === 'function'
    };
  } catch (error) {
    results.minimalService = {
      available: false,
      error: error.message
    };
  }

  return results;
}

// Test payment controller loading
function testPaymentControllerLoading() {
  const results = {
    fullController: { available: false },
    minimalController: { available: false }
  };

  // Test full payment controller
  try {
    const fullController = require('../controllers/paymentController');
    results.fullController = {
      available: true,
      hasCreateUPIPayment: typeof fullController.createUPIPayment === 'function',
      hasVerifyUPIPayment: typeof fullController.verifyUPIPayment === 'function',
      hasGetPaymentStatus: typeof fullController.getPaymentStatus === 'function',
      hasTestPaymentService: typeof fullController.testPaymentService === 'function'
    };
  } catch (error) {
    results.fullController = {
      available: false,
      error: error.message
    };
  }

  // Test minimal payment controller
  try {
    const minimalController = require('../controllers/paymentControllerMinimal');
    results.minimalController = {
      available: true,
      hasCreateUPIPayment: typeof minimalController.createUPIPayment === 'function',
      hasVerifyUPIPayment: typeof minimalController.verifyUPIPayment === 'function',
      hasGetPaymentStatus: typeof minimalController.getPaymentStatus === 'function',
      hasTestPaymentService: typeof minimalController.testPaymentService === 'function'
    };
  } catch (error) {
    results.minimalController = {
      available: false,
      error: error.message
    };
  }

  return results;
}

// Test environment variables
function testEnvironmentVariables() {
  return {
    NODE_ENV: process.env.NODE_ENV,
    PAYMENT_REDIRECT_URL: process.env.PAYMENT_REDIRECT_URL,
    MONGODB_URI: process.env.MONGODB_URI ? '***hidden***' : 'not set',
    JWT_SECRET: process.env.JWT_SECRET ? '***hidden***' : 'not set',
    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME ? '***hidden***' : 'not set'
  };
}

// Test PhonePe API connectivity
async function testPhonePeAPI() {
  try {
    const axios = require('axios');
    
    // Test basic connectivity to PhonePe API
    const response = await axios.get('https://api.phonepe.com/apis/hermes/pg/v1/status', {
      timeout: 5000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    return {
      available: true,
      status: response.status,
      reachable: true
    };
  } catch (error) {
    return {
      available: false,
      error: error.message,
      code: error.code,
      reachable: false
    };
  }
}

// Test payment service methods
function testPaymentServiceMethods() {
  const results = {
    calculateAmounts: { available: false },
    createPaymentRequest: { available: false },
    verifyPayment: { available: false }
  };

  try {
    // Try to get any available payment service
    let service = null;
    try {
      service = require('../services/paymentService');
    } catch (e) {
      try {
        service = require('../services/paymentServiceMinimal');
      } catch (e2) {
        throw new Error('No payment service available');
      }
    }

    // Test calculateAmounts
    try {
      const amounts = service.calculateAmounts(1000);
      results.calculateAmounts = {
        available: true,
        testResult: amounts,
        expected: { totalAmount: 1000, commission: 100, freelancerAmount: 900 }
      };
    } catch (error) {
      results.calculateAmounts = {
        available: false,
        error: error.message
      };
    }

    // Test createPaymentRequest (async)
    results.createPaymentRequest = {
      available: typeof service.createPaymentRequest === 'function',
      isAsync: true
    };

    // Test verifyPayment (async)
    results.verifyPayment = {
      available: typeof service.verifyPayment === 'function',
      isAsync: true
    };

  } catch (error) {
    results.error = error.message;
  }

  return results;
}

// Simple health check
const healthCheck = async (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  });
};

module.exports = {
  debugPaymentService,
  healthCheck
};
