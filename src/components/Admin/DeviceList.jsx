import React from 'react';

function DeviceList({ devices, onSelectDevice, selectedDeviceId }) {
  if (!devices.length) return <p>No devices found.</p>;

  return (
    <ul>
      {devices.map(device => (
        <li
          key={device.id || device._id}
          style={{
            cursor: 'pointer',
            fontWeight: device.id === selectedDeviceId ? 'bold' : 'normal',
            padding: '5px',
            borderBottom: '1px solid #ccc',
          }}
          onClick={() => onSelectDevice(device.id || device._id)}
        >
          {device.clientId || device.name || device._id}
        </li>
      ))}
    </ul>
  );
}

export default DeviceList;
