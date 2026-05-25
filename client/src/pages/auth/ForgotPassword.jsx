import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { Mail, CheckCircle, ShieldAlert, ArrowLeft } from 'lucide-react';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess(false);

    try {
      const response = await api.post('/api/auth/forgot-password', { email });
      if (response.data && response.data.success) {
        setSuccess(true);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white border border-gray-200 rounded-xl p-8 shadow-sm">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-extrabold text-teal-900 font-sans">Reset Password</h2>
          <p className="mt-1.5 text-sm text-gray-500">Recover your account credentials via email</p>
        </div>

        {success ? (
          <div className="text-center py-4 space-y-4">
            <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center text-teal-600 mx-auto">
              <CheckCircle className="w-6 h-6" />
            </div>
            <p className="text-gray-600 text-sm leading-relaxed">
              If an account is active under <strong className="text-gray-800">{email}</strong>, a
              password reset link has been dispatched to your mailbox.
            </p>
            <p className="text-xs text-gray-400">
              Please click the link inside that email (valid for 1 hour) to configure a new
              password.
            </p>
            <div className="pt-2">
              <Link
                to="/login"
                className="btn-teal inline-block w-full flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" /> Return to Login
              </Link>
            </div>
          </div>
        ) : (
          <>
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4 rounded flex items-start gap-2 text-sm text-red-800">
                <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
                <div>{error}</div>
              </div>
            )}

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="input-teal pl-9"
                    required
                  />
                  <Mail className="absolute left-3 top-3.5 text-gray-400 w-4 h-4" />
                </div>
                <p className="mt-1 text-[10px] text-gray-400">
                  Provide the email registered to your account
                </p>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="btn-teal w-full flex items-center justify-center gap-2"
              >
                {isLoading ? 'Requesting Reset...' : 'Send Reset Link'}
              </button>

              <div className="text-center pt-2">
                <Link
                  to="/login"
                  className="text-xs text-gray-500 hover:text-teal-600 font-semibold inline-flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Login
                </Link>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
