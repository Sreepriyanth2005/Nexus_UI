// src/api/tenant-user/tenantuser.api.ts

import { api } from "../../config/axios";

/* ==========================================
   TYPES
========================================== */

export interface TenantUser {
  id?: string;
  email: string;
  firstName: string;
  lastName: string;
  roleId: string;
  roleCode?: string;
  roleName?: string;
  departmentId?: string;
  departmentIds?: string[];
  status?: string;
  courseCompleted?: number;
  password?: string;
  profileCompleteness?: number;
  createdAt?: string;
  lastLogin?: string;
  profile?: {
    firstName?: string;
    lastName?: string;
    countryName?: string;
  };
}

export interface BulkUser {
  email: string;
  firstName: string;
  lastName: string;
  roleName?: string;
  departmentName?: string;
  courseNames?: string;
  careerPathNames?: string;
  dueDate?: string;
}

export interface InviteHistoryItem {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  status: string;
  sentAt?: string;
  createdAt?: string;
}

export interface UserWithoutDepartment {
  id: string;
  email: string;
  keycloakId?: string;
  status: string;

  profile?: {
    firstName: string;
    lastName: string;
    mobileNumber?: string;
  };

  roles?: {
    role: {
      id: string;
      name: string;
      code: string;
    };
  }[];
}

export interface UsersWithoutDepartmentResponse {
  users: UserWithoutDepartment[];

  keycloakCheck: {
    userId: string;
    email: string;
    keycloakId: string;
    inSync: boolean;
  }[];

  summary: {
    totalUsersWithoutDept: number;
    inSyncWithKeycloak: number;
  };
}

/* ==========================================
   METRICS
   GET /tenant-users/metrics
========================================== */

export const getTenantUserMetricsApi = async () => {
  const res = await api.get("/tenant-users/metrics");
  return res.data;
};

/* ==========================================
   USER COUNTS
========================================== */

export const getUserCountApi = async () => {
  const res = await api.get("/tenant-users/count");
  return res.data;
};

export const getActiveUserCountApi = async () => {
  const res = await api.get("/tenant-users/count/active");
  return res.data;
};

export const getOverallUserCountApi = async () => {
  const res = await api.get("/tenant-users/count/overall");
  return res.data;
};

/* ==========================================
   ACTIVE USERS
   GET /tenant-users/active
========================================== */

export const getActiveUsersApi = async () => {
  const res = await api.get("/tenant-users/active");
  return res.data?.users || res.data?.data || [];
};

/* ==========================================
   FIND BY EMAIL
   GET /tenant-users/email?email=
========================================== */

export const getUserByEmailApi = async (email: string) => {
  const res = await api.get("/tenant-users/email", {
    params: { email },
  });
  return res.data;
};

/* ==========================================
   BULK CREATE
   POST /tenants/:tenantId/users/bulk
========================================== */

export const bulkCreateTenantUsersApi = async (
  tenantId: string,
  users: BulkUser[]
) => {
  const res = await api.post(`/tenants/${tenantId}/users/bulk`, { users });
  return res.data;
};

/* ==========================================
   CREATE USER
   POST /tenant-users
========================================== */

export const createTenantUserApi = async (payload: TenantUser) => {
  const res = await api.post("/tenant-users", payload);
  return res.data?.user || res.data?.data || res.data;
};

/* ==========================================
   LIST USERS
   GET /tenant-users
========================================== */

export const getTenantUsersApi = async () => {
  const res = await api.get("/tenant-users");
  const data = res.data;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.users)) return data.users;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.data?.users)) return data.data.users;
  if (Array.isArray(data?.data?.items)) return data.data.items;

  return [];
};

/* ==========================================
   LIST USERS BY TENANT ID
   GET /tenants/:tenantId/users
========================================== */

export const getTenantUsersByTenantIdApi = async (tenantId: string) => {
  const res = await api.get(`/tenants/${tenantId}/users`);
  const data = res.data?.data || res.data;
  return data?.items || (Array.isArray(data) ? data : []);
};

/* ==========================================
   GET USER BY ID
   GET /tenant-users/:userId
========================================== */

export const getTenantUserByIdApi = async (userId: string) => {
  const res = await api.get(`/tenant-users/${userId}`);
  const raw = res.data?.user || res.data?.data || res.data;
  // Normalize the raw user object so profileCompleteness is always accessible
  // even if TypeScript doesn't know the full shape of the backend response
  return {
    ...raw,
    profileCompleteness: raw?.profileCompleteness ?? 0,
    firstName: raw?.profile?.firstName || raw?.firstName || "",
    lastName: raw?.profile?.lastName || raw?.lastName || "",
    lastLogin: raw?.lastLogin || raw?.lifecycle?.lastLoginAt || raw?.firstLoginAt || "",
  } as TenantUser;
};

