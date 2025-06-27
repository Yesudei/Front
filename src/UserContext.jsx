// src/UserContext.jsx
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import axiosInstance, { setAccessTokenForInterceptor } from './axiosInstance';
import { setupInterceptors } from './axiosInstance';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  // Store full user info including _id, username, etc.
  const [user, setUserState] = useState(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        return JSON.parse(savedUser);
      } catch {
        localStorage.removeItem('user');
        return null;
      }
    }
    return null;
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

  // Keep username synced for convenience if you want, optional
  const [username, setUsernameState] = useState(user?.username || null);

  // Set user and sync to localStorage
  const setUser = useCallback((userInfo) => {
    if (userInfo) {
      // Normalize userInfo to ensure username exists
      const normalizedUser = {
        ...userInfo,
        username: userInfo.username || userInfo.name || null,
      };
      setUserState(normalizedUser);
      setUsernameState(normalizedUser.username);
      localStorage.setItem('user', JSON.stringify(normalizedUser));
      localStorage.setItem('username', normalizedUser.username);
    } else {
      setUserState(null);
      setUsernameState(null);
      localStorage.removeItem('user');
      localStorage.removeItem('username');
    }
  }, []);

  const setAccessToken = useCallback((token) => {
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
    setRefreshTokenState(token);
    if (token) {
      localStorage.setItem('refreshToken', token);
    } else {
      localStorage.removeItem('refreshToken');
    }
  }, []);

  // login accepts userInfo object with at least {_id, username}
  const login = useCallback((newAccessToken, newRefreshToken, userInfo) => {
    setAccessToken(newAccessToken);
    setRefreshToken(newRefreshToken);
    setUser(userInfo);
  }, [setAccessToken, setRefreshToken, setUser]);

  const logout = useCallback(() => {
    setAccessToken(null);
    setRefreshToken(null);
    setUser(null);
    setIsLoading(false);
    localStorage.clear();
  }, [setAccessToken, setRefreshToken, setUser]);

  const refreshAccessToken = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await axiosInstance.post('/users/refresh', null); // cookie sent automatically

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
  }, [setAccessToken, logout]);

  useEffect(() => {
    setupInterceptors({ refreshAccessToken, logout });
  }, [refreshAccessToken, logout]);

  return (
    <UserContext.Provider
      value={{
        user,
        username,
        accessToken,
        refreshToken,
        login,
        logout,
        setAccessToken,
        setUser,
        setUsername: setUsernameState,
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
