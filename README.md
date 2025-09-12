# Freelance Platform Web Application

A comprehensive freelancing platform built with React.js, Firebase authentication, and full backend API integration. The platform supports both clients and freelancers with role-based access and includes admin functionality for verification and withdrawal management.

## 🚀 Features

### Authentication
- **Firebase Phone + OTP Authentication**: Secure mobile number verification
- **Multi-role Support**: Same phone number can be used for both Client and Freelancer roles
- **Role-based Access Control**: Different dashboards and features based on user role

### Client Features
- **Job Posting**: Create and manage job postings
- **Job Management**: View active jobs, accept/reject freelancer offers
- **Payment Integration**: Direct UPI payments via PhonePe
- **Job History**: Track completed projects

### Freelancer Features
- **Verification System**: Document verification (Aadhaar, PAN) for freelancers
- **Job Discovery**: Browse and apply for available jobs
- **Wallet System**: Track earnings and request withdrawals
- **Job Management**: Manage assigned projects

### Admin Features
- **Verification Management**: Approve/reject freelancer verifications
- **Withdrawal Management**: Process freelancer withdrawal requests
- **Platform Oversight**: Monitor platform activities

## 🛠 Tech Stack

- **Frontend**: React.js 18
- **Styling**: TailwindCSS + shadcn/ui components
- **Forms**: React Hook Form + Yup validation
- **Authentication**: Firebase (Phone + OTP only)
- **State Management**: React Context API
- **Routing**: React Router DOM
- **HTTP Client**: Axios
- **Storage**: localStorage for web

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd freelance-platform-web
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   ```
   
   Update the `.env` file with your Firebase configuration:
   ```env
   REACT_APP_FIREBASE_API_KEY=your_firebase_api_key
   REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   REACT_APP_FIREBASE_PROJECT_ID=your_project_id
   REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   REACT_APP_FIREBASE_APP_ID=your_app_id
   REACT_APP_API_BASE_URL=http://localhost:3001/api
   ```

4. **Start the development server**
   ```bash
   npm start
   ```

   The application will be available at `http://localhost:3000`

## 🔧 Firebase Setup

1. **Create a Firebase Project**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project
   - Enable Authentication with Phone provider

2. **Configure Authentication**
   - In Firebase Console, go to Authentication > Sign-in method
   - Enable Phone authentication
   - Add your domain to authorized domains

3. **Get Configuration**
   - Go to Project Settings > General
   - Add a web app and copy the configuration
   - Update your `.env` file with the configuration

## 🏗 Project Structure

```
src/
├── api/                    # API service layer
│   ├── authService.js      # Authentication API calls
│   ├── userService.js      # User profile management
│   ├── clientService.js    # Client-specific API calls
│   └── freelancerService.js # Freelancer-specific API calls
├── components/             # Reusable UI components
│   ├── forms/             # Form components
│   ├── modals/            # Modal components
│   ├── cards/             # Card components
│   └── common/            # Common UI components
├── pages/                 # Page components
│   ├── auth/              # Authentication pages
│   │   ├── Login.js       # Phone number input
│   │   ├── OTP.js         # OTP verification
│   │   └── ProfileSetup.js # Profile setup
│   ├── client/            # Client pages
│   │   └── Dashboard.js   # Client dashboard
│   ├── freelancer/        # Freelancer pages
│   │   ├── Verification.js # Document verification
│   │   └── Dashboard.js   # Freelancer dashboard
│   └── admin/             # Admin pages
│       └── CLI.js         # Admin dashboard
├── hooks/                 # Custom React hooks
├── utils/                 # Utility functions
│   ├── firebase.js        # Firebase configuration
│   ├── validators.js      # Form validation schemas
│   ├── storage.js         # Local storage utilities
│   └── cn.js              # Class name utility
├── context/               # React Context providers
│   ├── AuthContext.js     # Authentication context
│   └── RoleContext.js     # Role management context
└── styles/                # Global styles
    └── index.css          # TailwindCSS imports
```

## 🔐 Authentication Flow

1. **Login**: User enters mobile number (+91 format enforced)
2. **OTP Verification**: Firebase sends OTP, user verifies
3. **Role Selection**: New users choose Client/Freelancer/Admin role
4. **Profile Setup**: Complete profile with name and photo
5. **Dashboard Access**: Role-specific dashboard based on selection

## 👤 User Roles

### Client
- Post jobs and manage projects
- Accept/reject freelancer offers
- Make payments via UPI
- Cannot switch to freelancer if active jobs exist

### Freelancer
- Complete verification process (Aadhaar, PAN)
- Browse and apply for jobs
- Manage assigned projects
- Track earnings and request withdrawals
- Cannot switch to client if active jobs exist

### Admin
- Approve/reject freelancer verifications
- Process withdrawal requests
- Monitor platform activities

## 🔄 Role Switching

- Users can switch between Client and Freelancer roles
- **Restriction**: Cannot switch if active jobs exist
- Error message: "You still have an active job. Complete it before switching role."

## 💳 Payment Integration

- **Clients**: Direct UPI payments via PhonePe integration
- **Freelancers**: Earnings credited to wallet, withdrawal via UPI
- **No wallet for clients**: Direct payment model

## 🚀 Deployment

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Deploy to your preferred platform**
   - Vercel, Netlify, or any static hosting service
   - Update environment variables in your hosting platform

## 🔧 Backend Integration

The frontend is designed to work with a backend API. Update the `REACT_APP_API_BASE_URL` in your environment variables to point to your backend server.

### Required API Endpoints

- `POST /api/auth/authenticate` - Authenticate with Firebase token
- `POST /api/auth/logout` - Logout user
- `POST /api/auth/switch-role` - Switch user role
- `GET /api/auth/can-switch-role` - Check if user can switch role
- `POST /api/users/profile-setup` - Complete profile setup
- `GET /api/users/profile` - Get user profile
- `POST /api/client/post-job` - Post new job
- `GET /api/client/active-jobs` - Get active jobs
- `POST /api/freelancer/submit-verification` - Submit verification docs
- `GET /api/freelancer/verification-status` - Check verification status
- And many more...

## 📱 Mobile Responsiveness

The application is fully responsive and works on:
- Desktop computers
- Tablets
- Mobile phones

## 🔒 Security Features

- Firebase authentication with phone verification
- JWT token-based API authentication
- Role-based access control
- Input validation and sanitization
- Secure file upload handling

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the code comments

---

**Note**: This is a frontend application that requires a backend API to function fully. Make sure to set up the corresponding backend services for complete functionality.
