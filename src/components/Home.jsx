import React, { useState, useEffect, useCallback, useRef } from 'react';
import axiosInstance from '../axiosInstance';
import { useUser } from '../UserContext';
import Card from './Card';
import { useNavigate } from 'react-router-dom';
import '../CSS/Home.css';

const Home = () => {
  const { logout } = useUser();
  const [userData, setUserData] = useState(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [mqttDataList, setMqttDataList] = useState({});
  const [localSwitchStates, setLocalSwitchStates] = useState({});
  const [automationDevice, setAutomationDevice] = useState(null);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [currentRuleId, setCurrentRuleId] = useState('');
  const isMounted = useRef(true);
  const navigate = useNavigate();

  const fetchUserData = useCallback(async () => {
    try {
      const { data } = await axiosInstance.get('/device/getDevices');
      console.log('[DEBUG] User devices fetched:', data);

      if (isMounted.current) setUserData(data);

      if (data?.devices?.length > 0) {
        const devices = data.devices;

        const results = await Promise.all(
          devices.map(async (device) => {
            try {
              const mqttRes = await axiosInstance.post('/mqtt/data', {
                clientId: device.clientId,
                entity: device.entity || '',
              });

              return {
                clientId: device.clientId,
                mqttData: mqttRes.data,
                device,
              };
            } catch (err) {
              return null;
            }
          })
        );

        if (isMounted.current) {
          const dataMap = {};
          const switchMap = {};
          results.forEach((res) => {
            if (res) {
              dataMap[res.clientId] = res.mqttData.data || {};
              const power = res.mqttData.data?.status?.power || '';
              const powerOn = power.toLowerCase() === 'on';
              switchMap[res.clientId] = powerOn;
            }
          });
          setMqttDataList(dataMap);
          setLocalSwitchStates(switchMap);
        }
      } else {
        setMqttDataList({});
        setLocalSwitchStates({});
      }
    } catch (error) {
      logout();
      navigate('/login');
    }
  }, [logout, navigate]);

  const toggleDevice = useCallback(
    async (clientId, currentState, entity) => {
      const normalizedState = currentState.toLowerCase();
      const newState = normalizedState === 'on' ? 'off' : 'on';
      const newChecked = newState === 'on';

      setLocalSwitchStates((prev) => ({
        ...prev,
        [clientId]: newChecked,
      }));

      try {
        await axiosInstance.post('/mqtt/toggle', {
          clientId,
          entity: entity || '',
          state: newState,
        });

        setTimeout(async () => {
          const mqttRes = await axiosInstance.post('/mqtt/data', {
            clientId,
            entity: entity || '',
          });

          const actualPower = (mqttRes.data.data?.status?.power || '').toLowerCase();

          if (isMounted.current) {
            setMqttDataList((prev) => ({
              ...prev,
              [clientId]: mqttRes.data.data || {},
            }));

            setLocalSwitchStates((prev) => ({
              ...prev,
              [clientId]: actualPower === 'on',
            }));
          }
        }, 3000);
      } catch (error) {
        console.error('Error toggling device:', error);
      }
    },
    []
  );

  const openAutomationModal = useCallback(async (device) => {
    try {
      const res = await axiosInstance.get('/mqtt/getRule', {
        params: {
          clientId: device.clientId,
          entity: device.entity || '',
        },
      });

      const rules = res.data.rules || [];
      const firstRule = rules.length > 0 ? rules[0] : null;

      setStartTime(firstRule?.onTime || '');
      setEndTime(firstRule?.offTime || '');
      setCurrentRuleId(firstRule?._id || '');
    } catch (error) {
      console.error('Error fetching automation rule:', error);
      setStartTime('');
      setEndTime('');
      setCurrentRuleId('');
    }
    setAutomationDevice(device);
  }, []);

  const handleAutomationSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      if (!automationDevice) return alert('No device selected');

      try {
        if (currentRuleId) {
          await axiosInstance.put('/mqtt/update', {
            ruleId: currentRuleId,
            onTime: startTime,
            offTime: endTime,
            timezone: 'Asia/Ulaanbaatar',
          });
        } else {
          await axiosInstance.post('/mqtt/automation', {
            clientId: automationDevice.clientId,
            entity: automationDevice.entity || '',
            onTime: startTime,
            offTime: endTime,
            timezone: 'Asia/Ulaanbaatar',
          });
        }

        alert('Automation settings saved successfully!');
        setAutomationDevice(null);
        setCurrentRuleId('');
      } catch (error) {
        console.error('Error setting automation:', error);
        alert('Failed to save automation settings.');
      }
    },
    [automationDevice, startTime, endTime, currentRuleId]
  );

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    const loadSessionAndUser = async () => {
      await fetchUserData();

      // 🔍 Log /getuser result here
      try {
        const res = await axiosInstance.get('users/getuser');
        console.log('[DEBUG] /getuser response:', res.data);
      } catch (err) {
        console.error('[ERROR] Failed to fetch /getuser:', err);
      }

      setLoadingSession(false);
    };
    loadSessionAndUser();
  }, [fetchUserData]);

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
        {userData && (!userData.devices || userData.devices.length === 0) && (
          <p>No registered devices found</p>
        )}
        <div className="deviceGrid">
          {userData?.devices?.map((device) => {
            const deviceData = mqttDataList[device.clientId];
            const powerState = (deviceData?.status?.power || 'off').toLowerCase();
            const temp = deviceData?.sensor?.data?.Temperature ?? 0;
            const status = getTempStatus(temp);

            console.log(`[DEBUG] Rendering device ${device.clientId}: powerState=${powerState.toUpperCase()}, temp=${temp}, status=${status}`);

            return (
              <Card
                key={device._id || device.clientId}
                Icon={() => <span />}
                title={device.clientId}
                isChecked={localSwitchStates[device.clientId] ?? false}
                onToggle={() => toggleDevice(device.clientId, powerState, device.entity)}
                status={status}
                onAutomationClick={() => openAutomationModal(device)}
              >
                {deviceData ? (
                  <div className="sensorData">
                    {deviceData.sensor?.data && (
                      <div>
                        {Object.entries(deviceData.sensor.data)
                          .filter(
                            ([key]) =>
                              !['_id', '__v', 'Id'].includes(key) &&
                              !(typeof deviceData.sensor.data[key] === 'string' &&
                                deviceData.sensor.data[key].startsWith('Power status from stat/POWER'))
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
                <label htmlFor="startTime" style={{ marginRight: 8 }}>
                  Start Time:
                </label>
                <input
                  id="startTime"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label htmlFor="endTime" style={{ marginRight: 8 }}>
                  End Time:
                </label>
                <input
                  id="endTime"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  required
                />
              </div>
              <button type="submit">Save Automation</button>
              <button
                type="button"
                onClick={() => {
                  setAutomationDevice(null);
                  setCurrentRuleId('');
                }}
                style={{ marginLeft: 10 }}
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
