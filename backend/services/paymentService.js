// PhonePe V2 Payment Service - Clean Implementation
const axios = require('axios');

class PaymentService {
  constructor() {
    // PhonePe V2 Configuration
    this.merchantId = process.env.PHONEPE_MERCHANT_ID || 'M23OKIGC1N363';
    this.clientId = process.env.PHONEPE_CLIENT_ID || 'SU2509171240249286269937';
    this.clientSecret = process.env.PHONEPE_CLIENT_SECRET || 'd74141aa-8762-4d1b-bfa1-dfe2a094d310';
    this.clientVersion = process.env.PHONEPE_CLIENT_VERSION || '1';
    
    // API URLs
    this.baseUrl = process.env.PHONEPE_BASE_URL || 'https://api.phonepe.com/apis/pg';
    this.authBaseUrl = process.env.PHONEPE_AUTH_BASE_URL || 'https://api.phonepe.com/apis/identity-manager';
    
    // Callback URLs
    this.redirectUrl = process.env.PAYMENT_REDIRECT_URL || 'https://freelancing-platform-backend-backup.onrender.com/payment/callback';
    this.frontendUrl = process.env.FRONTEND_URL || 'https://www.people.com.de';
    
    // OAuth token cache
    this._authToken = null;
    this._tokenExpiry = 0;
    
    console.log('✅ PhonePe Payment Service initialized');
  }

  /**
   * Get OAuth token from PhonePe
   */
  async getAuthToken() {
    // Return cached token if still valid
    if (this._authToken && Date.now() < this._tokenExpiry) {
      return this._authToken;
    }

    try {
      const url = `${this.authBaseUrl}/v1/oauth/token`;
      const basicAuth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');

      const response = await axios.post(
        url,
        new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: this.clientId,
          client_secret: this.clientSecret,
          client_version: this.clientVersion
        }).toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${basicAuth}`,
            'X-CLIENT-ID': this.clientId,
            'X-CLIENT-VERSION': this.clientVersion
          },
          timeout: 15000
        }
      );

      const data = response.data;
      const token = data.accessToken || data.access_token || data.data?.accessToken;
      const expiresIn = data.expires_in || data.data?.expires_in || 3300;

      if (!token) {
        throw new Error('OAuth token not found in response');
      }

      // Cache token (expire 5 minutes before actual expiry)
      this._authToken = token;
      this._tokenExpiry = Date.now() + (expiresIn - 300) * 1000;

      console.log('✅ OAuth token obtained');
      return token;
    } catch (error) {
      console.error('❌ OAuth token error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Create payment request
   */
  async createPaymentRequest(amount, orderId, userId, jobId, jobTitle) {
    try {
      // Get OAuth token
      const token = await this.getAuthToken();

      // Validate amount
      const amountInPaise = Math.round(Number(amount) * 100);
      if (isNaN(amountInPaise) || amountInPaise <= 0) {
        throw new Error(`Invalid amount: ${amount}`);
      }

      // Convert userId to string
      const merchantUserId = String(userId);

      // Create payload - Simple and clean structure
      // Try PG_CHECKOUT flow (alternative to PAY_PAGE) to avoid PG 500
      const payload = {
        merchantId: this.merchantId,
        merchantTransactionId: orderId,
        merchantOrderId: orderId,
        merchantUserId: merchantUserId,
        amount: amountInPaise,
        // PhonePe PG checkout with merchantUrls
        paymentFlow: {
          type: 'PG_CHECKOUT',
          merchantUrls: {
            redirectUrl: `${this.frontendUrl}/freelancer/dashboard`,
            cancelUrl: `${this.frontendUrl}/freelancer/dashboard`,
            failureUrl: `${this.frontendUrl}/freelancer/dashboard`
          }
        },
        redirectMode: 'REDIRECT',
        callbackUrl: this.redirectUrl,
        deviceContext: { deviceOS: 'WEB' },
        mobileNumber: ''
      };

      console.log('📤 PhonePe Payment Request:');
      console.log('  Order ID:', orderId);
      console.log('  Amount:', amount, '₹ →', amountInPaise, 'paise');
      console.log('  Redirect URL:', payload.redirectUrl);

      // Make API request
      const response = await axios.post(
        `${this.baseUrl}/checkout/v2/pay`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `O-Bearer ${token}`,
            'X-CLIENT-ID': this.clientId,
            'X-CLIENT-VERSION': this.clientVersion,
            'accept': 'application/json'
          },
          timeout: 30000
        }
      );

      console.log('📥 PhonePe Response Status:', response.status);
      console.log('📥 PhonePe Response:', JSON.stringify(response.data, null, 2));

      const responseData = response.data;

      // Extract payment URL
      const paymentUrl = 
        responseData?.data?.instrumentResponse?.redirectInfo?.url ||
        responseData?.data?.redirectInfo?.url ||
        responseData?.data?.url ||
        responseData?.redirectUrl ||
        responseData?.url;

      if (!paymentUrl) {
        console.error('❌ No payment URL in response');
        return {
          success: false,
          error: 'Payment URL not found in PhonePe response',
          response: responseData
        };
      }

      return {
        success: true,
        paymentUrl: paymentUrl,
        orderId: orderId,
        phonepeOrderId: responseData?.orderId || responseData?.data?.orderId,
        data: responseData
      };

    } catch (error) {
      console.error('❌ Payment request error:');
      console.error('  Status:', error.response?.status);
      console.error('  Data:', JSON.stringify(error.response?.data, null, 2));
      console.error('  Message:', error.message);

      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Payment request failed',
        status: error.response?.status,
        details: error.response?.data
      };
    }
  }

  /**
   * Verify payment status
   */
  async verifyPayment(merchantTransactionId) {
    try {
      const token = await this.getAuthToken();

      const response = await axios.get(
        `${this.baseUrl}/checkout/v2/order/${merchantTransactionId}/status`,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `O-Bearer ${token}`,
            'X-CLIENT-ID': this.clientId,
            'X-CLIENT-VERSION': this.clientVersion,
            'accept': 'application/json'
          },
          timeout: 15000
        }
      );

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('❌ Payment verification error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data || error.message
      };
    }
  }

  /**
   * Calculate commission and freelancer amount
   */
  calculateAmounts(totalAmount) {
    const commission = Math.round(totalAmount * 0.1); // 10% commission
    const freelancerAmount = totalAmount - commission; // 90% to freelancer
    
    return {
      totalAmount,
      commission,
      freelancerAmount
    };
  }

  /**
   * Test dependencies (for compatibility)
   */
  testDependencies() {
    return {
      success: true,
      axios: typeof axios !== 'undefined',
      dependenciesAvailable: true
    };
  }
}

module.exports = new PaymentService();
