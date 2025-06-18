import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useUser } from '../usercontext';
import Card from './Card';

const Home = () => {
  const { accessToken, refreshToken, setAccessToken, logout } = useUser();
  const [userData, setUserData] = useState(null);
  const [mqttDataList, setMqttDataList] = useState({});

  const refreshAccessToken = async () => {
    try {
      const response = await axios.post(
        'http://localhost:3001/users/refresh',
        {},
        {
          headers: { 'x-refresh-token': refreshToken },
          withCredentials: true,
        }
      );
      const newAccessToken =
        response.data.accessToken || response.headers['x-access-token'];
      if (!newAccessToken) throw new Error('No access token returned');
      setAccessToken(newAccessToken);
      return newAccessToken;
    } catch (error) {
      console.error('Error refreshing token:', error);
      logout();
      return null;
    }
  };

  const fetchUserData = async (token) => {
    try {
      const response = await axios.get('http://localhost:3001/users/getuser', {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      setUserData(response.data);
    } catch (error) {
      if (error.response?.status === 401) {
        const newToken = await refreshAccessToken();
        if (newToken) {
          await fetchUserData(newToken);
        } else {
          console.error('Unable to refresh token');
        }
      } else {
        console.error('Error fetching user data:', error);
      }
    }
  };

  const fetchMqttDataForClient = async (clientId, token) => {
    try {
      const response = await axios.get(
        `http://localhost:3001/mqt/data?clientId=${clientId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );
      console.log(response.data.data)
      return response.data.data;
    } catch (error) {
      console.error(`Error fetching MQTT data for clientId ${clientId}:`, error);
      return null;
    }
  };
  const fetchAllMqttData = async (clientIds, token) => {
    const results = {};
    for (const id of clientIds) {
      const data = await fetchMqttDataForClient(id, token);
      if (data) results[id] = data;
    }
    setMqttDataList(results);
  };

  // Toggle device on/off
  const toggleDevice = async (clientId, currentState) => {
    try {
      const newState = currentState === 'on' ? 'off' : 'on';
      await axios.post(
        'http://localhost:3001/mqt/toggle',
        { clientId, state: newState },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          withCredentials: true,
        }
      );

      // Update local state so UI reflects change immediately
      setMqttDataList((prev) => ({
        ...prev,
        [clientId]: {
          ...prev[clientId],
          data: {
            ...prev[clientId]?.data,
            power: newState,
          },
        },
      }));
    } catch (error) {
      console.error('Error toggling device:', error);
    }
  };

  useEffect(() => {
    if (!accessToken) return;
    fetchUserData(accessToken);
  }, [accessToken]);

  useEffect(() => {
    if (
      userData &&
      userData.user &&
      userData.user.devices &&
      userData.user.devices.length > 0
    ) {
      const clientIds = userData.user.devices.map((device) => device.clientId);
      fetchAllMqttData(clientIds, accessToken);
    }
  }, [userData, accessToken]);

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        overflowY: 'auto',
        padding: '2rem',
        boxSizing: 'border-box',
      }}
    >
      <h1>User Devices & Latest MQTT Data</h1>
      {!userData && <p>Loading user data...</p>}
      {userData && userData.user.devices.length === 0 && <p>No devices found</p>}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 300px))',
          gap: '15px',
          marginTop: '20px',
        }}
      >
{userData &&
  userData.user.devices.map((device) => {
    const deviceData = mqttDataList[device.clientId];
    const powerState = deviceData?.status?.power || 'off';
    const temp = deviceData?.sensor?.data?.Temperature ?? 0;

    let status = '';
    if (temp > 26) status = 'Hot';
    else if (temp >= 16 && temp <= 26) status = 'Normal';
    else status = 'Cold';

    return (
      <Card
        key={device._id}
        Icon={() => <span></span>}
        title={device.clientId}
        isChecked={powerState === 'on'}
        onToggle={() => toggleDevice(device.clientId, powerState)}
        status={status}
      >
        {deviceData ? (
          <div style={{ marginTop: '10px' }}>
            {deviceData.sensor?.data && (
              <div style={{ marginLeft: '1rem' }}>
                {Object.entries(deviceData.sensor.data)
                  .filter(([key]) => !['_id', '__v', 'Id'].includes(key))
                  .map(([key, value]) => (
                    <p key={`${device.clientId}-${key}`}>
                      <strong>{key}:</strong> {value}
                    </p>
                  ))}
              </div>
            )}
            {deviceData.status?.message && (
              <p style={{ marginLeft: '1rem', marginTop: '10px' }}>
                <strong>Status:</strong> {deviceData.status.message}
              </p>
            )}
          </div>
        ) : (
          <p>Loading data for {device.clientId}...</p>
        )}
      </Card>
    );
  })}

      </div>
    </div>
  );
};

export default Home;
