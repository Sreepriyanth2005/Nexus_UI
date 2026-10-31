// src/api/tenant/tenant.api.ts

import { api } from "../../config/axios";
import { Group } from "./group.api";

export interface Tenant {
  id?: string;
  orgId?: string;
  activeUsers?: number;

  name: string;

  industryId: string;

  seatCount: number;

  country: string;

  contractStartDate?: string;

  contractEndDate?: string;

  status?: string;

  adminUser?: {
    firstName: string;
    lastName: string;
    email: string;
    mobileNumber: string;
    password?: string;
  };
}
// export interface TenantUser {
//   id: string;
//   firstName: string;
//   lastName: string;
//   email: string;
//   status: string;
//   createdAt?: string;
//   lastLoginAt?: string;

//   role?: {
//     id: string;
//     name: string;
//   };

// export const getTenantUsersApi = async (
//   tenantId: string
// ): Promise<TenantUser[]> => {
//   const res = await api.get(
//     `/tenants/${tenantId}/users`
//   );

//   console.log(
//     "Tenant Users Response",
//     res.data
//   );

//   return (
//     res.data?.users ||
//     res.data?.data?.users ||
//     res.data?.data ||
//     []
//   );
// };
/**
 * GET ALL TENANTS
 * GET /tenants
 */
export const getTenantsApi = async (): Promise<Tenant[]> => {
  const res = await api.get("/tenants?limit=500");

  return (
    res.data?.tenants ||
    res.data?.data ||
    []
  );
};

/**
 * GET TENANT BY ID
 * GET /tenants/:tenantId
 */
export const getTenantByIdApi = async (
  tenantId: string
): Promise<Tenant> => {
  const res = await api.get(
    `/tenants/${tenantId}`
  );

  return (
    res.data?.tenant ||
    res.data?.data ||
    res.data
  );
};

/**
 * CREATE TENANT
 * POST /tenants
 */
export const createTenantApi = async (
  data: Omit<Tenant, "id">
): Promise<Tenant> => {
  const res = await api.post(
    "/tenants",
    data
  );

  return (
    res.data?.tenant ||
    res.data?.data ||
    res.data
  );
};

/**
 * UPDATE TENANT
 * PUT /tenants/:tenantId
 */
export const updateTenantApi = async (
  tenantId: string,
  data: Partial<Tenant>
): Promise<Tenant> => {
  const res = await api.put(
    `/tenants/${tenantId}`,
    data
  );

  return (
    res.data?.tenant ||
    res.data?.data ||
    res.data
  );
};

/**
 * UPDATE TENANT STATUS
 * PATCH /tenants/:tenantId/status
 */
export const updateTenantStatusApi = async (
  tenantId: string,
  status: string
) => {
  const res = await api.patch(
    `/tenants/${tenantId}/status`,
    { status }
  );

  return res.data;
};

/**
 * DEACTIVATE TENANT
 * PATCH /tenants/:tenantId/deactivate
 */
export const deactivateTenantApi = async (
  tenantId: string
) => {
  const res = await api.patch(
    `/tenants/${tenantId}/deactivate`
  );

  return res.data;
};

/**
 * ARCHIVE TENANT
 * PATCH /tenants/:tenantId/archive
 */
export const archiveTenantApi = async (
  tenantId: string
) => {
  const res = await api.patch(
    `/tenants/${tenantId}/archive`
  );

  return res.data;
};

/**
 * GET TENANT METRICS
 * GET /tenants/:tenantId/metrics
 */
export const getTenantMetricsApi = async (
  tenantId: string
) => {
  const res = await api.get(
    `/tenants/${tenantId}/metrics`
  );

  return (
    res.data?.metrics ||
    res.data?.data ||
    res.data
  );
};

export const getTenantGroupsApi = async (
  tenantId: string
): Promise<Group[]> => {
  const res = await api.get(
    `/tenants/${tenantId}/groups`
  );

  console.log(
    "Groups Response",
    res.data
  );

  const group =
    res.data?.data?.group;

  return group ? [group] : [];
};

/**
 * DELETE ALL USERS OF TENANT
 * DELETE /tenants/:tenantId/users
 */
export const deleteTenantUsersApi = async (
  tenantId: string
) => {
  const res = await api.delete(
    `/tenants/${tenantId}/users`
  );

  return res.data;
};

/**
 * DELETE TENANT
 * DELETE /tenants/:tenantId
 */
export const deleteTenantApi = async (
  tenantId: string
): Promise<{ success: boolean }> => {
  const res = await api.delete(
    `/tenants/${tenantId}`
  );

  return res.data;
};

/**
 * GET ALL TENANTS DASHBOARD
 * GET /tenants/dashboard
 */
export const getTenantsDashboardApi =
  async () => {
    const res = await api.get(
      "/tenants/dashboard"
    );

    return (
      res.data?.data ||
      res.data
    );
  };

/**
 * GET TENANT DASHBOARD
 * GET /tenants/:tenantId/dashboard
 */
export const getTenantDashboardApi =
  async (tenantId: string) => {
    const res = await api.get(
      `/tenants/${tenantId}/dashboard`
    );

    return (
      res.data?.data ||
      res.data
    );
  };

export const getTenantDashboardStatsApi = async (params: string | { tenantId: string; period?: string }) => {
  const tenantId = typeof params === 'string' ? params : params?.tenantId || '';
  const period = typeof params === 'object' ? params?.period : undefined;

  const queryParams = new URLSearchParams({ tenantId });
  if (period) {
    queryParams.append('period', period);
  }

  const res = await api.get(
    `/reporting/tenant-dashboard-stats?${queryParams.toString()}`
  );

  return (
    res.data?.data ||
    res.data
  );
};