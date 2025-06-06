import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../components/loginform.css';

const VerifyNumber = () => {
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(true);

  const navigate = useNavigate();
  const location = useLocation();

  const phoneNumber = location.state?.phoneNumber || '';
  const mode = location.state?.mode || 'register'; // 'register' or 'reset'

  useEffect(() => {
    const sendOtp = async () => {
      try {
        const url = mode === 'reset'
          ? 'http://localhost:3001/otp/forgot_pass'  // Reset password flow
          : 'http://localhost:3001/otp/verify'; // Registration flow (use different endpoint if needed)

        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phoneNumber, authType: mode }),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to send OTP');

        setMessage('OTP sent successfully');
      } catch (err) {
        setError('Error sending OTP: ' + err.message);
      } finally {
        setSending(false);
      }
    };

    if (phoneNumber) {
      sendOtp();
    } else {
      setError('No phone number provided');
      setSending(false);
    }
  }, [phoneNumber, mode]);

  const handleVerifyOtp = async (e) => {
    e.preventDefault();

    if (!otp) {
      setError('Please enter the OTP');
      return;
    }

    try {
      const url = mode === 'reset'
        ? 'http://localhost:3001/otp/verify_reset/'  // Reset password OTP verify
        : 'http://localhost:3001/otp/verify';        // Registration OTP verify

      // 👇 Build request payload depending on mode
      const payload = mode === 'reset'
        ? { phoneNumber, code: otp, authType: mode }
        : { phoneNumber, code: otp };

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'OTP verification failed');

      setMessage('OTP verified successfully!');

      if (mode === 'reset') {
        navigate('/reset-password', { state: { phoneNumber } });
      } else {
        navigate('/login');
      }
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

      {sending ? (
        <p>Sending OTP to {phoneNumber}...</p>
      ) : (
        <form onSubmit={handleVerifyOtp}>
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
          {message && <p className="success-message">{message}</p>}
          <button type="submit" className="login-btn">Verify OTP</button>
        </form>
      )}
    </div>
  );
};

export default VerifyNumber;
