require('dotenv').config({ path: '.env.production' });
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://rohanjaiswal2467:N8iwsBEfkbF2Dd2S@cluster1.sg9pmcf.mongodb.net/freelancing-platform?retryWrites=true&w=majority&appName=Cluster1';

async function checkVerificationsCollection() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    const db = mongoose.connection.db;
    const verificationsCollection = db.collection('freelancerverifications');
    
    console.log('\n🔍 Checking freelancerverifications collection...');
    
    const count = await verificationsCollection.countDocuments();
    console.log(`📊 Total verifications in collection: ${count}`);
    
    if (count > 0) {
      const verifications = await verificationsCollection.find({}).limit(5).toArray();
      console.log('\n📋 Sample verifications:');
      verifications.forEach((v, i) => {
        console.log(`\n${i + 1}. Verification ID: ${v._id}`);
        console.log(`   User ID: ${v.userId}`);
        console.log(`   Full Name: ${v.fullName || 'N/A'}`);
        console.log(`   DOB: ${v.dob || 'N/A'}`);
        console.log(`   Gender: ${v.gender || 'N/A'}`);
        console.log(`   Address: ${v.address || 'N/A'}`);
        console.log(`   Status: ${v.status || 'N/A'}`);
        console.log(`   Created At: ${v.createdAt || 'N/A'}`);
        console.log(`   All keys: ${Object.keys(v).join(', ')}`);
      });
      
      // Check for the new user
      const newUserVerifications = await verificationsCollection.find({
        userId: new mongoose.Types.ObjectId('6956339122bb88cc09296a91')
      }).toArray();
      
      console.log(`\n🔍 Verifications for new user (6956339122bb88cc09296a91): ${newUserVerifications.length}`);
      if (newUserVerifications.length > 0) {
        console.log(JSON.stringify(newUserVerifications[0], null, 2));
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

checkVerificationsCollection();

