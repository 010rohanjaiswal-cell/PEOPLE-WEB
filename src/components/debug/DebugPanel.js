import React, { useState } from 'react';
import { Button } from '../common/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../common/Card';
import debugService from '../../api/debugService';
import paymentService from '../../api/paymentService';
import { Bug, RefreshCw, Trash2, Plus, CreditCard } from 'lucide-react';

const DebugPanel = () => {
  const [debugInfo, setDebugInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [paymentTestResult, setPaymentTestResult] = useState(null);

  const loadDebugInfo = async () => {
    try {
      setLoading(true);
      setError('');
      const result = await debugService.getDebugInfo();
      setDebugInfo(result.debug);
      console.log('🐛 Debug Info:', result.debug);
    } catch (error) {
      console.error('Debug error:', error);
      setError(error.message || 'Failed to load debug info');
    } finally {
      setLoading(false);
    }
  };

  const clearJobs = async () => {
    try {
      setLoading(true);
      setError('');
      const result = await debugService.clearJobs();
      console.log('🗑️ Clear jobs result:', result);
      await loadDebugInfo(); // Refresh debug info
    } catch (error) {
      console.error('Clear jobs error:', error);
      setError(error.message || 'Failed to clear jobs');
    } finally {
      setLoading(false);
    }
  };

  const addTestJob = async () => {
    try {
      setLoading(true);
      setError('');
      const result = await debugService.addTestJob();
      console.log('➕ Add test job result:', result);
      await loadDebugInfo(); // Refresh debug info
    } catch (error) {
      console.error('Add test job error:', error);
      setError(error.message || 'Failed to add test job');
    } finally {
      setLoading(false);
    }
  };

  const testUPIPayment = async () => {
    try {
      setLoading(true);
      setError('');
      
      // First, get available jobs
      const debugResult = await debugService.getDebugInfo();
      const jobs = debugResult.debug.jobsStore.allJobs;
      
      if (!jobs || jobs.length === 0) {
        setError('No jobs available for testing. Please add a test job first.');
        return;
      }
      
      // Use the first available job
      const testJob = jobs[0];
      console.log('🧪 Testing UPI payment for job:', testJob);
      
      // Test the payment service directly
      const result = await paymentService.createUPIPayment(testJob.id);
      console.log('💳 Debug UPI payment result:', result);
      
      // Store the result for display
      setPaymentTestResult({
        jobId: testJob.id,
        jobTitle: testJob.title,
        result: result,
        timestamp: new Date().toISOString()
      });
      
      if (result.success) {
        setError(''); // Clear any previous errors
        console.log('✅ Debug UPI payment successful:', result);
      } else {
        setError(`UPI payment failed: ${result.message || result.error}`);
      }
      
    } catch (error) {
      console.error('Debug UPI payment error:', error);
      setError(`Debug UPI payment error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardHeader>
        <CardTitle className="flex items-center text-orange-800">
          <Bug className="w-5 h-5 mr-2" />
          Debug Panel
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="p-3 bg-red-100 border border-red-300 rounded text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <Button 
            onClick={loadDebugInfo} 
            variant="outline" 
            size="sm"
            loading={loading}
            className="border-orange-300 text-orange-700 hover:bg-orange-100"
          >
            <RefreshCw className="w-4 h-4 mr-1" />
            Load Debug Info
          </Button>
          
          <Button 
            onClick={addTestJob} 
            variant="outline" 
            size="sm"
            loading={loading}
            className="border-green-300 text-green-700 hover:bg-green-100"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Test Job
          </Button>
          
          <Button 
            onClick={clearJobs} 
            variant="outline" 
            size="sm"
            loading={loading}
            className="border-red-300 text-red-700 hover:bg-red-100"
          >
            <Trash2 className="w-4 h-4 mr-1" />
            Clear All Jobs
          </Button>
          
          <Button 
            onClick={testUPIPayment} 
            variant="outline" 
            size="sm"
            loading={loading}
            className="border-blue-300 text-blue-700 hover:bg-blue-100"
          >
            <CreditCard className="w-4 h-4 mr-1" />
            Test UPI Payment
          </Button>
        </div>

        {debugInfo && (
          <div className="space-y-4">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded">
              <h4 className="font-semibold text-blue-800 mb-2">User Info</h4>
              <div className="text-sm text-blue-700">
                <p><strong>Client ID:</strong> {debugInfo.user.clientId}</p>
                <p><strong>Raw User:</strong> {JSON.stringify(debugInfo.user.raw, null, 2)}</p>
              </div>
            </div>

            <div className="p-3 bg-green-50 border border-green-200 rounded">
              <h4 className="font-semibold text-green-800 mb-2">Jobs Store</h4>
              <div className="text-sm text-green-700">
                <p><strong>Total Jobs:</strong> {debugInfo.jobsStore.totalJobs}</p>
                <div className="mt-2">
                  <strong>All Jobs:</strong>
                  <pre className="mt-1 text-xs bg-white p-2 rounded border overflow-auto max-h-32">
                    {JSON.stringify(debugInfo.jobsStore.allJobs, null, 2)}
                  </pre>
                </div>
              </div>
            </div>

            <div className="p-3 bg-purple-50 border border-purple-200 rounded">
              <h4 className="font-semibold text-purple-800 mb-2">Filtered Jobs</h4>
              <div className="text-sm text-purple-700 space-y-2">
                <div>
                  <strong>My Active Jobs:</strong> {debugInfo.filteredJobs.myActiveJobs.length}
                  {debugInfo.filteredJobs.myActiveJobs.length > 0 && (
                    <pre className="mt-1 text-xs bg-white p-2 rounded border overflow-auto max-h-20">
                      {JSON.stringify(debugInfo.filteredJobs.myActiveJobs, null, 2)}
                    </pre>
                  )}
                </div>
                <div>
                  <strong>My Completed Jobs:</strong> {debugInfo.filteredJobs.myCompletedJobs.length}
                </div>
                <div>
                  <strong>Other Jobs:</strong> {debugInfo.filteredJobs.otherJobs.length}
                </div>
              </div>
            </div>

            {debugInfo.filteringDebug && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                <h4 className="font-semibold text-yellow-800 mb-2">Filtering Debug</h4>
                <div className="text-sm text-yellow-700 space-y-2">
                  <div>
                    <strong>Client ID Type:</strong> {debugInfo.filteringDebug.clientIdType}
                  </div>
                  <div>
                    <strong>Client ID Value:</strong> {debugInfo.filteringDebug.clientIdValue}
                  </div>
                  <div>
                    <strong>Job Client IDs:</strong>
                    <pre className="mt-1 text-xs bg-white p-2 rounded border overflow-auto max-h-20">
                      {JSON.stringify(debugInfo.filteringDebug.jobClientIds, null, 2)}
                    </pre>
                  </div>
                  <div>
                    <strong>Comparison Results:</strong>
                    <pre className="mt-1 text-xs bg-white p-2 rounded border overflow-auto max-h-32">
                      {JSON.stringify(debugInfo.filteringDebug.comparisonResults, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {paymentTestResult && (
          <div className="p-3 bg-indigo-50 border border-indigo-200 rounded">
            <h4 className="font-semibold text-indigo-800 mb-2">Payment Test Results</h4>
            <div className="text-sm text-indigo-700 space-y-2">
              <div>
                <strong>Job ID:</strong> {paymentTestResult.jobId}
              </div>
              <div>
                <strong>Job Title:</strong> {paymentTestResult.jobTitle}
              </div>
              <div>
                <strong>Timestamp:</strong> {new Date(paymentTestResult.timestamp).toLocaleString()}
              </div>
              <div>
                <strong>Result:</strong>
                <pre className="mt-1 text-xs bg-white p-2 rounded border overflow-auto max-h-32">
                  {JSON.stringify(paymentTestResult.result, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DebugPanel;
