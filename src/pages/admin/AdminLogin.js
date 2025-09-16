import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../utils/firebase';
import { authService } from '../../api/authService';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Label } from '../../components/common/Label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/common/Card';
import { Shield, ArrowLeft, Eye, EyeOff } from 'lucide-react';

// Admin login validation schema
const adminLoginSchema = yup.object({
  email: yup
    .string()
    .email('Please enter a valid email address')
    .required('Email is required'),
  password: yup
    .string()
    .min(6, 'Password must be at least 6 characters')
    .required('Password is required')
});

const AdminLogin = () => {
  const navigate = useNavigate();
  const { updateUser, login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: yupResolver(adminLoginSchema)
  });

  const onSubmit = async (data) => {
    setLoading(true);
    setError('');

    try {
      console.log('🔐 Attempting admin login with:', data.email);
      
      // Use backend email/password login for admin
      console.log('🔧 Using backend admin email/password login');
      const { storage } = await import('../../utils/storage');
      storage.clearAll();
      const result = await authService.adminLogin(data.email, data.password);
      console.log('📋 Admin login result:', result);
      if (result.success) {
        login(result.user, result.token);
        navigate('/admin/dashboard');
        return;
      } else {
        setError(result.message || 'Admin authentication failed');
        return;
      }
      
      // (Firebase path removed for admin login)
    } catch (error) {
      console.error('Admin login error:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      
      // Handle specific Firebase errors
      if (error.code === 'auth/user-not-found') {
        setError('No admin account found with this email. Please create an admin user first.');
      } else if (error.code === 'auth/wrong-password') {
        setError('Incorrect password');
      } else if (error.code === 'auth/invalid-email') {
        setError('Invalid email address');
      } else if (error.code === 'auth/invalid-credential') {
        setError('Invalid email or password. For testing, use: admin@test.com / admin123');
      } else if (error.code === 'auth/too-many-requests') {
        setError('Too many failed attempts. Please try again later');
      } else if (error.code === 'auth/operation-not-allowed') {
        setError('Email/password authentication is not enabled or admin user does not exist. Please check Firebase configuration.');
      } else {
        setError(`Login failed: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-lg border border-gray-200">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mb-6">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-3xl font-bold text-gray-900">Admin Login</CardTitle>
            <CardDescription className="text-gray-600 text-lg">
              Access the admin panel with your credentials
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@example.com"
                  {...register('email')}
                  disabled={loading}
                  className="w-full"
                />
                {errors.email && (
                  <p className="text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    {...register('password')}
                    disabled={loading}
                    className="w-full pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-red-600">{errors.password.message}</p>
                )}
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg" 
                loading={loading}
                disabled={loading}
              >
                {loading ? 'Signing In...' : 'Sign In to Admin Panel'}
              </Button>
            </form>

            <div className="mt-6">
              <Button
                variant="ghost"
                onClick={goBack}
                className="w-full"
                disabled={loading}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Main App
              </Button>
            </div>

            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-xs text-yellow-800">
                <strong>Note:</strong> This is the admin panel. Regular users should use the main app with phone number authentication.
              </p>
            </div>

            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-xs text-blue-800">
                <strong>For Testing (Development Mode):</strong><br/>
                Email: <code>admin@test.com</code><br/>
                Password: <code>admin123</code><br/><br/>
                <strong>For Production:</strong><br/>
                1. Go to Firebase Console → Authentication → Users<br/>
                2. Click "Add user" and create with email/password<br/>
                3. Use those credentials to login here
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminLogin;
