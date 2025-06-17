import React, { useEffect, useState } from 'react';
import axios from 'axios';

const Home = () => {
  const [devices, setDevices] = useState([]);
  const [accessToken, setAccessToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);

  // Simulate login to get tokens (you may replace this with your real login)
  const loginUser = async (email, password) => {
    try {
      const response = await axios.post(
        'http://localhost:3001/users/login',
        { email, password },
        { withCredentials: true }
      );

      const newAccessToken = response.data.accessToken || response.headers['x-access-token'];
      const newRefreshToken = response.headers['x-refresh-token'];

      console.log('🟢 Login successful');
      console.log('Access token:', newAccessToken);
      console.log('Refresh token:', newRefreshToken);

      setAccessToken(newAccessToken);
      setRefreshToken(newRefreshToken);
    } catch (error) {
      console.error('❌ Login failed:', error);
    }
  };

  // Call this function to refresh access token using refresh token from header
  const refreshAccessToken = async () => {
    try {
      console.log('🔄 Refreshing access token...');
      const response = await axios.post(
        'http://localhost:3001/users/refresh',
        {},
        {
          headers: {
            'x-refresh-token': refreshToken,
          },
          withCredentials: true,
        }
      );

      const newAccessToken = response.data.accessToken || response.headers['x-access-token'];
      console.log('🆕 New access token:', newAccessToken);

      if (!newAccessToken) {
        console.error('❌ No access token received on refresh');
        return null;
      }

      setAccessToken(newAccessToken);
      return newAccessToken;
    } catch (error) {
      console.error('❌ Error refreshing token:', error);
      return null;
    }
  };

  const fetchTemperatureDevices = async () => {
    try {
      let token = accessToken;

      if (!token) {
        console.log('⚠️ No access token available, trying to refresh...');
        token = await refreshAccessToken();
        if (!token) {
          console.error('❌ No token available, cannot fetch devices');
          return;
        }
      }

      console.log('📡 Fetching temperature devices with token:', token);
      const response = await axios.get('http://localhost:3001/users/getuser', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setDevices(response.data);
      console.log('✅ Devices fetched:', response.data);
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('⚠️ Access token expired, refreshing...');
        const newToken = await refreshAccessToken();
        if (newToken) {
          await fetchTemperatureDevices(); // retry with new token
        } else {
          console.error('❌ Unable to refresh token');
        }
      } else {
        console.error('❌ Error fetching devices:', error);
      }
    }
  };

  // On mount, simulate login then fetch devices
  useEffect(() => {
    // Replace with actual login credentials
    loginUser('test@example.com', 'password123').then(() => {
      fetchTemperatureDevices();
    });
  }, []);

  return (
    <div>
      <h1>Temperature Devices</h1>
      {devices.length === 0 ? (
        <p>No temperature devices found.</p>
      ) : (
        <ul>
          {devices.map((device) => (
            <li key={device.id}>
              {device.name} - {device.temperature}°C
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Home;
