import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../CSS/profile.css';
import axiosInstance from '../axiosInstance';
import { useUser } from '../UserContext';

const Profile = () => {
  const { logout, accessToken } = useUser();
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        const res = await axiosInstance.get('/users/getuser');
        setUser(res.data.user);
      } catch (err) {
        setError('Failed to load profile');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (accessToken) {
      fetchUser();
    } else {
      navigate('/login');
    }
  }, [accessToken, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) {
    return <div className="wrapper"><p>Loading profile...</p></div>;
  }

  if (error) {
    return (
      <div className="wrapper">
        <p className="error-message">{error}</p>
      </div>
    );
  }

  return (
    <div className="wrapper">
      <div className="form-header">
        <h1>Profile</h1>
        <button
          className="close-btn"
          onClick={() => navigate('/')}
          aria-label="Close Profile"
        >
          ×
        </button>
      </div>

      {user ? (
        <div className="profile-info">
          <div className="input-box">
            <label>Name</label>
            <input type="text" value={user.name || ''} readOnly />
          </div>
          <div className="input-box">
            <label>Email</label>
            <input type="email" value={user.email || ''} readOnly />
          </div>
          <div className="input-box">
            <label>Phone Number</label>
            <input type="tel" value={user.phoneNumber || ''} readOnly />
          </div>

          <button className="login-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      ) : (
        <p>No user data found.</p>
      )}
    </div>
  );
};

export default Profile;
