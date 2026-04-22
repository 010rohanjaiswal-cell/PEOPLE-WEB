# 🔗 Backend API Endpoints Specification

This document lists all the backend API endpoints that the frontend application expects to be implemented.

## 🔐 Authentication Endpoints

### `POST /api/auth/authenticate`
**Purpose**: Authenticate user with Firebase ID token and assign role
**Headers**: `Content-Type: application/json`
**Body**:
```json
{
  "idToken": "firebase_id_token",
  "role": "client" | "freelancer" | "admin"
}
```
**Response**:
```json
{
  "success": true,
  "token": "jwt_token",
  "user": {
    "id": "user_id",
    "phone": "+91xxxxxxxxxx",
    "role": "client" | "freelancer" | "admin",
    "fullName": "User Name",
    "profilePhoto": "url",
    "isVerified": boolean
  },
  "needsProfileSetup": boolean,
  "isNewUser": boolean
}
```

### `POST /api/auth/logout`
**Purpose**: Logout user and invalidate token
**Headers**: `Authorization: Bearer <jwt_token>`
**Response**:
```json
{
  "success": true
}
```

### `POST /api/auth/switch-role`
**Purpose**: Switch user role (Client ↔ Freelancer)
**Headers**: `Authorization: Bearer <jwt_token>`
**Body**:
```json
{
  "role": "client" | "freelancer"
}
```
**Response**:
```json
{
  "success": true,
  "user": { ... }
}
```

---

## 👤 User Management Endpoints

### `POST /api/users/profile-setup`
**Purpose**: Complete profile setup for new users
**Headers**: `Authorization: Bearer <jwt_token>`, `Content-Type: multipart/form-data`
**Body**: FormData
```
fullName: string
profilePhoto: File
```
**Response**:
```json
{
  "success": true,
  "user": { ... }
}
```

### `GET /api/users/profile`
**Purpose**: Get user profile information
**Headers**: `Authorization: Bearer <jwt_token>`
**Response**:
```json
{
  "success": true,
  "user": { ... }
}
```

### `PUT /api/users/update-profile`
**Purpose**: Update user profile
**Headers**: `Authorization: Bearer <jwt_token>`, `Content-Type: multipart/form-data`
**Body**: FormData
```
fullName?: string
profilePhoto?: File
```
**Response**:
```json
{
  "success": true,
  "user": { ... }
}
```

### `GET /api/users/profile-setup-status`
**Purpose**: Check if user has completed profile setup
**Headers**: `Authorization: Bearer <jwt_token>`
**Response**:
```json
{
  "success": true,
  "isSetupComplete": boolean
}
```

### `GET /api/users/active-jobs-status`
**Purpose**: Check if user can switch roles (no active jobs)
**Headers**: `Authorization: Bearer <jwt_token>`
**Response**:
```json
{
  "success": true,
  "canSwitchRole": boolean,
  "activeJobsCount": number,
  "message": "You still have an active job. Complete it before switching role."
}
```

---

## 👤 Client Endpoints

