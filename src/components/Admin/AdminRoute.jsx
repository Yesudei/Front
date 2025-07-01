import React from 'react';
import { Navigate } from 'react-router-dom';
import { useUser } from '../../UserContext';
const AdminRoute = ({ children }) => {
  const { user, isLoading, accessToken } = useUser();

  if (isLoading) return <div>Loading...</div>;

  if (!accessToken || !user?.isAdmin) return <Navigate to="/" replace />;

  return children;
};

export default AdminRoute;
