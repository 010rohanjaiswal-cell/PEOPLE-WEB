import React, { useState, useEffect } from 'react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Label } from '../common/Label';

const CommissionLedgerModal = ({ isOpen, onClose, freelancerId, onPayCommission }) => {
  const [ledgerEntries, setLedgerEntries] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadLedgerEntries();
    }
  }, [isOpen, freelancerId]);

  const loadLedgerEntries = async () => {
    try {
      setIsLoading(true);
      // TODO: Replace with actual API call
      const response = await fetch(`/api/freelancer/commission-ledger/${freelancerId}`);
      if (response.ok) {
        const data = await response.json();
        setLedgerEntries(data.entries || []);
      }
    } catch (error) {
      console.error('Error loading ledger entries:', error);
      setError('Failed to load ledger entries');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePayCommission = async (entry) => {
    try {
      setIsLoading(true);
      setError('');
      setSuccess('');

      await onPayCommission(entry.id, parseFloat(paymentAmount));

      setSuccess('Commission payment recorded successfully!');
      setSelectedEntry(null);
      setPaymentAmount('');
      loadLedgerEntries();
    } catch (error) {
      setError(error.message || 'Failed to record commission payment');
    } finally {
      setIsLoading(false);
    }
  };

  const totalPending = ledgerEntries
    .filter(entry => entry.status === 'pending')
    .reduce((sum, entry) => sum + entry.amount, 0);

  const totalPaid = ledgerEntries
    .filter(entry => entry.status === 'paid')
    .reduce((sum, entry) => sum + entry.amount, 0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Commission Ledger</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-blue-800">Total Pending</h3>
              <p className="text-2xl font-bold text-blue-900">₹{totalPending.toFixed(2)}</p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-green-800">Total Paid</h3>
              <p className="text-2xl font-bold text-green-900">₹{totalPaid.toFixed(2)}</p>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-800">Total Entries</h3>
              <p className="text-2xl font-bold text-gray-900">{ledgerEntries.length}</p>
            </div>
          </div>

          {/* Ledger Entries */}
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Loading ledger entries...</p>
              </div>
            ) : ledgerEntries.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No commission entries found</p>
              </div>
            ) : (
              ledgerEntries.map((entry) => (
                <div
                  key={entry.id}
                  className={`border rounded-lg p-4 ${
                    entry.status === 'pending' 
                      ? 'border-yellow-200 bg-yellow-50' 
                      : 'border-green-200 bg-green-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4">
                        <div>
                          <h4 className="font-medium text-gray-900">{entry.jobTitle}</h4>
                          <p className="text-sm text-gray-600">Job ID: {entry.jobId}</p>
                          <p className="text-sm text-gray-600">
                            Client: {entry.clientName}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-semibold text-gray-900">
                            ₹{entry.amount.toFixed(2)}
                          </p>
                          <p className={`text-sm font-medium ${
                            entry.status === 'pending' ? 'text-yellow-700' : 'text-green-700'
                          }`}>
                            {entry.status === 'pending' ? 'Pending' : 'Paid'}
                          </p>
                        </div>
                      </div>
                      <div className="mt-2 text-xs text-gray-500">
                        <p>Created: {new Date(entry.createdAt).toLocaleDateString()}</p>
                        {entry.paidAt && (
                          <p>Paid: {new Date(entry.paidAt).toLocaleDateString()}</p>
                        )}
                      </div>
                    </div>
                    {entry.status === 'pending' && (
                      <Button
                        onClick={() => setSelectedEntry(entry)}
                        size="sm"
                        className="ml-4"
                      >
                        Pay Commission
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Payment Modal */}
          {selectedEntry && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
              <Card className="w-full max-w-md mx-4">
                <div className="p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">
                    Pay Commission
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <Label>Job Title</Label>
                      <p className="text-sm text-gray-600">{selectedEntry.jobTitle}</p>
                    </div>
                    
                    <div>
                      <Label>Commission Amount</Label>
                      <p className="text-lg font-semibold text-gray-900">
                        ₹{selectedEntry.amount.toFixed(2)}
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="paymentAmount">Payment Amount</Label>
                      <Input
                        id="paymentAmount"
                        type="number"
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(e.target.value)}
                        placeholder="Enter amount paid"
                        min="0"
                        step="0.01"
                      />
                    </div>

                    {error && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <p className="text-sm text-red-700">{error}</p>
                      </div>
                    )}

                    {success && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <p className="text-sm text-green-700">{success}</p>
                      </div>
                    )}

                    <div className="flex space-x-3 pt-4">
                      <Button
                        onClick={() => {
                          setSelectedEntry(null);
                          setPaymentAmount('');
                          setError('');
                          setSuccess('');
                        }}
                        variant="outline"
                        className="flex-1"
                        disabled={isLoading}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={() => handlePayCommission(selectedEntry)}
                        className="flex-1"
                        disabled={isLoading || !paymentAmount}
                      >
                        {isLoading ? 'Processing...' : 'Record Payment'}
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          )}

          <div className="flex justify-end pt-4 border-t">
            <Button onClick={onClose} variant="outline">
              Close
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default CommissionLedgerModal;
