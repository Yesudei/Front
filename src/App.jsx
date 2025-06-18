import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { UserProvider, useUser } from './usercontext';
import Home from './assets/Home';
import LoginForm from './components/LoginForm';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Register from './assets/Register';
import VerifyNumber from './assets/Verifynumber';
import ResetPassword from './assets/ResetPassword';
import ResetPhoneEntry from './assets/ResetPhoneEntry';

const AppRoutes = () => {
  const { isLoading } = useUser();

  if (isLoading) {
    return <div>Loading user session...</div>;
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginForm />} />
      <Route path="/register" element={<Register />} />
      <Route path="/verify-number" element={<VerifyNumber />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/reset-phone" element={<ResetPhoneEntry />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Home />} />
        {/* other protected routes */}
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
