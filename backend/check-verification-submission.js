require('dotenv').config({ path: '.env.production' });
const mongoose = require('mongoose');
const User = require('./models/User');

const PHONE_NUMBER = '+919999999990';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://rohanjaiswal2467:N8iwsBEfkbF2Dd2S@cluster1.sg9pmcf.mongodb.net/freelancing-platform?retryWrites=true&w=majority&appName=Cluster1';

async function checkVerificationSubmission() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    console.log(`\n🔍 Checking user: ${PHONE_NUMBER}`);
    
    const user = await User.findOne({
      $or: [
        { phoneNumber: PHONE_NUMBER },
        { phone: PHONE_NUMBER }
      ]
    });
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }
    
    console.log('\n📊 Current verificationDocuments:');
    console.log(JSON.stringify(user.verificationDocuments, null, 2));
    console.log(`   Type: ${typeof user.verificationDocuments}`);
    console.log(`   Is null: ${user.verificationDocuments === null}`);
    console.log(`   Is undefined: ${user.verificationDocuments === undefined}`);
    console.log(`   Keys: ${user.verificationDocuments ? Object.keys(user.verificationDocuments).join(', ') : 'N/A'}`);
    
    // Check if there are any other fields that might contain verification data
    console.log('\n🔍 Checking for alternative verification data storage...');
    const userObj = user.toObject();
    
    // Check all fields that might contain verification data
    const possibleFields = [
      'verification',
      'documents',
      'verificationData',
      'verificationInfo',
      'submittedDocuments',
      'kycDocuments'
    ];
    
    possibleFields.forEach(field => {
      if (userObj[field]) {
        console.log(`   ⚠️ Found "${field}" field:`);
        console.log(JSON.stringify(userObj[field], null, 2));
      }
    });
    
    // Check the raw MongoDB document
    console.log('\n🔍 Raw MongoDB document structure:');
    const rawUser = await User.findOne({
      $or: [
        { phoneNumber: PHONE_NUMBER },
        { phone: PHONE_NUMBER }
      ]
    }).lean();
    
    console.log('All fields in document:');
    Object.keys(rawUser).forEach(key => {
      const value = rawUser[key];
      if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
        console.log(`   ${key}: ${JSON.stringify(value)}`);
      } else {
        console.log(`   ${key}: ${value}`);
      }
    });
    
    // Check if verificationDocuments might be stored as a subdocument that wasn't selected
    console.log('\n🔍 Checking if verificationDocuments exists when explicitly selected:');
    const userWithDocs = await User.findOne({
      $or: [
        { phoneNumber: PHONE_NUMBER },
        { phone: PHONE_NUMBER }
      ]
    })
    .select('verificationDocuments')
    .lean();
    
    console.log('verificationDocuments when explicitly selected:');
    console.log(JSON.stringify(userWithDocs?.verificationDocuments, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

checkVerificationSubmission();