/* ==========================================
   GET INVITE HISTORY
   GET /tenants/:tenantId/invitations
========================================== */

export const getInviteHistoryApi = async (
  tenantId: string
): Promise<any> => {
  const res = await api.get(`/tenants/${tenantId}/invitations`);
  const payload = res.data;

  // New shape: { data: { config: {...}, invitations: [...] } }
  if (payload?.data?.invitations) return payload.data;
  
  // Legacy shape support
  if (Array.isArray(payload)) return { invitations: payload, config: null };
  if (Array.isArray(payload?.data)) return { invitations: payload.data, config: null };
  if (Array.isArray(payload?.invitations)) return { invitations: payload.invitations, config: null };
  if (Array.isArray(payload?.items)) return { invitations: payload.items, config: null };

  console.warn("getInviteHistoryApi: unexpected response shape", payload);
  return { invitations: [], config: null };
};

/* ==========================================
   RESEND INVITATION
   POST /tenant-invitations/resend/:invitationId
========================================== */

export const resendInviteApi = async (tenantId: string, invitationId: string) => {
  const res = await api.post(`/tenants/${tenantId}/invitations/resend/${invitationId}`);
  return res.data;
};

export const createInviteApi = async (tenantId: string, payload: { userId: string, type: string }) => {
  const res = await api.post(`/tenants/${tenantId}/invitations`, { ...payload, tenantId });
  return res.data;
};

/* ==========================================
   CANCEL INVITATION
   DELETE /tenant-invitations/:invitationId
========================================== */

export const cancelInviteApi = async (invitationId: string) => {
  const res = await api.delete(`/tenant-invitations/${invitationId}`);
  return res.data;
};

/* ==========================================
   UPDATE USER
   PUT /tenant-users/:userId
========================================== */

export const updateTenantUserApi = async (
  userId: string,
  payload: Partial<TenantUser>
) => {
  const res = await api.put(`/tenant-users/${userId}`, payload);
  return res.data?.user || res.data?.data || res.data;
};

/* ==========================================
   DELETE USER
   DELETE /tenant-users/:userId
========================================== */

export const deleteTenantUserApi = async (userId: string) => {
  const res = await api.delete(`/tenant-users/${userId}`);
  return res.data;
};

/* ==========================================
   UPDATE STATUS
   PATCH /tenant-users/:userId/status
========================================== */

export const updateTenantUserStatusApi = async (
  userId: string,
  status: string
) => {
  const res = await api.patch(`/tenant-users/${userId}/status`, { status });
  return res.data;
};

/* ==========================================
   ASSIGN ROLE
   POST /tenant-users/:userId/assign-role
========================================== */

export const assignRoleApi = async (userId: string, roleId: string) => {
  const res = await api.post(`/tenant-users/${userId}/assign-role`, {
    roleId,
  });
  return res.data;
};

/* ==========================================
   ASSIGN DEPARTMENTS
   POST /tenant-users/:userId/assign-departments
========================================== */

export const assignDepartmentsApi = async (
  userId: string,
  departmentIds: string[]
) => {
  const res = await api.post(`/tenant-users/${userId}/assign-departments`, {
    departmentIds,
  });
  return res.data;
};

/* ==========================================
   REMOVE DEPARTMENTS
   DELETE /tenant-users/:userId/remove-departments
========================================== */

export const removeDepartmentsApi = async (
  userId: string,
  departmentIds: string[]
) => {
  const res = await api.delete(`/tenant-users/${userId}/remove-departments`, {
    data: { departmentIds },
  });
  return res.data;
};

/* ==========================================
   USERS WITHOUT DEPARTMENT
   GET /tenant-users/without-department
========================================== */

export const getUsersWithoutDepartmentApi =
  async (): Promise<UsersWithoutDepartmentResponse> => {
    const res = await api.get("/tenant-users/without-department");
    return (
      res.data?.data ?? {
        users: [],
        keycloakCheck: [],
        summary: {
          totalUsersWithoutDept: 0,
          inSyncWithKeycloak: 0,
        },
      }
    );
  };

/* ==========================================
   LIST ADMINS BY TENANT ID
   GET /tenants/:tenantId/admins
========================================== */

export const getTenantAdminsByTenantIdApi = async (tenantId: string) => {
  const res = await api.get(`/tenants/${tenantId}/admins`);
  const data = res.data?.data || res.data;
  return data?.items || data?.admins || (Array.isArray(data) ? data : []);
};

export const updateTenantAdminApi = async (
  tenantId: string,
  adminId: string,
  payload: any
) => {
  const res = await api.put(`/tenants/${tenantId}/admins/${adminId}`, payload);
  return res.data?.data || res.data;
};