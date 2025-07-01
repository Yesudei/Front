import React, { useEffect, useState, useCallback } from 'react';
import {jwtDecode} from 'jwt-decode';
import '../CSS/Taskbar.css';
import { useUser } from '../UserContext';
import axiosInstance, { setAccessTokenForInterceptor } from '../axiosInstance';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Taskbar = () => {
  const { accessToken } = useUser();
  const [username, setUsername] = useState('User');
  const [weather, setWeather] = useState({ temp: null, condition: '', date: '' });
  const [logs, setLogs] = useState([]);
  const navigate = useNavigate();

  // Sync axios interceptor with current accessToken
  useEffect(() => {
    setAccessTokenForInterceptor(accessToken);
  }, [accessToken]);

  const fetchUserAndLogs = useCallback(async () => {
    try {
      if (!accessToken) return;

      // Decode token for username display
      try {
        const decoded = jwtDecode(accessToken);
        setUsername(decoded.name || decoded.username || 'User');
      } catch {
        setUsername('User');
      }

      // Get user info
      const userRes = await axiosInstance.get('/users/getuser');
      const userId = userRes.data.user?.id || userRes.data.user?._id;
      if (!userId) return;

      // Get devices
      const devicesRes = await axiosInstance.get('/device/getDevices');
      const devices = devicesRes.data.devices || [];

      if (devices.length === 0) {
        console.warn('No devices found for user');
        return;
      }

      const firstDevice = devices[0];
      const clientId = firstDevice.clientId;
      const entity = firstDevice.entity || 'SI7021';

      // Fetch logs
      const logsRes = await axiosInstance.get('/mqtt/powerlogs');
      const rawLogs = logsRes.data;
      const logsArray = Array.isArray(rawLogs?.logs) ? rawLogs.logs : [];
      setLogs(logsArray);

      // POST to /mqtt/data with clientId and entity
      const dataRes = await axiosInstance.post('/mqtt/data', { clientId, entity });
      if (!dataRes.data.success) {
        console.warn('No sensor data:', dataRes.data.message);
      }
    } catch (error) {
      console.error('Failed to fetch user, logs, or post data:', error.response?.data || error);
    }
  }, [accessToken]);

  useEffect(() => {
    if (accessToken) {
      fetchUserAndLogs();
    }
  }, [accessToken, fetchUserAndLogs]);

  useEffect(() => {
    if (!accessToken) return;

    const interval = setInterval(() => {
      fetchUserAndLogs();
    }, 30000);

    return () => clearInterval(interval);
  }, [accessToken, fetchUserAndLogs]);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const response = await axios.get(
          'https://api.open-meteo.com/v1/forecast?latitude=47.92&longitude=106.92&current_weather=true&timezone=auto'
        );
        const current = response.data.current_weather;
        if (!current) return;

        const temp = current.temperature;
        const code = current.weathercode;
        const today = new Date().toISOString().split('T')[0].replace(/-/g, '.');

        setWeather({ temp, condition: getWeatherDescription(code), date: today });
      } catch (error) {
        console.error('Weather fetch error:', error);
      }
    };

    fetchWeather();
  }, []);

  const getWeatherDescription = (code) => {
    if ([0].includes(code)) return 'Цэлмэг';
    if ([1, 2, 3].includes(code)) return 'Үүлэрхэг';
    if ([45, 48].includes(code)) return 'Манантай';
    if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) return 'Бороо';
    if ([71, 73, 75, 85, 86].includes(code)) return 'Цас';
    if ([95, 96, 99].includes(code)) return 'Аадар бороо';
    return 'Тодорхойгүй';
  };

  return (
    <div className="taskbar">
      <div className="weather-section">
        <div className="weather-info">
          <div className="location">📍 Улаанбаатар</div>
          <div className="weather-icon">☀️</div>
          <div className="temperature">{weather.temp !== null ? `${weather.temp}°` : '...'}</div>
          <div className="date">Өнөөдөр, {weather.date}</div>
        </div>
      </div>

      <div className="cards-row">
        <div
          className="profile-card"
          onClick={() => navigate('/profile')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') navigate('/profile');
          }}
          aria-label="Go to profile page"
          style={{ cursor: 'pointer' }}
        >
          <div className="title">Профайл</div>
          <div className="name">{username}</div>
          <div className="link">Хувийн хуудас ➤</div>
        </div>

        <div className="subscription-card">
          <div className="title">?</div>
          <div className="premium">Nettspend</div>
          <div className="until">?</div>
        </div>
      </div>

      <div className="log-section">
        {Array.isArray(logs) && logs.length > 0 ? (
          logs
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, 10)
            .map((log, index) => {
              const [date, time] = log.timestamp ? log.timestamp.split('T') : ['---', '--:--'];
              const formattedDate = date.replace(/-/g, '.');

              return (
                <div key={index} className="log-entry">
                  <div className="log-date">{formattedDate}</div>
                  <div className="log-item">
                    <div className="log-text">
                      {log.message || (log.power === 'on' ? 'Тэжээл асаалттай' : 'Тэжээл унтарсан')}
                    </div>
                    <div className="log-meta">
                      <span>{log.clientId || '-'}</span>
                      <span>{time?.substring(0, 5) || '--:--'}</span>
                    </div>
                  </div>
                </div>
              );
            })
        ) : (
          <div>Лог мэдээлэл алга.</div>
        )}
      </div>
    </div>
  );
};

export default Taskbar;
