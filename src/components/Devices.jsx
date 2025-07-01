import React, { useEffect, useState } from 'react';
import axiosInstance from '../axiosInstance';
import { useUser } from '../UserContext';
import '../CSS/Devices.css';

const Devices = () => {
  const { accessToken, user } = useUser();
  const [connectedDevices, setConnectedDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch devices on load
  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const res = await axiosInstance.get('/device/getDevices', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        // Use res.data.devices if the response is in that format
        console.log('[DEBUG] Full device response:', res.data);
        setConnectedDevices(res.data.devices);
      } catch (err) {
        console.error('Failed to fetch devices:', err);
        setError('Failed to load devices');
      } finally {
        setLoading(false);
      }
    };

    fetchDevices();
  }, [accessToken]);

  const handleRemoveDevice = async (clientId) => {
    try {
      const res = await axiosInstance.post(
        '/device/removeUserFromDevice',
        { clientId },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      console.log('[INFO] Removed:', res.data);
      setConnectedDevices((prev) =>
        prev.filter((device) => device.clientId !== clientId)
      );
    } catch (err) {
      console.error('Failed to remove device:', err);
      setError('Could not remove device');
    }
  };

  // Filter devices where user is owner or addedBy
  const accessibleDevices = connectedDevices.filter((device) => {
    const uid = user?._id || user?.id;
    return device.owner === uid || device.addedBy === uid;
  });

  return (
    <div className="devices-container">
      <h2>Your Devices</h2>
      {loading ? (
        <p>Loading devices...</p>
      ) : error ? (
        <p className="error">{error}</p>
      ) : accessibleDevices.length === 0 ? (
        <p>No accessible devices found.</p>
      ) : (
        <div className="device-list">
          {accessibleDevices.map((device) => (
            <div className="device-card" key={device.clientId}>
              <h3>{device.clientId}</h3>
              <p>Type: {device.type || 'Unknown'}</p>
              <p>Owner: {device.owner}</p>
              {((device.owner === user?._id) || (device.addedBy === user?._id)) && (
                <button
                  className="remove-btn"
                  onClick={() => handleRemoveDevice(device.clientId)}
                >
                  Remove Device
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Devices;
