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

export const userService = {
  // Profile setup for new users
  profileSetup: async (profileData, role = null) => {
    try {
      // For development: Mock profile setup
      const useMockAuth = process.env.NODE_ENV === 'development' && 
                         (process.env.REACT_APP_USE_MOCK_AUTH === 'true' || 
                          !process.env.REACT_APP_API_BASE_URL);
      
      console.log('🔧 Profile setup mock check:', {
        NODE_ENV: process.env.NODE_ENV,
        USE_MOCK_AUTH: process.env.REACT_APP_USE_MOCK_AUTH,
        API_BASE_URL: process.env.REACT_APP_API_BASE_URL,
        useMockAuth: useMockAuth
      });
      
      if (useMockAuth) {
        console.log('🔧 Development Mode: Using mock profile setup');
        console.log('📝 Profile data:', profileData);
        console.log('👤 Role parameter:', role);
        
        // Get current user data
        const currentUser = storage.getUserData();
        const currentRole = storage.getCurrentRole();
        console.log('👤 Current user data from storage:', currentUser);
        console.log('🔑 Current role from storage:', currentRole);
        
        // Update user data with profile info
        const updatedUser = {
          ...currentUser,
          fullName: profileData.fullName,
          profilePhoto: profileData.profilePhoto ? 'mock-photo-url' : null,
          profileSetupCompleted: true,
          // Ensure role is preserved - use passed role, then currentRole, then default
          role: role || currentUser?.role || currentRole || 'client'
        };
        
        console.log('🔄 Updated user data:', updatedUser);
        
        // Store updated user data
        storage.setUserData(updatedUser);
        
        console.log('✅ Mock profile setup successful:', updatedUser);
        
        return {
          success: true,
          user: updatedUser,
          message: 'Profile setup completed successfully'
        };
      }
      
      // Production: Real API call with Cloudinary upload
      let profilePhotoUrl = null;
      
      if (profileData.profilePhoto) {
        console.log('📤 Uploading profile photo to Cloudinary...');
        const uploadResult = await cloudinaryService.uploadImage(profileData.profilePhoto, 'profile-photos');
        
        if (uploadResult.success) {
          profilePhotoUrl = uploadResult.url;
          console.log('✅ Profile photo uploaded successfully:', profilePhotoUrl);
        } else {
          throw new Error('Failed to upload profile photo: ' + uploadResult.error);
        }
      }
      
      const response = await api.post('/users/profile-setup', {
        fullName: profileData.fullName,
        profilePhoto: profilePhotoUrl
      });
      
      if (response.data.success) {
        storage.setUserData(response.data.user);
      }
      
      return response.data;
    } catch (error) {
      console.error('Profile setup error:', error);
      
      // Fallback to mock if network error in development
      if (process.env.NODE_ENV === 'development' && 
          (error.code === 'NETWORK_ERROR' || 
           error.code === 'ERR_NETWORK' ||
           error.message?.includes('Network Error') ||
           error.message?.includes('fetch') ||
           error.message?.includes('ERR_CONNECTION_REFUSED'))) {
        
        console.log('🔄 Network error detected, falling back to mock profile setup');
        
        const currentUser = storage.getUserData();
        const updatedUser = {
          ...currentUser,
          fullName: profileData.fullName,
          profilePhoto: profileData.profilePhoto ? 'mock-photo-url' : null,
          profileSetupCompleted: true
        };
        
        storage.setUserData(updatedUser);
        
        return {
          success: true,
          user: updatedUser,
          message: 'Profile setup completed successfully (mock)'
        };
      }
      
      throw error.response?.data || error;
    }
  },

  // Update user profile
  updateProfile: async (profileData) => {
    try {
      const formData = new FormData();
      Object.keys(profileData).forEach(key => {
        if (profileData[key] !== null && profileData[key] !== undefined) {
          formData.append(key, profileData[key]);
        }
      });
      
      const response = await api.put('/users/profile', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      if (response.data.success) {
        storage.setUserData(response.data.user);
      }
      
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get user profile
  getProfile: async () => {
    try {
      const response = await api.get('/users/profile');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Check if user has completed profile setup
  checkProfileSetup: async () => {
    try {
      const response = await api.get('/users/profile-setup-status');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },


  // Check active jobs status for role switching
  getActiveJobsStatus: async () => {
    try {
      const response = await api.get('/users/active-jobs-status');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }
};
