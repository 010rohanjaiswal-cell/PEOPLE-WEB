// Local storage utilities for web app

export const storage = {
  // Auth related
  setAuthToken: (token) => {
    localStorage.setItem('authToken', token);
    // Dispatch custom event to notify AuthContext
    window.dispatchEvent(new CustomEvent('userDataUpdated'));
  },
  
  getAuthToken: () => {
    return localStorage.getItem('authToken');
  },
  
  removeAuthToken: () => {
    localStorage.removeItem('authToken');
  },
  
  // User data
  setUserData: (userData) => {
    localStorage.setItem('userData', JSON.stringify(userData));
    // Dispatch custom event to notify AuthContext
    window.dispatchEvent(new CustomEvent('userDataUpdated'));
  },
  
  getUserData: () => {
    const userData = localStorage.getItem('userData');
    return userData ? JSON.parse(userData) : null;
  },
  
  removeUserData: () => {
    localStorage.removeItem('userData');
  },
  
  // Role management
  setCurrentRole: (role) => {
    localStorage.setItem('currentRole', role);
  },
  
  getCurrentRole: () => {
    return localStorage.getItem('currentRole');
  },
  
  removeCurrentRole: () => {
    localStorage.removeItem('currentRole');
  },
  
  // Verification status
  setVerificationStatus: (status) => {
    localStorage.setItem('verificationStatus', status);
  },
  
  getVerificationStatus: () => {
    return localStorage.getItem('verificationStatus');
  },
  
  removeVerificationStatus: () => {
    localStorage.removeItem('verificationStatus');
  },
  
  // Clear all data
  clearAll: () => {
    localStorage.clear();
  }
};
