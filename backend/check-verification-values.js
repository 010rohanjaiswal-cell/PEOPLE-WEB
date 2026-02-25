require('dotenv').config({ path: '.env.production' });
const mongoose = require('mongoose');
const User = require('./models/User');

const PHONE_NUMBER = '+919999999990';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://rohanjaiswal2467:N8iwsBEfkbF2Dd2S@cluster1.sg9pmcf.mongodb.net/freelancing-platform?retryWrites=true&w=majority&appName=Cluster1';

async function checkVerificationValues() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
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
    
    console.log('\n📄 verificationDocuments object:');
    const vDocs = user.verificationDocuments;
    console.log(`   Type: ${typeof vDocs}`);
    console.log(`   Is null: ${vDocs === null}`);
    console.log(`   Is undefined: ${vDocs === undefined}`);
    
    if (vDocs) {
      console.log(`   Keys: ${Object.keys(vDocs).join(', ')}`);
      console.log('\n   Field values:');
      Object.keys(vDocs).forEach(key => {
        const value = vDocs[key];
        if (value) {
          console.log(`     ${key}: ${typeof value === 'string' && value.length > 50 ? value.substring(0, 50) + '...' : value}`);
        } else {
          console.log(`     ${key}: ${value === null ? 'null' : value === undefined ? 'undefined' : 'empty'}`);
        }
      });
      
      // Check if all values are null/undefined
      const allNull = Object.values(vDocs).every(v => v === null || v === undefined || v === '');
      console.log(`\n   All values are null/undefined/empty: ${allNull}`);
    }
    
    // Try to get the raw document from MongoDB
    console.log('\n🔍 Raw MongoDB query (bypassing Mongoose):');
    const db = mongoose.connection.db;
    const collection = db.collection('users');
    const rawDoc = await collection.findOne({
      $or: [
        { phoneNumber: PHONE_NUMBER },
        { phone: PHONE_NUMBER }
      ]
    });
    
    if (rawDoc) {
      console.log('   Raw verificationDocuments from MongoDB:');
      console.log(JSON.stringify(rawDoc.verificationDocuments, null, 2));
      
      if (rawDoc.verificationDocuments) {
        console.log('\n   Raw field values:');
        Object.keys(rawDoc.verificationDocuments).forEach(key => {
          const value = rawDoc.verificationDocuments[key];
          if (value) {
            const displayValue = typeof value === 'string' && value.length > 100 
              ? value.substring(0, 100) + '... (length: ' + value.length + ')' 
              : value;
            console.log(`     ${key}: ${displayValue}`);
          } else {
            console.log(`     ${key}: ${value === null ? 'null' : value === undefined ? 'undefined' : 'empty string'}`);
          }
        });
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

checkVerificationValues();

