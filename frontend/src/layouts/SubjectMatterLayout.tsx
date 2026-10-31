import type { JSX, ReactNode } from "react";
import { AppShell } from "./AppShell";

type SubjectMatterLayoutProps = { children: ReactNode };
export const SubjectMatterLayout = ({ children }: SubjectMatterLayoutProps): JSX.Element => (
  <AppShell mainClassName="bg-white">{children}</AppShell>
);
