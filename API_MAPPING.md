# 🔗 Frontend-Backend API Mapping

This document maps every screen and user action to its corresponding backend API endpoint.

## 📱 Screen-by-Screen API Mapping

### 🔐 Authentication Flow

#### **1. Login Screen (`/login`)**
- **File**: `src/pages/auth/Login.js`
- **User Action**: Enter mobile number, click "Send OTP"
- **API Call**: None (Firebase handles OTP sending)
- **Firebase**: `signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier)`

#### **2. OTP Screen (`/otp`)**
- **File**: `src/pages/auth/OTP.js`
- **User Action**: Enter OTP, select role (Client/Freelancer/Admin)
- **API Call**: 
  ```javascript
  POST /api/auth/authenticate
  Body: {
    idToken: "firebase_id_token",
    role: "client" | "freelancer" | "admin"
  }
  Response: {
    success: true,
    token: "jwt_token",
    user: { ... },
    needsProfileSetup: boolean,
    isNewUser: boolean
  }
  ```

#### **3. Profile Setup (`/profile-setup`)**
- **File**: `src/pages/auth/ProfileSetup.js`
- **User Action**: Upload profile photo, enter full name
- **API Call**:
  ```javascript
  POST /api/users/profile-setup
  Body: FormData {
    fullName: string,
    profilePhoto: File
  }
  Response: {
    success: true,
    user: { ... }
  }
  ```

---

### 👤 Client Flow

#### **4. Client Dashboard (`/client/dashboard`)**
- **File**: `src/pages/client/Dashboard.js`

##### **Tab: Post Job**
- **User Action**: Fill job form, click "Post Job"
- **API Call**:
  ```javascript
  POST /api/client/post-job
  Body: {
    title: string,
    description: string,
    budget: number,
    category: string,
    deadline: string,
    location?: string
  }
  Response: {
    success: true,
    job: { ... }
  }
  ```

##### **Tab: My Jobs**
- **User Action**: View active jobs, manage offers
- **API Calls**:
  ```javascript
  // Load active jobs
  GET /api/client/my-jobs
  Response: {
    success: true,
    jobs: [
      {
        id: string,
        title: string,
        description: string,
        budget: number,
        status: string,
        offers: [
          {
            freelancerId: string,
            freelancerName: string,
            amount: number,
            message?: string
          }
        ]
      }
    ]
  }

  // Accept offer
  POST /api/client/accept-offer/:jobId
  Body: {
    freelancerId: string
  }
  Response: {
    success: true,
    message: string
  }

  // Reject offer
  POST /api/client/reject-offer/:jobId
  Body: {
    freelancerId: string
  }
  Response: {
    success: true,
    message: string
  }
  ```

##### **Tab: History**
- **User Action**: View completed jobs
- **API Call**:
  ```javascript
  GET /api/client/job-history
  Response: {
    success: true,
    jobs: [
      {
        id: string,
        title: string,
        description: string,
        budget: number,
        status: "completed",
        completedAt: string,
        freelancerName: string
      }
    ]
  }
  ```

##### **Tab: Profile**
- **User Action**: Update profile, switch role, logout
- **API Calls**:
  ```javascript
  // Update profile
  PUT /api/users/update-profile
  Body: FormData {
    fullName?: string,
    profilePhoto?: File
  }
  Response: {
    success: true,
    user: { ... }
  }

  // Check if can switch role
  GET /api/users/active-jobs-status
  Response: {
    success: true,
    canSwitchRole: boolean,
    activeJobsCount: number,
    message?: string
  }

  // Switch role
  POST /api/auth/switch-role
  Body: {
    role: "freelancer"
  }
  Response: {
    success: true,
    user: { ... }
  }

  // Logout
  POST /api/auth/logout
  Response: {
    success: true
  }
  ```

##### **Payment (UPI Integration)**
- **User Action**: Pay for completed job
- **API Call**:
  ```javascript
  POST /api/client/pay/:jobId
  Body: {
    paymentMethod: "upi",
    upiProvider: "phonepe",
    amount: number
  }
  Response: {
    success: true,
    paymentId: string,
    paymentUrl?: string
  }
  ```

