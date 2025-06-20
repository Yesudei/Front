import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../CSS/Taskbar.css';
import { useUser } from '../UserContext';
const Taskbar = () => {
  const { accessToken } = useUser();

  const [username, setUsername] = useState('User');
  const [weather, setWeather] = useState({ temp: null, condition: '', date: '' });
  const [logs, setLogs] = useState([]); // ✅ always an array

  useEffect(() => {
    if (accessToken) {
      // ✅ decode name if you want
      try {
        const decoded = jwt_decode(accessToken);
        setUsername(decoded.name || decoded.username || 'User');
      } catch (error) {
        console.error('Invalid token:', error);
      }

      // ✅ fetch user and logs
      fetchUserAndLogs();
    }
  }, [accessToken]);

  const fetchUserAndLogs = async () => {
    console.log('Access Token:', accessToken);

    try {
      // ✅ Get user from backend with token in header
      const userRes = await axios.get(`http://localhost:3001/users/getuser`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      console.log('getuser response:', userRes.data);

      const userId = userRes.data.user?.id;
      if (!userId) {
        console.error('No user ID in getuser response');
        return;
      }

      // ✅ Get logs for userId
      const logsRes = await axios.get(`http://localhost:3001/mqtt/powerlogs/${userId}`);
      console.log('powerlogs response:', logsRes.data);

      // ✅ Extract logs safely:
      const raw = logsRes.data;
      const logsArray = Array.isArray(raw)
        ? raw
        : Array.isArray(raw.logs)
        ? raw.logs
        : Array.isArray(raw.data)
        ? raw.data
        : [];

      setLogs(logsArray);

    } catch (error) {
      console.error('Failed to fetch user or logs:', error.response ? error.response.data : error);
    }
  };

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const response = await axios.get(
          `https://api.open-meteo.com/v1/forecast?latitude=47.92&longitude=106.92&current=temperature_2m,weathercode&timezone=auto`
        );
        const current = response.data.current;
        const temp = current.temperature_2m;
        const code = current.weathercode;
        const today = new Date().toISOString().split('T')[0].replace(/-/g, '.');

        const weatherDescription = getWeatherDescription(code);
        setWeather({ temp, condition: weatherDescription, date: today });
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
      <div className="weather-card">
        <div>🌤️</div>
        <div className="temp">{weather.temp !== null ? `${weather.temp}°` : '...'}</div>
        <div>{weather.condition}</div>
        <div>{weather.date}</div>
      </div>

      <div className="profile-card">
        <div>{username}</div>
        <span>Хувийн хуудас</span>
      </div>

      <div className="subscription-card">
        <div>Premium</div>
        <span>хүртэл</span>
      </div>

      <div className="log-section">
        {Array.isArray(logs) && logs.length > 0 ? (
          logs.map((log, index) => (
            <div key={index} className="log-entry">
              <div className="log-date">
                {log.date || log.timestamp?.split('T')[0] || '---'}
              </div>
              <div className="log-content">
                <div className="log-text">❌ {log.text || log.message || 'No message'}</div>
                <div className="log-meta">
                  <span>{log.location || '-'}</span>
                  <span>{log.time || log.timestamp?.split('T')[1]?.substring(0, 5) || '--:--'}</span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div>Лог мэдээлэл алга.</div>
        )}
      </div>
    </div>
  );
};

export default Taskbar;
