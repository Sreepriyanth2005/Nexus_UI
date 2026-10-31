// import type { ReactNode } from "react";

// type ProtectedRouteProps = {
//   children: ReactNode;
// };

// export const ProtectedRoute = ({ children }: ProtectedRouteProps): JSX.Element => {
//   return <>{children}</>;
// };
// routes/protected.route.tsx
import { Navigate } from "react-router";
import { useAuthStore } from "../core/auth/auth.store";

type ProtectedRouteProps = {
  children: React.ReactNode;
};

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { status, accessToken } = useAuthStore();

  if (!status || !accessToken) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};