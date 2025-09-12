import axios from 'axios';
import { storage } from '../utils/storage';
import { cloudinaryService } from './cloudinaryService';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://freelancing-platform-backend-backup.onrender.com/api';

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
      const useMockAuth = process.env.NODE_ENV === 'development' && 
                         (process.env.REACT_APP_USE_MOCK_AUTH === 'true' || 
                          !process.env.REACT_APP_API_BASE_URL);
      
      if (useMockAuth) {
        console.log('🔧 Development Mode: Using mock verification submission');
        console.log('📝 Verification data:', verificationData);
        
        // Mock verification submission
        return {
          success: true,
          message: 'Verification submitted successfully',
          data: {
            status: 'pending',
            submittedAt: new Date().toISOString()
          }
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
        
        return {
          success: true,
          message: 'Verification submitted successfully',
          data: {
            status: 'pending',
            submittedAt: new Date().toISOString()
          }
        };
      }
      
      throw error.response?.data || error;
    }
  },

  // Check verification status
  getVerificationStatus: async () => {
    try {
      // For development: Mock verification status
      const useMockAuth = process.env.NODE_ENV === 'development' && 
                         (process.env.REACT_APP_USE_MOCK_AUTH === 'true' || 
                          !process.env.REACT_APP_API_BASE_URL);
      
      if (useMockAuth) {
        console.log('🔧 Development Mode: Using mock verification status');
        
        // Mock verification status - return null to show the form
        return {
          success: true,
          data: null // null means no verification submitted yet
        };
      }
      
      // Production: Real API call
      const response = await api.get('/freelancer/verification-status');
      return response.data;
    } catch (error) {
      console.error('Verification status error:', error);
      
      // Fallback to mock if network error in development
      if (process.env.NODE_ENV === 'development' && 
          (error.code === 'NETWORK_ERROR' || 
           error.code === 'ERR_NETWORK' ||
           error.message?.includes('Network Error') ||
           error.message?.includes('fetch') ||
           error.message?.includes('ERR_CONNECTION_REFUSED'))) {
        
        console.log('🔄 Network error detected, falling back to mock verification status');
        
        return {
          success: true,
          data: null // null means no verification submitted yet
        };
      }
      
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
