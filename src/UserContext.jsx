// src/UserContext.jsx
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import axiosInstance, { setAccessTokenForInterceptor } from './axiosInstance';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [username, setUsernameState] = useState(() => {
    const savedName = localStorage.getItem('username');
    console.log('UserProvider init username from localStorage:', savedName);
    return savedName || null;
  });

  const [accessToken, setAccessTokenState] = useState(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setAccessTokenForInterceptor(token);
    }
    return token || null;
  });

  const [refreshToken, setRefreshTokenState] = useState(() => localStorage.getItem('refreshToken') || null);
  const [isLoading, setIsLoading] = useState(false);

  const setUsername = useCallback((name) => {
    console.log('💾 Setting username to:', name);
    setUsernameState(name);
    if (name) {
      localStorage.setItem('username', name);
    } else {
      localStorage.removeItem('username');
    }
  }, []);

  const setAccessToken = useCallback((token) => {
    console.log('🔄 setAccessToken called with:', token);
    setAccessTokenState(token);
    if (token) {
      localStorage.setItem('accessToken', token);
      axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setAccessTokenForInterceptor(token);
    } else {
      localStorage.removeItem('accessToken');
      delete axiosInstance.defaults.headers.common['Authorization'];
      setAccessTokenForInterceptor(null);
    }
  }, []);

  const setRefreshToken = useCallback((token) => {
    console.log('🔄 setRefreshToken called with:', token);
    setRefreshTokenState(token);
    if (token) {
      localStorage.setItem('refreshToken', token);
    } else {
      localStorage.removeItem('refreshToken');
    }
  }, []);

  const login = useCallback((newAccessToken, newRefreshToken, name) => {
    console.log('🔐 login() called:', newAccessToken, name);
    setAccessToken(newAccessToken);
    setRefreshToken(newRefreshToken);
    setUsername(name);
  }, [setAccessToken, setRefreshToken, setUsername]);

  const logout = useCallback(() => {
    console.log('🔓 logout() called');
    setAccessToken(null);
    setRefreshToken(null);
    setUsername(null);
    setIsLoading(false);
    localStorage.clear();
  }, [setAccessToken, setRefreshToken, setUsername]);

  // Refresh token logic
  const refreshAccessToken = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await axiosInstance.post('/users/refresh', null, {
        headers: {
          'x-refresh-token': refreshToken,
        },
      });

      const newToken = response.data.accessToken;
      if (newToken) {
        setAccessToken(newToken);
        setIsLoading(false);
        return newToken;
      } else {
        logout();
        setIsLoading(false);
        return null;
      }
    } catch (error) {
      console.error('Refresh token failed:', error);
      logout();
      setIsLoading(false);
      return null;
    }
  }, [refreshToken, setAccessToken, logout]);

  return (
    <UserContext.Provider
      value={{
        username,
        accessToken,
        refreshToken,
        login,
        logout,
        setAccessToken,
        setUsername,
        isLoading,
        refreshAccessToken,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) throw new Error('useUser must be used within a UserProvider');
  return context;
};
