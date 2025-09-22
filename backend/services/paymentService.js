// Check if dependencies are available
let axios, crypto;
let dependenciesAvailable = false;

try {
  axios = require('axios');
  crypto = require('crypto-js');
  dependenciesAvailable = true;
  console.log('✅ Payment service dependencies loaded successfully');
} catch (error) {
  console.warn('⚠️ Payment service dependencies not available:', error.message);
  console.warn('⚠️ Payment service will be disabled');
  dependenciesAvailable = false;
}

class PaymentService {
  constructor() {
    // PhonePe V2 Configuration (OAuth-based, no salt keys)
    this.merchantId = process.env.PHONEPE_MERCHANT_ID || 'M23OKIGC1N363';
    this.clientId = process.env.PHONEPE_CLIENT_ID || 'SU2509171240249286269937';
    this.clientSecret = process.env.PHONEPE_CLIENT_SECRET || 'd74141aa-8762-4d1b-bfa1-dfe2a094d310';
    this.clientVersion = process.env.PHONEPE_CLIENT_VERSION || '1';
    
    // Environment configuration
    const envMode = process.env.PHONEPE_ENV || 'prod'; // 'preprod' | 'prod'
    const envBaseUrl = process.env.PHONEPE_BASE_URL;
    const envAuthBaseUrl = process.env.PHONEPE_AUTH_BASE_URL;
    
    // Set base URLs
    if (envBaseUrl) {
      this.baseUrl = envBaseUrl;
    } else {
      this.baseUrl = envMode === 'preprod'
        ? 'https://api-preprod.phonepe.com/apis/pg'
        : 'https://api.phonepe.com/apis/pg';
    }
    
    // Set OAuth base URL
    if (envAuthBaseUrl) {
      this.authBaseUrl = envAuthBaseUrl;
    } else {
      this.authBaseUrl = envMode === 'preprod'
        ? 'https://api-preprod.phonepe.com/apis/identity-manager'
        : 'https://api.phonepe.com/apis/identity-manager';
    }
    
    // Other configuration
    this.redirectUrl = process.env.PAYMENT_REDIRECT_URL || 'https://freelancing-platform-backend-backup.onrender.com/payment/callback';
    this.frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    this.dependenciesAvailable = dependenciesAvailable;
    this.axios = axios;
    this.crypto = crypto;
    
    // OAuth token cache
    this._authToken = null;
    this._authTokenExpiryMs = 0;
    this._tokenType = 'O-Bearer';
    
    console.log('🔧 PhonePe V2 Payment Service initialized:');
    console.log('  Environment:', envMode);
    console.log('  Base URL:', this.baseUrl);
    console.log('  Auth URL:', this.authBaseUrl);
    console.log('  Client ID:', this.clientId);
    console.log('  Merchant ID:', this.merchantId);
  }

  // Note: PhonePe V2 uses OAuth tokens only, no checksums needed

