import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useUser } from '../UserContext';

const API_BASE_URL = 'http://localhost:3001';

const Automation = () => {
  const { accessToken, userData, isLoading } = useUser();
  const [deviceRules, setDeviceRules] = useState({}); // { clientId: [rules] }
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('Automation useEffect triggered', { accessToken, userData, isLoading });

    if (isLoading) return; // wait for user data to load
    if (!accessToken) return;
    if (!userData || !userData.devices) {
      console.log('User data or devices not ready yet');
      return;
    }

    const fetchAllRules = async () => {
      setLoading(true);
      setError(null);

      try {
        const rulesMap = {};
        for (const device of userData.devices) {
          try {
            const res = await axios.get(`${API_BASE_URL}/mqt/getRule/${device.clientId}`, {
              headers: { Authorization: `Bearer ${accessToken}` },
              withCredentials: true,
            });

            const rules = Array.isArray(res.data) ? res.data : [res.data];
            rulesMap[device.clientId] = rules;
          } catch (err) {
            console.error(`Error fetching rules for device ${device.clientId}:`, err.response?.data || err.message);
            rulesMap[device.clientId] = [];
          }
        }
        setDeviceRules(rulesMap);
      } catch (err) {
        console.error('Error fetching all rules:', err);
        setError('Failed to load automation rules');
      } finally {
        setLoading(false);
      }
    };

    fetchAllRules();
  }, [accessToken, userData, isLoading]);

  if (isLoading) return <p>Loading user data...</p>;
  if (loading) return <p>Loading automation timers...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;

  if (!userData) return <p>No user data found.</p>;
  if (!userData.devices || userData.devices.length === 0) return <p>No devices found for user.</p>;

  const hasAnyRules = Object.values(deviceRules).some((rules) => rules.length > 0);
  if (!hasAnyRules) return <p>No automation timers found.</p>;

  return (
    <div style={{ padding: 20 }}>
      <h1>Automation Timers</h1>
      {Object.entries(deviceRules).map(([clientId, rules]) => (
        <div key={clientId} style={{ marginBottom: 40 }}>
          <h2>{clientId}</h2>
          {rules.length === 0 ? (
            <p>No timers for this device.</p>
          ) : (
            rules.map((rule) => (
              <div
                key={rule._id}
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
