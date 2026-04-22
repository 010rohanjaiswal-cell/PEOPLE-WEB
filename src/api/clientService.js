import axios from 'axios';
import { storage } from '../utils/storage';

const runtimeApiBaseUrl = (() => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const override = localStorage.getItem('apiBaseUrlOverride');
      if (override) return override;
    }
  } catch (_) {}
  return undefined;
})();

const API_BASE_URL = runtimeApiBaseUrl || process.env.REACT_APP_API_BASE_URL || 'https://people-web-5hqi.onrender.com/api';

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
      if (process.env.NODE_ENV !== 'production') {
        console.log('🔒 Attaching Authorization header for client API:', {
          hasToken: !!token,
          authHeaderStartsWith: (config.headers.Authorization || '').slice(0, 10),
          baseURL: API_BASE_URL
        });
      }
    } else if (process.env.NODE_ENV !== 'production') {
      console.warn('⚠️ No auth token found when calling client API:', {
        url: config.url,
        baseURL: API_BASE_URL
      });
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const clientService = {
  // Post a new job
  postJob: async (jobData) => {
    try {
      const response = await api.post('/client/post-job', jobData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get client's active jobs
  getActiveJobs: async () => {
    try {
      console.log('🌐 Calling /client/my-jobs API...');
      const response = await api.get('/client/my-jobs');
      console.log('📡 Raw API response:', response);
      console.log('📡 Response data:', response.data);
      
      const data = response.data || {};
      const result = {
        success: data.success !== false,
        jobs: data.jobs || data.data || []
      };
      
      console.log('🔄 Processed result:', result);
      return result;
    } catch (error) {
      console.error('❌ getActiveJobs API error:', error);
      throw error.response?.data || error;
    }
  },

  // Get client's job history
  getJobHistory: async () => {
    try {
      const response = await api.get('/client/job-history');
      const data = response.data || {};
      return {
        success: data.success !== false,
        jobs: data.jobs || data.data || []
      };
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get job details with offers
  getJobDetails: async (jobId) => {
    try {
      const response = await api.get(`/client/job/${jobId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Accept freelancer offer
  acceptOffer: async (jobId, freelancerId) => {
    try {
      const response = await api.post(`/client/accept-offer/${jobId}`, {
        freelancerId
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Reject freelancer offer
  rejectOffer: async (jobId, freelancerId) => {
    try {
      const response = await api.post(`/client/reject-offer/${jobId}`, {
        freelancerId
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Mark job as complete
  markJobComplete: async (jobId) => {
    try {
      const response = await api.post(`/client/job/${jobId}/complete`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Cancel job
  cancelJob: async (jobId) => {
    try {
      const response = await api.post(`/client/job/${jobId}/cancel`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get payment details for job
  getPaymentDetails: async (jobId) => {
    try {
      const response = await api.get(`/client/job/${jobId}/payment`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Process payment via UPI
  processPayment: async (jobId, paymentData) => {
    try {
      const response = await api.post(`/client/pay/${jobId}`, paymentData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Update job
  updateJob: async (jobId, jobData) => {
    try {
      console.log('✏️ Updating job:', jobId, jobData);
      const response = await api.put(`/client/job/${jobId}`, jobData);
      console.log('✏️ Update job response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Update job error:', error);
      throw error.response?.data || error;
    }
  },

  // Delete job
  deleteJob: async (jobId) => {
    try {
      console.log('🗑️ Deleting job:', jobId);
      const response = await api.delete(`/client/job/${jobId}`);
      console.log('🗑️ Delete job response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Delete job error:', error);
      throw error.response?.data || error;
    }
  },

  // Pay for job
  payJob: async (jobId, paymentMethod) => {
    try {
      console.log('💳 Paying for job:', jobId, 'method:', paymentMethod);
      const response = await api.post(`/client/pay/${jobId}`, { paymentMethod });
      console.log('💳 Pay job response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Pay job error:', error);
      throw error.response?.data || error;
    }
  }
};
