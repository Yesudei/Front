import React, { useEffect, useState } from 'react';
import axios from 'axios';

const Home = ({ tokens, setTokens }) => {
  const [userData, setUserData] = useState(null);

  const refreshAccessToken = async () => {
    // call /users/refresh with refreshToken from tokens.refreshToken
    // setTokens with new access token
  };

  const fetchUserData = async () => {
    try {
      // use tokens.accessToken to call /users/getuser
    } catch (err) {
      // if 401, refresh token and retry
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  return <div>{userData ? JSON.stringify(userData) : 'Loading...'}</div>;
};

export default Home;
