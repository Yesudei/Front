import React, { useState } from 'react';
import axiosInstance from '../../axiosInstance';
import { useUser } from '../../UserContext';

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
    <form onSubmit={handleShare} style={{ marginTop: '20px' }}>
      <h3>Share Device Access</h3>
      <input
        type="text"
        placeholder="User's phone number"
        value={phoneNumber}
        onChange={(e) => setPhoneNumber(e.target.value)}
        style={{ width: '100%', marginBottom: '8px', padding: '6px' }}
      />
      <input
        type="text"
        placeholder="Custom name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        style={{ width: '100%', marginBottom: '8px', padding: '6px' }}
      />
      <button type="submit" disabled={loading} style={{ padding: '8px 12px' }}>
        {loading ? 'Sharing...' : 'Share Access'}
      </button>
      {statusMessage && <p>{statusMessage}</p>}
    </form>
  );
}

export default ShareAccessForm;
