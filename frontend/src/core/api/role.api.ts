// src/core/api/role.api.ts

import { api } from "../../config/axios";

export interface Role {
  id: string;
  name: string;
  code: string;
  description?: string;
  isSystemRole?: boolean;
  isActive?: boolean;
  tenantId?: string | null;
  createdAt?: string;
  updatedAt?: string;
  created_at: string;
  updated_at: string;
}

export interface AssignRolePayload {
  userId: string;
  roleCode: string;
  assignedBy?: string;
  tenantId?: string | null;
  /** ISO date string. If provided, the role assignment expires at this time. */
  expiresAt?: string | null;
}

export interface SetRoleExpiryPayload {
  userId: string;
  roleCode: string;
  /** ISO date string. Pass null to remove the expiry (make permanent). */
  expiresAt: string | null;
}

export interface CreateRolePayload {
  code: string;
  name: string;
  description?: string;
  isSystemRole?: boolean;
  tenantId?: string | null;
  permissionIds?: string[];
  userIds?: string[];
}

export interface UpdateRolePayload {
  name?: string;
  description?: string;
  isActive?: boolean;
  permissionIds?: string[];
  userIds?: string[];
}

export const getRoles = async (): Promise<Role[]> => {
  const response = await api.get("/rbac/roles");
  return response.data?.data || response.data || [];
};

export const getSystemRoles = async (): Promise<string[]> => {
  const response = await api.get("/rbac/roles/system");
  return response.data?.data || [];
};

export const getRoleById = async (id: string): Promise<Role> => {
  const response = await api.get(`/rbac/roles/${id}`);
  return response.data?.data || response.data;
};

export const createRole = async (payload: CreateRolePayload): Promise<Role> => {
  const response = await api.post("/rbac/roles", payload);
  return response.data?.data || response.data;
};

export const updateRole = async (
  id: string,
  payload: UpdateRolePayload
): Promise<Role> => {
  const response = await api.patch(`/rbac/roles/${id}`, payload);
  return response.data?.data || response.data;
};

export const deleteRole = async (id: string): Promise<{ success: boolean; message: string }> => {
  const response = await api.delete(`/rbac/roles/${id}`);
  return response.data;
};

export const assignRoleToUser = async (
  payload: AssignRolePayload
): Promise<{ success: boolean; message: string; data?: { expiresAt: string | null } }> => {
  const response = await api.post("/rbac/roles/users/assign", payload);
  return response.data;
};

export const removeRoleFromUser = async (
  userId: string,
  roleCode: string
): Promise<{ success: boolean; message: string }> => {
  const response = await api.delete("/rbac/roles/users/remove", { data: { userId, roleCode } });
  return response.data;
};

/**
 * Set or update the expiry date on an existing role assignment.
 * Pass expiresAt: null to remove the expiry and make the role permanent.
 */
export const setRoleExpiry = async (
  payload: SetRoleExpiryPayload
): Promise<{ success: boolean; message: string; data?: { userId: string; roleCode: string; expiresAt: string | null } }> => {
  const response = await api.patch("/rbac/roles/users/expiry", payload);
  return response.data;
};

export const assignPermissionToRole = async (
  roleId: string,
  permissionId: string
): Promise<{ success: boolean; message: string }> => {
  const response = await api.post(`/rbac/roles/${roleId}/permissions/${permissionId}`);
  return response.data;
};

export const removePermissionFromRole = async (
  roleId: string,
  permissionId: string
): Promise<{ success: boolean; message: string }> => {
  const response = await api.delete(`/rbac/roles/${roleId}/permissions/${permissionId}`);
  return response.data;
};
