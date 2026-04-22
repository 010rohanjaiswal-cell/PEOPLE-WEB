import axios from 'axios';
import { storage } from '../utils/storage';

// Use runtime API override if available
const API_BASE_URL = localStorage.getItem('apiBaseUrlOverride') || process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = storage.getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

const debugService = {
  // Get debug information about jobs
  getDebugInfo: async () => {
    try {
      const response = await api.get('/debug/jobs');
      return response.data;
    } catch (error) {
      // Fallback to public endpoint if auth fails
      try {
        const response = await api.get('/debug/jobs-public');
        return response.data;
      } catch (fallbackError) {
        throw error.response?.data || error;
      }
    }
  },

  // Clear all jobs from the store
  clearJobs: async () => {
    try {
      const response = await api.post('/debug/clear-jobs');
      return response.data;
    } catch (error) {
      // Fallback to public endpoint if auth fails
      try {
        const response = await api.post('/debug/clear-jobs-public');
        return response.data;
      } catch (fallbackError) {
        throw error.response?.data || error;
      }
    }
  },

  // Add a test job
  addTestJob: async () => {
    try {
      const response = await api.post('/debug/add-test-job');
      return response.data;
    } catch (error) {
      // Fallback to public endpoint if auth fails
      try {
        const response = await api.post('/debug/add-test-job-public');
        return response.data;
      } catch (fallbackError) {
        throw error.response?.data || error;
      }
    }
  },

  // Update job status
  updateJobStatus: async (jobId, status) => {
    try {
      const response = await api.post(`/debug/update-job-status/${jobId}`, { status });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }
};

export default debugService;
