const Withdrawal = require('../models/Withdrawal');
const User = require('../models/User');

/**
 * Handle Bulkpe payout status webhooks
 * This endpoint receives status updates from Bulkpe when payout status changes
 */
const handlePayoutStatusWebhook = async (req, res) => {
  try {
    const { transcation_id, status, utr, amount, payment_mode } = req.body;

    console.log('🔔 Bulkpe webhook received:', {
      transactionId: transcation_id,
      status,
      utr,
      amount,
      paymentMode: payment_mode
    });

    // Find withdrawal by Bulkpe transaction ID
    const withdrawal = await Withdrawal.findOne({ 
      bulkpeTransactionId: transcation_id 
    });

    if (!withdrawal) {
      console.log('⚠️ Withdrawal not found for transaction:', transcation_id);
      return res.status(404).json({
        success: false,
        message: 'Withdrawal not found'
      });
    }

    // Update withdrawal status based on Bulkpe status
    let newStatus;
    let description;

    switch (status) {
      case 'SUCCESS':
        newStatus = 'completed';
        description = `Withdrawal completed - UTR: ${utr}`;
        break;
      case 'FAILED':
        newStatus = 'failed';
        description = 'Withdrawal failed';
        break;
      case 'PENDING':
        newStatus = 'processing';
        description = 'Withdrawal processing';
        break;
      default:
        newStatus = 'processing';
        description = `Withdrawal status: ${status}`;
    }

    // Update withdrawal record
    withdrawal.status = newStatus;
    withdrawal.utr = utr;
    withdrawal.completedAt = status === 'SUCCESS' ? new Date() : null;
    await withdrawal.save();

    // Update user's wallet transaction
    const user = await User.findById(withdrawal.userId);
    if (user && user.wallet && user.wallet.transactions) {
      const transaction = user.wallet.transactions.find(
        t => t.bulkpeTransactionId === transcation_id
      );
      
      if (transaction) {
        transaction.status = newStatus;
        transaction.utr = utr;
        transaction.description = description;
        transaction.updatedAt = new Date();
        
        await user.save();
      }
    }

    console.log('✅ Withdrawal status updated:', {
      withdrawalId: withdrawal._id,
      newStatus,
      utr
    });

    res.json({
      success: true,
      message: 'Webhook processed successfully'
    });

  } catch (error) {
    console.error('❌ Bulkpe webhook error:', error);
    res.status(500).json({
      success: false,
      message: 'Webhook processing failed'
    });
  }
};

/**
 * Get payout status for a specific transaction
 */
const getPayoutStatus = async (req, res) => {
  try {
    const { transactionId } = req.params;

    const withdrawal = await Withdrawal.findOne({ 
      bulkpeTransactionId: transactionId 
    });

    if (!withdrawal) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    res.json({
      success: true,
      data: {
        status: withdrawal.status,
        utr: withdrawal.utr,
        amount: withdrawal.amount,
        createdAt: withdrawal.createdAt,
        completedAt: withdrawal.completedAt
      }
    });

  } catch (error) {
    console.error('Get payout status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payout status'
    });
  }
};

module.exports = {
  handlePayoutStatusWebhook,
  getPayoutStatus
};
