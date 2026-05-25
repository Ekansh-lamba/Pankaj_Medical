import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import api from '../../services/api';
import { Key, CheckCircle, ShieldAlert, ArrowLeft } from 'lucide-react';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Password reset token is missing from the URL. Please verify your link.');
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) return;

    setIsLoading(true);
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      setIsLoading(false);
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      setIsLoading(false);
      return;
    }

    try {
      const response = await api.post(`/api/auth/reset-password/${token}`, { password });
      if (response.data && response.data.success) {
        setSuccess(true);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Password reset failed. The link may have expired.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white border border-gray-200 rounded-xl p-8 shadow-sm">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-extrabold text-teal-900">Set New Password</h2>
          <p className="mt-1.5 text-sm text-gray-500">
            Configure a secure new password for your profile
          </p>
        </div>

        {success ? (
          <div className="text-center py-4 space-y-4">
            <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center text-teal-600 mx-auto">
              <CheckCircle className="w-6 h-6" />
            </div>
            <p className="text-gray-600 text-sm font-bold">Password Reset Successful!</p>
            <p className="text-xs text-gray-400">
              Your credentials have been securely updated. You can now use your new password.
            </p>
            <div className="pt-2">
              <Link to="/login" className="btn-teal inline-block w-full text-center">
                Go to Login
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
                  New Password
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 8 characters"
                    className="input-teal pl-9"
                    required
                    disabled={!token}
                  />
                  <Key className="absolute left-3 top-3.5 text-gray-400 w-4 h-4" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                    className="input-teal pl-9"
                    required
                    disabled={!token}
                  />
                  <Key className="absolute left-3 top-3.5 text-gray-400 w-4 h-4" />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || !token}
                className="btn-teal w-full flex items-center justify-center gap-2"
              >
                {isLoading ? 'Updating Password...' : 'Save New Password'}
              </button>

              <div className="text-center pt-2">
                <Link
                  to="/login"
                  className="text-xs text-gray-500 hover:text-teal-600 font-semibold inline-flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Cancel and return to Login
                </Link>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
