import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useUser } from '../UserContext';
import { useParams } from 'react-router-dom';
import '../CSS/automation.css';

const API_BASE_URL = 'http://localhost:3001';

const Automation = () => {
  const { accessToken, userData, setAccessToken, refreshToken, logout } = useUser();
  const { clientId } = useParams();

  const [localUserData, setLocalUserData] = useState(userData);
  const [deviceRules, setDeviceRules] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // For editing a rule
  const [editingRule, setEditingRule] = useState(null);
  const [editForm, setEditForm] = useState({
    onTime: '',
    offTime: '',
    timezone: '',
  });

  // For adding a new rule
  const [addingForDevice, setAddingForDevice] = useState(null);
  const [addForm, setAddForm] = useState({
    onTime: '',
    offTime: '',
    timezone: '',
  });

  const fetchUserData = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/users/getuser`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        withCredentials: true,
      });
      setLocalUserData(res.data);
    } catch (err) {
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
          if (newToken) setAccessToken(newToken);
          else logout();
        } catch {
          logout();
        }
      }
    }
  }, [accessToken, refreshToken, setAccessToken, logout]);

  useEffect(() => {
    if (!accessToken) return;
    if (!localUserData?.user?.devices) fetchUserData();
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
          const res = await axios.get(`${API_BASE_URL}/mqtt/getRule/${clientId}`, {
            headers: { Authorization: `Bearer ${accessToken}` },
            withCredentials: true,
          });
          rulesMap[clientId] = res.data?.rules?.rules || [];
        } else {
          for (const device of localUserData.user.devices) {
            try {
              const res = await axios.get(`${API_BASE_URL}/mqtt/getRule/${device.clientId}`, {
                headers: { Authorization: `Bearer ${accessToken}` },
                withCredentials: true,
              });
              rulesMap[device.clientId] = res.data?.rules?.rules || [];
            } catch {
              rulesMap[device.clientId] = [];
            }
          }
        }
        setDeviceRules(rulesMap);
      } catch {
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

  // Delete rule handler
  const handleDelete = async (deviceId, ruleId) => {
    if (!window.confirm('Are you sure you want to delete this timer?')) return;

    try {
      await axios.delete(`${API_BASE_URL}/mqtt/delete/${ruleId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        withCredentials: true,
      });
      setDeviceRules((prev) => {
        const updatedRules = prev[deviceId].filter((rule) => rule._id !== ruleId);
        return { ...prev, [deviceId]: updatedRules };
      });
    } catch (err) {
      console.error('Failed to delete rule', err);
      alert('Failed to delete rule');
    }
  };

  // Edit handlers
  const handleEdit = (deviceId, rule) => {
    setEditingRule({ deviceId, ruleId: rule._id });
    setEditForm({
      onTime: rule.onTime || '',
      offTime: rule.offTime || '',
      timezone: rule.timezone || '',
    });
  };
  const handleChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };
  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    if (!editingRule) return;

    try {
      await axios.put(
        `${API_BASE_URL}/mqtt/update/${editingRule.ruleId}`,
        {
          onTime: editForm.onTime,
          offTime: editForm.offTime,
          timezone: editForm.timezone,
        },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          withCredentials: true,
        }
      );

      setDeviceRules((prev) => {
        const updatedRules = prev[editingRule.deviceId].map((rule) => {
          if (rule._id === editingRule.ruleId) {
            return { ...rule, ...editForm };
          }
          return rule;
        });
        return { ...prev, [editingRule.deviceId]: updatedRules };
      });

      setEditingRule(null);
    } catch (err) {
      console.error('Failed to update rule', err);
      alert('Failed to update rule');
    }
  };
  const handleCancelEdit = () => {
    setEditingRule(null);
  };

  // Add Timer Handlers
  const handleAddClick = (deviceId) => {
    setAddingForDevice(deviceId);
    setAddForm({
      onTime: '',
      offTime: '',
      timezone: 'Asia/Ulaanbaatar',
    });
  };
  const handleAddChange = (e) => {
    setAddForm({ ...addForm, [e.target.name]: e.target.value });
  };
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!addingForDevice) return;

    try {
      const topic = `cmnd/${addingForDevice}/POWER`;

      const payload = {
        topic,
        onTime: addForm.onTime,
        offTime: addForm.offTime,
        timezone: addForm.timezone,
      };

      await axios.post(
        `${API_BASE_URL}/mqtt/automation/${addingForDevice}`,
        payload,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          withCredentials: true,
        }
      );

      // Fetch fresh rules after adding
      const res = await axios.get(`${API_BASE_URL}/mqtt/getRule/${addingForDevice}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        withCredentials: true,
      });

      setDeviceRules((prev) => ({
        ...prev,
        [addingForDevice]: res.data?.rules?.rules || [],
      }));

      setAddingForDevice(null);
    } catch (err) {
      console.error('Failed to add rule', err);
      alert('Failed to add rule');
    }
  };
  const handleCancelAdd = () => {
    setAddingForDevice(null);
  };

  const hasRules = Object.values(deviceRules).some((rules) => rules.length > 0);

  return (
    <div className="automation-container">
      <h1>Automation Timers</h1>
      {!hasRules && <p>No automation timers found.</p>}

      {Object.entries(deviceRules).map(([deviceId, rules]) => (
        <div key={deviceId} className="device-box">
          <h2>Device: {deviceId}</h2>
          
          {addingForDevice === deviceId ? (
            <form className="rule-card edit-form" onSubmit={handleAddSubmit}>
              <p><strong>Topic:</strong> {`cmnd/${deviceId}/POWER`}</p>
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
                  placeholder="Asia/Ulaanbaatar"
                />
              </label>
              <div className="btn-group">
                <button type="submit" className="edit-btn">Add</button>
                <button type="button" onClick={handleCancelAdd} className="delete-btn">Cancel</button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => handleAddClick(deviceId)}
              className="add-btn"
            >
              ➕ Add Timer
            </button>
          )}

          {rules.length === 0 && <p>No timers for this device.</p>}

          {rules.map((rule) =>
            editingRule && editingRule.ruleId === rule._id ? (
              <form key={rule._id} className="rule-card edit-form" onSubmit={handleUpdateSubmit}>
                <p><strong>Topic:</strong> {rule.topic}</p>
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
                    placeholder="Asia/Ulaanbaatar"
                  />
                </label>
                <div className="btn-group">
                  <button type="submit" className="edit-btn">Save</button>
                  <button type="button" onClick={handleCancelEdit} className="delete-btn">Cancel</button>
                </div>
              </form>
            ) : (
              <div key={rule._id} className="rule-card">
                <p><strong>Topic:</strong> {rule.topic}</p>
                <p><strong>On Time:</strong> {rule.onTime}</p>
                <p><strong>Off Time:</strong> {rule.offTime}</p>
                <p><strong>Timezone:</strong> {rule.timezone}</p>
                <div className="btn-group">
                  <button className="edit-btn" onClick={() => handleEdit(deviceId, rule)}>✏️ Edit</button>
                  <button className="delete-btn" onClick={() => handleDelete(deviceId, rule._id)}>🗑️ Delete</button>
                </div>
              </div>
            )
          )}
        </div>
      ))}
    </div>
  );
};

export default Automation;
