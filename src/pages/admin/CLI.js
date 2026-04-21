import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../api/authService';
import { adminService } from '../../api/adminService';
import { Button } from '../../components/common/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/common/Card';
import { Label } from '../../components/common/Label';
import { 
  Shield,
  FileText,
  Search,
  User,
  X
} from 'lucide-react';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('open-jobs');
  
  // Search Users data
  const [allUsers, setAllUsers] = useState({ clients: [], freelancers: [] });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedUserSummary, setSelectedUserSummary] = useState(null);
  const [selectedUserProfile, setSelectedUserProfile] = useState(null);
  const [userProfileLoading, setUserProfileLoading] = useState(false);
  const [userProfileError, setUserProfileError] = useState('');
  const [openJobs, setOpenJobs] = useState([]);
  const [openJobsSearch, setOpenJobsSearch] = useState('');
  const [openJobsLoading, setOpenJobsLoading] = useState(false);

  const closeUserModal = () => {
    setSelectedUserSummary(null);
    setSelectedUserProfile(null);
    setUserProfileLoading(false);
    setUserProfileError('');
  };

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape' && selectedUserSummary) {
        closeUserModal();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedUserSummary]);

  // Load users when search tab is activated
  useEffect(() => {
    if (activeTab === 'search' && allUsers.clients.length === 0 && allUsers.freelancers.length === 0) {
      loadAllUsers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // Load open jobs when Open Jobs tab is activated
  useEffect(() => {
    if (activeTab === 'open-jobs' && openJobs.length === 0 && !openJobsLoading) {
      loadOpenJobs('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

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
    { id: 'search', label: 'Search Users', icon: Search },
    { id: 'open-jobs', label: 'Open Jobs', icon: FileText }
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

  const loadOpenJobs = async (phoneFilter = '') => {
    try {
      setOpenJobsLoading(true);
      setError('');
      const result = await adminService.getOpenJobs(phoneFilter);
      if (result && result.success) {
        setOpenJobs(Array.isArray(result.data) ? result.data : []);
      } else {
        setError(result?.message || 'Failed to load open jobs');
        setOpenJobs([]);
      }
    } catch (err) {
      console.error('Error loading open jobs:', err);
      setError(err?.message || 'Failed to load open jobs');
      setOpenJobs([]);
    } finally {
      setOpenJobsLoading(false);
    }
  };

  const openUserModal = async (userSummary) => {
    const userId = userSummary?._id || userSummary?.id;
    if (!userId) return;

    setSelectedUserSummary(userSummary);
    setSelectedUserProfile(null);
    setUserProfileLoading(true);
    setUserProfileError('');

    try {
      const result = await adminService.getUserProfile(userId);
      if (result?.success) {
        setSelectedUserProfile(result.data || null);
      } else {
        setUserProfileError(result?.message || 'Failed to load user details');
      }
    } catch (err) {
      setUserProfileError(err?.message || 'Failed to load user details');
    } finally {
      setUserProfileLoading(false);
    }
  };

  const getAgeFromDob = (dob) => {
    if (!dob) return '';
    const d = new Date(dob);
    if (Number.isNaN(d.getTime())) return '';
    const today = new Date();
    let age = today.getFullYear() - d.getFullYear();
    const m = today.getMonth() - d.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age -= 1;
    return age >= 0 ? String(age) : '';
  };

  const renderUserDetailsModal = () => {
    if (!selectedUserSummary) return null;

    const profile = selectedUserProfile || {};
    const role = profile.role || selectedUserSummary.role || (allUsers.freelancers?.some((u) => (u._id || u.id) === (selectedUserSummary._id || selectedUserSummary.id)) ? 'freelancer' : 'client');
    const verificationStatus = profile.verificationStatus || selectedUserSummary.verificationStatus;

    const verificationDocs = profile.verificationDocuments || profile.documents || {};
    const profilePhotoUrl = profile.profilePhoto || selectedUserSummary.profilePhoto || verificationDocs.profilePhoto || null;

    const phone = profile.phoneNumber || profile.phone || selectedUserSummary.phoneNumber || selectedUserSummary.phone || '';
    const email = profile.email || '';

    const dateOfBirth = verificationDocs.dateOfBirth || profile.dateOfBirth || profile.dob || '';
    const gender = verificationDocs.gender || profile.gender || '';
    const address = verificationDocs.address || profile.address || '';
    const age = getAgeFromDob(dateOfBirth);

    const aadhaarFront = verificationDocs.aadhaarFront || profile.aadhaarFront || profile.aadharFront || null;
    const aadhaarBack = verificationDocs.aadhaarBack || profile.aadhaarBack || profile.aadharBack || null;
    const panCard = verificationDocs.panCard || profile.panCard || null;

    const aadhaarNumber = verificationDocs.aadhaarNumber || verificationDocs.aadharNumber || profile.aadhaarNumber || profile.aadharNumber || '';
    const panNumber = verificationDocs.panNumber || profile.panNumber || '';

    const formatDate = (value) => {
      if (!value) return '';
      const d = new Date(value);
      if (Number.isNaN(d.getTime())) return String(value);
      return d.toLocaleDateString();
    };

    const renderImage = (label, url) => (
      <div className="space-y-2">
        <div className="text-sm font-medium text-gray-700">{label}</div>
        {url ? (
          <a href={url} target="_blank" rel="noreferrer" className="block">
            <img
              src={url}
              alt={label}
              className="w-full h-40 object-cover rounded-md border border-gray-200 hover:opacity-90 transition"
            />
            <div className="text-xs text-blue-600 mt-1">Open full image</div>
          </a>
        ) : (
          <div className="h-40 rounded-md border border-dashed border-gray-300 flex items-center justify-center text-sm text-gray-500">
            Not available
          </div>
        )}
      </div>
    );

    return (
      <div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) closeUserModal();
        }}
      >
        <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <div className="flex items-center space-x-4 min-w-0">
              <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                {profilePhotoUrl ? (
                  <img src={profilePhotoUrl} alt={profile.fullName || selectedUserSummary.fullName || 'User'} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-7 h-7 text-blue-600" />
                )}
              </div>
              <div className="min-w-0">
                <div className="text-xl font-semibold text-gray-900 truncate">
                  {profile.fullName || selectedUserSummary.fullName || 'User'}
                </div>
                <div className="text-sm text-gray-600 truncate">
                  {phone || 'No phone'} {role ? `• ${role}` : ''}
                </div>
                <div className="mt-1 flex items-center space-x-2">
                  {verificationStatus && (
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      verificationStatus === 'approved' ? 'bg-green-100 text-green-700' :
                      verificationStatus === 'rejected' ? 'bg-red-100 text-red-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {verificationStatus}
                    </span>
                  )}
                  {profile._id && (
                    <span className="text-xs text-gray-500 font-mono truncate">
                      {profile._id}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <button onClick={closeUserModal} className="text-gray-400 hover:text-gray-600 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-6">
            {userProfileLoading && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
                Loading user details...
              </div>
            )}

            {userProfileError && (
              <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
                {userProfileError}
              </div>
            )}

            {/* Personal details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="border border-gray-200">
                <CardContent className="p-4 space-y-2">
                  <div className="text-sm font-semibold text-gray-900">Personal Details</div>
                  <div className="text-sm text-gray-700">
                    <span className="font-medium">Mobile:</span> {phone || '—'}
                  </div>
                  <div className="text-sm text-gray-700">
                    <span className="font-medium">Email:</span> {email || '—'}
                  </div>
                  <div className="text-sm text-gray-700">
                    <span className="font-medium">DOB:</span> {formatDate(dateOfBirth) || '—'}
                    {age ? <span className="text-gray-500"> ({age} yrs)</span> : null}
                  </div>
                  <div className="text-sm text-gray-700">
                    <span className="font-medium">Gender:</span> {gender || '—'}
                  </div>
                  <div className="text-sm text-gray-700">
                    <span className="font-medium">Address:</span> {address || '—'}
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-gray-200">
                <CardContent className="p-4 space-y-2">
                  <div className="text-sm font-semibold text-gray-900">KYC Details</div>
                  <div className="text-sm text-gray-700">
                    <span className="font-medium">Aadhaar Number:</span> {aadhaarNumber || '—'}
                  </div>
                  <div className="text-sm text-gray-700">
                    <span className="font-medium">PAN Number:</span> {panNumber || '—'}
                  </div>
                  <div className="text-sm text-gray-700">
                    <span className="font-medium">Onboarded with docs:</span>{' '}
                    {(aadhaarFront || aadhaarBack || panCard) ? 'Yes' : 'No'}
                  </div>
                  <div className="text-xs text-gray-500">
                    Document images below will show only if your backend stored URLs for them.
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Document images */}
            <div className="space-y-3">
              <div className="text-sm font-semibold text-gray-900">Document Images</div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {renderImage('Aadhaar (Front)', aadhaarFront)}
                {renderImage('Aadhaar (Back)', aadhaarBack)}
                {renderImage('PAN Card', panCard)}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end space-x-3 p-6 border-t bg-gray-50">
            <Button variant="outline" onClick={closeUserModal}>
              Close
            </Button>
          </div>
        </div>
      </div>
    );
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
      <Card
        key={user._id || user.id}
        className="mb-3 cursor-pointer hover:bg-gray-50 transition-colors"
        role="button"
        tabIndex={0}
        onClick={() => openUserModal(user)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            openUserModal(user);
          }
        }}
      >
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
        {renderUserDetailsModal()}
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

  const renderOpenJobs = () => {
    const filteredJobs = (() => {
      if (!openJobsSearch.trim()) return openJobs;
      const query = openJobsSearch.trim().toLowerCase();
      return openJobs.filter((job) => {
        const clientPhone = (job.client?.phoneNumber || job.client?.phone || '').toLowerCase();
        const freelancerPhone = (job.freelancer?.phoneNumber || job.freelancer?.phone || '').toLowerCase();
        const title = (job.title || '').toLowerCase();
        return (
          clientPhone.includes(query) ||
          freelancerPhone.includes(query) ||
          title.includes(query)
        );
      });
    })();

    const handleDeleteJob = async (jobId) => {
      if (!window.confirm('Are you sure you want to delete this job? This cannot be undone.')) {
        return;
      }
      try {
        setLoading(true);
        setError('');
        await adminService.deleteJob(jobId);
        setOpenJobs((prev) => prev.filter((j) => j.id !== jobId));
      } catch (err) {
        console.error('Error deleting job:', err);
        setError(err?.message || 'Failed to delete job');
      } finally {
        setLoading(false);
      }
    };

    const handleUnassignJob = async (job) => {
      if (!window.confirm('Are you sure you want to unassign the freelancer from this job?')) {
        return;
      }

      try {
        setLoading(true);
        setError('');
        const result = await adminService.unassignFreelancer(job.id);
        const newStatus = result?.data?.status || (job.status === 'assigned' ? 'open' : job.status);
        setOpenJobs((prev) =>
          prev.map((j) =>
            j.id === job.id
              ? { ...j, status: newStatus, freelancer: null }
              : j
          )
        );
      } catch (err) {
        console.error('Error unassigning freelancer:', err);
        setError(err?.message || 'Failed to unassign freelancer');
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Open Jobs</h2>
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              onClick={() => loadOpenJobs(openJobsSearch)}
              disabled={openJobsLoading}
            >
              {openJobsLoading ? 'Loading...' : 'Refresh'}
            </Button>
          </div>
        </div>

        {/* Search by client phone */}
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div className="md:col-span-2">
                <Label className="text-sm text-gray-600">Search by client phone number</Label>
                <div className="relative mt-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Enter phone number (e.g. +9199...)"
                    value={openJobsSearch}
                    onChange={(e) => setOpenJobsSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="flex space-x-2">
                <Button
                  className="w-full"
                  onClick={() => loadOpenJobs(openJobsSearch)}
                  disabled={openJobsLoading}
                >
                  {openJobsLoading ? 'Searching...' : 'Search'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setOpenJobsSearch('');
                    loadOpenJobs('');
                  }}
                  disabled={openJobsLoading}
                >
                  Clear
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Jobs list */}
        {openJobsLoading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading open jobs...</p>
          </div>
        ) : filteredJobs.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No open jobs found
              </h3>
              <p className="text-gray-500">
                Try adjusting the search or check again later.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredJobs.map((job) => (
              <Card key={job.id} className="border border-gray-200">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg text-gray-900">
                        {job.title}
                      </CardTitle>
                      <p className="text-sm text-gray-500 mt-1">
                        {job.category} • {job.gender || 'Any'}
                      </p>
                      <p className="text-xs text-gray-500">
                        Job ID: <span className="font-mono">{job.id}</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="mb-1">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                            job.status === 'open'
                              ? 'bg-green-100 text-green-800'
                              : job.status === 'assigned'
                              ? 'bg-blue-100 text-blue-800'
                              : job.status === 'in-progress'
                              ? 'bg-yellow-100 text-yellow-800'
                              : job.status === 'work_done'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {job.status || 'unknown'}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-green-700">
                        ₹{job.budget}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {job.createdAt
                          ? new Date(job.createdAt).toLocaleDateString()
                          : ''}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {job.description && (
                    <p className="text-sm text-gray-700">
                      {job.description}
                    </p>
                  )}
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Address:</span>{' '}
                    {job.address}{' '}
                    {job.pincode && (
                      <span className="text-gray-500">- {job.pincode}</span>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                    <div>
                      <span className="font-medium">Client:</span>{' '}
                      {job.client?.fullName || 'Unknown'}
                      <div className="text-xs text-gray-500">
                        Phone:{' '}
                        {job.client?.phoneNumber ||
                          job.client?.phone ||
                          'No phone'}
                      </div>
                    </div>
                    <div>
                      <span className="font-medium">Freelancer:</span>{' '}
                      {job.freelancer
                        ? (job.freelancer.fullName || 'Assigned')
                        : 'Not assigned'}
                      <div className="text-xs text-gray-500">
                        Phone:{' '}
                        {job.freelancer?.phoneNumber ||
                          job.freelancer?.phone ||
                          (job.freelancer ? 'No phone' : '—')}
                      </div>
                    </div>
                  </div>
                  <div className="pt-3 border-t flex justify-end space-x-2">
                    {job.freelancer && (
                      <Button
                        variant="outline"
                        onClick={() => handleUnassignJob(job)}
                        disabled={loading}
                      >
                        Unassign Freelancer
                      </Button>
                    )}
                    <Button
                      variant="destructive"
                      onClick={() => handleDeleteJob(job.id)}
                      disabled={loading}
                    >
                      Delete Job
                    </Button>
                  </div>
                </CardContent>
              </Card>
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
        {activeTab === 'search' && renderSearch()}
        {activeTab === 'open-jobs' && renderOpenJobs()}
      </div>
    </div>
  );
};

export default AdminDashboard;
