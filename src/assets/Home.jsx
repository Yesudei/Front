import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useUser } from '../UserContext';
import Card from './Card';
import './Home.css';

const Home = () => {
  const { accessToken, refreshToken, setAccessToken, logout } = useUser();
  const [userData, setUserData] = useState(null);
  const [mqttDataList, setMqttDataList] = useState({});
  const [automationDevice, setAutomationDevice] = useState(null);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

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
      console.log(response.data.data);
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

  const toggleDevice = async (clientId, currentState) => {
    const newState = currentState === 'on' ? 'off' : 'on';

    // Optimistically update UI
    setMqttDataList((prev) => ({
      ...prev,
      [clientId]: {
        ...prev[clientId],
        status: {
          ...prev[clientId]?.status,
          power: newState,
        },
      },
    }));

    try {
      await axios.post(
        'http://localhost:3001/mqt/toggle',
        { clientId, state: newState },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          withCredentials: true,
        }
      );
    } catch (error) {
      console.error('Error toggling device:', error);
      // Revert UI on failure
      setMqttDataList((prev) => ({
        ...prev,
        [clientId]: {
          ...prev[clientId],
          status: {
            ...prev[clientId]?.status,
            power: currentState,
          },
        },
      }));
    }
  };

  const handleAutomationSubmit = async (e) => {
    e.preventDefault();

    if (!automationDevice) {
      alert('No device selected');
      return;
    }

    try {
      const payload = {
        topic: `cmnd/${automationDevice.clientId}/POWER`,
        onTime: startTime,
        offTime: endTime,
        timezone: 'Asia/Ulaanbaatar',
      };

      await axios.post(
        `http://localhost:3001/mqt/automation/${automationDevice.clientId}`,
        payload,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          withCredentials: true,
        }
      );

      alert('Automation settings saved successfully!');
      setAutomationDevice(null);
    } catch (error) {
      console.error('Error setting automation:', error);
      alert('Failed to save automation settings.');
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
    <div className="container">
      <h1>User Devices & Latest MQTT Data</h1>
      {!userData && <p>Loading user data...</p>}
      {userData && userData.user.devices.length === 0 && <p>No devices found</p>}

      <div className="deviceGrid">
        {userData &&
          userData.user.devices.map((device) => {
            const deviceData = mqttDataList[device.clientId];
            const powerState = deviceData?.status?.power ?? 'off';
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
                onAutomationClick={() => setAutomationDevice(device)}
              >
                {deviceData ? (
                  <div className="sensorData">
                    {deviceData.sensor?.data && (
                      <div>
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
                      <p className="statusText">
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

      {automationDevice && (
        <div
          className="automationOverlay"
          onClick={() => setAutomationDevice(null)}
        >
          <div
            className="automationModal"
            onClick={(e) => e.stopPropagation()}
          >
            <h2>Set Automation for {automationDevice.clientId}</h2>
            <form onSubmit={handleAutomationSubmit}>
              <label>Start Time:</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
              <br />
              <label>End Time:</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
              />
              <br />
              <br />
              <button type="submit">Set Automation</button>
              <button
                type="button"
                onClick={() => setAutomationDevice(null)}
              >
                Cancel
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
