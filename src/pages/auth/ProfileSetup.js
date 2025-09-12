import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { profileSetupSchema } from '../../utils/validators';
import { userService } from '../../api/userService';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Label } from '../../components/common/Label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/common/Card';
import { User, Upload, ArrowRight, Camera } from 'lucide-react';

const ProfileSetup = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [previewImage, setPreviewImage] = useState(null);

  const { phoneNumber, role, isNewUser } = location.state || {};

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue
  } = useForm({
    resolver: yupResolver(profileSetupSchema)
  });

  const fullNameValue = watch('fullName');
  const profilePhotoValue = watch('profilePhoto');

  // Redirect if no role
  React.useEffect(() => {
    if (!role) {
      console.log('❌ No role found, redirecting to login');
      navigate('/login');
    } else {
      console.log('✅ Role found:', role);
    }
  }, [role, navigate]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setValue('profilePhoto', file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewImage(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const openCamera = () => {
    // Check if device supports camera capture
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
      // Mobile: Use camera capture
      const cameraInput = document.createElement('input');
      cameraInput.type = 'file';
      cameraInput.accept = 'image/*';
      cameraInput.capture = 'environment'; // Use back camera
      cameraInput.onchange = handleImageChange;
      cameraInput.click();
    } else {
      // Desktop: Show message and fallback to gallery
      alert('Camera capture is not supported on desktop. Please use the Gallery button to select a photo from your computer.');
      openGallery();
    }
  };

  const openGallery = () => {
    // Create a new input element for gallery
    const galleryInput = document.createElement('input');
    galleryInput.type = 'file';
    galleryInput.accept = 'image/*';
    galleryInput.onchange = handleImageChange;
    galleryInput.click();
  };

  const onSubmit = async (data) => {
    setLoading(true);
    setError('');

    try {
      console.log('🚀 Starting profile setup with data:', data);
      console.log('👤 Current role:', role);
      
      const result = await userService.profileSetup(data, role);
      
      console.log('📋 Profile setup result:', result);
      
      if (result.success) {
        // Update the AuthContext with the new user data
        console.log('🔄 Updating AuthContext with user data:', result.user);
        updateUser(result.user);
        
        // Wait a moment for the context to update
        setTimeout(() => {
          console.log('✅ Profile setup completed, navigating to dashboard');
          console.log('👤 Updated user data:', result.user);
          
          // Navigate to appropriate dashboard based on role
          if (role === 'client') {
            console.log('🎯 Navigating to client dashboard');
            navigate('/client/dashboard');
          } else if (role === 'freelancer') {
            console.log('🎯 Navigating to freelancer verification');
            navigate('/freelancer/verification');
          } else if (role === 'admin') {
            console.log('🎯 Navigating to admin dashboard');
            navigate('/admin/dashboard');
          }
        }, 100);
      } else {
        setError(result.message || 'Profile setup failed');
      }
    } catch (error) {
      console.error('Error setting up profile:', error);
      setError(error.message || 'Profile setup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getRoleDisplayName = (role) => {
    switch (role) {
      case 'client': return 'Client';
      case 'freelancer': return 'Freelancer';
      case 'admin': return 'Admin';
      default: return 'User';
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-lg border border-gray-200">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-6">
              <User className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-3xl font-bold text-gray-900">Complete Your Profile</CardTitle>
            <CardDescription className="text-gray-600 text-lg">
              Set up your {getRoleDisplayName(role)} profile
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Profile Photo Upload */}
              <div className="space-y-2">
                <Label>Profile Photo</Label>
                <div className="flex flex-col items-center space-y-4">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border-2 border-dashed border-gray-300">
                      {previewImage ? (
                        <img
                          src={previewImage}
                          alt="Profile preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Camera className="w-8 h-8 text-gray-400" />
                      )}
                    </div>
                  </div>
                  
                  {/* Camera and Gallery Buttons */}
                  <div className="flex space-x-3">
                    <button
                      type="button"
                      onClick={openCamera}
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Camera className="w-4 h-4" />
                      <span className="text-sm font-medium">
                        {/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) 
                          ? 'Camera' 
                          : 'Camera (Mobile Only)'}
                      </span>
                    </button>
                    
                    <button
                      type="button"
                      onClick={openGallery}
                      className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      <Upload className="w-4 h-4" />
                      <span className="text-sm font-medium">Gallery</span>
                    </button>
                  </div>
                  
                  <p className="text-sm text-muted-foreground text-center">
                    Take a photo or choose from gallery
                  </p>
                </div>
                {errors.profilePhoto && (
                  <p className="text-sm text-destructive">{errors.profilePhoto.message}</p>
                )}
              </div>

              {/* Full Name */}
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Enter your full name"
                  {...register('fullName')}
                  disabled={loading}
                />
                {errors.fullName && (
                  <p className="text-sm text-destructive">{errors.fullName.message}</p>
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
                disabled={!fullNameValue || !profilePhotoValue || loading}
              >
                {loading ? 'Setting up profile...' : 'Complete Setup'}
                {!loading && <ArrowRight className="w-4 h-4 ml-2" />}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                This information will be used to create your {getRoleDisplayName(role)} profile
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProfileSetup;
