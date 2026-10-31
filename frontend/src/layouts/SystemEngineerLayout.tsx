import type { JSX, ReactNode } from "react";
import { AppShell } from "./AppShell";

type SystemEngineerLayoutProps = { children: ReactNode };
export const SystemEngineerLayout = ({ children }: SystemEngineerLayoutProps): JSX.Element => (
  <AppShell mainClassName="bg-white">{children}</AppShell>
);
