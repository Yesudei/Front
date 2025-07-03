import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../CSS/profile.css';
import axiosInstance from '../axiosInstance';
import { useUser } from '../UserContext';

const Profile = () => {
  const { logout, accessToken } = useUser();
  console.log('[DEBUG] accessToken at mount:', accessToken); // <-- Debug log on load

  const [user, setUser] = useState(null);
  const [editedName, setEditedName] = useState('');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [changingPhone, setChangingPhone] = useState(false);
  const [currentOtp, setCurrentOtp] = useState('');
  const [newPhoneNumber, setNewPhoneNumber] = useState('');
  const [newOtp, setNewOtp] = useState('');
  const [step, setStep] = useState(1);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        const res = await axiosInstance.get('/users/getuser');
        console.log('[GET /getuser] response:', res.data);
        setUser(res.data.user);
        setEditedName(res.data.user.name || '');
      } catch (err) {
        console.error('[GET /getuser] Failed:', err);
        setError('Failed to load profile');
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
      console.log('[POST /updateUsername] success:', res.data);
      setUser(prev => ({ ...prev, name: editedName }));
      setSuccess('Name updated successfully!');
    } catch (err) {
      console.error('[POST /updateUsername] error:', err);
      setError('Failed to update name');
    } finally {
      setUpdating(false);
    }
  };

  const initiatePhoneChange = async () => {
    try {
      setError('');
      setSuccess('');
      console.log('[POST /initiatePhoneNumber] sending request');
      const res = await axiosInstance.post('/users/initiatePhoneNumber', {}, {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });
      console.log('[POST /initiatePhoneNumber] success:', res.data);
      setStep(1);
      setChangingPhone(true);
      setSuccess('OTP sent to your current number.');
    } catch (err) {
      console.error('[POST /initiatePhoneNumber] error:', err);
      setError('Failed to send OTP to current number.');
    }
  };

  const verifyCurrentOtp = async () => {
    if (!currentOtp.trim() || !newPhoneNumber.trim()) {
      setError('Please enter both current OTP and new phone number.');
      return;
    }

    const payload = {
      otp: currentOtp.trim(),
      newPhoneNumber: newPhoneNumber.trim()
    };

    console.log('[POST /verifyCurrentNumber] payload:', payload);
    console.log('[POST /verifyCurrentNumber] accessToken:', accessToken);

    try {
      setError('');
      setSuccess('');
      const res = await axiosInstance.post('/users/verifyCurrentNumber', payload, {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });
      console.log('[POST /verifyCurrentNumber] success:', res.data);
      setStep(2);
      setSuccess('OTP sent to your new phone number.');
    } catch (err) {
      console.error('[POST /verifyCurrentNumber] error:', err?.response?.data || err);
      setError('Failed to verify current OTP or send to new number.');
    }
  };

  const confirmNewPhoneNumber = async () => {
    if (!newOtp.trim()) {
      setError('Please enter the OTP sent to your new number.');
      return;
    }

    const payload = {
      otp: newOtp.trim(),
      newPhoneNumber: newPhoneNumber.trim()
    };

    console.log('[POST /confirmNewPhoneNumber] payload:', payload);
    console.log('[POST /confirmNewPhoneNumber] accessToken:', accessToken); // <-- Debug token before final request

    try {
      setError('');
      setSuccess('');
      const res = await axiosInstance.post('/users/confirmNewPhoneNumber', payload, {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });

      console.log('[POST /confirmNewPhoneNumber] success:', res.data);
      setUser(prev => ({ ...prev, phoneNumber: newPhoneNumber }));
      setChangingPhone(false);
      setStep(1);
      setCurrentOtp('');
      setNewOtp('');
      setNewPhoneNumber('');
      setSuccess('Phone number updated successfully!');
    } catch (err) {
      console.error('[POST /confirmNewPhoneNumber] error:', err?.response?.data || err);
      setError('Failed to confirm new number.');
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
              {changingPhone ? (
                <>
                  {step === 1 && (
                    <>
                      <input
                        type="text"
                        placeholder="Enter OTP from current number"
                        value={currentOtp}
                        onChange={(e) => setCurrentOtp(e.target.value)}
                      />
                      <input
                        type="tel"
                        placeholder="Enter new phone number"
                        value={newPhoneNumber}
                        onChange={(e) => setNewPhoneNumber(e.target.value)}
                      />
                      <button className="login-btn" onClick={verifyCurrentOtp}>Verify Current OTP</button>
                    </>
                  )}

                  {step === 2 && (
                    <>
                      <input
                        type="text"
                        placeholder="Enter OTP from new number"
                        value={newOtp}
                        onChange={(e) => setNewOtp(e.target.value)}
                      />
                      <button className="login-btn" onClick={confirmNewPhoneNumber}>Confirm New Phone</button>
                    </>
                  )}
                  <button className="logout-btn" onClick={() => setChangingPhone(false)}>Cancel</button>
                </>
              ) : (
                <>
                  <input
                    type="tel"
                    value={user.phoneNumber || ''}
                    readOnly
                  />
                  <button className="login-btn" onClick={initiatePhoneChange}>Change</button>
                </>
              )}
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
