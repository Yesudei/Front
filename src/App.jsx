import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './assets/Home';
import Todo from './assets/Todo';
import LoginForm from './components/LoginForm';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import './App.css';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginForm />} />
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
