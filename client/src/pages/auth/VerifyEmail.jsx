import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';
import { CheckCircle, ShieldAlert, Loader } from 'lucide-react';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [isLoading, setIsLoading] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verify = async () => {
      if (!token) {
        setIsLoading(false);
        setMessage('Verification token is missing. Check your link.');
        return;
      }

      try {
        const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        // Hit the backend email verification API
        // Since backend verifyEmail controller returns visual HTML directly,
        // we can fetch it, or perform a custom API check. Let's treat the HTML fetch as success.
        await axios.get(`${baseURL}/api/auth/verify-email/${token}`);
        setIsSuccess(true);
        setMessage('Your email has been successfully verified! You can now log in.');
      } catch (err) {
        setIsSuccess(false);
        setMessage(err.response?.data?.message || 'Verification link is invalid or has expired.');
      } finally {
        setIsLoading(false);
      }
    };

    verify();
  }, [token]);

  return (
    <div className="bg-gray-50 min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white border border-gray-200 rounded-xl p-8 shadow-sm text-center">
        <h2 className="text-2xl font-extrabold text-teal-900 mb-6">Email Verification</h2>

        {isLoading ? (
          <div className="py-8 flex flex-col items-center justify-center gap-3">
            <Loader className="w-10 h-10 text-teal-600 animate-spin" />
            <p className="text-gray-500 text-sm">Verifying your registration details...</p>
          </div>
        ) : isSuccess ? (
          <div className="space-y-4 py-4">
            <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center text-teal-600 mx-auto">
              <CheckCircle className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-bold text-gray-800">Verification Successful!</h3>
            <p className="text-gray-600 text-sm leading-relaxed">{message}</p>
            <div className="pt-4">
              <Link to="/login" className="btn-teal inline-block w-full">
                Proceed to Login
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center text-red-600 mx-auto">
              <ShieldAlert className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-bold text-gray-800">Verification Failed</h3>
            <p className="text-gray-600 text-sm leading-relaxed">{message}</p>
            <div className="pt-4">
              <Link to="/login" className="btn-white inline-block w-full">
                Return to Login
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;
