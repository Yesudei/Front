import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../CSS/Sidebar.css';
import { useUser } from '../UserContext';

function Sidebar() {
  const [sidebarVisible, setSidebarVisible] = useState(window.innerWidth > 992);
  const location = useLocation();
  const { user } = useUser();

  const toggleSidebar = () => setSidebarVisible(!sidebarVisible);

  useEffect(() => {
    const handleResize = () => {
      setSidebarVisible(window.innerWidth > 992);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <>
      <button
        className="menu-icon"
        aria-label={sidebarVisible ? 'Close sidebar' : 'Open sidebar'}
        aria-expanded={sidebarVisible}
        onClick={toggleSidebar}
      >
        ☰
      </button>

      {sidebarVisible && (
        <nav id="sidebar" className="sidebar" aria-label="Sidebar navigation">
          <ul className="sidebar-list">
            <li className={`sidebar-list-item ${location.pathname === '/' ? 'active' : ''}`}>
              <Link to="/">Нүүр</Link>
            </li>
            <li className={`sidebar-list-item ${location.pathname.startsWith('/automation') ? 'active' : ''}`}>
              <Link to="/automation">Автоматжуулалт</Link>
            </li>
            <li className={`sidebar-list-item ${location.pathname === '/profile' ? 'active' : ''}`}>
              <Link to="/profile">Profile</Link>
            </li>

            {!user?.isAdmin && (
              <li className={`sidebar-list-item ${location.pathname === '/devices' ? 'active' : ''}`}>
                <Link to="/devices">Devices</Link>
              </li>
            )}

            {user?.isAdmin && (
              <li className={`sidebar-list-item ${location.pathname.startsWith('/admin') ? 'active' : ''}`}>
                <Link to="/admin">Admin Panel</Link>
              </li>
            )}
          </ul>
        </nav>
      )}
    </>
  );
}

export default Sidebar;
