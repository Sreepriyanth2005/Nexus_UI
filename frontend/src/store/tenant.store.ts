import { create } from "zustand";

import type { Tenant } from "../core/api/tenant.api";

type TenantState = {
  tenants: Tenant[];

  dashboardSummary: any;

  tenantDashboard: any;

  tenantDashboardStats: any;

  loading: boolean;

  error: string | null;

  setTenants: (
    tenants: Tenant[]
  ) => void;

  addTenant: (
    tenant: Tenant
  ) => void;

  updateTenant: (
    tenant: Tenant
  ) => void;

  deleteTenant: (
    id: string
  ) => void;

  setDashboardSummary: (
    data: any
  ) => void;

  setTenantDashboard: (
    data: any
  ) => void;

  setTenantDashboardStats: (
    data: any
  ) => void;

  setLoading: (
    loading: boolean
  ) => void;

  setError: (
    error: string | null
  ) => void;

  clearTenants: () => void;

  clearDashboard: () => void;
};

export const useTenantStore =
  create<TenantState>((set) => ({
    tenants: [],

    dashboardSummary: null,

    tenantDashboard: null,

    tenantDashboardStats: null,

    loading: false,

    error: null,

    setTenants: (tenants) =>
      set({
        tenants: Array.isArray(
          tenants
        )
          ? tenants
          : [],
      }),

    addTenant: (tenant) =>
      set((state) => {
        const exists =
          state.tenants.some(
            (t) =>
              t.id === tenant.id
          );

        if (exists) {
          return {
            tenants:
              state.tenants,
          };
        }

        return {
          tenants: [
            tenant,
            ...state.tenants,
          ],
        };
      }),

    updateTenant: (
      updatedTenant
    ) =>
      set((state) => ({
        tenants:
          state.tenants.map(
            (tenant) =>
              tenant.id ===
              updatedTenant.id
                ? {
                    ...tenant,
                    ...updatedTenant,
                  }
                : tenant
          ),
      })),

    deleteTenant: (id) =>
      set((state) => ({
        tenants:
          state.tenants.filter(
            (tenant) =>
              tenant.id !== id
          ),
      })),

    setDashboardSummary: (
      data
    ) =>
      set({
        dashboardSummary:
          data,
      }),

    setTenantDashboard: (
      data
    ) =>
      set({
        tenantDashboard:
          data,
      }),

    setTenantDashboardStats: (
      data
    ) =>
      set({
        tenantDashboardStats:
          data,
      }),

    setLoading: (loading) =>
      set({ loading }),

    setError: (error) =>
      set({ error }),

    clearTenants: () =>
      set({
        tenants: [],
      }),

    clearDashboard: () =>
      set({
        dashboardSummary:
          null,

        tenantDashboard:
          null,

        tenantDashboardStats:
          null,

        error: null,
      }),
  }));