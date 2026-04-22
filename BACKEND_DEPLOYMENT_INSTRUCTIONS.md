# Backend Deployment Instructions for `https://people-web-5hqi.onrender.com`

## 🎯 Goal
Deploy the backend service to `https://people-web-5hqi.onrender.com/api`

## 📋 Steps to Deploy Backend

### Option 1: Deploy Backend to Existing Render Service

If `people-web-5hqi` is already a Render service:

1. **Go to Render Dashboard**
   - Navigate to: https://dashboard.render.com
   - Find the service: `people-web-5hqi`

2. **Check Service Type**
   - If it's a **Web Service**: It should be running the backend
   - If it's a **Static Site**: You need to create a new Web Service for the backend

3. **Update Environment Variables**
   - Go to Environment tab
   - Set these variables:
     ```
     NODE_ENV=production
     PORT=10000
     MONGODB_URI=your-mongodb-connection-string
     JWT_SECRET=your-jwt-secret
     ALLOWED_ORIGINS=https://www.people.com.de,http://www.people.com.de,https://people.com.de,https://people-web-5hqi.onrender.com
     FRONTEND_URL=https://www.people.com.de
     PAYMENT_REDIRECT_URL=https://people-web-5hqi.onrender.com/payment/callback
     ```

4. **Update Build Settings**
   - Root Directory: `backend`
   - Build Command: `npm install`
   - Start Command: `npm start`

5. **Redeploy**
   - Click "Manual Deploy" → "Deploy latest commit"
   - Wait for deployment to complete

### Option 2: Create New Backend Service

If `people-web-5hqi` is only the frontend:

1. **Create New Web Service**
   - Click "New" → "Web Service"
   - Connect your GitHub repository
   - Name: `people-web-backend` (or any name)
   - Region: Choose closest to your users

2. **Configure Service**
   - Root Directory: `backend`
   - Environment: `Node`
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Plan: Choose appropriate plan

3. **Set Environment Variables**
   ```
   NODE_ENV=production
   PORT=10000
   MONGODB_URI=your-mongodb-connection-string
   JWT_SECRET=your-jwt-secret
   ALLOWED_ORIGINS=https://www.people.com.de,http://www.people.com.de,https://people.com.de
   FRONTEND_URL=https://www.people.com.de
   PAYMENT_REDIRECT_URL=https://people-web-backend.onrender.com/payment/callback
   ```

4. **Update Frontend API URL**
   - After deployment, Render will give you a URL like: `https://people-web-backend-xxxx.onrender.com`
   - Update frontend `.env` to use: `REACT_APP_API_BASE_URL=https://people-web-backend-xxxx.onrender.com/api`

## ✅ Verify Backend is Running

After deployment, test the backend:

```bash
# Health check
curl https://people-web-5hqi.onrender.com/health

# CORS test
curl https://people-web-5hqi.onrender.com/api/cors-test

# Should return JSON response, not 502 error
```

## 🔧 Troubleshooting

### If you get 502 Bad Gateway:
1. Check Render logs for errors
2. Verify `PORT` environment variable is set (Render uses port from `$PORT` env var)
3. Ensure `npm start` command works locally
4. Check MongoDB connection string is correct

### If you get CORS errors:
1. Verify `ALLOWED_ORIGINS` includes `https://www.people.com.de`
2. Check backend logs for CORS messages
3. Ensure backend code has latest CORS configuration

### If backend doesn't start:
1. Check `backend/package.json` has a `start` script
2. Verify all dependencies are in `package.json`
3. Check Render build logs for npm install errors

## 📝 Important Notes

- **Port**: Render provides port via `$PORT` environment variable. Backend should use `process.env.PORT || 3001`
- **Health Check**: Backend should have a `/health` endpoint for Render health checks
- **Build Time**: First deployment takes 5-10 minutes
- **Cold Starts**: Free tier services spin down after 15 minutes of inactivity

