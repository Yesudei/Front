import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  // Use localStorage for accessToken & refreshToken for persistence across tabs
  const [accessToken, setAccessTokenState] = useState(() => {
    const token = localStorage.getItem('accessToken');
    console.log('Initial accessToken from localStorage:', token);
    return token || null;
  });
  const [refreshToken, setRefreshTokenState] = useState(() => {
    const token = localStorage.getItem('refreshToken');
    console.log('Initial refreshToken from localStorage:', token);
    return token || null;
  });
  const [username, setUsernameState] = useState(() => {
    const name = sessionStorage.getItem('username');
    return name || null;
  });
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Save access token to localStorage consistently
  const setAccessToken = useCallback((token) => {
    setAccessTokenState(token);
    if (token) localStorage.setItem('accessToken', token);
    else localStorage.removeItem('accessToken');
  }, []);

  // Save refresh token to localStorage consistently
  const setRefreshToken = useCallback((token) => {
    setRefreshTokenState(token);
    if (token) localStorage.setItem('refreshToken', token);
    else localStorage.removeItem('refreshToken');
  }, []);

  // Keep username in sessionStorage (cleared on tab close)
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
      const response = await axios.post(
        'http://localhost:3001/users/refresh',
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

  useEffect(() => {
    const initializeSession = async () => {
      console.log('Initializing session...');
      if (!refreshToken) {
        console.log('No refresh token, skipping session initialization');
        setIsLoading(false);
        return;
      }
      try {
        const newAccessToken = await refreshAccessToken();
        if (!newAccessToken) throw new Error('Refresh failed');

        const userResponse = await axios.get('http://localhost:3001/users/getuser', {
          headers: { Authorization: `Bearer ${newAccessToken}` },
          withCredentials: true,
        });

        console.log('User data fetched:', userResponse.data);
        setUserData(userResponse.data.user);
        setUsername(userResponse.data.user.name);
      } catch (error) {
        console.error('Session initialization failed:', error);
        logout();
      } finally {
        setIsLoading(false);
        console.log('Session initialization finished, isLoading=false');
      }
    };

    initializeSession();
  }, [refreshToken, refreshAccessToken, logout, setUsername]);

  return (
    <UserContext.Provider
      value={{
        accessToken,
        refreshToken,
        username,
        userData,
        isLoading,
        login,
        logout,
        refreshAccessToken,
        setAccessToken,
        setUsername,
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
