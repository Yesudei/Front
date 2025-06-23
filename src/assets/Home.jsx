import React, { useState, useEffect, useCallback, useRef } from 'react';
import axiosInstance from '../axiosInstance'; // use your axiosInstance here
import { useUser } from '../UserContext';
import Card from './Card';
import { useNavigate } from 'react-router-dom';
import '../CSS/Home.css';

const Home = () => {
  const { logout } = useUser();
  const [userData, setUserData] = useState(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [mqttDataList, setMqttDataList] = useState({});
  const [automationDevice, setAutomationDevice] = useState(null);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const isMounted = useRef(true);
  const navigate = useNavigate();

  // Fetch user data with axiosInstance (interceptor handles tokens)
  const fetchUserData = useCallback(async () => {
    try {
      const data = await axiosInstance.get('/users/getuser');
      if (isMounted.current) setUserData(data.data || data);
    } catch (error) {
      console.error('Error fetching user data:', error);
      logout();
      navigate('/login');
    }
  }, [logout, navigate]);

  // Fetch MQTT data & automation rule for one clientId
  const fetchMqttDataForClient = useCallback(async (clientId) => {
    try {
      const [mqttRes, ruleRes] = await Promise.all([
        axiosInstance.get(`/mqtt/data?clientId=${encodeURIComponent(clientId)}`),
        axiosInstance.get(`/mqtt/getRule/${clientId}`),
      ]);
      return {
        ...mqttRes.data,
        automationRule: ruleRes.data,
      };
    } catch (error) {
      console.error(`Error fetching data for clientId ${clientId}:`, error);
      return null;
    }
  }, []);

  // Fetch MQTT data for all devices
  const fetchAllMqttData = useCallback(async (clientIds) => {
    try {
      const results = await Promise.all(clientIds.map((id) => fetchMqttDataForClient(id)));
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

  // Toggle device power on/off
  const toggleDevice = useCallback(async (clientId, currentState) => {
    const newState = currentState === 'on' ? 'off' : 'on';

    // Optimistic UI update
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
      await axiosInstance.post(
        '/mqtt/toggle',
        { clientId, state: newState }
      );

      const freshData = await fetchMqttDataForClient(clientId);
      if (freshData && isMounted.current) {
        setMqttDataList((prev) => ({
          ...prev,
          [clientId]: freshData,
        }));
      }
    } catch (error) {
      console.error('Error toggling device:', error);
      // Revert UI on error
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
  }, [fetchMqttDataForClient]);

  // Handle saving automation rules
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

      await axiosInstance.post(`/mqtt/automation/${automationDevice.clientId}`, payload);

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
    const loadSessionAndUser = async () => {
      await fetchUserData();
      setLoadingSession(false);
    };
    loadSessionAndUser();
  }, [fetchUserData]);

  useEffect(() => {
    if (userData?.user?.devices?.length > 0) {
      const clientIds = userData.user.devices.map((d) => d.clientId);
      fetchAllMqttData(clientIds);

      const intervalId = setInterval(() => {
        fetchAllMqttData(clientIds);
      }, 10000);

      return () => clearInterval(intervalId);
    } else {
      setMqttDataList({});
    }
  }, [userData, fetchAllMqttData]);

  const getTempStatus = (temp) => {
    if (temp > 26) return 'Hot';
    if (temp >= 16) return 'Normal';
    return 'Cold';
  };

  if (loadingSession) {
    return <div>Loading user session...</div>;
  }

  return (
    <div className="home-layout">
      <div className="main-content">
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
                  const rule = await axiosInstance.get(`/mqtt/getRule/${device.clientId}`).then(res => res.data).catch(() => null);
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
                    {deviceData.status?.message?.startsWith('LWT:') && (
                      <p className="lwtStatus">🔗 {deviceData.status.message.slice(4).trim()}</p>
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

      {automationDevice && (
        <div className="automationOverlay">
          <div className="automationModal">
            <h2>Automation Settings for {automationDevice.clientId}</h2>
            <form onSubmit={handleAutomationSubmit}>
              <div style={{ marginBottom: '1rem' }}>
                <label htmlFor="startTime" style={{ marginRight: 8 }}>Start Time:</label>
                <input
                  id="startTime"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label htmlFor="endTime" style={{ marginRight: 8 }}>End Time:</label>
                <input
                  id="endTime"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  required
                />
              </div>
              <button type="submit">Save Automation</button>
              <button type="button" onClick={() => setAutomationDevice(null)} style={{ marginLeft: 10 }}>
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
