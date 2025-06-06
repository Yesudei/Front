import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import viotLogo from '../assets/viot.png';

function Header() {
  const [showDropdown, setShowDropdown] = useState(false);
  const [username, setUsername] = useState('');
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);
  const navigate = useNavigate();

  // 🔐 Fetch user data using access token
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    fetch('http://localhost:3001/users/getUser', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error('Unauthorized or failed to fetch user');
        }
        return res.json();
        console.log(res)
      })
      .then((data) => {
        setUsername(data.username || 'User');
        console.log(data)
      })
      .catch((err) => {
        console.error('Error fetching user:', err.message);
        setUsername('User');
      });
  }, []);

  // ⬇ Dropdown close logic
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        buttonRef.current !== event.target
      ) {
        setShowDropdown(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setShowDropdown(false);
        buttonRef.current?.focus();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // ⏏ Logout function
  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    navigate('/login');
  };

  return (
    <header className="header">
      <div className="header-left">
        <img src={viotLogo} alt="Logo" className="logo-img" />
      </div>
      <div className="header-right" ref={dropdownRef}>
        <button
          ref={buttonRef}
          className="user-button"
          aria-haspopup="true"
          aria-expanded={showDropdown}
          onClick={() => setShowDropdown((prev) => !prev)}
        >
          {username}
        </button>
        {showDropdown && (
          <ul className="user-dropdown" role="menu" aria-label="User menu">
            <li role="menuitem" tabIndex={0}>Settings</li>
            <li
              role="menuitem"
              tabIndex={0}
              onClick={handleLogout}
              onKeyDown={(e) => e.key === 'Enter' && handleLogout()}
            >
              Logout
            </li>
          </ul>
        )}
      </div>
    </header>
  );
}

export default Header;
