import React, { useState, useEffect } from 'react';
import { adminService } from '../../api/adminService';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/common/Card';
import { Button } from '../../components/common/Button';

const VerificationDebugTool = () => {
  const [logs, setLogs] = useState([]);
  const [apiResponse, setApiResponse] = useState(null);
  const [rawResponse, setRawResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState('pending');
  const [verificationDetails, setVerificationDetails] = useState(null);

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { timestamp, message, type }]);
    console.log(`[${timestamp}] ${message}`);
  };

  const clearLogs = () => {
    setLogs([]);
    setApiResponse(null);
    setRawResponse(null);
    setError(null);
    setVerificationDetails(null);
  };

  const testVerificationAPI = async (status = 'pending') => {
    try {
      setLoading(true);
      setError(null);
      addLog(`🔍 Testing Verification API with status: ${status}`, 'info');
      
      // Make direct API call to see raw response
      const apiBaseUrl = process.env.REACT_APP_API_BASE_URL || 'https://people-web-5hqi.onrender.com/api';
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      
      addLog(`📡 API Base URL: ${apiBaseUrl}`, 'info');
      addLog(`🔑 Token present: ${token ? 'Yes' : 'No'}`, token ? 'success' : 'warning');
      
      const response = await fetch(`${apiBaseUrl}/admin/freelancer-verifications?status=${status}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      addLog(`📥 Response status: ${response.status} ${response.statusText}`, response.ok ? 'success' : 'error');
      
      const rawData = await response.json();
      setRawResponse(rawData);
      
      addLog(`📦 Raw response received`, 'success');
      addLog(`📦 Response structure: ${JSON.stringify(rawData, null, 2)}`, 'info');
      
      // Analyze raw response
      if (rawData.success && rawData.data) {
        addLog(`✅ Response success: true`, 'success');
        addLog(`📊 Data is array: ${Array.isArray(rawData.data)}`, 'info');
        addLog(`📊 Data length: ${Array.isArray(rawData.data) ? rawData.data.length : 'N/A'}`, 'info');
        
        if (Array.isArray(rawData.data) && rawData.data.length > 0) {
          const firstItem = rawData.data[0];
          addLog(`📋 First item keys: ${Object.keys(firstItem).join(', ')}`, 'info');
          addLog(`📋 First item structure: ${JSON.stringify(firstItem, null, 2)}`, 'info');
          
          // Check for missing fields
          const expectedFields = [
            '_id', 'id', 'fullName', 'phoneNumber', 'phone', 
            'verificationStatus', 'verificationDocuments', 
            'profilePhoto', 'createdAt', 'updatedAt'
          ];
          
          const missingFields = expectedFields.filter(field => {
            if (field === 'verificationDocuments') {
              return !firstItem.hasOwnProperty('verificationDocuments');
            }
            return !firstItem.hasOwnProperty(field) || firstItem[field] === null || firstItem[field] === undefined;
          });
          
          if (missingFields.length > 0) {
            addLog(`⚠️ Missing or null fields: ${missingFields.join(', ')}`, 'warning');
          } else {
            addLog(`✅ All expected fields present`, 'success');
          }
          
          // Check verificationDocuments structure
          if (firstItem.verificationDocuments) {
            addLog(`📄 verificationDocuments exists`, 'success');
            addLog(`📄 verificationDocuments keys: ${Object.keys(firstItem.verificationDocuments).join(', ')}`, 'info');
            addLog(`📄 verificationDocuments: ${JSON.stringify(firstItem.verificationDocuments, null, 2)}`, 'info');
          } else {
            addLog(`⚠️ verificationDocuments is missing or null`, 'warning');
          }
          
          // Check phoneNumber
          if (firstItem.phoneNumber) {
            addLog(`📱 phoneNumber: ${firstItem.phoneNumber}`, 'success');
          } else if (firstItem.phone) {
            addLog(`📱 phone (alternative): ${firstItem.phone}`, 'info');
          } else {
            addLog(`⚠️ phoneNumber and phone are both missing`, 'warning');
          }
          
          // Check fullName
          if (firstItem.fullName) {
            addLog(`👤 fullName: ${firstItem.fullName}`, 'success');
          } else {
            addLog(`⚠️ fullName is null or missing`, 'warning');
          }
        } else {
          addLog(`⚠️ No verifications found for status: ${status}`, 'warning');
        }
      } else {
        addLog(`❌ Response format unexpected`, 'error');
        addLog(`   success: ${rawData.success}`, 'error');
        addLog(`   data: ${rawData.data ? 'present' : 'missing'}`, 'error');
      }
      
      // Now test using adminService
      addLog(`\n🔄 Testing via adminService.getFreelancerVerifications()...`, 'info');
      const serviceResult = await adminService.getFreelancerVerifications(status);
      setApiResponse(serviceResult);
      
      addLog(`✅ Service call completed`, 'success');
      addLog(`📦 Service response: ${JSON.stringify(serviceResult, null, 2)}`, 'info');
      
      if (serviceResult.success && serviceResult.verifications) {
        addLog(`📊 Service verifications count: ${serviceResult.verifications.length}`, 'info');
        
        if (serviceResult.verifications.length > 0) {
          const firstVerification = serviceResult.verifications[0];
          addLog(`📋 First verification after mapping:`, 'info');
          addLog(`   Keys: ${Object.keys(firstVerification).join(', ')}`, 'info');
          addLog(`   Full object: ${JSON.stringify(firstVerification, null, 2)}`, 'info');
          
          // Check mapped fields
          const mappedFields = {
            fullName: firstVerification.fullName,
            phoneNumber: firstVerification.phoneNumber,
            phone: firstVerification.phone,
            dateOfBirth: firstVerification.dateOfBirth,
            gender: firstVerification.gender,
            address: firstVerification.address,
            aadhaarFront: firstVerification.aadhaarFront ? 'present' : 'missing',
            aadhaarBack: firstVerification.aadhaarBack ? 'present' : 'missing',
            panCard: firstVerification.panCard ? 'present' : 'missing'
          };
          
          addLog(`📋 Mapped fields:`, 'info');
          Object.entries(mappedFields).forEach(([key, value]) => {
            const status = value && value !== 'missing' ? 'success' : 'warning';
            addLog(`   ${key}: ${value || 'null/undefined'}`, status);
          });
        }
      }
      
    } catch (e) {
      addLog(`❌ Error: ${e.message}`, 'error');
      addLog(`   Stack: ${e.stack}`, 'error');
      setError(e.message);
      if (e.response) {
        addLog(`   Status: ${e.response.status}`, 'error');
        addLog(`   Data: ${JSON.stringify(e.response.data, null, 2)}`, 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const inspectVerification = (verification) => {
    setVerificationDetails(verification);
    addLog(`🔍 Inspecting verification: ${verification._id || verification.id}`, 'info');
    addLog(`   Full object: ${JSON.stringify(verification, null, 2)}`, 'info');
  };

  useEffect(() => {
    addLog('🚀 Verification Debug Tool initialized', 'info');
    addLog(`🌐 API Base URL: ${process.env.REACT_APP_API_BASE_URL || 'Not set'}`, 'info');
    addLog(`🌐 NODE_ENV: ${process.env.NODE_ENV}`, 'info');
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <Card className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">🔍 Verification Debug Tool</h1>
          <p className="text-gray-600">Debug and diagnose verification API issues</p>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Test Controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-4">
              <label className="text-sm font-medium">Status Filter:</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="border rounded-md px-3 py-2 text-sm"
              >
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            <div className="flex flex-wrap gap-4">
              <Button 
                onClick={() => testVerificationAPI(selectedStatus)} 
                disabled={loading} 
                className="bg-blue-600 hover:bg-blue-700"
              >
                {loading ? 'Testing...' : `Test Verification API (${selectedStatus})`}
              </Button>
              <Button onClick={clearLogs} variant="destructive">
                Clear Logs
              </Button>
            </div>
          </CardContent>
        </Card>

        {rawResponse && (
          <Card>
            <CardHeader>
              <CardTitle>Raw API Response</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-auto text-xs max-h-96">
                {JSON.stringify(rawResponse, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}

        {apiResponse && (
          <Card>
            <CardHeader>
              <CardTitle>Service Response (After Mapping)</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-gray-900 text-blue-400 p-4 rounded-lg overflow-auto text-xs max-h-96">
                {JSON.stringify(apiResponse, null, 2)}
              </pre>
              {apiResponse.verifications && apiResponse.verifications.length > 0 && (
                <div className="mt-4">
                  <Button 
                    onClick={() => inspectVerification(apiResponse.verifications[0])}
                    variant="outline"
                  >
                    Inspect First Verification
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {verificationDetails && (
          <Card>
            <CardHeader>
              <CardTitle>Verification Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                {Object.entries(verificationDetails).map(([key, value]) => (
                  <div key={key} className="flex items-start">
                    <span className="font-semibold w-32">{key}:</span>
                    <span className={`flex-1 ${
                      value === null || value === undefined || value === '' 
                        ? 'text-red-600' 
                        : 'text-gray-900'
                    }`}>
                      {value === null ? 'null' : 
                       value === undefined ? 'undefined' : 
                       typeof value === 'object' ? JSON.stringify(value, null, 2) : 
                       String(value)}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

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

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Debug Logs ({logs.length})
              <Button onClick={clearLogs} variant="outline" size="sm">Clear</Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-900 rounded-lg p-4 max-h-96 overflow-y-auto">
              {logs.length === 0 ? (
                <p className="text-gray-400 text-sm">No logs yet. Click a test button to start.</p>
              ) : (
                <div className="space-y-1 font-mono text-xs">
                  {logs.map((log, index) => (
                    <div key={index} className={`${
                      log.type === 'error' ? 'text-red-400' :
                      log.type === 'success' ? 'text-green-400' :
                      log.type === 'warning' ? 'text-yellow-400' :
                      'text-gray-300'
                    }`}>
                      <span className="text-gray-500">[{log.timestamp}]</span> {log.message}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

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
                <span className="font-semibold">API Base URL:</span> {process.env.REACT_APP_API_BASE_URL || 'Not set'}
              </div>
              <div>
                <span className="font-semibold">Window Location:</span> {window.location.href}
              </div>
              <div>
                <span className="font-semibold">Token Present:</span> {
                  localStorage.getItem('authToken') || localStorage.getItem('token') ? 'Yes' : 'No'
                }
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VerificationDebugTool;

