import React, { createContext, useContext, useState } from 'react';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [accessToken, setAccessToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);
  const [username, setUsername] = useState(null);

  const login = (newAccessToken, newRefreshToken, userName) => {
    setAccessToken(newAccessToken);
    setRefreshToken(newRefreshToken);
    setUsername(userName);
  };

  const logout = () => {
    setAccessToken(null);
    setRefreshToken(null);
    setUsername(null);
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
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
