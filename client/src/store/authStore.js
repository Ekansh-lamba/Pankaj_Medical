import { create } from 'zustand';
import api from '../services/api';

export const useAuthStore = create((set, get) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  setAccessToken: (token) => set({ accessToken: token }),

  clearErrors: () => set({ error: null }),

  signupUser: async (details) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/api/auth/signup', details);
      set({ isLoading: false });
      return response.data;
    } catch (err) {
      const errMsg = err.response?.data?.message || 'An error occurred during registration.';
      set({ isLoading: false, error: errMsg });
      throw err;
    }
  },

  loginUser: async (email, password, rememberMe = false) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/api/auth/login', { email, password, rememberMe });
      if (response.data && response.data.success) {
        const { accessToken, user } = response.data.data;
        set({
          accessToken,
          user,
          isAuthenticated: true,
          isLoading: false
        });
        get().refreshUser().catch(err => console.warn('Failed to load profile on login:', err));
      }
      return response.data;
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Invalid email or password.';
      set({ isLoading: false, error: errMsg });
      throw err;
    }
  },

  loginWithGoogle: async (idToken) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/api/auth/google', { idToken });
      if (response.data && response.data.success) {
        const { accessToken, user } = response.data.data;
        set({
          accessToken,
          user,
          isAuthenticated: true,
          isLoading: false
        });
        get().refreshUser().catch(err => console.warn('Failed to load profile on Google login:', err));
      }
      return response.data;
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Google authentication failed.';
      set({ isLoading: false, error: errMsg });
      throw err;
    }
  },

  loginWithPhone: async (idToken, name) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/api/auth/phone/verify-otp', { idToken, name });
      if (response.data && response.data.success) {
        const { accessToken, user } = response.data.data;
        set({
          accessToken,
          user,
          isAuthenticated: true,
          isLoading: false
        });
        get().refreshUser().catch(err => console.warn('Failed to load profile on Phone login:', err));
      }
      return response.data;
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Phone OTP verification failed.';
      set({ isLoading: false, error: errMsg });
      throw err;
    }
  },

  logoutUser: async () => {
    set({ isLoading: true });
    try {
      await api.post('/api/auth/logout');
    } catch (err) {
      console.warn('Logout API warning:', err.message);
    } finally {
      set({
        user: null,
        accessToken: null,
        isAuthenticated: false,
        isLoading: false,
        error: null
      });
    }
  },

  softDeleteUserAccount: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.delete('/api/users/account');
      set({
        user: null,
        accessToken: null,
        isAuthenticated: false,
        isLoading: false,
        error: null
      });
      return response.data;
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to delete account.';
      set({ isLoading: false, error: errMsg });
      throw err;
    }
  },

  // Perform token refresh check on app startup to restore session
  checkSession: async () => {
    set({ isLoading: true });
    try {
      // Endpoint retrieves a fresh access token using the httpOnly cookie
      const response = await api.post('/api/auth/refresh');
      if (response.data && response.data.success) {
        const { accessToken } = response.data.data;

        // Decode user profile info from access token payload using pure-JS helper
        // (no Node.js module needed — parseJwt uses window.atob)
        const decoded = parseJwt(accessToken);

        set({
          accessToken,
          user: {
            id: decoded.userId,
            role: decoded.role,
            name: decoded.role.toUpperCase() + ' User' // Temporary until profile fetch
          },
          isAuthenticated: true,
          isLoading: false
        });

        // Load full user profile details immediately
        get().refreshUser().catch(err => console.warn('Failed to load profile on session restore:', err));
      }
    } catch (err) {
      // If refresh fails, they are guest/unauthenticated (perfectly normal on clean load)
      set({ isLoading: false });
    }
  },

  refreshUser: async () => {
    try {
      const response = await api.get('/api/users/profile');
      if (response.data && response.data.success) {
        const u = response.data.data;
        set((state) => ({
          user: {
            ...state.user,
            id: u._id || u.id,
            name: u.name,
            email: u.email,
            phone: u.phone,
            permissions: u.permissions,
            isVerified: u.isVerified,
            addresses: u.addresses || []
          }
        }));
        return response.data.data;
      }
    } catch (err) {
      console.error('Failed to refresh user profile:', err);
      throw err;
    }
  }
}));

// Helper to decode JWT payloads in pure JS (no npm module dependency for client bundles)
function parseJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return { userId: '', role: 'customer' };
  }
}
