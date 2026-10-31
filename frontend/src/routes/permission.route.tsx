import React, { useEffect, useState } from "react";
import { Navigate } from "react-router";
import { useAuthStore } from "../core/auth/auth.store";
import { getMyPermissionsApi } from "../core/api/permission.api";

type PermissionRouteProps = {
  children: React.ReactNode;
  requiredPermission?: string | string[];
};

export const PermissionRoute = ({ children, requiredPermission }: PermissionRouteProps) => {
  const { role, permissions, setPermissions, status } = useAuthStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const fetchPerms = async () => {
      try {
        if (status) {
          const res = await getMyPermissionsApi();
          if (mounted) {
            setPermissions(res.map(p => p.code));
          }
        }
      } catch (err) {
        console.error("Failed to fetch permissions", err);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    if (permissions.length === 0 && status) {
      fetchPerms();
    } else {
      setLoading(false);
    }

    return () => {
      mounted = false;
    };
  }, [role, status, permissions.length, setPermissions]);

  if (loading) {
    return null;
  }

  // Super Admins bypass permission checks
  if (role && role.toUpperCase() === "SUPER_ADMIN") {
    return <>{children}</>;
  }

  if (requiredPermission) {
    const requiredList = Array.isArray(requiredPermission) ? requiredPermission : [requiredPermission];
    
    // Check if user has ANY of the required permissions
    const hasPermission = requiredList.some(reqPerm => 
      permissions.includes(reqPerm.toUpperCase())
    );

    if (!hasPermission) {
      // User is authenticated but unauthorized for this page
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return <>{children}</>;
};
