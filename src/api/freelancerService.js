import axios from 'axios';
import { storage } from '../utils/storage';
import { cloudinaryService } from './cloudinaryService';

const runtimeApiBaseUrl = (() => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const override = localStorage.getItem('apiBaseUrlOverride');
      if (override) return override;
    }
  } catch (_) {}
  return undefined;
})();

const API_BASE_URL = runtimeApiBaseUrl || process.env.REACT_APP_API_BASE_URL || 'https://freelancing-platform-backend-backup.onrender.com/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = storage.getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      // Debug: confirm header attachment without leaking full token
      if (process.env.NODE_ENV !== 'production') {
        console.log('🔒 Attaching Authorization header for freelancer API:', {
          hasToken: !!token,
          authHeaderStartsWith: (config.headers.Authorization || '').slice(0, 10)
        });
      }
    } else if (process.env.NODE_ENV !== 'production') {
      console.warn('⚠️ No auth token found when calling freelancer API:', {
        url: config.url
      });
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const freelancerService = {
  // Submit verification documents
  submitVerification: async (verificationData) => {
    try {
      // For development: Mock verification submission
      const useMockAuth = process.env.REACT_APP_USE_MOCK_AUTH === 'true' || 
                         (process.env.NODE_ENV === 'development' && !process.env.REACT_APP_API_BASE_URL);
      
      console.log('🔧 Verification submission check:', {
        NODE_ENV: process.env.NODE_ENV,
        USE_MOCK_AUTH: process.env.REACT_APP_USE_MOCK_AUTH,
        API_BASE_URL: process.env.REACT_APP_API_BASE_URL,
        useMockAuth: useMockAuth
      });
      
      if (useMockAuth) {
        console.log('🔧 Development Mode: Using mock verification submission');
        console.log('📝 Verification data:', verificationData);
        
        // Create mock verification data
        const mockVerificationData = {
          status: 'pending',
          submittedAt: new Date().toISOString(),
          fullName: verificationData.fullName,
          dateOfBirth: verificationData.dateOfBirth,
          gender: verificationData.gender,
          address: verificationData.address,
          // Mock document URLs
          aadhaarFront: 'mock-aadhaar-front-url',
          aadhaarBack: 'mock-aadhaar-back-url',
          panCard: 'mock-pan-card-url'
        };
        
        // Store in localStorage for persistence
        localStorage.setItem('mockVerificationStatus', JSON.stringify(mockVerificationData));
        console.log('💾 Stored mock verification status in localStorage');
        
        // Mock verification submission
        return {
          success: true,
          message: 'Verification submitted successfully',
          data: mockVerificationData
        };
      }
      
      // Production: Real API call with Cloudinary uploads
      const uploadPromises = [];
      const documentFields = ['aadhaarFront', 'aadhaarBack', 'panCard'];
      
      // Upload documents to Cloudinary
      for (const field of documentFields) {
        if (verificationData[field]) {
          console.log(`📤 Uploading ${field} to Cloudinary...`);
          uploadPromises.push(
            cloudinaryService.uploadImage(verificationData[field], 'verification-documents')
              .then(result => ({
                field,
                result
              }))
          );
        }
      }
      
      const uploadResults = await Promise.all(uploadPromises);
      const documentUrls = {};
      
      uploadResults.forEach(({ field, result }) => {
        if (result.success) {
          documentUrls[field] = result.url;
          console.log(`✅ ${field} uploaded successfully:`, result.url);
        } else {
          throw new Error(`Failed to upload ${field}: ${result.error}`);
        }
      });
      
      const response = await api.post('/freelancer/submit-verification', {
        fullName: verificationData.fullName,
        dateOfBirth: verificationData.dateOfBirth,
        gender: verificationData.gender,
        address: verificationData.address,
        ...documentUrls
      });
      
      return response.data;
    } catch (error) {
      console.error('Verification submission error:', error);
      
      // Fallback to mock if network error in development
      if (process.env.NODE_ENV === 'development' && 
          (error.code === 'NETWORK_ERROR' || 
           error.code === 'ERR_NETWORK' ||
           error.message?.includes('Network Error') ||
           error.message?.includes('fetch') ||
           error.message?.includes('ERR_CONNECTION_REFUSED'))) {
        
        console.log('🔄 Network error detected, falling back to mock verification submission');
        
        // Create mock verification data
        const mockVerificationData = {
          status: 'pending',
          submittedAt: new Date().toISOString(),
          fullName: verificationData.fullName,
          dateOfBirth: verificationData.dateOfBirth,
          gender: verificationData.gender,
          address: verificationData.address,
          // Mock document URLs
          aadhaarFront: 'mock-aadhaar-front-url',
          aadhaarBack: 'mock-aadhaar-back-url',
          panCard: 'mock-pan-card-url'
        };
        
        // Store in localStorage for persistence
        localStorage.setItem('mockVerificationStatus', JSON.stringify(mockVerificationData));
        console.log('💾 Stored mock verification status in localStorage (fallback)');
        
        return {
          success: true,
          message: 'Verification submitted successfully',
          data: mockVerificationData
        };
      }
      
      throw error.response?.data || error;
    }
  },

  // Check verification status
  getVerificationStatus: async () => {
    try {
      // For development: Mock verification status
      const useMockAuth = process.env.REACT_APP_USE_MOCK_AUTH === 'true' || 
                         (process.env.NODE_ENV === 'development' && !process.env.REACT_APP_API_BASE_URL);
      
      console.log('🔧 Verification status check:', {
        NODE_ENV: process.env.NODE_ENV,
        USE_MOCK_AUTH: process.env.REACT_APP_USE_MOCK_AUTH,
        API_BASE_URL: process.env.REACT_APP_API_BASE_URL,
        useMockAuth: useMockAuth
      });
      
      if (useMockAuth) {
        console.log('🔧 Development Mode: Using mock verification status');
        
        // Check if verification has been submitted in localStorage
        const submittedVerification = localStorage.getItem('mockVerificationStatus');
        
        if (submittedVerification) {
          console.log('📋 Found submitted verification:', submittedVerification);
          return {
            success: true,
            data: JSON.parse(submittedVerification)
          };
        }
        
        // No verification submitted yet - return null to show the form
        return {
          success: true,
          data: null
        };
      }
      
      // Production: Real API call
      const response = await api.get('/freelancer/verification-status');
      return response.data;
    } catch (error) {
      console.error('Verification status error:', error);
      // Do not fallback to mock on network errors; surface the error so CORS/auth can be fixed
      throw error.response?.data || error;
    }
  },

  // Get available jobs
  getAvailableJobs: async (filters = {}) => {
    try {
      const response = await api.get('/jobs/available', {
        params: filters
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get assigned jobs
  getAssignedJobs: async () => {
    try {
      const response = await api.get('/freelancer/assigned-jobs');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Pick up a job (direct assignment)
  pickupJob: async (jobId) => {
    try {
      const response = await api.post(`/freelancer/pickup-job/${jobId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Make an offer for a job
  makeOffer: async (jobId, offerData) => {
    try {
      const response = await api.post(`/freelancer/make-offer/${jobId}`, offerData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Mark job as complete
  markJobComplete: async (jobId, completionData = {}) => {
    try {
      const response = await api.post(`/freelancer/mark-complete/${jobId}`, completionData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get wallet balance and transactions
  getWallet: async () => {
    try {
      const response = await api.get('/freelancer/wallet');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Request withdrawal
  requestWithdrawal: async (withdrawalData) => {
    try {
      const response = await api.post('/freelancer/request-withdrawal', withdrawalData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get withdrawal history
  getWithdrawalHistory: async () => {
    try {
      const response = await api.get('/freelancer/withdrawal-history');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }
};
