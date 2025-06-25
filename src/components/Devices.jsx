import React, { useState, useEffect } from 'react';
import axiosInstance from '../axiosInstance';
import { useUser } from '../UserContext';
import '../CSS/Devices.css';

const Devices = () => {
  const [allDevices, setAllDevices] = useState([]);
  const [registeredDevices, setRegisteredDevices] = useState([]);
  const { user } = useUser();

  const fetchAllDevices = async () => {
    try {
      const response = await axiosInstance.get('/mqtt/getAllDevices');
      const devices = response.data.devices || response.data || [];
      setAllDevices(devices);
    } catch (err) {
      console.error('Failed to fetch devices:', err);
    }
  };

  const fetchRegisteredDevices = async () => {
    try {
      const response = await axiosInstance.get('/users/getuser');
      const userDevices = response.data?.user?.devices || [];
      setRegisteredDevices(userDevices);
    } catch (err) {
      console.error('Failed to fetch user devices:', err);
    }
  };

  const registerDevice = async (device) => {
    try {
      await axiosInstance.post('/device/registerDevices', {
        clientId: device.clientId,
        entity: device.entity || 'SI7021',
        type: device.type || 'th',
      });
      alert(`Device ${device.clientId} registered!`);
      fetchAllDevices();
      fetchRegisteredDevices();
    } catch (err) {
      console.error('Registration failed:', err);
      alert('Failed to register device.');
    }
  };

  const unregisterDevice = async (device) => {
    try {
      await axiosInstance.delete('/device/deleteDevice', {
        data: {
          clientId: device.clientId,
          entity: device.entity || 'SI7021'
        },
      });
      alert(`Device ${device.clientId} unregistered!`);
      fetchAllDevices();
      fetchRegisteredDevices();
    } catch (err) {
      console.error('Unregistration failed:', err);
      alert('Failed to unregister device.');
    }
  };

  useEffect(() => {
    fetchAllDevices();
    fetchRegisteredDevices();
  }, []);

  const unregisteredDevices = allDevices.filter(
    (d) => !registeredDevices.some((rd) => rd.clientId === d.clientId)
  );

  return (
    <div className="devices-page">
      <h1 className="devices-title">Devices</h1>

      <div className="devices-columns">
        {/* Registered Devices */}
        <div className="device-column">
          <h2>Registered Devices</h2>
          {registeredDevices.length === 0 ? (
            <p>No registered devices.</p>
          ) : (
            <ul className="device-list">
              {registeredDevices.map((device) => (
                <li key={device.clientId} className="device-item">
                  <div>
                    <strong>{device.clientId}</strong> — {device.entity || 'Unknown Entity'}
                  </div>
                  <button onClick={() => unregisterDevice(device)}>Unregister</button>
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
                    <strong>{device.clientId}</strong> — {device.entity || 'Unknown Entity'}
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
