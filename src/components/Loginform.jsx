import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../UserContext';
import axiosInstance from '../axiosInstance';
import '../CSS/loginform.css';

const LoginForm = () => {
  const navigate = useNavigate();
  const { login, accessToken, username } = useUser();

  const [email, setEmail] = useState('');
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

  if (!email || !password) {
    setError('Please enter both email and password');
    return;
  }

  try {
    // 1️⃣ Login call
    const response = await axiosInstance.post('/users/login', { email, password });

    const accessToken = response.data.accessToken;
    const refreshToken = response.headers['x-refresh-token'];

    if (!accessToken || !refreshToken) {
      throw new Error('Tokens not returned from server');
    }

    // 2️⃣ Get user info
    const userRes = await axiosInstance.get('/users/getuser', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    const username = userRes.data.user?.name || 'User';

    // 3️⃣ Save tokens + username in context
    login(accessToken, refreshToken, username);

    // 4️⃣ Redirect to home
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
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
