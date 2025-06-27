import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: 'http://localhost:3001',
  withCredentials: true,
});

let accessToken = null;

export const setAccessTokenForInterceptor = (token) => {
  accessToken = token;
};

export const setupInterceptors = (user) => {
  axiosInstance.interceptors.request.handlers = [];
  axiosInstance.interceptors.response.handlers = [];

  axiosInstance.interceptors.request.use(
    (config) => {
      if (accessToken) {
        config.headers['Authorization'] = `Bearer ${accessToken}`;
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

        if (user?.refreshAccessToken) {
          const newToken = await user.refreshAccessToken();
          if (newToken) {
            setAccessTokenForInterceptor(newToken);
            originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
            return axiosInstance(originalRequest);
          } else {
            user.logout();
          }
        }
      }
      return Promise.reject(error);
    }
  );
};

export default axiosInstance;
