import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaHome } from 'react-icons/fa';
import { AiOutlineThunderbolt } from 'react-icons/ai';
import { CgProfile } from 'react-icons/cg';
import { MdDevices, MdAdminPanelSettings } from 'react-icons/md';
import '../CSS/Sidebar.css';
import { useUser } from '../UserContext';

function Sidebar() {
  const [showList, setShowList] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(window.innerWidth > 992);
  const location = useLocation();
  const { user } = useUser();

  const toggleSidebar = () => setSidebarVisible(!sidebarVisible);
  const toggleList = () => setShowList(!showList);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 992) {
        setSidebarVisible(true);
      } else {
        setSidebarVisible(false);
      }
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
          <div
            className="sidebar-dropdown"
            onClick={toggleList}
            role="button"
            tabIndex={0}
            aria-expanded={showList}
            aria-controls="sidebar-categories"
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggleList();
              }
            }}
          >
            Сонголт {showList ? '▲' : '▼'}
          </div>

          {showList && (
            <div className="dropdown-scroll" id="sidebar-categories">
              <ul>
                <li tabIndex={0}>Ангилал 1</li>
                <li tabIndex={0}>Ангилал 2</li>
                <li tabIndex={0}>Ангилал 3</li>
                <li tabIndex={0}>Ангилал 4</li>
                <li tabIndex={0}>Ангилал 5</li>
                <li tabIndex={0}>Ангилал 6</li>
                <li tabIndex={0}>Ангилал 7</li>
                <li tabIndex={0}>Ангилал 8</li>
              </ul>
            </div>
          )}

          <ul className="sidebar-list">
            <li className={`sidebar-list-item ${location.pathname === '/' ? 'active' : ''}`}>
              <Link to="/"><FaHome className="icon" /> Нүүр</Link>
            </li>
            <li className={`sidebar-list-item ${location.pathname.startsWith('/automation') ? 'active' : ''}`}>
              <Link to="/automation"><AiOutlineThunderbolt className="icon" /> Автоматжуулалт</Link>
            </li>
            <li className={`sidebar-list-item ${location.pathname === '/profile' ? 'active' : ''}`}>
              <Link to="/profile"><CgProfile className="icon" /> Profile</Link>
            </li>

            {/* Show Devices only for non-admin users */}
            {!user?.isAdmin && (
              <li className={`sidebar-list-item ${location.pathname === '/devices' ? 'active' : ''}`}>
                <Link to="/devices"><MdDevices className='icon' /> Devices</Link>
              </li>
            )}

            {/* Show Admin Panel only for admin users */}
            {user?.isAdmin && (
              <li className={`sidebar-list-item ${location.pathname.startsWith('/admin') ? 'active' : ''}`}>
                <Link to="/admin"><MdAdminPanelSettings className='icon' /> Admin Panel</Link>
              </li>
            )}
          </ul>
        </nav>
      )}
    </>
  );
}

export default Sidebar;
