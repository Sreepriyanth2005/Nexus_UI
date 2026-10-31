// src/hooks/useRolesPermissions.ts

import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getInternalUsers } from "../core/api/internal-user/internalUser.api";
import {
  getRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
  getSystemRoles,
  assignPermissionToRole,
  removePermissionFromRole,
  CreateRolePayload,
  UpdateRolePayload,
} from "../core/api/role.api";
import {
  getPermissionsApi,
  getPermissionByIdApi,
  createPermissionApi,
  updatePermissionApi,
  deletePermissionApi,
  getRolePermissionsApi,
  PermissionDto,
  CreatePermissionPayload,
  UpdatePermissionPayload,
} from "../core/api/permission.api";
import { mapUserToViewModel, mapPermissionMatrix, PermissionMatrixRow } from "../core/mappers/rolesPermissions.mapper";

export const rolesPermissionsKeys = {
  all: ["rolesPermissions"] as const,
  users: () => [...rolesPermissionsKeys.all, "users"] as const,
  roles: () => [...rolesPermissionsKeys.all, "roles"] as const,
  roleDetail: (id: string) => [...rolesPermissionsKeys.roles(), "detail", id] as const,
  permissions: () => [...rolesPermissionsKeys.all, "permissions"] as const,
  permissionDetail: (id: string) => [...rolesPermissionsKeys.permissions(), "detail", id] as const,
  rolePermissions: (roleId: string) => [...rolesPermissionsKeys.all, "rolePermissions", roleId] as const,
  systemRoles: () => [...rolesPermissionsKeys.all, "systemRoles"] as const,
};

export const usePlatformUsers = () => {
  return useQuery({
    queryKey: rolesPermissionsKeys.users(),
    queryFn: async () => {
      const users = await getInternalUsers({ limit: 100 });
      return users.map(mapUserToViewModel);
    },
  });
};

export const useRoles = () => {
  return useQuery({
    queryKey: rolesPermissionsKeys.roles(),
    queryFn: () => getRoles(),
  });
};

export const useSystemRoles = () => {
  return useQuery({
    queryKey: rolesPermissionsKeys.systemRoles(),
    queryFn: () => getSystemRoles(),
  });
};

export const useRole = (id: string | null) => {
  return useQuery({
    queryKey: rolesPermissionsKeys.roleDetail(id || ""),
    queryFn: () => getRoleById(id!),
    enabled: !!id,
  });
};

export const useCreateRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateRolePayload) => createRole(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rolesPermissionsKeys.roles() });
      queryClient.invalidateQueries({ queryKey: ["permission-matrix"] });
      queryClient.invalidateQueries({ queryKey: ["role-permissions"] });
      queryClient.invalidateQueries({ queryKey: rolesPermissionsKeys.all });
    },
  });
};

export const useCreateCustomRole = useCreateRole;

export const useUpdateRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateRolePayload }) =>
      updateRole(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: rolesPermissionsKeys.roles() });
      queryClient.invalidateQueries({ queryKey: rolesPermissionsKeys.roleDetail(variables.id) });
      queryClient.invalidateQueries({ queryKey: ["permission-matrix"] });
      queryClient.invalidateQueries({ queryKey: ["role-permissions"] });
      queryClient.invalidateQueries({ queryKey: rolesPermissionsKeys.all });
    },
  });
};

export const useDeleteRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteRole(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rolesPermissionsKeys.roles() });
      queryClient.invalidateQueries({ queryKey: ["permission-matrix"] });
      queryClient.invalidateQueries({ queryKey: ["role-permissions"] });
      queryClient.invalidateQueries({ queryKey: rolesPermissionsKeys.all });
    },
  });
};

export const useAssignPermissionToRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ roleId, permissionId }: { roleId: string; permissionId: string }) =>
      assignPermissionToRole(roleId, permissionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rolesPermissionsKeys.roles() });
      queryClient.invalidateQueries({ queryKey: ["permission-matrix"] });
      queryClient.invalidateQueries({ queryKey: ["role-permissions"] });
      queryClient.invalidateQueries({ queryKey: rolesPermissionsKeys.all });
    },
  });
};

