// src/store/lesson/lessonTenantStore.ts

import { create } from "zustand";

export interface LessonTenant {
  id?: string;
  tenantId?: string;
  [key: string]: any;
}

interface LessonTenantState {
  tenants: LessonTenant[];

  setTenants: (
    tenants: LessonTenant[]
  ) => void;

  addTenant: (
    tenant: LessonTenant
  ) => void;

  updateTenant: (
    tenant: Partial<LessonTenant>
  ) => void;

  deleteTenant: (
    id: string
  ) => void;

  clearTenants: () => void;
}

export const useLessonTenantStore =
  create<LessonTenantState>(
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
                t.id !==
                tenant.id
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
                t.id ===
                tenant.id
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
              (t) =>
                t.id !== id
            ),
        })),

      clearTenants:
        () =>
          set({
            tenants: [],
          }),
    })
  );