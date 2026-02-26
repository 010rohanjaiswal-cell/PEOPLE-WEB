const mongoose = require('mongoose');
require('dotenv').config({ path: './.env.production' });

const adminController = require('./controllers/adminController');

async function testOpenJobs() {
  try {
    console.log('🔌 Connecting to MongoDB for open jobs test...');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Optional phone filter from env (e.g. TEST_PHONE=+919009009000)
    const phoneFilter = process.env.TEST_PHONE || '';
    const mockReq = {
      query: {
        phoneNumber: phoneFilter, // empty = all, value = filter by client phone
      },
    };

    let responseData = null;
    const mockRes = {
      json: (data) => {
        responseData = data;
        console.log('\n📤 getOpenJobs response:');
        console.log(JSON.stringify(data, null, 2));
      },
      status: function (code) {
        this.statusCode = code;
        return this;
      },
    };

    console.log('\n🔍 Testing getOpenJobs controller function with phone filter:', phoneFilter || '(all)');
    await adminController.getOpenJobs(mockReq, mockRes);

    if (responseData) {
      console.log('\n✅ Response received!');
      console.log(`   Success: ${responseData.success}`);
      console.log(`   Data type: ${typeof responseData.data}`);
      console.log(`   Is array: ${Array.isArray(responseData.data)}`);
      if (Array.isArray(responseData.data)) {
        console.log(`   Jobs count: ${responseData.data.length}`);
        if (responseData.data.length > 0) {
          console.log('   Sample job:', {
            id: responseData.data[0].id,
            title: responseData.data[0].title,
            clientPhone:
              responseData.data[0].client?.phoneNumber ||
              responseData.data[0].client?.phone,
          });
        }
      }
    } else {
      console.log('\n❌ No response received from getOpenJobs');
    }

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error in getOpenJobs test:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

testOpenJobs();

