import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: 'http://localhost:3001',
  withCredentials: true,  // You can remove this if you don't use cookies (your case)
});

let accessToken = null;

// Function to update token in the closure
export const setAccessTokenForInterceptor = (token) => {
  accessToken = token;
};

// Setup interceptors, takes user context with refreshAccessToken & logout methods
export const setupInterceptors = (user) => {
  // Clear previous interceptors to avoid duplicates
  axiosInstance.interceptors.request.handlers = [];
  axiosInstance.interceptors.response.handlers = [];

  // Add request interceptor to attach token
  axiosInstance.interceptors.request.use(
    (config) => {
      if (accessToken) {
        config.headers['Authorization'] = `Bearer ${accessToken}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Add response interceptor to handle 401 and refresh token
  axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;

      if (
        error.response?.status === 401 &&
        !originalRequest._retry &&
        user?.refreshAccessToken
      ) {
        originalRequest._retry = true;

        try {
          const newToken = await user.refreshAccessToken();
          if (newToken) {
            setAccessTokenForInterceptor(newToken);
            originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
            return axiosInstance(originalRequest);
          }
        } catch {
          // Refresh token failed, logout user
          user.logout();
        }
      }

      return Promise.reject(error);
    }
  );
};

export default axiosInstance;
