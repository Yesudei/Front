import React, { useState, useEffect } from 'react';
import axiosInstance from '../axiosInstance';
import { useUser } from '../UserContext';
import '../CSS/Devices.css';

const Devices = () => {
  const [connectedDevices, setConnectedDevices] = useState([]);
  const { accessToken, user } = useUser();

  const fetchConnectedDevices = async () => {
    try {
      const res = await axiosInstance.get('/device/getDevices', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (res.data.success) {
        setConnectedDevices(res.data.devices || []);
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

  // Show all devices where user is in owner array
  const accessibleDevices = connectedDevices.filter(device => {
    if (!device.owner) return false;
    const ownersArray = Array.isArray(device.owner) ? device.owner : [device.owner];
    return ownersArray.includes(user._id);
  });

  return (
    <div className="devices-page">
      <h1 className="devices-title">Devices </h1>

      <div className="devices-columns">
        <div className="device-column">
          {accessibleDevices.length === 0 ? (
            <p>No accessible devices found.</p>
          ) : (
            <ul className="device-list">
              {accessibleDevices.map(device => (
                <li key={device.clientId || device._id} className="device-item">
                  <div>
                    <strong>{device.clientId || device._id}</strong> — {device.entity || device.entities?.[0] || 'Unknown Entity'}
                    <em style={{ marginLeft: '10px', color: 'gray' }}>
                      {Array.isArray(device.owner) && device.owner[0] === user._id
                        ? ''
                        : ''}
                    </em>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default Devices;
