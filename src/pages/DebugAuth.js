import React from 'react';
import { useAuth } from '../context/AuthContext';
import { storage } from '../utils/storage';

const DebugAuth = () => {
  const { isAuthenticated, user, token, loading } = useAuth();

  const clearAllData = () => {
    storage.clearAll();
    window.location.reload();
  };

  const checkStorage = () => {
    const token = storage.getAuthToken();
    const userData = storage.getUserData();
    const role = storage.getCurrentRole();
    
    console.log('🔍 Storage Check:');
    console.log('Token:', token);
    console.log('User Data:', userData);
    console.log('Role:', role);
  };

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Authentication Debug</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* AuthContext State */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">AuthContext State</h2>
            <div className="space-y-2">
              <p><strong>Loading:</strong> {loading ? 'Yes' : 'No'}</p>
              <p><strong>Authenticated:</strong> {isAuthenticated ? 'Yes' : 'No'}</p>
              <p><strong>Token:</strong> {token ? 'Present' : 'Missing'}</p>
              <p><strong>User:</strong> {user ? 'Present' : 'Missing'}</p>
              {user && (
                <div className="mt-4">
                  <p><strong>User ID:</strong> {user.id}</p>
                  <p><strong>Phone:</strong> {user.phone}</p>
                  <p><strong>Role:</strong> {user.role}</p>
                  <p><strong>Full Name:</strong> {user.fullName || 'Not set'}</p>
                  <p><strong>Profile Setup:</strong> {user.profileSetupCompleted ? 'Completed' : 'Not completed'}</p>
                </div>
              )}
            </div>
          </div>

          {/* Storage State */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Storage State</h2>
            <div className="space-y-2">
              <p><strong>Token:</strong> {storage.getAuthToken() ? 'Present' : 'Missing'}</p>
              <p><strong>User Data:</strong> {storage.getUserData() ? 'Present' : 'Missing'}</p>
              <p><strong>Current Role:</strong> {storage.getCurrentRole() || 'Not set'}</p>
            </div>
            <button
              onClick={checkStorage}
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Check Storage (Console)
            </button>
          </div>

          {/* Actions */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Actions</h2>
            <div className="space-y-3">
              <button
                onClick={clearAllData}
                className="w-full bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              >
                Clear All Data & Reload
              </button>
              <button
                onClick={() => window.location.href = '/login'}
                className="w-full bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
              >
                Go to Login
              </button>
              <button
                onClick={() => window.location.href = '/client/dashboard'}
                className="w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              >
                Test Client Dashboard
              </button>
            </div>
          </div>

          {/* Raw Data */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Raw Data</h2>
            <pre className="text-xs bg-white p-3 rounded border overflow-auto max-h-64">
              {JSON.stringify({ isAuthenticated, user, token, loading }, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DebugAuth;
