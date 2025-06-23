// axiosInstance.js
import axios from 'axios';
import { useUser } from './UserContext';

// Create base instance
const axiosInstance = axios.create({
  baseURL: 'http://localhost:3001', // change if needed
  withCredentials: true, // in case you use cookies too
});

// Interceptor setup function
export const setupInterceptors = (user) => {
  axiosInstance.interceptors.request.use(
    (config) => {
      // Add accessToken if it exists
      if (user.accessToken) {
        config.headers['Authorization'] = `Bearer ${user.accessToken}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;

      // If token expired and we haven't retried yet
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        // Try to refresh the token
        const newToken = await user.refreshAccessToken();
        if (newToken) {
          // Update header and retry
          originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
          return axiosInstance(originalRequest);
        } else {
          // Refresh failed: optional - logout
          user.logout();
        }
      }

      return Promise.reject(error);
    }
  );
};

export default axiosInstance;
