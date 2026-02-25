const axios = require('axios');

const API_BASE_URL = process.env.API_BASE_URL || 'https://people-web-5hqi.onrender.com/api';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@test.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const PHONE_NUMBER = '+919999999990';

async function fetchVerificationDetails() {
  try {
    console.log('🔐 Step 1: Logging in as admin...');
    console.log(`   API URL: ${API_BASE_URL}`);
    console.log(`   Email: ${ADMIN_EMAIL}`);
    
    // Step 1: Admin Login
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/admin-login`, {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    });
    
    if (!loginResponse.data.success || !loginResponse.data.token) {
      console.error('❌ Admin login failed:', loginResponse.data);
      return;
    }
    
    const token = loginResponse.data.token;
    console.log('✅ Admin login successful');
    console.log(`   Token: ${token.substring(0, 20)}...`);
    
    // Step 2: Get all verifications and filter by phone
    console.log('\n🔍 Step 2: Fetching all verifications...');
    
    const verificationsResponse = await axios.get(`${API_BASE_URL}/admin/freelancer-verifications`, {
      params: { status: 'pending' },
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('📋 Verifications response:', JSON.stringify(verificationsResponse.data, null, 2));
    
    if (verificationsResponse.data.success && verificationsResponse.data.data) {
      const verifications = verificationsResponse.data.data;
      const matchingVerification = verifications.find(v => 
        (v.phoneNumber === PHONE_NUMBER || v.phone === PHONE_NUMBER)
      );
      
      if (matchingVerification) {
        console.log('\n✅ Found matching verification:');
        console.log(JSON.stringify(matchingVerification, null, 2));
        
        console.log('\n📊 Verification Summary:');
        console.log(`   ID: ${matchingVerification._id}`);
        console.log(`   Phone: ${matchingVerification.phoneNumber || matchingVerification.phone}`);
        console.log(`   Full Name: ${matchingVerification.fullName || 'Not set'}`);
        console.log(`   Status: ${matchingVerification.verificationStatus}`);
        console.log(`   Profile Photo: ${matchingVerification.profilePhoto || 'Not set'}`);
        console.log(`   Created At: ${new Date(matchingVerification.createdAt).toLocaleString()}`);
        console.log(`   Updated At: ${new Date(matchingVerification.updatedAt).toLocaleString()}`);
        
        if (matchingVerification.verificationDocuments) {
          console.log('\n📄 Verification Documents:');
          console.log(JSON.stringify(matchingVerification.verificationDocuments, null, 2));
          
          if (matchingVerification.verificationDocuments.dateOfBirth) {
            console.log(`   Date of Birth: ${new Date(matchingVerification.verificationDocuments.dateOfBirth).toLocaleDateString()}`);
          }
          if (matchingVerification.verificationDocuments.gender) {
            console.log(`   Gender: ${matchingVerification.verificationDocuments.gender}`);
          }
          if (matchingVerification.verificationDocuments.address) {
            console.log(`   Address: ${matchingVerification.verificationDocuments.address}`);
          }
          if (matchingVerification.verificationDocuments.aadhaarFront) {
            console.log(`   Aadhaar Front: ${matchingVerification.verificationDocuments.aadhaarFront.substring(0, 50)}...`);
          }
          if (matchingVerification.verificationDocuments.aadhaarBack) {
            console.log(`   Aadhaar Back: ${matchingVerification.verificationDocuments.aadhaarBack.substring(0, 50)}...`);
          }
          if (matchingVerification.verificationDocuments.panCard) {
            console.log(`   PAN Card: ${matchingVerification.verificationDocuments.panCard.substring(0, 50)}...`);
          }
        } else {
          console.log('\n⚠️ Verification documents are null/empty');
          console.log('   This means the user has not submitted their verification documents yet.');
        }
      } else {
        console.log('\n⚠️ No verification found for this phone number');
        console.log(`   Total verifications: ${verifications.length}`);
        if (verifications.length > 0) {
          console.log('\n📋 Available verifications:');
          verifications.forEach((v, i) => {
            console.log(`   ${i + 1}. Phone: ${v.phoneNumber || v.phone || 'N/A'}, Name: ${v.fullName || 'N/A'}, Status: ${v.verificationStatus}`);
          });
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', JSON.stringify(error.response.data, null, 2));
    }
    if (error.request) {
      console.error('   Request made but no response received');
    }
  }
}

// Run the script
fetchVerificationDetails();
