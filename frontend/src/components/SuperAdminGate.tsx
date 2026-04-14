import React from 'react';
import { Navigate } from 'react-router-dom';
import useAuth from '@/store/useAuth';

interface SuperAdminGateProps {
  children: React.ReactNode;
}

const SuperAdminGate: React.FC<SuperAdminGateProps> = ({ children }) => {
  const user = useAuth((state) => state.user);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // SuperAdmin faqat role === 'SUPERADMIN' bo'lganda kirishi mumkin
  if (user.role !== 'SUPERADMIN') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default SuperAdminGate;
