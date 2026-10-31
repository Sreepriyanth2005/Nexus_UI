import { QueryClientProvider } from "@tanstack/react-query";
import type { JSX, ReactNode } from "react";
import { Toaster } from "sonner";

import { queryClient } from "../services/queryClient";

type ProvidersProps = {
  children: ReactNode;
};

export const Providers = ({ children }: ProvidersProps): JSX.Element => {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster richColors position="top-right" />
    </QueryClientProvider>
  );
};
