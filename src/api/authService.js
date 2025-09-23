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

const API_BASE_URL = runtimeApiBaseUrl || process.env.REACT_APP_API_BASE_URL || 'https://freelancing-platform-backend-backup.onrender.com/api';

// Create axios instance
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

// Response interceptor to handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      storage.clearAll();
      try {
        const path = window.location?.pathname || '';
        const redirect = path.startsWith('/admin') ? '/admin/login' : '/login';
        window.location.href = redirect;
      } catch (_) {
        // Fallback
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authService = {
  // Admin email/password login (non-Firebase)
  adminLogin: async (email, password) => {
    try {
      const response = await api.post('/auth/admin-login', { email, password });
      if (response.data.success) {
        storage.setAuthToken(response.data.token);
        storage.setUserData(response.data.user);
        storage.setCurrentRole('admin');
      }
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
  // Authenticate user with Firebase ID token
  authenticate: async (idToken, role, phoneNumber) => {
    try {
      // For development: Mock authentication without backend
      // Always use mock in development unless explicitly disabled
      const useMockAuth = process.env.REACT_APP_USE_MOCK_AUTH === 'true' || 
                         (process.env.NODE_ENV === 'development' && !process.env.REACT_APP_API_BASE_URL);
      
      console.log('🔧 Mock auth check:', {
        NODE_ENV: process.env.NODE_ENV,
        USE_MOCK_AUTH: process.env.REACT_APP_USE_MOCK_AUTH,
        API_BASE_URL: process.env.REACT_APP_API_BASE_URL,
        useMockAuth: useMockAuth
      });
      
      if (useMockAuth) {
        console.log('🔧 Development Mode: Using mock authentication');
        console.log('📱 Role selected:', role);
        
        // Mock user data
        const mockUser = {
          id: 'mock-user-id-' + Date.now(),
          phone: phoneNumber || '+919876543210', // Use provided phone number or default
          phoneNumber: phoneNumber || '+919876543210', // Also set phoneNumber for compatibility
          role: role,
          fullName: 'Mock User',
          profilePhoto: null,
          isNewUser: true,
          needsProfileSetup: true, // Both clients and freelancers need setup
          needsVerification: role === 'freelancer' // Only freelancers need verification
        };
        
        // Mock JWT token
        const mockToken = 'mock-jwt-token-' + Date.now();
        
        // Store mock data in localStorage
        storage.setAuthToken(mockToken);
        storage.setUserData(mockUser);
        storage.setCurrentRole(role);
        
        console.log('✅ Mock authentication successful:', mockUser);
        
        return {
          success: true,
          token: mockToken,
          user: mockUser,
          isNewUser: true,
          needsProfileSetup: true, // Both clients and freelancers need setup
          needsVerification: role === 'freelancer' // Only freelancers need verification
        };
      }
      
      // Production: Real API call
      if (!phoneNumber) {
        throw new Error('Phone number is required for authentication');
      }
      
      const response = await api.post('/auth/authenticate', {
        idToken,
        role,
        phoneNumber
      });
      
      if (response.data.success) {
        storage.setAuthToken(response.data.token);
        storage.setUserData(response.data.user);
        storage.setCurrentRole(role);
      }
      
      return response.data;
    } catch (error) {
      console.error('Authentication error:', error);
      // Do not fallback to mock on network errors; surface the error so CORS/auth can be fixed
      throw error.response?.data || error;
    }
  },

  // Logout user
  logout: async () => {
    try {
      await api.post('/auth/logout');
      storage.clearAll();
      return { success: true };
    } catch (error) {
      // Even if API call fails, clear local storage
      storage.clearAll();
      throw error.response?.data || error;
    }
  },

  // Switch user role
  switchRole: async (newRole) => {
    try {
      console.log('🔄 Frontend role switch request:', {
        newRole: newRole,
        timestamp: new Date().toISOString()
      });
      
      const response = await api.post('/auth/switch-role', {
        newRole: newRole
      });
      
      if (response.data.success) {
        storage.setCurrentRole(newRole);
        storage.setUserData(response.data.user);
      }
      
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Check if user can switch role (no active jobs)
  canSwitchRole: async () => {
    try {
      const response = await api.get('/users/active-jobs-status');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }
};
