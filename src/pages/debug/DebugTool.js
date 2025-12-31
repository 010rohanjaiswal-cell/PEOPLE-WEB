import React, { useState, useEffect } from 'react';
import { adminService } from '../../api/adminService';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/common/Card';
import { Button } from '../../components/common/Button';

const DebugTool = () => {
  const [logs, setLogs] = useState([]);
  const [apiResponse, setApiResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { timestamp, message, type }]);
    console.log(`[${timestamp}] ${message}`);
  };

  const testSearchUsersAPI = async () => {
    try {
      setLoading(true);
      setError(null);
      addLog('🔍 Starting Search Users API test...', 'info');
      
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
      
      // Log error details
      if (err.response) {
        addLog(`   Status: ${err.response.status}`, 'error');
        addLog(`   Data: ${JSON.stringify(err.response.data, null, 2)}`, 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const testWithPhoneNumber = async (phoneNumber) => {
    try {
      setLoading(true);
      setError(null);
      addLog(`🔍 Testing search with phone number: "${phoneNumber}"`, 'info');
      
      const result = await adminService.searchUsers(phoneNumber);
      setApiResponse(result);
      
      addLog(`📥 Response: ${JSON.stringify(result, null, 2)}`, 'info');
      
    } catch (err) {
      addLog(`❌ Error: ${err.message}`, 'error');
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const clearLogs = () => {
    setLogs([]);
    setApiResponse(null);
    setError(null);
  };

  const checkAPIBaseURL = () => {
    // Get the actual API base URL from adminService
    const apiUrl = process.env.REACT_APP_API_BASE_URL || 'https://freelancing-platform-backend-backup.onrender.com/api';
    addLog(`🌐 API Base URL: ${apiUrl}`, 'info');
    addLog(`🌐 Full Search Users URL: ${apiUrl}/admin/search-users`, 'info');
    addLog(`🌐 NODE_ENV: ${process.env.NODE_ENV}`, 'info');
    addLog(`🌐 Window Location: ${window.location.href}`, 'info');
    
    // Check if we can access adminService's API URL
    try {
      const adminServiceUrl = adminService.searchUsers.toString();
      addLog(`🔍 adminService.searchUsers function found`, 'info');
    } catch (e) {
      addLog(`⚠️ Could not inspect adminService: ${e.message}`, 'warning');
    }
  };

  useEffect(() => {
    addLog('🚀 Debug Tool initialized', 'info');
    checkAPIBaseURL();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">🔧 Frontend Debug Tool</h1>
          <p className="text-gray-600">Test and debug the Search Users API functionality</p>
        </div>

        {/* Control Panel */}
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
                onClick={() => testWithPhoneNumber('+919292929292')} 
                disabled={loading}
                variant="outline"
              >
                Test with Phone: +919292929292
              </Button>
              
              <Button 
                onClick={() => testWithPhoneNumber('+919009009000')} 
                disabled={loading}
                variant="outline"
              >
                Test with Phone: +919009009000
              </Button>
              
              <Button 
                onClick={checkAPIBaseURL} 
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

        {/* Logs */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Debug Logs ({logs.length})</CardTitle>
              <Button onClick={clearLogs} variant="outline" size="sm">
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
                      className={`${
                        log.type === 'error' ? 'text-red-400' :
                        log.type === 'success' ? 'text-green-400' :
                        log.type === 'warning' ? 'text-yellow-400' :
                        'text-gray-300'
                      }`}
                    >
                      <span className="text-gray-500">[{log.timestamp}]</span> {log.message}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Environment Info */}
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
                <span className="font-semibold">API Base URL:</span> {process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api'}
              </div>
              <div>
                <span className="font-semibold">Window Location:</span> {window.location.href}
              </div>
              <div>
                <span className="font-semibold">User Agent:</span> {navigator.userAgent.substring(0, 50)}...
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Network Monitor */}
        <Card>
          <CardHeader>
            <CardTitle>Network Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              Open browser DevTools (F12) → Network tab to see all API requests
            </p>
            <p className="text-sm text-gray-600 mt-2">
              Check Console tab for detailed logs
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DebugTool;

