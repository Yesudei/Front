import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../CSS/profile.css';
import axiosInstance from '../axiosInstance';
import { useUser } from '../UserContext';

const Profile = () => {
  const { logout, accessToken } = useUser();
  const [user, setUser] = useState(null);
  const [editedName, setEditedName] = useState('');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        const res = await axiosInstance.get('/users/getuser');
        setUser(res.data.user);
        setEditedName(res.data.user.name || '');
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

const handleUpdate = async () => {
  if (!editedName.trim()) {
    setError('Name cannot be empty.');
    return;
  }

  try {
    setUpdating(true);
    setError('');
    setSuccess('');
    const res = await axiosInstance.post(
      '/users/updateUsername',
      { newName: editedName },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`, 
        },
      }
    );
    setUser(prev => ({ ...prev, name: editedName }));
    setSuccess('Name updated successfully!');
  } catch (err) {
    console.error(err);
    setError('Failed to update name');
  } finally {
    setUpdating(false);
  }
};


  if (loading) {
    return <div className="wrapper"><p>Loading profile...</p></div>;
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

      {error && <p className="error-message">{error}</p>}
      {success && <p className="success-message">{success}</p>}

      {user ? (
        <>
          <div className="avatar">
            {user.name?.[0]?.toUpperCase() || "?"}
          </div>

          <div className="profile-info">
            <div className="input-box">
              <label>Name</label>
              <input
                type="text"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                disabled={updating}
              />
            </div>

            <div className="input-box">
              <label>Phone Number</label>
              <input
                type="tel"
                value={user.phoneNumber || ''}
                readOnly
              />
            </div>

            <button
              className="login-btn"
              onClick={handleUpdate}
              disabled={updating}
            >
              {updating ? 'Saving...' : 'Save Changes'}
            </button>

            <button className="logout-btn" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </>
      ) : (
        <p>No user data found.</p>
      )}
    </div>
  );
};

export default Profile;
