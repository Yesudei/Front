import React from 'react';
import '../../CSS/AdminPanel.css';

function DeviceList({ devices, onShare, onUnshare, isAdminView, onRemoveSelf }) {
  return (
    <div className="device-list">
      {devices.map((device) => (
        <div className="device-card" key={device.clientId}>
          <h3 className="device-id">ID: {device.clientId}</h3>
          <p className="device-type">Төрөл: {device.type}</p>
          <p className="device-status">
            Бүртгэлтэй эсэх: {device.registered ? 'Тийм' : 'Үгүй'}
          </p>

          <div className="device-actions">
            {isAdminView ? (
              <>
                <button
                  className="button-primary"
                  onClick={() => onShare(device.clientId)}
                >
                  Хуваалцах
                </button>
                {onUnshare && (
                  <button
                    className="button-secondary"
                    onClick={() => onUnshare(device.clientId)}
                  >
                    Хуваалцах эрх цуцлах
                  </button>
                )}
              </>
            ) : (
              <button
                className="button-danger"
                onClick={() => onRemoveSelf(device.clientId)}
              >
                Энэ төхөөрөмжөөс гарах
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export default DeviceList;
