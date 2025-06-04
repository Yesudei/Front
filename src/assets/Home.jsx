import React, { useEffect, useState } from 'react';
import {
  BsFillArchiveFill,
  BsFillGrid3X3GapFill,
  BsPeopleFill,
  BsFillBellFill,
} from 'react-icons/bs';
import axios from 'axios';
import Card from './Card';
import { useUser } from '../usercontext';
import { useNavigate } from 'react-router-dom';

function Home() {
  const { accessToken, username } = useUser();
  const navigate = useNavigate();
  const [usernames, setUsernames] = useState([]);
  
  useEffect(() => {
    if (!accessToken || !username) {
      navigate('/login');
    }
  }, [accessToken, username, navigate]);

  useEffect(() => {
    axios.get('https://jsonplaceholder.typicode.com/users')
      .then((response) => {
        const names = response.data.map(user => user.username);
        setUsernames(names);
      })
      .catch((error) => {
        console.error('Error fetching usernames:', error);
      });
  }, []);

  const icons = [
    BsFillArchiveFill,
    BsFillGrid3X3GapFill,
    BsPeopleFill,
    BsFillBellFill,
    BsFillBellFill,
    BsFillBellFill,
    BsFillBellFill,
    BsFillBellFill,
  ];

  const values = [300, 12, 33, 42, 76, 128, 5, 18];

  return (
    <main className='main-container'>
      <div className='main-title'>
        <h3>Welcome back, {username || 'User'}</h3>
      </div>
      <div className='main-cards'>
        {(usernames.length ? usernames : Array(9).fill('Loading')).map((name, index) => (
          <Card
            key={index}
            Icon={icons[index % icons.length]}
            title={name}
            value={values[index % values.length]}
          />
        ))}
      </div>
    </main>
  );
}

export default Home;
