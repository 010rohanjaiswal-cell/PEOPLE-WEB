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
    this.merchantId = process.env.PHONEPE_MERCHANT_ID || 'SU2509171240249286269937';
    this.saltKey = process.env.PHONEPE_SALT_KEY || 'd74141aa-8762-4d1b-bfa1-dfe2a094d310';
    this.saltIndex = Number(process.env.PHONEPE_SALT_INDEX || 1);
    // Allow overriding base URL via env to switch between prod and preprod
    const envBaseUrl = process.env.PHONEPE_BASE_URL;
    const envMode = process.env.PHONEPE_ENV; // 'preprod' | 'prod'
    this.flowMode = (process.env.PHONEPE_FLOW || 'standard').toLowerCase(); // 'standard' | 'hermes'
    // Determine base URL based on flow
    if (envBaseUrl) {
      this.baseUrl = envBaseUrl;
    } else if (this.flowMode === 'hermes') {
      this.baseUrl = envMode === 'preprod'
        ? 'https://api-preprod.phonepe.com/apis/hermes'
        : 'https://api.phonepe.com/apis/hermes';
    } else {
      this.baseUrl = envMode === 'preprod'
        ? 'https://api-preprod.phonepe.com/apis/pg-sandbox'
        : 'https://api.phonepe.com/apis/pg';
    }
    // Authorization (OAuth) base URL
    const envAuthBaseUrl = process.env.PHONEPE_AUTH_BASE_URL;
    this.authBaseUrl = envAuthBaseUrl
      || (envMode === 'preprod'
            ? 'https://api-preprod.phonepe.com/apis/pg-sandbox'
            : 'https://api.phonepe.com/apis/identity-manager');
    // Client credentials for OAuth
    this.clientId = process.env.PHONEPE_CLIENT_ID || this.merchantId;
    this.clientSecret = process.env.PHONEPE_CLIENT_SECRET || this.saltKey;
    this.clientVersion = process.env.PHONEPE_CLIENT_VERSION || '1';
    this.redirectUrl = process.env.PAYMENT_REDIRECT_URL || 'https://freelancing-platform-backend-backup.onrender.com/payment/callback';
    this.dependenciesAvailable = dependenciesAvailable;
    this.axios = axios;
    this.crypto = crypto;
    // token cache
    this._authToken = null;
    this._authTokenExpiryMs = 0;
    this._tokenType = 'O-Bearer';
  }

  // Generate checksum for PhonePe API
  generateChecksum(payload) {
    if (!dependenciesAvailable) {
      throw new Error('Payment service dependencies not available');
    }
    const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64');
    // Endpoint segment depends on flow
    const payPath = this.flowMode === 'hermes' ? '/pg/v1/pay' : '/checkout/v2/pay';
    const checksumString = base64Payload + payPath + this.saltKey;
    const checksum = crypto.SHA256(checksumString).toString();
    return checksum + '###' + this.saltIndex;
  }

  // Fetch OAuth token and cache it
  async getAuthToken() {
    if (!dependenciesAvailable) {
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

  // Create payment request
  async createPaymentRequest(amount, orderId, userId, jobId, jobTitle) {
    if (!dependenciesAvailable) {
      return {
        success: false,
        error: 'Payment service dependencies not available'
      };
    }
    
    try {
      // Ensure Authorization token
      let bearer = await this.getAuthToken();
      const payload = {
        merchantId: this.merchantId,
        merchantTransactionId: orderId,
        merchantUserId: userId,
        amount: amount * 100, // Amount in paise
        redirectUrl: this.redirectUrl,
        redirectMode: 'POST',
        callbackUrl: this.redirectUrl,
        mobileNumber: '',
        paymentInstrument: {
          type: 'PAY_PAGE'
        }
      };

      const checksum = this.generateChecksum(payload);
      
      const requestData = {
        request: Buffer.from(JSON.stringify(payload)).toString('base64')
      };

      console.log('🔍 PhonePe API Request Details:');
      console.log('  Flow:', this.flowMode);
      console.log('  URL:', `${this.baseUrl}${this.flowMode === 'hermes' ? '/pg/v1/pay' : '/checkout/v2/pay'}`);
      console.log('  Merchant ID:', this.merchantId);
      console.log('  Order ID:', orderId);
      console.log('  Amount:', amount, '(₹' + (amount/100) + ')');
      console.log('  Payload:', JSON.stringify(payload, null, 2));
      console.log('  Checksum:', checksum);
      console.log('  Request Data:', JSON.stringify(requestData, null, 2));

      const apiUrl = `${this.baseUrl}${this.flowMode === 'hermes' ? '/pg/v1/pay' : '/checkout/v2/pay'}`;
      console.log('🔍 Making request to PhonePe API:', apiUrl);
      
      const response = await axios.post(apiUrl, requestData, {
        headers: {
          'Content-Type': 'application/json',
          'X-VERIFY': checksum,
          'X-MERCHANT-ID': this.merchantId,
          ...(this.flowMode === 'hermes' ? {} : { 'Authorization': `${this._tokenType || 'O-Bearer'} ${bearer}` }),
          ...(this.flowMode === 'hermes' ? {} : { 'X-CLIENT-ID': this.clientId }),
          ...(this.flowMode === 'hermes' ? {} : { 'X-CLIENT-VERSION': this.clientVersion }),
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

      return {
        success: true,
        data,
        paymentUrl: redirectUrl
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
          const response = await axios.post(apiUrl, { request: Buffer.from(JSON.stringify({
            merchantId: this.merchantId,
            merchantTransactionId: orderId,
            merchantUserId: userId,
            amount: amount * 100,
            redirectUrl: this.redirectUrl,
            redirectMode: 'POST',
            callbackUrl: this.redirectUrl,
            mobileNumber: '',
            paymentInstrument: { type: 'PAY_PAGE' }
          })).toString('base64') }, {
            headers: {
              'Content-Type': 'application/json',
              'X-VERIFY': this.generateChecksum({
                merchantId: this.merchantId,
                merchantTransactionId: orderId,
                merchantUserId: userId,
                amount: amount * 100,
                redirectUrl: this.redirectUrl,
                redirectMode: 'POST',
                callbackUrl: this.redirectUrl,
                mobileNumber: '',
                paymentInstrument: { type: 'PAY_PAGE' }
              }),
              'X-MERCHANT-ID': this.merchantId,
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

  // Verify payment status
  async verifyPayment(merchantTransactionId) {
    if (!dependenciesAvailable) {
      return {
        success: false,
        error: 'Payment service dependencies not available'
      };
    }
    
    try {
      // Status path depends on flow
      const url = this.flowMode === 'hermes'
        ? `/pg/v1/status/${this.merchantId}/${merchantTransactionId}`
        : `/checkout/v2/order/${merchantTransactionId}/status`;
      const checksumString = url + this.saltKey;
      const checksum = crypto.SHA256(checksumString).toString() + '###' + this.saltIndex;

      // Ensure Authorization token for standard flow only
      const bearer = this.flowMode === 'hermes' ? null : await this.getAuthToken();
      const response = await axios.get(`${this.baseUrl}${url}`, {
        headers: {
          'Content-Type': 'application/json',
          'X-VERIFY': checksum,
          'X-MERCHANT-ID': this.merchantId,
          ...(this.flowMode === 'hermes' ? {} : { 'Authorization': `${this._tokenType || 'O-Bearer'} ${bearer}` }),
          ...(this.flowMode === 'hermes' ? {} : { 'X-CLIENT-ID': this.clientId }),
          ...(this.flowMode === 'hermes' ? {} : { 'X-CLIENT-VERSION': this.clientVersion }),
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