---

### 👷 Freelancer Flow

#### **5. Freelancer Verification (`/freelancer/verification`)**
- **File**: `src/pages/freelancer/Verification.js`

##### **Check Verification Status**
- **API Call**:
  ```javascript
  GET /api/freelancer/verification-status
  Response: {
    success: true,
    data: {
      status: "pending" | "approved" | "rejected",
      submittedAt?: string,
      reviewedAt?: string,
      rejectionReason?: string
    }
  }
  ```

##### **Submit Verification Documents**
- **User Action**: Upload documents, submit form
- **API Call**:
  ```javascript
  POST /api/freelancer/submit-verification
  Body: FormData {
    fullName: string,
    dateOfBirth: string,
    gender: string,
    address: string,
    aadhaarFront: File,
    aadhaarBack: File,
    panCard: File
  }
  Response: {
    success: true,
    message: string
  }
  ```

#### **6. Freelancer Dashboard (`/freelancer/dashboard`)**
- **File**: `src/pages/freelancer/Dashboard.js`

##### **Tab: Available Jobs**
- **User Action**: Browse jobs, pickup or make offer
- **API Calls**:
  ```javascript
  // Load available jobs
  GET /api/jobs/available
  Query Params: {
    category?: string,
    minBudget?: number,
    maxBudget?: number,
    location?: string
  }
  Response: {
    success: true,
    jobs: [
      {
        id: string,
        title: string,
        description: string,
        budget: number,
        category: string,
        deadline: string,
        location?: string,
        clientName: string,
        status: "open"
      }
    ]
  }

  // Pickup job (direct assignment)
  POST /api/freelancer/pickup-job/:jobId
  Response: {
    success: true,
    message: string
  }

  // Make offer
  POST /api/freelancer/make-offer/:jobId
  Body: {
    amount: number,
    message?: string
  }
  Response: {
    success: true,
    message: string
  }
  ```

##### **Tab: Assigned Jobs**
- **User Action**: View assigned jobs, mark complete
- **API Calls**:
  ```javascript
  // Load assigned jobs
  GET /api/freelancer/assigned-jobs
  Response: {
    success: true,
    jobs: [
      {
        id: string,
        title: string,
        description: string,
        budget: number,
        status: "in_progress" | "completed",
        deadline: string,
        clientName: string,
        assignedAt: string
      }
    ]
  }

  // Mark job complete
  POST /api/freelancer/mark-complete/:jobId
  Body: {
    completionNotes?: string
  }
  Response: {
    success: true,
    message: string
  }
  ```

##### **Tab: Wallet**
- **User Action**: View balance, request withdrawal
- **API Calls**:
  ```javascript
  // Get wallet balance and transactions
  GET /api/freelancer/wallet
  Response: {
    success: true,
    data: {
      balance: number,
      transactions: [
        {
          id: string,
          type: "credit" | "debit",
          amount: number,
          description: string,
          createdAt: string
        }
      ]
    }
  }

  // Request withdrawal
  POST /api/freelancer/request-withdrawal
  Body: {
    amount: number,
    upiId: string
  }
  Response: {
    success: true,
    withdrawalId: string,
    message: string
  }

  // Get withdrawal history
  GET /api/freelancer/withdrawal-history
  Response: {
    success: true,
    withdrawals: [
      {
        id: string,
        amount: number,
        upiId: string,
        status: "pending" | "approved" | "rejected",
        requestedAt: string,
        processedAt?: string
      }
    ]
  }
  ```

##### **Tab: Profile**
- **User Action**: Update profile, switch role, logout
- **API Calls**: Same as Client Profile tab

---

### 🛠 Admin Flow

#### **7. Admin CLI (`/admin/dashboard`)**
- **File**: `src/pages/admin/CLI.js`

