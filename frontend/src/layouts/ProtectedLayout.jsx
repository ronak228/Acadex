import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import DashboardLayout from './DashboardLayout';
import authService from '../services/authService';

const ProtectedLayout = () => {
  const isAuthenticated = authService.isAuthenticated();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <DashboardLayout>
      <Outlet />
    </DashboardLayout>
  );
};

export default ProtectedLayout;
