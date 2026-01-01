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

// Export API_BASE_URL for debugging purposes
export const getAdminApiBaseUrl = () => API_BASE_URL;

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = storage.getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      if (process.env.NODE_ENV !== 'production') {
        console.log('🔒 Attaching Authorization header for admin API:', {
          hasToken: !!token,
          authHeaderStartsWith: (config.headers.Authorization || '').slice(0, 10),
          url: config.url
        });
      }
    } else if (process.env.NODE_ENV !== 'production') {
      console.warn('⚠️ No auth token found when calling admin API:', { url: config.url });
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
      const useMockAuth = process.env.REACT_APP_USE_MOCK_AUTH === 'true' || 
                         (process.env.NODE_ENV === 'development' && !process.env.REACT_APP_API_BASE_URL);
      
      console.log('🔧 Admin verification check:', {
        NODE_ENV: process.env.NODE_ENV,
        USE_MOCK_AUTH: process.env.REACT_APP_USE_MOCK_AUTH,
        API_BASE_URL: process.env.REACT_APP_API_BASE_URL,
        useMockAuth: useMockAuth
      });
      
      if (useMockAuth) {
        console.log('🔧 Development Mode: Using mock freelancer verifications');
        
        // Check if there's a submitted verification in localStorage
        const submittedVerification = localStorage.getItem('mockVerificationStatus');
        
        let mockVerifications = [];
        
        if (submittedVerification) {
          const verificationData = JSON.parse(submittedVerification);
          mockVerifications = [
            {
              id: 'verification-1',
              freelancerId: 'freelancer-1',
              fullName: verificationData.fullName,
              dateOfBirth: verificationData.dateOfBirth,
              gender: verificationData.gender,
              address: verificationData.address,
              aadhaarFront: verificationData.aadhaarFront,
              aadhaarBack: verificationData.aadhaarBack,
              panCard: verificationData.panCard,
              status: verificationData.status,
              submittedAt: verificationData.submittedAt,
              reviewedAt: null,
              reviewedBy: null,
              rejectionReason: null
            }
          ];
        }
        
        return {
          success: true,
          data: mockVerifications.filter(v => v.status === status)
        };
      }
      
      // Production: Real API call
      const response = await api.get('/admin/freelancer-verifications', {
        params: { status }
      });
      // Normalize to expected shape in UI (verifications array with id/phone fields)
      const raw = response.data?.data || [];
      const verifications = raw.map((u) => ({
        _id: u._id || u.id,
        id: u._id || u.id,
        fullName: u.fullName,
        phoneNumber: u.phoneNumber || u.phone,
        phone: u.phoneNumber || u.phone,
        status: u.verificationStatus || u.status || 'pending',
        verificationStatus: u.verificationStatus || u.status || 'pending',
        updatedAt: u.updatedAt || u.createdAt,
        createdAt: u.createdAt,
        submittedAt: u.createdAt || u.updatedAt,
        profilePhoto: u.profilePhoto || u.verificationDocuments?.profilePhoto,
        aadhaarFront: u.verificationDocuments?.aadhaarFront,
        aadhaarBack: u.verificationDocuments?.aadhaarBack,
        panCard: u.verificationDocuments?.panCard,
        dateOfBirth: u.verificationDocuments?.dateOfBirth,
        gender: u.verificationDocuments?.gender,
        address: u.verificationDocuments?.address
      }));
      return { success: true, verifications };
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
        
        // Check if there's a submitted verification in localStorage
        const submittedVerification = localStorage.getItem('mockVerificationStatus');
        
        let mockVerifications = [];
        
        if (submittedVerification) {
          const verificationData = JSON.parse(submittedVerification);
          mockVerifications = [
            {
              id: 'verification-1',
              freelancerId: 'freelancer-1',
              fullName: verificationData.fullName,
              dateOfBirth: verificationData.dateOfBirth,
              gender: verificationData.gender,
              address: verificationData.address,
              aadhaarFront: verificationData.aadhaarFront,
              aadhaarBack: verificationData.aadhaarBack,
              panCard: verificationData.panCard,
              status: verificationData.status,
              submittedAt: verificationData.submittedAt,
              reviewedAt: null,
              reviewedBy: null,
              rejectionReason: null
            }
          ];
        }
        
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
      const useMockAuth = process.env.REACT_APP_USE_MOCK_AUTH === 'true' || 
                         (process.env.NODE_ENV === 'development' && !process.env.REACT_APP_API_BASE_URL);
      
      if (useMockAuth) {
        console.log('🔧 Development Mode: Mock approving freelancer:', freelancerId);
        
        // Update the verification status in localStorage
        const submittedVerification = localStorage.getItem('mockVerificationStatus');
        if (submittedVerification) {
          const verificationData = JSON.parse(submittedVerification);
          verificationData.status = 'approved';
          verificationData.reviewedAt = new Date().toISOString();
          verificationData.reviewedBy = 'admin';
          localStorage.setItem('mockVerificationStatus', JSON.stringify(verificationData));
          console.log('💾 Updated verification status to approved in localStorage');
        }
        
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
        
        // Update the verification status in localStorage
        const submittedVerification = localStorage.getItem('mockVerificationStatus');
        if (submittedVerification) {
          const verificationData = JSON.parse(submittedVerification);
          verificationData.status = 'approved';
          verificationData.reviewedAt = new Date().toISOString();
          verificationData.reviewedBy = 'admin';
          localStorage.setItem('mockVerificationStatus', JSON.stringify(verificationData));
          console.log('💾 Updated verification status to approved in localStorage (fallback)');
        }
        
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
      const useMockAuth = process.env.REACT_APP_USE_MOCK_AUTH === 'true' || 
                         (process.env.NODE_ENV === 'development' && !process.env.REACT_APP_API_BASE_URL);
      
      if (useMockAuth) {
        console.log('🔧 Development Mode: Mock rejecting freelancer:', freelancerId, 'Reason:', reason);
        
        // Update the verification status in localStorage
        const submittedVerification = localStorage.getItem('mockVerificationStatus');
        if (submittedVerification) {
          const verificationData = JSON.parse(submittedVerification);
          verificationData.status = 'rejected';
          verificationData.reviewedAt = new Date().toISOString();
          verificationData.reviewedBy = 'admin';
          verificationData.rejectionReason = reason;
          localStorage.setItem('mockVerificationStatus', JSON.stringify(verificationData));
          console.log('💾 Updated verification status to rejected in localStorage');
        }
        
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
        
        // Update the verification status in localStorage
        const submittedVerification = localStorage.getItem('mockVerificationStatus');
        if (submittedVerification) {
          const verificationData = JSON.parse(submittedVerification);
          verificationData.status = 'rejected';
          verificationData.reviewedAt = new Date().toISOString();
          verificationData.reviewedBy = 'admin';
          verificationData.rejectionReason = reason;
          localStorage.setItem('mockVerificationStatus', JSON.stringify(verificationData));
          console.log('💾 Updated verification status to rejected in localStorage (fallback)');
        }
        
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
      const useMockAuth = process.env.REACT_APP_USE_MOCK_AUTH === 'true' || 
                         (process.env.NODE_ENV === 'development' && !process.env.REACT_APP_API_BASE_URL);
      
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
      // Normalize to expected shape in UI
      const raw = response.data?.data || [];
      const withdrawals = raw.map((w) => ({
        id: w._id || w.id || `withdrawal-${Date.now()}`,
        freelancerId: w.freelancerId,
        freelancerName: w.freelancerName,
        amount: w.amount || 0,
        upiId: w.upiId || w.bankAccount,
        status: w.status || status,
        requestedAt: w.requestedAt || w.createdAt
      }));
      return { success: true, withdrawals };
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
      const useMockAuth = process.env.REACT_APP_USE_MOCK_AUTH === 'true' || 
                         (process.env.NODE_ENV === 'development' && !process.env.REACT_APP_API_BASE_URL);
      
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
      const useMockAuth = process.env.REACT_APP_USE_MOCK_AUTH === 'true' || 
                         (process.env.NODE_ENV === 'development' && !process.env.REACT_APP_API_BASE_URL);
      
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
  },

  // Search users by phone number
  searchUsers: async (phoneNumber) => {
    try {
      // For development: Mock user search
      const useMockAuth = process.env.REACT_APP_USE_MOCK_AUTH === 'true' || 
                         (process.env.NODE_ENV === 'development' && !process.env.REACT_APP_API_BASE_URL);
      
      if (useMockAuth) {
        console.log('🔧 Development Mode: Using mock user search');
        
        // Mock search results
        const mockUsers = [
          {
            _id: 'user-1',
            fullName: 'John Doe',
            phoneNumber: '+919876543210',
            role: 'client',
            verificationStatus: 'approved',
            profilePhoto: null,
            createdAt: new Date().toISOString(),
            wallet: { balance: 1000 }
          },
          {
            _id: 'user-2',
            fullName: 'Jane Smith',
            phoneNumber: '+919876543211',
            role: 'freelancer',
            verificationStatus: 'pending',
            profilePhoto: null,
            createdAt: new Date().toISOString(),
            wallet: { balance: 500 }
          }
        ];
        
        return {
          success: true,
          data: {
            clients: mockUsers.filter(u => u.role === 'client'),
            freelancers: mockUsers.filter(u => u.role === 'freelancer'),
            total: mockUsers.length
          }
        };
      }
      
      // Production: Real API call
      console.log('🔍 Calling search-users API with phoneNumber:', phoneNumber || '(empty - all users)');
      const response = await api.get('/admin/search-users', {
        params: { phoneNumber: phoneNumber || '' }
      });
      
      console.log('✅ Search users API response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Search users API error:', error);
      console.error('Error details:', {
        message: error?.message,
        response: error?.response?.data,
        status: error?.response?.status,
        statusText: error?.response?.statusText,
        url: error?.config?.url
      });
      
      // Return error in a consistent format
      if (error.response?.data) {
        const errorData = error.response.data;
        const errorObj = new Error(errorData.message || 'Failed to search users');
        Object.assign(errorObj, { ...errorData, success: false });
        throw errorObj;
      } else if (error.response) {
        const errorObj = new Error(error.response.statusText || 'Failed to search users');
        Object.assign(errorObj, {
          success: false,
          message: error.response.statusText || 'Failed to search users',
          error: error.message
        });
        throw errorObj;
      } else {
        const errorObj = new Error(error.message || 'Network error. Please check your connection.');
        Object.assign(errorObj, {
          success: false,
          message: error.message || 'Network error. Please check your connection.',
          error: error.message
        });
        throw errorObj;
      }
    }
  },

  // Get user profile by ID
  getUserProfile: async (userId) => {
    try {
      // For development: Mock user profile
      const useMockAuth = process.env.REACT_APP_USE_MOCK_AUTH === 'true' || 
                         (process.env.NODE_ENV === 'development' && !process.env.REACT_APP_API_BASE_URL);
      
      if (useMockAuth) {
        console.log('🔧 Development Mode: Using mock user profile');
        
        // Mock user profile data
        const mockProfile = {
          _id: userId,
          fullName: 'John Doe',
          phoneNumber: '+919876543210',
          email: 'john@example.com',
          role: 'client',
          verificationStatus: 'approved',
          profilePhoto: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          wallet: { 
            balance: 1000, 
            totalEarnings: 5000 
          },
          verificationDocuments: null,
          profileSetupCompleted: true,
          isActive: true
        };
        
        return {
          success: true,
          data: mockProfile
        };
      }
      
      // Production: Real API call
      const response = await api.get(`/admin/user-profile/${userId}`);
      
      return response.data;
    } catch (error) {
      console.error('Get user profile error:', error);
      throw error.response?.data || error;
    }
  }
};
