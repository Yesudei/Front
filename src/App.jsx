import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './assets/Home';
import Todo from './assets/Todo';
import LoginForm from './components/LoginForm';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import './App.css';
import Register from './assets/Register';
import VerifyNumber from './assets/Verifynumber';
import ResetPassword from './assets/ResetPassword';
import ResetPhoneEntry from './assets/ResetPhoneEntry'; // ✅ NEW import

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginForm />} />
      <Route path="/register" element={<Register />} /> 
      <Route path="/verify-number" element={<VerifyNumber />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/reset-phone" element={<ResetPhoneEntry />} /> {/* ✅ NEW route */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Home />} />
        <Route path="todo" element={<Todo />} />
      </Route>
    </Routes>
  );
}

export default App;









