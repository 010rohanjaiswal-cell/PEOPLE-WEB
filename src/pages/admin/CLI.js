import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../api/authService';
import { adminService } from '../../api/adminService';
import { Button } from '../../components/common/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/common/Card';
import { Label } from '../../components/common/Label';
import { 
  Shield, 
  LogOut, 
  CheckCircle,
  XCircle,
  FileText,
  Search,
  User
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
  
  // Search Users data
  const [allUsers, setAllUsers] = useState({ clients: [], freelancers: [] });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => {
    loadAdminData();
  }, [verificationFilter]);

  // Load users when search tab is activated
  useEffect(() => {
    if (activeTab === 'search' && allUsers.clients.length === 0 && allUsers.freelancers.length === 0) {
      loadAllUsers();
    }
  }, [activeTab]);


  const loadAdminData = async () => {
    try {
      setLoading(true);
      const verificationsRes = await adminService.getFreelancerVerifications(verificationFilter);
      
      console.log('📋 Verifications response:', verificationsRes);
      console.log('📋 Verifications array:', verificationsRes.verifications);
      
      const verifications = verificationsRes.verifications || [];
      console.log('📋 First verification object:', verifications[0]);
      console.log('📋 First verification keys:', verifications[0] ? Object.keys(verifications[0]) : 'No verifications');
      
      setPendingVerifications(verifications);
      
      console.log('📋 Set pendingVerifications to:', verifications);
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
    { id: 'search', label: 'Search Users', icon: Search }
  ];

  const loadAllUsers = async () => {
    try {
      setSearchLoading(true);
      setError('');
      const result = await adminService.searchUsers('');
      
      if (result && result.success && result.data) {
        // Handle both array and object formats
        let clients = [];
        let freelancers = [];
        
        if (Array.isArray(result.data)) {
          // If array format, separate by role
          clients = result.data.filter(user => user.role === 'client' || !user.role);
          freelancers = result.data.filter(user => user.role === 'freelancer');
        } else if (result.data && typeof result.data === 'object') {
          // Object format with separate clients and freelancers arrays
          clients = result.data.clients || [];
          freelancers = result.data.freelancers || [];
        }
        
        setAllUsers({ clients, freelancers });
      } else {
        setError('Failed to load users');
        setAllUsers({ clients: [], freelancers: [] });
      }
    } catch (error) {
      console.error('Error loading users:', error);
      setError('Failed to load users');
      setAllUsers({ clients: [], freelancers: [] });
    } finally {
      setSearchLoading(false);
    }
  };

  const renderSearch = () => {
    // Filter users based on search query
    const filterUsers = (users) => {
      if (!searchQuery.trim()) return users;
      return users.filter(user => {
        const phone = (user.phoneNumber || user.phone || '').toLowerCase();
        const name = (user.fullName || '').toLowerCase();
        const query = searchQuery.toLowerCase();
        return phone.includes(query) || name.includes(query);
      });
    };

    const filteredClients = filterUsers(allUsers.clients || []);
    const filteredFreelancers = filterUsers(allUsers.freelancers || []);
    const totalUsers = (allUsers.clients?.length || 0) + (allUsers.freelancers?.length || 0);
    const totalFiltered = filteredClients.length + filteredFreelancers.length;

    const renderUserCard = (user) => (
      <Card key={user._id || user.id} className="mb-3">
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden flex-shrink-0">
              {user.profilePhoto ? (
                <img 
                  src={user.profilePhoto} 
                  alt={user.fullName || 'User'} 
                  className="w-full h-full object-cover" 
                />
              ) : (
                <User className="w-6 h-6 text-blue-600" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 truncate">
                {user.fullName || 'No name'}
              </p>
              <p className="text-sm text-gray-600 truncate">
                {user.phoneNumber || user.phone || 'No phone'}
              </p>
              <div className="flex items-center space-x-2 mt-1">
                {user.verificationStatus && (
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    user.verificationStatus === 'approved' ? 'bg-green-100 text-green-700' :
                    user.verificationStatus === 'rejected' ? 'bg-red-100 text-red-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {user.verificationStatus}
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Search Users</h2>
          <Button onClick={loadAllUsers} variant="outline" disabled={searchLoading}>
            {searchLoading ? 'Loading...' : 'Refresh'}
          </Button>
        </div>

        {/* Search Input */}
        <Card>
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by phone number or name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </CardContent>
        </Card>

        {/* Users List - Two Columns */}
        {searchLoading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading users...</p>
          </div>
        ) : totalUsers === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Search className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No users loaded
              </h3>
              <p className="text-gray-500">
                Click Refresh to load users
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <div className="text-sm text-gray-600">
              Showing {totalFiltered} of {totalUsers} users
              {searchQuery.trim() && ` (${filteredClients.length} clients, ${filteredFreelancers.length} freelancers)`}
            </div>
            
            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Clients Column */}
              <div>
                <Card className="mb-4">
                  <CardHeader className="bg-blue-50 border-b">
                    <CardTitle className="text-lg font-semibold text-blue-900 flex items-center">
                      <User className="w-5 h-5 mr-2" />
                      Clients ({filteredClients.length})
                    </CardTitle>
                  </CardHeader>
                </Card>
                <div className="max-h-[600px] overflow-y-auto">
                  {filteredClients.length === 0 ? (
                    <Card>
                      <CardContent className="p-8 text-center">
                        <p className="text-gray-500 text-sm">
                          {searchQuery.trim() ? 'No clients found' : 'No clients'}
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    filteredClients.map(renderUserCard)
                  )}
                </div>
              </div>

              {/* Freelancers Column */}
              <div>
                <Card className="mb-4">
                  <CardHeader className="bg-green-50 border-b">
                    <CardTitle className="text-lg font-semibold text-green-900 flex items-center">
                      <User className="w-5 h-5 mr-2" />
                      Freelancers ({filteredFreelancers.length})
                    </CardTitle>
                  </CardHeader>
                </Card>
                <div className="max-h-[600px] overflow-y-auto">
                  {filteredFreelancers.length === 0 ? (
                    <Card>
                      <CardContent className="p-8 text-center">
                        <p className="text-gray-500 text-sm">
                          {searchQuery.trim() ? 'No freelancers found' : 'No freelancers'}
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    filteredFreelancers.map(renderUserCard)
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderVerifications = () => {
    console.log('🎨 Rendering verifications, pendingVerifications:', pendingVerifications);
    console.log('🎨 pendingVerifications.length:', pendingVerifications.length);
    console.log('🎨 verificationFilter:', verificationFilter);
    if (pendingVerifications.length > 0) {
      console.log('🎨 First verification in render:', pendingVerifications[0]);
      console.log('🎨 First verification keys:', Object.keys(pendingVerifications[0]));
    }
    
    return (
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
            <div key={verification._id || verification.id} className="bg-white border border-gray-200 rounded-lg shadow-sm">
              <div className="bg-gray-50 p-6 rounded-t-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 border cursor-zoom-in"
                      onClick={() => verification.profilePhoto && setImagePreviewUrl(verification.profilePhoto)}
                      title={verification.profilePhoto ? 'Click to preview' : ''}
                    >
                      {verification.profilePhoto ? (
                        <img src={verification.profilePhoto} alt={verification.fullName} className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-6 h-6 text-gray-500 m-3" />
                      )}
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900">{verification.fullName}</h3>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600 bg-blue-100 px-3 py-1 rounded-full">
                      {verification.phoneNumber || verification.phone}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full ${((verification.verificationStatus || verification.status) === 'approved') ? 'bg-green-100 text-green-700' : ((verification.verificationStatus || verification.status) === 'rejected') ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {verification.verificationStatus || verification.status}
                    </span>
                  </div>
                </div>
                <p className="text-gray-600 mt-2">
                  Submitted on {verification.updatedAt ? new Date(verification.updatedAt).toLocaleDateString() : verification.submittedAt ? new Date(verification.submittedAt).toLocaleDateString() : '—'}
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

                  {/* Action buttons - only show for pending verifications */}
                  {(verification.verificationStatus || verification.status) === 'pending' ? (
                    <div className="flex space-x-3">
                      <button 
                        onClick={() => handleVerificationAction(verification._id || verification.id, 'approve')}
                        disabled={loading}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg flex items-center justify-center"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Approve
                      </button>
                      <button 
                        onClick={() => handleVerificationAction(verification._id || verification.id, 'reject')}
                        disabled={loading}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg flex items-center justify-center"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Reject
                      </button>
                    </div>
                  ) : (
                    <div className="text-center py-2">
                      <span className="text-sm text-gray-500 font-medium">
                        Decision already made
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
    );
  };


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
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center overflow-hidden">
                {user?.profilePhoto ? (
                  <img 
                    src={user.profilePhoto} 
                    alt={user.fullName} 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <Shield className="w-4 h-4 text-white" />
                )}
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
        {activeTab === 'search' && renderSearch()}
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
