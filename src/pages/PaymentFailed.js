import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';

const PaymentFailed = () => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');
  const state = searchParams.get('state');
  
  // Debug: Log all search params
  console.log('PaymentFailed - All search params:', Object.fromEntries(searchParams.entries()));
  console.log('PaymentFailed - orderId:', orderId);
  console.log('PaymentFailed - state:', state);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Card className="w-full max-w-md">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Failed</h2>
          <p className="text-gray-600 mb-4">
            Your payment could not be processed. Please try again.
          </p>
          {orderId && (
            <p className="text-sm text-gray-500 mb-2">
              Order ID: {orderId}
            </p>
          )}
          {state && (
            <p className="text-sm text-gray-500 mb-6">
              Status: {state}
            </p>
          )}
          <div className="space-y-3">
            <Button 
              onClick={() => window.location.href = '/client/dashboard'}
              className="w-full"
            >
              Back to Dashboard
            </Button>
            <Button 
              onClick={() => window.history.back()}
              variant="outline"
              className="w-full"
            >
              Try Again
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default PaymentFailed;
