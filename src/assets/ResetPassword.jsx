import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../CSS/loginform.css';

const API_BASE_URL = 'http://localhost:3001';
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
      const res = await fetch(`${API_BASE_URL}/otp/reset_password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber, newPassword }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.msg || 'Reset failed');

      setSuccess('Password changed successfully!');
      setError('');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
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
  );
};

export default ResetPassword;
