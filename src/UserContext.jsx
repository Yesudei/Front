// src/UserContext.jsx
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import axiosInstance, { setAccessTokenForInterceptor, setupInterceptors } from './axiosInstance';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  // User info state
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

  // Access token state
  const [accessToken, setAccessTokenState] = useState(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setAccessTokenForInterceptor(token);
    }
    return token || null;
  });

  // Refresh token state (optional, for localStorage sync)
  const [refreshToken, setRefreshTokenState] = useState(() => localStorage.getItem('refreshToken') || null);

  // Loading and refreshing flags
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Optional username synced from user
  const [username, setUsernameState] = useState(user?.username || null);

  // Helper to set user and sync localStorage
  const setUser = useCallback((userInfo) => {
    if (userInfo) {
      const normalizedUser = {
        ...userInfo,
        username: userInfo.username || userInfo.name || null,
        isAdmin: userInfo.isAdmin || false,
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

  // Set access token and sync localStorage and axios interceptor
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

  // Set refresh token in localStorage
  const setRefreshToken = useCallback((token) => {
    setRefreshTokenState(token);
    if (token) {
      localStorage.setItem('refreshToken', token);
    } else {
      localStorage.removeItem('refreshToken');
    }
  }, []);

  // Login function to set tokens and user info
  const login = useCallback((newAccessToken, newRefreshToken, userInfo) => {
    setAccessToken(newAccessToken);
    setRefreshToken(newRefreshToken);
    setUser(userInfo);
  }, [setAccessToken, setRefreshToken, setUser]);

  // Logout function clears all
  const logout = useCallback(() => {
    setAccessToken(null);
    setRefreshToken(null);
    setUser(null);
    setIsLoading(false);
    setIsRefreshing(false);
    localStorage.clear();
  }, [setAccessToken, setRefreshToken, setUser]);

  // Refresh token function - send refresh token via header, no cookies
  const refreshAccessToken = useCallback(async () => {
    if (isRefreshing) {
      return null;
    }
    try {
      setIsRefreshing(true);

      const storedRefreshToken = localStorage.getItem('refreshToken');
      if (!storedRefreshToken) {
        logout();
        setIsRefreshing(false);
        setIsLoading(false);
        return null;
      }

      const response = await axiosInstance.post(
        '/users/refresh',
        null,
        {
          headers: {
            'x-refresh-token': storedRefreshToken,
          },
        }
      );

      const newToken = response.data.accessToken;
      if (newToken) {
        setAccessToken(newToken);
        setIsRefreshing(false);
        setIsLoading(false);
        return newToken;
      } else {
        logout();
        setIsRefreshing(false);
        setIsLoading(false);
        return null;
      }
    } catch (error) {
      console.error('[REFRESH ERROR]', error);
      logout();
      setIsRefreshing(false);
      setIsLoading(false);
      return null;
    }
  }, [isRefreshing, logout, setAccessToken]);

  // Initial auth effect runs once: refresh token if no access token
  useEffect(() => {
    const initAuth = async () => {
      if (!accessToken) {
        await refreshAccessToken();
      } else {
        setIsLoading(false);
      }
    };
    initAuth();
  }, [accessToken, refreshAccessToken]);

  // Setup axios interceptors with refresh and logout handlers
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
