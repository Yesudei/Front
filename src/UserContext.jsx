import React, { createContext, useState, useEffect, useContext } from 'react';
import Cookies from 'js-cookie';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [accessToken, setAccessToken] = useState(null);
  const [username, setUsername] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const tokenFromCookie = Cookies.get('token');
    const usernameFromCookie = Cookies.get('username');
    if (tokenFromCookie && usernameFromCookie) {
      setAccessToken(tokenFromCookie);
      setUsername(usernameFromCookie);
    }
    setLoading(false);
  }, []);

  const login = (token, username) => {
    Cookies.set('token', token, { expires: 1 });
    Cookies.set('username', username, { expires: 1 });
    setAccessToken(token);
    setUsername(username);
  };

  const logout = () => {
    Cookies.remove('token');
    Cookies.remove('username');
    setAccessToken(null);
    setUsername(null);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <UserContext.Provider value={{ accessToken, username, login, logout, setAccessToken, setUsername }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
