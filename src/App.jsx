import React, { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useUser, UserProvider } from './UserContext';
import { setupInterceptors } from './axiosInstance';

import Home from './components/Home';
import LoginForm from './components/Loginform';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/layout';
import Register from './components/Register';
import VerifyNumber from './components/Verifynumber';
import ResetPassword from './components/ResetPassword';
import ResetPhoneEntry from './components/ResetPhoneEntry';
import Automation from './components/Automation';
import DarkModeToggle from './components/DarkModeToggle'; 
import Profile from './components/Profile';
import Devices from './components/Devices';

const AppRoutes = () => {
  const user = useUser();

  // Setup the interceptor once the UserProvider is ready
  useEffect(() => {
    setupInterceptors(user);
  }, [user]);

  if (user.isLoading) {
    return <div>Loading user session...</div>;
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginForm />} />
      <Route path="/register" element={<Register />} />
      <Route path="/verify-number" element={<VerifyNumber />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/reset-phone" element={<ResetPhoneEntry />} />
      <Route path="/automation" element={<Automation />} />
      <Route path="/automation/:clientId" element={<Automation />} />

      {/* Protected routes wrapped with Layout and Sidebar */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Home />} />
        <Route path="profile" element={<Profile />} />
        <Route path="devices" element={<Devices />} />
        {/* Add other protected child routes here */}
      </Route>
    </Routes>
  );
};

function App() {
  return (
    <UserProvider>
      <AppRoutes />
    </UserProvider>
  );
}

export default App;
