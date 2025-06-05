import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../components/loginform.css';

const OtpEntry = () => {
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  // Assume phoneNumber is passed in location.state
  const phoneNumber = location.state?.phoneNumber || '';

  const verifyOtp = async (e) => {
    e.preventDefault();

    if (!otp) {
      setError('Please enter the OTP');
      return;
    }

    try {
      const response = await fetch('http://localhost:3001/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber, code: otp }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.message || 'OTP verification failed');

      alert('Phone number verified successfully!');
      navigate('/login');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="wrapper">
      <div className="form-header">
        <h1>Enter OTP</h1>
        <span
          className="close-btn"
          onClick={() => navigate('/login')}
          role="button"
          tabIndex={0}
          aria-label="Close OTP Entry"
          style={{ cursor: 'pointer' }}
        >
          ×
        </span>
      </div>
      <form onSubmit={verifyOtp}>
        <div className="input-box">
          <label htmlFor="otp">OTP</label>
          <input
            id="otp"
            type="text"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            required
          />
        </div>
        {error && <p className="error-message">{error}</p>}
        <button type="submit" className="login-btn">
          Verify OTP
        </button>
      </form>
    </div>
  );
};

export default OtpEntry;
