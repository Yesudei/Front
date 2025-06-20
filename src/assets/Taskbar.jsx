import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../CSS/Taskbar.css';
import { useUser } from '../UserContext';
import * as jwtDecode from 'jwt-decode';


const Taskbar = () => {
  const { accessToken } = useUser();

  const [username, setUsername] = useState('User');

  const [weather, setWeather] = useState({ temp: null, condition: '', date: '' });
  const [logs, setLogs] = useState([
    { date: '2025-05-12', time: '16:25', text: '"УС буцалгагч" төхөөрөмж холболтоос саллаа.', location: 'office' },
    { date: '2025-04-18', time: '15:07', text: '"RGB" төхөөрөмж холболтоос саллаа.', location: 'baishin 2' },
    { date: '2025-04-17', time: '15:19', text: 'good morning', location: 'good morning' },
  ]);

  useEffect(() => {
    if (accessToken) {
      try {
        const decoded = jwtDecode(accessToken);
        // Adjust property names here to match your token's payload
        setUsername(decoded.name || decoded.username || 'User');
      } catch (error) {
        console.error('Invalid token:', error);
      }
    }
  }, [accessToken]);

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
        {logs.map((log, index) => (
          <div key={index} className="log-entry">
            <div className="log-date">{log.date}</div>
            <div className="log-content">
              <div className="log-text">❌ {log.text}</div>
              <div className="log-meta">
                <span>{log.location}</span>
                <span>{log.time}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Taskbar;
