import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { Input } from '../../components/common/Input';
import { Label } from '../../components/common/Label';
import paymentService from '../../api/paymentService';
import { clientService } from '../../api/clientService';
import { freelancerService } from '../../api/freelancerService';

const PaymentDebug = () => {
  const { user, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [debugInfo, setDebugInfo] = useState(null);
  const [testJobId, setTestJobId] = useState('');
  const [testAmount, setTestAmount] = useState(1000);
  const [paymentResults, setPaymentResults] = useState(null);
  const [jobData, setJobData] = useState(null);
  const [availableJobs, setAvailableJobs] = useState([]);

  // Load debug info on component mount
  useEffect(() => {
    loadDebugInfo();
    loadAvailableJobs();
  }, []);

  const loadDebugInfo = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch('https://freelancing-platform-backend-backup.onrender.com/api/payment-debug');
      const data = await response.json();
      
      if (data.success) {
        setDebugInfo(data.debugInfo);
        setSuccess('Debug info loaded successfully');
      } else {
        setError(data.message || 'Failed to load debug info');
      }
    } catch (error) {
      console.error('Error loading debug info:', error);
      setError('Failed to load debug info: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const testPaymentService = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      const response = await fetch(`https://freelancing-platform-backend-backup.onrender.com/api/payment-test/${testJobId || 'test-job'}`);
      const data = await response.json();
      
      if (data.success) {
        setPaymentResults(data.debugInfo);
        setSuccess('Payment service test completed');
      } else {
        setError(data.message || 'Payment service test failed');
      }
    } catch (error) {
      console.error('Error testing payment service:', error);
      setError('Payment service test failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const testUPIPayment = async () => {
    if (!testJobId) {
      setError('Please enter a job ID to test');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      console.log('🧪 Testing UPI payment for job:', testJobId);
      
      // Use debug endpoint that doesn't require authentication
      const response = await fetch(`https://freelancing-platform-backend-backup.onrender.com/api/debug-payment-test/${testJobId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const result = await response.json();
      console.log('🧪 UPI payment test result:', result);
      
      if (result.success) {
        setSuccess('UPI payment test successful! Payment URL generated.');
        setPaymentResults(prev => ({
          ...prev,
          upiTest: {
            success: true,
            paymentUrl: result.paymentUrl,
            orderId: result.orderId,
            amounts: result.amounts
          }
        }));
        
        // Show commission breakdown
        if (result.amounts) {
          const breakdown = `
Commission Breakdown:
• Total Amount: ₹${result.amounts.totalAmount}
• Commission (10%): ₹${result.amounts.commission}
• Freelancer Amount (90%): ₹${result.amounts.freelancerAmount}
          `;
          setSuccess(prev => prev + '\n\n' + breakdown);
        }
      } else {
        setError('UPI payment test failed: ' + (result.message || 'Unknown error'));
        setPaymentResults(prev => ({
          ...prev,
          upiTest: {
            success: false,
            error: result.message || result.error
          }
        }));
      }
    } catch (error) {
      console.error('Error testing UPI payment:', error);
      setError('UPI payment test failed: ' + error.message);
      setPaymentResults(prev => ({
        ...prev,
        upiTest: {
          success: false,
          error: error.message
        }
      }));
    } finally {
      setLoading(false);
    }
  };

  const testPaymentGateway = async () => {
    if (!paymentResults?.upiTest?.paymentUrl) {
      setError('Please run UPI payment test first to get payment URL');
      return;
    }

    try {
      setSuccess('Opening payment gateway window...');
      
      const paymentWindow = window.open(
        paymentResults.upiTest.paymentUrl, 
        '_blank', 
        'width=800,height=600,scrollbars=yes,resizable=yes'
      );
      
      if (paymentWindow) {
        setSuccess('Payment gateway window opened successfully!');
        
        // Monitor window
        const checkClosed = setInterval(() => {
          if (paymentWindow.closed) {
            clearInterval(checkClosed);
            setSuccess('Payment gateway window closed. Check payment status.');
          }
        }, 1000);
      } else {
        setError('Failed to open payment gateway window. Popup may be blocked.');
      }
    } catch (error) {
      console.error('Error opening payment gateway:', error);
      setError('Failed to open payment gateway: ' + error.message);
    }
  };

  const testCommissionCalculation = () => {
    const amounts = {
      totalAmount: testAmount,
      commission: Math.round(testAmount * 0.1),
      freelancerAmount: testAmount - Math.round(testAmount * 0.1)
    };
    
    setPaymentResults(prev => ({
      ...prev,
      commissionTest: {
        success: true,
        amounts: amounts,
        breakdown: {
          totalAmount: `₹${amounts.totalAmount}`,
          commission: `₹${amounts.commission} (10%)`,
          freelancerAmount: `₹${amounts.freelancerAmount} (90%)`
        }
      }
    }));
    
    setSuccess(`Commission calculation test completed for ₹${testAmount}`);
  };

  const loadJobData = async () => {
    if (!testJobId) {
      setError('Please enter a job ID');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      // Try to get job from client service
      const clientJobs = await clientService.getActiveJobs();
      const job = clientJobs.find(j => j.id === testJobId);
      
      if (job) {
        setJobData(job);
        setSuccess('Job data loaded successfully');
      } else {
        setError('Job not found in client jobs');
      }
    } catch (error) {
      console.error('Error loading job data:', error);
      setError('Failed to load job data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const testJobStatusFlow = () => {
    const statusFlow = [
      { status: 'open', description: 'Job posted, waiting for freelancers' },
      { status: 'assigned', description: 'Job assigned to freelancer' },
      { status: 'work_done', description: 'Freelancer marked work as done' },
      { status: 'completed', description: 'Client paid, freelancer received payment' },
      { status: 'fully_completed', description: 'Freelancer confirmed completion' }
    ];
    
    setPaymentResults(prev => ({
      ...prev,
      statusFlow: {
        success: true,
        flow: statusFlow,
        currentStatus: jobData?.status || 'unknown'
      }
    }));
    
    setSuccess('Job status flow test completed');
  };

  const loadAvailableJobs = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch('https://freelancing-platform-backend-backup.onrender.com/api/debug-jobs');
      const data = await response.json();
      
      if (data.success) {
        setAvailableJobs(data.jobs || []);
        setSuccess(`Loaded ${data.totalJobs} available jobs`);
      } else {
        setError(data.message || 'Failed to load jobs');
      }
    } catch (error) {
      console.error('Error loading available jobs:', error);
      setError('Failed to load available jobs: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const selectJobForTesting = (jobId) => {
    setTestJobId(jobId);
    setSuccess(`Selected job ${jobId} for testing`);
  };

  const createTestJobs = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      const response = await fetch('https://freelancing-platform-backend-backup.onrender.com/api/debug-create-jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess(`Created ${data.jobs.length} test jobs successfully!`);
        // Refresh the jobs list
        loadAvailableJobs();
      } else {
        setError(data.message || 'Failed to create test jobs');
      }
    } catch (error) {
      console.error('Error creating test jobs:', error);
      setError('Failed to create test jobs: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Payment Debug Tool</h2>
            <p className="text-gray-600">Please log in to access the payment debug tool.</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Debug Tool</h1>
          <p className="text-gray-600">Test and debug payment functionality, UPI integration, and commission calculations.</p>
        </div>

        {/* Debug Info */}
        <Card className="mb-6">
          <h2 className="text-xl font-semibold mb-4">System Debug Info</h2>
          <div className="flex space-x-4 mb-4">
            <Button onClick={loadDebugInfo} disabled={loading}>
              {loading ? 'Loading...' : 'Refresh Debug Info'}
            </Button>
          </div>
          
          {debugInfo && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Dependencies:</h3>
              <ul className="space-y-1 text-sm">
                <li>Axios: {debugInfo.dependencies?.axios?.available ? '✅ Available' : '❌ Missing'}</li>
                <li>Crypto-JS: {debugInfo.dependencies?.cryptoJs?.available ? '✅ Available' : '❌ Missing'}</li>
              </ul>
              
              <h3 className="font-semibold mb-2 mt-4">Services:</h3>
              <ul className="space-y-1 text-sm">
                <li>Payment Service: {debugInfo.services?.paymentService?.available ? '✅ Available' : '❌ Missing'}</li>
                <li>Payment Controller: {debugInfo.services?.paymentController?.available ? '✅ Available' : '❌ Missing'}</li>
              </ul>
              
              <h3 className="font-semibold mb-2 mt-4">Environment:</h3>
              <ul className="space-y-1 text-sm">
                <li>NODE_ENV: {debugInfo.environment?.NODE_ENV || 'Not set'}</li>
                <li>PAYMENT_REDIRECT_URL: {debugInfo.environment?.PAYMENT_REDIRECT_URL || 'Not set'}</li>
              </ul>
            </div>
          )}
        </Card>

        {/* Available Jobs */}
        <Card className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Available Jobs</h2>
          <div className="flex space-x-4 mb-4">
            <Button onClick={loadAvailableJobs} disabled={loading}>
              {loading ? 'Loading...' : 'Refresh Jobs'}
            </Button>
            <Button onClick={createTestJobs} disabled={loading} className="bg-green-600 hover:bg-green-700">
              {loading ? 'Creating...' : 'Create Test Jobs (₹10 each)'}
            </Button>
          </div>
          
          {availableJobs.length > 0 ? (
            <div className="space-y-2">
              <p className="text-sm text-gray-600">Click on a job to select it for testing:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {availableJobs.map((job) => (
                  <div
                    key={job.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      testJobId === job.id 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => selectJobForTesting(job.id)}
                  >
                    <div className="font-medium text-sm">{job.title}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      ID: {job.id}
                    </div>
                    <div className="text-xs text-gray-500">
                      Status: <span className={`font-medium ${
                        job.status === 'work_done' ? 'text-orange-600' :
                        job.status === 'assigned' ? 'text-blue-600' :
                        job.status === 'open' ? 'text-green-600' :
                        'text-gray-600'
                      }`}>{job.status}</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      Budget: ₹{job.budget}
                    </div>
                    {job.assignedFreelancer && (
                      <div className="text-xs text-gray-500">
                        Assigned to: {job.assignedFreelancer.name}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No jobs available. Create a job first to test payment functionality.</p>
            </div>
          )}
        </Card>

        {/* Test Configuration */}
        <Card className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Configuration</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="testJobId">Test Job ID</Label>
              <Input
                id="testJobId"
                value={testJobId}
                onChange={(e) => setTestJobId(e.target.value)}
                placeholder="Enter job ID to test"
              />
              {testJobId && (
                <p className="text-xs text-gray-500 mt-1">
                  Selected: {testJobId}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="testAmount">Test Amount (₹)</Label>
              <Input
                id="testAmount"
                type="number"
                value={testAmount}
                onChange={(e) => setTestAmount(Number(e.target.value))}
                placeholder="Enter test amount"
              />
            </div>
          </div>
        </Card>

        {/* Payment Tests */}
        <Card className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Payment Tests</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Button onClick={testPaymentService} disabled={loading}>
              Test Payment Service
            </Button>
            <Button onClick={testUPIPayment} disabled={loading || !testJobId}>
              Test UPI Payment
            </Button>
            <Button onClick={testPaymentGateway} disabled={!paymentResults?.upiTest?.paymentUrl}>
              Test Payment Gateway
            </Button>
            <Button onClick={testCommissionCalculation} disabled={loading}>
              Test Commission Calculation
            </Button>
            <Button onClick={loadJobData} disabled={loading || !testJobId}>
              Load Job Data
            </Button>
            <Button onClick={testJobStatusFlow} disabled={!jobData}>
              Test Job Status Flow
            </Button>
          </div>
        </Card>

        {/* Results */}
        {(error || success) && (
          <Card className="mb-6">
            <h2 className="text-xl font-semibold mb-4">Results</h2>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                <strong>Error:</strong> {error}
              </div>
            )}
            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
                <strong>Success:</strong> 
                <pre className="whitespace-pre-wrap mt-2">{success}</pre>
              </div>
            )}
          </Card>
        )}

        {/* Payment Results */}
        {paymentResults && (
          <Card>
            <h2 className="text-xl font-semibold mb-4">Test Results</h2>
            <div className="space-y-4">
              {paymentResults.upiTest && (
                <div className="bg-gray-50 p-4 rounded">
                  <h3 className="font-semibold">UPI Payment Test:</h3>
                  <pre className="text-sm mt-2">{JSON.stringify(paymentResults.upiTest, null, 2)}</pre>
                </div>
              )}
              
              {paymentResults.commissionTest && (
                <div className="bg-gray-50 p-4 rounded">
                  <h3 className="font-semibold">Commission Calculation Test:</h3>
                  <pre className="text-sm mt-2">{JSON.stringify(paymentResults.commissionTest, null, 2)}</pre>
                </div>
              )}
              
              {paymentResults.statusFlow && (
                <div className="bg-gray-50 p-4 rounded">
                  <h3 className="font-semibold">Job Status Flow:</h3>
                  <pre className="text-sm mt-2">{JSON.stringify(paymentResults.statusFlow, null, 2)}</pre>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Job Data */}
        {jobData && (
          <Card className="mt-6">
            <h2 className="text-xl font-semibold mb-4">Job Data</h2>
            <div className="bg-gray-50 p-4 rounded">
              <pre className="text-sm">{JSON.stringify(jobData, null, 2)}</pre>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default PaymentDebug;
