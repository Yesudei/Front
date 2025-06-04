import React from 'react';
import Header from '../assets/Header';
import Sidebar from '../assets/Sidebar';
import { Outlet } from 'react-router-dom';
import '../App.css';

function Layout() {
  return (
    <div className="grid-container">
      <Header />
      <Sidebar />
      <main className="main-container">
        <Outlet />
      </main>
   </div>
  );
}

export default Layout; 
  