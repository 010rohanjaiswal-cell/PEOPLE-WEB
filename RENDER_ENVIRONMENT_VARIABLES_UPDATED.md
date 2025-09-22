# Updated Render Environment Variables for PhonePe V2 Testing

## Current Issue
The production PhonePe API is returning "merchantOrderId must not be blank. amount must not be null." even with correct payload. This suggests the production credentials might not be fully activated.

## Recommended Environment Variables for Testing

```bash
# PhonePe V2 Configuration - Use Preprod for Testing
PHONEPE_ENV=preprod
PHONEPE_BASE_URL=https://api-preprod.phonepe.com/apis/pg
PHONEPE_AUTH_BASE_URL=https://api-preprod.phonepe.com/apis/identity-manager
PHONEPE_CLIENT_ID=SU2509171240249286269937
PHONEPE_CLIENT_SECRET=d74141aa-8762-4d1b-bfa1-dfe2a094d310
PHONEPE_CLIENT_VERSION=1
PHONEPE_MERCHANT_ID=M23OKIGC1N363

# Payment Configuration
PAYMENT_REDIRECT_URL=https://d87949c11202.ngrok-free.app/payment/callback
FRONTEND_URL=http://localhost:3000

# Other existing variables...
ADMIN_EMAIL=admin@test.com
ADMIN_PASSWORD=admin123
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001,http://localhost:3002,http://localhost:3000/debug-payment,https://your-frontend-domain.com
CLOUDINARY_API_KEY=261736196235374
CLOUDINARY_API_SECRET=O-t8Mp0PszzS0oos-33Yy6fU1AM
CLOUDINARY_CLOUD_NAME=dzpqrejsi
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@freelancing-platform-v2.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=116945888069941124061
FIREBASE_CLIENT_X509_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40freelancing-platform-v2.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCwc34d3nadI4KZ\nskMb3dv9cYI5vy7V5ot+lIPXGR2ZU6ahC8oROtcCuONfA7CVaoWnwfHNHPqiwdZd\nhO25c8rgU508yp9NS+Nfc7s50Gp0P6Hmg/vxDusBmV8cuQYNq80mmuwX0cXqkwqV\nAO2dnT7Gwf6o+3zoahiuPrgQ80dVnL1H7+5qWmAwICUoizhnO2E2Qx7dHcYAkY5Q\nzHZOtZe2oA/WGFgK8vL0V9aKfsWPro7Q3CjGoMMIGFBNL93tffqJ3awilq+Zb86f\nw7XPEShX4NmOCYzcolwt4iYEiF8VQAFae8jkNklc0EmUnL+VcW8Bk84dUIfVwEQ+\nQ8xarH3HAgMBAAECggEAKXulgUEtUqkoCZlCtLj2gMGgU5IyYSBX2DTzP+0MK+Fi\nMcdzRJS4OtAbyFk2ORJ3hKaQgd/Xvs7iZk8bknd6ET4nH8UlKYd3V5f+QsvQUy8o\nkWijIRuYPWKA3WBUX39t9i8C5WCwboMOQFSdCGqQ+Spfg/vH9F4JGmHtZTLEqQgR\n3u9Fx0Tl1fzmOGTvRrk1i3zl4CBFGlNiu3dY8Hq1gLg0v9IpcOCfNWdV1ZCxjOYT\noMV+v4j/sPmgaCaM+FUi6etkHhicZXwB7vF8KmhGvixFNafCza5n1ofzvdQzZvnY\nAeBe9RJuAnQYlGHL5I8A88LUHl+gradHU9JflC9sOQKBgQDerZTiYbBbsPoeZH6K\njVp9mnBEtPPbc9SpLiLsrcjo0VoW24c2LNdOE1rSoOgjzFYvOBUX/a6y0xOA0UuK\n63TCa2hNxOmNVNpavuWRfiLjjgAtKCPoA/Z4sg++DSS8z3vAWaHZrnue9bYI5VzJ\nZUZSU4uDJZE4WY4/KEzIuKZVOQKBgQDK2wlc27NDIUBstlsgFjvWMmaOV0hCnhN8\nEjQYEwcNS+ko/PpE+72EXME/A8HL5dyBi1m0FFd0TmsUW6aQL/eaWP0yrR5Ve6G/\n0+JeXymmNHCFr4c2LmT/yfNRBBewm8vlsLwDVxpTqAIm0sAefa4wmN4/9w/ea/il\nyYO/T1Rq/wKBgFzy397PICpl6UGeeSOkdU1QleRYFCJaaz5jP7jDocVs/cnkwL/g\nX877TUH2YG/w71iudD+baLzEVrPCqWHHfulYpCUyOLsB3FNcs77ThASwVWqEAtjq\nLoua5+9Q1TDq+qEDyQdwSbHEpsN32g9G8t+Sd/26RK/c0f+S9toiGWwhAoGBAKyB\noHCrFMLdoB/S46NhxPjeW4BokTa1nvQ/trVSWQjhqSIGH/5R5lSNXHjuBPwUOXSg\nwGP3eHebyEvDtN2hLPrA+nEB723aeS7cTQDcBFsm7Rl6r41P3uv3HUekJ1E07Cwk\nI37jr6u8kDfbuS00y9Df7wCOZZxMTWMO/07Nc4iZAoGBALeFQwh2YOIEofLjxEFP\n6yoCHyE9pBAz+/R7SY9PoSUohxVn8oNxgxxfqgfUQld+Bg/5uf411bsIhVp+l5wo\nYVdLwvEJiUp5GXkFe7QLBgxsq1YTa2RoS0WiovtZCljoqPaeGYits7rHswCqQLB3\n2bbC8LAVGQvljeoKBTz6gyV9\n-----END PRIVATE KEY-----"
FIREBASE_PRIVATE_KEY_ID=b84bdcea629940fe945ebdc0655a37a0da957ba7
FIREBASE_PROJECT_ID=freelancing-platform-v2
JWT_EXPIRES_IN=7d
JWT_SECRET=freelancing-platform-super-secret-jwt-key-2024
MONGODB_URI="mongodb+srv://rohanjaiswar2467:N8iwsBEfkbF2Dd2S@cluster1.sg9pmcf.mongodb.net/freelancing-platform?retryWrites=true&w=majority&appName=Cluster1"
NODE_ENV=production
PORT=3001
```

## Key Changes
1. **PHONEPE_ENV=preprod** - Use preprod environment for testing
2. **PHONEPE_BASE_URL** - Point to preprod API
3. **PHONEPE_AUTH_BASE_URL** - Point to preprod identity manager

## Next Steps
1. Update these environment variables in Render
2. Wait for deployment to complete
3. Test the payment flow again

## Alternative: Use UAT Credentials
If preprod doesn't work, we can try using the UAT credentials that were working before:

```bash
PHONEPE_CLIENT_ID=M23OKIGC1N363UAT_2509191
PHONEPE_CLIENT_SECRET=MDZhZTMyNDgtYmFkMy00YmVhLTkyNTYtMDRkODI4Y2EwNmJi
PHONEPE_MERCHANT_ID=M23OKIGC1N363
```
