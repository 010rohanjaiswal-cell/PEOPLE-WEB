import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './Card';
import { Button } from './Button';
import { Wallet, CreditCard, TrendingUp, History, RefreshCw } from 'lucide-react';

const WalletContainer = ({ user, onRefresh, balance, transactions }) => {
  const [walletData, setWalletData] = useState({
    balance: 0,
    transactions: [],
    loading: false
  });

  const [showTransactions, setShowTransactions] = useState(false);

  // Mock wallet data for testing
  useEffect(() => {
    if (user) {
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

  const handleRefresh = () => {
    setWalletData(prev => ({ ...prev, loading: true }));
    // Simulate API call
    setTimeout(() => {
      setWalletData(prev => ({ ...prev, loading: false }));
      if (onRefresh) onRefresh();
    }, 1000);
  };

  return (
    <div className="space-y-4">
      {/* Main Wallet Card */}
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
            <div className="text-sm text-green-600 mb-4">
              Available Balance
            </div>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="bg-white/50 rounded-lg p-3">
                <div className="flex items-center justify-center space-x-1 text-green-600">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-sm font-medium">This Month</span>
                </div>
                <div className="text-lg font-semibold text-green-700 mt-1">
                  {formatAmount(walletData.transactions
                    .filter(t => t.type === 'credit')
                    .reduce((sum, t) => sum + t.amount, 0)
                  )}
                </div>
              </div>
              
              <div className="bg-white/50 rounded-lg p-3">
                <div className="flex items-center justify-center space-x-1 text-green-600">
                  <CreditCard className="w-4 h-4" />
                  <span className="text-sm font-medium">Total Jobs</span>
                </div>
                <div className="text-lg font-semibold text-green-700 mt-1">
                  {walletData.transactions.length}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Section */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-blue-800">
            <div className="flex items-center space-x-2">
              <History className="w-5 h-5" />
              <span>Recent Transactions</span>
            </div>
            <Button
              onClick={() => setShowTransactions(!showTransactions)}
              variant="outline"
              size="sm"
              className="border-blue-300 text-blue-700 hover:bg-blue-100"
            >
              {showTransactions ? 'Hide' : 'Show'} Details
            </Button>
          </CardTitle>
        </CardHeader>
        
        {showTransactions && (
          <CardContent>
            {walletData.transactions.length === 0 ? (
              <div className="text-center py-8 text-blue-600">
                <Wallet className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No transactions yet</p>
                <p className="text-sm opacity-75">Complete jobs to see payments here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {walletData.transactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="bg-white rounded-lg p-4 border border-blue-200"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <div className="text-2xl">
                          {getTransactionIcon(transaction.type)}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">
                            {transaction.jobTitle}
                          </div>
                          <div className="text-sm text-gray-600">
                            From: {transaction.clientName}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {formatDate(transaction.timestamp)}
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className={`font-semibold ${getTransactionColor(transaction.type)}`}>
                          {transaction.type === 'credit' ? '+' : '-'}{formatAmount(transaction.amount)}
                        </div>
                        <div className="text-xs text-gray-500 capitalize">
                          {transaction.status}
                        </div>
                      </div>
                    </div>
                    
                    {transaction.description && (
                      <div className="mt-2 text-sm text-gray-600">
                        {transaction.description}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Commission Info */}
      <Card className="border-orange-200 bg-orange-50">
        <CardHeader className="pb-3">
          <CardTitle className="text-orange-800 text-sm">
            💡 Commission Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-orange-700 space-y-2">
            <div className="flex justify-between">
              <span>Platform Commission:</span>
              <span className="font-medium">10%</span>
            </div>
            <div className="flex justify-between">
              <span>Freelancer Receives:</span>
              <span className="font-medium">90%</span>
            </div>
            <div className="text-xs text-orange-600 mt-2 p-2 bg-orange-100 rounded">
              Example: ₹100 job → You receive ₹90, Platform gets ₹10
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WalletContainer;
