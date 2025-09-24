import React, { useState, useEffect } from 'react';
import { freelancerService } from '../../api/freelancerService';
import { Card, CardContent, CardHeader, CardTitle } from './Card';
import { Button } from './Button';
import { Input } from './Input';
import { Label } from './Label';
import { Wallet, RefreshCw } from 'lucide-react';

const WalletContainer = ({ user, onRefresh, balance, transactions, withdrawals = [] }) => {
  const [walletData, setWalletData] = useState({
    balance: 0,
    transactions: [],
    loading: false
  });

  const [filterRange, setFilterRange] = useState('all'); // all | today | yesterday | week | month

  const [withdrawalForm, setWithdrawalForm] = useState({ amount: '', upiId: '' });
  const [withdrawing, setWithdrawing] = useState(false);

  // Update wallet data from props
  useEffect(() => {
    if (user) {
      console.log('💰 WalletContainer - received props:', { balance, transactions });
      setWalletData(prev => ({
        ...prev,
        balance: typeof balance === 'number' ? balance : prev.balance,
        transactions: Array.isArray(transactions) ? transactions : prev.transactions,
        loading: false
      }));
    }
  }, [user, balance, transactions]);

  // Listen for wallet update events
  useEffect(() => {
    const handleWalletUpdate = (event) => {
      const { amount, jobAmount, orderId } = event.detail;
      
      setWalletData(prev => {
        const newTransaction = {
          id: `txn-${Date.now()}`,
          type: 'credit',
          amount: amount,
          description: `Payment received - Job Amount: ₹${jobAmount}`,
          jobTitle: 'Test Job Payment',
          clientName: 'Test Client',
          timestamp: new Date().toISOString(),
          status: 'completed',
          orderId: orderId
        };

        return {
          ...prev,
          balance: prev.balance + amount,
          transactions: [newTransaction, ...prev.transactions]
        };
      });
    };

    window.addEventListener('walletUpdate', handleWalletUpdate);
    
    return () => {
      window.removeEventListener('walletUpdate', handleWalletUpdate);
    };
  }, []);

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTransactionIcon = (type) => {
    return type === 'credit' ? '💰' : '💸';
  };

  const getTransactionColor = (type) => {
    return type === 'credit' ? 'text-green-600' : 'text-red-600';
  };

  // Date helpers for filtering
  const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const isSameDay = (a, b) => startOfDay(a).getTime() === startOfDay(b).getTime();
  const isWithinLastDays = (date, days) => {
    const now = new Date();
    const from = new Date(startOfDay(now).getTime() - (days - 1) * 24 * 60 * 60 * 1000);
    return date >= from && date <= now;
  };

  const computeFilteredTransactions = () => {
    const list = walletData.transactions || [];
    if (filterRange === 'all') return list;

    const now = new Date();
    return list.filter(tx => {
      const whenStr = tx.createdAt || tx.timestamp;
      const when = whenStr ? new Date(whenStr) : null;
      if (!when || isNaN(when.getTime())) return false;

      switch (filterRange) {
        case 'today':
          return isSameDay(when, now);
        case 'yesterday': {
          const y = new Date(now);
          y.setDate(now.getDate() - 1);
          return isSameDay(when, y);
        }
        case 'week':
          // last 7 days including today
          return isWithinLastDays(when, 7);
        case 'month': {
          return when.getFullYear() === now.getFullYear() && when.getMonth() === now.getMonth();
        }
        default:
          return true;
      }
    });
  };

  const filteredTransactions = computeFilteredTransactions();

  const handleRefresh = () => {
    setWalletData(prev => ({ ...prev, loading: true }));
    // Simulate API call
    setTimeout(() => {
      setWalletData(prev => ({ ...prev, loading: false }));
      if (onRefresh) onRefresh();
    }, 1000);
  };

  const onSubmitWithdrawal = async (e) => {
    e.preventDefault();
    if (!withdrawalForm.amount || !withdrawalForm.upiId) return;
    try {
      setWithdrawing(true);
      const res = await freelancerService.requestWithdrawal({ amount: withdrawalForm.amount, upiId: withdrawalForm.upiId });
      console.log('💸 WalletContainer - withdrawal submit result:', res);
      // Ask parent to refresh to pull latest history
      if (onRefresh) await onRefresh();
      setWithdrawalForm({ amount: '', upiId: '' });
    } finally {
      setWithdrawing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Wallet Balance */}
      <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-green-800">
            <div className="flex items-center space-x-2">
              <Wallet className="w-5 h-5" />
              <span>Wallet Balance</span>
            </div>
            <Button
              onClick={handleRefresh}
              variant="outline"
              size="sm"
              loading={walletData.loading}
              className="border-green-300 text-green-700 hover:bg-green-100"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-700 mb-2">
              {formatAmount(walletData.balance)}
            </div>
            <div className="text-sm text-green-600">
              Available Balance
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Withdrawal Form */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader className="pb-3">
          <CardTitle className="text-blue-800">Request Withdrawal</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmitWithdrawal} className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <Label htmlFor="amount">Amount (₹)</Label>
              <Input 
                id="amount" 
                type="number" 
                min="100" 
                value={withdrawalForm.amount} 
                onChange={(e) => setWithdrawalForm({...withdrawalForm, amount: e.target.value})} 
                placeholder="100" 
              />
            </div>
            <div>
              <Label htmlFor="upiId">UPI ID</Label>
              <Input 
                id="upiId" 
                type="text" 
                value={withdrawalForm.upiId} 
                onChange={(e) => setWithdrawalForm({...withdrawalForm, upiId: e.target.value})} 
                placeholder="yourname@upi" 
              />
            </div>
            <div className="flex items-end">
              <Button 
                type="submit" 
                className="w-full" 
                loading={withdrawing} 
                disabled={withdrawing || !withdrawalForm.amount || !withdrawalForm.upiId}
              >
                Request Withdrawal
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Transactions */}
      <Card className="border-gray-200 bg-gray-50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <CardTitle className="text-gray-800">Recent Transactions</CardTitle>
            <div className="flex items-center gap-2 text-sm">
              <label className="text-gray-600">Show</label>
              <select
                value={filterRange}
                onChange={(e) => setFilterRange(e.target.value)}
                className="border rounded px-2 py-1 bg-white"
              >
                <option value="all">All</option>
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-8 text-gray-600">
              <Wallet className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No transactions yet</p>
              <p className="text-sm opacity-75">Complete jobs to see payments here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="bg-white rounded-lg p-4 border border-gray-200"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <div className="text-2xl">
                        {getTransactionIcon(transaction.type)}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">
                          {transaction.description || 'Payment received'}
                        </div>
                        {transaction.clientName && (
                          <div className="text-sm text-gray-600">
                            From: {transaction.clientName}
                          </div>
                        )}
                        <div className="text-xs text-gray-500 mt-1">
                          {formatDate(transaction.createdAt || transaction.timestamp)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className={`font-semibold ${getTransactionColor(transaction.type)}`}>
                        {transaction.type === 'credit' ? '+' : '-'}{formatAmount(transaction.amount)}
                      </div>
                      <div className="text-xs text-gray-500 capitalize">
                        {transaction.status || 'completed'}
                      </div>
                    </div>
                  </div>
                  
                  {transaction.jobId && (
                    <div className="mt-2 text-sm text-gray-600">
                      Job ID: {transaction.jobId}
                    </div>
                  )}
                  {transaction.totalAmount && transaction.commission && (
                    <div className="mt-1 text-xs text-gray-500">
                      Total: ₹{transaction.totalAmount} | Commission: ₹{transaction.commission}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Withdrawal Requests */}
      <Card className="border-gray-200 bg-gray-50">
        <CardHeader className="pb-3">
          <CardTitle className="text-gray-800">Recent Withdrawal Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {(!withdrawals || withdrawals.length === 0) ? (
            <div className="text-center py-8 text-gray-600">
              <Wallet className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No withdrawal requests yet</p>
              <p className="text-sm opacity-75">Submit a request above to see it here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {withdrawals.map((wr) => (
                <div key={wr._id || wr.id} className="bg-white rounded-lg p-4 border border-gray-200">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-medium text-gray-900">
                        UPI: {wr.upiId}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {formatDate(wr.createdAt || wr.requestedAt)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">₹{Math.round((wr.amount || 0))}</div>
                      <div className="text-xs capitalize text-gray-600">{wr.status || 'pending'}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default WalletContainer;
