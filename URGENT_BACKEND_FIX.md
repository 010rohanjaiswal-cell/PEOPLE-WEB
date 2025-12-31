# 🚨 URGENT: Backend Not Running - 502 Error

## ❌ Problem
The backend at `https://people-web-5hqi.onrender.com` is returning **502 Bad Gateway**, which means:
- The service is not running
- The service crashed
- The service doesn't exist
- The service is configured incorrectly

## ✅ IMMEDIATE ACTION REQUIRED

### Step 1: Check Render Dashboard

1. Go to: **https://dashboard.render.com**
2. Look for a service named `people-web-5hqi` or similar
3. Check its status:
   - If **"Live"** → Check logs (Step 2)
   - If **"Failed"** → Check logs and fix errors
   - If **"Building"** → Wait for it to finish
   - If **NOT FOUND** → Create new service (Step 3)

### Step 2: Check Service Logs

1. Click on the service → **"Logs"** tab
2. Look for errors:
   - `❌ MongoDB connection error` → Fix MONGODB_URI
   - `Error: Cannot find module` → Missing dependencies
   - `Port already in use` → Port conflict
   - `🚀 Server running on port...` → Service is running (check URL)

### Step 3: Create Backend Service (If Not Exists)

**If you don't have a backend service:**

1. **Render Dashboard** → Click **"New +"** → **"Web Service"**
2. **Connect Repository**: Select `PEOPLE-WEB` from GitHub
3. **Configure Service**:
   ```
   Name: people-web-backend
   Region: (choose closest)
   Branch: main
   Root Directory: backend
   Runtime: Node
   Build Command: npm install
   Start Command: npm start
   Plan: Free (or your plan)
   ```
4. **Environment Variables**: Add ALL from `backend/.env.production`
5. **Create Service** → Wait 5-10 minutes for deployment

### Step 4: Verify Service Type

**IMPORTANT:** Make sure `people-web-5hqi` is a **Web Service** (backend), NOT a **Static Site** (frontend).

- **Web Service** = Backend (Node.js) ✅
- **Static Site** = Frontend (HTML/CSS/JS) ❌

If it's a Static Site, you need to create a NEW Web Service for the backend.

### Step 5: Update Environment Variables

Go to service → **Environment** tab → Add/Update:

**CRITICAL Variables:**
```
MONGODB_URI=mongodb+srv://rohanjaiswar2467:N8iwsBEfkbF2Dd2S@cluster1.sg9pmcf.mongodb.net/freelancing-platform?retryWrites=true&w=majority&appName=Cluster1
JWT_SECRET=freelancing-platform-super-secret-jwt-key-2024
NODE_ENV=production
PORT=10000
ALLOWED_ORIGINS=http://www.people.com.de,https://www.people.com.de,https://people.com.de,https://people-web-5hqi.onrender.com,https://freelancing-platform-backend-backup.onrender.com,http://localhost:3000,http://localhost:3001,http://localhost:3002,http://localhost:3000/debug-payment,https://your-frontend-domain.com
PAYMENT_REDIRECT_URL=https://people-web-5hqi.onrender.com/payment/callback
FRONTEND_URL=https://www.people.com.de
```

**Add ALL other variables from `backend/.env.production`**

### Step 6: Test Backend

After deployment completes:

```bash
# Test health endpoint
curl https://people-web-5hqi.onrender.com/health

# Should return JSON like:
# {"status":"OK","message":"Freelancing Platform Backend is running",...}
```

If you get **502** or **HTML response**, the backend is still not running correctly.

## 🔍 Most Likely Issues:

### Issue 1: Service Doesn't Exist
**Solution:** Create a new Web Service in Render (Step 3)

### Issue 2: Wrong Service Type
**Solution:** If `people-web-5hqi` is a Static Site, create a NEW Web Service for backend

### Issue 3: Missing Environment Variables
**Solution:** Add all variables from `backend/.env.production` (especially `MONGODB_URI`)

### Issue 4: Build/Start Command Wrong
**Solution:** 
- Root Directory: `backend`
- Build Command: `npm install`
- Start Command: `npm start`

### Issue 5: MongoDB Connection Failed
**Solution:** 
- Verify `MONGODB_URI` is correct
- Check MongoDB Atlas allows connections from Render IPs
- Test connection string locally

## 📋 Quick Checklist:

- [ ] Backend service exists in Render Dashboard
- [ ] Service type is "Web Service" (not Static Site)
- [ ] Service status is "Live"
- [ ] Root Directory is set to: `backend`
- [ ] Build Command: `npm install`
- [ ] Start Command: `npm start`
- [ ] All environment variables are set (from `.env.production`)
- [ ] `MONGODB_URI` is correct
- [ ] `ALLOWED_ORIGINS` includes `https://www.people.com.de`
- [ ] Logs show: `🚀 Server running on port...`
- [ ] Logs show: `✅ Connected to MongoDB`
- [ ] Health endpoint returns JSON (not 502)

## 🆘 Still Getting 502?

1. **Check Render Logs** - Most errors are visible there
2. **Verify Service URL** - Make sure you're using the backend service URL
3. **Test Locally** - Run `cd backend && npm start` to verify code works
4. **Check MongoDB** - Verify connection string works

## 📞 Next Steps After Backend is Running:

1. Test: `curl https://people-web-5hqi.onrender.com/health`
2. Test API: `curl https://people-web-5hqi.onrender.com/api/admin/search-users?phoneNumber=`
3. Update frontend API URL to: `https://people-web-5hqi.onrender.com/api`
4. Deploy frontend build

