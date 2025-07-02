import React, { useState, useEffect } from 'react';
import axiosInstance from '../axiosInstance';
import { useUser } from '../UserContext';
import ShareAccessForm from './Admin/ShareAccessForm';
import '../CSS/Devices.css';

const Devices = () => {
  const [connectedDevices, setConnectedDevices] = useState([]);
  const [deviceDetails, setDeviceDetails] = useState({});
  const [showSharedWith, setShowSharedWith] = useState({});
  const [loadingRemove, setLoadingRemove] = useState(null);
  const { accessToken, user } = useUser();

  // Convert logged-in user's phone number to string for comparison
  const loggedInPhoneNumber = user?.phoneNumber ? String(user.phoneNumber).trim() : null;

  const fetchConnectedDevices = async () => {
    try {
      const res = await axiosInstance.get('/device/getDevices', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (res.data.success) {
        const normalizedDevices = (res.data.devices || []).map((device) => ({
          ...device,
          _id:
            typeof device._id === 'object' && device._id.$oid
              ? device._id.$oid
              : device._id,
        }));
        setConnectedDevices(normalizedDevices);
      }
    } catch (err) {
      console.error('Failed to fetch connected devices:', err);
    }
  };

  useEffect(() => {
    if (accessToken && user?._id) {
      fetchConnectedDevices();
    }
  }, [accessToken, user]);

  const fetchDeviceOwners = async (deviceId) => {
    try {
      const response = await axiosInstance.post(
        '/device/getOwners',
        { deviceId },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (response.data.success) {
        const owners = response.data.owners || [];
        setDeviceDetails((prev) => ({
          ...prev,
          [deviceId]: { owners },
        }));
      }
    } catch (error) {
      console.error(`Error fetching owners for device ${deviceId}:`, error.message);
    }
  };

  const toggleShowSharedWith = async (deviceId) => {
    setShowSharedWith((prev) => ({
      ...prev,
      [deviceId]: !prev[deviceId],
    }));

    if (!deviceDetails[deviceId]) {
      await fetchDeviceOwners(deviceId);
    }
  };

  const handleRemove = async (deviceId) => {
    if (!window.confirm('Are you sure you want to remove this device from your list?'))
      return;

    setLoadingRemove(deviceId);
    try {
      const response = await axiosInstance.post(
        '/device/removeUserFromDevice',
        {
          id: deviceId,
          phoneNumber: user.phoneNumber,
        },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      if (response.data.success) {
        fetchConnectedDevices();
      } else {
        alert(response.data.message || 'Failed to remove device.');
      }
    } catch (err) {
      console.error('Error removing device:', err.response?.data || err.message);
      alert('Error removing device. Please try again.');
    } finally {
      setLoadingRemove(null);
    }
  };

  return (
    <div className="devices-page">
      <h1 className="devices-title">Manage My Devices</h1>

      {connectedDevices.length === 0 ? (
        <p>No devices found.</p>
      ) : (
        <ul className="device-list">
          {connectedDevices.map((device) => {
            const deviceId = device._id;
            const owners = deviceDetails[deviceId]?.owners || [];
            const deviceName = device.name || device.clientId || deviceId;

            return (
              <li key={deviceId} className="device-card">
                <h3>Device: {deviceName}</h3>
                <p>Type: {device.type || 'Unknown'}</p>

                <button
                  onClick={() => handleRemove(deviceId)}
                  disabled={loadingRemove === deviceId}
                >
                  {loadingRemove === deviceId ? 'Removing...' : 'Remove Device'}
                </button>

                <button
                  onClick={() => toggleShowSharedWith(deviceId)}
                  className="toggle-button"
                >
                  {showSharedWith[deviceId] ? 'Hide Shared Users' : 'Show Shared Users'}
                </button>

                {showSharedWith[deviceId] && (
                  <div className="shared-users">
                    <strong>Shared With:</strong>
                    {owners.length > 0 ? (
                      <ul className="shared-user-list">
                        {owners.map((owner) => {
                          const ownerPhone = String(owner.phoneNumber).trim();
                          const isCurrentUser = ownerPhone === loggedInPhoneNumber;

                          return (
                            <li key={owner.userId || owner.phoneNumber}>
                              {owner.name
                                ? `${owner.name} (${owner.phoneNumber}${isCurrentUser ? ' — you' : ''})`
                                : `${owner.phoneNumber}${isCurrentUser ? ' — you' : ''}`}
                            </li>
                          );
                        })}
                      </ul>
                    ) : (
                      <p>No shared users</p>
                    )}
                  </div>
                )}

                <ShareAccessForm deviceId={deviceId} />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default Devices;
