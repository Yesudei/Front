import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../UserContext';
import viotLogo from '../assets/viot.png';
import DarkModeToggle from './DarkModeToggle';
import '../CSS/Header.css'; // Make sure you have styles defined for header, dropdown, etc.

function Header() {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);
  const navigate = useNavigate();

  const { username, logout, isLoading } = useUser();

  // 🪵 Confirm context reactivity
  console.log('[Header] Rendered with username:', username);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        buttonRef.current !== event.target
      ) {
        setShowDropdown(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setShowDropdown(false);
        buttonRef.current?.focus();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (isLoading) return null; // prevent flickering

  return (
    <header className="header">
      <div className="header-left">
        <img src={viotLogo} alt="Logo" className="logo-img" />
      </div>

      <div className="header-right">
        <DarkModeToggle />

        <div className="user-menu">
          <button
            ref={buttonRef}
            className="user-button"
            aria-haspopup="true"
            aria-expanded={showDropdown}
            onClick={() => setShowDropdown((prev) => !prev)}
          >
            {username?.trim() || 'User'}
          </button>

          {showDropdown && (
            <ul
              className="user-dropdown"
              ref={dropdownRef}
              role="menu"
              aria-label="User menu"
            >
              <li role="menuitem" onClick={handleLogout}>
                Logout
              </li>
            </ul>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;
