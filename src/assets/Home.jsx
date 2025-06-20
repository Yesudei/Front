import React, { useEffect, useState, useCallback, useRef } from 'react';
import axios from 'axios';
import { useUser } from '../UserContext';
import Card from './Card';
import { useNavigate } from 'react-router-dom';
import './Home.css';

const API_BASE_URL = 'http://localhost:3001';

const Home = () => {
  const { accessToken, refreshToken, setAccessToken, logout } = useUser();
  const [userData, setUserData] = useState(null);
  const [mqttDataList, setMqttDataList] = useState({});
  const [automationDevice, setAutomationDevice] = useState(null);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const isMounted = useRef(true);
  const refreshingToken = useRef(false);
  const refreshSubscribers = useRef([]);
  const navigate = useNavigate();

  const onAccessTokenRefreshed = useCallback((newToken) => {
    refreshSubscribers.current.forEach((callback) => callback(newToken));
    refreshSubscribers.current = [];
  }, []);

  const addRefreshSubscriber = useCallback((callback) => {
    refreshSubscribers.current.push(callback);
  }, []);

  const refreshAccessToken = useCallback(async () => {
    if (refreshingToken.current) {
      return new Promise((resolve) => {
        addRefreshSubscriber(resolve);
      });
    }

    refreshingToken.current = true;
    try {
      const response = await axios.post(
        `${API_BASE_URL}/users/refresh`,
        {},
        {
          headers: { 'x-refresh-token': refreshToken },
          withCredentials: true,
        }
      );

      const newAccessToken = response.data.accessToken || response.headers['x-access-token'];
      if (!newAccessToken) throw new Error('No access token returned');

      setAccessToken(newAccessToken);
      onAccessTokenRefreshed(newAccessToken);
      return newAccessToken;
    } catch (error) {
      console.error('Error refreshing token:', error);
      logout();
      return null;
    } finally {
      refreshingToken.current = false;
    }
  }, [refreshToken, setAccessToken, logout, addRefreshSubscriber, onAccessTokenRefreshed]);

  const axiosGetWithAuth = useCallback(
    async (url, token) => {
      try {
        const response = await axios.get(url, {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        });
        return response.data;
      } catch (error) {
        if (error.response?.status === 401) {
          const newToken = await refreshAccessToken();
          if (newToken) {
            const retryResponse = await axios.get(url, {
              headers: { Authorization: `Bearer ${newToken}` },
              withCredentials: true,
            });
            return retryResponse.data;
          }
        }
        throw error;
      }
    },
    [refreshAccessToken]
  );

  const fetchUserData = useCallback(async (token) => {
    try {
      const data = await axiosGetWithAuth(`${API_BASE_URL}/users/getuser`, token);
      if (isMounted.current) setUserData(data);
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  }, [axiosGetWithAuth]);

  const fetchAutomationRule = useCallback(async (clientId) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/mqt/getRule/${clientId}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching automation rule:', error);
      return null;
    }
  }, [accessToken]);

  const fetchMqttDataForClient = useCallback(async (clientId, token) => {
    try {
      const [mqttRes, ruleRes] = await Promise.all([
        axiosGetWithAuth(`${API_BASE_URL}/mqt/data?clientId=${encodeURIComponent(clientId)}`, token),
        axiosGetWithAuth(`${API_BASE_URL}/mqt/getRule/${clientId}`, token),
      ]);
      console.log(mqttRes)
      return {
       
        ...mqttRes.data,
        automationRule: ruleRes,
      };
    } catch (error) {
      console.error(`Error fetching data for clientId ${clientId}:`, error);
      return null;
    }
  }, [axiosGetWithAuth]);

  const fetchAllMqttData = useCallback(async (clientIds, token) => {
    try {
      const results = await Promise.all(
        clientIds.map((id) => fetchMqttDataForClient(id, token))
      );

      if (!isMounted.current) return;

      const dataMap = {};
      clientIds.forEach((id, idx) => {
        if (results[idx]) dataMap[id] = results[idx];
      });
      setMqttDataList(dataMap);
    } catch (error) {
      console.error('Error fetching all MQTT data:', error);
    }
  }, [fetchMqttDataForClient]);

  const toggleDevice = useCallback(async (clientId, currentState) => {
    const newState = currentState === 'on' ? 'off' : 'on';

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
        `${API_BASE_URL}/mqt/toggle`,
        { clientId, state: newState },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          withCredentials: true,
        }
      );

      const freshData = await fetchMqttDataForClient(clientId, accessToken);
      if (freshData && isMounted.current) {
        setMqttDataList((prev) => ({
          ...prev,
          [clientId]: freshData,
        }));
      }
    } catch (error) {
      console.error('Error toggling device:', error);
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
  }, [accessToken, fetchMqttDataForClient]);

  const handleAutomationSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!automationDevice) return alert('No device selected');

    try {
      const payload = {
        topic: `cmnd/${automationDevice.clientId}/POWER`,
        onTime: startTime,
        offTime: endTime,
        timezone: 'Asia/Ulaanbaatar',
      };

      await axios.post(
        `${API_BASE_URL}/mqt/automation/${automationDevice.clientId}`,
        payload,
        { withCredentials: true }
      );

      alert('Automation settings saved successfully!');
      setAutomationDevice(null);
    } catch (error) {
      console.error('Error setting automation:', error);
      alert('Failed to save automation settings.');
    }
  }, [automationDevice, startTime, endTime]);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (accessToken) {
      fetchUserData(accessToken);
    } else {
      setUserData(null);
    }
  }, [accessToken, fetchUserData]);

  useEffect(() => {
    if (userData?.user?.devices?.length > 0 && accessToken) {
      const clientIds = userData.user.devices.map((d) => d.clientId);
      fetchAllMqttData(clientIds, accessToken);

      const intervalId = setInterval(() => {
        fetchAllMqttData(clientIds, accessToken);
      }, 10000);

      return () => clearInterval(intervalId);
    } else {
      setMqttDataList({});
    }
  }, [userData, accessToken, fetchAllMqttData]);

  const getTempStatus = (temp) => {
    if (temp > 26) return 'Hot';
    if (temp >= 16) return 'Normal';
    return 'Cold';
  };

  return (
    <div className="container">
      <h1>User Devices & Latest MQTT Data</h1>

      {!userData && <p>Loading user data...</p>}
      {userData && userData.user.devices.length === 0 && <p>No devices found</p>}

      <div className="deviceGrid">
        {userData?.user?.devices.map((device) => {
          const deviceData = mqttDataList[device.clientId];
          const powerState = deviceData?.status?.power ?? 'off';
          const temp = deviceData?.sensor?.data?.Temperature ?? 0;
          const status = getTempStatus(temp);

          return (
            <Card
              key={device._id}
              Icon={() => <span />}
              title={device.clientId}
              isChecked={powerState === 'on'}
              onToggle={() => toggleDevice(device.clientId, powerState)}
              status={status}
              onAutomationClick={async () => {
                const rule = await fetchAutomationRule(device.clientId);
                if (rule) {
                  setStartTime(rule.onTime || '');
                  setEndTime(rule.offTime || '');
                } else {
                  setStartTime('');
                  setEndTime('');
                }
                setAutomationDevice(device);
              }}
            >
              {deviceData ? (
                <div className="sensorData">
                  {deviceData.sensor?.data && (
                    <div>
                      {Object.entries(deviceData.sensor.data)
                      .filter(
                          ([key, value]) =>
                            !['_id', '__v', 'Id'].includes(key) &&
                            !(typeof value === 'string' && value.startsWith('Power status from stat/POWER'))
                        )
                        .map(([key, value]) => {
                          const labelIcons = {
                            Temperature: '🌡️',
                            Humidity: '💧',
                            DewPoint: '❄️',
                          };
                          return (
                            <p key={`${device.clientId}-${key}`}>
                              <strong>{labelIcons[key] || key}:</strong> {value}
                            </p>
                          );
                        })}
                    </div>
                  )}
                  {deviceData.automationRule && (
                    <p className="automationInfo">
                      ⚙️ <strong>Automation:</strong>{' '}
                      <span style={{ color: deviceData.automationRule ? 'limegreen' : 'red' }}>
                        {deviceData.automationRule ? 'ON' : 'OFF'}
                      </span>
                    </p>
                  )}
                      {deviceData.status?.message && deviceData.status.message.startsWith('LWT:') && (
                        <p className="lwtStatus">
                          🔗 {deviceData.status.message.slice(4).trim()}
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
          role="dialog"
          aria-modal="true"
          aria-labelledby="automation-title"
        >
          <div className="automationModal" onClick={(e) => e.stopPropagation()}>
            <h2 id="automation-title">Set Automation for {automationDevice.clientId}</h2>
            <form onSubmit={handleAutomationSubmit}>
              <label htmlFor="start-time">Start Time:</label>
              <input
                id="start-time"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
              <br />
              <label htmlFor="end-time">End Time:</label>
              <input
                id="end-time"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
              />
              <br />
              <br />
              <button type="submit">Set Automation</button>
              <button type="button" onClick={() => setAutomationDevice(null)}>
                Cancel
              </button>
              <button
                type="button"
                className="viewTimersBtn"
                onClick={() => {
                  setAutomationDevice(null);
                  navigate(`/Automation/${automationDevice.clientId}`);
                }}
              >
                View All Timers
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
