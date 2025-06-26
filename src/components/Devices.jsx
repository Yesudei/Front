import React, { useState, useEffect } from 'react';
import axiosInstance from '../axiosInstance';
import { useUser } from '../UserContext';
import '../CSS/Devices.css';

const Devices = () => {
  const [allDevices, setAllDevices] = useState([]);
  const { user } = useUser();

  // Fetch all devices with registration and owner info
  const fetchAllDevices = async () => {
    try {
      const response = await axiosInstance.get('/mqtt/getAllDevices');
      const devices = response.data.devices || [];
      setAllDevices(devices);
      console.log('[DEBUG] All devices:', devices);
    } catch (err) {
      console.error('Failed to fetch devices:', err);
    }
  };

  // Register a device
  const registerDevice = async (device) => {
    try {
      await axiosInstance.post('/device/registerDevices', {
        clientId: device.clientId,
        entity: device.entities?.[0] || 'SI7021',
        type: device.type || 'th',
      });
      alert(`Device ${device.clientId} registered!`);
      await fetchAllDevices();
    } catch (err) {
      console.error('Registration failed:', err);
      alert('Failed to register device.');
    }
  };

  // Unregister a device
  const unregisterDevice = async (device) => {
    try {
      await axiosInstance.delete('/device/deleteDevice', {
        data: {
          clientId: device.clientId,
          entity: device.entities?.[0] || 'SI7021',
        },
      });
      alert(`Device ${device.clientId} unregistered!`);
      await fetchAllDevices();
    } catch (err) {
      console.error('Unregistration failed:', err);
      alert('Failed to unregister device.');
    }
  };

  useEffect(() => {
    if (user?._id) {
      fetchAllDevices();
    }
  }, [user]);

  // Split devices into categories based on registration and ownership
  const registeredByUser = allDevices.filter(
    (d) => d.registered && d.owner === user._id
  );

  const registeredByOthers = allDevices.filter(
    (d) => d.registered && d.owner && d.owner !== user._id
  );

  const unregisteredDevices = allDevices.filter((d) => !d.registered);

  return (
    <div className="devices-page">
      <h1 className="devices-title">Devices</h1>

      <div className="devices-columns">
        {/* Registered Devices Owned by User */}
        <div className="device-column">
          <h2>Registered Devices (You Own)</h2>
          {registeredByUser.length === 0 ? (
            <p>No registered devices.</p>
          ) : (
            <ul className="device-list">
              {registeredByUser.map((device) => (
                <li key={device.clientId} className="device-item">
                  <div>
                    <strong>{device.clientId}</strong> — {device.entities?.[0] || 'Unknown Entity'}
                  </div>
                  <button onClick={() => unregisterDevice(device)}>Unregister</button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Registered Devices Owned by Others */}
        <div className="device-column">
          <h2>Registered Devices (Owned by Others)</h2>
          {registeredByOthers.length === 0 ? (
            <p>No devices registered by others.</p>
          ) : (
            <ul className="device-list">
              {registeredByOthers.map((device) => (
                <li key={device.clientId} className="device-item">
                  <div>
                    <strong>{device.clientId}</strong> — {device.entities?.[0] || 'Unknown Entity'}
                    <em style={{ marginLeft: '10px', color: 'gray' }}>
                      (Owned by another user)
                    </em>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Unregistered Devices */}
        <div className="device-column">
          <h2>Unregistered Devices</h2>
          {unregisteredDevices.length === 0 ? (
            <p>No unregistered devices found.</p>
          ) : (
            <ul className="device-list">
              {unregisteredDevices.map((device) => (
                <li key={device.clientId} className="device-item">
                  <div>
                    <strong>{device.clientId}</strong> — {device.entities?.[0] || 'Unknown Entity'}
                  </div>
                  <button onClick={() => registerDevice(device)}>Register</button>
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
