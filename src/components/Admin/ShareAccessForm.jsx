import React, { useState } from 'react';
import axiosInstance from '../../axiosInstance';
import { useUser } from '../../UserContext';

function ShareAccessForm({ deviceId }) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [statusMessage, setStatusMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const { accessToken } = useUser();  // get token from context

  const handleShare = async (e) => {
    e.preventDefault();
    setStatusMessage(null);

    if (!phoneNumber) {
      setStatusMessage('Please enter a phone number');
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
        '/device/addUserToDevice', // POST endpoint for your backend
        {
          id: deviceId,
          phoneNumber,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`, // send token in header
          },
        }
      );

      if (response.data.success) {
        setStatusMessage('Device shared successfully');
        setPhoneNumber('');
      } else {
        setStatusMessage(response.data.message || 'Failed to share device');
      }
    } catch (error) {
      console.error('Share device error:', error);
      setStatusMessage('Error sharing device');
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
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Sharing...' : 'Share Access'}
      </button>
      {statusMessage && <p>{statusMessage}</p>}
    </form>
  );
}

export default ShareAccessForm;
