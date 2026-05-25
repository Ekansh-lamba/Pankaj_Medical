import axios from 'axios';

// Create Axios Instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true // Required for sending/receiving the httpOnly refreshToken cookie
});

// Configure Request Interceptor to dynamically attach the JWT Access Token
api.interceptors.request.use(
  async (config) => {
    // Dynamically import to prevent circular dependencies in Zustand load cycles
    const { useAuthStore } = await import('../store/authStore');
    const token = useAuthStore.getState().accessToken;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Configure Response Interceptor to intercept 401s and auto-execute refresh cycles
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const isAuthRequest = originalRequest.url && originalRequest.url.includes('/api/auth/');

    // Check if error is a 401, we haven't already retried, and it is NOT an authentication request
    if (error.response && error.response.status === 401 && !originalRequest._retry && !isAuthRequest) {
      originalRequest._retry = true;

      try {
        const { useAuthStore } = await import('../store/authStore');

        console.log('Access token expired. Attempting token refresh...');

        // Execute refresh token endpoint (browser automatically sends the httpOnly cookie)
        const refreshResponse = await axios.post(
          `${api.defaults.baseURL}/api/auth/refresh`,
          {},
          { withCredentials: true }
        );

        if (refreshResponse.data && refreshResponse.data.success) {
          const { accessToken } = refreshResponse.data.data;

          // Update store with new access token
          useAuthStore.getState().setAccessToken(accessToken);

          // Retry the original request with the new access token
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        console.warn('Token refresh cycle failed or refresh token expired. Logging out user...');
        const { useAuthStore } = await import('../store/authStore');

        // Clear auth store state
        useAuthStore.getState().logoutUser();

        // Optionally redirect to login page (depending on window context)
        if (typeof window !== 'undefined') {
          window.location.href = '/login?expired=true';
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;
