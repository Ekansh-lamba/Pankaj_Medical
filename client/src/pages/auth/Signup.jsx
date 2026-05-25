import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { ShieldAlert, UserPlus, Mail, Key, Phone, User, CheckCircle } from 'lucide-react';

const Signup = () => {
  const navigate = useNavigate();
  const { signupUser, isLoading, error, clearErrors } = useAuthStore();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [localError, setLocalError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    clearErrors();

    if (password !== confirmPassword) {
      setLocalError('Passwords do not match.');
      return;
    }

    if (password.length < 8) {
      setLocalError('Password must be at least 8 characters long.');
      return;
    }

    try {
      const details = { name, email, password };
      if (phone) {
        details.phone = phone.startsWith('+') ? phone : `+91${phone}`; // Auto add India code if country code missing
      }

      const response = await signupUser(details);
      if (response && response.success) {
        setSuccess(true);
      }
    } catch (err) {
      // Errors handled by Zustand store
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white border border-gray-200 rounded-xl p-8 shadow-sm">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-extrabold text-teal-900">Create Account</h2>
          <p className="mt-1.5 text-sm text-gray-500">
            Register as a customer for medicine ordering
          </p>
        </div>

        {success ? (
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center text-teal-600 mx-auto">
              <CheckCircle className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-bold text-gray-800">Registration Successful!</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              We have dispatched a verification link to your email address: <br />
              <strong className="text-gray-800">{email}</strong>.
            </p>
            <p className="text-gray-500 text-xs">
              Please click the link in your email to activate your account. You can then log in.
            </p>
            <div className="pt-4">
              <Link to="/login" className="btn-teal inline-block w-full">
                Go to Login
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Error Banner */}
            {(error || localError) && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4 rounded flex items-start gap-2 text-sm text-red-800">
                <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
                <div>{localError || error}</div>
              </div>
            )}

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    className="input-teal pl-9"
                    required
                  />
                  <User className="absolute left-3 top-3.5 text-gray-400 w-4 h-4" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="johndoe@example.com"
                    className="input-teal pl-9"
                    required
                  />
                  <Mail className="absolute left-3 top-3.5 text-gray-400 w-4 h-4" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                  Phone Number (Optional)
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="9876543210"
                    className="input-teal pl-9"
                  />
                  <Phone className="absolute left-3 top-3.5 text-gray-400 w-4 h-4" />
                </div>
                <p className="mt-0.5 text-[10px] text-gray-400">10-digit mobile number</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 8 characters"
                    className="input-teal pl-9"
                    required
                  />
                  <Key className="absolute left-3 top-3.5 text-gray-400 w-4 h-4" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    className="input-teal pl-9"
                    required
                  />
                  <Key className="absolute left-3 top-3.5 text-gray-400 w-4 h-4" />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="btn-teal w-full flex items-center justify-center gap-2 mt-2"
              >
                <UserPlus className="w-5 h-5" /> {isLoading ? 'Creating Account...' : 'Sign Up'}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-gray-600">
              Already have an account?{' '}
              <Link
                to="/login"
                style={{ textDecoration: 'none' }}
                className="font-semibold text-teal-600 hover:underline"
              >
                Sign In
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default Signup;
