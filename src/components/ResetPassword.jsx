import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../CSS/loginform.css';
import axiosInstance from '../axiosInstance';
import AuthPage from './AuthPage';

const ResetPassword = () => {
  const [newPassword, setNewPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const navigate = useNavigate();
  const location = useLocation();
  const phoneNumber = location.state?.phoneNumber;

  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (!newPassword || !repeatPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (newPassword !== repeatPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      const res = await axiosInstance.post('/otp/reset_password', {
        phoneNumber,
        newPassword,
      });

      // Optional: check response status
      if (res.status !== 200) throw new Error(res.data?.msg || 'Reset failed');

      setSuccess('Password changed successfully!');
      setError('');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      console.error('Reset password error:', err);
      setError(err.response?.data?.msg || err.message);
    }
  };

  return (
    <AuthPage>
    <div className="wrapper">
      <div className="form-header">
        <h1>Reset Password</h1>
        <span
          className="close-btn"
          onClick={() => navigate('/login')}
          role="button"
          tabIndex={0}
          aria-label="Close Reset Password"
          style={{ cursor: 'pointer' }}
        >
          ×
        </span>
      </div>
      <form onSubmit={handleResetPassword}>
        <div className="input-box">
          <label htmlFor="newPassword">New Password</label>
          <input
            id="newPassword"
            type="password"
            required
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </div>
        <div className="input-box">
          <label htmlFor="repeatPassword">Repeat Password</label>
          <input
            id="repeatPassword"
            type="password"
            required
            value={repeatPassword}
            onChange={(e) => setRepeatPassword(e.target.value)}
          />
        </div>
        {error && <p className="error-message">{error}</p>}
        {success && <p className="success-message">{success}</p>}

        <button type="submit" className="login-btn">
          Change Password
        </button>
      </form>
      </div>
      </AuthPage>
  );
};

export default ResetPassword;
