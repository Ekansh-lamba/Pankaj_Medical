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
import { ShieldAlert, LogIn, Phone, Chrome, Key, Mail, CheckCircle, Landmark } from 'lucide-react';

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
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">
      {/* Navy Left Panel - Hidden on mobile */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-900 via-[#1b3455] to-[#12253f] text-white p-16 flex-col justify-between relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-primary-800/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Brand */}
        <div className="flex items-center gap-2">
          <Landmark className="w-8 h-8 text-primary-300" />
          <span className="text-2xl font-black tracking-tight">Pankaj Medical & General Stores</span>
        </div>

        {/* Value Prop / Taglines */}
        <div className="space-y-8 max-w-md my-auto">
          <h1 className="text-4xl font-extrabold text-white tracking-tight leading-tight">
            Your Trusted Local Pharmacy, <span className="text-primary-300">Now Online.</span>
          </h1>
          <p className="text-slate-300 text-sm leading-relaxed">
            Order prescription medicines, over-the-counter wellness products, healthcare devices, and baby care essentials with direct home delivery inside Kanpur.
          </p>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-primary-300 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-sm text-white">100% Genuine Medicines</h4>
                <p className="text-xs text-slate-400">Direct distributor sourcing with complete batch tracking</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-primary-300 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-sm text-white">Express Delivery inside Kanpur</h4>
                <p className="text-xs text-slate-400">Same-day delivery directly to your home from Kidwainagar</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-primary-300 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-sm text-white">GST Verified Licensed Chemist</h4>
                <p className="text-xs text-slate-400">UP Drugs Department registered physical pharmacy since years</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer info in left pane */}
        <div className="text-xs text-slate-400 space-y-1">
          <p><strong>Physical Address:</strong> 133/17 M Block, Kidwainagar, Kanpur, UP</p>
          <p>© {new Date().getFullYear()} Pankaj Medical. Licensed wholesale & retail pharmacists.</p>
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="flex-1 flex items-center justify-center p-8 sm:p-12 lg:p-16">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl p-8 shadow-md">
          {/* Header */}
          <div className="text-center mb-8">
            {/* Show logo on mobile only */}
            <div className="flex lg:hidden items-center justify-center gap-2 mb-4">
              <Landmark className="w-8 h-8 text-primary-600" />
              <span className="text-xl font-black text-primary-900">Pankaj Medical</span>
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Welcome Back</h2>
            <p className="mt-1.5 text-sm text-slate-500">Sign in to manage prescriptions, orders & profile</p>
          </div>

          {/* Error Alerts */}
          {(error || localError) && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-5 rounded-lg flex items-start gap-2 text-sm text-red-800">
              <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
              <div>{localError || error}</div>
            </div>
          )}

          {/* Success Alerts */}
          {successMsg && (
            <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 mb-5 rounded-lg flex items-start gap-2 text-sm text-emerald-800">
              <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>{successMsg}</div>
            </div>
          )}

          {/* Form area */}
          {authMethod === 'email' ? (
            <form className="space-y-5" onSubmit={handleEmailSubmit}>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <div className="relative flex items-center">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="input-base pl-10"
                    required
                  />
                  <Mail className="absolute left-3.5 text-slate-400 w-4 h-4" />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Password
                  </label>
                  <Link
                    to="/forgot-password"
                    style={{ textDecoration: 'none' }}
                    className="text-xs text-primary-650 font-bold hover:underline"
                  >
                    Forgot Password?
                  </Link>
                </div>
                <div className="relative flex items-center">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="input-base pl-10"
                    required
                  />
                  <Key className="absolute left-3.5 text-slate-400 w-4 h-4" />
                </div>
              </div>

              <div className="flex items-center">
                <input
                  id="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-slate-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2.5 block text-sm font-semibold text-slate-700">
                  Remember me (30 days)
                </label>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full flex items-center justify-center gap-2 py-3 mt-2"
              >
                <LogIn className="w-4 h-4" /> {isLoading ? 'Authenticating...' : 'Sign In'}
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              {!otpSent ? (
                <form className="space-y-4" onSubmit={handleSendOtp}>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      Mobile Phone Number
                    </label>
                    <div className="relative flex items-center">
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+919876543210"
                        className="input-base pl-10"
                        required
                      />
                      <Phone className="absolute left-3.5 text-slate-400 w-4 h-4" />
                    </div>
                    <p className="mt-1 text-xs text-slate-400">
                      Include country code (e.g. +91 for India)
                    </p>
                  </div>

                  <div id="recaptcha-container"></div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="btn-primary w-full flex items-center justify-center gap-2 py-3"
                  >
                    <Phone className="w-4 h-4" /> Send Verification OTP
                  </button>
                </form>
              ) : (
                <form className="space-y-4" onSubmit={handleVerifyOtp}>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      Enter SMS OTP Code
                    </label>
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="6-digit code"
                      className="input-base text-center text-lg tracking-widest font-mono py-3"
                      maxLength={6}
                      required
                    />
                  </div>

                  <div className="flex gap-2">
                    <button type="submit" disabled={isLoading} className="btn-primary flex-1 py-3">
                      {isLoading ? 'Verifying...' : 'Verify OTP'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setOtpSent(false);
                        setSuccessMsg('');
                      }}
                      className="bg-white hover:bg-slate-50 border border-slate-300 text-slate-750 font-bold px-4 rounded-lg transition-all"
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
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-3 text-slate-400 font-semibold">Or continue with</span>
            </div>
          </div>

          {/* Social Authentication */}
          <button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full bg-white hover:bg-slate-50 border border-gray-300 text-[#374151] font-semibold py-2.5 px-4 rounded-lg shadow-sm transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2.5 text-sm"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" className="shrink-0">
              <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1.32-1.31 3.83-4.3 3.83-2.6 0-4.71-2.15-4.71-4.8s2.11-4.8 4.71-4.8c1.48 0 2.47.63 3.04 1.18l2.07-2c-1.33-1.24-3.06-2-5.11-2C4.03 3.21 1 6.24 1 9.99s3.03 6.78 6.98 6.78c4.03 0 6.7-2.83 6.7-6.82 0-.46-.05-.8-.17-1.15z"/>
            </svg>
            <span>Continue with Google</span>
          </button>

          {/* Footnotes */}
          <p className="mt-8 text-center text-sm text-slate-650">
            New Customer?{' '}
            <Link
              to="/signup"
              style={{ textDecoration: 'none' }}
              className="font-bold text-primary-600 hover:text-primary-700 hover:underline"
            >
              Register Account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
