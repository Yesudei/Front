import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import axiosInstance from '../../axiosInstance';
import ShareAccessForm from './ShareAccessForm';
import '../../CSS/AdminPanel.css';

function AdminPanel() {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showSharedWith, setShowSharedWith] = useState({});
  const [deviceDetails, setDeviceDetails] = useState({});
  const [removingUser, setRemovingUser] = useState({}); // Track per-user removal state

  useEffect(() => {
    fetchDevices();
  }, []);

  const fetchDevices = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axiosInstance.get('/device/getDevices');
      if (response.data.success) {
        setDevices(response.data.devices || []);
      } else {
        setError(response.data.message || 'Failed to load devices');
      }
    } catch (err) {
      console.error('Error fetching devices:', err);
      setError('Error fetching devices');
    } finally {
      setLoading(false);
    }
  };

  const fetchDeviceOwners = async (deviceId) => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) throw new Error('Access token not found');

      const response = await axiosInstance.post(
        '/device/getOwners',
        { deviceId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const owners = response.data.owners || [];

      setDeviceDetails((prev) => ({
        ...prev,
        [deviceId]: {
          owners,
        },
      }));
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

  const handleRemoveUser = async (deviceId, phoneNumber) => {
    if (!window.confirm(`Are you sure you want to remove user ${phoneNumber}?`)) return;

    setRemovingUser((prev) => ({ ...prev, [deviceId + phoneNumber]: true }));

    try {
      const token = localStorage.getItem('accessToken');
      const response = await axiosInstance.post(
        '/device/removeUserFromDevice',
        {
          id: deviceId,
          phoneNumber,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        await fetchDeviceOwners(deviceId); // Refresh owners
      } else {
        alert(response.data.message || 'Failed to remove user.');
      }
    } catch (err) {
      console.error('Error removing user:', err.response?.data || err.message);
      alert('Error removing user. Please try again.');
    } finally {
      setRemovingUser((prev) => {
        const newState = { ...prev };
        delete newState[deviceId + phoneNumber];
        return newState;
      });
    }
  };

  return (
    <div className="admin-panel">
      <h1>Admin Panel</h1>

      {loading && <p>Loading devices...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {!loading && !error && devices.length === 0 && <p>No devices found.</p>}

      <ul className="device-list">
        {devices.map((device) => {
          const deviceId = device._id || device.id;
          const owners = deviceDetails[deviceId]?.owners || [];

          return (
            <li key={deviceId} className="device-card">
              <h3>Device ID: {deviceId}</h3>
              <p>Type: {device.type || 'Unknown'}</p>
              <button
                className="toggle-button"
                onClick={() => toggleShowSharedWith(deviceId)}
              >
                {showSharedWith[deviceId] ? 'Hide Shared Users' : 'Show Shared Users'}
              </button>

              {showSharedWith[deviceId] && (
                <div className="shared-users">
                  <strong>Shared With:</strong>
                  {!deviceDetails[deviceId] ? (
                    <p>Loading shared users...</p>
                  ) : (
                    <>
                      {owners.length > 0 ? (
                        <ul className="shared-user-list">
                          {owners.map((user) => (
                            <li key={user.userId || user.phoneNumber} className="shared-user-item">
                              {user.name
                                ? `${user.name} (${user.phoneNumber})`
                                : user.phoneNumber}
                              <button
                                className="remove-user-button"
                                onClick={() =>
                                  handleRemoveUser(deviceId, user.phoneNumber)
                                }
                                disabled={
                                  removingUser[deviceId + user.phoneNumber]
                                }
                              >
                                {removingUser[deviceId + user.phoneNumber]
                                  ? 'Removing...'
                                  : 'Remove'}
                              </button>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p>No shared users</p>
                      )}
                    </>
                  )}
                </div>
              )}

              <ShareAccessForm deviceId={deviceId} />
            </li>
          );
        })}
      </ul>

      <Outlet />
    </div>
  );
}

export default AdminPanel;
