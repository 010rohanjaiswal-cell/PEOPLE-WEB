require('dotenv').config({ path: '.env.production' });
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://rohanjaiswal2467:N8iwsBEfkbF2Dd2S@cluster1.sg9pmcf.mongodb.net/freelancing-platform?retryWrites=true&w=majority&appName=Cluster1';

async function checkVerificationUserField() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    const db = mongoose.connection.db;
    const verificationsCollection = db.collection('freelancerverifications');
    
    const verifications = await verificationsCollection.find({ status: 'pending' }).toArray();
    
    console.log(`\n📊 Found ${verifications.length} pending verifications\n`);
    
    verifications.forEach((v, i) => {
      console.log(`${i + 1}. Verification ID: ${v._id}`);
      console.log(`   User field type: ${typeof v.user}`);
      console.log(`   User field value: ${v.user}`);
      console.log(`   User is ObjectId: ${v.user instanceof mongoose.Types.ObjectId}`);
      console.log(`   Full Name: ${v.fullName}`);
      console.log(`   DOB: ${v.dob}`);
      console.log(`   Gender: ${v.gender}`);
      console.log(`   Address: ${v.address}`);
      console.log(`   Aadhaar Front: ${v.aadhaarFront ? 'Present' : 'Missing'}`);
      console.log(`   Aadhaar Back: ${v.aadhaarBack ? 'Present' : 'Missing'}`);
      console.log(`   PAN Card: ${v.panCard ? 'Present' : 'Missing'}`);
      console.log(`   Profile Photo: ${v.profilePhoto ? 'Present' : 'Missing'}`);
      console.log('');
    });
    
    // Check the new user's verification
    const newUserVerification = await verificationsCollection.findOne({
      fullName: 'Nhcgki hgfgu'
    });
    
    if (newUserVerification) {
      console.log('\n🔍 New user verification details:');
      console.log(JSON.stringify(newUserVerification, null, 2));
      
      // Try to find the user
      const User = require('./models/User');
      if (newUserVerification.user) {
        const user = await User.findById(newUserVerification.user);
        console.log(`\n👤 Found user: ${user ? user.phoneNumber || user.phone : 'Not found'}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

checkVerificationUserField();

