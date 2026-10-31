import type { JSX, ReactNode } from "react";
import { AppShell } from "./AppShell";

type SuperAdminLayoutProps = { children: ReactNode };
export const SuperAdminLayout = ({ children }: SuperAdminLayoutProps): JSX.Element => (
  <AppShell>{children}</AppShell>
);
