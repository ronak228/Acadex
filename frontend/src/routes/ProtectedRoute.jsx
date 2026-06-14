import React from 'react';
import { Navigate } from 'react-router-dom';
import authService from '../services/authService';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const isAuthenticated = authService.isAuthenticated();
  const user = authService.getLocalUser();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    // If the role is unauthorized, redirect to dashboard or fallback
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;
