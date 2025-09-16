import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRole } from '../../context/RoleContext';
import { authService } from '../../api/authService';
import { clientService } from '../../api/clientService';
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
  DollarSign,
  Clock,
  Users,
  AlertCircle,
  Bug
} from 'lucide-react';

const ClientDashboard = () => {
  const { user, logout } = useAuth();
  const { switchRole, canSwitchRole, switchError } = useRole();
  const [activeTab, setActiveTab] = useState('post-job');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeJobs, setActiveJobs] = useState([]);
  const [jobHistory, setJobHistory] = useState([]);

  // Job posting form state
  const [jobForm, setJobForm] = useState({
    title: '',
    address: '',
    pincode: '',
    budget: '',
    category: '',
    gender: ''
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
          gender: ''
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
                <CardDescription>{job.address} {job.pincode ? `- ${job.pincode}` : ''}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-4">
                    <span className="flex items-center">
                      <DollarSign className="w-4 h-4 mr-1" />
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
                  <Button size="sm" variant="outline">
                    View Details
                  </Button>
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
                      <DollarSign className="w-4 h-4 mr-1" />
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
      </div>
    </div>
  );
};

export default ClientDashboard;
