import React, { useEffect, useState } from 'react';
import axiosInstance from '../../axiosInstance';
import { useUser } from '../../UserContext'; // import your user context hook

const AdminDevices = () => {
  const { user, isLoading } = useUser(); // get user and loading status from context

  const [devices, setDevices] = useState([]);
  const [loadingDevices, setLoadingDevices] = useState(true);
  const [sharedUsers, setSharedUsers] = useState([]);
  const [loadingSharedUsers, setLoadingSharedUsers] = useState(false);
  const [selectedDeviceId, setSelectedDeviceId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState(null);
  const [sharedUsersError, setSharedUsersError] = useState(null);

  useEffect(() => {
    if (!isLoading && user?.isAdmin) {
      fetchAdminDevices();
    } else if (!isLoading && !user?.isAdmin) {
      setLoadingDevices(false); // stop loading if user is not admin
    }
  }, [user, isLoading]);

  const fetchAdminDevices = async () => {
    setError(null);
    setLoadingDevices(true);
    try {
      const response = await axiosInstance.get('/device/getDevices');
      if (response.data.success) {
        setDevices(response.data.devices);
      } else {
        setError('Failed to load devices.');
      }
    } catch (err) {
      console.error('Error fetching admin devices:', err);
      setError('Error fetching devices.');
    } finally {
      setLoadingDevices(false);
    }
  };

  const fetchSharedUsers = async (deviceId) => {
    setSharedUsersError(null);
    setLoadingSharedUsers(true);
    try {
      const response = await axiosInstance.post('/device/getOwners', { deviceId });
      if (response.data.success) {
        setSharedUsers(response.data.owners);
        setSelectedDeviceId(deviceId);
        setShowModal(true);
      } else {
        setSharedUsers([]);
        setSharedUsersError('Failed to fetch shared users.');
      }
    } catch (err) {
      console.error('Error fetching shared users:', err);
      setSharedUsers([]);
      setSharedUsersError('Error fetching shared users.');
    } finally {
      setLoadingSharedUsers(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSharedUsers([]);
    setSelectedDeviceId(null);
    setSharedUsersError(null);
  };

  const styles = {
    container: {
      padding: '20px',
      fontFamily: 'sans-serif',
    },
    list: {
      listStyle: 'none',
      padding: 0,
    },
    card: {
      background: '#f5f5f5',
      padding: '16px',
      marginBottom: '12px',
      borderRadius: '8px',
      boxShadow: '0 0 4px rgba(0, 0, 0, 0.1)',
    },
    button: {
      marginTop: '10px',
      padding: '6px 12px',
      background: '#007bff',
      color: 'white',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
    },
    modalOverlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.4)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 999,
    },
    modalContent: {
      background: 'white',
      padding: '20px 30px',
      borderRadius: '10px',
      maxWidth: '400px',
      width: '90%',
      maxHeight: '80vh',
      overflowY: 'auto',
    },
    closeButton: {
      marginTop: '16px',
      background: '#dc3545',
      color: 'white',
      border: 'none',
      padding: '6px 12px',
      borderRadius: '6px',
      cursor: 'pointer',
    },
    errorText: {
      color: 'red',
      marginTop: '10px',
    },
  };

  if (isLoading || loadingDevices) {
    return <div style={styles.container}>Loading devices...</div>;
  }

  if (!user?.isAdmin) {
    return (
      <div style={styles.container}>
        <h2>Access Denied</h2>
        <p>You must be an admin to view this page.</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h2>Admin Devices</h2>

      {error && <p style={styles.errorText}>{error}</p>}

      {devices.length === 0 ? (
        <p>No devices found.</p>
      ) : (
        <ul style={styles.list}>
          {devices.map((device) => (
            <li key={device._id} style={styles.card}>
              <div>
                <strong>Client ID:</strong> {device.clientId}<br />
                <strong>Type:</strong> {device.type}<br />
                <strong>Status:</strong> {device.status}<br />
              </div>
              <button
                style={styles.button}
                onClick={() => fetchSharedUsers(device._id)}
                disabled={loadingSharedUsers && selectedDeviceId === device._id}
              >
                {loadingSharedUsers && selectedDeviceId === device._id
                  ? 'Loading...'
                  : 'View Shared Users'}
              </button>
            </li>
          ))}
        </ul>
      )}

      {showModal && (
        <div style={styles.modalOverlay} onClick={closeModal}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h3>Shared Users for Device ID: {selectedDeviceId}</h3>
            {sharedUsers.length === 0 ? (
              <p>No users have access to this device.</p>
            ) : (
              <ul>
                {sharedUsers.map((user, index) => (
                  <li key={index}>
                    {user.name} ({user.phoneNumber})
                  </li>
                ))}
              </ul>
            )}
            {sharedUsersError && <p style={styles.errorText}>{sharedUsersError}</p>}
            <button style={styles.closeButton} onClick={closeModal}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDevices;
