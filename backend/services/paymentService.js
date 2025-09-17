// Check if dependencies are available
let axios, crypto;
try {
  axios = require('axios');
  crypto = require('crypto-js');
} catch (error) {
  console.error('Payment service dependencies not available:', error.message);
  throw new Error('Payment service dependencies not installed');
}

class PaymentService {
  constructor() {
    this.merchantId = 'SU2509171240249286269937';
    this.saltKey = 'd74141aa-8762-4d1b-bfa1-dfe2a094d310';
    this.saltIndex = 1;
    this.baseUrl = 'https://api.phonepe.com/apis/hermes';
    this.redirectUrl = process.env.PAYMENT_REDIRECT_URL || 'https://freelancing-platform-backend-backup.onrender.com/payment/callback';
  }

  // Generate checksum for PhonePe API
  generateChecksum(payload) {
    const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64');
    const checksumString = base64Payload + '/pg/v1/pay' + this.saltKey;
    const checksum = crypto.SHA256(checksumString).toString();
    return checksum + '###' + this.saltIndex;
  }

  // Create payment request
  async createPaymentRequest(amount, orderId, userId, jobId, jobTitle) {
    try {
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

      const response = await axios.post(`${this.baseUrl}/pg/v1/pay`, requestData, {
        headers: {
          'Content-Type': 'application/json',
          'X-VERIFY': checksum,
          'accept': 'application/json'
        }
      });

      return {
        success: true,
        data: response.data,
        paymentUrl: response.data.data.instrumentResponse.redirectInfo.url
      };

    } catch (error) {
      console.error('Payment request creation error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data || error.message
      };
    }
  }

  // Verify payment status
  async verifyPayment(merchantTransactionId) {
    try {
      const url = `/pg/v1/status/${this.merchantId}/${merchantTransactionId}`;
      const checksumString = url + this.saltKey;
      const checksum = crypto.SHA256(checksumString).toString() + '###' + this.saltIndex;

      const response = await axios.get(`${this.baseUrl}${url}`, {
        headers: {
          'Content-Type': 'application/json',
          'X-VERIFY': checksum,
          'X-MERCHANT-ID': this.merchantId,
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
