const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');
const adminController = require('./controllers/adminController');

async function testSearchAPI() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');
    
    // Simulate the request object
    const mockReq = {
      query: {
        phoneNumber: '' // Empty to get all users
      }
    };
    
    // Mock response object
    let responseData = null;
    const mockRes = {
      json: (data) => {
        responseData = data;
        console.log('\n📤 Response sent:');
        console.log(JSON.stringify(data, null, 2));
      },
      status: function(code) {
        this.statusCode = code;
        return this;
      }
    };
    
    console.log('\n🔍 Testing searchUsers controller function...');
    await adminController.searchUsers(mockReq, mockRes);
    
    // Verify response structure
    if (responseData) {
      console.log('\n✅ Response received!');
      console.log(`   Success: ${responseData.success}`);
      console.log(`   Data type: ${typeof responseData.data}`);
      console.log(`   Is array: ${Array.isArray(responseData.data)}`);
      
      if (responseData.data && typeof responseData.data === 'object' && !Array.isArray(responseData.data)) {
        console.log(`   Clients count: ${responseData.data.clients?.length || 0}`);
        console.log(`   Freelancers count: ${responseData.data.freelancers?.length || 0}`);
        console.log(`   Total: ${responseData.data.total || 0}`);
        console.log('\n✅ Response format is CORRECT (object with clients, freelancers, total)');
      } else if (Array.isArray(responseData.data)) {
        console.log(`   Array length: ${responseData.data.length}`);
        console.log('\n⚠️  Response format is WRONG (array instead of object)');
      }
    } else {
      console.log('\n❌ No response received');
    }
    
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

testSearchAPI();

