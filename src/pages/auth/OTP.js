import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { PhoneAuthProvider, signInWithCredential } from 'firebase/auth';
import { auth } from '../../utils/firebase';
import { otpSchema } from '../../utils/validators';
import { authService } from '../../api/authService';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Label } from '../../components/common/Label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/common/Card';
import { Shield, ArrowLeft, CheckCircle } from 'lucide-react';

const OTP = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [roleSelection, setRoleSelection] = useState(null);
  const [showRoleSelection, setShowRoleSelection] = useState(false);

  const { phoneNumber, verificationId, selectedRole } = location.state || {};

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch
  } = useForm({
    resolver: yupResolver(otpSchema)
  });

  const otpValue = watch('otp');

  // Redirect if no phone number or verification ID
  useEffect(() => {
    if (!phoneNumber || !verificationId) {
      navigate('/login');
    }
  }, [phoneNumber, verificationId, navigate]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const onSubmit = async (data) => {
    setLoading(true);
    setError('');

    try {
      // Create credential with OTP
      const credential = PhoneAuthProvider.credential(verificationId, data.otp);
      
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Verification timeout. Please try again.')), 30000);
      });
      
      // Sign in with credential with timeout
      const userCredential = await Promise.race([
        signInWithCredential(auth, credential),
        timeoutPromise
      ]);
      
      const idToken = await userCredential.user.getIdToken();

      // Use the selected role from login page
      if (selectedRole) {
        await handleRoleSelection(selectedRole);
      } else {
        // Fallback: show role selection if no role was selected
        setShowRoleSelection(true);
      }
      
    } catch (error) {
      console.error('Error verifying OTP:', error);
      
      if (error.message.includes('timeout')) {
        setError('Verification is taking too long. Please try again.');
      } else if (error.code === 'auth/invalid-verification-code') {
        setError('Invalid OTP. Please check and try again.');
      } else if (error.code === 'auth/code-expired') {
        setError('OTP has expired. Please request a new one.');
      } else {
        setError('Verification failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRoleSelection = async (role) => {
    setLoading(true);
    setError('');

    try {
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Authentication timeout. Please try again.')), 15000);
      });
      
      const idToken = await Promise.race([
        auth.currentUser.getIdToken(),
        timeoutPromise
      ]);
      
      console.log('🔐 Starting authentication for role:', role);
      console.log('🌐 API Base URL:', process.env.REACT_APP_API_BASE_URL);
      console.log('🔧 Use Mock Auth:', process.env.REACT_APP_USE_MOCK_AUTH);
      
      // Authenticate with backend (with timeout)
      const authPromise = authService.authenticate(idToken, role);
      const result = await Promise.race([
        authPromise,
        timeoutPromise
      ]);
      
      if (result.success) {
        console.log('✅ Authentication successful, checking next step');
        console.log('📋 Result data:', result);
        console.log('🔍 needsProfileSetup:', result.needsProfileSetup);
        console.log('👤 Role:', role);
        
        // Manually update AuthContext to ensure it's in sync
        console.log('🔄 Manually updating AuthContext with user data');
        updateUser(result.user);
        
        // Wait a moment for the AuthContext to update
        setTimeout(() => {
          console.log('🎯 Proceeding with navigation after auth context update');
          
          // Navigate based on role and setup status
          if (role === 'client') {
            if (result.needsProfileSetup) {
              console.log('🎯 Client needs profile setup, navigating to profile setup');
              navigate('/profile-setup', { 
                state: { 
                  phoneNumber,
                  role,
                  isNewUser: result.isNewUser 
                } 
              });
            } else {
              console.log('🎯 Client setup complete, navigating to dashboard');
              navigate('/client/dashboard');
            }
          } else if (role === 'freelancer') {
            if (result.needsVerification) {
              console.log('🎯 Freelancer needs verification, navigating to verification');
              navigate('/freelancer/verification', { 
                state: { 
                  phoneNumber,
                  role,
                  isNewUser: result.isNewUser 
                } 
              });
            } else {
              console.log('🎯 Freelancer verification complete, navigating to dashboard');
              navigate('/freelancer/dashboard');
            }
          }
        }, 300);
      } else {
        console.log('❌ Authentication failed:', result.message);
        setError(result.message || 'Authentication failed');
      }
    } catch (error) {
      console.error('Error authenticating:', error);
      
      if (error.message.includes('timeout')) {
        setError('Authentication is taking too long. Please try again.');
      } else {
        setError(error.message || 'Authentication failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const resendOTP = async () => {
    if (resendCooldown > 0) return;
    
    setResendLoading(true);
    setError('');

    try {
      // This would typically call your backend to resend OTP
      // For now, we'll just show a success message
      setResendCooldown(60); // 60 seconds cooldown
      setError(''); // Clear any previous errors
    } catch (error) {
      setError('Failed to resend OTP. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  const goBack = () => {
    navigate('/login');
  };

  if (showRoleSelection) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="shadow-lg border border-gray-200">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mb-6">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-3xl font-bold text-gray-900">Choose Your Role</CardTitle>
              <CardDescription className="text-gray-600 text-lg">
                Select how you want to use the platform
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <Button
                variant="outline"
                className="w-full h-16 flex flex-col items-center justify-center space-y-2 border-2 border-blue-200 hover:border-blue-400 hover:bg-blue-50"
                onClick={() => handleRoleSelection('client')}
                loading={loading}
              >
                <span className="text-lg font-semibold text-gray-900">I'm a Client</span>
                <span className="text-sm text-gray-600">I want to hire freelancers</span>
              </Button>

              <Button
                variant="outline"
                className="w-full h-16 flex flex-col items-center justify-center space-y-2 border-2 border-blue-200 hover:border-blue-400 hover:bg-blue-50"
                onClick={() => handleRoleSelection('freelancer')}
                loading={loading}
              >
                <span className="text-lg font-semibold text-gray-900">I'm a Freelancer</span>
                <span className="text-sm text-gray-600">I want to find work</span>
              </Button>

              {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-lg border border-gray-200">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-6">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-3xl font-bold text-gray-900">Verify OTP</CardTitle>
            <CardDescription className="text-gray-600 text-lg">
              Enter the 6-digit code sent to {phoneNumber}
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="otp">Verification Code</Label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="123456"
                  maxLength="6"
                  {...register('otp')}
                  className="text-center text-2xl tracking-widest"
                  disabled={loading}
                />
                {errors.otp && (
                  <p className="text-sm text-destructive">{errors.otp.message}</p>
                )}
              </div>

              {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg" 
                loading={loading}
                disabled={!otpValue || otpValue.length !== 6 || loading}
              >
                {loading ? 'Verifying...' : 'Verify OTP'}
              </Button>
            </form>

            <div className="mt-6 space-y-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  Didn't receive the code?
                </p>
                <Button
                  variant="link"
                  onClick={resendOTP}
                  loading={resendLoading}
                  disabled={resendCooldown > 0}
                  className="p-0 h-auto"
                >
                  {resendCooldown > 0 
                    ? `Resend in ${resendCooldown}s` 
                    : 'Resend OTP'
                  }
                </Button>
              </div>

              <Button
                variant="ghost"
                onClick={goBack}
                className="w-full"
                disabled={loading}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OTP;
