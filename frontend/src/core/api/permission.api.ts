// src/core/api/permission.api.ts

import { api } from "../../config/axios";

export interface PermissionDto {
  id: string;
  code: string;
  module: string;
  action: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PermissionListResponse {
  data: PermissionDto[];
  total?: number;
  page?: number;
  limit?: number;
}

export interface CreatePermissionPayload {
  code: string;
  module: string;
  action: string;
  description?: string;
}

export interface UpdatePermissionPayload {
  code?: string;
  module?: string;
  action?: string;
  description?: string;
}

export const SYSTEM_MODULES = [
  "USER",
  "ROLE",
  "PERMISSION",
  "TENANT",
  "DEPARTMENT",
  "COURSE",
  "LESSON",
  "QUIZ",
  "QUIZ_SUBMIT",
  "QUIZ_RESULT",
  "CAREERPATH",
  "WORKFLOW",
  "CONTENT",
  "REPORT",
  "DASHBOARD",
  "AUDIT",
] as const;

export const PERMISSION_ACTIONS = [
  "VIEW",
  "CREATE",
  "UPDATE",
  "DELETE",
  "EXPORT",
  "ASSIGN",
  "APPROVE",
  "PUBLISH",
  "ATTEMPT",
  "SUBMIT",
  "RESUME",
  "RETRY",
  "REVIEW",
  "REJECT",
  "ARCHIVE",
  "REASSIGN",
  "HISTORY",
  "ADMIN",
  "ANALYTICS",
  "REPORTS",
  "SECURITY_UPDATE",
  "OTP_CONFIG"
] as const;

export const getPermissionsApi = async (): Promise<PermissionDto[]> => {
  const res = await api.get("/rbac/permissions", {
    params: { limit: 100 },
  });
  return res.data?.data || res.data || [];
};

export const getPermissionByIdApi = async (id: string): Promise<PermissionDto> => {
  const res = await api.get(`/rbac/permissions/${id}`);
  return res.data?.data || res.data;
};

export const createPermissionApi = async (payload: CreatePermissionPayload): Promise<PermissionDto> => {
  const res = await api.post("/rbac/permissions", payload);
  return res.data?.data || res.data;
};

export const updatePermissionApi = async (
  id: string,
  payload: UpdatePermissionPayload
): Promise<PermissionDto> => {
  const res = await api.put(`/rbac/permissions/${id}`, payload);
  return res.data?.data || res.data;
};

export const deletePermissionApi = async (id: string): Promise<{ success: boolean; message: string }> => {
  const res = await api.delete(`/rbac/permissions/${id}`);
  return res.data;
};

export const getRolePermissionsApi = async (roleId: string): Promise<PermissionDto[]> => {
  const res = await api.get(`/rbac/permissions/role/${roleId}`);
  return res.data?.data || res.data || [];
};

export const getMyPermissionsApi = async (): Promise<PermissionDto[]> => {
  const res = await api.get("/rbac/permissions/my-permissions");
  return res.data?.data || res.data || [];
};
