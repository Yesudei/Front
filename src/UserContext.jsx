import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import axiosInstance, { setAccessTokenForInterceptor, setupInterceptors } from './axiosInstance';

// Normalize user and include phoneNumber with debug log
const normalizeUser = (userInfo) => {
  if (!userInfo) return null;
  const normalized = {
    ...userInfo,
    username: userInfo.username || userInfo.name || null,
    phoneNumber: userInfo.phoneNumber || null, // Add phoneNumber here
    isAdmin: userInfo.isAdmin === true || userInfo.isAdmin === 'true',
  };
  return normalized;
};

const UserContext = createContext();
let isInterceptorSetup = false;

export const UserProvider = ({ children }) => {
  const [user, setUserState] = useState(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        const normalizedUser = normalizeUser(parsedUser);
        return normalizedUser;
      } catch (e) {
        localStorage.removeItem('user');
        return null;
      }
    }
    return null;
  });

  const [accessToken, setAccessTokenState] = useState(() => {
    const token = localStorage.getItem('accessToken');
    return token || null;
  });

  const [refreshToken, setRefreshTokenState] = useState(() => localStorage.getItem('refreshToken') || null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [username, setUsernameState] = useState(user?.username || null);
// /////////////////////////////////////////////////////////////////////////
  const setUser = useCallback((userInfo) => {
    const normalizedUser = normalizeUser(userInfo);
    if (normalizedUser) {
      setUserState(normalizedUser);
      setUsernameState(normalizedUser.username);
      localStorage.setItem('user', JSON.stringify(normalizedUser));
    } else {
      setUserState(null);
      setUsernameState(null);
      localStorage.removeItem('user');
    }
  }, []);

  const setAccessToken = useCallback((token) => {
    setAccessTokenState(token);
    if (token) {
      localStorage.setItem('accessToken', token);
      axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setAccessTokenForInterceptor(token);
      console.log('Access token set:', token);
    } else {
      localStorage.removeItem('accessToken');
      delete axiosInstance.defaults.headers.common['Authorization'];
      setAccessTokenForInterceptor(null);
      console.log('Access token removed');
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
    setIsRefreshing(false);
  }, [setAccessToken, setRefreshToken, setUser]);

  const refreshAccessToken = useCallback(async () => {
    if (isRefreshing) return null;

    try {
      setIsRefreshing(true);
      const storedRefreshToken = localStorage.getItem('refreshToken');
      if (!storedRefreshToken) {
        logout();
        return null;
      }

      const response = await axiosInstance.post('/users/refresh', null, {
        headers: { 'x-refresh-token': storedRefreshToken },
      });

      const newToken = response.data.accessToken;

      if (newToken) {
        setAccessToken(newToken);

        // Fetch updated user data from /users/getuser
        const userResponse = await axiosInstance.get('/users/getuser');

        // IMPORTANT: pass userResponse.data.user, NOT userResponse.data
        setUser(userResponse.data.user);

        return newToken;
      } else {
        logout();
        return null;
      }
    } catch (error) {
      logout();
      return null;
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing, logout, setAccessToken, setUser]);

  useEffect(() => {
    const initAuth = async () => {
      if (!accessToken) {
        await refreshAccessToken();
      }
      setIsLoading(false);
    };

    if (isLoading) {
      initAuth();
    }
  }, [accessToken, refreshAccessToken, isLoading]);

  useEffect(() => {
    if (!isInterceptorSetup) {
      setupInterceptors({ refreshAccessToken, logout });
      isInterceptorSetup = true;
    }
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
