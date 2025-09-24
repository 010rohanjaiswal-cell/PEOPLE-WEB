import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../api/authService';
import { freelancerService } from '../../api/freelancerService';
import { userService } from '../../api/userService';
import { Button } from '../../components/common/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/common/Card';
import { Input } from '../../components/common/Input';
import { Label } from '../../components/common/Label';
import CommissionLedgerModal from '../../components/modals/CommissionLedgerModal';
import WalletContainer from '../../components/common/WalletContainer';
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
  const [activeTab, setActiveTab] = useState('available-jobs');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [availableJobs, setAvailableJobs] = useState([]);
  const [assignedJobs, setAssignedJobs] = useState([]);
  const [walletBalance, setWalletBalance] = useState(0);
  const [walletTransactions, setWalletTransactions] = useState([]);
  const [orders, setOrders] = useState([]);
  const [withdrawalHistory, setWithdrawalHistory] = useState([]);
  const [freelancerId, setFreelancerId] = useState(null);
  const [showCommissionLedger, setShowCommissionLedger] = useState(false);
  const [commissionStatus, setCommissionStatus] = useState({});
  const [canWork, setCanWork] = useState(true);
  const [workStatusMessage, setWorkStatusMessage] = useState('');
  const [offerModal, setOfferModal] = useState({ open: false, jobId: null, amount: '', message: '' });
  const [viewProfileModal, setViewProfileModal] = useState({ open: false, data: null });
  const [offerCooldowns, setOfferCooldowns] = useState({});
  // Debug: pickup logs
  const [pickupDebugLogs, setPickupDebugLogs] = useState([]);
  const [showPickupDebug, setShowPickupDebug] = useState(true);

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
      const [jobsRes, assignedRes, walletRes, ordersRes, wdRes] = await Promise.all([
        freelancerService.getAvailableJobs(),
        freelancerService.getAssignedJobs(),
        freelancerService.getWallet(),
        freelancerService.getOrders(),
        freelancerService.getWithdrawalHistory()
      ]);
      
      console.log('📋 loadFreelancerData - assignedRes:', assignedRes);
      console.log('📋 loadFreelancerData - assignedRes.data:', assignedRes.data);
      
      setAvailableJobs(jobsRes.jobs || []);
      setAssignedJobs(assignedRes.data || []);
      setWalletBalance(walletRes.data?.balance || 0);
      setFreelancerId(walletRes.data?.freelancerId || null);
      setWalletTransactions(walletRes.data?.transactions || []);
      setOrders(ordersRes.data || []);
      setWithdrawalHistory(wdRes.data || []);
      
      console.log('💰 Dashboard - wallet data:', {
        balance: walletRes.data?.balance,
        transactions: walletRes.data?.transactions,
        transactionCount: walletRes.data?.transactions?.length || 0
      });
      
      // Check commission status for completed jobs and work status
      setTimeout(() => {
        checkCommissionStatusForJobs();
        checkFreelancerWorkStatus();
      }, 100);
    } catch (error) {
      console.error('Error loading freelancer data:', error);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleJobPickup = async (jobId) => {
    if (!window.confirm('Are you sure you want to pickup this job? This will assign it directly to you.')) {
      return;
    }

    try {
      setLoading(true);
      setError('');
      const startedAt = new Date().toISOString();
      const debugEntry = {
        startedAt,
        jobId,
        userRole: 'freelancer',
        hasUser: !!user,
        hasUserId: !!user?._id || !!user?.id || !!user?.userId,
      };
      const result = await freelancerService.pickupJob(jobId);
      if (result.success) {
        console.log('✅ Job picked up successfully:', result.job);
        loadFreelancerData(); // Refresh data
        setError('');
        setPickupDebugLogs(prev => [
          {
            ...debugEntry,
            endedAt: new Date().toISOString(),
            success: true,
            serverMessage: 'picked up',
            serverStatus: 200,
            returnedJobId: result.job?.id,
            returnedStatus: result.job?.status
          },
          ...prev
        ].slice(0, 10));
      } else {
        const msg = result.message || 'Failed to pickup job';
        setError(msg);
        setPickupDebugLogs(prev => [
          {
            ...debugEntry,
            endedAt: new Date().toISOString(),
            success: false,
            serverMessage: msg,
            serverStatus: result.status || null,
          },
          ...prev
        ].slice(0, 10));
      }
    } catch (error) {
      console.error('Error picking up job:', error);
      setError(error.message || 'Failed to pickup job');
      setPickupDebugLogs(prev => [
        {
          startedAt: new Date().toISOString(),
          jobId,
          userRole: 'freelancer',
          hasUser: !!user,
          hasUserId: !!user?._id || !!user?.id || !!user?.userId,
          endedAt: new Date().toISOString(),
          success: false,
          serverMessage: error?.response?.data?.message || error.message,
          serverStatus: error?.response?.status || null,
        },
        ...prev
      ].slice(0, 10));
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
    if (!window.confirm('Are you sure you want to mark this job as work done? This will notify the client for payment.')) {
      return;
    }

    try {
      setLoading(true);
      setError('');
      const result = await freelancerService.markJobComplete(jobId);
      if (result.success) {
        console.log('✅ Job marked as work done successfully:', result.job);
        loadFreelancerData(); // Refresh data
        setError('');
      } else {
        setError(result.message || 'Failed to mark job as work done');
      }
    } catch (error) {
      console.error('Error marking job as work done:', error);
      setError(error.message || 'Failed to mark job as work done');
    } finally {
      setLoading(false);
    }
  };

  const handleJobFullyComplete = async (jobId) => {
    if (!window.confirm('Are you sure you want to mark this job as fully completed? This will remove it from your active jobs.')) {
      return;
    }

    try {
      setLoading(true);
      setError('');
      const result = await freelancerService.markJobFullyComplete(jobId);
      if (result.success) {
        console.log('✅ Job marked as fully completed successfully:', result.job);
        loadFreelancerData(); // Refresh data
        setError('');
      } else {
        setError(result.message || 'Failed to mark job as fully completed');
      }
    } catch (error) {
      console.error('Error marking job as fully completed:', error);
      setError(error.message || 'Failed to mark job as fully completed');
    } finally {
      setLoading(false);
    }
  };

  const handlePayCommission = async (entryId, amount) => {
    try {
      setLoading(true);
      setError('');
      
      // TODO: Call backend API to record commission payment
      const response = await freelancerService.payCommission(entryId, amount);
      
      if (response.success) {
        setError('');
        // Reload freelancer data to reflect the payment
        await loadFreelancerData();
        // Refresh commission status
        await checkCommissionStatusForJobs();
      } else {
        setError(response.message || 'Failed to record commission payment');
      }
    } catch (error) {
      console.error('Error recording commission payment:', error);
      setError(error.message || 'Failed to record commission payment');
    } finally {
      setLoading(false);
    }
  };

  const checkCommissionStatusForJobs = async () => {
    try {
      const statusMap = {};
      
      // Check commission status for all assigned jobs
      for (const job of assignedJobs) {
        if (job.status === 'completed') {
          try {
            const response = await freelancerService.checkCommissionStatus(job.id);
            statusMap[job.id] = response;
          } catch (error) {
            console.error(`Error checking commission status for job ${job.id}:`, error);
            statusMap[job.id] = { hasCommission: false, status: 'error' };
          }
        }
      }
      
      setCommissionStatus(statusMap);
    } catch (error) {
      console.error('Error checking commission status:', error);
    }
  };

  const checkFreelancerWorkStatus = async () => {
    if (!freelancerId) return;
    
    try {
      const response = await freelancerService.checkCanWork(freelancerId);
      setCanWork(response.canWork);
      setWorkStatusMessage(response.message);
    } catch (error) {
      console.error('Error checking freelancer work status:', error);
      setCanWork(true); // Default to allowing work if check fails
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

  const openViewClient = async (clientUserId) => {
    try {
      setLoading(true);
      setError('');
      const res = await userService.getPublicProfile(clientUserId);
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

  const handleLogout = async () => {
    // Check if freelancer has any active jobs
    const hasActiveJobs = assignedJobs.some(job => 
      job.status === 'assigned' || job.status === 'in_progress' || job.status === 'completed'
    );
    
    if (hasActiveJobs) {
      setError('You cannot logout while you have active jobs. Please complete your jobs first.');
      setTimeout(() => setError(''), 5000);
      return;
    }
    
    try {
      await authService.logout();
      logout();
    } catch (error) {
      console.error('Logout error:', error);
      logout(); // Force logout even if API fails
    }
  };

  const tabs = [
    { id: 'available-jobs', label: 'Available Jobs', icon: Briefcase },
    { id: 'assigned-jobs', label: 'My Jobs', icon: CheckCircle },
    { id: 'wallet', label: 'Wallet', icon: Wallet },
    { id: 'orders', label: 'Orders', icon: CheckCircle },
    { id: 'profile', label: 'Profile', icon: User }
  ];

  // Filters state for Available Jobs
  const [filterCategory, setFilterCategory] = useState('All');
  const [sortBy, setSortBy] = useState('newest'); // newest | oldest | price_desc | price_asc

  const renderAvailableJobs = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Available Jobs</h2>
        <Button onClick={loadFreelancerData} variant="outline">
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="md:col-span-2 flex items-center gap-3">
          <label className="text-sm text-gray-600">Category</label>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="border rounded px-3 py-2 text-sm"
          >
            {/* Build category list: All + known list + dynamic from data */}
            {(() => {
              const known = ['All','Delivery','Cooking','Cleaning','Plumbing','Electrical','Mechanic','Driver','Care taker','Tailor','Barber','Laundry','Other'];
              const dynamic = Array.from(new Set((availableJobs || []).map(j => j.category).filter(Boolean)));
              const merged = Array.from(new Set([...known, ...dynamic]));
              return merged.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ));
            })()}
          </select>
        </div>
        <div className="flex items-center gap-3 justify-start md:justify-end">
          <label className="text-sm text-gray-600">Sort</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="border rounded px-3 py-2 text-sm"
          >
            <option value="price_desc">High price → Low</option>
            <option value="price_asc">Low price → High</option>
            <option value="newest">New → Old</option>
            <option value="oldest">Old → New</option>
          </select>
        </div>
      </div>

      {/* Debug visibility marker */}
      <div className="text-xs text-blue-600">
        Debug: Pickup panel enabled
      </div>

      {/* Debug Panel */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm">Pickup Debug</CardTitle>
          <Button size="sm" variant="ghost" onClick={() => setShowPickupDebug(v => !v)}>
            {showPickupDebug ? 'Hide' : 'Show'}
          </Button>
        </CardHeader>
        {showPickupDebug && (
          <CardContent>
            {pickupDebugLogs.length === 0 ? (
              <p className="text-xs text-gray-500">No pickup attempts logged yet.</p>
            ) : (
              <div className="space-y-2">
                {pickupDebugLogs.map((log, idx) => (
                  <div key={idx} className={`p-2 rounded border text-xs ${log.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                    <div className="flex flex-wrap gap-2">
                      <span><strong>job.id</strong>: {log.jobId}</span>
                      <span><strong>user?</strong>: {String(log.hasUser)}</span>
                      <span><strong>hasUserId?</strong>: {String(log.hasUserId)}</span>
                      <span><strong>status</strong>: {log.serverStatus ?? 'n/a'}</span>
                      <span><strong>ok</strong>: {String(!!log.success)}</span>
                    </div>
                    {log.serverMessage && (
                      <div className="mt-1 text-gray-700 break-all">
                        <strong>message</strong>: {log.serverMessage}
                      </div>
                    )}
                    <div className="mt-1 text-gray-500">
                      <span>{log.startedAt}</span>
                      {log.endedAt && <span> → {log.endedAt}</span>}
                    </div>
                    {log.returnedJobId && (
                      <div className="mt-1 text-gray-700">
                        <strong>returnedJobId</strong>: {log.returnedJobId} | <strong>returnedStatus</strong>: {log.returnedStatus}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        )}
      </Card>
      
      {availableJobs.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Briefcase className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">No available jobs found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {(() => {
            // Apply category filter
            let list = availableJobs.slice();
            if (filterCategory && filterCategory !== 'All') {
              list = list.filter(j => (j.category || '') === filterCategory);
            }

            // Apply sort
            list.sort((a, b) => {
              const aPrice = Number(a.budget) || 0;
              const bPrice = Number(b.budget) || 0;
              const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
              const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
              if (sortBy === 'price_desc') return bPrice - aPrice;
              if (sortBy === 'price_asc') return aPrice - bPrice;
              if (sortBy === 'oldest') return aTime - bTime;
              // default newest
              return bTime - aTime;
            });

            return list.map(job => {
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
                    disabled={loading || !canWork}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="w-4 h-4 mr-1" />
                    {!canWork ? 'Pay Commission First' : 'Pickup Job'}
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setOfferModal({ open: true, jobId: job.id, amount: '', message: '' })}
                    disabled={loading || (offerCooldowns[job.id] > 0) || !canWork}
                  >
                    {!canWork ? 'Pay Commission First' : 
                     offerCooldowns[job.id] > 0 ? `${Math.ceil((offerCooldowns[job.id] || 0) / 60000)}m` : 'Make Offer'}
                  </Button>
                  <Button size="sm" variant="ghost">
                    <Eye className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
            );
            });
          })()}
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
                <CardDescription>
                  {job.description || 'No description provided'}
                </CardDescription>
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
                        Assigned: {job.assignedAt ? new Date(job.assignedAt).toLocaleDateString() : 'Recently'}
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
                
                {job.status === 'assigned' && (
                  <div className="flex space-x-2">
                    <Button 
                      onClick={() => handleJobComplete(job.id)}
                      disabled={loading}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Work Done
                    </Button>
                    {job.clientId && (
                      <Button 
                        variant="outline"
                        onClick={() => openViewClient(job.clientId)}
                      >
                        View Client
                      </Button>
                    )}
                  </div>
                )}
                {job.status === 'work_done' && (
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center text-orange-600">
                      <Clock className="w-4 h-4 mr-1 animate-spin" />
                      <span className="text-sm font-medium">Waiting for Payment</span>
                    </div>
                    {job.clientId && (
                      <Button 
                        variant="outline"
                        onClick={() => openViewClient(job.clientId)}
                      >
                        View Client
                      </Button>
                    )}
                  </div>
                )}
                {job.status === 'completed' && (
                  <div className="flex space-x-2">
                    {commissionStatus[job.id]?.hasCommission && commissionStatus[job.id]?.status === 'pending' ? (
                      <div className="flex items-center text-orange-600">
                        <Clock className="w-4 h-4 mr-1 animate-spin" />
                        <span className="text-sm font-medium">Pay Commission to Complete</span>
                      </div>
                    ) : (
                      <Button 
                        onClick={() => handleJobFullyComplete(job.id)}
                        disabled={loading}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Completed
                      </Button>
                    )}
                    {job.clientId && (
                      <Button 
                        variant="outline"
                        onClick={() => openViewClient(job.clientId)}
                      >
                        View Client
                      </Button>
                    )}
                  </div>
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
      <WalletContainer 
        user={user} 
        onRefresh={loadFreelancerData} 
        balance={walletBalance} 
        transactions={walletTransactions}
        withdrawals={withdrawalHistory}
      />
    </div>
  );

  const renderOrders = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Orders</h2>
        <Button onClick={loadFreelancerData} variant="outline">Refresh</Button>
      </div>
      {orders.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <CheckCircle className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">No orders yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {orders.map(job => (
            <Card key={job.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{job.title}</CardTitle>
                  <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded">{job.status}</span>
                </div>
                <CardDescription>{job.description || 'No description provided'}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-4">
                    <span>₹{job.budget}</span>
                    {job.paidAt && <span>Paid: {new Date(job.paidAt).toLocaleDateString()}</span>}
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
            <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center overflow-hidden">
              {user?.profilePhoto ? (
                <img 
                  src={user.profilePhoto} 
                  alt={user.fullName} 
                  className="w-full h-full object-cover" 
                />
              ) : (
                <User className="w-8 h-8 text-white" />
              )}
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
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center overflow-hidden">
                {user?.profilePhoto ? (
                  <img 
                    src={user.profilePhoto} 
                    alt={user.fullName} 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <User className="w-4 h-4 text-white" />
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Commission Threshold Warning */}
      {!canWork && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Commission Threshold Reached
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{workStatusMessage}</p>
                  <p className="mt-1">
                    Please pay your commission through the Commission Ledger to continue working.
                  </p>
                </div>
                <div className="mt-3">
                  <Button
                    onClick={() => setShowCommissionLedger(true)}
                    size="sm"
                    className="bg-red-600 hover:bg-red-700"
                  >
                    View Commission Ledger
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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
        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-md">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* Tab Content */}
        {activeTab === 'available-jobs' && renderAvailableJobs()}
        {activeTab === 'assigned-jobs' && renderAssignedJobs()}
        {activeTab === 'wallet' && renderWallet()}
        {activeTab === 'profile' && renderProfile()}
        {activeTab === 'orders' && renderOrders()}
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

      {/* View Client Modal */}
      {viewProfileModal.open && viewProfileModal.data && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setViewProfileModal({ open: false, data: null })}>
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold">Client Details</h3>
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
            </div>
            <div className="p-4 border-t text-right">
              <Button variant="outline" onClick={() => setViewProfileModal({ open: false, data: null })}>Close</Button>
            </div>
          </div>
        </div>
      )}

      {/* Commission Ledger Modal */}
      <CommissionLedgerModal
        isOpen={showCommissionLedger}
        onClose={() => setShowCommissionLedger(false)}
        freelancerId={freelancerId}
        onPayCommission={handlePayCommission}
      />
    </div>
  );
};

export default FreelancerDashboard;
