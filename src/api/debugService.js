import axios from 'axios';
import { storage } from '../utils/storage';

// Use runtime API override if available
const API_BASE_URL = localStorage.getItem('apiBaseUrlOverride') || process.env.REACT_APP_API_BASE_URL || 'https://freelancing-platform-backend-backup.onrender.com/api';

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
      throw error.response?.data || error;
    }
  },

  // Clear all jobs from the store
  clearJobs: async () => {
    try {
      const response = await api.post('/debug/clear-jobs');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Add a test job
  addTestJob: async () => {
    try {
      const response = await api.post('/debug/add-test-job');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }
};

export default debugService;
