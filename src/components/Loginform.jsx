import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../UserContext';
import axiosInstance from '../axiosInstance';
import '../CSS/loginform.css';

const LoginForm = () => {
  const navigate = useNavigate();
  const { login, accessToken, username } = useUser();

  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (accessToken && username) {
      navigate('/');
    }
  }, [accessToken, username, navigate]);

  useEffect(() => {
    document.body.classList.add('login-background');
    return () => document.body.classList.remove('login-background');
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    if (!phoneNumber || !password) {
      setError('Please enter both phone number and password');
      return;
    }

    try {
      const response = await axiosInstance.post('/users/login', {
        phoneNumber,
        password,
      });

      const accessToken = response.data.accessToken;
      const refreshToken = response.headers['x-refresh-token'];

      if (!accessToken || !refreshToken) {
        throw new Error('Tokens not returned from server');
      }

      // Fetch full user info here
      const userRes = await axiosInstance.get('/users/getuser', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      console.log('User API response:', userRes.data);

      const userFromApi = userRes.data.user;

      if (!userFromApi || !userFromApi.id) {
        throw new Error('User data incomplete');
      }

      // Normalize user object to have _id property
      const normalizedUser = {
        ...userFromApi,
        _id: userFromApi.id,
      };

      login(accessToken, refreshToken, normalizedUser);

      navigate('/');
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.message || err.message || 'Login failed');
    }
  };

  return (
    <div className="login-page">
      <div className="wrapper">
        <div className="form-header">
          <h1>Login</h1>
          <span
            className="close-btn"
            onClick={() => window.close()}
            role="button"
            tabIndex={0}
          >
            ×
          </span>
        </div>
        <form onSubmit={handleLogin}>
          <div className="input-box">
            <label htmlFor="phoneNumber">Phone Number</label>
            <input
              id="phoneNumber"
              type="text"
              required
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />
          </div>
          <div className="input-box">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && <p className="error-message">{error}</p>}
          <div className="remember-forget">
            <p>
              <a
                onClick={() => navigate('/reset-phone')}
                style={{ cursor: 'pointer' }}
              >
                Forgot password?
              </a>
            </p>
          </div>
          <button type="submit" className="login-btn">
            Login
          </button>
          <div className="register-link">
            <p>
              Don't have an account?{' '}
              <a
                onClick={() => navigate('/register')}
                role="button"
                style={{ cursor: 'pointer' }}
              >
                Register
              </a>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginForm;
