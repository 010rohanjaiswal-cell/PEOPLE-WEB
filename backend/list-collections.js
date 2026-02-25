require('dotenv').config({ path: '.env.production' });
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://rohanjaiswal2467:N8iwsBEfkbF2Dd2S@cluster1.sg9pmcf.mongodb.net/freelancing-platform?retryWrites=true&w=majority&appName=Cluster1';

async function listCollections() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    
    console.log('\n📋 Available collections:');
    collections.forEach(col => {
      console.log(`   - ${col.name}`);
    });
    
    // Check each collection for verification data
    for (const col of collections) {
      if (col.name.toLowerCase().includes('verif') || col.name.toLowerCase().includes('user')) {
        const count = await db.collection(col.name).countDocuments();
        console.log(`\n📊 ${col.name}: ${count} documents`);
        
        if (count > 0 && col.name.toLowerCase().includes('verif')) {
          const sample = await db.collection(col.name).findOne({});
          console.log(`   Sample document keys: ${Object.keys(sample || {}).join(', ')}`);
        }
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

listCollections();