##### **Tab: Verifications**
- **User Action**: Review and approve/reject freelancer verifications
- **API Calls**:
  ```javascript
  // Get pending verifications
  GET /api/admin/freelancer-verifications
  Query Params: {
    status?: "pending" | "approved" | "rejected"
  }
  Response: {
    success: true,
    verifications: [
      {
        id: string,
        userId: string,
        fullName: string,
        phone: string,
        status: string,
        submittedAt: string,
        documents: {
          aadhaarFront: string,
          aadhaarBack: string,
          panCard: string
        }
      }
    ]
  }

  // Approve verification
  POST /api/admin/approve-freelancer/:id
  Response: {
    success: true,
    message: string
  }

  // Reject verification
  POST /api/admin/reject-freelancer/:id
  Body: {
    reason: string
  }
  Response: {
    success: true,
    message: string
  }
  ```

##### **Tab: Withdrawals**
- **User Action**: Review and approve/reject withdrawal requests
- **API Calls**:
  ```javascript
  // Get pending withdrawals
  GET /api/admin/withdrawal-requests
  Query Params: {
    status?: "pending" | "approved" | "rejected"
  }
  Response: {
    success: true,
    withdrawals: [
      {
        id: string,
        userId: string,
        freelancerName: string,
        amount: number,
        upiId: string,
        status: string,
        requestedAt: string
      }
    ]
  }

  // Approve withdrawal
  POST /api/admin/approve-withdrawal/:id
  Response: {
    success: true,
    message: string
  }

  // Reject withdrawal
  POST /api/admin/reject-withdrawal/:id
  Body: {
    reason: string
  }
  Response: {
    success: true,
    message: string
  }
  ```

##### **Tab: Profile**
- **User Action**: View admin profile, logout
- **API Calls**: Same logout as Client/Freelancer

---

## 🔄 Role Switching Logic

### **Role Switch Check**
- **Trigger**: When user clicks "Switch Role" button
- **API Call**:
  ```javascript
  GET /api/users/active-jobs-status
  Response: {
    success: true,
    canSwitchRole: boolean,
    activeJobsCount: number,
    message?: "You still have an active job. Complete it before switching role."
  }
  ```

### **Role Switch Execution**
- **API Call**:
  ```javascript
  POST /api/auth/switch-role
  Body: {
    role: "client" | "freelancer"
  }
  Response: {
    success: true,
    user: { ... }
  }
  ```

---

## 🚦 Error Handling

### **Common Error Responses**
```javascript
// Authentication errors
{
  success: false,
  error: "INVALID_TOKEN" | "TOKEN_EXPIRED" | "UNAUTHORIZED",
  message: string
}

// Validation errors
{
  success: false,
  error: "VALIDATION_ERROR",
  message: string,
  fields: {
    fieldName: "error message"
  }
}

// Business logic errors
{
  success: false,
  error: "BUSINESS_ERROR",
  message: string
}
```

### **HTTP Status Codes**
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
```javascript
Headers: {
  "Authorization": "Bearer <jwt_token>",
  "Content-Type": "application/json" // or "multipart/form-data" for file uploads
}
```

---

## 📊 Data Flow Summary

### **Client Journey APIs**
```
Login → OTP → /auth/authenticate → /users/profile-setup → 
Client Dashboard → /client/post-job → /client/my-jobs → 
/client/accept-offer → /client/pay/:jobId → /client/job-history
```

### **Freelancer Journey APIs**
```
Login → OTP → /auth/authenticate → /users/profile-setup → 
/freelancer/submit-verification → /freelancer/verification-status → 
Freelancer Dashboard → /jobs/available → /freelancer/pickup-job → 
/freelancer/assigned-jobs → /freelancer/mark-complete → 
/freelancer/wallet → /freelancer/request-withdrawal
```

### **Admin Journey APIs**
```
Login → OTP → /auth/authenticate → /users/profile-setup → 
Admin CLI → /admin/freelancer-verifications → /admin/approve-freelancer → 
/admin/withdrawal-requests → /admin/approve-withdrawal
```

This mapping ensures that every user action in the frontend has a corresponding backend API call, making the integration seamless and predictable.
