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
  const [showAllSharedDevices, setShowAllSharedDevices] = useState(false);

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

  useEffect(() => {
    fetchDevices();
  }, []);

  const toggleShowSharedWith = (deviceId) => {
    setShowSharedWith((prev) => ({
      ...prev,
      [deviceId]: !prev[deviceId],
    }));
  };

  return (
    <div className="admin-panel">
      <h1>Admin Panel</h1>

      {loading && <p>Loading devices...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {!loading && !error && devices.length === 0 && <p>No devices found.</p>}

      <button
        className="button-primary"
        onClick={() => setShowAllSharedDevices((prev) => !prev)}
      >
        {showAllSharedDevices ? 'Hide Shared Devices' : 'View Shared Devices'}
      </button>

      {showAllSharedDevices && (
        <div className="shared-section">
          <h2>Devices Shared With Other Users</h2>
          {devices.filter((d) => d.sharedWith?.length > 0).length === 0 ? (
            <p>No devices are shared with users.</p>
          ) : (
            <ul className="device-list">
              {devices
                .filter((device) => device.sharedWith?.length > 0)
                .map((device) => (
                  <li key={device._id || device.id} className="device-card">
                    <h3>Device ID: {device._id || device.id}</h3>
                    <p>Type: {device.type || 'Unknown'}</p>
                    <p>
                      <strong>Shared With:</strong> {device.sharedWith.join(', ')}
                    </p>
                  </li>
                ))}
            </ul>
          )}
        </div>
      )}

      <ul className="device-list">
        {devices.map((device) => {
          const deviceId = device._id || device.id;

          return (
            <li key={deviceId} className="device-card">
              <h3>Device ID: {deviceId}</h3>
              <p>Type: {device.type || 'Unknown'}</p>
              <p>
                Owner(s):{' '}
                {Array.isArray(device.owner) && device.owner.length > 0
                  ? device.owner.join(', ')
                  : 'N/A'}
              </p>

              <button
                className="toggle-button"
                onClick={() => toggleShowSharedWith(deviceId)}
              >
                {showSharedWith[deviceId] ? 'Hide Shared Users' : 'Show Shared Users'}
              </button>

              {showSharedWith[deviceId] && (
                <div className="shared-users">
                  <strong>Shared With:</strong>{' '}
                  {Array.isArray(device.sharedWith) && device.sharedWith.length > 0
                    ? device.sharedWith.join(', ')
                    : 'No shared users'}
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
