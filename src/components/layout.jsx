import React from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import { Outlet } from 'react-router-dom';
import Taskbar from './Taskbar';
import '../App.css';

function Layout() {
  return (
    <div className="grid-container">
      <Header />
      <Sidebar />
      <main className="main-container">
        <Outlet />
      </main>
      <div className="taskbar-container">
        <Taskbar />
      </div>
    </div>
  );
}

export default Layout;
