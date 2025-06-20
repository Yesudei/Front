import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../CSS/loginform.css';

const ResetPhoneEntry = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

const handleSubmit = async (e) => {
  e.preventDefault();
  if (!phoneNumber) {
    setError('Please enter your phone number');
    return;
  }

  try {
    const cleanPhone = phoneNumber.replace(/\D/g, '');

    const res = await fetch('http://localhost:3001/otp/forgot_pass', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneNumber: Number(cleanPhone) }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to send OTP');

    navigate('/verify-number', { state: { phoneNumber: cleanPhone, mode: 'reset', otpSent:true, } });
  } catch (err) {
    console.error('Error submitting:', err);
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
          aria-label="Close"
          style={{ cursor: 'pointer' }}
        >
          ×
        </span>
      </div>
      <form onSubmit={handleSubmit}>
        <div className="input-box">
          <label htmlFor="phone">Phone Number</label>
          <input
            id="phone"
            type="text"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            required
          />
        </div>
        {error && <p className="error-message">{error}</p>}

        <button type="submit" className="login-btn">Send OTP</button>
      </form>
    </div>
  );
};

export default ResetPhoneEntry;
