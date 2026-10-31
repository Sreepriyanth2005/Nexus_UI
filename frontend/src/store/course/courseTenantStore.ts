// src/store/courseTenantStore.ts

import { create } from "zustand";

interface CourseTenant {
  id?: string;
  tenantId?: string;
  tenantName?: string;
  [key: string]: any;
}

interface CourseTenantState {
  tenants: CourseTenant[];

  setTenants: (
    tenants: CourseTenant[]
  ) => void;

  addTenant: (
    tenant: CourseTenant
  ) => void;

  updateTenant: (
    tenant: CourseTenant
  ) => void;

  deleteTenant: (
    id: string
  ) => void;

  clearTenants: () => void;
}

export const useCourseTenantStore =
  create<CourseTenantState>(
    (set) => ({
      tenants: [],

      setTenants: (
        tenants
      ) =>
        set({
          tenants,
        }),

      addTenant: (
        tenant
      ) =>
        set((state) => ({
          tenants: [
            ...state.tenants.filter(
              (t) =>
                t.id !== tenant.id
            ),
            tenant,
          ],
        })),

      updateTenant: (
        tenant
      ) =>
        set((state) => ({
          tenants:
            state.tenants.map(
              (t) =>
                t.id === tenant.id
                  ? {
                      ...t,
                      ...tenant,
                    }
                  : t
            ),
        })),

      deleteTenant: (
        id
      ) =>
        set((state) => ({
          tenants:
            state.tenants.filter(
              (t) => t.id !== id
            ),
        })),

      clearTenants: () =>
        set({
          tenants: [],
        }),
    })
  );