import React, { useState, useEffect } from 'react';
import axiosInstance from '../../axiosInstance';
import ShareAccessForm from './ShareAccessForm';

function AdminPanel() {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch devices from backend
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

  return (
    <div style={{ padding: '1rem' }}>
      <h1>Admin Panel</h1>

      {loading && <p>Loading devices...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {!loading && !error && devices.length === 0 && <p>No devices found.</p>}

      <ul style={{ listStyle: 'none', padding: 0 }}>
        {devices.map((device) => (
          <li
            key={device._id || device.id}
            style={{
              border: '1px solid #ccc',
              padding: '1rem',
              marginBottom: '1rem',
              borderRadius: '6px',
            }}
          >
            <h3>Device ID: {device._id || device.id}</h3>
            <p>Type: {device.type || 'Unknown'}</p>
            <p>Owner: {device.owner || 'N/A'}</p>

            <ShareAccessForm deviceId={device._id || device.id} />
          </li>
        ))}
      </ul>
    </div>
  );
}

export default AdminPanel;
