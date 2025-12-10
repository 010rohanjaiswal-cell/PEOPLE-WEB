const axios = require('axios');
const crypto = require('crypto');

class BulkpeService {
  constructor() {
    this.baseURL = 'https://api.bulkpe.in/client';
    this.apiKey = process.env.BULKPE_API_KEY;
    this.secretKey = process.env.BULKPE_SECRET_KEY;
  }

  /**
   * Generate authentication headers for Bulkpe API
   */
  getAuthHeaders() {
    return {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json'
    };
  }

  /**
   * Fetch current balance from Bulkpe Virtual Account
   */
  async fetchBalance() {
    try {
      const response = await axios.get(`${this.baseURL}/fetchBalance`, {
        headers: this.getAuthHeaders()
      });

      return {
        success: true,
        balance: response.data.data.Balance,
        accountNumber: response.data.data.account_number,
        businessName: response.data.data.businessName
      };
    } catch (error) {
      console.error('❌ Bulkpe fetch balance error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  /**
   * Initiate payout to UPI ID
   */
  async initiateUPIPayout(amount, upiId, beneficiaryName, referenceId, transactionNote) {
    try {
      const payload = {
        amount: amount,
        payment_mode: "UPI",
        reference_id: referenceId,
        transcation_note: transactionNote,
        beneficiaryName: beneficiaryName,
        upi: upiId
      };

      console.log('🚀 Initiating Bulkpe UPI payout:', payload);

      const response = await axios.post(`${this.baseURL}/initiatepayout`, payload, {
        headers: this.getAuthHeaders()
      });

      return {
        success: true,
        transactionId: response.data.data.transcation_id,
        referenceId: response.data.data.reference_id,
        status: response.data.data.status,
        message: response.data.message
      };
    } catch (error) {
      console.error('❌ Bulkpe UPI payout error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  /**
   * Initiate payout to bank account
   */
  async initiateBankPayout(amount, accountNumber, ifsc, beneficiaryName, referenceId, transactionNote) {
    try {
      const payload = {
        amount: amount,
        account_number: accountNumber,
        payment_mode: "IMPS", // or NEFT, RTGS
        reference_id: referenceId,
        transcation_note: transactionNote,
        beneficiaryName: beneficiaryName,
        ifsc: ifsc
      };

      console.log('🚀 Initiating Bulkpe bank payout:', payload);

      const response = await axios.post(`${this.baseURL}/initiatepayout`, payload, {
        headers: this.getAuthHeaders()
      });

      return {
        success: true,
        transactionId: response.data.data.transcation_id,
        referenceId: response.data.data.reference_id,
        status: response.data.data.status,
        message: response.data.message
      };
    } catch (error) {
      console.error('❌ Bulkpe bank payout error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  /**
   * Fetch transaction status
   */
  async fetchTransactionStatus(transactionId) {
    try {
      const payload = {
        transcation_id: transactionId
      };

      const response = await axios.post(`${this.baseURL}/fetchStatus`, payload, {
        headers: this.getAuthHeaders()
      });

      return {
        success: true,
        status: response.data.data.status,
        utr: response.data.data.utr,
        amount: response.data.data.amount,
        paymentMode: response.data.data.payment_mode,
        isSettled: response.data.data.isSetteled
      };
    } catch (error) {
      console.error('❌ Bulkpe fetch status error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  /**
   * Process withdrawal request with payout
   */
  async processWithdrawalRequest(withdrawalRequest) {
    try {
      const { amount, upiId, bankDetails, beneficiaryName } = withdrawalRequest;
      const referenceId = `WD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      let payoutResult;

      if (upiId) {
        // UPI payout
        payoutResult = await this.initiateUPIPayout(
          amount,
          upiId,
          beneficiaryName,
          referenceId,
          `Withdrawal request payout - ${beneficiaryName}`
        );
      } else if (bankDetails) {
        // Bank payout
        payoutResult = await this.initiateBankPayout(
          amount,
          bankDetails.accountNumber,
          bankDetails.ifsc,
          beneficiaryName,
          referenceId,
          `Withdrawal request payout - ${beneficiaryName}`
        );
      } else {
        throw new Error('No UPI ID or bank details provided');
      }

      if (payoutResult.success) {
        return {
          success: true,
          transactionId: payoutResult.transactionId,
          referenceId: payoutResult.referenceId,
          status: payoutResult.status,
          message: payoutResult.message
        };
      } else {
        throw new Error(payoutResult.error);
      }
    } catch (error) {
      console.error('❌ Process withdrawal payout error:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new BulkpeService();
