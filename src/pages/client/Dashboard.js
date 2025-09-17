import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRole } from '../../context/RoleContext';
import { authService } from '../../api/authService';
import { clientService } from '../../api/clientService';
import { userService } from '../../api/userService';
import paymentService from '../../api/paymentService';
import { Button } from '../../components/common/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/common/Card';
import { Input } from '../../components/common/Input';
import { Label } from '../../components/common/Label';
import DebugPanel from '../../components/debug/DebugPanel';
import { 
  Plus, 
  Briefcase, 
  History, 
  User, 
  LogOut, 
  Clock,
  Users,
  AlertCircle,
  Bug,
  Trash2,
  Edit
} from 'lucide-react';

const ClientDashboard = () => {
  const { user, logout } = useAuth();
  const { switchRole, canSwitchRole, switchError } = useRole();
  const [activeTab, setActiveTab] = useState('post-job');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeJobs, setActiveJobs] = useState([]);
  const [jobHistory, setJobHistory] = useState([]);
  const [activeJobOffers, setActiveJobOffers] = useState(null);
  const [editJobModal, setEditJobModal] = useState({ open: false, job: null });
  const [viewProfileModal, setViewProfileModal] = useState({ open: false, data: null });

  // Job posting form state
  const [jobForm, setJobForm] = useState({
    title: '',
    address: '',
    pincode: '',
    budget: '',
    category: '',
    gender: '',
    description: ''
  });

  useEffect(() => {
    loadClientData();
  }, []);

  const loadClientData = async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading client data...');
      console.log('👤 Current user:', user);
      
      const [activeJobsRes, historyRes] = await Promise.all([
        clientService.getActiveJobs(),
        clientService.getJobHistory()
      ]);
      
      console.log('📋 Active jobs response:', activeJobsRes);
      console.log('📋 History response:', historyRes);
      
      setActiveJobs(activeJobsRes.jobs || []);
      setJobHistory(historyRes.jobs || []);
      
      console.log('✅ Set activeJobs:', activeJobsRes.jobs || []);
      console.log('✅ Set jobHistory:', historyRes.jobs || []);
    } catch (error) {
      console.error('❌ Error loading client data:', error);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleJobSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Frontend validation
      const budgetNum = Number(jobForm.budget);
      if (Number.isNaN(budgetNum) || budgetNum < 10) {
        setError('Budget must be at least ₹10');
        setLoading(false);
        return;
      }
      if (!/^\d{6}$/.test(String(jobForm.pincode).trim())) {
        setError('Please enter a valid 6-digit pincode');
        setLoading(false);
        return;
      }

      const result = await clientService.postJob(jobForm);
      if (result.success) {
        setJobForm({
          title: '',
          address: '',
          pincode: '',
          budget: '',
          category: '',
          gender: '',
          description: ''
        });
        setActiveTab('my-jobs');
        loadClientData(); // Refresh data
      } else {
        setError(result.message || 'Failed to post job');
      }
    } catch (error) {
      console.error('Error posting job:', error);
      setError(error.message || 'Failed to post job');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
      logout();
    } catch (error) {
      console.error('Logout error:', error);
      logout(); // Force logout even if API fails
    }
  };

  const handleDeleteJob = async (jobId) => {
    if (!window.confirm('Are you sure you want to delete this job? This action cannot be undone.')) {
      return;
    }

    try {
      setLoading(true);
      setError('');
      const result = await clientService.deleteJob(jobId);
      if (result.success) {
        // Refresh the jobs list
        await loadClientData();
        setError('');
      } else {
        setError(result.message || 'Failed to delete job');
      }
    } catch (error) {
      console.error('Error deleting job:', error);
      setError(error.message || 'Failed to delete job');
    } finally {
      setLoading(false);
    }
  };

  const canDeleteJob = (job) => {
    // Can delete if job is still open and no offers have been accepted
    if (job.status !== 'open') return false;
    
    // Check if any offers have been accepted
    const hasAcceptedOffers = Array.isArray(job.offers) && 
      job.offers.some(offer => offer.status === 'accepted');
    
    return !hasAcceptedOffers;
  };

  const canEditJob = (job) => {
    // Can edit if job is still open and no offers have been accepted
    if (job.status !== 'open') return false;
    
    // Check if any offers have been accepted
    const hasAcceptedOffers = Array.isArray(job.offers) && 
      job.offers.some(offer => offer.status === 'accepted');
    
    return !hasAcceptedOffers;
  };

  const handleEditJob = (job) => {
    setEditJobModal({ open: true, job });
  };

  const handleUpdateJob = async (jobId, updatedJobData) => {
    try {
      setLoading(true);
      setError('');
      const result = await clientService.updateJob(jobId, updatedJobData);
      if (result.success) {
        // Refresh the jobs list
        await loadClientData();
        setEditJobModal({ open: false, job: null });
        setError('');
      } else {
        setError(result.message || 'Failed to update job');
      }
    } catch (error) {
      console.error('Error updating job:', error);
      setError(error.message || 'Failed to update job');
    } finally {
      setLoading(false);
    }
  };

  const openViewFreelancer = async (freelancerUserId) => {
    try {
      setLoading(true);
      setError('');
      const res = await userService.getPublicProfile(freelancerUserId);
      if (res.success) {
        setViewProfileModal({ open: true, data: res.data });
      } else {
        setError(res.message || 'Failed to load profile');
      }
    } catch (err) {
      console.error('Error loading profile:', err);
      setError(err.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async (jobId, paymentMethod) => {
    if (paymentMethod === 'cash') {
      // Handle cash payment (existing logic)
      if (!window.confirm('Are you sure you want to pay for this job via cash? This will complete the job.')) {
        return;
      }

      try {
        setLoading(true);
        setError('');
        const result = await clientService.payJob(jobId, paymentMethod);
        if (result.success) {
          console.log('✅ Cash payment processed successfully:', result.job);
          await loadClientData(); // Refresh data
          setError('');
        } else {
          setError(result.message || 'Failed to process payment');
        }
      } catch (error) {
        console.error('Error processing cash payment:', error);
        setError(error.message || 'Failed to process payment');
      } finally {
        setLoading(false);
      }
    } else if (paymentMethod === 'upi') {
      // Handle UPI payment (new logic)
      handleUPIPayment(jobId);
    }
  };

  const handleUPIPayment = async (jobId) => {
    try {
      setLoading(true);
      setError('');
      
      // Create UPI payment request
      const result = await paymentService.createUPIPayment(jobId);
      
      if (result.success) {
        console.log('✅ UPI payment request created:', result);
        
        // Show commission breakdown
        const commissionBreakdown = `
Payment Details:
• Total Amount: ₹${result.amounts.totalAmount}
• Commission (10%): ₹${result.amounts.commission}
• Freelancer Amount (90%): ₹${result.amounts.freelancerAmount}

You will be redirected to the payment gateway.`;
        
        if (window.confirm(commissionBreakdown + '\n\nProceed to payment?')) {
          // Open payment gateway in new window
          const paymentWindow = window.open(result.paymentUrl, '_blank', 'width=800,height=600');
          
          // Start polling for payment status
          pollPaymentStatus(jobId, result.orderId);
        }
      } else {
        setError(result.message || 'Failed to create payment request');
      }
    } catch (error) {
      console.error('Error creating UPI payment:', error);
      setError(error.message || 'Failed to create payment request');
    } finally {
      setLoading(false);
    }
  };

  const pollPaymentStatus = async (jobId, orderId) => {
    const maxAttempts = 30; // 5 minutes with 10-second intervals
    let attempts = 0;
    
    const checkStatus = async () => {
      try {
        attempts++;
        const result = await paymentService.verifyUPIPayment(orderId);
        
        if (result.success && result.isSuccess) {
          console.log('✅ Payment completed successfully');
          await loadClientData(); // Refresh data
          setError('');
          return;
        }
        
        if (attempts < maxAttempts) {
          setTimeout(checkStatus, 10000); // Check again in 10 seconds
        } else {
          console.log('⏰ Payment status check timeout');
          setError('Payment verification timeout. Please check your payment status manually.');
        }
      } catch (error) {
        console.error('Error checking payment status:', error);
        if (attempts < maxAttempts) {
          setTimeout(checkStatus, 10000);
        } else {
          setError('Failed to verify payment status');
        }
      }
    };
    
    // Start checking after 5 seconds
    setTimeout(checkStatus, 5000);
  };

  const handleAcceptOffer = async (jobId, freelancerId) => {
    if (!window.confirm('Are you sure you want to accept this offer? This will assign the job to the freelancer.')) {
      return;
    }

    try {
      setLoading(true);
      setError('');
      const result = await clientService.acceptOffer(jobId, freelancerId);
      if (result.success) {
        // Refresh the jobs list and close offers modal
        await loadClientData();
        setActiveJobOffers(null);
        setError('');
      } else {
        setError(result.message || 'Failed to accept offer');
      }
    } catch (error) {
      console.error('Error accepting offer:', error);
      setError(error.message || 'Failed to accept offer');
    } finally {
      setLoading(false);
    }
  };

  const handleRejectOffer = async (jobId, freelancerId) => {
    if (!window.confirm('Are you sure you want to reject this offer?')) {
      return;
    }

    try {
      setLoading(true);
      setError('');
      const result = await clientService.rejectOffer(jobId, freelancerId);
      if (result.success) {
        // Refresh the jobs list and close offers modal
        await loadClientData();
        setActiveJobOffers(null);
        setError('');
      } else {
        setError(result.message || 'Failed to reject offer');
      }
    } catch (error) {
      console.error('Error rejecting offer:', error);
      setError(error.message || 'Failed to reject offer');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleSwitch = async () => {
    if (!canSwitchRole) {
      setError('You still have an active job. Complete it before switching role.');
      return;
    }

    const result = await switchRole('freelancer', authService);
    if (!result.success) {
      setError(result.error);
    }
  };

  const tabs = [
    { id: 'post-job', label: 'Post Job', icon: Plus },
    { id: 'my-jobs', label: 'My Jobs', icon: Briefcase },
    { id: 'history', label: 'History', icon: History },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'debug', label: 'Debug', icon: Bug }
  ];

  const categories = [
    'Delivery',
    'Cooking',
    'Cleaning',
    'Plumbing',
    'Electrical',
    'Mechanic',
    'Driver',
    'Care taker',
    'Tailor',
    'Barber',
    'Laundry',
    'Other'
  ];

  const renderPostJob = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Plus className="w-5 h-5 mr-2" />
            Post a New Job
          </CardTitle>
          <CardDescription>
            Describe your project and find the right freelancer
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleJobSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Job Title</Label>
                <Input
                  id="title"
                  value={jobForm.title}
                  onChange={(e) => setJobForm({...jobForm, title: e.target.value})}
                  placeholder="Enter job title"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <select
                  id="category"
                  value={jobForm.category}
                  onChange={(e) => setJobForm({...jobForm, category: e.target.value})}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  required
                >
                  <option value="">Select category</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={jobForm.address}
                  onChange={(e) => setJobForm({...jobForm, address: e.target.value})}
                  placeholder="Enter address"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pincode">Pincode</Label>
                <Input
                  id="pincode"
                  type="text"
                  value={jobForm.pincode}
                  onChange={(e) => setJobForm({...jobForm, pincode: e.target.value})}
                  placeholder="e.g., 400001"
                  pattern="\d{6}"
                  maxLength="6"
                  inputMode="numeric"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="budget">Budget (₹)</Label>
                <Input
                  id="budget"
                  type="number"
                  value={jobForm.budget}
                  onChange={(e) => setJobForm({...jobForm, budget: e.target.value})}
                  placeholder="1000"
                  min="10"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <select
                  id="gender"
                  value={jobForm.gender}
                  onChange={(e) => setJobForm({...jobForm, gender: e.target.value})}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  required
                >
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Any">Any</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Job Description (Optional)</Label>
              <textarea
                id="description"
                value={jobForm.description}
                onChange={(e) => setJobForm({...jobForm, description: e.target.value})}
                placeholder="Describe the job requirements, tasks, or any additional details..."
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                rows={3}
              />
            </div>

            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg" loading={loading}>
              Post Job
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );

  const renderMyJobs = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Active Jobs</h2>
        <Button onClick={loadClientData} variant="outline">
          Refresh
        </Button>
      </div>
      
      {activeJobs.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Briefcase className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">No active jobs found</p>
            <Button 
              onClick={() => setActiveTab('post-job')} 
              className="mt-4"
            >
              Post Your First Job
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {activeJobs.map(job => (
            <Card key={job.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{job.title}</CardTitle>
                  <span className="text-sm text-muted-foreground">
                    {job.status}
                  </span>
                </div>
                <CardDescription>
                  {job.address} {job.pincode ? `- ${job.pincode}` : ''}
                  {job.description && (
                    <div className="mt-2 text-sm text-gray-600">
                      {job.description}
                    </div>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-4">
                    <span className="flex items-center">
                      ₹{job.budget}
                    </span>
                    <span className="flex items-center">
                      <Users className="w-4 h-4 mr-1" />
                      {job.gender || 'Any'}
                    </span>
                    <span className="flex items-center">
                      <Users className="w-4 h-4 mr-1" />
                      {job.offers?.length || 0} offers
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {job.status === 'open' && (
                      <Button size="sm" variant="outline" onClick={() => setActiveJobOffers(job)}>
                        View Offers
                      </Button>
                    )}
                    {job.status === 'assigned' && job.assignedFreelancer?.id && (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => openViewFreelancer(job.assignedFreelancer.id)}
                        className="text-green-700 hover:text-green-800 hover:bg-green-50"
                      >
                        View Freelancer
                      </Button>
                    )}
                    {job.status === 'work_done' && (
                      <div className="flex space-x-2">
                        <Button 
                          size="sm" 
                          onClick={() => handlePayment(job.id, 'cash')}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Pay Cash
                        </Button>
                        <Button 
                          size="sm" 
                          onClick={() => handlePayment(job.id, 'upi')}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          Pay UPI
                        </Button>
                        {job.assignedFreelancer?.id && (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => openViewFreelancer(job.assignedFreelancer.id)}
                            className="text-green-700 hover:text-green-800 hover:bg-green-50"
                          >
                            View Freelancer
                          </Button>
                        )}
                      </div>
                    )}
                    {job.status === 'completed' && (
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-green-600 font-medium">✓ Payment Completed</span>
                        {job.assignedFreelancer?.id && (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => openViewFreelancer(job.assignedFreelancer.id)}
                            className="text-green-700 hover:text-green-800 hover:bg-green-50"
                          >
                            View Freelancer
                          </Button>
                        )}
                      </div>
                    )}
                    {canEditJob(job) && (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleEditJob(job)}
                        disabled={loading}
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    )}
                    {canDeleteJob(job) && (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleDeleteJob(job.id)}
                        disabled={loading}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  const renderHistory = () => (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Job History</h2>
      
      {jobHistory.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <History className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">No completed jobs yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {jobHistory.map(job => (
            <Card key={job.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{job.title}</CardTitle>
                  <span className="text-sm text-green-600">Completed</span>
                </div>
                <CardDescription>{job.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-4">
                    <span className="flex items-center">
                      ₹{job.budget}
                    </span>
                    <span className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      Completed on {new Date(job.completedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  const renderProfile = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile Settings</CardTitle>
          <CardDescription>
            Manage your account and preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center">
              <User className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="font-semibold">{user?.fullName}</h3>
              <p className="text-sm text-muted-foreground">{user?.phone}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label>Current Role</Label>
              <p className="text-sm text-muted-foreground">Client</p>
            </div>

            <div>
              <Label>Switch Role</Label>
              <div className="flex items-center space-x-2 mt-2">
                <Button 
                  variant="outline" 
                  onClick={handleRoleSwitch}
                  disabled={!canSwitchRole}
                >
                  Switch to Freelancer
                </Button>
                {!canSwitchRole && (
                  <AlertCircle className="w-4 h-4 text-yellow-500" />
                )}
              </div>
              {!canSwitchRole && (
                <p className="text-sm text-yellow-600 mt-1">
                  Complete your active jobs before switching roles
                </p>
              )}
            </div>

            <div>
              <Button variant="destructive" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">Freelance Platform</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Welcome, {user?.fullName}
              </span>
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-primary text-primary'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Error Display */}
        {(error || switchError) && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-md">
            <p className="text-sm text-destructive">{error || switchError}</p>
          </div>
        )}

        {/* Tab Content */}
        {activeTab === 'post-job' && renderPostJob()}
        {activeTab === 'my-jobs' && renderMyJobs()}
        {activeTab === 'history' && renderHistory()}
        {activeTab === 'profile' && renderProfile()}
        {activeTab === 'debug' && <DebugPanel />}

        {/* Offers Modal */}
        {activeJobOffers && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setActiveJobOffers(null)}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="p-6 border-b flex items-center justify-between">
                <h3 className="text-lg font-semibold">Offers for {activeJobOffers.title}</h3>
                <button className="text-gray-500 hover:text-gray-700" onClick={() => setActiveJobOffers(null)}>Close</button>
              </div>
              <div className="p-6 space-y-3 max-h-[60vh] overflow-y-auto">
                {(!activeJobOffers.offers || activeJobOffers.offers.length === 0) ? (
                  <p className="text-sm text-muted-foreground">No offers yet.</p>
                ) : (
                  activeJobOffers.offers.map((offer) => (
                    <div key={offer.id} className="p-3 border rounded-lg flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 border">
                          {offer.freelancer?.profilePhoto ? (
                            <img src={offer.freelancer.profilePhoto} alt={offer.freelancer.fullName} className="w-full h-full object-cover" />
                          ) : (
                            <User className="w-5 h-5 text-gray-500 m-2" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{offer.freelancer?.fullName || 'Freelancer'}</p>
                          {offer.freelancer?.freelancerId && (
                            <p className="text-xs text-blue-600">ID: <span className="font-mono">{offer.freelancer.freelancerId}</span></p>
                          )}
                          {offer.message && (
                            <p className="text-xs text-gray-600 mt-1">“{offer.message}”</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="font-semibold">₹{offer.amount}</span>
                        {offer.status === 'accepted' ? (
                          <span className="text-green-600 font-medium text-sm">✓ Accepted</span>
                        ) : offer.status === 'rejected' ? (
                          <span className="text-red-600 font-medium text-sm">✗ Rejected</span>
                        ) : (
                          <div className="flex space-x-2">
                            <Button size="sm" onClick={() => handleAcceptOffer(activeJobOffers.id, offer.freelancer.id)}>Accept</Button>
                            <Button size="sm" variant="outline" onClick={() => handleRejectOffer(activeJobOffers.id, offer.freelancer.id)}>Reject</Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="p-6 border-t text-right">
                <Button variant="outline" onClick={() => setActiveJobOffers(null)}>Close</Button>
              </div>
            </div>
          </div>
        )}

        {/* View Freelancer Modal */}
        {viewProfileModal.open && viewProfileModal.data && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setViewProfileModal({ open: false, data: null })}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
              <div className="p-6 border-b flex items-center justify-between">
                <h3 className="text-lg font-semibold">Freelancer Details</h3>
                <button className="text-gray-500 hover:text-gray-700" onClick={() => setViewProfileModal({ open: false, data: null })}>Close</button>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100 border">
                    {viewProfileModal.data.profilePhoto ? (
                      <img src={viewProfileModal.data.profilePhoto} alt={viewProfileModal.data.fullName} className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-7 h-7 text-gray-500 m-4" />
                    )}
                  </div>
                  <div>
                    <div className="text-lg font-semibold">{viewProfileModal.data.fullName}</div>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-3 text-sm">
                  {viewProfileModal.data.dateOfBirth && (
                    <div><span className="font-medium">DOB:</span> {new Date(viewProfileModal.data.dateOfBirth).toLocaleDateString()}</div>
                  )}
                  {viewProfileModal.data.gender && (
                    <div><span className="font-medium">Gender:</span> {viewProfileModal.data.gender}</div>
                  )}
                  {viewProfileModal.data.address && (
                    <div><span className="font-medium">Address:</span> {viewProfileModal.data.address}</div>
                  )}
                </div>
              </div>
              <div className="p-4 border-t text-right">
                <Button variant="outline" onClick={() => setViewProfileModal({ open: false, data: null })}>Close</Button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Job Modal */}
        {editJobModal.open && editJobModal.job && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setEditJobModal({ open: false, job: null })}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="p-6 border-b flex items-center justify-between">
                <h3 className="text-lg font-semibold">Edit Job: {editJobModal.job.title}</h3>
                <button className="text-gray-500 hover:text-gray-700" onClick={() => setEditJobModal({ open: false, job: null })}>Close</button>
              </div>
              <div className="p-6">
                <form onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.target);
                  const updatedJobData = {
                    title: formData.get('title'),
                    address: formData.get('address'),
                    pincode: formData.get('pincode'),
                    budget: formData.get('budget'),
                    category: formData.get('category'),
                    gender: formData.get('gender'),
                    description: formData.get('description')
                  };
                  handleUpdateJob(editJobModal.job.id, updatedJobData);
                }} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-title">Job Title</Label>
                      <Input
                        id="edit-title"
                        name="title"
                        defaultValue={editJobModal.job.title}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-category">Category</Label>
                      <select
                        id="edit-category"
                        name="category"
                        defaultValue={editJobModal.job.category}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        required
                      >
                        <option value="">Select category</option>
                        {categories.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="edit-address">Address</Label>
                    <Input
                      id="edit-address"
                      name="address"
                      defaultValue={editJobModal.job.address}
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-pincode">Pincode</Label>
                      <Input
                        id="edit-pincode"
                        name="pincode"
                        type="number"
                        defaultValue={editJobModal.job.pincode}
                        min="100000"
                        max="999999"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-budget">Budget (₹)</Label>
                      <Input
                        id="edit-budget"
                        name="budget"
                        type="number"
                        defaultValue={editJobModal.job.budget}
                        min="10"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-gender">Gender</Label>
                      <select
                        id="edit-gender"
                        name="gender"
                        defaultValue={editJobModal.job.gender}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        required
                      >
                        <option value="">Select gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Any">Any</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="edit-description">Job Description (Optional)</Label>
                    <textarea
                      id="edit-description"
                      name="description"
                      defaultValue={editJobModal.job.description || ''}
                      placeholder="Describe the job requirements, tasks, or any additional details..."
                      className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      rows={3}
                    />
                  </div>
                  
                  <div className="flex space-x-3 pt-4">
                    <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white" loading={loading}>
                      Update Job
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setEditJobModal({ open: false, job: null })}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientDashboard;
