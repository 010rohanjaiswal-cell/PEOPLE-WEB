import axios from 'axios';
import { storage } from '../utils/storage';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://freelancing-platform-backend-backup.onrender.com/api';

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
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authService = {
  // Authenticate user with Firebase ID token
  authenticate: async (idToken, role) => {
    try {
      // For development: Mock authentication without backend
      // Always use mock in development unless explicitly disabled
      const useMockAuth = process.env.NODE_ENV === 'development' && 
                         (process.env.REACT_APP_USE_MOCK_AUTH === 'true' || 
                          !process.env.REACT_APP_API_BASE_URL);
      
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
          phone: '+919876543210', // You can extract this from Firebase user
          role: role,
          fullName: 'Mock User',
          profilePhoto: null,
          isNewUser: true,
          needsProfileSetup: role === 'client' // Only clients need profile setup
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
          needsProfileSetup: role === 'client' // Only clients need profile setup
        };
      }
      
      // Production: Real API call
      const response = await api.post('/auth/authenticate', {
        idToken,
        role
      });
      
      if (response.data.success) {
        storage.setAuthToken(response.data.token);
        storage.setUserData(response.data.user);
        storage.setCurrentRole(role);
      }
      
      return response.data;
    } catch (error) {
      console.error('Authentication error:', error);
      
      // Fallback to mock authentication if network error in development
      if (process.env.NODE_ENV === 'development' && 
          (error.code === 'NETWORK_ERROR' || 
           error.code === 'ERR_NETWORK' ||
           error.message?.includes('Network Error') ||
           error.message?.includes('fetch') ||
           error.message?.includes('ERR_CONNECTION_REFUSED'))) {
        
        console.log('🔄 Network error detected, falling back to mock authentication');
        
        // Mock user data
        const mockUser = {
          id: 'mock-user-id-' + Date.now(),
          phone: '+919876543210',
          role: role,
          fullName: 'Mock User',
          profilePhoto: null,
          isNewUser: true,
          needsProfileSetup: role === 'client' // Only clients need profile setup
        };
        
        // Mock JWT token
        const mockToken = 'mock-jwt-token-' + Date.now();
        
        // Store in localStorage
        storage.setAuthToken(mockToken);
        storage.setUserData(mockUser);
        storage.setCurrentRole(role);
        
        console.log('✅ Fallback mock authentication successful:', mockUser);
        
        return {
          success: true,
          token: mockToken,
          user: mockUser,
          isNewUser: true,
          needsProfileSetup: role === 'client' // Only clients need profile setup
        };
      }
      
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
      const response = await api.post('/auth/switch-role', {
        role: newRole
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
