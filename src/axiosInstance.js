import axios from 'axios';
import { useUser } from './UserContext';

const axiosInstance = axios.create({
  baseURL: 'http://localhost:3001', 
  withCredentials: true, 
});

export const setupInterceptors = (user) => {
  axiosInstance.interceptors.request.use(
    (config) => {
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

      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        const newToken = await user.refreshAccessToken();
        if (newToken) {
          originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
          return axiosInstance(originalRequest);
        } else {
          user.logout();
        }
      }

      return Promise.reject(error);
    }
  );
};

export default axiosInstance;
