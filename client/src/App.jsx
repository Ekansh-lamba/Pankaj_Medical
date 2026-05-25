import React, { useEffect } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  useNavigate,
  useLocation
} from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { Landmark, Info, Phone, LogIn, LayoutDashboard } from 'lucide-react';

// Common components
import ProtectedRoute from './components/common/ProtectedRoute';

// Page components
import Home from './pages/public/Home';
import About from './pages/public/About';
import Contact from './pages/public/Contact';
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import VerifyEmail from './pages/auth/VerifyEmail';

// Protected Dashboard components
import CustomerDashboard from './pages/customer/CustomerDashboard';
import StaffDashboard from './pages/staff/StaffDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';

// Layout component wrapping public pages
const Layout = ({ children }) => {
  const { isAuthenticated, user, logoutUser } = useAuthStore();
  const location = useLocation();

  // Hide header/footer inside dashboard routes to keep views clean
  const isDashboard = location.pathname.includes('/dashboard');

  const getDashboardLink = () => {
    if (!user) return '/login';
    if (user.role === 'admin') return '/admin/dashboard';
    if (user.role === 'staff') return '/staff/dashboard';
    return '/customer/dashboard';
  };

  if (isDashboard) return <>{children}</>;

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 font-sans">
      {/* Sticky Top Header Navbar */}
      <header className="sticky top-0 bg-white border-b border-gray-200 z-40 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <Link
            to="/"
            style={{ textDecoration: 'none' }}
            className="flex items-center gap-2 text-teal-700 font-extrabold text-lg"
          >
            <Landmark className="w-6 h-6" />
            <span>Pankaj Medical</span>
          </Link>

          <nav className="hidden sm:flex items-center gap-6 text-sm font-semibold text-gray-500">
            <Link
              to="/"
              style={{ textDecoration: 'none' }}
              className="hover:text-teal-600 transition-colors"
            >
              Home
            </Link>
            <Link
              to="/about"
              style={{ textDecoration: 'none' }}
              className="hover:text-teal-600 transition-colors"
            >
              About Us
            </Link>
            <Link
              to="/contact"
              style={{ textDecoration: 'none' }}
              className="hover:text-teal-600 transition-colors"
            >
              Contact
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <Link
                  to={getDashboardLink()}
                  style={{ textDecoration: 'none' }}
                  className="btn-teal-outline flex items-center gap-1.5 py-1.5 px-3 text-xs"
                >
                  <LayoutDashboard className="w-3.5 h-3.5" /> Dashboard
                </Link>
                <button onClick={() => logoutUser()} className="btn-white text-xs py-1.5 px-3">
                  Sign Out
                </button>
              </>
            ) : (
              <Link
                to="/login"
                style={{ textDecoration: 'none' }}
                className="btn-teal flex items-center gap-1.5 py-1.5 px-4 text-xs"
              >
                <LogIn className="w-3.5 h-3.5" /> Sign In
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Viewport */}
      <main className="flex-grow">{children}</main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-10 px-4 md:px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 text-center md:text-left text-sm text-gray-500">
          <div>
            <h4 className="font-extrabold text-teal-800 text-base mb-3">
              PANKAJ MEDICAL & GENERAL STORES
            </h4>
            <p className="leading-relaxed max-w-sm">
              Your neighborhood digital pharmacy. Providing batch-verified genuine medicines and
              supplements inside Kanpur.
            </p>
          </div>
          <div className="space-y-2 md:text-right">
            <h4 className="font-bold text-gray-700 uppercase tracking-wider text-xs mb-1">
              Corporate Registration
            </h4>
            <p>
              <strong>GSTIN:</strong> 09ACPPL2448G1ZB
            </p>
            <p>
              <strong>Registered Address:</strong> 133/17 M Block, Kidwainagar, Kanpur Nagar, UP
            </p>
          </div>
        </div>
        <div className="max-w-6xl mx-auto border-t border-gray-100 mt-8 pt-6 text-center text-xs text-gray-400">
          <p>
            © {new Date().getFullYear()} Pankaj Medical and General Stores. All Rights Reserved.
            Compliant with UP Drugs Department.
          </p>
        </div>
      </footer>
    </div>
  );
};

// Main routing config
const App = () => {
  const checkSession = useAuthStore((state) => state.checkSession);

  // Attempt session recovery on application bootup
  useEffect(() => {
    checkSession();
  }, [checkSession]);

  return (
    <Router>
      <Layout>
        <Routes>
          {/* Public Pages */}
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />

          {/* Auth Pages */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/verify-email" element={<VerifyEmail />} />

          {/* Protected Customer Routes */}
          <Route element={<ProtectedRoute roles={['customer']} />}>
            <Route path="/customer/dashboard" element={<CustomerDashboard />} />
          </Route>

          {/* Protected Staff Routes */}
          <Route element={<ProtectedRoute roles={['staff']} />}>
            <Route path="/staff/dashboard" element={<StaffDashboard />} />
          </Route>

          {/* Protected Admin Routes */}
          <Route element={<ProtectedRoute roles={['admin']} />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
          </Route>

          {/* Catch-all Redirect */}
          <Route
            path="*"
            element={
              <Link to="/" className="text-teal-600 block text-center py-10">
                Page not found. Return to Home
              </Link>
            }
          />
        </Routes>
      </Layout>
    </Router>
  );
};

export default App;
