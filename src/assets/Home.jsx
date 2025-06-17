import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useUser } from '../usercontext';

const Home = () => {
  const { accessToken, refreshToken, setAccessToken, logout } = useUser();
  const [userData, setUserData] = useState(null);
  const [mqttDataList, setMqttDataList] = useState({}); // { clientId: data }

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

  return (
    <div style={{ maxWidth: '700px', margin: 'auto', padding: '1rem' }}>
      <h1>User Devices & Latest MQTT Data</h1>
      {!userData && <p>Loading user data...</p>}

      {userData && userData.user.devices.length === 0 && <p>No devices found</p>}

      {userData &&
        userData.user.devices.map((device) => (
          <div
            key={device._id}
            style={{
              border: '1px solid #ccc',
              padding: '1rem',
              marginBottom: '1rem',
              borderRadius: '8px',
              boxShadow: '2px 2px 8px rgba(0,0,0,0.1)',
            }}
          >
            <h3>{device.clientId}</h3>
            <p>
              <strong>Entity:</strong> {device.clientId}
            </p>
            <p>
              <strong>Category:</strong> {device.category}
            </p>
            <p>
              <strong>Type:</strong> {device.type}
            </p>
    <h4>Latest Data:</h4>
{mqttDataList[device.clientId] ? (
  <div style={{
    border: '1px solid #ccc',
    padding: '12px',
    marginTop: '10px',
    borderRadius: '8px',
    backgroundColor: '#fafafa',
    maxWidth: '400px'
  }}>
    <h4>Latest Data:</h4>
    <p><strong>_id:</strong> {mqttDataList[device.clientId]._id}</p>
    <p><strong>ClientId:</strong> {mqttDataList[device.clientId].clientId}</p>
    <p><strong>Entity:</strong> {mqttDataList[device.clientId].entity}</p>

    <div>
      <strong>Data:</strong>
      <ul style={{ marginLeft: '20px' }}>
        {Object.entries(mqttDataList[device.clientId].data).map(([key, value]) => (
          <li key={key}>
            <strong>{key}:</strong> {value.toString()}
          </li>
        ))}
      </ul>
    </div>

    <p><strong>Timestamp:</strong> {new Date(mqttDataList[device.clientId].timestamp).toLocaleString()}</p>
    <p><strong>__v:</strong> {mqttDataList[device.clientId].__v}</p>
  </div>
) : (
  <p>Loading data...</p>
)}


          </div>
        ))}
    </div>
  );
};

export default Home;
