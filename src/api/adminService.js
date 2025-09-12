import axios from 'axios';
import { storage } from '../utils/storage';

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

export const adminService = {
  // Get pending freelancer verifications
  getFreelancerVerifications: async (status = 'pending') => {
    try {
      // For development: Mock verification data
      const useMockAuth = process.env.NODE_ENV === 'development' && 
                         (process.env.REACT_APP_USE_MOCK_AUTH === 'true' || 
                          !process.env.REACT_APP_API_BASE_URL);
      
      if (useMockAuth) {
        console.log('🔧 Development Mode: Using mock freelancer verifications');
        
        // Mock verification data based on what was submitted
        const mockVerifications = [
          {
            id: 'verification-1',
            freelancerId: 'freelancer-1',
            fullName: 'Rahul Jaiswar',
            dateOfBirth: '2001-01-30',
            gender: 'Male',
            address: 'new prabhat',
            aadhaarFront: 'mock-aadhaar-front-url',
            aadhaarBack: 'mock-aadhaar-back-url',
            panCard: 'mock-pan-card-url',
            status: 'pending',
            submittedAt: new Date().toISOString(),
            reviewedAt: null,
            reviewedBy: null,
            rejectionReason: null
          }
        ];
        
        return {
          success: true,
          data: mockVerifications.filter(v => v.status === status)
        };
      }
      
      // Production: Real API call
      const response = await api.get('/admin/freelancer-verifications', {
        params: { status }
      });
      return response.data;
    } catch (error) {
      console.error('Freelancer verifications error:', error);
      
      // Fallback to mock if network error in development
      if (process.env.NODE_ENV === 'development' && 
          (error.code === 'NETWORK_ERROR' || 
           error.code === 'ERR_NETWORK' ||
           error.message?.includes('Network Error') ||
           error.message?.includes('fetch') ||
           error.message?.includes('ERR_CONNECTION_REFUSED'))) {
        
        console.log('🔄 Network error detected, falling back to mock freelancer verifications');
        
        const mockVerifications = [
          {
            id: 'verification-1',
            freelancerId: 'freelancer-1',
            fullName: 'Rahul Jaiswar',
            dateOfBirth: '2001-01-30',
            gender: 'Male',
            address: 'new prabhat',
            aadhaarFront: 'mock-aadhaar-front-url',
            aadhaarBack: 'mock-aadhaar-back-url',
            panCard: 'mock-pan-card-url',
            status: 'pending',
            submittedAt: new Date().toISOString(),
            reviewedAt: null,
            reviewedBy: null,
            rejectionReason: null
          }
        ];
        
        return {
          success: true,
          data: mockVerifications.filter(v => v.status === status)
        };
      }
      
      throw error.response?.data || error;
    }
  },

  // Approve freelancer verification
  approveFreelancer: async (freelancerId) => {
    try {
      // For development: Mock approval
      const useMockAuth = process.env.NODE_ENV === 'development' && 
                         (process.env.REACT_APP_USE_MOCK_AUTH === 'true' || 
                          !process.env.REACT_APP_API_BASE_URL);
      
      if (useMockAuth) {
        console.log('🔧 Development Mode: Mock approving freelancer:', freelancerId);
        
        return {
          success: true,
          message: 'Freelancer verification approved successfully'
        };
      }
      
      // Production: Real API call
      const response = await api.post(`/admin/approve-freelancer/${freelancerId}`);
      return response.data;
    } catch (error) {
      console.error('Approve freelancer error:', error);
      
      // Fallback to mock if network error in development
      if (process.env.NODE_ENV === 'development' && 
          (error.code === 'NETWORK_ERROR' || 
           error.code === 'ERR_NETWORK' ||
           error.message?.includes('Network Error') ||
           error.message?.includes('fetch') ||
           error.message?.includes('ERR_CONNECTION_REFUSED'))) {
        
        console.log('🔄 Network error detected, falling back to mock approval');
        
        return {
          success: true,
          message: 'Freelancer verification approved successfully'
        };
      }
      
      throw error.response?.data || error;
    }
  },

  // Reject freelancer verification
  rejectFreelancer: async (freelancerId, reason) => {
    try {
      // For development: Mock rejection
      const useMockAuth = process.env.NODE_ENV === 'development' && 
                         (process.env.REACT_APP_USE_MOCK_AUTH === 'true' || 
                          !process.env.REACT_APP_API_BASE_URL);
      
      if (useMockAuth) {
        console.log('🔧 Development Mode: Mock rejecting freelancer:', freelancerId, 'Reason:', reason);
        
        return {
          success: true,
          message: 'Freelancer verification rejected successfully'
        };
      }
      
      // Production: Real API call
      const response = await api.post(`/admin/reject-freelancer/${freelancerId}`, {
        reason
      });
      return response.data;
    } catch (error) {
      console.error('Reject freelancer error:', error);
      
      // Fallback to mock if network error in development
      if (process.env.NODE_ENV === 'development' && 
          (error.code === 'NETWORK_ERROR' || 
           error.code === 'ERR_NETWORK' ||
           error.message?.includes('Network Error') ||
           error.message?.includes('fetch') ||
           error.message?.includes('ERR_CONNECTION_REFUSED'))) {
        
        console.log('🔄 Network error detected, falling back to mock rejection');
        
        return {
          success: true,
          message: 'Freelancer verification rejected successfully'
        };
      }
      
      throw error.response?.data || error;
    }
  },

  // Get pending withdrawal requests
  getWithdrawalRequests: async (status = 'pending') => {
    try {
      // For development: Mock withdrawal requests
      const useMockAuth = process.env.NODE_ENV === 'development' && 
                         (process.env.REACT_APP_USE_MOCK_AUTH === 'true' || 
                          !process.env.REACT_APP_API_BASE_URL);
      
      if (useMockAuth) {
        console.log('🔧 Development Mode: Using mock withdrawal requests');
        
        // Mock withdrawal requests data
        const mockWithdrawals = [
          {
            id: 'withdrawal-1',
            freelancerId: 'freelancer-1',
            freelancerName: 'Rahul Jaiswar',
            amount: 5000,
            bankAccount: '****1234',
            status: 'pending',
            requestedAt: new Date().toISOString(),
            reviewedAt: null,
            reviewedBy: null,
            rejectionReason: null
          }
        ];
        
        return {
          success: true,
          withdrawals: mockWithdrawals.filter(w => w.status === status)
        };
      }
      
      // Production: Real API call
      const response = await api.get('/admin/withdrawal-requests', {
        params: { status }
      });
      return response.data;
    } catch (error) {
      console.error('Withdrawal requests error:', error);
      
      // Fallback to mock if network error in development
      if (process.env.NODE_ENV === 'development' && 
          (error.code === 'NETWORK_ERROR' || 
           error.code === 'ERR_NETWORK' ||
           error.message?.includes('Network Error') ||
           error.message?.includes('fetch') ||
           error.message?.includes('ERR_CONNECTION_REFUSED'))) {
        
        console.log('🔄 Network error detected, falling back to mock withdrawal requests');
        
        const mockWithdrawals = [
          {
            id: 'withdrawal-1',
            freelancerId: 'freelancer-1',
            freelancerName: 'Rahul Jaiswar',
            amount: 5000,
            bankAccount: '****1234',
            status: 'pending',
            requestedAt: new Date().toISOString(),
            reviewedAt: null,
            reviewedBy: null,
            rejectionReason: null
          }
        ];
        
        return {
          success: true,
          withdrawals: mockWithdrawals.filter(w => w.status === status)
        };
      }
      
      throw error.response?.data || error;
    }
  },

  // Approve withdrawal request
  approveWithdrawal: async (withdrawalId) => {
    try {
      // For development: Mock approval
      const useMockAuth = process.env.NODE_ENV === 'development' && 
                         (process.env.REACT_APP_USE_MOCK_AUTH === 'true' || 
                          !process.env.REACT_APP_API_BASE_URL);
      
      if (useMockAuth) {
        console.log('🔧 Development Mode: Mock approving withdrawal:', withdrawalId);
        
        return {
          success: true,
          message: 'Withdrawal request approved successfully'
        };
      }
      
      // Production: Real API call
      const response = await api.post(`/admin/approve-withdrawal/${withdrawalId}`);
      return response.data;
    } catch (error) {
      console.error('Approve withdrawal error:', error);
      
      // Fallback to mock if network error in development
      if (process.env.NODE_ENV === 'development' && 
          (error.code === 'NETWORK_ERROR' || 
           error.code === 'ERR_NETWORK' ||
           error.message?.includes('Network Error') ||
           error.message?.includes('fetch') ||
           error.message?.includes('ERR_CONNECTION_REFUSED'))) {
        
        console.log('🔄 Network error detected, falling back to mock withdrawal approval');
        
        return {
          success: true,
          message: 'Withdrawal request approved successfully'
        };
      }
      
      throw error.response?.data || error;
    }
  },

  // Reject withdrawal request
  rejectWithdrawal: async (withdrawalId, reason) => {
    try {
      // For development: Mock rejection
      const useMockAuth = process.env.NODE_ENV === 'development' && 
                         (process.env.REACT_APP_USE_MOCK_AUTH === 'true' || 
                          !process.env.REACT_APP_API_BASE_URL);
      
      if (useMockAuth) {
        console.log('🔧 Development Mode: Mock rejecting withdrawal:', withdrawalId, 'Reason:', reason);
        
        return {
          success: true,
          message: 'Withdrawal request rejected successfully'
        };
      }
      
      // Production: Real API call
      const response = await api.post(`/admin/reject-withdrawal/${withdrawalId}`, {
        reason
      });
      return response.data;
    } catch (error) {
      console.error('Reject withdrawal error:', error);
      
      // Fallback to mock if network error in development
      if (process.env.NODE_ENV === 'development' && 
          (error.code === 'NETWORK_ERROR' || 
           error.code === 'ERR_NETWORK' ||
           error.message?.includes('Network Error') ||
           error.message?.includes('fetch') ||
           error.message?.includes('ERR_CONNECTION_REFUSED'))) {
        
        console.log('🔄 Network error detected, falling back to mock withdrawal rejection');
        
        return {
          success: true,
          message: 'Withdrawal request rejected successfully'
        };
      }
      
      throw error.response?.data || error;
    }
  },

  // Get admin dashboard statistics
  getDashboardStats: async () => {
    try {
      const response = await api.get('/admin/dashboard-stats');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }
};
