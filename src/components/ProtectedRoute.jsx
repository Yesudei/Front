import React from 'react';
import { Navigate } from 'react-router-dom';
import { useUser } from '../usercontext';

const ProtectedRoute = ({ children }) => {
  const { accessToken, isLoading } = useUser();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return accessToken ? children : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
