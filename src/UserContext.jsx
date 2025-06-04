import React, { createContext, useState, useEffect, useContext } from 'react';
import Cookies from 'js-cookie';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [accessToken, setAccessToken] = useState(null);
  const [username, setUsername] = useState(null);

useEffect(() => {
  const tokenFromCookie = Cookies.get('token');
  const usernameFromCookie = Cookies.get('username');
  console.log('Restoring from cookies:', { tokenFromCookie, usernameFromCookie });
  if (tokenFromCookie && usernameFromCookie) {
    setAccessToken(tokenFromCookie);
    setUsername(usernameFromCookie);
  }
}, []);


  const login = (token, username) => {
    Cookies.set('token', token, { expires: 0.02 });
    Cookies.set('username', username, { expires: 0.02 });
    setAccessToken(token);
    setUsername(username);
  };

  const logout = () => {
    Cookies.remove('token');
    Cookies.remove('username');
    setAccessToken(null);
    setUsername(null);
  };

  return (
    <UserContext.Provider value={{ accessToken, username, login, logout, setAccessToken, setUsername }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
