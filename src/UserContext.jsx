import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [accessToken, setAccessTokenState] = useState(() => {
    return sessionStorage.getItem('accessToken') || null;
  });
  const [refreshToken, setRefreshTokenState] = useState(() => {
    return localStorage.getItem('refreshToken') || null;
  });
  const [username, setUsernameState] = useState(() => {
    return sessionStorage.getItem('username') || null;
  });
  const [isLoading, setIsLoading] = useState(true);

  const setAccessToken = useCallback((token) => {
    setAccessTokenState(token);
    if (token) {
      sessionStorage.setItem('accessToken', token);
    } else {
      sessionStorage.removeItem('accessToken');
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

  const setUsername = useCallback((name) => {
    setUsernameState(name);
    if (name) {
      sessionStorage.setItem('username', name);
    } else {
      sessionStorage.removeItem('username');
    }
  }, []);

  const login = useCallback((newAccessToken, newRefreshToken, name) => {
    setAccessToken(newAccessToken);
    setRefreshToken(newRefreshToken);
    setUsername(name);
  }, [setAccessToken, setRefreshToken, setUsername]);

  const logout = useCallback(() => {
    // Client-side only cleanup
    setAccessToken(null);
    setRefreshToken(null);
    setUsername(null);
    sessionStorage.clear();
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
      if (!newAccessToken) {
        throw new Error('No access token in response');
      }

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
      // If we have an access token, verify it's still valid
      if (accessToken) {
        try {
          await axios.get('http://localhost:3001/users/validate', {
            headers: { Authorization: `Bearer ${accessToken}` },
            withCredentials: true,
          });
          setIsLoading(false);
          return;
        } catch (error) {
          console.log('Access token invalid, attempting refresh...');
        }
      }

      // If no refresh token, we're logged out
      if (!refreshToken) {
        setIsLoading(false);
        return;
      }

      // Attempt to refresh the access token
      try {
        const newAccessToken = await refreshAccessToken();
        if (!newAccessToken) {
          throw new Error('Refresh failed');
        }

        // Fetch user data if we don't have username
        if (!username) {
          const userResponse = await axios.get('http://localhost:3001/users/getuser', {
            headers: { Authorization: `Bearer ${newAccessToken}` },
            withCredentials: true,
          });
          setUsername(userResponse.data.user.name);
        }
      } catch (error) {
        console.error('Session initialization failed:', error);
        logout();
      } finally {
        setIsLoading(false);
      }
    };

    initializeSession();
  }, [accessToken, refreshToken, username, refreshAccessToken, logout, setUsername]);

  return (
    <UserContext.Provider
      value={{
        accessToken,
        refreshToken,
        username,
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
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};