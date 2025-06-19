import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useUser } from '../UserContext';
import { useParams } from 'react-router-dom';

const API_BASE_URL = 'http://localhost:3001';

const Automation = () => {
  const { accessToken, userData, setAccessToken, refreshToken, logout } = useUser();
  const { clientId } = useParams();

  const [localUserData, setLocalUserData] = useState(userData);
  const [deviceRules, setDeviceRules] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchUserData = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/users/getuser`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        withCredentials: true,
      });
      setLocalUserData(res.data);
    } catch (err) {
      console.error('Failed to fetch user data:', err);
      if (err.response?.status === 401 && refreshToken) {
        try {
          const refreshRes = await axios.post(
            `${API_BASE_URL}/users/refresh`,
            {},
            {
              headers: { 'x-refresh-token': refreshToken },
              withCredentials: true,
            }
          );
          const newToken = refreshRes.data.accessToken || refreshRes.headers['x-access-token'];
          if (newToken) {
            setAccessToken(newToken);
          } else {
            logout();
          }
        } catch (refreshErr) {
          console.error('Token refresh failed:', refreshErr);
          logout();
        }
      }
    }
  }, [accessToken, refreshToken, setAccessToken, logout]);

  useEffect(() => {
    if (!accessToken) return;
    if (!localUserData?.user?.devices) {
      fetchUserData();
    }
  }, [accessToken, localUserData, fetchUserData]);

  useEffect(() => {
    if (!accessToken || !localUserData?.user?.devices) return;

    const fetchRules = async () => {
      setLoading(true);
      setError(null);
      const rulesMap = {};

      try {
        if (clientId) {
          const device = localUserData.user.devices.find((d) => d.clientId === clientId);
          if (!device) {
            setError(`Device with clientId "${clientId}" not found.`);
            setLoading(false);
            return;
          }

          const res = await axios.get(`${API_BASE_URL}/mqt/getRule/${clientId}`, {
            headers: { Authorization: `Bearer ${accessToken}` },
            withCredentials: true,
          });
          console.log("Rules ", res);

          // FIX: Extract rules array correctly
          const rules = res.data?.rules?.rules || [];
          rulesMap[clientId] = rules;
        } else {
          for (const device of localUserData.user.devices) {
            try {
              const res = await axios.get(`${API_BASE_URL}/mqt/getRule/${device.clientId}`, {
                headers: { Authorization: `Bearer ${accessToken}` },
                withCredentials: true,
              });
              console.log("Rules ", res);

              // FIX: Extract rules array correctly
              const rules = res.data?.rules?.rules || [];
              rulesMap[device.clientId] = rules;
            } catch (err) {
              console.error(`Error fetching rules for ${device.clientId}:`, err);
              rulesMap[device.clientId] = [];
            }
          }
        }

        setDeviceRules(rulesMap);
      } catch (err) {
        console.error('Error fetching rules:', err);
        setError('Failed to fetch automation rules.');
      } finally {
        setLoading(false);
      }
    };

    fetchRules();
  }, [accessToken, localUserData, clientId]);

  if (!localUserData?.user?.devices) return <p>Loading user data...</p>;
  if (loading) return <p>Loading automation timers...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;

  const hasRules = Object.values(deviceRules).some((rules) => rules.length > 0);
  if (!hasRules) return <p>No automation timers found.</p>;

  return (
    <div style={{ padding: 20 }}>
      <h1>Automation Timers</h1>
      {Object.entries(deviceRules).map(([id, rules]) => (
        <div key={id} style={{ marginBottom: 40 }}>
          <h2>{id}</h2>
          {rules.length === 0 ? (
            <p>No timers for this device.</p>
          ) : (
            rules.map((rule, index) => (
              <div
                key={rule._id || `${id}-rule-${index}`}
                style={{
                  border: '1px solid #ccc',
                  padding: 10,
                  marginBottom: 10,
                  borderRadius: 6,
                }}
              >
                <p><strong>On Time:</strong> {rule.onTime}</p>
                <p><strong>Off Time:</strong> {rule.offTime}</p>
                <p><strong>Timezone:</strong> {rule.timezone}</p>
              </div>
            ))
          )}
        </div>
      ))}
    </div>
  );
};

export default Automation;
