import type { JSX, ReactNode } from "react";
import { AppShell } from "./AppShell";

type AdminLayoutProps = {
  children: ReactNode;
};

export const AdminLayout = ({ children }: AdminLayoutProps): JSX.Element => {
  return <AppShell>{children}</AppShell>;
};
