import * as yup from 'yup';

// Phone number validation
export const phoneSchema = yup.object({
  phone: yup
    .string()
    .required('Phone number is required')
    .matches(/^\+91[6-9]\d{9}$/, 'Please enter a valid Indian mobile number starting with +91')
});

// OTP validation
export const otpSchema = yup.object({
  otp: yup
    .string()
    .required('OTP is required')
    .length(6, 'OTP must be 6 digits')
    .matches(/^\d{6}$/, 'OTP must contain only numbers')
});

// Profile setup validation
export const profileSetupSchema = yup.object({
  fullName: yup
    .string()
    .required('Full name is required')
    .min(2, 'Name must be at least 2 characters')
    .matches(/^[a-zA-Z\s]+$/, 'Name can only contain letters and spaces'),
  profilePhoto: yup
    .mixed()
    .required('Profile photo is required')
    .test('fileSize', 'File size must be less than 5MB', (value) => {
      return value && value.size <= 5 * 1024 * 1024;
    })
    .test('fileType', 'Only image files are allowed', (value) => {
      return value && ['image/jpeg', 'image/png', 'image/jpg'].includes(value.type);
    })
});

// Freelancer verification validation
export const freelancerVerificationSchema = yup.object({
  fullName: yup
    .string()
    .required('Full name is required')
    .min(2, 'Name must be at least 2 characters')
    .matches(/^[a-zA-Z\s]+$/, 'Name can only contain letters and spaces'),
  dateOfBirth: yup
    .date()
    .required('Date of birth is required')
    .test('age', 'You must be at least 18 years old', function(value) {
      const today = new Date();
      const birthDate = new Date(value);
      const age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        return age - 1 >= 18;
      }
      return age >= 18;
    }),
  gender: yup
    .string()
    .required('Gender is required')
    .oneOf(['Male', 'Female'], 'Please select a valid gender'),
  address: yup
    .string()
    .required('Address is required')
    .min(10, 'Address must be at least 10 characters'),
  aadhaarFront: yup
    .mixed()
    .required('Aadhaar front image is required')
    .test('fileSize', 'File size must be less than 5MB', (value) => {
      return value && value.size <= 5 * 1024 * 1024;
    })
    .test('fileType', 'Only image files are allowed', (value) => {
      return value && ['image/jpeg', 'image/png', 'image/jpg'].includes(value.type);
    }),
  aadhaarBack: yup
    .mixed()
    .required('Aadhaar back image is required')
    .test('fileSize', 'File size must be less than 5MB', (value) => {
      return value && value.size <= 5 * 1024 * 1024;
    })
    .test('fileType', 'Only image files are allowed', (value) => {
      return value && ['image/jpeg', 'image/png', 'image/jpg'].includes(value.type);
    }),
  panCard: yup
    .mixed()
    .required('PAN card image is required')
    .test('fileSize', 'File size must be less than 5MB', (value) => {
      return value && value.size <= 5 * 1024 * 1024;
    })
    .test('fileType', 'Only image files are allowed', (value) => {
      return value && ['image/jpeg', 'image/png', 'image/jpg'].includes(value.type);
    })
});

// Job posting validation
export const jobPostingSchema = yup.object({
  title: yup
    .string()
    .required('Job title is required')
    .min(5, 'Title must be at least 5 characters')
    .max(100, 'Title must be less than 100 characters'),
  description: yup
    .string()
    .required('Job description is required')
    .min(20, 'Description must be at least 20 characters')
    .max(1000, 'Description must be less than 1000 characters'),
  budget: yup
    .number()
    .required('Budget is required')
    .min(5, 'Minimum budget is ₹5')
    .max(1000000, 'Maximum budget is ₹10,00,000'),
  category: yup
    .string()
    .required('Category is required'),
  deadline: yup
    .date()
    .required('Deadline is required')
    .min(new Date(), 'Deadline must be in the future')
});

// Withdrawal request validation
export const withdrawalSchema = yup.object({
  amount: yup
    .number()
    .required('Amount is required')
    .min(100, 'Minimum withdrawal amount is ₹100')
    .max(50000, 'Maximum withdrawal amount is ₹50,000'),
  upiId: yup
    .string()
    .required('UPI ID is required')
    .matches(/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+$/, 'Please enter a valid UPI ID')
});
