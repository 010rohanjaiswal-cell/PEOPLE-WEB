import api from './api';

const paymentService = {
  // Create UPI payment request
  createUPIPayment: async (jobId) => {
    try {
      console.log('💳 Creating UPI payment for job:', jobId);
      const response = await api.post(`/payment/upi/${jobId}`);
      console.log('💳 UPI payment response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ UPI payment creation error:', error);
      throw error.response?.data || error;
    }
  },

  // Verify UPI payment
  verifyUPIPayment: async (orderId) => {
    try {
      console.log('🔍 Verifying UPI payment for order:', orderId);
      const response = await api.post('/payment/verify', { orderId });
      console.log('🔍 UPI payment verification response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ UPI payment verification error:', error);
      throw error.response?.data || error;
    }
  },

  // Get payment status
  getPaymentStatus: async (jobId) => {
    try {
      console.log('📊 Getting payment status for job:', jobId);
      const response = await api.get(`/payment/status/${jobId}`);
      console.log('📊 Payment status response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Get payment status error:', error);
      throw error.response?.data || error;
    }
  }
};

export default paymentService;
