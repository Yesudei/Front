import React, { useEffect, useState, useCallback, useRef } from 'react';
import axiosInstance from '../axiosInstance';
import { useUser } from '../UserContext';
import '../CSS/automation.css';

const Automation = () => {
  const { accessToken, logout, refreshToken, setAccessToken } = useUser();

  const [devices, setDevices] = useState([]);
  const [deviceRules, setDeviceRules] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [editingRule, setEditingRule] = useState(null);
  const [editForm, setEditForm] = useState({ onTime: '', offTime: '', timezone: '' });

  const [addingForDevice, setAddingForDevice] = useState(null);
  const [addForm, setAddForm] = useState({ onTime: '', offTime: '', timezone: 'Asia/Ulaanbaatar' });

  // To prevent state update on unmounted component
  const isMounted = useRef(true);

  // Fetch devices from /device/getDevices
  const fetchDevices = useCallback(async () => {
    console.log('[fetchDevices] Start fetching devices');
    try {
      const res = await axiosInstance.get('/device/getDevices', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      console.log('[fetchDevices] Response:', res.data);
      if (isMounted.current) {
        if (res.data.devices && Array.isArray(res.data.devices)) {
          setDevices(res.data.devices);
        } else {
          setDevices([]);
          console.warn('[fetchDevices] No devices array found in response');
        }
      }
    } catch (err) {
      console.error('[fetchDevices] Error fetching devices:', err);
      if (err.response?.status === 401 && refreshToken) {
        // Try refreshing token
        try {
          console.log('[fetchDevices] Trying to refresh token');
          const refreshRes = await axiosInstance.post('/users/refresh', {});
          const newToken = refreshRes.data.accessToken || refreshRes.headers['x-access-token'];
          if (newToken) {
            setAccessToken(newToken);
            console.log('[fetchDevices] Token refreshed, retry fetchDevices');
            await fetchDevices();
          } else {
            logout();
          }
        } catch {
          logout();
        }
      } else {
        setError('Failed to fetch devices');
      }
    }
  }, [accessToken, logout, refreshToken, setAccessToken]);

  // Fetch rules for devices
  const fetchRulesForDevices = useCallback(async (devicesToFetch) => {
    console.log('[fetchRulesForDevices] Fetching rules for devices:', devicesToFetch.map(d => d.clientId));
    setLoading(true);
    setError(null);

    const rulesMap = {};
    for (const device of devicesToFetch) {
      try {
        // Note: Your Swagger said POST with { deviceId } in body
        const res = await axiosInstance.post('/mqtt/getRule', {
          deviceId: device._id,
        });
        console.log(`[fetchRulesForDevices] Rules for device ${device.clientId}:`, res.data);
        rulesMap[device.clientId] =
          res.data.rules && Array.isArray(res.data.rules.rules) ? res.data.rules.rules : [];
      } catch (err) {
        console.error(`[fetchRulesForDevices] Error fetching rules for device ${device.clientId}:`, err);
        rulesMap[device.clientId] = [];
      }
    }
    if (isMounted.current) {
      setDeviceRules(rulesMap);
      setLoading(false);
    }
  }, []);

  // On mount: fetch devices, then fetch their rules
  useEffect(() => {
    isMounted.current = true;

    if (!accessToken) {
      console.log('[useEffect] No access token, skipping fetch');
      return;
    }

    const load = async () => {
      await fetchDevices();
    };

    load();

    return () => {
      isMounted.current = false;
    };
  }, [accessToken, fetchDevices]);

  // When devices update, fetch their rules
  useEffect(() => {
    if (devices.length === 0) {
      console.log('[useEffect] No devices available, skipping fetchRulesForDevices');
      setDeviceRules({});
      return;
    }
    fetchRulesForDevices(devices);
  }, [devices, fetchRulesForDevices]);

  // Delete rule handler
  const handleDelete = async (deviceClientId, ruleId) => {
    if (!window.confirm('Are you sure you want to delete this timer?')) return;
    try {
      console.log('[handleDelete] Deleting rule:', ruleId);
      await axiosInstance.delete('/mqtt/delete', { data: { ruleId } });
      setDeviceRules((prev) => ({
        ...prev,
        [deviceClientId]: prev[deviceClientId].filter((rule) => rule._id !== ruleId),
      }));
      console.log('[handleDelete] Rule deleted successfully');
    } catch (err) {
      console.error('[handleDelete] Failed to delete rule:', err);
      alert('Failed to delete rule');
    }
  };

  // Edit handlers
  const handleEdit = (deviceClientId, rule) => {
    setEditingRule({ deviceClientId, ruleId: rule._id });
    setEditForm({
      onTime: rule.onTime || '',
      offTime: rule.offTime || '',
      timezone: rule.timezone || '',
    });
  };

  const handleChange = (e) => {
    setEditForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    if (!editingRule) return;

    try {
      console.log('[handleUpdateSubmit] Updating rule:', editingRule.ruleId, editForm);
      await axiosInstance.put('/mqtt/update', {
        ruleId: editingRule.ruleId,
        onTime: editForm.onTime,
        offTime: editForm.offTime,
        timezone: editForm.timezone,
      });
      setDeviceRules((prev) => {
        const updatedRules = prev[editingRule.deviceClientId].map((rule) =>
          rule._id === editingRule.ruleId ? { ...rule, ...editForm } : rule
        );
        return { ...prev, [editingRule.deviceClientId]: updatedRules };
      });
      setEditingRule(null);
      console.log('[handleUpdateSubmit] Rule updated');
    } catch (err) {
      console.error('[handleUpdateSubmit] Failed to update rule:', err);
      alert('Failed to update rule');
    }
  };

  const handleCancelEdit = () => setEditingRule(null);

  // Add new rule handlers
  const handleAddClick = (device) => {
    setAddingForDevice({ _id: device._id, clientId: device.clientId });
    setAddForm({ onTime: '', offTime: '', timezone: 'Asia/Ulaanbaatar' });
  };

  const handleAddChange = (e) => {
    setAddForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!addingForDevice) return;

    try {
      const topic = `cmnd/${addingForDevice.clientId}/POWER`;
      console.log('[handleAddSubmit] Adding rule:', { deviceId: addingForDevice._id, topic, ...addForm });

      await axiosInstance.post('/mqtt/automation', {
        deviceId: addingForDevice._id,
        topic,
        onTime: addForm.onTime,
        offTime: addForm.offTime,
        timezone: addForm.timezone,
      });

      // Refetch rules after adding new rule
      const res = await axiosInstance.post('/mqtt/getRule', {
        deviceId: addingForDevice._id,
      });
      const rulesArray =
        res.data.rules && Array.isArray(res.data.rules.rules) ? res.data.rules.rules : [];

      setDeviceRules((prev) => ({
        ...prev,
        [addingForDevice.clientId]: rulesArray,
      }));

      setAddingForDevice(null);
      console.log('[handleAddSubmit] Rule added and rules refreshed');
    } catch (err) {
      console.error('[handleAddSubmit] Failed to add rule:', err);
      alert('Failed to add rule');
    }
  };

  const handleCancelAdd = () => setAddingForDevice(null);

  const hasRules = Object.values(deviceRules).some((rules) => rules.length > 0);

  if (!accessToken) return <p>Please login to see automation timers.</p>;
  if (loading) return <p>Loading automation timers...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;

  return (
    <div className="automation-container">
      <h1>Automation Timers</h1>
      {devices.length === 0 && <p>No devices found.</p>}
      {!hasRules && devices.length > 0 && <p>No automation timers found.</p>}

      {devices.map((device) => {
        const rules = deviceRules[device.clientId] || [];
        return (
          <div key={device.clientId} className="device-box">
            <h2>Device: {device.clientId}</h2>

            {addingForDevice?.clientId === device.clientId ? (
              <form className="rule-card edit-form" onSubmit={handleAddSubmit}>
                <p>
                  <strong>Topic:</strong> {`cmnd/${device.clientId}/POWER`}
                </p>
                <label>
                  On Time:
                  <input
                    type="time"
                    name="onTime"
                    value={addForm.onTime}
                    onChange={handleAddChange}
                    required
                  />
                </label>
                <label>
                  Off Time:
                  <input
                    type="time"
                    name="offTime"
                    value={addForm.offTime}
                    onChange={handleAddChange}
                    required
                  />
                </label>
                <label>
                  Timezone:
                  <input
                    type="text"
                    name="timezone"
                    value={addForm.timezone}
                    onChange={handleAddChange}
                    required
                  />
                </label>
                <div className="btn-group">
                  <button type="submit" className="edit-btn">
                    Add
                  </button>
                  <button type="button" onClick={handleCancelAdd} className="delete-btn">
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <button className="add-btn" onClick={() => handleAddClick(device)}>
                ➕ Add Timer
              </button>
            )}

            {rules.length === 0 && <p>No timers for this device.</p>}

            {rules.map((rule) =>
              editingRule?.ruleId === rule._id ? (
                <form key={rule._id} className="rule-card edit-form" onSubmit={handleUpdateSubmit}>
                  <p>
                    <strong>Topic:</strong> {rule.topic}
                  </p>
                  <label>
                    On Time:
                    <input
                      type="time"
                      name="onTime"
                      value={editForm.onTime}
                      onChange={handleChange}
                      required
                    />
                  </label>
                  <label>
                    Off Time:
                    <input
                      type="time"
                      name="offTime"
                      value={editForm.offTime}
                      onChange={handleChange}
                      required
                    />
                  </label>
                  <label>
                    Timezone:
                    <input
                      type="text"
                      name="timezone"
                      value={editForm.timezone}
                      onChange={handleChange}
                      required
                    />
                  </label>
                  <div className="btn-group">
                    <button type="submit" className="edit-btn">
                      Save
                    </button>
                    <button type="button" onClick={handleCancelEdit} className="delete-btn">
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div key={rule._id} className="rule-card">
                  <p>
                    <strong>Topic:</strong> {rule.topic}
                  </p>
                  <p>
                    <strong>On Time:</strong> {rule.onTime}
                  </p>
                  <p>
                    <strong>Off Time:</strong> {rule.offTime}
                  </p>
                  <p>
                    <strong>Timezone:</strong> {rule.timezone}
                  </p>
                  <div className="btn-group">
                    <button className="edit-btn" onClick={() => handleEdit(device.clientId, rule)}>
                      ✏️ Edit
                    </button>
                    <button
                      className="delete-btn"
                      onClick={() => handleDelete(device.clientId, rule._id)}
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              )
            )}
          </div>
        );
      })}
    </div>
  );
};

export default Automation;
