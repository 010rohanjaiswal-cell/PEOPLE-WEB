import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../api/authService';
import { adminService } from '../../api/adminService';
import { Button } from '../../components/common/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/common/Card';
import { Input } from '../../components/common/Input';
import { Label } from '../../components/common/Label';
import { 
  Shield, 
  User, 
  LogOut, 
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  Users,
  FileText,
  AlertCircle
} from 'lucide-react';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('verifications');
  const [verificationFilter, setVerificationFilter] = useState('pending');
  
  // Verification data
  const [pendingVerifications, setPendingVerifications] = useState([]);
  const [verificationDetails, setVerificationDetails] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null);
  
  // Withdrawal data
  const [pendingWithdrawals, setPendingWithdrawals] = useState([]);
  const [withdrawalDetails, setWithdrawalDetails] = useState(null);

  useEffect(() => {
    loadAdminData();
  }, [verificationFilter]);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      const [verificationsRes, withdrawalsRes] = await Promise.all([
        adminService.getFreelancerVerifications(verificationFilter),
        adminService.getWithdrawalRequests('pending')
      ]);
      
      setPendingVerifications(verificationsRes.verifications || []);
      setPendingWithdrawals(withdrawalsRes.withdrawals || []);
    } catch (error) {
      console.error('Error loading admin data:', error);
      setError('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const handleVerificationAction = async (verificationId, action) => {
    try {
      setLoading(true);
      
      if (action === 'approve') {
        await adminService.approveFreelancer(verificationId);
      } else if (action === 'reject') {
        const reason = prompt('Please provide a reason for rejection:');
        if (reason) {
          await adminService.rejectFreelancer(verificationId, reason);
        } else {
          setLoading(false);
          return;
        }
      }
      
      // Update local state
      setPendingVerifications(prev => 
        prev.filter(v => v.id !== verificationId)
      );
      
      setError('');
    } catch (error) {
      console.error('Error processing verification:', error);
      setError('Failed to process verification');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdrawalAction = async (withdrawalId, action) => {
    try {
      setLoading(true);
      
      if (action === 'approve') {
        await adminService.approveWithdrawal(withdrawalId);
      } else if (action === 'reject') {
        const reason = prompt('Please provide a reason for rejection:');
        if (reason) {
          await adminService.rejectWithdrawal(withdrawalId, reason);
        } else {
          setLoading(false);
          return;
        }
      }
      
      // Update local state
      setPendingWithdrawals(prev => 
        prev.filter(w => w.id !== withdrawalId)
      );
      
      setError('');
    } catch (error) {
      console.error('Error processing withdrawal:', error);
      setError('Failed to process withdrawal');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
      logout();
      navigate('/admin/login');
    } catch (error) {
      console.error('Logout error:', error);
      logout(); // Force logout even if API fails
      navigate('/admin/login');
    }
  };

  const tabs = [
    { id: 'verifications', label: 'Verifications', icon: Shield },
    { id: 'withdrawals', label: 'Withdrawals', icon: DollarSign },
    { id: 'profile', label: 'Profile', icon: User }
  ];

  const renderVerifications = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Freelancer Verifications</h2>
        <div className="flex items-center space-x-3">
          <select
            value={verificationFilter}
            onChange={(e) => setVerificationFilter(e.target.value)}
            className="border rounded-md px-3 py-2 text-sm"
          >
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <Button onClick={loadAdminData} variant="outline">
            Refresh
          </Button>
        </div>
      </div>
      
      {pendingVerifications.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="text-center py-12 px-6">
            <CheckCircle className="w-16 h-16 mx-auto text-green-500 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">All Caught Up!</h3>
            <p className="text-gray-500">No pending verifications at the moment</p>
          </div>
        </div>
      ) : (
        <div className="grid gap-6">
          {pendingVerifications.map(verification => (
            <div key={verification.id} className="bg-white border border-gray-200 rounded-lg shadow-sm">
              <div className="bg-gray-50 p-6 rounded-t-lg">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-gray-900">{verification.fullName}</h3>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600 bg-blue-100 px-3 py-1 rounded-full">
                      {verification.phone}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full ${verification.status === 'approved' ? 'bg-green-100 text-green-700' : verification.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {verification.status}
                    </span>
                  </div>
                </div>
                <p className="text-gray-600 mt-2">
                  Submitted on {verification.submittedAt ? new Date(verification.submittedAt).toLocaleDateString() : '—'}
                </p>
              </div>
              <div className="p-6">
                <div className="space-y-6">
                  {/* Personal details */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <p className="text-sm text-gray-500">Date of Birth</p>
                      <p className="font-medium text-gray-900">{verification.dateOfBirth ? new Date(verification.dateOfBirth).toLocaleDateString() : '—'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Gender</p>
                      <p className="font-medium text-gray-900">{verification.gender || '—'}</p>
                    </div>
                    <div className="md:col-span-1">
                      <p className="text-sm text-gray-500">Address</p>
                      <p className="font-medium text-gray-900 break-words">{verification.address || '—'}</p>
                    </div>
                  </div>

                  {/* Document previews */}
                  <div className="grid grid-cols-3 gap-6">
                    {[{label:'Aadhaar Front', key:'aadhaarFront'}, {label:'Aadhaar Back', key:'aadhaarBack'}, {label:'PAN Card', key:'panCard'}].map((doc) => (
                      <div key={doc.key} className="text-center">
                        <div className="w-24 h-24 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center mx-auto mb-3 overflow-hidden">
                          {verification[doc.key] ? (
                            <img 
                              src={verification[doc.key]} 
                              alt={doc.label} 
                              className="w-full h-full object-cover cursor-zoom-in" 
                              onClick={() => setImagePreviewUrl(verification[doc.key])}
                            />
                          ) : (
                            <FileText className="w-8 h-8 text-gray-400" />
                          )}
                        </div>
                        <p className="text-sm font-medium text-gray-700">{doc.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Action buttons */}
                  <div className="flex space-x-3">
                    <button 
                      onClick={() => handleVerificationAction(verification.id, 'approve')}
                      disabled={loading}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg flex items-center justify-center"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approve
                    </button>
                    <button 
                      onClick={() => handleVerificationAction(verification.id, 'reject')}
                      disabled={loading}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg flex items-center justify-center"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject
                    </button>
                    {/* Removed View Details button */}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderWithdrawals = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Pending Withdrawals</h2>
        <Button onClick={loadAdminData} variant="outline">
          Refresh
        </Button>
      </div>
      
      {pendingWithdrawals.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="text-center py-12 px-6">
            <CheckCircle className="w-16 h-16 mx-auto text-green-500 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">All Caught Up!</h3>
            <p className="text-gray-500">No pending withdrawals at the moment</p>
          </div>
        </div>
      ) : (
        <div className="grid gap-6">
          {pendingWithdrawals.map(withdrawal => (
            <div key={withdrawal.id} className="bg-white border border-gray-200 rounded-lg shadow-sm">
              <div className="bg-gray-50 p-6 rounded-t-lg">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-gray-900">{withdrawal.freelancerName}</h3>
                  <span className="text-3xl font-bold text-green-600">
                    ₹{withdrawal.amount.toLocaleString()}
                  </span>
                </div>
                <p className="text-gray-600 mt-2">
                  UPI ID: {withdrawal.upiId}
                </p>
              </div>
              <div className="p-6">
                <div className="space-y-6">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-5 h-5 text-blue-600" />
                      <span className="text-sm font-medium text-blue-800">
                        Requested on {new Date(withdrawal.requestedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex space-x-3">
                    <button 
                      onClick={() => handleWithdrawalAction(withdrawal.id, 'approve')}
                      disabled={loading}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg flex items-center justify-center"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approve
                    </button>
                    <button 
                      onClick={() => handleWithdrawalAction(withdrawal.id, 'reject')}
                      disabled={loading}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg flex items-center justify-center"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject
                    </button>
                    <button 
                      onClick={() => setWithdrawalDetails(withdrawal)}
                      className="border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderProfile = () => (
    <div className="space-y-6">
      <Card className="border border-gray-200 shadow-sm">
        <CardHeader className="bg-gray-50">
          <CardTitle className="text-2xl text-gray-900">Admin Profile</CardTitle>
          <CardDescription className="text-gray-600">
            Manage your admin account and view platform statistics
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="flex items-center space-x-6">
            <div className="w-20 h-20 rounded-full bg-blue-600 flex items-center justify-center">
              <Shield className="w-10 h-10 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">{user?.fullName}</h3>
              <p className="text-gray-600">{user?.phone}</p>
              <p className="text-sm text-blue-600 font-medium bg-blue-100 px-3 py-1 rounded-full inline-block mt-2">
                Administrator
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <Label className="text-lg font-semibold text-gray-900">Platform Statistics</Label>
              <div className="grid grid-cols-2 gap-6 mt-4">
                <div className="p-6 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="text-3xl font-bold text-blue-600">
                        {pendingVerifications.length}
                      </div>
                      <div className="text-sm text-blue-700 font-medium">Pending Verifications</div>
                    </div>
                  </div>
                </div>
                <div className="p-6 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
                      <DollarSign className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="text-3xl font-bold text-green-600">
                        {pendingWithdrawals.length}
                      </div>
                      <div className="text-sm text-green-700 font-medium">Pending Withdrawals</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <Button 
                variant="destructive" 
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg"
              >
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
              <Shield className="w-6 h-6 text-blue-600 mr-2" />
              <h1 className="text-xl font-semibold text-gray-900">Admin Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Welcome, {user?.fullName}
              </span>
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <Button 
                variant="destructive"
                onClick={handleLogout}
                className="ml-2"
              >
                Logout
              </Button>
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
        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-md">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* Tab Content */}
        {activeTab === 'verifications' && renderVerifications()}
        {activeTab === 'withdrawals' && renderWithdrawals()}
        {activeTab === 'profile' && renderProfile()}
        {/* Details Modal */}
        {verificationDetails && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl">
              <div className="p-6 border-b">
                <h3 className="text-xl font-semibold">Verification Details</h3>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-gray-600">Full Name</Label>
                    <div className="text-gray-900">{verificationDetails.fullName}</div>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600">Phone</Label>
                    <div className="text-gray-900">{verificationDetails.phone}</div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  {[{label:'Aadhaar Front', key:'aadhaarFront'}, {label:'Aadhaar Back', key:'aadhaarBack'}, {label:'PAN Card', key:'panCard'}].map((doc) => (
                    <div key={doc.key}>
                      <Label className="text-sm text-gray-600">{doc.label}</Label>
                      <div className="mt-2 w-full h-32 bg-gray-50 border rounded overflow-hidden flex items-center justify-center">
                        {verificationDetails[doc.key] ? (
                          <img src={verificationDetails[doc.key]} alt={doc.label} className="w-full h-full object-cover" />
                        ) : (
                          <FileText className="w-8 h-8 text-gray-400" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-6 border-t text-right">
                <Button variant="outline" onClick={() => setVerificationDetails(null)}>Close</Button>
              </div>
            </div>
          </div>
        )}

        {/* Image Preview Modal */}
        {imagePreviewUrl && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50" onClick={() => setImagePreviewUrl(null)}>
            <div className="relative max-w-3xl w-full" onClick={(e) => e.stopPropagation()}>
              <div className="bg-white rounded-lg overflow-hidden shadow-2xl">
                <img src={imagePreviewUrl} alt="Document preview" className="w-full h-auto max-h-[80vh] object-contain" />
              </div>
              <div className="mt-3 text-right">
                <Button variant="outline" onClick={() => setImagePreviewUrl(null)}>Close</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
