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
      const newAccessToken = response.data.accessToken || response.headers['x-access-token'];
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
      return response.data.data;
    } catch (error) {
      console.error(`Error fetching MQTT data for clientId ${clientId}:`, error);
      return null;
    }
  };

  const fetchAllMqttData = async (clientIds, token) => {
    const results = {};
    await Promise.all(
      clientIds.map(async (id) => {
        const data = await fetchMqttDataForClient(id, token);
        if (data) results[id] = data;
      })
    );
    setMqttDataList(results);
  };

  useEffect(() => {
    if (!accessToken) {
      console.warn('No access token available, user probably not logged in');
      return;
    }
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
  useEffect(() => {
  console.log('MQTT data:', mqttDataList);
}, [mqttDataList]);


  return (
    <div
      style={{
        width: '100%',
        maxWidth: '2000px',
        margin: '1rem auto',
        padding: '2rem',
      }}
    >
      <h1>User Devices & Latest MQTT Data</h1>
      {!userData && <p>Loading user data...</p>}

      {userData && userData.user.devices.length === 0 && <p>No devices found</p>}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
          gap: '20px',
          marginTop: '20px',
        }}
      >
        {userData &&
          userData.user.devices.map((device) => (
            <Card
              key={device._id}
              Icon={() => <span>📟</span>}
              title={device.clientId}
            >
              {mqttDataList[device.clientId] ? (
                <div style={{ marginTop: '10px' }}>
                  <p>🌡️ Temperature: {mqttDataList[device.clientId].data.Temperature} °C</p>
                  <p>💧 Humidity: {mqttDataList[device.clientId].data.Humidity} %</p>
                  <p>❄️ Dew Point: {mqttDataList[device.clientId].data.DewPoint} °C</p>
                </div>
              ) : (
                <p>Loading data...</p>
              )}
            </Card>
          ))}
      </div>
    </div>
  );
};

export default Home;
