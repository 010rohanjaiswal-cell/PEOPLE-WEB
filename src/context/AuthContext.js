import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { storage } from '../utils/storage';

const AuthContext = createContext();

const initialState = {
  isAuthenticated: false,
  user: null,
  token: null,
  loading: true,
  error: null
};

const authReducer = (state, action) => {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        loading: true,
        error: null
      };
    case 'AUTH_SUCCESS':
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload.user,
        token: action.payload.token,
        loading: false,
        error: null
      };
    case 'AUTH_FAILURE':
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        token: null,
        loading: false,
        error: action.payload
      };
    case 'LOGOUT':
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        token: null,
        loading: false,
        error: null
      };
    case 'UPDATE_USER':
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload,
        loading: false,
        error: null
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null
      };
    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check for existing authentication on app load
  useEffect(() => {
    const checkAuth = () => {
      const token = storage.getAuthToken();
      const userData = storage.getUserData();
      
      console.log('🔍 AuthContext: Checking authentication on load');
      console.log('🔑 Token:', token ? 'Present' : 'Missing');
      console.log('👤 User data:', userData);
      
      // Only authenticate if we have both token and user data
      // Accept if user has phone/phoneNumber, or is admin (email/role based)
      const hasPhone = userData && (userData.phone || userData.phoneNumber);
      const isAdminUser = userData && (userData.role === 'admin' || !!userData.email);
      
      if (token && userData && (hasPhone || isAdminUser)) {
        console.log('✅ AuthContext: Valid authentication found, setting authenticated state');
        dispatch({
          type: 'AUTH_SUCCESS',
          payload: { token, user: userData }
        });
      } else {
        console.log('❌ AuthContext: No valid authentication - clearing any invalid data');
        // Clear invalid authentication data
        if (!token || !userData) {
          storage.clearAll();
        }
        dispatch({ type: 'AUTH_FAILURE', payload: null });
      }
    };

    // Add a small delay to ensure storage is ready
    const timeoutId = setTimeout(checkAuth, 100);
    
    return () => clearTimeout(timeoutId);

    // Listen for storage changes (when user data is updated)
    const handleStorageChange = (e) => {
      if (e.key === 'userData' || e.key === 'authToken') {
        console.log('🔄 AuthContext: Storage changed, rechecking authentication');
        checkAuth();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Also listen for custom events (for same-tab updates)
    const handleCustomStorageChange = () => {
      console.log('🔄 AuthContext: Custom storage event, rechecking authentication');
      checkAuth();
    };

    window.addEventListener('userDataUpdated', handleCustomStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('userDataUpdated', handleCustomStorageChange);
    };
  }, []);

  const login = (user, token) => {
    console.log('🔐 Login called with user and token');
    // Atomically set token and user to avoid race conditions
    storage.setAuth(user, token);
    dispatch({
      type: 'AUTH_SUCCESS',
      payload: { user, token }
    });
  };

  const logout = () => {
    storage.clearAll();
    dispatch({ type: 'LOGOUT' });
  };

  const updateUser = (user) => {
    console.log('🔄 Updating user in AuthContext:', user);
    console.log('👤 User role:', user?.role);
    storage.setUserData(user);
    
    // Also ensure we have a token for authentication
    const existingToken = storage.getAuthToken();
    if (existingToken) {
      dispatch({ 
        type: 'AUTH_SUCCESS', 
        payload: { user, token: existingToken } 
      });
      console.log('✅ User updated in AuthContext with existing token');
      console.log('🔑 Token exists:', !!existingToken);
    } else {
      // If no token, we need to authenticate properly
      console.log('⚠️ No token found, user update may not be sufficient for authentication');
      dispatch({ type: 'UPDATE_USER', payload: user });
    }
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const value = {
    ...state,
    login,
    logout,
    updateUser,
    clearError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
