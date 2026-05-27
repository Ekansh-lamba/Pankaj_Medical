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
import StaffManagement from './pages/admin/StaffManagement';
import StoreSettings from './pages/admin/StoreSettings';
import AuditLogs from './pages/admin/AuditLogs';
import Maintenance from './pages/Maintenance';

// Legacy Layout wrapper (deprecated in favor of unified CustomerLayout)
const Layout = ({ children }) => {
  return <>{children}</>;
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
          {/* Public & Protected Customer Pages (All share CustomerLayout sidebar) */}
          <Route element={<CustomerLayout />}>
            {/* Public Pages */}
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/products" element={<ProductList />} />
            <Route path="/products/:slug" element={<ProductDetail />} />
            <Route path="/cart" element={<Cart />} />

            {/* Protected Customer Routes */}
            <Route element={<ProtectedRoute roles={['customer']} />}>
              <Route path="/customer/dashboard" element={<CustomerDashboard />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/my-orders" element={<OrderHistory />} />
              <Route path="/my-orders/:id" element={<OrderDetail />} />
              <Route path="/profile" element={<Profile />} />
            </Route>
          </Route>

          {/* Auth Pages */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/verify-email" element={<VerifyEmail />} />

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
              <Route path="/admin/staff" element={<StaffManagement />} />
              <Route path="/admin/settings" element={<StoreSettings />} />
              <Route path="/admin/audit-logs" element={<AuditLogs />} />
            </Route>
          </Route>

          {/* Maintenance Page */}
          <Route path="/maintenance" element={<Maintenance />} />

          {/* Catch-all Redirect */}
          <Route
            path="*"
            element={
              <Link to="/" className="text-primary-600 block text-center py-10 font-bold">
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

