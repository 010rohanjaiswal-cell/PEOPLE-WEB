// Minimal payment service that doesn't require external dependencies
class PaymentServiceMinimal {
  constructor() {
    this.merchantId = 'SU2509171240249286269937';
    this.saltKey = 'd74141aa-8762-4d1b-bfa1-dfe2a094d310';
    this.saltIndex = 1;
    this.baseUrl = 'https://api.phonepe.com/apis/hermes';
    this.redirectUrl = process.env.PAYMENT_REDIRECT_URL || 'https://freelancing-platform-backend-backup.onrender.com/payment/callback';
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

  // Mock payment request (returns error indicating dependencies needed)
  async createPaymentRequest(amount, orderId, userId, jobId, jobTitle) {
    console.error('❌ Payment service dependencies not available. Please install axios and crypto-js on the server.');
    return {
      success: false,
      error: 'Payment service dependencies (axios, crypto-js) not installed on server',
      message: 'Please contact support to install required dependencies',
      details: {
        missingDependencies: ['axios', 'crypto-js'],
        solution: 'Run: npm install axios@1.12.2 crypto-js@4.2.0'
      }
    };
  }

  // Mock payment verification (returns error indicating dependencies needed)
  async verifyPayment(merchantTransactionId) {
    console.error('❌ Payment service dependencies not available. Please install axios and crypto-js on the server.');
    return {
      success: false,
      error: 'Payment service dependencies (axios, crypto-js) not installed on server',
      message: 'Please contact support to install required dependencies',
      details: {
        missingDependencies: ['axios', 'crypto-js'],
        solution: 'Run: npm install axios@1.12.2 crypto-js@4.2.0'
      }
    };
  }
}

module.exports = new PaymentServiceMinimal();
