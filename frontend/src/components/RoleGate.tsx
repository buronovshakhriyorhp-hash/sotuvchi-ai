import React from 'react';
import { Navigate } from 'react-router-dom';
import useAuth from '@/store/useAuth';

interface RoleGateProps {
  children: React.ReactNode;
  allowedRoles: string[];
}

/**
 * RoleGate component to protect routes based on user roles.
 * If the user's role is not in the allowedRoles list, it redirects to the dashboard.
 */
const RoleGate: React.FC<RoleGateProps> = ({ children, allowedRoles }) => {
  const user = useAuth((state) => state.user);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    // If not authorized, redirect to the main dash or just show a "Not Authorized" message
    // Here we redirect to index which is the dashboard
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default RoleGate;
