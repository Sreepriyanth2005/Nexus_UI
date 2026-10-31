// src/store/careerPathTenantStore.ts

import { create } from "zustand";

export interface CareerPathTenant {
  id?: string;
  tenantId?: string;
  tenantName?: string;
  [key: string]: any;
}

interface CareerPathTenantState {
  tenant: CareerPathTenant | null;

  setTenant: (
    tenant: CareerPathTenant | null
  ) => void;

  clearTenant: () => void;
}

export const useCareerPathTenantStore =
  create<CareerPathTenantState>(
    (set) => ({
      tenant: null,

      setTenant: (
        tenant
      ) =>
        set({
          tenant,
        }),

      clearTenant: () =>
        set({
          tenant: null,
        }),
    })
  );