import React from 'react';
import { Navigate } from 'react-router-dom';
import { useUser } from '../UserContext';

const ProtectedRoute = ({ children }) => {
  const { accessToken } = useUser();

  return accessToken ? children : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
