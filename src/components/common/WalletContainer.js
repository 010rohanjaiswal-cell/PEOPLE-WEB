import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './Card';
import { Button } from './Button';
import { Wallet, RefreshCw, Receipt, ChevronDown, ChevronUp, CreditCard, History } from 'lucide-react';
import { freelancerService } from '../../api/freelancerService';

const WalletContainer = ({ user, onRefresh, transactions = [] }) => {
  const [loading, setLoading] = useState(false);
  const [payingDues, setPayingDues] = useState(false);
  const [processingDues, setProcessingDues] = useState(false);
  const [expandedTransactions, setExpandedTransactions] = useState(new Set());
  const [showTransactionHistory, setShowTransactionHistory] = useState(false);

  // Calculate total unpaid commission (dues) from transactions
  const calculateTotalDues = () => {
    return transactions
      .filter(tx => tx.commission && tx.commission > 0 && !tx.duesPaid)
      .reduce((sum, tx) => sum + (tx.commission || 0), 0);
  };

  const totalDues = calculateTotalDues();

  // Filter transactions that have commission (show all, but highlight unpaid)
  const commissionTransactions = transactions
    .filter(tx => tx.commission && tx.commission > 0)
    .sort((a, b) => {
      const dateA = new Date(a.createdAt || a.timestamp || 0);
      const dateB = new Date(b.createdAt || b.timestamp || 0);
      return dateB - dateA; // Newest first
    });

  // Get transaction history for dues (all transactions with commission)
  const transactionHistory = commissionTransactions.map(tx => {
    const jobAmount = tx.totalAmount || 0;
    const commission = tx.commission || 0;
    const freelancerAmount = jobAmount - commission;
    return {
      id: tx.id || tx.jobId,
      freelancerAmount,
      orderId: tx.duesPaymentOrderId || tx.paymentOrderId || 'N/A',
      date: tx.createdAt || tx.timestamp,
      jobTitle: tx.description || tx.jobTitle || 'Job Payment',
      isPaid: tx.duesPaid || false
    };
  });

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'N/A';
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'N/A';
    }
  };

  const formatDateOnly = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return 'N/A';
    }
  };

  const toggleTransaction = (transactionId) => {
    const newExpanded = new Set(expandedTransactions);
    if (newExpanded.has(transactionId)) {
      newExpanded.delete(transactionId);
    } else {
      newExpanded.add(transactionId);
    }
    setExpandedTransactions(newExpanded);
  };

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      if (onRefresh) onRefresh();
    }, 1000);
  };

  // Attempt to process dues payment using stored orderId (after redirect)
  const processDuesOrder = async (orderId, { silent = false } = {}) => {
    if (!orderId) return;
    try {
      setProcessingDues(true);
      const result = await freelancerService.processDuesOrder(orderId);
      console.log('✅ Dues processed:', result);
      if (!silent) {
        alert('Dues cleared successfully.');
      }
      localStorage.removeItem('lastDuesOrderId');
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('❌ Failed to process dues order:', err);
      if (!silent) {
        const msg = err?.message || err?.error || 'Failed to process dues payment';
        alert(msg);
      }
    } finally {
      setProcessingDues(false);
    }
  };

  // On mount, if there is a stored orderId or URL param, try to process dues automatically
  useEffect(() => {
    // Check URL params for payment success
    const urlParams = new URLSearchParams(window.location.search);
    const paymentSuccess = urlParams.get('payment') === 'success';
    const orderIdFromUrl = urlParams.get('orderId');
    
    // Check localStorage for stored orderId
    const storedOrderId = localStorage.getItem('lastDuesOrderId');
    
    // Priority: URL param > localStorage
    const orderIdToProcess = orderIdFromUrl || storedOrderId;
    
    if (orderIdToProcess && orderIdToProcess.startsWith('DUES_')) {
      console.log('🔄 Found dues orderId, processing...', orderIdToProcess);
      // Small delay to ensure component is fully mounted and wallet data loaded
      setTimeout(() => {
        processDuesOrder(orderIdToProcess, { silent: true });
      }, 2000);
      
      // Clean up URL params after processing
      if (orderIdFromUrl) {
        setTimeout(() => {
          const newUrl = window.location.pathname;
          window.history.replaceState({}, '', newUrl);
        }, 3000);
      }
    }
  }, []);

  const handlePayDues = async () => {
    if (totalDues <= 0) {
      alert('No dues to pay');
      return;
    }

    if (!window.confirm(`Pay ₹${totalDues.toFixed(2)} as commission dues?`)) {
      return;
    }

    try {
      setPayingDues(true);
      console.log('🔄 Initiating dues payment...');
      const result = await freelancerService.payDues();
      
      console.log('📋 Payment response:', result);
      
      if (result.success) {
        if (result.paymentUrl) {
          // Open PhonePe payment URL in new window
          console.log('🔗 Opening payment URL:', result.paymentUrl);
          const paymentWindow = window.open(result.paymentUrl, '_blank', 'noopener,noreferrer');
          
          if (!paymentWindow) {
            // Popup blocked - try redirect instead
            alert('Popup blocked. Redirecting to payment page...');
            window.location.href = result.paymentUrl;
            return;
          }
          
          // Show success message with order ID
          const orderId = result.orderId || 'N/A';

          // Persist orderId so we can process dues after redirect/success
          if (orderId && orderId !== 'N/A') {
            localStorage.setItem('lastDuesOrderId', orderId);
          }

          alert(`Payment page opened.\n\nOrder ID: ${orderId}\n\nAfter completing payment, we will auto-check dues clearance when you return.`);
          
          // After a short delay, try processing dues (silent) in case redirect already happened
          if (orderId && orderId !== 'N/A') {
            setTimeout(() => {
              processDuesOrder(orderId, { silent: true });
            }, 7000);
          }
        } else {
          console.error('❌ No payment URL in response:', result);
          alert('Payment URL not received. Please check console for details.');
        }
      } else {
        console.error('❌ Payment request failed:', result);
        alert(result.message || 'Failed to create payment request');
      }
    } catch (error) {
      console.error('❌ Error paying dues:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to process dues payment';
      alert(`Error: ${errorMessage}`);
    } finally {
      setPayingDues(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Dues Summary */}
      <Card className="border-red-200 bg-gradient-to-br from-red-50 to-orange-50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-red-800">
            <div className="flex items-center space-x-2">
              <Receipt className="w-5 h-5" />
              <span>Total Dues</span>
            </div>
            <Button
              onClick={handleRefresh}
              variant="outline"
              size="sm"
              loading={loading}
              className="border-red-300 text-red-700 hover:bg-red-100"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-red-700 mb-2">
                {formatAmount(totalDues)}
              </div>
              <div className="text-sm text-red-600">
                Commission dues to be paid
              </div>
            </div>
            {totalDues > 0 && (
              <Button
                onClick={handlePayDues}
                loading={payingDues}
                disabled={payingDues || totalDues <= 0}
                className="w-full bg-red-600 hover:bg-red-700 text-white"
              >
                <CreditCard className="w-4 h-4 mr-2" />
                Pay Dues
              </Button>
            )}
            
            {/* Transaction History */}
            {transactionHistory.length > 0 && (
              <div className="border-t pt-4 mt-4">
                <button
                  onClick={() => setShowTransactionHistory(!showTransactionHistory)}
                  className="w-full flex items-center justify-between text-left text-sm font-semibold text-red-800 hover:text-red-900 transition-colors"
                >
                  <div className="flex items-center space-x-2">
                    <History className="w-4 h-4" />
                    <span>Transaction History</span>
                    <span className="text-xs font-normal text-red-600">
                      ({transactionHistory.length})
                    </span>
                  </div>
                  {showTransactionHistory ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>
                
                {showTransactionHistory && (
                  <div className="mt-3 space-y-2 max-h-64 overflow-y-auto">
                    {transactionHistory.map((tx, index) => (
                      <div
                        key={tx.id || index}
                        className={`p-3 rounded-lg border ${
                          tx.isPaid
                            ? 'bg-green-50 border-green-200'
                            : 'bg-red-50 border-red-200'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="font-medium text-gray-900 text-sm">
                              {tx.jobTitle}
                            </div>
                            <div className="text-xs text-gray-600 mt-1">
                              {formatDateOnly(tx.date)} • {formatTime(tx.date)}
                            </div>
                            <div className="mt-2">
                              <div className="text-xs text-gray-500">Order ID:</div>
                              <div className="text-xs font-mono text-gray-700 bg-white px-2 py-1 rounded mt-1 inline-block">
                                {tx.orderId}
                              </div>
                            </div>
                          </div>
                          <div className="text-right ml-4">
                            <div className="text-xs text-gray-600 mb-1">Amount Received</div>
                            <div className="text-lg font-bold text-green-600">
                              {formatAmount(tx.freelancerAmount)}
                            </div>
                            {tx.isPaid && (
                              <div className="text-xs text-green-600 font-semibold mt-1">
                                ✓ Paid
                              </div>
                            )}
                            {!tx.isPaid && (
                              <div className="text-xs text-red-600 font-semibold mt-1">
                                Pending
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Commission Ledger */}
      <Card className="border-gray-200 bg-gray-50">
        <CardHeader className="pb-3">
          <CardTitle className="text-gray-800 flex items-center space-x-2">
            <Receipt className="w-5 h-5" />
            <span>Commission Ledger</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {commissionTransactions.length === 0 ? (
            <div className="text-center py-8 text-gray-600">
              <Receipt className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No commission records yet</p>
              <p className="text-sm opacity-75">Commission will appear here after jobs are completed</p>
            </div>
          ) : (
            <div className="space-y-3">
              {commissionTransactions.map((transaction, index) => {
                const transactionId = transaction.id || `txn-${index}`;
                const isExpanded = expandedTransactions.has(transactionId);
                const jobAmount = transaction.totalAmount || 0;
                const commission = transaction.commission || 0;
                const freelancerAmount = jobAmount - commission;
                const jobTitle = transaction.description || transaction.jobTitle || 'Job Payment';

                const isPaid = transaction.duesPaid || false;

                return (
                  <div
                    key={transactionId}
                    className={`bg-white rounded-lg border transition-colors ${
                      isPaid 
                        ? 'border-green-200 bg-green-50' 
                        : 'border-red-200 bg-red-50 hover:border-red-300'
                    }`}
                  >
                    {/* Simplified View (Always Visible) */}
                    <div 
                      className="p-4 cursor-pointer"
                      onClick={() => toggleTransaction(transactionId)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900 mb-1">
                            {jobTitle}
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <span>{formatDateOnly(transaction.createdAt || transaction.timestamp)}</span>
                            <span>•</span>
                            <span>{formatTime(transaction.createdAt || transaction.timestamp)}</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="text-right">
                            <div className="text-sm text-gray-600">Amount Received</div>
                            <div className="text-lg font-bold text-green-600">
                              {formatAmount(freelancerAmount)}
                            </div>
                            {!isPaid && (
                              <div className="text-xs text-red-600 font-semibold mt-1">
                                Dues: {formatAmount(commission)}
                              </div>
                            )}
                            {isPaid && (
                              <div className="text-xs text-green-600 font-semibold mt-1">
                                ✓ Paid
                              </div>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="p-1"
                          >
                            {isExpanded ? (
                              <ChevronUp className="w-5 h-5 text-gray-500" />
                            ) : (
                              <ChevronDown className="w-5 h-5 text-gray-500" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Expanded Details (Visible when clicked) */}
                    {isExpanded && (
                      <div className="border-t bg-gray-50 p-4 space-y-3">
                        {transaction.clientName && (
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-600">Client:</span>
                            <span className="font-medium text-gray-900">{transaction.clientName}</span>
                          </div>
                        )}
                        {transaction.jobId && (
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-600">Job ID:</span>
                            <span className="font-mono text-gray-700">{transaction.jobId}</span>
                          </div>
                        )}
                        <div className="bg-white rounded-lg p-3 space-y-2 border border-gray-200">
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-600">Job Amount:</span>
                            <span className="font-semibold text-gray-900">{formatAmount(jobAmount)}</span>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-600">Platform Commission (10%):</span>
                            <span className="font-semibold text-red-600">- {formatAmount(commission)}</span>
                          </div>
                          <div className="flex justify-between items-center text-sm border-t pt-2">
                            <span className="font-semibold text-gray-900">Amount Received:</span>
                            <span className="font-bold text-lg text-green-600">{formatAmount(freelancerAmount)}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default WalletContainer;