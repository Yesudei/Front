import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../usercontext';
import './loginform.css';

const LoginForm = () => {
  const navigate = useNavigate();
  const { login, accessToken, username, loading } = useUser();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!loading && accessToken && username) {
      navigate('/');
    }
  }, [loading, accessToken, username, navigate]);

  useEffect(() => {
    document.body.classList.add('login-background');
    return () => document.body.classList.remove('login-background');
  }, []);

  // Refresh access token function
  const refreshAccessToken = async () => {
    try {
      const response = await fetch('http://localhost:3001/users/refresh', {
        method: 'POST',
        credentials: 'include', // include cookie with refresh token
      });

      if (!response.ok) {
        throw new Error('Failed to refresh token');
      }

      const data = await response.json();
      return data.accessToken;
    } catch (err) {
      console.error('Refresh token error:', err);
      return null;
    }
  };

  // Fetch user data helper with token, auto-refresh if 401
  const fetchUserData = async (token) => {
    try {
      const userRes = await fetch('http://localhost:3001/users/getuser', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
      });

      if (userRes.status === 401) {
        // Token expired - try to refresh
        const newToken = await refreshAccessToken();
        if (!newToken) throw new Error('Session expired, please login again');

        // Retry with new token
        return fetchUserData(newToken);
      }

      if (!userRes.ok) {
        const data = await userRes.json();
        throw new Error(data.message || 'Failed to get user data');
      }

      return await userRes.json();
    } catch (err) {
      throw err;
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    try {
      // 1. Login to get access token and refresh token (cookie)
      const response = await fetch('http://localhost:3001/users/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // important to receive HttpOnly cookie from backend
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Login failed');

      const token = data.accessToken;
      if (!token) throw new Error('No access token received');

      // 2. Fetch user info with access token
      const userData = await fetchUserData(token);

      // 3. Update global state/context
      login(token, userData.user.name);

      alert('Login Successful!');
      navigate('/');
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="wrapper">
      <div className="form-header">
        <h1>Login</h1>
        <span
          className="close-btn"
          onClick={() => window.close()}
          role="button"
          tabIndex={0}
          aria-label="Close Login Form"
        >
          ×
        </span>
      </div>
      <form onSubmit={handleLogin}>
        <div className="input-box">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
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
            autoComplete="current-password"
          />
        </div>
        {error && <p className="error-message">{error}</p>}
        <div className="remember-forget">
          <p>
            <a onClick={() => navigate('/reset-phone')} style={{ cursor: 'pointer' }}>
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
            <a onClick={() => navigate('/register')} role="button" style={{ cursor: 'pointer' }}>
              Register
            </a>
          </p>
        </div>
      </form>
    </div>
  );
};

export default LoginForm;
