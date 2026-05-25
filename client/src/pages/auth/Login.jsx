import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import {
  auth,
  googleProvider,
  signInWithPopup,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  isFirebaseConfigured
} from '../../services/firebase';
import { ShieldAlert, LogIn, Phone, Chrome, Key, Mail, CheckCircle } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Zustand Auth Store state
  const {
    loginUser,
    loginWithGoogle,
    loginWithPhone,
    isLoading,
    error,
    clearErrors,
    isAuthenticated,
    user
  } = useAuthStore();

  // Tab views: 'email', 'phone'
  const [authMethod, setAuthMethod] = useState('email');

  // Email States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  // Phone States
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [recaptchaVerifier, setRecaptchaVerifier] = useState(null);

  // Success states
  const [successMsg, setSuccessMsg] = useState('');
  const [localError, setLocalError] = useState('');

  // Check if session alert is in URL query parameters
  useEffect(() => {
    clearErrors();
    setLocalError('');
    const params = new URLSearchParams(location.search);
    if (params.get('expired')) {
      setLocalError('Your session has expired. Please log in again.');
    }
  }, [location]);

  // Handle redirect on successful authentication
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'admin') {
        navigate('/admin/dashboard');
      } else if (user.role === 'staff') {
        navigate('/staff/dashboard');
      } else {
        navigate('/customer/dashboard');
      }
    }
  }, [isAuthenticated, user, navigate]);

  // Clean recaptcha verifier when changing tabs or unmounting
  useEffect(() => {
    return () => {
      if (recaptchaVerifier) {
        recaptchaVerifier.clear();
      }
    };
  }, [recaptchaVerifier]);

  // Email/Password Submit
  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    try {
      await loginUser(email, password, rememberMe);
    } catch (err) {
      // Handled by Zustand store error
    }
  };

  // Google OAuth Popup Flow
  const handleGoogleLogin = async () => {
    setLocalError('');
    clearErrors();

    if (!isFirebaseConfigured) {
      // Mock Login Fallback for environment testing
      setLocalError('Firebase is not configured yet. Simulating Admin Google login...');
      setTimeout(async () => {
        try {
          await loginUser('admin@pankajmedical.com', 'dummyPasswordForSimulation');
        } catch (err) {
          setLocalError('Mock simulation failed. Check ADMIN_EMAIL env.');
        }
      }, 1500);
      return;
    }

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();
      await loginWithGoogle(idToken);
    } catch (err) {
      console.error('Google Auth Popup Error:', err);
      setLocalError(err.message || 'Google OAuth failed.');
    }
  };

  // Initialize Recaptcha Verifier
  const initRecaptcha = () => {
    if (recaptchaVerifier) return recaptchaVerifier;

    try {
      const verifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: (response) => {
          // reCAPTCHA solved, allow signInWithPhoneNumber.
        },
        'expired-callback': () => {
          setLocalError('reCAPTCHA expired. Please try again.');
        }
      });
      setRecaptchaVerifier(verifier);
      return verifier;
    } catch (err) {
      console.error('Recaptcha creation failed:', err);
      setLocalError('Failed to initialize security verification.');
      return null;
    }
  };

  // Send Phone OTP Flow
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setLocalError('');
    clearErrors();

    if (!phone.startsWith('+')) {
      setLocalError('Phone number must include country code (e.g. +91XXXXXXXXXX)');
      return;
    }

    if (!isFirebaseConfigured) {
      // Mock Phone Fallback
      setLocalError('Firebase is not configured. Simulating phone verification token...');
      setTimeout(() => {
        setOtpSent(true);
        setSuccessMsg('MOCK OTP sent! Enter 123456 to verify.');
      }, 1000);
      return;
    }

    try {
      const verifier = initRecaptcha();
      if (!verifier) return;

      const confirmation = await signInWithPhoneNumber(auth, phone, verifier);
      setConfirmationResult(confirmation);
      setOtpSent(true);
      setSuccessMsg('OTP sent successfully! Please check your mobile phone.');
    } catch (err) {
      console.error('Phone OTP Send Error:', err);
      setLocalError(err.message || 'Failed to dispatch phone OTP.');
    }
  };

  // Verify Phone OTP & Backend setup
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLocalError('');
    clearErrors();

    if (!isFirebaseConfigured) {
      // Mock Phone OTP Verify
      if (otp === '123456') {
        setSuccessMsg('OTP Verified! Generating mock customer session...');
        // Mock a login
        try {
          await loginUser('admin@pankajmedical.com', 'dummyPasswordForSimulation');
        } catch (err) {
          setLocalError('Mock registration simulation failed.');
        }
      } else {
        setLocalError('Invalid mock OTP code. Type 123456');
      }
      return;
    }

    try {
      if (!confirmationResult) {
        setLocalError('OTP session expired. Please request a new code.');
        return;
      }

      const result = await confirmationResult.confirm(otp);
      const idToken = await result.user.getIdToken();

      // Send Firebase token to backend to get custom JWT and register/fetch customer
      await loginWithPhone(idToken, 'Phone Customer');
    } catch (err) {
      console.error('Phone OTP Confirm Error:', err);
      setLocalError(err.message || 'OTP verification failed. Check the entered code.');
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white border border-gray-200 rounded-xl p-8 shadow-sm">
        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-extrabold text-teal-900">Pankaj Medical Stores</h2>
          <p className="mt-1.5 text-sm text-gray-500">Sign in to manage prescriptions and orders</p>
        </div>

        {/* Error Alerts */}
        {(error || localError) && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4 rounded flex items-start gap-2 text-sm text-red-800">
            <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
            <div>{localError || error}</div>
          </div>
        )}

        {/* Success Alerts */}
        {successMsg && (
          <div className="bg-teal-50 border-l-4 border-teal-500 p-4 mb-4 rounded flex items-start gap-2 text-sm text-teal-800">
            <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>{successMsg}</div>
          </div>
        )}

        {/* Method Toggles */}
        <div className="flex border-b border-gray-200 mb-6">
          <button
            onClick={() => {
              setAuthMethod('email');
              clearErrors();
              setLocalError('');
            }}
            className={`flex-1 pb-3 text-sm font-semibold text-center border-b-2 transition-all ${
              authMethod === 'email'
                ? 'border-teal-600 text-teal-600'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            Email Login
          </button>
          <button
            onClick={() => {
              setAuthMethod('phone');
              clearErrors();
              setLocalError('');
            }}
            className={`flex-1 pb-3 text-sm font-semibold text-center border-b-2 transition-all ${
              authMethod === 'phone'
                ? 'border-teal-600 text-teal-600'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            OTP Login
          </button>
        </div>

        {/* Form area */}
        {authMethod === 'email' ? (
          <form className="space-y-4" onSubmit={handleEmailSubmit}>
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
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-semibold text-gray-500 uppercase">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  style={{ textDecoration: 'none' }}
                  className="text-xs text-teal-600 hover:underline"
                >
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-teal pl-9"
                  required
                />
                <Key className="absolute left-3 top-3.5 text-gray-400 w-4 h-4" />
              </div>
            </div>

            <div className="flex items-center">
              <input
                id="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                Remember me (30 days)
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-teal w-full flex items-center justify-center gap-2"
            >
              <LogIn className="w-5 h-5" /> {isLoading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>
        ) : (
          <div className="space-y-4">
            {!otpSent ? (
              <form className="space-y-4" onSubmit={handleSendOtp}>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                    Mobile Phone Number
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+919876543210"
                      className="input-teal pl-9"
                      required
                    />
                    <Phone className="absolute left-3 top-3.5 text-gray-400 w-4 h-4" />
                  </div>
                  <p className="mt-1 text-xs text-gray-400">
                    Include country code (e.g. +91 for India)
                  </p>
                </div>

                <div id="recaptcha-container"></div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-teal w-full flex items-center justify-center gap-2"
                >
                  <Phone className="w-5 h-5" /> Send Verification OTP
                </button>
              </form>
            ) : (
              <form className="space-y-4" onSubmit={handleVerifyOtp}>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                    Enter SMS OTP Code
                  </label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="6-digit code"
                    className="input-teal text-center text-lg tracking-widest font-mono"
                    maxLength={6}
                    required
                  />
                </div>

                <div className="flex gap-2">
                  <button type="submit" disabled={isLoading} className="btn-teal flex-1">
                    {isLoading ? 'Verifying...' : 'Verify OTP'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setOtpSent(false);
                      setSuccessMsg('');
                    }}
                    className="btn-white"
                  >
                    Change Number
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-gray-400">Or continue with</span>
          </div>
        </div>

        {/* Social Authentication */}
        <button
          onClick={handleGoogleLogin}
          disabled={isLoading}
          className="btn-white w-full flex items-center justify-center gap-2"
        >
          <Chrome className="w-4 h-4 text-red-500" /> Use Google OAuth
        </button>

        {/* Footnotes */}
        <p className="mt-6 text-center text-sm text-gray-600">
          New Customer?{' '}
          <Link
            to="/signup"
            style={{ textDecoration: 'none' }}
            className="font-semibold text-teal-600 hover:underline"
          >
            Register Account
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
