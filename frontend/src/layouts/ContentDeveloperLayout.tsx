import type { JSX, ReactNode } from "react";
import { AppShell } from "./AppShell";

type ContentDeveloperLayoutProps = { children: ReactNode };
export const ContentDeveloperLayout = ({ children }: ContentDeveloperLayoutProps): JSX.Element => (
  <AppShell>{children}</AppShell>
);
