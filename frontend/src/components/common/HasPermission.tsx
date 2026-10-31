import React from 'react';
import { useAuthStore } from '../../core/auth/auth.store';

interface HasPermissionProps {
  requiredPermission: string | string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const HasPermission: React.FC<HasPermissionProps> = ({ requiredPermission, children, fallback = null }) => {
  const { role, permissions } = useAuthStore();

  if (role && role.toUpperCase() === "SUPER_ADMIN") {
    return <>{children}</>;
  }

  const requiredList = Array.isArray(requiredPermission) ? requiredPermission : [requiredPermission];
  
  // Check if user has ANY of the required permissions
  const hasPerm = requiredList.some(reqPerm => 
    permissions.includes(reqPerm.toUpperCase())
  );

  if (!hasPerm) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};
