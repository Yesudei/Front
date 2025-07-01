import React, { useState } from 'react';
import axiosInstance from '../../axiosInstance';
import { useUser } from '../../UserContext';
import '../../CSS/ShareAccessForm.css';


function ShareAccessForm({ deviceId, onShareSuccess }) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [name, setName] = useState('');
  const [statusMessage, setStatusMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const { accessToken } = useUser();
  

  const handleShare = async (e) => {
    e.preventDefault();
    setStatusMessage(null);

    if (!phoneNumber) {
      setStatusMessage('Please enter a phone number');
      return;
    }
    if (!name) {
      setStatusMessage('Please enter a name');
      return;
    }
    if (!deviceId) {
      setStatusMessage('Invalid device ID');
      return;
    }
    if (!accessToken) {
      setStatusMessage('You must be logged in');
      return;
    }

    try {
      setLoading(true);

      const response = await axiosInstance.post(
        '/device/addUserToDevice',
        {
          id: deviceId,
          phoneNumber: phoneNumber.trim(),
          name: name.trim(),
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (response.data.success) {
        setStatusMessage('✅ Device shared successfully');
        setPhoneNumber('');
        setName('');
        if (onShareSuccess) {
          onShareSuccess();
        }
      } else {
        setStatusMessage(response.data.message || '❌ Failed to share device');
      }
    } catch (error) {
      setStatusMessage('❌ Error sharing device');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="form-card" onSubmit={handleShare}>
      <h3>Share Device Access</h3>
      <input
        type="text"
        className="input-field"
        placeholder="User's phone number"
        value={phoneNumber}
        onChange={(e) => setPhoneNumber(e.target.value)}
      />
      <input
        type="text"
        className="input-field"
        placeholder="Custom name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <button
        type="submit"
        className="button-primary"
        disabled={loading}
      >
        {loading ? 'Sharing...' : 'Share Access'}
      </button>
      {statusMessage && <p className="status-message">{statusMessage}</p>}
    </form>
  );
}

export default ShareAccessForm;
