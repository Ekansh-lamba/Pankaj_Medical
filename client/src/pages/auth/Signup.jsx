import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { ShieldAlert, UserPlus, Mail, Key, Phone, User, CheckCircle, Landmark } from 'lucide-react';

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
            Join Our Neighborhood <span className="text-primary-300">Pharmacy Network.</span>
          </h1>
          <p className="text-slate-300 text-sm leading-relaxed">
            Create an account to order prescription drugs, look up genuine medicine salts, upload medical documentation safely, and trace deliveries to your doorstep in Kanpur.
          </p>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-primary-300 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-sm text-white">Direct & Genuine Sourcing</h4>
                <p className="text-xs text-slate-400">Strictly verified distributor procurement chain</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-primary-300 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-sm text-white">Digitized Prescription Review</h4>
                <p className="text-xs text-slate-400">Dedicated staff verifying uploads within Kanpur hours</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-primary-300 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-sm text-white">UP Drugs Registered Chemist</h4>
                <p className="text-xs text-slate-400">Trusted brick-and-mortar storefront inside Kidwainagar</p>
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
          <div className="text-center mb-6">
            {/* Show logo on mobile only */}
            <div className="flex lg:hidden items-center justify-center gap-2 mb-4">
              <Landmark className="w-8 h-8 text-primary-600" />
              <span className="text-xl font-black text-primary-900">Pankaj Medical</span>
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Create Account</h2>
            <p className="mt-1.5 text-sm text-slate-500">Register for medicine catalog ordering</p>
          </div>

          {success ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center text-primary-600 mx-auto">
                <CheckCircle className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold text-slate-800">Registration Successful!</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                We have dispatched a verification link to your email address: <br />
                <strong className="text-slate-800">{email}</strong>.
              </p>
              <p className="text-slate-450 text-xs">
                Please click the link in your email to activate your account. You can then log in.
              </p>
              <div className="pt-4">
                <Link to="/login" className="btn-primary w-full inline-block text-center">
                  Go to Login
                </Link>
              </div>
            </div>
          ) : (
            <>
              {/* Error Banner */}
              {(error || localError) && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-5 rounded-lg flex items-start gap-2 text-sm text-red-800">
                  <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
                  <div>{localError || error}</div>
                </div>
              )}

              <form className="space-y-4" onSubmit={handleSubmit}>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Full Name
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="John Doe"
                      className="input-base pl-10"
                      required
                    />
                    <User className="absolute left-3.5 text-slate-400 w-4 h-4" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Email Address
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="johndoe@example.com"
                      className="input-base pl-10"
                      required
                    />
                    <Mail className="absolute left-3.5 text-slate-400 w-4 h-4" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Phone Number (Optional)
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="9876543210"
                      className="input-base pl-10"
                    />
                    <Phone className="absolute left-3.5 text-slate-400 w-4 h-4" />
                  </div>
                  <p className="mt-1 text-[10px] text-slate-400">10-digit mobile number</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Password
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min 8 characters"
                      className="input-base pl-10"
                      required
                    />
                    <Key className="absolute left-3.5 text-slate-400 w-4 h-4" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Confirm Password
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat password"
                      className="input-base pl-10"
                      required
                    />
                    <Key className="absolute left-3.5 text-slate-400 w-4 h-4" />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-primary w-full flex items-center justify-center gap-2 py-3 mt-4"
                >
                  <UserPlus className="w-4 h-4" /> {isLoading ? 'Creating Account...' : 'Sign Up'}
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-slate-650">
                Already have an account?{' '}
                <Link
                  to="/login"
                  style={{ textDecoration: 'none' }}
                  className="font-bold text-primary-600 hover:text-primary-700 hover:underline"
                >
                  Sign In
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Signup;
