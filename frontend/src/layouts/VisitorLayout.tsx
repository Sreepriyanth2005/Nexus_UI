import type { JSX, ReactNode } from "react";
import { AppShell } from "./AppShell";

type VisitorLayoutProps = { children: ReactNode };
export const VisitorLayout = ({ children }: VisitorLayoutProps): JSX.Element => (
  <AppShell>{children}</AppShell>
);
