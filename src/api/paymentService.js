import axios from 'axios';
import { storage } from '../utils/storage';

const runtimeApiBaseUrl = (() => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const override = localStorage.getItem('apiBaseUrlOverride');
      if (override) return override;
    }
  } catch (_) {}
  
  return process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001/api';
})();

// Create axios instance for payment API calls
const api = axios.create({
  baseURL: runtimeApiBaseUrl,
  timeout: 30000,
});

// Add request interceptor to attach auth token
api.interceptors.request.use(
  (config) => {
    try {
      const token = storage.getAuthToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.warn('Failed to attach auth token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

const paymentService = {
  // Create UPI payment request
  createUPIPayment: async (jobId, headers = {}) => {
    try {
      console.log('💳 Creating UPI payment for job:', jobId);
      
      // Use debug endpoint if x-debug-mode header is present
      const isDebugMode = headers['x-debug-mode'] === 'true';
      const endpoint = isDebugMode ? `/payment/debug/upi/${jobId}` : `/payment/upi/${jobId}`;
      
      const response = await api.post(endpoint, {}, { headers });
      console.log('💳 UPI payment response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ UPI payment creation error:', error);
      throw error.response?.data || error;
    }
  },

  // Verify UPI payment
  verifyUPIPayment: async (orderId, headers = {}) => {
    try {
      console.log('🔍 Verifying UPI payment for order:', orderId);
      
      // Use debug endpoint if x-debug-mode header is present
      const isDebugMode = headers['x-debug-mode'] === 'true';
      const endpoint = isDebugMode ? '/payment/debug/verify' : '/payment/verify';
      
      const response = await api.post(endpoint, { orderId }, { headers });
      console.log('🔍 UPI payment verification response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ UPI payment verification error:', error);
      throw error.response?.data || error;
    }
  },

  // Get payment status
  getPaymentStatus: async (jobId, headers = {}) => {
    try {
      console.log('📊 Getting payment status for job:', jobId);
      
      // Use debug endpoint if x-debug-mode header is present
      const isDebugMode = headers['x-debug-mode'] === 'true';
      const endpoint = isDebugMode ? `/payment/debug/status/${jobId}` : `/payment/status/${jobId}`;
      
      const response = await api.get(endpoint, { headers });
      console.log('📊 Payment status response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Get payment status error:', error);
      throw error.response?.data || error;
    }
  },

  // Simulate successful payment (for testing)
  simulateSuccessfulPayment: async (orderId) => {
    try {
      console.log('🧪 Simulating successful payment for order:', orderId);
      
      const response = await api.post(`/payment/debug/simulate-success/${orderId}`);
      console.log('🧪 Simulate payment response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Simulate payment error:', error);
      throw error.response?.data || error;
    }
  }
};

export default paymentService;
