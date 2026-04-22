const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');

async function checkUsers() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    console.log('📋 Connection URI:', process.env.MONGODB_URI ? 'Set (hidden)' : 'Not set');
    
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to MongoDB successfully!');
    
    // Count total users
    const totalUsers = await User.countDocuments({});
    console.log(`\n📊 Total users in database: ${totalUsers}`);
    
    if (totalUsers === 0) {
      console.log('⚠️  No users found in the database!');
      return;
    }
    
    // Get all users with basic info
    const users = await User.find({})
      .select('_id fullName phoneNumber phone email role verificationStatus createdAt')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();
    
    console.log(`\n📋 Sample users (showing first ${users.length}):`);
    console.log('─'.repeat(80));
    
    users.forEach((user, index) => {
      console.log(`\n${index + 1}. User ID: ${user._id}`);
      console.log(`   Name: ${user.fullName}`);
      console.log(`   Phone: ${user.phoneNumber || user.phone || 'N/A'}`);
      console.log(`   Email: ${user.email || 'N/A'}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Verification Status: ${user.verificationStatus || 'N/A'}`);
      console.log(`   Created: ${user.createdAt ? new Date(user.createdAt).toLocaleString() : 'N/A'}`);
    });
    
    // Count by role
    const clientsCount = await User.countDocuments({ role: 'client' });
    const freelancersCount = await User.countDocuments({ role: 'freelancer' });
    const adminsCount = await User.countDocuments({ role: 'admin' });
    
    console.log('\n📊 Users by role:');
    console.log(`   Clients: ${clientsCount}`);
    console.log(`   Freelancers: ${freelancersCount}`);
    console.log(`   Admins: ${adminsCount}`);
    
    // Test the search query (empty phoneNumber - should return all)
    console.log('\n🔍 Testing search query (empty phoneNumber - should return all users)...');
    const searchQuery = {};
    const searchResults = await User.find(searchQuery)
      .select('_id fullName phoneNumber phone email role verificationStatus profilePhoto createdAt updatedAt wallet verificationDocuments')
      .sort({ createdAt: -1 })
      .lean();
    
    console.log(`   Found ${searchResults.length} users with search query`);
    
    // Test the categorization logic
    const clients = [];
    const freelancers = [];
    
    searchResults.forEach(user => {
      if (user.verificationDocuments || user.verificationStatus || user.role === 'freelancer') {
        freelancers.push(user);
      }
      if (user.verificationDocuments && user.verificationStatus === 'approved') {
        clients.push({ ...user, hasApprovedFreelancerData: true });
      } else {
        clients.push({ ...user, hasApprovedFreelancerData: false });
      }
    });
    
    console.log(`\n📊 Categorized results:`);
    console.log(`   Clients: ${clients.length}`);
    console.log(`   Freelancers: ${freelancers.length}`);
    console.log(`   Total: ${searchResults.length}`);
    
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

checkUsers();

