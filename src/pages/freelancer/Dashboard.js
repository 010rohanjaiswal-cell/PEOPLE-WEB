import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRole } from '../../context/RoleContext';
import { authService } from '../../api/authService';
import { freelancerService } from '../../api/freelancerService';
import { Button } from '../../components/common/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/common/Card';
import { Input } from '../../components/common/Input';
import { Label } from '../../components/common/Label';
import { 
  Briefcase, 
  Wallet, 
  User, 
  LogOut, 
  DollarSign,
  Clock,
  MapPin,
  Star,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Eye,
  XCircle
} from 'lucide-react';

const FreelancerDashboard = () => {
  const { user, logout } = useAuth();
  const { switchRole, canSwitchRole, switchError } = useRole();
  const [activeTab, setActiveTab] = useState('available-jobs');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [availableJobs, setAvailableJobs] = useState([]);
  const [assignedJobs, setAssignedJobs] = useState([]);
  const [walletBalance, setWalletBalance] = useState(0);
  const [walletTransactions, setWalletTransactions] = useState([]);
  const [freelancerId, setFreelancerId] = useState(null);
  const [offerModal, setOfferModal] = useState({ open: false, jobId: null, amount: '', message: '' });
  const [offerCooldowns, setOfferCooldowns] = useState({});

  // Check cooldown status for all jobs when component loads
  useEffect(() => {
    const checkAllCooldowns = async () => {
      if (availableJobs.length > 0) {
        for (const job of availableJobs) {
          try {
            const cooldownStatus = await freelancerService.checkCooldownStatus(job.id);
            if (cooldownStatus.success && !cooldownStatus.canMakeOffer) {
              setOfferCooldowns(prev => ({
                ...prev,
                [job.id]: cooldownStatus.remainingMs
              }));
            }
          } catch (error) {
            console.error('Error checking cooldown for job:', job.id, error);
          }
        }
      }
    };

    checkAllCooldowns();
  }, [availableJobs]);

  useEffect(() => {
    const interval = setInterval(() => {
      setOfferCooldowns(prev => {
        const next = { ...prev };
        let changed = false;
        for (const key in next) {
          if (Object.prototype.hasOwnProperty.call(next, key)) {
            if (next[key] > 0) {
              next[key] = Math.max(0, next[key] - 1000);
              changed = true;
            }
          }
        }
        return changed ? next : prev;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);
  const [withdrawalForm, setWithdrawalForm] = useState({
    amount: '',
    upiId: ''
  });

  useEffect(() => {
    loadFreelancerData();
  }, []);

  const loadFreelancerData = async () => {
    try {
      setLoading(true);
      const [jobsRes, assignedRes, walletRes] = await Promise.all([
        freelancerService.getAvailableJobs(),
        freelancerService.getAssignedJobs(),
        freelancerService.getWallet()
      ]);
      
      setAvailableJobs(jobsRes.jobs || []);
      setAssignedJobs(assignedRes.jobs || []);
      setWalletBalance(walletRes.data?.balance || 0);
      setFreelancerId(walletRes.data?.freelancerId || null);
      setWalletTransactions(walletRes.data?.transactions || []);
    } catch (error) {
      console.error('Error loading freelancer data:', error);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleJobPickup = async (jobId) => {
    try {
      setLoading(true);
      const result = await freelancerService.pickupJob(jobId);
      if (result.success) {
        loadFreelancerData(); // Refresh data
      } else {
        setError(result.message || 'Failed to pickup job');
      }
    } catch (error) {
      console.error('Error picking up job:', error);
      setError(error.message || 'Failed to pickup job');
    } finally {
      setLoading(false);
    }
  };

  const handleMakeOffer = async (jobId, offerAmount, message) => {
    try {
      setLoading(true);
      const result = await freelancerService.makeOffer(jobId, { amount: offerAmount, message });
      if (result.success) {
        loadFreelancerData(); // Refresh data
        // Start 5m cooldown on success
        setOfferCooldowns(prev => ({ ...prev, [jobId]: 5 * 60 * 1000 }));
      } else {
        setError(result.message || 'Failed to make offer');
      }
    } catch (error) {
      console.error('Error making offer:', error);
      const retryAfterMs = error?.retryAfterMs || error?.data?.retryAfterMs || error?.response?.data?.retryAfterMs;
      if (retryAfterMs) {
        setOfferCooldowns(prev => ({ ...prev, [jobId]: retryAfterMs }));
      }
      setError((error.response?.data?.message) || error.message || 'Failed to make offer');
    } finally {
      setLoading(false);
    }
  };

  const handleJobComplete = async (jobId) => {
    try {
      setLoading(true);
      const result = await freelancerService.markJobComplete(jobId);
      if (result.success) {
        loadFreelancerData(); // Refresh data
      } else {
        setError(result.message || 'Failed to mark job complete');
      }
    } catch (error) {
      console.error('Error completing job:', error);
      setError(error.message || 'Failed to complete job');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdrawal = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const result = await freelancerService.requestWithdrawal(withdrawalForm);
      if (result.success) {
        setWithdrawalForm({ amount: '', upiId: '' });
        loadFreelancerData(); // Refresh data
        setError('');
      } else {
        setError(result.message || 'Withdrawal request failed');
      }
    } catch (error) {
      console.error('Error requesting withdrawal:', error);
      setError(error.message || 'Withdrawal request failed');
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

    const result = await switchRole('client', authService);
    if (!result.success) {
      setError(result.error);
    }
  };

  const tabs = [
    { id: 'available-jobs', label: 'Available Jobs', icon: Briefcase },
    { id: 'assigned-jobs', label: 'My Jobs', icon: CheckCircle },
    { id: 'wallet', label: 'Wallet', icon: Wallet },
    { id: 'profile', label: 'Profile', icon: User }
  ];

  const renderAvailableJobs = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Available Jobs</h2>
        <Button onClick={loadFreelancerData} variant="outline">
          Refresh
        </Button>
      </div>
      
      {availableJobs.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Briefcase className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">No available jobs found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {availableJobs.map(job => {
            console.log('🔍 Job data:', job); // Debug log
            return (
            <Card key={job.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{job.title}</CardTitle>
                  <span className="text-sm text-muted-foreground">
                    {job.category}
                  </span>
                </div>
                <CardDescription>{job.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 mb-6">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-4">
                      <span className="flex items-center">
                        ₹{job.budget}
                      </span>
                      {job.gender && (
                        <span className="flex items-center">
                          <User className="w-4 h-4 mr-1" />
                          Gender: {job.gender}
                        </span>
                      )}
                      <span className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        Posted: {job.createdAt ? new Date(job.createdAt).toLocaleDateString() : 'Recently'}
                      </span>
                    </div>
                  </div>
                  
                  {job.address && (
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="w-4 h-4 mr-2" />
                      <span>{job.address}</span>
                      {job.pincode && <span className="ml-2">- {job.pincode}</span>}
                    </div>
                  )}
                </div>
                
                <div className="flex space-x-2">
                  <Button 
                    size="sm" 
                    onClick={() => handleJobPickup(job.id)}
                    disabled={loading}
                  >
                    Pickup Job
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setOfferModal({ open: true, jobId: job.id, amount: '', message: '' })}
                    disabled={loading || (offerCooldowns[job.id] > 0)}
                  >
                    {offerCooldowns[job.id] > 0 ? `${Math.ceil((offerCooldowns[job.id] || 0) / 60000)}m` : 'Make Offer'}
                  </Button>
                  <Button size="sm" variant="ghost">
                    <Eye className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
            );
          })}
        </div>
      )}
    </div>
  );

  const renderAssignedJobs = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">My Assigned Jobs</h2>
        <Button onClick={loadFreelancerData} variant="outline">
          Refresh
        </Button>
      </div>
      
      {assignedJobs.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <CheckCircle className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">No assigned jobs found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {assignedJobs.map(job => (
            <Card key={job.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{job.title}</CardTitle>
                  <span className={`text-sm px-2 py-1 rounded ${
                    job.status === 'in_progress' 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {job.status}
                  </span>
                </div>
                <CardDescription>{job.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm mb-4">
                  <div className="flex items-center space-x-4">
                    <span className="flex items-center">
                      <DollarSign className="w-4 h-4 mr-1" />
                      ₹{job.budget}
                    </span>
                    <span className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      Due: {new Date(job.deadline).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                
                {job.status === 'in_progress' && (
                  <Button 
                    onClick={() => handleJobComplete(job.id)}
                    disabled={loading}
                  >
                    Mark as Complete
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  const renderWallet = () => (
    <div className="space-y-6">
      {/* Wallet Balance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Wallet className="w-5 h-5 mr-2" />
            Wallet Balance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-green-600">
            ₹{walletBalance.toLocaleString()}
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Available for withdrawal
          </p>
        </CardContent>
      </Card>

      {/* Withdrawal Form */}
      <Card>
        <CardHeader>
          <CardTitle>Request Withdrawal</CardTitle>
          <CardDescription>
            Withdraw your earnings to your UPI account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleWithdrawal} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (₹)</Label>
                <Input
                  id="amount"
                  type="number"
                  value={withdrawalForm.amount}
                  onChange={(e) => setWithdrawalForm({...withdrawalForm, amount: e.target.value})}
                  placeholder="100"
                  min="100"
                  max={walletBalance}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="upiId">UPI ID</Label>
                <Input
                  id="upiId"
                  type="text"
                  value={withdrawalForm.upiId}
                  onChange={(e) => setWithdrawalForm({...withdrawalForm, upiId: e.target.value})}
                  placeholder="yourname@paytm"
                  required
                />
              </div>
            </div>
            <Button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg" 
              loading={loading}
              disabled={!withdrawalForm.amount || !withdrawalForm.upiId || loading}
            >
              Request Withdrawal
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {walletTransactions.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              No transactions yet
            </p>
          ) : (
            <div className="space-y-3">
              {walletTransactions.slice(0, 5).map(transaction => (
                <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div>
                    <p className="font-medium">{transaction.description}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(transaction.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className={`font-semibold ${
                    transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {transaction.type === 'credit' ? '+' : '-'}₹{transaction.amount}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
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
              {freelancerId && (
                <p className="text-xs text-blue-600 mt-1">Freelancer ID: <span className="font-mono font-semibold">{freelancerId}</span></p>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label>Current Role</Label>
              <p className="text-sm text-muted-foreground">Freelancer</p>
            </div>

            <div>
              <Label>Switch Role</Label>
              <div className="flex items-center space-x-2 mt-2">
                <Button 
                  variant="outline" 
                  onClick={handleRoleSwitch}
                  disabled={!canSwitchRole}
                >
                  Switch to Client
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
              <div className="flex items-center space-x-2">
                <Wallet className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-600">
                  ₹{walletBalance.toLocaleString()}
                </span>
              </div>
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
        {activeTab === 'available-jobs' && renderAvailableJobs()}
        {activeTab === 'assigned-jobs' && renderAssignedJobs()}
        {activeTab === 'wallet' && renderWallet()}
        {activeTab === 'profile' && renderProfile()}
      </div>

      {/* Make Offer Modal */}
      {offerModal.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setOfferModal({ open: false, jobId: null, amount: '', message: '' })}>
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold">Make an Offer</h3>
              <button className="text-gray-500 hover:text-gray-700" onClick={() => setOfferModal({ open: false, jobId: null, amount: '', message: '' })}>
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="offerAmount">Offer Amount (₹)</Label>
                <Input
                  id="offerAmount"
                  type="number"
                  min="1"
                  placeholder="e.g., 500"
                  value={offerModal.amount}
                  onChange={(e) => setOfferModal(prev => ({ ...prev, amount: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="offerMessage">Message (optional)</Label>
                <textarea
                  id="offerMessage"
                  placeholder="Write a brief message to the client (optional)"
                  className="flex min-h-[90px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={offerModal.message}
                  onChange={(e) => setOfferModal(prev => ({ ...prev, message: e.target.value }))}
                />
              </div>
            </div>
            <div className="p-6 border-t flex items-center justify-end space-x-2">
              <Button variant="outline" onClick={() => setOfferModal({ open: false, jobId: null, amount: '', message: '' })}>Cancel</Button>
              <Button
                onClick={async () => {
                  const amt = parseFloat(offerModal.amount);
                  if (!amt || isNaN(amt) || amt <= 0) return;
                  await handleMakeOffer(offerModal.jobId, amt, offerModal.message);
                  setOfferModal({ open: false, jobId: null, amount: '', message: '' });
                }}
                disabled={loading || !offerModal.amount}
              >
                Submit Offer
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FreelancerDashboard;
