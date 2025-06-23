import React, { createContext, useContext, useState, useCallback } from 'react';
import axiosInstance from './axiosInstance';  // <-- import your custom instance

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [accessToken, setAccessTokenState] = useState(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
    return token || null;
  });

  const [refreshToken, setRefreshTokenState] = useState(() => localStorage.getItem('refreshToken') || null);
  const [username, setUsernameState] = useState(() => sessionStorage.getItem('username') || null);
  const [userData, setUserData] = useState(null);

  const setAccessToken = useCallback((token) => {
    setAccessTokenState(token);
    if (token) {
      localStorage.setItem('accessToken', token);
      axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;  // <-- use axiosInstance
    } else {
      localStorage.removeItem('accessToken');
      delete axiosInstance.defaults.headers.common['Authorization'];  // <-- use axiosInstance
    }
  }, []);

  const setRefreshToken = useCallback((token) => {
    setRefreshTokenState(token);
    if (token) localStorage.setItem('refreshToken', token);
    else localStorage.removeItem('refreshToken');
  }, []);

  const setUsername = useCallback((name) => {
    setUsernameState(name);
    if (name) sessionStorage.setItem('username', name);
    else sessionStorage.removeItem('username');
  }, []);

  const login = useCallback((newAccessToken, newRefreshToken, name) => {
    setAccessToken(newAccessToken);
    setRefreshToken(newRefreshToken);
    setUsername(name);
  }, [setAccessToken, setRefreshToken, setUsername]);

  const logout = useCallback(() => {
    setAccessToken(null);
    setRefreshToken(null);
    setUsername(null);
    setUserData(null);
    sessionStorage.clear();
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }, [setAccessToken, setRefreshToken, setUsername]);

  const refreshAccessToken = useCallback(async () => {
    if (!refreshToken) {
      logout();
      return null;
    }

    try {
      const response = await axiosInstance.post(  // <-- use axiosInstance here as well
        '/users/refresh',
        {},
        {
          headers: { 'x-refresh-token': refreshToken },
          withCredentials: true,
        }
      );

      const newAccessToken = response.data.accessToken;
      if (!newAccessToken) throw new Error('No access token in response');

      setAccessToken(newAccessToken);
      return newAccessToken;
    } catch (error) {
      console.error('Token refresh failed:', error);
      logout();
      return null;
    }
  }, [refreshToken, logout, setAccessToken]);

  return (
    <UserContext.Provider
      value={{
        accessToken,
        refreshToken,
        username,
        userData,
        login,
        logout,
        refreshAccessToken,
        setAccessToken,
        setUsername,
        setUserData,
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
