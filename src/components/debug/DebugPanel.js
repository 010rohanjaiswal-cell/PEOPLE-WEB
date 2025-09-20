import React, { useState } from 'react';
import { Button } from '../common/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../common/Card';
import debugService from '../../api/debugService';
import paymentService from '../../api/paymentService';
import { Bug, RefreshCw, Trash2, Plus, CreditCard, CheckCircle, Wallet, ExternalLink } from 'lucide-react';

const DebugPanel = () => {
  const [debugInfo, setDebugInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [paymentTestResult, setPaymentTestResult] = useState(null);
  const [paymentFlowSteps, setPaymentFlowSteps] = useState([]);
  const [currentPaymentOrderId, setCurrentPaymentOrderId] = useState(null);

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

  // Step 1: Create UPI Payment Request
  const step1CreatePayment = async () => {
    try {
      setLoading(true);
      setError('');
      setPaymentFlowSteps([]);
      
      const debugResult = await debugService.getDebugInfo();
      const jobs = debugResult.debug.jobsStore.allJobs;
      
      if (!jobs || jobs.length === 0) {
        setError('No jobs available for testing. Please add a test job first.');
        return;
      }
      
      const testJob = jobs[0];
      console.log('🔄 Step 1: Creating UPI payment for job:', testJob);
      
      const result = await paymentService.createUPIPayment(testJob.id);
      
      const step = {
        step: 1,
        name: 'Create UPI Payment Request',
        status: result.success ? 'success' : 'error',
        data: {
          jobId: testJob.id,
          jobTitle: testJob.title,
          result: result
        },
        timestamp: new Date().toISOString()
      };
      
      setPaymentFlowSteps([step]);
      
      if (result.success) {
        setCurrentPaymentOrderId(result.orderId);
        setError('');
        console.log('✅ Step 1 completed:', result);
      } else {
        setError(`Step 1 failed: ${result.message || result.error}`);
      }
      
    } catch (error) {
      console.error('Step 1 error:', error);
      setError(`Step 1 error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Simulate Payment Gateway (Open Payment URL)
  const step2OpenPaymentGateway = () => {
    if (!currentPaymentOrderId) {
      setError('No payment order ID available. Please complete Step 1 first.');
      return;
    }
    
    const step = {
      step: 2,
      name: 'Open Payment Gateway',
      status: 'info',
      data: {
        orderId: currentPaymentOrderId,
        message: 'Payment gateway would open here in real flow'
      },
      timestamp: new Date().toISOString()
    };
    
    setPaymentFlowSteps(prev => [...prev, step]);
    setError('');
    
    // In a real scenario, this would open the payment gateway
    console.log('🔄 Step 2: Payment gateway would open for order:', currentPaymentOrderId);
  };

  // Step 3: Simulate Payment Confirmation
  const step3SimulatePaymentConfirmation = () => {
    if (!currentPaymentOrderId) {
      setError('No payment order ID available. Please complete Step 1 first.');
      return;
    }
    
    const step = {
      step: 3,
      name: 'Payment Confirmation',
      status: 'success',
      data: {
        orderId: currentPaymentOrderId,
        paymentStatus: 'SUCCESS',
        message: 'Payment confirmed (simulated)'
      },
      timestamp: new Date().toISOString()
    };
    
    setPaymentFlowSteps(prev => [...prev, step]);
    setError('');
    
    console.log('🔄 Step 3: Payment confirmed for order:', currentPaymentOrderId);
  };

  // Step 4: Verify Payment and Credit Wallet
  const step4VerifyAndCreditWallet = async () => {
    if (!currentPaymentOrderId) {
      setError('No payment order ID available. Please complete Step 1 first.');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      console.log('🔄 Step 4: Verifying payment and crediting wallet for order:', currentPaymentOrderId);
      
      // Simulate payment verification
      const verificationResult = {
        success: true,
        data: {
          state: 'SUCCESS',
          orderId: currentPaymentOrderId,
          amount: 500,
          freelancerAmount: 450
        }
      };
      
      const step = {
        step: 4,
        name: 'Verify Payment & Credit Wallet',
        status: verificationResult.success ? 'success' : 'error',
        data: {
          orderId: currentPaymentOrderId,
          verificationResult: verificationResult,
          walletCredited: verificationResult.success ? '₹450 (90% of ₹500)' : 'Failed'
        },
        timestamp: new Date().toISOString()
      };
      
      setPaymentFlowSteps(prev => [...prev, step]);
      
      if (verificationResult.success) {
        setError('');
        console.log('✅ Step 4 completed: Wallet credited');
      } else {
        setError('Step 4 failed: Payment verification failed');
      }
      
    } catch (error) {
      console.error('Step 4 error:', error);
      setError(`Step 4 error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Complete Flow Test
  const testCompletePaymentFlow = async () => {
    try {
      setLoading(true);
      setError('');
      setPaymentFlowSteps([]);
      
      console.log('🚀 Testing complete payment flow...');
      
      // Step 1: Create Payment
      await step1CreatePayment();
      if (error) return;
      
      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Step 2: Open Gateway
      step2OpenPaymentGateway();
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Step 3: Confirm Payment
      step3SimulatePaymentConfirmation();
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Step 4: Verify and Credit
      await step4VerifyAndCreditWallet();
      
      console.log('✅ Complete payment flow test finished');
      
    } catch (error) {
      console.error('Complete flow test error:', error);
      setError(`Complete flow test error: ${error.message}`);
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

        {/* Payment Flow Testing Section */}
        <div className="border-t pt-4">
          <h4 className="font-semibold text-orange-800 mb-3">Payment Flow Testing</h4>
          <div className="flex flex-wrap gap-2">
            <Button 
              onClick={step1CreatePayment} 
              variant="outline" 
              size="sm"
              loading={loading}
              className="border-green-300 text-green-700 hover:bg-green-100"
            >
              <CreditCard className="w-4 h-4 mr-1" />
              Step 1: Create Payment
            </Button>
            
            <Button 
              onClick={step2OpenPaymentGateway} 
              variant="outline" 
              size="sm"
              className="border-blue-300 text-blue-700 hover:bg-blue-100"
            >
              <ExternalLink className="w-4 h-4 mr-1" />
              Step 2: Open Gateway
            </Button>
            
            <Button 
              onClick={step3SimulatePaymentConfirmation} 
              variant="outline" 
              size="sm"
              className="border-purple-300 text-purple-700 hover:bg-purple-100"
            >
              <CheckCircle className="w-4 h-4 mr-1" />
              Step 3: Confirm Payment
            </Button>
            
            <Button 
              onClick={step4VerifyAndCreditWallet} 
              variant="outline" 
              size="sm"
              loading={loading}
              className="border-indigo-300 text-indigo-700 hover:bg-indigo-100"
            >
              <Wallet className="w-4 h-4 mr-1" />
              Step 4: Credit Wallet
            </Button>
            
            <Button 
              onClick={testCompletePaymentFlow} 
              variant="outline" 
              size="sm"
              loading={loading}
              className="border-orange-300 text-orange-700 hover:bg-orange-100 font-semibold"
            >
              🚀 Test Complete Flow
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

        {paymentFlowSteps.length > 0 && (
          <div className="p-3 bg-green-50 border border-green-200 rounded">
            <h4 className="font-semibold text-green-800 mb-2">Payment Flow Steps</h4>
            <div className="space-y-3">
              {paymentFlowSteps.map((step, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    step.status === 'success' ? 'bg-green-500 text-white' :
                    step.status === 'error' ? 'bg-red-500 text-white' :
                    step.status === 'info' ? 'bg-blue-500 text-white' :
                    'bg-gray-500 text-white'
                  }`}>
                    {step.step}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h5 className="font-medium text-green-800">{step.name}</h5>
                      <span className={`text-xs px-2 py-1 rounded ${
                        step.status === 'success' ? 'bg-green-200 text-green-800' :
                        step.status === 'error' ? 'bg-red-200 text-red-800' :
                        step.status === 'info' ? 'bg-blue-200 text-blue-800' :
                        'bg-gray-200 text-gray-800'
                      }`}>
                        {step.status}
                      </span>
                    </div>
                    <div className="text-xs text-green-700 mt-1">
                      {new Date(step.timestamp).toLocaleTimeString()}
                    </div>
                    <div className="text-xs text-green-600 mt-2">
                      <pre className="bg-white p-2 rounded border overflow-auto max-h-20">
                        {JSON.stringify(step.data, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DebugPanel;
