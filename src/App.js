import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { RoleProvider } from './context/RoleContext';
import { useAuth } from './context/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';

// Auth Pages
import Login from './pages/auth/Login';
import SimpleLogin from './pages/auth/SimpleLogin';
import OTP from './pages/auth/OTP';
import ProfileSetup from './pages/auth/ProfileSetup';

// Client Pages
import ClientDashboard from './pages/client/Dashboard';

// Freelancer Pages
import FreelancerVerification from './pages/freelancer/Verification';
import FreelancerDashboard from './pages/freelancer/Dashboard';

// Admin Pages
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/CLI';

// Debug Pages
import DebugAuth from './pages/DebugAuth';
import PaymentDebug from './pages/debug/PaymentDebug';
import PaymentSuccess from './pages/PaymentSuccess';
import PaymentFailed from './pages/PaymentFailed';

// Protected Route Component
const ProtectedRoute = ({ children, requiredRole = null }) => {
  const { isAuthenticated, user, loading } = useAuth();

  console.log('🔒 ProtectedRoute check:', { isAuthenticated, user, loading, requiredRole });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log('❌ Not authenticated, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    console.log('❌ Role mismatch, redirecting to unauthorized');
    console.log('👤 User role:', user?.role);
    console.log('🔒 Required role:', requiredRole);
    console.log('🔍 Role comparison:', user?.role, '!==', requiredRole);
    return <Navigate to="/unauthorized" replace />;
  }

  console.log('✅ Access granted to protected route');
  return children;
};

// Role-based redirect component
const RoleRedirect = () => {
  const { user, isAuthenticated } = useAuth();
  
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  switch (user.role) {
    case 'client':
      return <Navigate to="/client/dashboard" replace />;
    case 'freelancer':
      // Always redirect freelancers to verification page first
      // The verification page will handle checking status and redirecting to dashboard if approved
      return <Navigate to="/freelancer/verification" replace />;
    case 'admin':
      return <Navigate to="/admin/dashboard" replace />;
    default:
      return <Navigate to="/login" replace />;
  }
};

// Unauthorized page
const Unauthorized = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">403</h1>
      <p className="text-xl text-gray-600 mb-8">Access Denied</p>
      <p className="text-gray-500">You don't have permission to access this page.</p>
    </div>
  </div>
);

// Debug component to test styles
const DebugPage = () => (
  <div className="min-h-screen bg-white p-8">
    <div className="max-w-md mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">Style Test</h1>
      <div className="bg-blue-100 p-4 rounded-lg mb-4">
        <p className="text-blue-800">If you can see this styled box, Tailwind is working!</p>
      </div>
      <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
        Test Button
      </button>
    </div>
  </div>
);

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <RoleProvider>
          <Router>
            <div className="App min-h-screen bg-white">
              <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/simple-login" element={<SimpleLogin />} />
              <Route path="/otp" element={<OTP />} />
              <Route path="/profile-setup" element={<ProfileSetup />} />
              <Route path="/unauthorized" element={<Unauthorized />} />
              <Route path="/debug" element={<DebugPage />} />
              <Route path="/debug-auth" element={<DebugAuth />} />
              <Route path="/debug-payment" element={<PaymentDebug />} />
        <Route path="/payment/success" element={<PaymentSuccess />} />
        <Route path="/payment/failed" element={<PaymentFailed />} />
              
              {/* Admin Routes */}
              <Route path="/admin/login" element={<AdminLogin />} />
              
              {/* Protected Routes */}
              <Route 
                path="/" 
                element={
                  <ProtectedRoute>
                    <RoleRedirect />
                  </ProtectedRoute>
                } 
              />
              
              {/* Client Routes */}
              <Route 
                path="/client/dashboard" 
                element={
                  <ProtectedRoute requiredRole="client">
                    <ClientDashboard />
                  </ProtectedRoute>
                } 
              />
              
              {/* Freelancer Routes */}
              <Route 
                path="/freelancer/verification" 
                element={
                  <ProtectedRoute requiredRole="freelancer">
                    <FreelancerVerification />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/freelancer/dashboard" 
                element={
                  <ProtectedRoute requiredRole="freelancer">
                    <FreelancerDashboard />
                  </ProtectedRoute>
                } 
              />
              
              {/* Admin Routes */}
              <Route 
                path="/admin/dashboard" 
                element={
                  <ProtectedRoute requiredRole="admin">
                    <AdminDashboard />
                  </ProtectedRoute>
                } 
              />
              
              {/* Catch all route */}
              <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
          </Router>
        </RoleProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
