import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../axiosInstance';
import '../CSS/loginform.css';

const RegisterForm = () => {
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    document.body.classList.add('login-background');
    return () => document.body.classList.remove('login-background');
  }, []);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    if (!name || !phoneNumber || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      const response = await axiosInstance.post('/users/register', {
        name,
        phoneNumber,
        password,
      });

      if (response.status === 201 || response.status === 200) {
        // Assuming you verify phone number next
        navigate('/verify-number', { state: { phoneNumber } });
      } else {
        setError(response.data.message || 'Registration failed');
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.response?.data?.message || err.message || 'Registration failed');
    }
  };

  return (
    <div className="wrapper">
      <div className="form-header">
        <h1>Register</h1>
        <span
          className="close-btn"
          onClick={() => navigate('/login')}
          role="button"
          tabIndex={0}
          aria-label="Close Register Form"
          style={{ cursor: 'pointer' }}
        >
          ×
        </span>
      </div>

      <form onSubmit={handleRegister}>
        <div className="input-box">
          <label htmlFor="name">Name</label>
          <input
            id="name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="input-box">
          <label htmlFor="phoneNumber">Phone Number</label>
          <input
            id="phoneNumber"
            type="tel"
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

        <div className="input-box">
          <label htmlFor="confirmPassword">Confirm Password</label>
          <input
            id="confirmPassword"
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>

        {error && <p className="error-message">{error}</p>}

        <button type="submit" className="login-btn">
          Register
        </button>

        <div className="register-link">
          <p>
            Already have an account?{' '}
            <a
              onClick={() => navigate('/login')}
              role="button"
              tabIndex={0}
              style={{ cursor: 'pointer' }}
            >
              Login
            </a>
          </p>
        </div>
      </form>
    </div>
  );
};

export default RegisterForm;
