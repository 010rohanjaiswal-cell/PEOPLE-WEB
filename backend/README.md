# Freelancing Platform Backend

Backend API for the Freelancing Platform with CORS configuration and full authentication support.

## 🚀 Features

- ✅ **CORS Configuration**: Properly configured for frontend communication
- ✅ **JWT Authentication**: Secure token-based authentication
- ✅ **MongoDB Integration**: Connected to your production MongoDB
- ✅ **Role-based Access**: Client, Freelancer, and Admin roles
- ✅ **Verification System**: Freelancer document verification
- ✅ **Admin Panel**: Verification and withdrawal management

## 🔧 CORS Configuration

The backend is configured with proper CORS settings:

```javascript
app.use(cors({
  origin: [
    'http://localhost:3000',    // React dev server
    'http://localhost:3001',    // Alternative React dev server
    'https://your-frontend-domain.com'  // Production domain
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
```

## 📦 Installation

1. **Install dependencies**:
   ```bash
   cd backend
   npm install
   ```

2. **Environment Setup**:
   ```bash
   cp .env.example .env
   ```
   Update the `.env` file with your configuration.

3. **Start the server**:
   ```bash
   npm start
   # or for development
   npm run dev
   ```

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/authenticate` - Authenticate with Firebase token
- `POST /api/auth/logout` - Logout user
- `POST /api/auth/switch-role` - Switch user role
- `GET /api/auth/can-switch-role` - Check if user can switch role

### Users
- `POST /api/users/profile-setup` - Complete profile setup
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/update-profile` - Update profile
- `GET /api/users/active-jobs-status` - Check active jobs

### Freelancer
- `POST /api/freelancer/submit-verification` - Submit verification docs
- `GET /api/freelancer/verification-status` - Check verification status
- `GET /api/freelancer/wallet` - Get wallet information
- `POST /api/freelancer/request-withdrawal` - Request withdrawal

### Admin
- `GET /api/admin/freelancer-verifications` - Get pending verifications
- `POST /api/admin/approve-freelancer/:id` - Approve freelancer
- `POST /api/admin/reject-freelancer/:id` - Reject freelancer
- `GET /api/admin/withdrawal-requests` - Get withdrawal requests

## 🔗 Frontend Integration

Your frontend is already configured to work with this backend:

- **Base URL**: `https://freelancing-platform-backend-backup.onrender.com/api`
- **CORS**: Enabled for `http://localhost:3000` and `http://localhost:3001`
- **Authentication**: JWT token-based

## 🚀 Deployment

1. **Deploy to Render**:
   - Connect your GitHub repository
   - Set environment variables
   - Deploy automatically

2. **Environment Variables**:
   - `MONGODB_URI`: Your MongoDB connection string
   - `JWT_SECRET`: Your JWT secret key
   - `CLOUDINARY_*`: Your Cloudinary credentials
   - `ALLOWED_ORIGINS`: Comma-separated list of allowed origins

## ✅ CORS Issue Fixed

The CORS configuration in this backend will resolve the frontend communication issues. The backend now properly allows requests from your React development server.

## 🔧 Development

- **Port**: 3001 (configurable via PORT env variable)
- **Health Check**: `GET /health`
- **Logs**: Console logging for debugging
- **Error Handling**: Global error handler with proper HTTP status codes
