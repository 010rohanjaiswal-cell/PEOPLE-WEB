import React, { useState, useEffect } from 'react';
import { adminService, getAdminApiBaseUrl } from '../../api/adminService';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/common/Card';
import { Button } from '../../components/common/Button';

const DebugTool = () => {
  const [logs, setLogs] = useState([]);
  const [apiResponse, setApiResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [localStorageOverride, setLocalStorageOverride] = useState(null);
  const [correctApiUrl, setCorrectApiUrl] = useState('https://people-web-5hqi.onrender.com/api');

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { timestamp, message, type }]);
    console.log(`[${timestamp}] ${message}`);
  };

  // Check for localStorage override on mount
  useEffect(() => {
    try {
      const override = localStorage.getItem('apiBaseUrlOverride');
      if (override) {
        setLocalStorageOverride(override);
        addLog(`⚠️ localStorage override detected: ${override}`, 'warning');
        addLog('⚠️ This is overriding the default API URL!', 'warning');
      } else {
        addLog('✅ No localStorage override found', 'success');
      }
    } catch (e) {
      addLog(`⚠️ Could not check localStorage: ${e.message}`, 'warning');
    }
    
    // Get the actual API URL being used
    const actualUrl = getAdminApiBaseUrl();
    addLog(`🌐 Current API Base URL: ${actualUrl}`, 'info');
    addLog(`🌐 Expected API Base URL: ${correctApiUrl}`, 'info');
    
    if (actualUrl !== correctApiUrl) {
      addLog(`❌ API URL mismatch! Current: ${actualUrl}`, 'error');
      addLog(`❌ Expected: ${correctApiUrl}`, 'error');
    } else {
      addLog('✅ API URL is correct!', 'success');
    }
  }, []);

  const clearLocalStorageOverride = () => {
    try {
      localStorage.removeItem('apiBaseUrlOverride');
      setLocalStorageOverride(null);
      addLog('✅ Cleared localStorage API override', 'success');
      addLog('🔄 Please reload the page to see the updated API URL', 'info');
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (e) {
      addLog(`❌ Error clearing localStorage: ${e.message}`, 'error');
    }
  };

  const setCorrectApiUrlOverride = () => {
    try {
      localStorage.setItem('apiBaseUrlOverride', correctApiUrl);
      setLocalStorageOverride(correctApiUrl);
      addLog(`✅ Set localStorage override to: ${correctApiUrl}`, 'success');
      addLog('🔄 Please reload the page to use the new API URL', 'info');
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (e) {
      addLog(`❌ Error setting localStorage: ${e.message}`, 'error');
    }
  };

  const testSearchUsersAPI = async () => {
    try {
      setLoading(true);
      setError(null);
      addLog('🔍 Starting Search Users API test...', 'info');
      
      const currentUrl = getAdminApiBaseUrl();
      addLog(`📡 Using API URL: ${currentUrl}`, 'info');
      addLog('📡 Calling adminService.searchUsers("")...', 'info');
      const startTime = Date.now();
      
      const result = await adminService.searchUsers('');
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      addLog(`✅ API call completed in ${duration}ms`, 'success');
      addLog(`📥 Response received: ${JSON.stringify(result, null, 2)}`, 'info');
      
      setApiResponse(result);
      
      // Analyze response
      if (result && result.success) {
        if (Array.isArray(result.data)) {
          addLog(`⚠️ Response data is an ARRAY with ${result.data.length} items`, 'warning');
          addLog('⚠️ Expected format: {clients: [], freelancers: [], total: 0}', 'warning');
        } else if (result.data && typeof result.data === 'object') {
          const { clients, freelancers, total } = result.data;
          addLog(`✅ Response format is CORRECT (object)`, 'success');
          addLog(`   Clients: ${clients?.length || 0}`, 'info');
          addLog(`   Freelancers: ${freelancers?.length || 0}`, 'info');
          addLog(`   Total: ${total || 0}`, 'info');
          
          if (total === 0) {
            addLog('⚠️ Total is 0 - no users found!', 'warning');
          }
        } else {
          addLog(`❌ Unexpected data format: ${typeof result.data}`, 'error');
        }
      } else {
        addLog(`❌ API returned error: ${result?.message || result?.error || 'Unknown error'}`, 'error');
      }
    } catch (err) {
      addLog(`❌ Error: ${err.message}`, 'error');
      addLog(`   Stack: ${err.stack}`, 'error');
      setError(err.message);
      
      if (err.response) {
        addLog(`   Status: ${err.response.status}`, 'error');
        addLog(`   Data: ${JSON.stringify(err.response.data, null, 2)}`, 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const clearLogs = () => {
    setLogs([]);
    setApiResponse(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">🔧 Frontend Debug Tool</h1>
          <p className="text-gray-600">Test and debug the Search Users API functionality</p>
        </div>

        {/* API URL Fix Section */}
        {localStorageOverride && (
          <Card className="border-yellow-500 bg-yellow-50">
            <CardHeader>
              <CardTitle className="text-yellow-800">⚠️ API URL Override Detected</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-white p-4 rounded-lg border border-yellow-300">
                <p className="text-sm text-gray-700 mb-2">
                  <strong>Current Override:</strong> <code className="bg-gray-100 px-2 py-1 rounded">{localStorageOverride}</code>
                </p>
                <p className="text-sm text-gray-700 mb-2">
                  <strong>Expected URL:</strong> <code className="bg-gray-100 px-2 py-1 rounded">{correctApiUrl}</code>
                </p>
                <p className="text-sm text-yellow-800 mb-4">
                  A localStorage override is forcing the old API URL. Clear it to use the correct URL.
                </p>
                <div className="flex gap-3">
                  <Button 
                    onClick={clearLocalStorageOverride}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Clear Override & Reload
                  </Button>
                  <Button 
                    onClick={setCorrectApiUrlOverride}
                    variant="outline"
                    className="border-green-600 text-green-700 hover:bg-green-50"
                  >
                    Set Correct URL & Reload
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Test Controls */}
        <Card>
          <CardHeader>
            <CardTitle>Test Controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-4">
              <Button 
                onClick={testSearchUsersAPI}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {loading ? 'Testing...' : 'Test Search Users API (All Users)'}
              </Button>
              
              <Button 
                onClick={() => {
                  const currentUrl = getAdminApiBaseUrl();
                  addLog(`🌐 Current API Base URL: ${currentUrl}`, 'info');
                  addLog(`🌐 Expected API Base URL: ${correctApiUrl}`, 'info');
                  addLog(`🌐 NODE_ENV: ${process.env.NODE_ENV}`, 'info');
                  addLog(`🌐 Window Location: ${window.location.href}`, 'info');
                  
                  try {
                    const override = localStorage.getItem('apiBaseUrlOverride');
                    if (override) {
                      addLog(`⚠️ localStorage override: ${override}`, 'warning');
                    } else {
                      addLog('✅ No localStorage override', 'success');
                    }
                  } catch (e) {
                    addLog(`⚠️ Could not check localStorage: ${e.message}`, 'warning');
                  }
                }}
                variant="outline"
              >
                Check API Config
              </Button>
              
              <Button 
                onClick={clearLogs}
                variant="destructive"
              >
                Clear Logs
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* API Response */}
        {apiResponse && (
          <Card>
            <CardHeader>
              <CardTitle>API Response</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-auto text-xs">
                {JSON.stringify(apiResponse, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}

        {/* Error Display */}
        {error && (
          <Card className="border-red-500">
            <CardHeader>
              <CardTitle className="text-red-600">Error</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-red-600">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Debug Logs */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Debug Logs ({logs.length})</CardTitle>
              <Button 
                onClick={clearLogs}
                variant="outline"
                size="sm"
              >
                Clear
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-900 rounded-lg p-4 max-h-96 overflow-y-auto">
              {logs.length === 0 ? (
                <p className="text-gray-400 text-sm">No logs yet. Click a test button to start.</p>
              ) : (
                <div className="space-y-1 font-mono text-xs">
                  {logs.map((log, index) => (
                    <div 
                      key={index}
                      className={
                        log.type === 'error' ? 'text-red-400' :
                        log.type === 'success' ? 'text-green-400' :
                        log.type === 'warning' ? 'text-yellow-400' :
                        'text-gray-300'
                      }
                    >
                      <span className="text-gray-500">[{log.timestamp}]</span> {log.message}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Environment Information */}
        <Card>
          <CardHeader>
            <CardTitle>Environment Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-semibold">NODE_ENV:</span> {process.env.NODE_ENV}
              </div>
              <div>
                <span className="font-semibold">API Base URL:</span> {getAdminApiBaseUrl()}
              </div>
              <div>
                <span className="font-semibold">Window Location:</span> {window.location.href}
              </div>
              <div>
                <span className="font-semibold">LocalStorage Override:</span> {localStorageOverride || 'None'}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DebugTool;
