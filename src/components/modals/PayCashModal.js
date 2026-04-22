import React, { useState } from 'react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Label } from '../common/Label';

const PayCashModal = ({ isOpen, onClose, job, onConfirmPayment }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!isOpen || !job) return null;

  const totalAmount = job.amount || 0;
  const commission = Math.round(totalAmount * 0.1 * 100) / 100; // 10% commission
  const cashAmount = totalAmount - commission; // Amount to pay in cash

  const handleConfirmPayment = async () => {
    try {
      setIsLoading(true);
      setError('');
      setSuccess('');

      await onConfirmPayment(job.id, {
        paymentMethod: 'cash',
        totalAmount: totalAmount,
        commission: commission,
        cashAmount: cashAmount
      });

      setSuccess('Payment confirmed! Commission added to freelancer ledger.');
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      setError(error.message || 'Failed to confirm payment');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Pay Cash</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <Label>Job Title</Label>
              <p className="text-sm text-gray-600">{job.title}</p>
            </div>

            <div>
              <Label>Total Amount</Label>
              <p className="text-lg font-semibold text-gray-900">₹{totalAmount}</p>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="font-medium text-yellow-800 mb-2">Cash Payment Details</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-yellow-700">Amount to pay freelancer:</span>
                  <span className="font-semibold text-yellow-800">₹{cashAmount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-yellow-700">Commission (10%):</span>
                  <span className="font-semibold text-yellow-800">₹{commission}</span>
                </div>
                <div className="border-t border-yellow-300 pt-2">
                  <div className="flex justify-between">
                    <span className="text-yellow-700 font-medium">Total:</span>
                    <span className="font-bold text-yellow-800">₹{totalAmount}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-medium text-blue-800 mb-2">Important Notes</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Pay ₹{cashAmount} directly to the freelancer</li>
                <li>• Commission of ₹{commission} will be added to freelancer's ledger</li>
                <li>• Freelancer must pay the commission to complete the job</li>
              </ul>
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
                onClick={onClose}
                variant="outline"
                className="flex-1"
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmPayment}
                className="flex-1"
                disabled={isLoading}
              >
                {isLoading ? 'Processing...' : 'Confirm Payment'}
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default PayCashModal;
