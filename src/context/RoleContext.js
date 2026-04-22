import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { storage } from '../utils/storage';

const RoleContext = createContext();

const initialState = {
  currentRole: null,
  availableRoles: [],
  canSwitchRole: true,
  switchError: null,
  loading: false
};

const roleReducer = (state, action) => {
  switch (action.type) {
    case 'SET_ROLE':
      return {
        ...state,
        currentRole: action.payload,
        switchError: null
      };
    case 'SET_AVAILABLE_ROLES':
      return {
        ...state,
        availableRoles: action.payload
      };
    case 'SET_CAN_SWITCH':
      return {
        ...state,
        canSwitchRole: action.payload
      };
    case 'SWITCH_ROLE_START':
      return {
        ...state,
        loading: true,
        switchError: null
      };
    case 'SWITCH_ROLE_SUCCESS':
      return {
        ...state,
        currentRole: action.payload,
        loading: false,
        switchError: null
      };
    case 'SWITCH_ROLE_FAILURE':
      return {
        ...state,
        loading: false,
        switchError: action.payload
      };
    case 'CLEAR_SWITCH_ERROR':
      return {
        ...state,
        switchError: null
      };
    default:
      return state;
  }
};

export const RoleProvider = ({ children }) => {
  const [state, dispatch] = useReducer(roleReducer, initialState);

  // Load current role from storage on app load
  useEffect(() => {
    const currentRole = storage.getCurrentRole();
    if (currentRole) {
      dispatch({ type: 'SET_ROLE', payload: currentRole });
    }
  }, []);

  const setRole = (role) => {
    storage.setCurrentRole(role);
    dispatch({ type: 'SET_ROLE', payload: role });
  };

  const setAvailableRoles = (roles) => {
    dispatch({ type: 'SET_AVAILABLE_ROLES', payload: roles });
  };

  const setCanSwitchRole = (canSwitch) => {
    dispatch({ type: 'SET_CAN_SWITCH', payload: canSwitch });
  };

  const switchRole = async (newRole, authService) => {
    dispatch({ type: 'SWITCH_ROLE_START' });
    
    try {
      const result = await authService.switchRole(newRole);
      if (result.success) {
        storage.setCurrentRole(newRole);
        dispatch({ type: 'SWITCH_ROLE_SUCCESS', payload: newRole });
        return { success: true };
      } else {
        dispatch({ type: 'SWITCH_ROLE_FAILURE', payload: result.message });
        return { success: false, error: result.message };
      }
    } catch (error) {
      const errorMessage = error.message || 'Failed to switch role';
      dispatch({ type: 'SWITCH_ROLE_FAILURE', payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  };

  const clearSwitchError = () => {
    dispatch({ type: 'CLEAR_SWITCH_ERROR' });
  };

  const clearRole = () => {
    storage.removeCurrentRole();
    dispatch({ type: 'SET_ROLE', payload: null });
  };

  const value = {
    ...state,
    setRole,
    setAvailableRoles,
    setCanSwitchRole,
    switchRole,
    clearSwitchError,
    clearRole
  };

  return (
    <RoleContext.Provider value={value}>
      {children}
    </RoleContext.Provider>
  );
};

export const useRole = () => {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
};
