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

        // Retrieve temporary profile info decode from token or let next step load it
        // Decoded token contains user id and role
        const jwt = await import('jsonwebtoken'); // Webpack/Vite client doesn't have jsonwebtoken easily, let's decode using standard helper
        const decoded = parseJwt(accessToken);

        // We'll set simple user info based on decoded context, or call verify on backend
        // In Phase 1, we can create a mock verification endpoint or fetch profile details, let's keep it simple
        set({
          accessToken,
          user: {
            id: decoded.userId,
            role: decoded.role,
            name: decoded.role.toUpperCase() + ' User' // Temporary name till profile fetch
          },
          isAuthenticated: true,
          isLoading: false
        });
      }
    } catch (err) {
      // If refresh fails, they are guest/unauthenticated (perfectly normal on clean load)
      set({ isLoading: false });
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
