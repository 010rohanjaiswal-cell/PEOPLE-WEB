import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { freelancerVerificationSchema } from '../../utils/validators';
import { freelancerService } from '../../api/freelancerService';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Label } from '../../components/common/Label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/common/Card';
import { 
  Shield, 
  Upload, 
  CheckCircle, 
  Clock, 
  XCircle, 
  Camera,
  FileText,
  User
} from 'lucide-react';

const FreelancerVerification = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [previewImages, setPreviewImages] = useState({});

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue
  } = useForm({
    resolver: yupResolver(freelancerVerificationSchema)
  });

  const watchedFields = watch();

  useEffect(() => {
    checkVerificationStatus();
  }, []);

  const checkVerificationStatus = async () => {
    try {
      setLoading(true);
      const result = await freelancerService.getVerificationStatus();
      
      if (result.success) {
        setVerificationStatus(result.data);
        
        // If already verified, redirect to dashboard
        if (result.data && result.data.status === 'approved') {
          navigate('/freelancer/dashboard');
        }
      }
    } catch (error) {
      console.error('Error checking verification status:', error);
      setError('Failed to check verification status');
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (field, file) => {
    if (file) {
      setValue(field, file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewImages(prev => ({
          ...prev,
          [field]: e.target.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data) => {
    setLoading(true);
    setError('');

    try {
      const result = await freelancerService.submitVerification(data);
      
      if (result.success) {
        setVerificationStatus({ status: 'pending' });
        setError('');
      } else {
        setError(result.message || 'Verification submission failed');
      }
    } catch (error) {
      console.error('Error submitting verification:', error);
      setError(error.message || 'Verification submission failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-8 h-8 text-green-500" />;
      case 'rejected':
        return <XCircle className="w-8 h-8 text-red-500" />;
      case 'pending':
        return <Clock className="w-8 h-8 text-yellow-500" />;
      default:
        return <Shield className="w-8 h-8 text-gray-500" />;
    }
  };

  const getStatusMessage = (status) => {
    switch (status) {
      case 'approved':
        return 'Your verification has been approved! You can now access the freelancer dashboard.';
      case 'rejected':
        return 'Your verification was rejected. Please review the requirements and resubmit your documents.';
      case 'pending':
        return 'Your verification is under review. We will notify you once it\'s processed.';
      default:
        return 'Please complete your verification to access freelancer features.';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'rejected':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'pending':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  // If verification is pending or approved, show status
  if (verificationStatus && verificationStatus.status !== 'rejected' && verificationStatus.status !== null) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="shadow-lg border border-gray-200">
            <CardHeader className="text-center">
              <div className="mx-auto mb-6">
                {getStatusIcon(verificationStatus.status)}
              </div>
              <CardTitle className="text-3xl font-bold text-gray-900">
                Verification {verificationStatus.status === 'approved' ? 'Approved' : 'Pending'}
              </CardTitle>
              <CardDescription className="text-gray-600 text-lg">
                {getStatusMessage(verificationStatus.status)}
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <div className={`p-4 rounded-md border ${getStatusColor(verificationStatus.status)}`}>
                <p className="text-sm font-medium">
                  Status: {verificationStatus.status?.charAt(0).toUpperCase() + verificationStatus.status?.slice(1)}
                </p>
                {verificationStatus.submittedAt && (
                  <p className="text-xs mt-1">
                    Submitted on: {new Date(verificationStatus.submittedAt).toLocaleDateString()}
                  </p>
                )}
                {verificationStatus.reviewedAt && (
                  <p className="text-xs mt-1">
                    Reviewed on: {new Date(verificationStatus.reviewedAt).toLocaleDateString()}
                  </p>
                )}
              </div>

              {verificationStatus.status === 'approved' && (
                <Button 
                  className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg" 
                  onClick={() => navigate('/freelancer/dashboard')}
                >
                  Go to Dashboard
                </Button>
              )}

              {verificationStatus.status === 'pending' && (
                <div className="mt-4 text-center">
                  <p className="text-sm text-muted-foreground">
                    Please wait while we review your documents. This usually takes 1-2 business days.
                  </p>
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
      <div className="w-full max-w-2xl">
        <Card className="shadow-lg border border-gray-200">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-6">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-3xl font-bold text-gray-900">Freelancer Verification</CardTitle>
            <CardDescription className="text-gray-600 text-lg">
              Complete your verification to start freelancing
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  Personal Information
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth">Date of Birth</Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      {...register('dateOfBirth')}
                      disabled={loading}
                    />
                    {errors.dateOfBirth && (
                      <p className="text-sm text-destructive">{errors.dateOfBirth.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender</Label>
                    <select
                      id="gender"
                      {...register('gender')}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      disabled={loading}
                    >
                      <option value="">Select gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                    {errors.gender && (
                      <p className="text-sm text-destructive">{errors.gender.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <textarea
                    id="address"
                    placeholder="Enter your complete address"
                    {...register('address')}
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    disabled={loading}
                  />
                  {errors.address && (
                    <p className="text-sm text-destructive">{errors.address.message}</p>
                  )}
                </div>
              </div>

              {/* Document Upload */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  Document Verification
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Aadhaar Front */}
                  <div className="space-y-2">
                    <Label>Aadhaar Card (Front)</Label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center relative">
                      {previewImages.aadhaarFront ? (
                        <img
                          src={previewImages.aadhaarFront}
                          alt="Aadhaar front preview"
                          className="w-full h-32 object-cover rounded"
                        />
                      ) : (
                        <div className="flex flex-col items-center">
                          <Camera className="w-8 h-8 text-gray-400 mb-2" />
                          <p className="text-sm text-gray-500">Click to upload</p>
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageChange('aadhaarFront', e.target.files[0])}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                    </div>
                    {errors.aadhaarFront && (
                      <p className="text-sm text-destructive">{errors.aadhaarFront.message}</p>
                    )}
                  </div>

                  {/* Aadhaar Back */}
                  <div className="space-y-2">
                    <Label>Aadhaar Card (Back)</Label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center relative">
                      {previewImages.aadhaarBack ? (
                        <img
                          src={previewImages.aadhaarBack}
                          alt="Aadhaar back preview"
                          className="w-full h-32 object-cover rounded"
                        />
                      ) : (
                        <div className="flex flex-col items-center">
                          <Camera className="w-8 h-8 text-gray-400 mb-2" />
                          <p className="text-sm text-gray-500">Click to upload</p>
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageChange('aadhaarBack', e.target.files[0])}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                    </div>
                    {errors.aadhaarBack && (
                      <p className="text-sm text-destructive">{errors.aadhaarBack.message}</p>
                    )}
                  </div>

                  {/* PAN Card */}
                  <div className="space-y-2 md:col-span-2">
                    <Label>PAN Card</Label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center relative">
                      {previewImages.panCard ? (
                        <img
                          src={previewImages.panCard}
                          alt="PAN card preview"
                          className="w-full h-32 object-cover rounded"
                        />
                      ) : (
                        <div className="flex flex-col items-center">
                          <Camera className="w-8 h-8 text-gray-400 mb-2" />
                          <p className="text-sm text-gray-500">Click to upload</p>
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageChange('panCard', e.target.files[0])}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                    </div>
                    {errors.panCard && (
                      <p className="text-sm text-destructive">{errors.panCard.message}</p>
                    )}
                  </div>
                </div>
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
                disabled={loading}
              >
                {loading ? 'Submitting...' : 'Submit Verification'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Your documents will be reviewed within 1-2 business days
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FreelancerVerification;
