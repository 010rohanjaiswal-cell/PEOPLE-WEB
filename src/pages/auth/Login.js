import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithPhoneNumber } from 'firebase/auth';
import { auth, initializeRecaptcha, clearRecaptcha } from '../../utils/firebase';
import { storage } from '../../utils/storage';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Label } from '../../components/common/Label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/common/Card';
import { Phone, ArrowRight } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedRole, setSelectedRole] = useState(null);

  // Clear any existing auth data on component mount
  useEffect(() => {
    storage.clearAll();
    
    // Add global error handler for reCAPTCHA errors
    const handleGlobalError = (event) => {
      if (event.error && event.error.message && 
          (event.error.message.includes('timeout') || 
           event.error.message.includes('Cannot read properties of null'))) {
        console.error('Global reCAPTCHA error caught:', event.error);
        setError('reCAPTCHA verification failed. Please use "Clear reCAPTCHA & Retry" button.');
        setLoading(false);
      }
    };
    
    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', (event) => {
      if (event.reason && event.reason.message && 
          (event.reason.message.includes('timeout') || 
           event.reason.message.includes('Cannot read properties of null'))) {
        console.error('Global reCAPTCHA promise rejection caught:', event.reason);
        setError('reCAPTCHA verification failed. Please use "Clear reCAPTCHA & Retry" button.');
        setLoading(false);
      }
    });
    
    // Cleanup reCAPTCHA on component unmount
    return () => {
      clearRecaptcha();
      window.removeEventListener('error', handleGlobalError);
    };
  }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validate phone number
      const digits = phoneNumber.replace(/\D/g, '');
      if (digits.length !== 12) { // +91 + 10 digits
        setError('Please enter a valid 10-digit mobile number');
        setLoading(false);
        return;
      }

      // Initialize reCAPTCHA
      const recaptchaVerifier = initializeRecaptcha();
      
      // Format phone number for Firebase (ensure it starts with +91)
      const formattedPhone = `+${digits}`;
      
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('OTP sending timeout. Please try again.')), 30000);
      });
      
      // Send OTP with timeout and better error handling
      let confirmationResult;
      try {
        confirmationResult = await Promise.race([
          signInWithPhoneNumber(auth, formattedPhone, recaptchaVerifier),
          timeoutPromise
        ]);
      } catch (recaptchaError) {
        console.error('reCAPTCHA error:', recaptchaError);
        
        // If reCAPTCHA fails, try to clear it and show user-friendly message
        if (recaptchaError.message?.includes('timeout') || 
            recaptchaError.message?.includes('Cannot read properties of null')) {
          setError('reCAPTCHA verification failed. Please refresh the page and try again.');
          return;
        }
        
        throw recaptchaError;
      }
      
      // Store confirmation result in session storage for OTP verification
      sessionStorage.setItem('confirmationResult', JSON.stringify({
        verificationId: confirmationResult.verificationId
      }));
      
      // Navigate to OTP screen with phone number and selected role
      navigate('/otp', { 
        state: { 
          phoneNumber: formattedPhone,
          verificationId: confirmationResult.verificationId,
          selectedRole: selectedRole
        } 
      });
      
    } catch (error) {
      console.error('Error sending OTP:', error);
      
      // Clear reCAPTCHA on error
      clearRecaptcha();
      
      if (error.message.includes('timeout')) {
        setError('OTP sending is taking too long. Please try again.');
      } else if (error.code === 'auth/too-many-requests') {
        setError('Too many requests. Please wait a moment and try again.');
      } else if (error.code === 'auth/invalid-phone-number') {
        setError('Invalid phone number. Please check and try again.');
      } else if (error.message.includes('Cannot read properties of null')) {
        setError('reCAPTCHA error. Please refresh the page and try again.');
      } else {
        setError(error.message || 'Failed to send OTP. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const [phoneNumber, setPhoneNumber] = useState('+91 ');

  const handlePhoneChange = (e) => {
    let value = e.target.value;
    
    // Always ensure +91 prefix is present
    if (!value.startsWith('+91')) {
      value = '+91 ' + value.replace(/\D/g, '');
    }
    
    // Remove any non-digit characters except + and space after +91
    const digits = value.replace(/\D/g, '');
    
    // Format as +91 XXXXX XXXXX
    if (digits.length <= 2) {
      value = '+91 ';
    } else if (digits.length <= 7) {
      value = `+91 ${digits.slice(2)}`;
    } else if (digits.length <= 12) {
      value = `+91 ${digits.slice(2, 7)} ${digits.slice(7)}`;
    } else {
      // Limit to 10 digits after +91
      value = `+91 ${digits.slice(2, 7)} ${digits.slice(7, 12)}`;
    }
    
    setPhoneNumber(value);
  };

  const handleKeyDown = (e) => {
    // Allow backspace, delete, arrow keys, tab
    if ([8, 9, 27, 46, 37, 38, 39, 40].indexOf(e.keyCode) !== -1 ||
        // Allow Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
        (e.keyCode === 65 && e.ctrlKey === true) ||
        (e.keyCode === 67 && e.ctrlKey === true) ||
        (e.keyCode === 86 && e.ctrlKey === true) ||
        (e.keyCode === 88 && e.ctrlKey === true)) {
      return;
    }
    
    // Ensure that it is a number and stop the keypress
    if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
      e.preventDefault();
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-lg border border-gray-200">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-6">
              <Phone className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-3xl font-bold text-gray-900">Welcome Back</CardTitle>
            <CardDescription className="text-gray-600 text-lg">
              Enter your mobile number to get started
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="phone">Mobile Number</Label>
                <div className="relative">
                  <Input
                    id="phone"
                    type="tel"
                    value={phoneNumber}
                    onChange={handlePhoneChange}
                    onKeyDown={handleKeyDown}
                    placeholder="+91 9876543210"
                    className="pl-12"
                    disabled={loading}
                    maxLength={17} // +91 XXXXX XXXXX
                  />
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                    <Phone className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  Enter your 10-digit mobile number
                </p>
                {/* Debug info - remove in production */}
                <p className="text-xs text-gray-400">
                  Digits: {phoneNumber.replace(/\D/g, '').length}/12 | 
                  Complete: {phoneNumber.replace(/\D/g, '').length === 12 ? 'Yes' : 'No'}
                </p>
              </div>

              {/* Role Selection */}
              <div className="space-y-3">
                <Label>Choose Your Role</Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedRole('client')}
                    className={`p-3 rounded-lg border-2 text-center transition-all duration-200 ${
                      selectedRole === 'client'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-600'
                    }`}
                    disabled={loading}
                  >
                    <div className="font-semibold text-sm">I'm a Client</div>
                    <div className="text-xs opacity-75">I want to hire</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedRole('freelancer')}
                    className={`p-3 rounded-lg border-2 text-center transition-all duration-200 ${
                      selectedRole === 'freelancer'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-600'
                    }`}
                    disabled={loading}
                  >
                    <div className="font-semibold text-sm">I'm a Freelancer</div>
                    <div className="text-xs opacity-75">I want to work</div>
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <Button 
                type="submit" 
                className={`w-full font-semibold py-3 px-6 rounded-lg transition-all duration-200 ${
                  phoneNumber.replace(/\D/g, '').length === 12 && selectedRole && !loading
                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
                loading={loading}
                disabled={phoneNumber.replace(/\D/g, '').length !== 12 || !selectedRole || loading}
              >
                {loading ? 'Sending OTP...' : 'Send OTP'}
                {!loading && phoneNumber.replace(/\D/g, '').length === 12 && selectedRole && <ArrowRight className="w-4 h-4 ml-2" />}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                We'll send you a verification code via SMS
              </p>
              <div className="flex flex-col space-y-2 mt-4">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    clearRecaptcha();
                    setError('');
                    setLoading(false);
                  }}
                  className="text-xs"
                >
                  Clear reCAPTCHA & Retry
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    storage.clearAll();
                    window.location.reload();
                  }}
                  className="text-xs"
                >
                  Clear Storage & Reload
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* reCAPTCHA container */}
        <div id="recaptcha-container"></div>
      </div>
    </div>
  );
};

export default Login;