  // Fetch OAuth token and cache it
  async getAuthToken() {
    if (!this.dependenciesAvailable) {
      throw new Error('Payment service dependencies not available');
    }
    const now = Date.now();
    if (this._authToken && now < this._authTokenExpiryMs - 30000) {
      return this._authToken;
    }
    try {
      const url = `${this.authBaseUrl}/v1/oauth/token`;
      const basic = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');

      // Attempt x-www-form-urlencoded first
      const formBody = new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: this.clientId,
        client_secret: this.clientSecret,
        client_version: String(this.clientVersion)
      }).toString();
      let resp = await this.axios.post(url, formBody, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'accept': 'application/json',
          'Authorization': `Basic ${basic}`,
          'X-CLIENT-ID': this.clientId,
          'X-CLIENT-VERSION': this.clientVersion
        },
        timeout: 15000
      });

      let data = resp.data || {};
      let token = data.accessToken || data.access_token || data.token || data.data?.accessToken || data.data?.access_token || data.data?.token;
      let tokenType = data.token_type || data.data?.token_type || 'O-Bearer';
      let expiresInSec = data.expires_in || data.expiresIn || data.data?.expires_in || data.data?.expiresIn || 3300; // default ~55min

      // Fallback to JSON body if token not found
      if (!token) {
        const jsonPayload = { clientId: this.clientId, clientSecret: this.clientSecret, grantType: 'client_credentials' };
        resp = await this.axios.post(url, jsonPayload, {
          headers: {
            'Content-Type': 'application/json',
            'accept': 'application/json',
            'X-CLIENT-ID': this.clientId,
            'X-CLIENT-VERSION': this.clientVersion
          },
          timeout: 15000
        });
        data = resp.data || {};
        token = data.accessToken || data.access_token || data.token || data.data?.accessToken || data.data?.access_token || data.data?.token;
        tokenType = data.token_type || data.data?.token_type || tokenType;
        expiresInSec = data.expires_in || data.expiresIn || data.data?.expires_in || data.data?.expiresIn || 3300;
      }

      if (!token) {
        console.error('❌ PhonePe OAuth unexpected response:', JSON.stringify(data));
        throw new Error('OAuth token missing in response');
      }
      this._authToken = token;
      this._authTokenExpiryMs = now + (expiresInSec * 1000);
      this._tokenType = tokenType;
      return token;
    } catch (e) {
      console.error('❌ PhonePe OAuth Error:', e.response?.data || e.message);
      throw e;
    }
  }

  // Create payment request (PhonePe V2 - OAuth only, no checksums)
  async createPaymentRequest(amount, orderId, userId, jobId, jobTitle) {
    if (!this.dependenciesAvailable) {
      return {
        success: false,
        error: 'Payment service dependencies not available'
      };
    }
    
    try {
      // Get OAuth token
      const bearer = await this.getAuthToken();
      
      const payload = {
        merchantId: this.merchantId,
        merchantOrderId: orderId,
        merchantUserId: userId,
        amount: amount * 100, // Amount in paise
        redirectUrl: `${this.frontendUrl}/payment/success`, // Frontend success page
        redirectMode: 'POST',
        callbackUrl: this.redirectUrl, // Backend callback for webhook
        mobileNumber: '',
        paymentInstrument: {
          type: 'PAY_PAGE'
        }
      };

      const requestData = {
        request: Buffer.from(JSON.stringify(payload)).toString('base64')
      };

      console.log('🔍 PhonePe V2 API Request Details:');
      console.log('  URL:', `${this.baseUrl}/checkout/v2/pay`);
      console.log('  Merchant ID:', this.merchantId);
      console.log('  Order ID:', orderId);
      console.log('  Amount:', amount, '(₹' + (amount/100) + ')');
      console.log('  Payload:', JSON.stringify(payload, null, 2));
      console.log('  Request Data:', JSON.stringify(requestData, null, 2));

      const apiUrl = `${this.baseUrl}/checkout/v2/pay`;
      console.log('🔍 Making request to PhonePe V2 API:', apiUrl);
      
      const response = await axios.post(apiUrl, requestData, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `${this._tokenType || 'O-Bearer'} ${bearer}`,
          'X-CLIENT-ID': this.clientId,
          'X-CLIENT-VERSION': this.clientVersion,
          'accept': 'application/json'
        },
        timeout: 30000
      });

      console.log('✅ PhonePe API Response:');
      console.log('  Status:', response.status);
      console.log('  Data:', JSON.stringify(response.data, null, 2));

      // Try multiple shapes for redirect URL per different API variants
      const data = response.data;
      const redirectUrl = data?.data?.instrumentResponse?.redirectInfo?.url
        || data?.data?.redirectInfo?.url
        || data?.data?.url
        || data?.redirectUrl
        || data?.url;

      console.log('🎯 PhonePe Response Analysis:');
      console.log('  Full response data:', JSON.stringify(data, null, 2));
      console.log('  Extracted redirectUrl:', redirectUrl);
      console.log('  PhonePe orderId:', data?.orderId || data?.data?.orderId);
      console.log('  Available fields:', Object.keys(data || {}));
      if (data?.data) {
        console.log('  Data fields:', Object.keys(data.data || {}));
      }
      
      return {
        success: true,
        data,
        paymentUrl: redirectUrl,
        phonepeOrderId: data?.orderId || data?.data?.orderId
      };

    } catch (error) {
      console.error('❌ PhonePe API Error Details:');
      console.error('  Status:', error.response?.status);
      console.error('  Status Text:', error.response?.statusText);
      console.error('  Headers:', error.response?.headers);
      console.error('  Data:', error.response?.data);
      console.error('  Message:', error.message);
      console.error('  URL:', error.config?.url);
      console.error('  Method:', error.config?.method);
      // If 401, try refreshing token once (only standard flow)
      if (error.response?.status === 401 && this.flowMode !== 'hermes') {
        try {
          this._authToken = null;
          const bearer = await this.getAuthToken();
          const apiUrl = `${this.baseUrl}/checkout/v2/pay`;
          const response = await axios.post(apiUrl, {
            request: Buffer.from(JSON.stringify({
              merchantId: this.merchantId,
              merchantTransactionId: orderId,
              merchantUserId: userId,
              amount: amount * 100,
              redirectUrl: `${this.frontendUrl}/payment/success`,
              redirectMode: 'POST',
              callbackUrl: this.redirectUrl,
              mobileNumber: '',
              paymentInstrument: { type: 'PAY_PAGE' }
            })).toString('base64')
          }, {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `${this._tokenType || 'O-Bearer'} ${bearer}`,
              'X-CLIENT-ID': this.clientId,
              'X-CLIENT-VERSION': this.clientVersion,
              'accept': 'application/json'
            },
            timeout: 30000
          });
          const data = response.data;
          const redirectUrl = data?.data?.instrumentResponse?.redirectInfo?.url
            || data?.data?.redirectInfo?.url
            || data?.data?.url
            || data?.redirectUrl
            || data?.url;
          return { success: true, data, paymentUrl: redirectUrl };
        } catch (retryErr) {
          console.error('❌ Retry after OAuth refresh failed:', retryErr.response?.data || retryErr.message);
        }
      }
      return {
        success: false,
        error: error.response?.data || error.message,
        status: error.response?.status,
        statusText: error.response?.statusText
      };
    }
  }

  // Verify payment status (PhonePe V2 - OAuth only, no checksums)
  async verifyPayment(merchantTransactionId) {
    if (!this.dependenciesAvailable) {
      return {
        success: false,
        error: 'Payment service dependencies not available'
      };
    }
    
    try {
      // Get OAuth token
      const bearer = await this.getAuthToken();
      
      const url = `/checkout/v2/order/${merchantTransactionId}/status`;
      const response = await axios.get(`${this.baseUrl}${url}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `${this._tokenType || 'O-Bearer'} ${bearer}`,
          'X-CLIENT-ID': this.clientId,
          'X-CLIENT-VERSION': this.clientVersion,
          'accept': 'application/json'
        }
      });

      return {
        success: true,
        data: response.data
      };

    } catch (error) {
      console.error('Payment verification error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data || error.message
      };
    }
  }

  // Calculate commission and freelancer amount
  calculateAmounts(totalAmount) {
    const commission = Math.round(totalAmount * 0.1); // 10% commission
    const freelancerAmount = totalAmount - commission; // 90% to freelancer
    
    return {
      totalAmount,
      commission,
      freelancerAmount
    };
  }

  // Test dependencies
  testDependencies() {
    try {
      if (!this.dependenciesAvailable) {
        return {
          success: false,
          error: 'Dependencies not available'
        };
      }

      // Test axios
      const axiosTest = typeof this.axios === 'function' || typeof this.axios.post === 'function';
      
      // Test crypto
      const cryptoTest = typeof this.crypto === 'object' && typeof this.crypto.SHA256 === 'function';

      return {
        success: true,
        axios: axiosTest,
        crypto: cryptoTest,
        dependenciesAvailable: this.dependenciesAvailable
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Test PhonePe API endpoint connectivity
  async testPhonePeConnectivity() {
    try {
      if (!this.dependenciesAvailable) {
        return {
          success: false,
          error: 'Dependencies not available'
        };
      }

      // Test basic connectivity to PhonePe API
      const response = await this.axios.get(this.baseUrl, {
        timeout: 10000,
        headers: {
          'User-Agent': 'PaymentService-Test/1.0'
        }
      });

      return {
        success: true,
        status: response.status,
        message: 'PhonePe API endpoint is reachable'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText
      };
    }
  }
}

// Export payment service with error handling
try {
  module.exports = new PaymentService();
} catch (error) {
  console.error('Failed to initialize payment service:', error.message);
  // Export a dummy service that throws errors
  module.exports = {
    calculateAmounts: () => { throw new Error('Payment service not available'); },
    createPaymentRequest: () => { throw new Error('Payment service not available'); },
    verifyPayment: () => { throw new Error('Payment service not available'); }
  };
}
