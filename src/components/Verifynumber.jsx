import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../CSS/loginform.css';
import AuthPage from './AuthPage';

const OTP_LENGTH = 6;

const VerifyNumber = () => {
  const [otp, setOtp] = useState(new Array(OTP_LENGTH).fill(''));
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(true);

  const inputRefs = useRef([]);
  const navigate = useNavigate();
  const location = useLocation();

  const rawPhone = location.state?.phoneNumber || '';
  const phoneNumber = rawPhone.replace(/\D/g, ''); // always digits only
  const mode = location.state?.mode === 'reset' ? 'reset' : 'register';

  useEffect(() => {
    const otpAlreadySent = location.state?.otpSent;

    if (!phoneNumber) {
      setError('No phone number provided');
      setSending(false);
      return;
    }

    if (otpAlreadySent) {
      setMessage('OTP has already been sent');
      setSending(false);
      return;
    }

    const sendOtp = async () => {
      try {
        const url = mode === 'reset'
          ? 'http://localhost:3001/otp/forgot_pass'
          : 'http://localhost:3001/otp/verify';

        const payload = mode === 'reset'
          ? { phoneNumber: Number(phoneNumber) }
          : { phoneNumber, authType: mode };

        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
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

    sendOtp();
  }, [phoneNumber, mode, location.state]);

  const handleChange = (e, index) => {
    const value = e.target.value.replace(/\D/, '');
    if (!value) return;

    const updatedOtp = [...otp];
    updatedOtp[index] = value;
    setOtp(updatedOtp);

    if (index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace') {
      if (otp[index]) {
        const updatedOtp = [...otp];
        updatedOtp[index] = '';
        setOtp(updatedOtp);
      } else if (index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft') {
      if (index > 0) inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight') {
      if (index < OTP_LENGTH - 1) inputRefs.current[index + 1]?.focus();
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    const finalOtp = otp.join('');
    if (finalOtp.length !== OTP_LENGTH) {
      setError('Please enter the full OTP');
      return;
    }

    try {
      const url = mode === 'reset'
        ? 'http://localhost:3001/otp/verify_reset/'
        : 'http://localhost:3001/otp/verify';

      const payload = mode === 'reset'
        ? { phoneNumber: Number(phoneNumber), code: finalOtp, authType: mode }
        : { phoneNumber, code: finalOtp };

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
    <AuthPage>
    <div className="wrapper">
      <div className="form-header">
        <h1>Enter OTP</h1>
        <span
          className="close-btn"
          onClick={() => navigate('/login')}
          role="button"
          tabIndex={0}
          aria-label="Close OTP Entry"
        >
          ×
        </span>
      </div>

      {sending ? (
        <p>Sending OTP to {phoneNumber}...</p>
      ) : (
        <form onSubmit={handleVerifyOtp}>
          <div className="otp-input-container">
            {otp.map((digit, index) => (
              <input
                key={index}
                type="text"
                maxLength="1"
                className="otp-box"
                value={digit}
                ref={(el) => (inputRefs.current[index] = el)}
                onChange={(e) => handleChange(e, index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
              />
            ))}
          </div>
          {error && <p className="error-message">{error}</p>}
          {message && <p className="success-message">{message}</p>}
          <button type="submit" className="login-btn">Verify OTP</button>
        </form>
      )}
      </div>
      </AuthPage>
  );
};

export default VerifyNumber;
