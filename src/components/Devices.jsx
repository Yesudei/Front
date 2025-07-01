import React, { useState, useEffect } from 'react';
import axiosInstance from '../axiosInstance';
import { useUser } from '../UserContext';
import '../CSS/Devices.css';

const Devices = () => {
  const [connectedDevices, setConnectedDevices] = useState([]);
  const { accessToken, user } = useUser();
  const [loadingRemove, setLoadingRemove] = useState(null);

  const fetchConnectedDevices = async () => {
    try {
      const res = await axiosInstance.get('/device/getDevices', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.data.success) {
        const normalizedDevices = (res.data.devices || []).map(device => ({
          ...device,
          _id:
            typeof device._id === 'object' && device._id.$oid
              ? device._id.$oid
              : device._id,
        }));
        setConnectedDevices(normalizedDevices);
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

  const accessibleDevices = connectedDevices.filter(device => {
    if (!device.owner || device.owner.length === 0) return false;
    const userIdStr = user._id.toString();
    return device.owner.some(ownerObj => {
      const ownerUserId = ownerObj.userId;
      let ownerUserIdStr = '';
      if (
        typeof ownerUserId === 'object' &&
        ownerUserId !== null &&
        '$oid' in ownerUserId
      ) {
        ownerUserIdStr = ownerUserId.$oid;
      } else if (typeof ownerUserId === 'string') {
        ownerUserIdStr = ownerUserId;
      }
      return ownerUserIdStr === userIdStr;
    });
  });

  const handleRemove = async deviceId => {
    if (
      !window.confirm(
        'Are you sure you want to remove this device from your list?'
      )
    )
      return;

    setLoadingRemove(deviceId);

    try {
      const ownersResponse = await axiosInstance.post(
        '/device/getOwners',
        { deviceId },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      if (!ownersResponse.data.success) {
        alert('Failed to get device owners');
        setLoadingRemove(null);
        return;
      }

      const allOwners = ownersResponse.data.owners || [];

      const userPhoneFound = allOwners.some(
        owner => owner.phoneNumber === user.phoneNumber
      );

      if (!userPhoneFound) {
        alert('Your phone number is not associated with this device.');
        setLoadingRemove(null);
        return;
      }

      const removeResponse = await axiosInstance.post(
        '/device/removeUserFromDevice',
        {
          id: deviceId,
          phoneNumber: user.phoneNumber,
        },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      if (removeResponse.data.success) {
        fetchConnectedDevices();
      } else {
        alert(removeResponse.data.message || 'Failed to remove device.');
      }
    } catch (err) {
      console.error('Error removing device:', err.response?.data || err.message);
      alert('Error removing device. Please try again.');
    } finally {
      setLoadingRemove(null);
    }
  };

  return (
    <div className="devices-page">
      <h1 className="devices-title">My Devices</h1>

      <div className="devices-columns">
        <div className="device-column">
          {accessibleDevices.length === 0 ? (
            <p>No devices shared with you.</p>
          ) : (
            <ul className="device-list">
              {accessibleDevices.map(device => (
                <li key={device._id} className="device-item">
                  <div>
                    <strong>{device.clientId || device._id}</strong> —{' '}
                    {device.entity || 'Unknown Entity'}
                  </div>
                  <button
                    onClick={() => handleRemove(device._id)}
                    disabled={loadingRemove === device._id}
                  >
                    {loadingRemove === device._id ? 'Removing...' : 'Remove Device'}
                  </button>
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
