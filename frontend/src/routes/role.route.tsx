import type { JSX, ReactNode } from "react";

type RoleRouteProps = {
  children: ReactNode;
};

export const RoleRoute = ({ children }: RoleRouteProps): JSX.Element => {
  return <>{children}</>;
};
