# 📋 Render Environment Variables Setup Guide

## 🎯 How to Add Environment Variables to Render

Render **does NOT** upload `.env` files directly. Instead, you need to add each variable manually in the Render dashboard.

## 📝 Step-by-Step Instructions:

### 1. Go to Render Dashboard
- Visit: https://dashboard.render.com
- Select your backend service: `people-web-5hqi`

### 2. Navigate to Environment Tab
- Click on your service
- Go to "Environment" tab (left sidebar)

### 3. Add/Update Variables
For each variable in `backend/.env.production`:

1. Click "Add Environment Variable" (or edit existing)
2. **Key**: Copy the variable name (e.g., `ALLOWED_ORIGINS`)
3. **Value**: Copy the value (everything after `=`)
4. Click "Save"

### 4. Important Variables to Update:

#### ⚠️ **CRITICAL - Must Update These:**

**ALLOWED_ORIGINS** (FIX THIS):
```
http://www.people.com.de,https://www.people.com.de,https://people.com.de,https://people-web-5hqi.onrender.com,https://freelancing-platform-backend-backup.onrender.com,http://localhost:3000,http://localhost:3001,http://localhost:3002,http://localhost:3000/debug-payment,https://your-frontend-domain.com
```

**PAYMENT_REDIRECT_URL** (UPDATE THIS):
```
https://people-web-5hqi.onrender.com/payment/callback
```

**PORT** (ADD IF MISSING):
```
10000
```

## 🔄 Quick Copy-Paste Method:

1. Open `backend/.env.production` file
2. For each line (except comments starting with `#`):
   - Copy the part before `=` as the **Key**
   - Copy the part after `=` as the **Value**
   - Paste into Render dashboard

## ⚡ Bulk Import (Alternative Method):

Some Render plans support bulk import:
1. Go to Environment tab
2. Look for "Import from file" or "Bulk edit" option
3. Copy all lines from `backend/.env.production` (without `#` comments)
4. Paste and save

## ✅ Verification:

After adding all variables:
1. Click "Save Changes"
2. Service will auto-redeploy
3. Check logs for: `🚀 Server running on port...`
4. Test: `curl https://people-web-5hqi.onrender.com/health`

## 📌 Notes:

- **No quotes needed** in Render (unlike .env files)
- **FIREBASE_PRIVATE_KEY** - Keep the quotes and `\n` characters
- **MONGODB_URI** - Keep the full connection string
- **ALLOWED_ORIGINS** - No spaces after commas
- Render will automatically redeploy when you save

## 🆘 Troubleshooting:

**If variables don't work:**
- Check for typos in variable names
- Ensure no extra spaces
- Verify values are correct (especially URLs)
- Check Render logs for errors

