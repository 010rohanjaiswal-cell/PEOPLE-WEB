require('dotenv').config({ path: '.env.production' });
const mongoose = require('mongoose');
const User = require('./models/User');

const PHONE_NUMBER = '+919999999990';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://rohanjaiswal2467:N8iwsBEfkbF2Dd2S@cluster1.sg9pmcf.mongodb.net/freelancing-platform?retryWrites=true&w=majority&appName=Cluster1';

async function checkUserDetails() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    console.log(`\n🔍 Searching for user with phone: ${PHONE_NUMBER}`);
    
    // Find user by phone number (check both phoneNumber and phone fields)
    const user = await User.findOne({
      $or: [
        { phoneNumber: PHONE_NUMBER },
        { phone: PHONE_NUMBER }
      ]
    });
    
    if (!user) {
      console.log('❌ User not found in database');
      return;
    }
    
    console.log('✅ User found!');
    console.log('\n📊 Full User Document:');
    console.log(JSON.stringify(user.toObject(), null, 2));
    
    console.log('\n📋 Key Fields:');
    console.log(`   _id: ${user._id}`);
    console.log(`   fullName: ${user.fullName || 'null'}`);
    console.log(`   phoneNumber: ${user.phoneNumber || 'null'}`);
    console.log(`   phone: ${user.phone || 'null'}`);
    console.log(`   role: ${user.role}`);
    console.log(`   verificationStatus: ${user.verificationStatus || 'null'}`);
    console.log(`   profilePhoto: ${user.profilePhoto || 'null'}`);
    
    console.log('\n📄 Verification Documents:');
    if (user.verificationDocuments) {
      console.log('   ✅ verificationDocuments exists');
      console.log(JSON.stringify(user.verificationDocuments, null, 2));
      
      if (user.verificationDocuments.dateOfBirth) {
        console.log(`   Date of Birth: ${user.verificationDocuments.dateOfBirth}`);
      }
      if (user.verificationDocuments.gender) {
        console.log(`   Gender: ${user.verificationDocuments.gender}`);
      }
      if (user.verificationDocuments.address) {
        console.log(`   Address: ${user.verificationDocuments.address}`);
      }
      if (user.verificationDocuments.aadhaarFront) {
        console.log(`   Aadhaar Front: ${user.verificationDocuments.aadhaarFront ? 'Present (URL length: ' + user.verificationDocuments.aadhaarFront.length + ')' : 'null'}`);
      }
      if (user.verificationDocuments.aadhaarBack) {
        console.log(`   Aadhaar Back: ${user.verificationDocuments.aadhaarBack ? 'Present (URL length: ' + user.verificationDocuments.aadhaarBack.length + ')' : 'null'}`);
      }
      if (user.verificationDocuments.panCard) {
        console.log(`   PAN Card: ${user.verificationDocuments.panCard ? 'Present (URL length: ' + user.verificationDocuments.panCard.length + ')' : 'null'}`);
      }
    } else {
      console.log('   ❌ verificationDocuments is null or undefined');
    }
    
    // Check if data might be stored differently
    console.log('\n🔍 Checking for alternative data storage...');
    const userObj = user.toObject();
    const allKeys = Object.keys(userObj);
    console.log(`   All document keys: ${allKeys.join(', ')}`);
    
    // Check for nested structures
    if (userObj.verification) {
      console.log('   ⚠️ Found "verification" field (not "verificationDocuments")');
      console.log(JSON.stringify(userObj.verification, null, 2));
    }
    
    if (userObj.documents) {
      console.log('   ⚠️ Found "documents" field');
      console.log(JSON.stringify(userObj.documents, null, 2));
    }
    
    // Check what the admin endpoint would return
    console.log('\n🔍 Testing what admin endpoint would return...');
    const adminQuery = await User.findOne({
      $or: [
        { phoneNumber: PHONE_NUMBER },
        { phone: PHONE_NUMBER }
      ]
    })
    .select('_id fullName phoneNumber verificationStatus verificationDocuments profilePhoto createdAt updatedAt')
    .lean();
    
    console.log('📋 Admin query result:');
    console.log(JSON.stringify(adminQuery, null, 2));
    
    // Also try with phone field included
    const adminQueryWithPhone = await User.findOne({
      $or: [
        { phoneNumber: PHONE_NUMBER },
        { phone: PHONE_NUMBER }
      ]
    })
    .select('_id fullName phoneNumber phone verificationStatus verificationDocuments profilePhoto createdAt updatedAt')
    .lean();
    
    console.log('\n📋 Admin query with phone field:');
    console.log(JSON.stringify(adminQueryWithPhone, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

checkUserDetails();

