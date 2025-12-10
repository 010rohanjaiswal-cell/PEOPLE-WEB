import React from 'react';
import { X, Receipt, User } from 'lucide-react';
import { Button } from '../common/Button';

const BillModal = ({ isOpen, onClose, job, onConfirmPayment }) => {
  if (!isOpen || !job) return null;

  const jobAmount = job.budget || 0;
  const freelancerName = job.assignedFreelancer?.fullName || 'Freelancer';
  const jobTitle = job.title || 'Job';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-2">
            <Receipt className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-semibold">Payment Bill</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Bill Content */}
        <div className="p-6 space-y-6">
          {/* Freelancer Details */}
          {job.assignedFreelancer && (
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                {job.assignedFreelancer.profilePhoto ? (
                  <img
                    src={job.assignedFreelancer.profilePhoto}
                    alt={freelancerName}
                    className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center border-2 border-gray-300">
                    <User className="w-8 h-8 text-gray-400" />
                  </div>
                )}
                <div className="flex-1">
                  <div className="font-semibold text-lg text-gray-900">
                    {freelancerName}
                  </div>
                  {job.assignedFreelancer.freelancerId && (
                    <div className="text-sm text-gray-500">
                      ID: {job.assignedFreelancer.freelancerId}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Payment Message */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-center text-gray-800">
              <span className="font-medium">You are paying</span>{' '}
              <span className="font-semibold text-blue-700">{freelancerName}</span>{' '}
              <span className="font-medium">for</span>{' '}
              <span className="font-semibold text-blue-700">"{jobTitle}"</span>
            </p>
          </div>

          {/* Payment Amount */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6">
            <div className="text-center">
              <div className="text-sm text-gray-600 mb-2">Amount to Pay</div>
              <div className="text-4xl font-bold text-green-700">
                ₹{jobAmount.toFixed(2)}
              </div>
              <div className="text-sm text-gray-600 mt-2">to freelancer</div>
            </div>
          </div>

          {/* Note */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <p className="text-xs text-gray-700">
              <strong>Note:</strong> Please pay ₹{jobAmount.toFixed(2)} to the freelancer through your preferred method (UPI, Cash, Bank Transfer, etc.). Once payment is made, click "Paid" to mark this job as completed.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t bg-gray-50">
          <Button
            variant="outline"
            onClick={onClose}
            className="px-4"
          >
            Cancel
          </Button>
          <Button
            onClick={() => onConfirmPayment(job.id)}
            className="px-6 bg-green-600 hover:bg-green-700"
          >
            ✓ Paid
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BillModal;