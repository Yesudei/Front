import React, { useState, useEffect } from 'react';
import axiosInstance from '../axiosInstance';
import { useUser } from '../UserContext';
import '../CSS/Devices.css';

const Devices = () => {
  const [connectedDevices, setConnectedDevices] = useState([]);
  const { accessToken, user } = useUser();

  const fetchConnectedDevices = async () => {
    try {
      const res = await axiosInstance.get('/mqtt/getAllDevices');
      console.log('🔥 [getAllDevices response]:', res.data);
      if (res.data.success) {
        setConnectedDevices(res.data.devices || []);
      }
    } catch (err) {
      console.error('Failed to fetch connected devices:', err);
    }
  };

  useEffect(() => {
    console.log('🧪 useEffect running:');
    console.log('   accessToken:', accessToken);
    console.log('   user:', user);
    console.log('   user._id:', user?._id);

    if (accessToken && user?._id) {
      console.log('✅ Conditions met. Fetching devices...');
      fetchConnectedDevices();
    } else {
      console.warn('❌ Missing accessToken or user._id, skipping fetchConnectedDevices');
    }
  }, [accessToken, user]);

  const registerDevice = async (device) => {
    console.log('Registering device:', device.clientId, 'entities:', device.entities);

    const entityToRegister =
      Array.isArray(device.entities) &&
      device.entities.length > 0 &&
      typeof device.entities[0] === 'string' &&
      device.entities[0].trim() !== ''
        ? device.entities[0].trim()
        : null;

    if (!entityToRegister) {
      alert(`Device ${device.clientId} cannot be registered: missing or invalid entity.`);
      return;
    }

    try {
      await axiosInstance.post(
        '/device/registerDevices',
        {
          clientId: device.clientId,
          entity: entityToRegister,
          type: device.type || 'th',
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      alert(`Device ${device.clientId} registered!`);
      await fetchConnectedDevices();
    } catch (err) {
      console.error('Registration failed:', err);
      const errorMsg = err.response?.data?.message || 'Failed to register device.';
      alert(errorMsg);
    }
  };

  const unregisterDevice = async (device) => {
    try {
      await axiosInstance.delete('/device/deleteDevice', {
        data: {
          clientId: device.clientId,
          entity: device.entities?.[0] || 'SI7021',
        },
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      alert(`Device ${device.clientId} unregistered!`);
      await fetchConnectedDevices();
    } catch (err) {
      console.error('Unregistration failed:', err);
      alert('Failed to unregister device.');
    }
  };

  // Fix: compare owner IDs as strings
  const registeredByUser = connectedDevices.filter(
    (d) => d.registered && d.owner && d.owner.toString() === user?._id
  );

  const registeredByOthers = connectedDevices.filter(
    (d) => d.registered && d.owner && d.owner.toString() !== user?._id
  );

  const unregisteredDevices = connectedDevices.filter((d) => !d.registered);

  return (
    <div className="devices-page">
      <h1 className="devices-title">Devices</h1>

      <div className="devices-columns">
        {/* Registered Devices Owned by You */}
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
