import { useEffect } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  useLocation
} from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { Landmark, LogIn, LayoutDashboard, ShoppingBag } from 'lucide-react';
import { Toaster } from 'react-hot-toast';

// Common components
import ProtectedRoute from './components/common/ProtectedRoute';

// Layouts
import AdminLayout from './components/layout/AdminLayout';
import StaffLayout from './components/layout/StaffLayout';
import CustomerLayout from './components/layout/CustomerLayout';

// Page components
import Home from './pages/public/Home';
import About from './pages/public/About';
import Contact from './pages/public/Contact';
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import VerifyEmail from './pages/auth/VerifyEmail';

// Phase 2 components
import SearchBar from './components/shared/SearchBar';
import ProductList from './pages/public/ProductList';
import ProductDetail from './pages/public/ProductDetail';
import Products from './pages/admin/Products';
import AddEditProduct from './pages/admin/AddEditProduct';
import CsvImport from './pages/admin/CsvImport';
import ExpiryPage from './pages/staff/ExpiryPage';

// Phase 3 components
import Cart from './pages/customer/Cart';
import Checkout from './pages/customer/Checkout';
import OrderHistory from './pages/customer/OrderHistory';
import OrderDetail from './pages/customer/OrderDetail';
import Profile from './pages/customer/Profile';
import OrderQueue from './pages/staff/OrderQueue';
import PrescriptionReview from './pages/staff/PrescriptionReview';

// Shared UI & Hooks
import { useCart } from './hooks/useCart';
import NotificationBell from './components/shared/NotificationBell';

// Protected Dashboard components
import CustomerDashboard from './pages/customer/CustomerDashboard';
import StaffDashboard from './pages/staff/StaffDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';

// Layout component wrapping public pages
const Layout = ({ children }) => {
  const { isAuthenticated, user, logoutUser } = useAuthStore();
  const { itemCount, fetchCart } = useCart();
  const location = useLocation();

  // Load cart once on layout mount
  useEffect(() => {
    fetchCart();
  }, [isAuthenticated]);

  // Hide public header/footer inside all portal routes (admin, staff, customer)
  const isPortal = location.pathname.startsWith('/admin') ||
                   location.pathname.startsWith('/staff') ||
                   location.pathname.startsWith('/customer') ||
                   location.pathname.startsWith('/my-orders') ||
                   location.pathname.startsWith('/checkout') ||
                   location.pathname.startsWith('/profile') ||
                   location.pathname.includes('/dashboard');

  if (isPortal) return <>{children}</>;

  const getDashboardLink = () => {
    if (!user) return '/login';
    if (user.role === 'admin') return '/admin/dashboard';
    if (user.role === 'staff') return '/staff/dashboard';
    return '/customer/dashboard';
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 font-sans">
      {/* Sticky Top Header Navbar */}
      <header className="sticky top-0 bg-white border-b border-gray-200 z-40 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between gap-4">
          <Link
            to="/"
            style={{ textDecoration: 'none' }}
            className="flex items-center gap-2 text-teal-700 font-extrabold text-lg shrink-0"
          >
            <Landmark className="w-6 h-6" />
            <span className="hidden xs:inline">Pankaj Medical</span>
          </Link>

          <nav className="hidden lg:flex items-center gap-6 text-sm font-semibold text-gray-500 shrink-0">
            <Link
              to="/"
              style={{ textDecoration: 'none' }}
              className="hover:text-teal-600 transition-colors"
            >
              Home
            </Link>
            <Link
              to="/products"
              style={{ textDecoration: 'none' }}
              className="hover:text-teal-600 transition-colors"
            >
              Medicines
            </Link>
            <Link
              to="/about"
              style={{ textDecoration: 'none' }}
              className="hover:text-teal-600 transition-colors"
            >
              About
            </Link>
            <Link
              to="/contact"
              style={{ textDecoration: 'none' }}
              className="hover:text-teal-600 transition-colors"
            >
              Contact
            </Link>
          </nav>

          {/* Autocomplete SearchBar wired into the main Navbar */}
          <div className="flex-grow max-w-sm sm:max-w-xs md:max-w-md mx-2">
            <SearchBar />
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Always visible Cart icon */}
            <Link
              to="/cart"
              style={{ textDecoration: 'none' }}
              className="relative p-2 text-gray-500 hover:text-teal-600 hover:bg-gray-100 rounded-full transition-colors shrink-0"
            >
              <ShoppingBag className="w-5 h-5" />
              {itemCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-teal-600 text-white text-[9px] font-black rounded-full flex items-center justify-center border border-white">
                  {itemCount}
                </span>
              )}
            </Link>

            {isAuthenticated ? (
              <>
                <NotificationBell />
                <Link
                  to={getDashboardLink()}
                  style={{ textDecoration: 'none' }}
                  className="btn-teal-outline flex items-center gap-1.5 py-1.5 px-3 text-xs font-bold"
                >
                  <LayoutDashboard className="w-3.5 h-3.5" /> Dashboard
                </Link>
                <button onClick={() => logoutUser()} className="btn-white text-xs py-1.5 px-3 font-bold">
                  Sign Out
                </button>
              </>
            ) : (
              <Link
                to="/login"
                style={{ textDecoration: 'none' }}
                className="btn-teal flex items-center gap-1.5 py-1.5 px-4 text-xs font-bold"
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
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Toaster position="top-right" toastOptions={{ className: 'font-sans text-xs font-bold' }} />
      <Layout>
        <Routes>
          {/* Public Pages */}
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/products" element={<ProductList />} />
          <Route path="/products/:slug" element={<ProductDetail />} />
          <Route path="/cart" element={<Cart />} />

          {/* Auth Pages */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/verify-email" element={<VerifyEmail />} />

          {/* Protected Customer Routes */}
          <Route element={<ProtectedRoute roles={['customer']} />}>
            <Route element={<CustomerLayout />}>
              <Route path="/customer/dashboard" element={<CustomerDashboard />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/my-orders" element={<OrderHistory />} />
              <Route path="/my-orders/:id" element={<OrderDetail />} />
              <Route path="/profile" element={<Profile />} />
            </Route>
          </Route>

          {/* Protected Staff & Admin Shared Routes */}
          <Route element={<ProtectedRoute roles={['staff', 'admin']} />}>
            <Route element={<StaffLayout />}>
              <Route path="/staff/dashboard" element={<StaffDashboard />} />
              <Route path="/staff/expiry" element={<ExpiryPage />} />
              <Route path="/staff/orders" element={<OrderQueue />} />
              <Route path="/staff/prescriptions" element={<PrescriptionReview />} />
            </Route>
          </Route>

          {/* Protected Admin Only Routes */}
          <Route element={<ProtectedRoute roles={['admin']} />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/products" element={<Products />} />
              <Route path="/admin/products/add" element={<AddEditProduct />} />
              <Route path="/admin/products/edit/:id" element={<AddEditProduct />} />
              <Route path="/admin/products/import" element={<CsvImport />} />
              <Route path="/admin/expiry" element={<ExpiryPage />} />
              <Route path="/admin/orders" element={<OrderQueue />} />
              <Route path="/admin/prescriptions" element={<PrescriptionReview />} />
            </Route>
          </Route>

          {/* Catch-all Redirect */}
          <Route
            path="*"
            element={
              <Link to="/" className="text-teal-600 block text-center py-10 font-bold">
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