export const useRemovePermissionFromRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ roleId, permissionId }: { roleId: string; permissionId: string }) =>
      removePermissionFromRole(roleId, permissionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rolesPermissionsKeys.roles() });
      queryClient.invalidateQueries({ queryKey: ["permission-matrix"] });
      queryClient.invalidateQueries({ queryKey: ["role-permissions"] });
      queryClient.invalidateQueries({ queryKey: rolesPermissionsKeys.all });
    },
  });
};

export const usePermissions = () => {
  return useQuery({
    queryKey: rolesPermissionsKeys.permissions(),
    queryFn: () => getPermissionsApi(),
  });
};

export const usePermission = (id: string | null) => {
  return useQuery({
    queryKey: rolesPermissionsKeys.permissionDetail(id || ""),
    queryFn: () => getPermissionByIdApi(id!),
    enabled: !!id,
  });
};

export const useCreatePermission = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreatePermissionPayload) => createPermissionApi(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rolesPermissionsKeys.permissions() });
      queryClient.invalidateQueries({ queryKey: ["permission-matrix"] });
      queryClient.invalidateQueries({ queryKey: rolesPermissionsKeys.all });
    },
  });
};

export const useUpdatePermission = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdatePermissionPayload }) =>
      updatePermissionApi(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: rolesPermissionsKeys.permissions() });
      queryClient.invalidateQueries({ queryKey: rolesPermissionsKeys.permissionDetail(variables.id) });
      queryClient.invalidateQueries({ queryKey: ["permission-matrix"] });
      queryClient.invalidateQueries({ queryKey: rolesPermissionsKeys.all });
    },
  });
};

export const useDeletePermission = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deletePermissionApi(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rolesPermissionsKeys.permissions() });
      queryClient.invalidateQueries({ queryKey: ["permission-matrix"] });
      queryClient.invalidateQueries({ queryKey: rolesPermissionsKeys.all });
    },
  });
};

const EMPTY_ARRAY: any[] = [];

export const usePermissionMatrix = () => {
  const { data: roles = EMPTY_ARRAY, isLoading: rolesLoading } = useRoles();
  const { data: permissions = EMPTY_ARRAY, isLoading: permissionsLoading } = usePermissions();

  const matrixQuery = useQuery({
    queryKey: ["permission-matrix", roles.length, permissions.length],
    queryFn: async () => {
      const rolePermissionsMap: Record<string, string[]> = {};

      await Promise.all(
        roles.map(async (role) => {
          try {
            const rolePerms = await getRolePermissionsApi(role.id);
            const permIds = rolePerms.map((p: any) => p.permissionId || p.permission?.id || p.id || p.code).filter(Boolean);
            rolePermissionsMap[role.code] = permIds;
            rolePermissionsMap[role.code.toUpperCase()] = permIds;
          } catch (e) {
            console.warn(`Could not fetch permissions for role ${role.code}:`, e);
            rolePermissionsMap[role.code] = [];
          }
        })
      );

      return mapPermissionMatrix(permissions, rolePermissionsMap, roles);
    },
    enabled: roles.length > 0 && permissions.length > 0,
  });

  const fallbackMatrix = useMemo(
    () => mapPermissionMatrix(permissions, {}, roles),
    [permissions, roles]
  );

  return {
    matrix: matrixQuery.data || fallbackMatrix,
    isLoading: rolesLoading || permissionsLoading || matrixQuery.isLoading,
    isError: matrixQuery.isError,
    refetch: matrixQuery.refetch,
  };
};

export const useToggleRolePermission = () => {
  const assignMutation = useAssignPermissionToRole();
  const removeMutation = useRemovePermissionFromRole();

  return useMutation({
    mutationFn: async ({
      roleId,
      permissionId,
      assigned,
    }: {
      roleId: string;
      permissionId: string;
      assigned: boolean;
    }) => {
      if (assigned) {
        return assignMutation.mutateAsync({ roleId, permissionId });
      } else {
        return removeMutation.mutateAsync({ roleId, permissionId });
      }
    },
  });
};


