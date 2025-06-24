import React, { useState, useEffect } from 'react';
import axiosInstance from '../axiosInstance'; // configured axios with interceptors
import { useUser } from '../UserContext';
import '../CSS/Devices.css';

const Devices = () => {
  const [allDevices, setAllDevices] = useState([]);
  const [registeredDevices, setRegisteredDevices] = useState([]);
  const { user } = useUser();

  // Fetch all devices from MQTT server
  const fetchAllDevices = async () => {
    try {
      const response = await axiosInstance.get('/mqtt/getAllDevices');
      const devices = response.data.devices || response.data || [];
      setAllDevices(devices);
    } catch (err) {
      console.error('Failed to fetch devices:', err);
    }
  };

  // Fetch user registered devices
  const fetchRegisteredDevices = async () => {
    try {
      const response = await axiosInstance.get('/users/getuser');
      const userDevices = response.data?.user?.devices || [];
      setRegisteredDevices(userDevices);
    } catch (err) {
      console.error('Failed to fetch user devices:', err);
    }
  };

  // Register a device for this user
  const registerDevice = async (device) => {
    try {
      await axiosInstance.post('/device/registerDevices', {
        clientId: device.clientId,
        entity: device.entity || 'SI7021',
        type: device.type || 'th',
      });
      alert(`Device ${device.clientId} registered!`);
      // Refresh lists after registering
      await fetchAllDevices();
      await fetchRegisteredDevices();
    } catch (err) {
      console.error('Registration failed:', err);
      alert('Failed to register device.');
    }
  };

  useEffect(() => {
    fetchAllDevices();
    fetchRegisteredDevices();
  }, []);

  // Filter devices that are NOT registered yet
  const unregisteredDevices = allDevices.filter(
    (d) => !registeredDevices.some((rd) => rd.clientId === d.clientId)
  );

  return (
    <div className="devices-page">
      <h1>All Available Devices</h1>
      {unregisteredDevices.length === 0 && <p>No unregistered devices found.</p>}
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
    </div>
  );
};

export default Devices;
