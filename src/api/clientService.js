import axios from 'axios';
import { storage } from '../utils/storage';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001/api';

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
      const response = await api.get('/client/my-jobs');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get client's job history
  getJobHistory: async () => {
    try {
      const response = await api.get('/client/job-history');
      return response.data;
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
  }
};
