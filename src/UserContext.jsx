import React, { createContext, useContext, useState, useEffect } from 'react';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [accessToken, setAccessTokenState] = useState(null);
  const [refreshToken, setRefreshTokenState] = useState(null);
  const [username, setUsernameState] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedAccessToken = localStorage.getItem('accessToken');
    const storedRefreshToken = localStorage.getItem('refreshToken');
    const storedUsername = localStorage.getItem('username');

    if (storedAccessToken && storedRefreshToken) {
      setAccessTokenState(storedAccessToken);
      setRefreshTokenState(storedRefreshToken);
      setUsernameState(storedUsername);
    }
    setIsLoading(false);
  }, []);

  const setAccessToken = (token) => {
    setAccessTokenState(token);
    if (token) localStorage.setItem('accessToken', token);
    else localStorage.removeItem('accessToken');
  };

  const setRefreshToken = (token) => {
    setRefreshTokenState(token);
    if (token) localStorage.setItem('refreshToken', token);
    else localStorage.removeItem('refreshToken');
  };

  const setUsername = (name) => {
    setUsernameState(name);
    if (name) localStorage.setItem('username', name);
    else localStorage.removeItem('username');
  };

  const login = (newAccessToken, newRefreshToken, userName) => {
    setAccessToken(newAccessToken);
    setRefreshToken(newRefreshToken);
    setUsername(userName);
  };

  const logout = () => {
    setAccessToken(null);
    setRefreshToken(null);
    setUsername(null);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('username');
  };

  return (
    <UserContext.Provider
      value={{
        accessToken,
        refreshToken,
        username,
        login,
        logout,
        setAccessToken,
        setRefreshToken,
        setUsername,
        isLoading,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
