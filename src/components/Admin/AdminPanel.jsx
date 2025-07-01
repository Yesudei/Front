import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import axiosInstance from '../../axiosInstance';
import ShareAccessForm from './ShareAccessForm';

function AdminPanel() {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showSharedWith, setShowSharedWith] = useState({});

  const navigate = useNavigate();

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
    <div style={{ padding: '1rem' }}>
      <h1>Admin Panel</h1>

      {loading && <p>Loading devices...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {!loading && !error && devices.length === 0 && <p>No devices found.</p>}

      {/* Button to navigate to AdminDevices page */}
      <button
        onClick={() => navigate('devices')}
        style={{
          marginBottom: '20px',
          padding: '8px 16px',
          cursor: 'pointer',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
        }}
      >
        View Shared Devices
      </button>

      <ul style={{ listStyle: 'none', padding: 0 }}>
        {devices.map((device) => {
          const deviceId = device._id || device.id;

          return (
            <li
              key={deviceId}
              style={{
                border: '1px solid #ccc',
                padding: '1rem',
                marginBottom: '1rem',
                borderRadius: '6px',
              }}
            >
              <h3>Device ID: {deviceId}</h3>
              <p>Type: {device.type || 'Unknown'}</p>
              <p>
                Owner(s):{' '}
                {Array.isArray(device.owner) && device.owner.length > 0
                  ? device.owner.join(', ')
                  : 'N/A'}
              </p>

              <button
                onClick={() => toggleShowSharedWith(deviceId)}
                style={{ marginBottom: '10px', cursor: 'pointer' }}
              >
                {showSharedWith[deviceId] ? 'Hide Shared Users' : 'Show Shared Users'}
              </button>

              {showSharedWith[deviceId] && (
                <div
                  style={{
                    backgroundColor: '#f9f9f9',
                    padding: '10px',
                    borderRadius: '4px',
                    marginBottom: '10px',
                  }}
                >
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

      {/* Render nested admin routes here (e.g. AdminDevices) */}
      <Outlet />
    </div>
  );
}

export default AdminPanel;
