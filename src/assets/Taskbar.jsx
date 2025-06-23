import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

import '../CSS/Taskbar.css';
import { useUser } from '../UserContext';

const Taskbar = () => {
  const { accessToken } = useUser();

  const [username, setUsername] = useState('User');
  const [weather, setWeather] = useState({ temp: null, condition: '', date: '' });
  const [logs, setLogs] = useState([]);

  const fetchUserAndLogs = useCallback(async () => {
    try {
      const userRes = await axios.get(`http://localhost:3001/users/getuser`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const userId = userRes.data.user?.id;
      if (!userId) return;

      const logsRes = await axios.get(`http://localhost:3001/mqtt/powerlogs/${userId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const raw = logsRes.data;
      const logsArray = Array.isArray(raw?.logs) ? raw.logs : [];
      setLogs(logsArray);
    } catch (error) {
      console.error('Failed to fetch user or logs:', error.response?.data || error);
    }
  }, [accessToken]);

  useEffect(() => {
    if (accessToken) {
      try {
        const decoded = jwtDecode(accessToken);
        setUsername(decoded.name || decoded.username || 'User');
      } catch (error) {
        console.error('Invalid token:', error);
      }

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
      <div className="weather-section">
        <div className="weather-info">
          <div className="location">📍 Улаанбаатар</div>
          <div className="weather-icon">☀️</div>
          <div className="temperature">
            {weather.temp !== null ? `${weather.temp}°` : '...'}
          </div>
          <div className="date">Өнөөдөр, {weather.date}</div>
        </div>
      </div>

      <div className="cards-row">
        <div className="profile-card">
          <div className="title">Профайл</div>
          <div className="name">{username}</div>
          <div className="link">Хувийн хуудас ➤</div>
        </div>

        <div className="subscription-card">
          <div className="title">Төлбөрийн багц</div>
          <div className="premium">Premium</div>
          <div className="until">хүртэл</div>
        </div>
      </div>

      <div className="log-section">
        {Array.isArray(logs) && logs.length > 0 ? (
          logs
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, 10)
            .map((log, index) => {
              const [date, time] = log.timestamp
                ? log.timestamp.split('T')
                : ['---', '--:--'];
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
