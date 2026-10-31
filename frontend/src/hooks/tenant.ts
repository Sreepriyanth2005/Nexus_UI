import { useMutation } from "@tanstack/react-query";

import {
  getTenantsApi,
  getTenantByIdApi,
  createTenantApi,
  updateTenantApi,
  deleteTenantApi,
  updateTenantStatusApi,
  deactivateTenantApi,
  archiveTenantApi,
  getTenantMetricsApi,
  getTenantGroupsApi,
  deleteTenantUsersApi,
  getTenantsDashboardApi,
  getTenantDashboardApi,
  getTenantDashboardStatsApi,
} from "../core/api/tenant.api";

import {
  getTenantUsersByTenantIdApi,
  getTenantAdminsByTenantIdApi,
} from "../core/api/tenantuser.api";

// ─────────────────────────────────────────────
// TENANTS
// ─────────────────────────────────────────────

export const useGetTenants = () => {
  return useMutation({
    mutationFn: getTenantsApi,
  });
};

export const useGetTenantById = () => {
  return useMutation({
    mutationFn: getTenantByIdApi,
  });
};

// ─────────────────────────────────────────────
// CREATE / UPDATE
// ─────────────────────────────────────────────

export const useCreateTenant = () => {
  return useMutation({
    mutationFn: createTenantApi,
  });
};

export const useUpdateTenant = () => {
  return useMutation({
    mutationFn: ({
      tenantId,
      data,
    }: {
      tenantId: string;
      data: any;
    }) =>
      updateTenantApi(
        tenantId,
        data
      ),
  });
};

// ─────────────────────────────────────────────
// STATUS
// ─────────────────────────────────────────────

export const useUpdateTenantStatus =
  () => {
    return useMutation({
      mutationFn: ({
        tenantId,
        status,
      }: {
        tenantId: string;
        status: string;
      }) =>
        updateTenantStatusApi(
          tenantId,
          status
        ),
    });
  };

export const useDeactivateTenant =
  () => {
    return useMutation({
      mutationFn:
        deactivateTenantApi,
    });
  };

export const useArchiveTenant =
  () => {
    return useMutation({
      mutationFn:
        archiveTenantApi,
    });
  };

// ─────────────────────────────────────────────
// METRICS
// ─────────────────────────────────────────────

export const useTenantMetrics =
  () => {
    return useMutation({
      mutationFn:
        getTenantMetricsApi,
    });
  };

// ─────────────────────────────────────────────
// GROUPS
// ─────────────────────────────────────────────

export const useTenantGroups =
  () => {
    return useMutation({
      mutationFn:
        getTenantGroupsApi,
    });
  };

// ─────────────────────────────────────────────
// DELETE
// ─────────────────────────────────────────────

export const useDeleteTenantUsers =
  () => {
    return useMutation({
      mutationFn:
        deleteTenantUsersApi,
    });
  };

export const useDeleteTenant = () => {
  return useMutation({
    mutationFn: deleteTenantApi,
  });
};

// ─────────────────────────────────────────────
// DASHBOARD
// ─────────────────────────────────────────────

export const useTenantsDashboard =
  () => {
    return useMutation({
      mutationFn:
        getTenantsDashboardApi,
    });
  };

export const useTenantDashboard =
  () => {
    return useMutation({
      mutationFn:
        getTenantDashboardApi,
    });
  };

export const useTenantDashboardStats = () => {
  return useMutation({
    mutationFn: getTenantDashboardStatsApi,
  });
};

// ─────────────────────────────────────────────
// USERS & ADMINS BY TENANT
// ─────────────────────────────────────────────

export const useTenantUsersByTenantId = () => {
  return useMutation({
    mutationFn: getTenantUsersByTenantIdApi,
  });
};

export const useTenantAdminsByTenantId = () => {
  return useMutation({
    mutationFn: getTenantAdminsByTenantIdApi,
  });
};