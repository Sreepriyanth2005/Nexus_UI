// src/api/group/group.api.ts

import { api } from "../../config/axios";

export interface Group {
  id?: string;

  tenantId: string;

  name: string;

  description?: string;

  status?: string;

  keycloakGroupId?: string;

  keycloakPath?: string;

  userIds?: string[];

  assignNoDepartmentUsers?: boolean;

  createdAt?: string;

  updatedAt?: string;

  _count?: {
    departmentUsers?: number;
  };
}

/**
 * CREATE DEPARTMENT PAYLOAD
 */
export interface CreateGroupPayload {
  name: string;

  description?: string;

  userIds?: string[];

  assignNoDepartmentUsers?: boolean;
}

/**
 * UPDATE DEPARTMENT PAYLOAD
 */
export interface UpdateGroupPayload {
  name?: string;

  description?: string;

  status?: string;

  userIds?: string[];
}

/**
 * GET TENANT GROUPS
 */
export const getGroupsApi = async (
  tenantId: string
): Promise<Group[]> => {
  const res = await api.get(
    `/tenants/${tenantId}/departments`
  );

  const groups =
    res.data?.departments ||
    res.data?.data?.departments ||
    res.data?.data ||
    [];

  return Array.isArray(groups)
    ? groups
    : [];
};

/**
 * GET DEPARTMENT BY ID
 */
export const getGroupByIdApi = async (
  tenantId: string,
  departmentId: string
): Promise<Group> => {
  const res = await api.get(
    `/tenants/${tenantId}/departments/${departmentId}`
  );

  return (
    res.data?.department ||
    res.data?.data ||
    res.data
  );
};

/**
 * CREATE DEPARTMENT
 */
export const createGroupApi = async (
  tenantId: string,
  data: CreateGroupPayload
): Promise<Group> => {
  const res = await api.post(
    `/tenants/${tenantId}/departments`,
    data
  );

  return (
    res.data?.department ||
    res.data?.data ||
    res.data
  );
};

/**
 * UPDATE DEPARTMENT
 */
export const updateGroupApi = async (
  tenantId: string,
  departmentId: string,
  data: UpdateGroupPayload
): Promise<Group> => {
  const res = await api.put(
    `/tenants/${tenantId}/departments/${departmentId}`,
    data
  );

  return (
    res.data?.department ||
    res.data?.data ||
    res.data
  );
};

/**
 * UPDATE STATUS
 */
export const updateGroupStatusApi = async (
  tenantId: string,
  departmentId: string,
  status: string
) => {
  const res = await api.patch(
    `/tenants/${tenantId}/departments/${departmentId}/status`,
    { status }
  );

  return res.data;
};

/**
 * DELETE DEPARTMENT
 */
export const deleteGroupApi = async (
  tenantId: string,
  departmentId: string
) => {
  const res = await api.delete(
    `/tenants/${tenantId}/departments/${departmentId}`
  );

  return res.data;
};

/**
 * GET TENANT DEPARTMENTS
 */
export const getTenantDepartmentsApi = async (
  tenantId: string
): Promise<Group[]> => {
  const res = await api.get(
    `/tenants/${tenantId}/departments`
  );

  const departments =
    res.data?.departments ||
    res.data?.data?.departments ||
    res.data?.data ||
    [];

  return Array.isArray(departments)
    ? departments
    : [];
};

/**
 * GET DEPARTMENT COUNT
 */
export const getDepartmentCountApi = async (
  tenantId: string
) => {
  const res = await api.get(
    `/tenants/${tenantId}/departments/count`
  );

  return res.data;
};

/**
 * GET DEPARTMENT METRICS
 */
export const getDepartmentMetricsApi = async (
  tenantId: string
) => {
  const res = await api.get(
    `/tenants/${tenantId}/departments/metrics`
  );

  return (
    res.data?.metrics ||
    res.data?.data ||
    res.data
  );
};

/**
 * FIND DEPARTMENT BY NAME
 */
export const getDepartmentByNameApi = async (
  tenantId: string,
  name: string
) => {
  const res = await api.get(
    `/tenants/${tenantId}/departments/by-name`,
    {
      params: { name },
    }
  );

  return (
    res.data?.department ||
    res.data?.data ||
    res.data
  );
};

/**
 * FIND DEPARTMENTS BY STATUS
 */
export const getDepartmentsByStatusApi = async (
  tenantId: string,
  status: string
): Promise<Group[]> => {
  const res = await api.get(
    `/tenants/${tenantId}/departments/status/${status}`
  );

  return (
    res.data?.departments ||
    res.data?.data ||
    []
  );
};

/**
 * GET USER COUNT
 */
export const getDepartmentUserCountApi = async (
  tenantId: string,
  departmentId: string
) => {
  const res = await api.get(
    `/tenants/${tenantId}/departments/${departmentId}/user-count`
  );

  return res.data;
};

/**
 * GET ACTIVE USER COUNT
 */
export const getDepartmentActiveUserCountApi = async (
  tenantId: string,
  departmentId: string
) => {
  const res = await api.get(
    `/tenants/${tenantId}/departments/${departmentId}/active-users`
  );

  return res.data;
};

/**
 * GET KEYCLOAK GROUP DETAILS
 */
export const getGroupDetailsApi = async (
  tenantId: string,
  departmentId: string
) => {
  const res = await api.get(
    `/tenants/${tenantId}/departments/${departmentId}/group`
  );

  return (
    res.data?.group ||
    res.data?.data ||
    res.data
  );
};

/**
 * GET KEYCLOAK GROUP MEMBERS
 */
export const getGroupMembersApi = async (
  tenantId: string,
  departmentId: string
) => {
  const res = await api.get(
    `/tenants/${tenantId}/departments/${departmentId}/group-members`
  );

  return (
    res.data?.members ||
    res.data?.data ||
    []
  );
};