### `POST /api/client/post-job`
**Purpose**: Post a new job
**Headers**: `Authorization: Bearer <jwt_token>`
**Body**:
```json
{
  "title": "Job Title",
  "description": "Job Description",
  "budget": 1000,
  "category": "Web Development",
  "deadline": "2024-01-15",
  "location": "Remote"
}
```
**Response**:
```json
{
  "success": true,
  "job": {
    "id": "job_id",
    "title": "Job Title",
    "description": "Job Description",
    "budget": 1000,
    "category": "Web Development",
    "deadline": "2024-01-15",
    "status": "open",
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

### `GET /api/client/my-jobs`
**Purpose**: Get client's active jobs with offers
**Headers**: `Authorization: Bearer <jwt_token>`
**Response**:
```json
{
  "success": true,
  "jobs": [
    {
      "id": "job_id",
      "title": "Job Title",
      "description": "Job Description",
      "budget": 1000,
      "status": "open" | "in_progress" | "completed",
      "deadline": "2024-01-15",
      "offers": [
        {
          "freelancerId": "freelancer_id",
          "freelancerName": "Freelancer Name",
          "amount": 800,
          "message": "I can complete this in 3 days"
        }
      ]
    }
  ]
}
```

### `GET /api/client/job-history`
**Purpose**: Get client's completed jobs
**Headers**: `Authorization: Bearer <jwt_token>`
**Response**:
```json
{
  "success": true,
  "jobs": [
    {
      "id": "job_id",
      "title": "Job Title",
      "description": "Job Description",
      "budget": 1000,
      "status": "completed",
      "completedAt": "2024-01-10T00:00:00Z",
      "freelancerName": "Freelancer Name"
    }
  ]
}
```

### `POST /api/client/accept-offer/:jobId`
**Purpose**: Accept a freelancer's offer
**Headers**: `Authorization: Bearer <jwt_token>`
**Body**:
```json
{
  "freelancerId": "freelancer_id"
}
```
**Response**:
```json
{
  "success": true,
  "message": "Offer accepted successfully"
}
```

### `POST /api/client/reject-offer/:jobId`
**Purpose**: Reject a freelancer's offer
**Headers**: `Authorization: Bearer <jwt_token>`
**Body**:
```json
{
  "freelancerId": "freelancer_id"
}
```
**Response**:
```json
{
  "success": true,
  "message": "Offer rejected"
}
```

### `POST /api/client/pay/:jobId`
**Purpose**: Process payment for completed job
**Headers**: `Authorization: Bearer <jwt_token>`
**Body**:
```json
{
  "paymentMethod": "upi",
  "upiProvider": "phonepe",
  "amount": 1000
}
```
**Response**:
```json
{
  "success": true,
  "paymentId": "payment_id",
  "paymentUrl": "upi://pay?pa=merchant@paytm&pn=Merchant&am=1000&cu=INR"
}
```

---

## 👷 Freelancer Endpoints

### `POST /api/freelancer/submit-verification`
**Purpose**: Submit verification documents
**Headers**: `Authorization: Bearer <jwt_token>`, `Content-Type: multipart/form-data`
**Body**: FormData
```
fullName: string
dateOfBirth: string
gender: string
address: string
aadhaarFront: File
aadhaarBack: File
panCard: File
```
**Response**:
```json
{
  "success": true,
  "message": "Verification documents submitted successfully"
}
```

### `GET /api/freelancer/verification-status`
**Purpose**: Check verification status
**Headers**: `Authorization: Bearer <jwt_token>`
**Response**:
```json
{
  "success": true,
  "data": {
    "status": "pending" | "approved" | "rejected",
    "submittedAt": "2024-01-01T00:00:00Z",
    "reviewedAt": "2024-01-02T00:00:00Z",
    "rejectionReason": "Documents not clear"
  }
}
```

### `GET /api/jobs/available`
**Purpose**: Get available jobs for freelancers
**Headers**: `Authorization: Bearer <jwt_token>`
**Query Parameters**:
- `category`: string (optional)
- `minBudget`: number (optional)
- `maxBudget`: number (optional)
- `location`: string (optional)
**Response**:
```json
{
  "success": true,
  "jobs": [
    {
      "id": "job_id",
      "title": "Job Title",
      "description": "Job Description",
      "budget": 1000,
      "category": "Web Development",
      "deadline": "2024-01-15",
      "location": "Remote",
      "clientName": "Client Name",
      "status": "open"
    }
  ]
}
```

### `GET /api/freelancer/assigned-jobs`
**Purpose**: Get freelancer's assigned jobs
**Headers**: `Authorization: Bearer <jwt_token>`
**Response**:
```json
{
  "success": true,
  "jobs": [
    {
      "id": "job_id",
      "title": "Job Title",
      "description": "Job Description",
      "budget": 1000,
      "status": "in_progress" | "completed",
      "deadline": "2024-01-15",
      "clientName": "Client Name",
      "assignedAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### `POST /api/freelancer/pickup-job/:jobId`
**Purpose**: Pick up a job (direct assignment)
**Headers**: `Authorization: Bearer <jwt_token>`
**Response**:
```json
{
  "success": true,
  "message": "Job picked up successfully"
}
```

### `POST /api/freelancer/make-offer/:jobId`
**Purpose**: Make an offer for a job
**Headers**: `Authorization: Bearer <jwt_token>`
**Body**:
```json
{
  "amount": 800,
  "message": "I can complete this in 3 days"
}
```
**Response**:
```json
{
  "success": true,
  "message": "Offer submitted successfully"
}
```

### `POST /api/freelancer/mark-complete/:jobId`
**Purpose**: Mark job as complete
**Headers**: `Authorization: Bearer <jwt_token>`
**Body**:
```json
{
  "completionNotes": "Job completed successfully"
}
```
**Response**:
```json
{
  "success": true,
  "message": "Job marked as complete"
}
```

### `GET /api/freelancer/wallet`
**Purpose**: Get wallet balance and transactions
**Headers**: `Authorization: Bearer <jwt_token>`
**Response**:
```json
{
  "success": true,
  "data": {
    "balance": 5000,
    "transactions": [
      {
        "id": "transaction_id",
        "type": "credit" | "debit",
        "amount": 1000,
        "description": "Payment for job completion",
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ]
  }
}
```

### `POST /api/freelancer/request-withdrawal`
**Purpose**: Request withdrawal from wallet
**Headers**: `Authorization: Bearer <jwt_token>`
**Body**:
```json
{
  "amount": 2000,
  "upiId": "user@paytm"
}
```
**Response**:
```json
{
  "success": true,
  "withdrawalId": "withdrawal_id",
  "message": "Withdrawal request submitted"
}
```

### `GET /api/freelancer/withdrawal-history`
**Purpose**: Get withdrawal request history
**Headers**: `Authorization: Bearer <jwt_token>`
**Response**:
```json
{
  "success": true,
  "withdrawals": [
    {
      "id": "withdrawal_id",
      "amount": 2000,
      "upiId": "user@paytm",
      "status": "pending" | "approved" | "rejected",
      "requestedAt": "2024-01-01T00:00:00Z",
      "processedAt": "2024-01-02T00:00:00Z"
    }
  ]
}
```

---

## 🛠 Admin Endpoints

### `GET /api/admin/freelancer-verifications`
**Purpose**: Get freelancer verification requests
**Headers**: `Authorization: Bearer <jwt_token>`
**Query Parameters**:
- `status`: "pending" | "approved" | "rejected" (optional)
**Response**:
```json
{
  "success": true,
  "verifications": [
    {
      "id": "verification_id",
      "userId": "user_id",
      "fullName": "User Name",
      "phone": "+91xxxxxxxxxx",
      "status": "pending",
      "submittedAt": "2024-01-01T00:00:00Z",
      "documents": {
        "aadhaarFront": "document_url",
        "aadhaarBack": "document_url",
        "panCard": "document_url"
      }
    }
  ]
}
```

### `POST /api/admin/approve-freelancer/:id`
**Purpose**: Approve freelancer verification
**Headers**: `Authorization: Bearer <jwt_token>`
**Response**:
```json
{
  "success": true,
  "message": "Freelancer verification approved"
}
```

### `POST /api/admin/reject-freelancer/:id`
**Purpose**: Reject freelancer verification
**Headers**: `Authorization: Bearer <jwt_token>`
**Body**:
```json
{
  "reason": "Documents not clear"
}
```
**Response**:
```json
{
  "success": true,
  "message": "Freelancer verification rejected"
}
```

### `GET /api/admin/withdrawal-requests`
**Purpose**: Get withdrawal requests
**Headers**: `Authorization: Bearer <jwt_token>`
**Query Parameters**:
- `status`: "pending" | "approved" | "rejected" (optional)
**Response**:
```json
{
  "success": true,
  "withdrawals": [
    {
      "id": "withdrawal_id",
      "userId": "user_id",
      "freelancerName": "Freelancer Name",
      "amount": 2000,
      "upiId": "user@paytm",
      "status": "pending",
      "requestedAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### `POST /api/admin/approve-withdrawal/:id`
**Purpose**: Approve withdrawal request
**Headers**: `Authorization: Bearer <jwt_token>`
**Response**:
```json
{
  "success": true,
  "message": "Withdrawal approved and processed"
}
```

### `POST /api/admin/reject-withdrawal/:id`
**Purpose**: Reject withdrawal request
**Headers**: `Authorization: Bearer <jwt_token>`
**Body**:
```json
{
  "reason": "Invalid UPI ID"
}
```
**Response**:
```json
{
  "success": true,
  "message": "Withdrawal request rejected"
}
```

### `GET /api/admin/dashboard-stats`
**Purpose**: Get admin dashboard statistics
**Headers**: `Authorization: Bearer <jwt_token>`
**Response**:
```json
{
  "success": true,
  "stats": {
    "pendingVerifications": 5,
    "pendingWithdrawals": 3,
    "totalUsers": 100,
    "activeJobs": 25
  }
}
```

---

## 🚦 Error Responses

All endpoints should return consistent error responses:

### Authentication Errors
```json
{
  "success": false,
  "error": "INVALID_TOKEN" | "TOKEN_EXPIRED" | "UNAUTHORIZED",
  "message": "Authentication failed"
}
```

### Validation Errors
```json
{
  "success": false,
  "error": "VALIDATION_ERROR",
  "message": "Validation failed",
  "fields": {
    "fieldName": "error message"
  }
}
```

### Business Logic Errors
```json
{
  "success": false,
  "error": "BUSINESS_ERROR",
  "message": "You still have an active job. Complete it before switching role."
}
```

### HTTP Status Codes
- `200`: Success
- `201`: Created
- `400`: Bad Request (validation errors)
- `401`: Unauthorized (token issues)
- `403`: Forbidden (role restrictions)
- `404`: Not Found
- `500`: Internal Server Error

---

## 🔐 Authentication Headers

All authenticated requests must include:
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

For file uploads:
```
Authorization: Bearer <jwt_token>
Content-Type: multipart/form-data
```

---

## 📊 Database Schema Hints

### Users Table
- `id`, `phone`, `role`, `fullName`, `profilePhoto`, `isVerified`, `createdAt`, `updatedAt`

### Jobs Table
- `id`, `clientId`, `title`, `description`, `budget`, `category`, `deadline`, `location`, `status`, `createdAt`, `updatedAt`

### Offers Table
- `id`, `jobId`, `freelancerId`, `amount`, `message`, `status`, `createdAt`

### Verifications Table
- `id`, `userId`, `status`, `documents`, `submittedAt`, `reviewedAt`, `rejectionReason`

### Wallet Table
- `id`, `userId`, `balance`, `createdAt`, `updatedAt`

### Transactions Table
- `id`, `userId`, `type`, `amount`, `description`, `createdAt`

### Withdrawals Table
- `id`, `userId`, `amount`, `upiId`, `status`, `requestedAt`, `processedAt`, `reason`

This specification provides a complete guide for implementing the backend API that the frontend application expects.
