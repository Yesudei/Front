import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [accessToken, setAccessTokenState] = useState(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`; // ✅ persist after refresh
    }
    return token || null;
  });

  const [refreshToken, setRefreshTokenState] = useState(() => localStorage.getItem('refreshToken') || null);
  const [username, setUsernameState] = useState(() => sessionStorage.getItem('username') || null);
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const setAccessToken = useCallback((token) => {
    setAccessTokenState(token);
    if (token) {
      localStorage.setItem('accessToken', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`; // ✅ set for future requests
    } else {
      localStorage.removeItem('accessToken');
      delete axios.defaults.headers.common['Authorization']; // ✅ clean up
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

      setAccessToken(newAccessToken); // will also update axios.defaults
      return newAccessToken;
    } catch (error) {
      console.error('Token refresh failed:', error);
      logout();
      return null;
    }
  }, [refreshToken, logout, setAccessToken]);

  useEffect(() => {
    const initializeSession = async () => {
      console.log('🔄 Initializing session...');
      if (!refreshToken) {
        console.log('⚠️ No refresh token, skipping session init');
        setIsLoading(false);
        return;
      }

      try {
        const newAccessToken = await refreshAccessToken();
        if (!newAccessToken) throw new Error('Refresh failed');

        const userResponse = await axios.get('http://localhost:3001/users/getuser', {
          withCredentials: true,
        });

        console.log('✅ User data fetched:', userResponse.data);
        setUserData(userResponse.data.user);
        setUsername(userResponse.data.user.name);
      } catch (error) {
        console.error('❌ Session initialization failed:', error);
        logout();
      } finally {
        setIsLoading(false);
        console.log('✅ Session initialization complete');
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
