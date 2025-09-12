import React from 'react';

const SimpleLogin = () => {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-white text-2xl">📱</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h1>
            <p className="text-gray-600 text-lg">Enter your mobile number to get started</p>
          </div>
          
          <form className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mobile Number
              </label>
              <input
                type="tel"
                placeholder="+91 9876543210"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg"
            >
              Send OTP
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              We'll send you a verification code via SMS
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleLogin;
