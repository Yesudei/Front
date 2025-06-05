import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../components/loginform.css';


const RegisterForm = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('')

  useEffect(() => {
    document.body.classList.add('login-background');
    return () => document.body.classList.remove('login-background');
  }, []);

const handleRegister = async (e) => {
  e.preventDefault();
  if (!name || !email || !password || !confirmPassword) {
    setError('Please fill in all fields');
    return;
  }
  if (password !== confirmPassword) {
    setError('Passwords do not match');
    return;
  }

  try {
    const response = await fetch('http://localhost:3001/users/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, email, phoneNumber, password }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Registration failed');

    // Redirect to verify-number page with phone number
    navigate('/verify-number', { state: { phoneNumber } });
  } catch (err) {
    setError(err.message);
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
                  style={{cursor: 'pointer'}}
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
              <div className="input-box">
                  <label htmlFor='number'>Enter phone number</label>
                  <input
                      id='number'
                      type='tel'
                      required
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                  ></input>
              </div>
        {error && <p className="error-message">{error}</p>}
        <button type="submit" className="login-btn">
          Register
        </button>
        <div className="register-link">
          <p>
            Already have an account?{' '}
            <a onClick={() => navigate('/login')} role="button" tabIndex={0} style={{cursor: 'pointer'}}>
              Login
            </a>
          </p>
        </div>
      </form>
    </div>
  );
};

export default RegisterForm;
