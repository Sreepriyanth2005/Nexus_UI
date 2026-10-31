// src/pages/SuperAdmin/RolesPermissions.tsx

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Modal, Form, Input, Select, notification, Spin, Dropdown, MenuProps } from "antd";
import { Plus, Search, MoreHorizontal, Shield, UserCheck, RefreshCw, Edit2, Trash2, Check, Info, Clock, Users } from "lucide-react";
import { Skeleton } from "../../components/ui/Skeleton/Skeleton";

import { useRolesPermissionsStore } from "../../store/rolesPermissions.store";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { activateInternalUser, deactivateInternalUser, replaceRoles } from "../../core/api/internal-user/internalUser.api";
import { setRoleExpiry } from "../../core/api/role.api";
import UserDetailView from "./UserDetailView";
import {
  usePlatformUsers,
  useRoles,
  usePermissions,
  usePermission,
  usePermissionMatrix,
  useToggleRolePermission,
  useCreateCustomRole,
  useCreatePermission,
  useUpdatePermission,
  useDeletePermission,
  rolesPermissionsKeys,
} from "../../hooks/useRolesPermissions";
import { BASE_PERSONAS, PlatformUserViewModel, PermissionMatrixRow } from "../../core/mappers/rolesPermissions.mapper";
import { SYSTEM_MODULES, PERMISSION_ACTIONS } from "../../core/api/permission.api";


export const RolesPermissions: React.FC = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [permissionForm] = Form.useForm();
  const [editRoleForm] = Form.useForm();

  const queryClient = useQueryClient();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      if (status.toUpperCase() === "ACTIVE") {
        return deactivateInternalUser(id);
      }
      return activateInternalUser(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rolesPermissionsKeys.users() });
      notification.success({ title: "Status updated successfully", duration: 2 });
    },
    onError: (err: any) => {
      notification.error({ title: "Failed to update status", description: err?.message });
    }
  });

  const editRoleMutation = useMutation({
    mutationFn: async ({ id, roleCode }: { id: string; roleCode: string }) => {
      return replaceRoles(id, [roleCode]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rolesPermissionsKeys.users() });
      notification.success({ title: "Role updated successfully", duration: 2 });
      setEditingUserId(null);
    },
    onError: (err: any) => {
      notification.error({ title: "Failed to update role", description: err?.message });
    }
  });

  // --- Expiry modal state ---
  const [expiryModalUser, setExpiryModalUser] = useState<PlatformUserViewModel | null>(null);
  const [expiryDate, setExpiryDate] = useState<string>("");

  const setExpiryMutation = useMutation({
    mutationFn: async ({ userId, roleCode, expiresAt }: { userId: string; roleCode: string; expiresAt: string | null }) => {
      return setRoleExpiry({ userId, roleCode, expiresAt });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rolesPermissionsKeys.users() });
      notification.success({ title: "Role expiry updated", description: "The role assignment expiry has been set.", duration: 3 });
      setExpiryModalUser(null);
      setExpiryDate("");
    },
    onError: (err: any) => {
      notification.error({ title: "Failed to set expiry", description: err?.response?.data?.message || err?.message });
    }
  });

  const {
    searchQuery,
    selectedRoleFilter,
    selectedStatusFilter,
    isCustomRoleModalOpen,
    selectedPermission,
    editingPermissionId,
    isPermissionDialogOpen,
    isDeleteDialogOpen,
    setSearchQuery,
    setSelectedRoleFilter,
    setSelectedStatusFilter,
    setCustomRoleModalOpen,
    setSelectedPermission,
    setEditingPermissionId,
    setPermissionDialogOpen,
    setDeleteDialogOpen,
  } = useRolesPermissionsStore();

  const { data: apiUsers, isLoading: usersLoading } = usePlatformUsers();
  const { data: roles = [] } = useRoles();
  const { matrix: fetchedMatrix, isLoading: matrixLoading, refetch: refetchMatrix } = usePermissionMatrix();
  const toggleMutation = useToggleRolePermission();
  const createRoleMutation = useCreateCustomRole();

  const createPermissionMutation = useCreatePermission();
  const updatePermissionMutation = useUpdatePermission();
  const deletePermissionMutation = useDeletePermission();
  const { data: permissionDetail } = usePermission(editingPermissionId);

  // Populate edit form when detail finishes loading
  useEffect(() => {
    if (editingPermissionId && permissionDetail) {
      permissionForm.setFieldsValue({
        code: permissionDetail.code,
        module: permissionDetail.module,
        action: permissionDetail.action,
        description: permissionDetail.description || "",
      });
    }
  }, [editingPermissionId, permissionDetail, permissionForm]);

  // Matrix override state for immediate UI response with failure rollback
  const [matrixOverrides, setMatrixOverrides] = useState<Record<string, boolean>>({});

  // Calculate total admin users for the stat card
  const totalAdminUsers = React.useMemo(() => {
    const list = apiUsers || [];
    const adminRoleCodes = ["SUPER_ADMIN", "CONTENT_DEVELOPER", "SME", "SUBJECT_MATTER_EXPERT", "MEMBER", "SUPER ADMIN", "CONTENT DEVELOPER", "SUBJECT MATTER EXPERT", "MEMBER"];
    return list.filter((user) => {
      const userRoles = (user.rawRoles && user.rawRoles.length > 0) ? user.rawRoles : [user.roleCode || user.role];
      return userRoles.some(r => adminRoleCodes.includes((r || "").toUpperCase()));
    }).length;
  }, [apiUsers]);

  // Display users
  const users = React.useMemo(() => {
    const list = apiUsers || [];
    return list.filter((user) => {
      // Only include specific admin personas
      const adminRoleCodes = ["SUPER_ADMIN", "CONTENT_DEVELOPER", "SME", "SUBJECT_MATTER_EXPERT", "MEMBER", "SUPER ADMIN", "CONTENT DEVELOPER", "SUBJECT MATTER EXPERT", "MEMBER"];
      const userRoles = (user.rawRoles && user.rawRoles.length > 0) ? user.rawRoles : [user.roleCode || user.role];
      const hasAdminRole = userRoles.some(r => adminRoleCodes.includes((r || "").toUpperCase()));
      
      if (!hasAdminRole) {
        return false;
      }

      const matchesSearch =
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase());
      
      let matchesRole = selectedRoleFilter === "ALL";
      if (!matchesRole) {
        const filterVal = selectedRoleFilter.toUpperCase();
        
        matchesRole = userRoles.some(r => {
          const upperRole = (r || "").toUpperCase();
          if (filterVal === "SUPER_ADMIN") {
            return upperRole.includes("SUPER ADMIN") || upperRole.includes("SUPER_ADMIN");
          } else if (filterVal === "CONTENT_DEVELOPER") {
            return upperRole.includes("CONTENT DEVELOPER") || upperRole.includes("CONTENT_DEVELOPER");
          } else if (filterVal === "SME") {
            return upperRole.includes("SUBJECT MATTER EXPERT") || upperRole.includes("SME") || upperRole.includes("SUBJECT_MATTER_EXPERT");
          } else if (filterVal === "MEMBER") {
            return upperRole.includes("MEMBER") || upperRole.includes("LEARNER");
          } else {
            return upperRole === filterVal || upperRole.includes(filterVal);
          }
        });
      }
      const matchesStatus =
        selectedStatusFilter === "ALL" ||
        user.status.toUpperCase() === selectedStatusFilter.toUpperCase();

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [apiUsers, searchQuery, selectedRoleFilter, selectedStatusFilter]);

  // Matrix rows calculation from backend perms
  const displayMatrix = React.useMemo(() => {
    return fetchedMatrix || [];
  }, [fetchedMatrix]);

  useEffect(() => {
    setMatrixOverrides(prev => Object.keys(prev).length === 0 ? prev : {});
  }, [fetchedMatrix]);

  const handleCheckboxToggle = async (
    permissionId: string,
    personaCode: string,
    currentValue: boolean
  ) => {
    const roleObj = roles.find((r) => r.code.toUpperCase() === personaCode.toUpperCase());
    const roleId = roleObj?.id || personaCode;
    const key = `${permissionId}_${personaCode}`;
    const nextValue = !currentValue;

    // Apply optimistic state
    setMatrixOverrides((prev) => ({ ...prev, [key]: nextValue }));

    try {
      await toggleMutation.mutateAsync({
        roleId,
        permissionId,
        assigned: nextValue,
      });

      notification.success({
        title: "Permission Updated",
        description: `Successfully updated permission for ${personaCode}.`,
        duration: 2,
      });
    } catch (err: any) {
      console.error(err);
      // Revert on API failure
      setMatrixOverrides((prev) => ({ ...prev, [key]: currentValue }));

      notification.error({
        title: "Permission Update Failed",
        description: err?.response?.data?.message || err?.message || "Failed to update role permission.",
      });
    }
  };

  const handleCreateRole = async (values: any) => {
    try {
      const rawCode = values.code || values.name || "";
      const code = rawCode.toUpperCase().trim().replace(/\s+/g, "_").replace(/[^A-Z0-9_]/g, "");
      await createRoleMutation.mutateAsync({
        name: values.name,
        code,
        description: values.description,
      });

      notification.success({
        title: "Custom Role Created",
        description: `Role "${values.name}" created successfully.`,
      });

      form.resetFields();
      setCustomRoleModalOpen(false);
      refetchMatrix();
    } catch (err: any) {
      console.error(err);
      notification.error({
        title: "Role Creation Failed",
        description: err?.response?.data?.message || err?.message || "Could not create custom role.",
      });
    }
  };

  const handleOpenCreatePermission = () => {
    setEditingPermissionId(null);
    setSelectedPermission(null);
    permissionForm.resetFields();
    setPermissionDialogOpen(true);
  };

  const handleOpenEditPermission = (row: any) => {
    setEditingPermissionId(row.permissionId);
    setSelectedPermission(row as any);
    permissionForm.setFieldsValue({
      code: row.code,
      module: row.module,
      action: row.action,
      description: row.description || "",
    });
    setPermissionDialogOpen(true);
  };

  const handleOpenDeletePermission = (row: any) => {
    setSelectedPermission(row as any);
    setDeleteDialogOpen(true);
  };

  const handleSavePermission = async (values: any) => {
    try {
      if (editingPermissionId) {
        await updatePermissionMutation.mutateAsync({
          id: editingPermissionId,
          payload: values,
        });
        notification.success({
          title: "Permission Updated",
          description: "Permission updated successfully.",
        });
      } else {
        await createPermissionMutation.mutateAsync(values);
        notification.success({
          title: "Permission Created",
          description: "New permission created successfully.",
        });
      }

      permissionForm.resetFields();
      setPermissionDialogOpen(false);
      setEditingPermissionId(null);
      setSelectedPermission(null);
      refetchMatrix();
    } catch (err: any) {
      console.error(err);
      notification.error({
        title: editingPermissionId ? "Permission Update Failed" : "Permission Creation Failed",
        description: err?.response?.data?.message || err?.message || "Operation failed.",
      });
    }
  };

  const handleConfirmDeletePermission = async () => {
    if (!selectedPermission) return;
    const permId = (selectedPermission as any).permissionId || selectedPermission.id;

    try {
      await deletePermissionMutation.mutateAsync(permId);
      notification.success({
        title: "Permission Deleted",
        description: "Permission deleted successfully.",
      });
      setDeleteDialogOpen(false);
      setSelectedPermission(null);
      refetchMatrix();
    } catch (err: any) {
      console.error(err);
      notification.error({
        title: "Permission Deletion Failed",
        description: err?.response?.data?.message || err?.message || "Failed to delete permission.",
      });
    }
  };

  const getUserActionMenu = (user: PlatformUserViewModel): MenuProps => ({
    items: [
      {
        key: "edit",
        label: <span className="text-[16px] text-gray-800">Edit</span>,
        onClick: () => {
          navigate(`/admin-create?id=${user.id}`);
        }
      },
      {
        key: "toggle-status",
        label: <span className="text-[16px] text-gray-800">{user.status.toUpperCase() === 'ACTIVE' ? 'Deactivate' : 'Activate'}</span>,
        onClick: () => toggleStatusMutation.mutate({ id: user.id, status: user.status })
      },

      {
        key: "view",
        label: <span className="text-[16px] text-gray-800">View</span>,
        onClick: () => setSelectedUserId(user.id)
      },
    ],
  });

  if (selectedUserId) {
    return (
      <UserDetailView
        userId={selectedUserId}
        userType="INTERNAL"
        onBack={() => setSelectedUserId(null)}
      />
    );
  }

  if (usersLoading || matrixLoading) {
    return (
      <div className="p-6 space-y-6 w-full min-h-screen bg-[var(--surface)]">
        <div className="space-y-2 mb-8">
          <Skeleton className="h-8 w-1/4 rounded-[var(--r-sm)]" />
          <Skeleton className="h-4 w-1/3 rounded-[var(--r-sm)]" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Skeleton className="h-[100px] rounded-[var(--r-lg)]" />
          <Skeleton className="h-[100px] rounded-[var(--r-lg)]" />
          <Skeleton className="h-[100px] rounded-[var(--r-lg)]" />
          <Skeleton className="h-[100px] rounded-[var(--r-lg)]" />
        </div>
        <Skeleton className="h-[400px] w-full rounded-xl" />
      </div>
    );
  }

  return (
    <>
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-4 clist-page-head gap-4 md:gap-0">
        <div>
          <p className="text-[length:var(--fs-label)] font-[var(--fw-bold)] font-serif tracking-widest text-[var(--ink-mute)] mb-1.5 uppercase">
            ACCESS CONTROL
          </p>
          <h1 className="roles-page-title text-[length:var(--fs-h1)] font-[var(--fw-extrabold)] text-[var(--ink)] mb-1.5">
            Roles & permissions
          </h1>
          <p className="text-[length:var(--fs-body)] text-[var(--ink-mute)]">
            Manage access control for Nexus platform users.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center w-full md:w-auto">
          <button
            onClick={handleOpenCreatePermission}
            className="border border-[var(--line-strong)] bg-[var(--paper)] text-[var(--ink)] text-[length:var(--fs-meta)] px-5 py-2.5 rounded-[var(--r-pill)] font-[var(--fw-semibold)] hover:bg-[var(--paper-2)] hover:-translate-y-0.5 transition-all w-full sm:w-auto"
          >
            + Create Permission
          </button>

          <button
            onClick={() => navigate("/role-create")}
            className="bg-[var(--hero-bg)] text-[var(--ink)] text-[length:var(--fs-meta)] px-[14px] py-2 rounded-[var(--r-pill)] font-[var(--fw-semibold)] border border-[var(--c-honey)] hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-hover)] w-full sm:w-auto"
          >
            + Add custom role
          </button>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-7 clist-stat-strip">
        {[
          {
            label: "Total users",
            value: totalAdminUsers,
            sub: "Active and inactive",
            iconBg: "bg-[var(--c-danger-wash)]",
            iconColor: "text-[var(--c-danger)]",
            icon: (
              <Users className="w-[18px] h-[18px]" />
            )
          },
          {
            label: "Base roles",
            value: "8",
            sub: "System default personas",
            iconBg: "bg-[var(--c-honey-wash)]",
            iconColor: "text-[var(--c-honey-text)]",
            icon: (
              <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            )
          },
          {
            label: "Custom roles",
            value: Math.max(0, (roles?.length || 8) - 8),
            sub: "Organization specific",
            iconBg: "bg-[var(--c-sage-wash)]",
            iconColor: "text-[var(--c-sage-text)]",
            icon: (
              <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            )
          },
          {
            label: "Total permissions",
            value: displayMatrix?.length || 0,
            sub: "Available access rights",
            iconBg: "bg-[var(--paper-2)]",
            iconColor: "text-[var(--ink-mute)]",
            icon: (
              <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            )
          },
        ].map((item, i) => (
          <div
            key={i}
            className="bg-[var(--paper)] border border-[var(--line-strong)] rounded-[var(--r-lg)] py-[18px] px-5 flex items-center gap-4 clist-stat-tile hover:-translate-y-1 hover:shadow-[var(--shadow-md)] hover:border-[var(--ink-mute)] transition-all duration-300"
          >
            <span className={`w-[38px] h-[38px] flex items-center justify-center rounded-[var(--r-md)] ${item.iconBg} ${item.iconColor} clist-st-ico`}>
              {item.icon}
            </span>
            <div>
              <h2 className="text-[length:var(--fs-h1)] font-[var(--fw-bold)] text-[var(--ink)] clist-st-value leading-none mb-1">
                {item.value}
              </h2>
              <p className="text-[length:var(--fs-meta)] font-[var(--fw-semibold)] text-[var(--ink-mute)] clist-st-label">
                {item.label}
              </p>
              <span className="text-[length:var(--fs-label)] text-[var(--ink-soft)] mt-[3px] block clist-st-sub">
                {item.sub}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* USERS TABLE */}
      <div className="bg-[var(--paper)] border border-[var(--line-strong)] rounded-[var(--r-lg)] mb-8">
        <div className="px-[22px] py-[16px] flex justify-between items-center bg-[var(--paper)] clist-card-head rounded-t-[var(--r-lg)]">
          <h3 className="font-[var(--fw-semibold)] text-[length:var(--fs-body)] text-[var(--ink)]">Platform users</h3>
          <span className="text-[length:var(--fs-meta)] font-[var(--fw-bold)] border border-[var(--line-strong)] px-[10px] py-[2px] rounded-[var(--r-pill)] text-[var(--ink-soft)] bg-[var(--paper)] clist-chip">{users.length} total</span>
        </div>

        {/* FILTERS */}
        <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4 px-5 pb-5 pt-2 clist-toolbar border-b border-[var(--line-strong)]">
          <div className="relative w-full lg:max-w-2xl">
            <div className="absolute inset-y-0 left-0 pl-[12px] flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search by name or email"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border border-[var(--line-strong)] rounded-[var(--r-md)] pl-[38px] pr-[14px] h-10 w-full bg-[var(--paper)] text-[length:var(--fs-meta)] text-[var(--ink)] outline-none"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative w-full sm:w-auto">
              <select
                value={selectedRoleFilter}
                onChange={(e) => setSelectedRoleFilter(e.target.value)}
                className="bg-[var(--paper)] border border-[var(--line-strong)] rounded-[var(--r-md)] pl-[14px] pr-[36px] h-10 w-full sm:w-[160px] outline-none text-[var(--ink)] text-[length:var(--fs-meta)] font-[var(--fw-medium)] clist-select hover:border-[var(--ink-mute)] focus:border-[var(--c-honey-text)] transition-all duration-300 cursor-pointer appearance-none"
              >
                <option value="ALL">Persona: All</option>
                <option value="SUPER_ADMIN">Super Admin</option>
                <option value="CONTENT_DEVELOPER">Content Developer</option>
                <option value="SME">Subject Matter Expert (SME)</option>
                <option value="MEMBER">Member (Learner)</option>
              </select>
              <div className="absolute inset-y-0 right-0 pr-[14px] flex items-center pointer-events-none">
                <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 1L5 5L9 1" stroke="var(--c-clay)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </div>
            </div>

            <div className="relative w-full sm:w-auto">
              <select
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value)}
                className="bg-[var(--paper)] border border-[var(--line-strong)] rounded-[var(--r-md)] pl-[14px] pr-[36px] h-10 w-full sm:w-[160px] outline-none text-[var(--ink)] text-[length:var(--fs-meta)] font-[var(--fw-medium)] clist-select hover:border-[var(--ink-mute)] focus:border-[var(--c-honey-text)] transition-all duration-300 cursor-pointer appearance-none"
              >
                <option value="ALL">Status: All</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
              <div className="absolute inset-y-0 right-0 pr-[14px] flex items-center pointer-events-none">
                <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 1L5 5L9 1" stroke="var(--c-clay)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </div>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-[800px]">
            <thead className="bg-[var(--paper)] border-b border-[var(--line-strong)]">
            <tr>
              <th className="text-left text-[length:var(--fs-label)] tracking-widest text-[var(--ink-mute)] px-[16px] py-[11px] font-[var(--fw-bold)] font-serif uppercase">
                USER <svg className="w-3 h-3 ml-1 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </th>
              <th className="text-left text-[length:var(--fs-label)] tracking-widest text-[var(--ink-mute)] px-[16px] py-[11px] font-[var(--fw-bold)] font-serif uppercase">ROLE</th>
              <th className="text-left text-[length:var(--fs-label)] tracking-widest text-[var(--ink-mute)] px-[16px] py-[11px] font-[var(--fw-bold)] font-serif uppercase">
                STATUS <svg className="w-3 h-3 ml-1 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </th>
              <th className="text-left text-[length:var(--fs-label)] tracking-widest text-[var(--ink-mute)] px-[16px] py-[11px] font-[var(--fw-bold)] font-serif uppercase">
                LAST ACTIVE <svg className="w-3 h-3 ml-1 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </th>
              <th className="text-center text-[length:var(--fs-label)] tracking-widest text-[var(--ink-mute)] px-[16px] py-[11px] font-[var(--fw-bold)] font-serif uppercase">
                COURSES <svg className="w-3 h-3 ml-1 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </th>
              <th className="text-right text-[length:var(--fs-label)] tracking-widest text-[var(--ink-mute)] px-[16px] py-[11px] font-[var(--fw-bold)] font-serif uppercase">ACTIONS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--line-strong)] font-serif">
            {usersLoading ? (
              <tr><td colSpan={6} className="text-center py-10 text-[var(--ink-mute)] font-[var(--fw-medium)]">Loading users...</td></tr>
            ) : (
              users.map((user) => {
                const userRoles = (user.rawRoles && user.rawRoles.length > 0) ? user.rawRoles : [user.roleCode || user.role];
                
                return (
                  <tr key={user.id} className="hover:bg-[var(--paper-2)] transition-colors">
                    <td className="px-[16px] py-[14px]">
                      <div className="font-[var(--fw-semibold)] text-[length:var(--fs-body)] text-[var(--ink)] font-sans">{user.name}</div>
                      <div className="text-[length:var(--fs-meta)] text-[var(--ink-mute)] font-serif">{user.email}</div>
                    </td>
                    <td className="px-[16px] py-[14px]">
                      <div className="flex flex-col gap-1">
                        <div className="flex flex-wrap gap-1">
                          {userRoles.map((r, idx) => {
                            let roleBg = "bg-[var(--paper-2)]";
                            let roleText = "text-[var(--ink-soft)]";
                            const upperRole = (r || "").toUpperCase();
                            let displayRole = (r || "").replace(/_/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');

                            if (upperRole.includes("SUPER ADMIN") || upperRole.includes("SUPER_ADMIN")) {
                              roleBg = "bg-[var(--ink)]";
                              roleText = "text-[var(--c-honey-soft)]";
                              displayRole = "Super Admin";
                            } else if (upperRole.includes("CONTENT DEVELOPER") || upperRole.includes("CONTENT_DEVELOPER")) {
                              roleBg = "bg-[var(--c-honey-wash)]";
                              roleText = "text-[var(--c-honey-text)]";
                              displayRole = "Content Developer";
                            } else if (upperRole.includes("SUBJECT MATTER EXPERT") || upperRole.includes("SME") || upperRole.includes("SUBJECT_MATTER_EXPERT")) {
                              roleBg = "bg-[var(--c-sage-wash)]";
                              roleText = "text-[var(--c-sage-text)]";
                              displayRole = "Subject Matter Expert";
                            } else if (upperRole.includes("CORPORATE") || upperRole.includes("ORG ADMIN") || upperRole.includes("ORG_ADMIN")) {
                              roleBg = "bg-[var(--c-danger-wash)]";
                              roleText = "text-[var(--c-danger)]";
                              displayRole = "Corporate Admin";
                            }

                            return (
                              <span key={idx} className={`inline-flex items-center px-[10px] py-[4px] rounded-[var(--r-pill)] text-[length:var(--fs-meta)] font-[var(--fw-bold)] font-sans ${roleBg} ${roleText} w-fit`}>
                                {displayRole}
                              </span>
                            );
                          })}
                        </div>
                        {user.expiresAt && (
                          <span
                            className={`inline-flex items-center gap-1 text-[length:var(--fs-meta)] font-[var(--fw-medium)] font-sans px-2 py-0.5 rounded-[var(--r-pill)] w-fit ${
                              new Date(user.expiresAt) < new Date()
                                ? "bg-[var(--c-danger-wash)] text-[var(--c-danger-deep)]"
                                : "bg-[var(--c-honey-wash)] text-[var(--c-honey-text)]"
                            }`}
                            title={`Role expires: ${new Date(user.expiresAt).toLocaleString()}`}
                          >
                            <Clock className="w-3 h-3" />
                            Expires {new Date(user.expiresAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-[16px] py-[14px]">
                      <div className="flex items-center gap-2">
                        <div className={`h-[6px] w-[6px] rounded-full ${user.status.toUpperCase() === 'ACTIVE' ? 'bg-[var(--c-sage-text)]' : 'bg-[var(--ink-mute)]'}`}></div>
                        <span className={`text-[length:var(--fs-meta)] font-[var(--fw-semibold)] font-sans ${user.status.toUpperCase() === 'ACTIVE' ? 'text-[var(--c-sage-text)]' : 'text-[var(--ink-mute)]'}`}>
                          {user.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-[16px] py-[14px] text-[length:var(--fs-meta)] font-[var(--fw-medium)] text-[var(--ink-soft)] font-serif">
                      {user.lastActive}
                    </td>
                    <td className="px-[16px] py-[14px] text-center text-[length:var(--fs-meta)] font-[var(--fw-bold)] text-[var(--ink)] font-serif">
                      {user.courses}
                    </td>
                    <td className="px-[16px] py-[14px] text-right">
                      <Dropdown menu={getUserActionMenu(user)} trigger={["click"]}>
                        <button className="text-[var(--ink-mute)] hover:text-[var(--ink)] px-2 py-1 cursor-pointer inline-flex items-center justify-center">
                          <MoreHorizontal className="w-[18px] h-[18px]" />
                        </button>
                      </Dropdown>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        </div>
      </div>

      {/* PERMISSIONS MATRIX */}
      <div className="bg-[var(--paper)] border border-[var(--line-strong)] rounded-[var(--r-lg)] mb-8 overflow-hidden">
        <div className="px-[22px] py-4 border-b border-[var(--line-strong)] flex justify-between items-center bg-[var(--paper)] clist-card-head">
          <h3 className="font-[var(--fw-semibold)] text-[length:var(--fs-body)] text-[var(--ink)]">Permissions matrix</h3>
          <span className="text-[length:var(--fs-label)] font-[var(--fw-bold)] font-serif border border-[var(--line-strong)] px-[10px] py-[2px] rounded-[var(--r-pill)] text-[var(--ink-soft)] bg-[var(--paper)] clist-chip">{roles.length} ROLES</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-[900px]">
            <thead className="bg-[var(--paper)] border-b border-[var(--line-strong)]">
              <tr>
                <th className="text-left text-[length:var(--fs-label)] tracking-widest text-[var(--ink-mute)] px-[16px] py-[11px] font-[var(--fw-bold)] font-serif uppercase min-w-[220px] sticky left-0 bg-[var(--paper)] z-10 shadow-[1px_0_0_0_var(--line)]">
                  PERMISSION
                </th>
                {roles.map((persona) => (
                  <th key={persona.code} className="text-center text-[length:var(--fs-label)] tracking-widest text-[var(--ink-mute)] px-[16px] py-[11px] font-[var(--fw-bold)] font-serif uppercase min-w-[140px]">
                    {persona.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line-strong)] font-sans">
              {matrixLoading ? (
                <tr><td colSpan={roles.length + 1} className="text-center py-10 text-[var(--ink-mute)] font-[var(--fw-medium)]">Loading matrix...</td></tr>
              ) : (
                displayMatrix.map((row) => (
                  <tr key={row.permissionId} className="hover:bg-[var(--paper-2)] transition group">
                    <td className="px-[16px] py-[14px] font-[var(--fw-semibold)] text-[var(--ink)] text-[length:var(--fs-body)] sticky left-0 bg-[var(--paper)] group-hover:bg-[var(--paper-2)] z-10 shadow-[1px_0_0_0_var(--line)]">
                      <div className="flex items-center gap-3">
                        <div>
                          <div>{row.name}</div>
                          {row.code && <div className="text-[length:var(--fs-meta)] text-[var(--ink-mute)] font-mono font-normal uppercase mt-0.5">{row.code}</div>}
                        </div>
                        {row.permissionId && !row.permissionId.startsWith("preset-") && (
                          <div className="flex items-center gap-1 ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              type="button"
                              onClick={() => handleOpenEditPermission(row)}
                              className="p-1 text-[var(--ink-mute)] hover:text-[var(--ink)] hover:bg-[var(--line)] rounded transition-colors cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenDeletePermission(row)}
                              className="p-1 text-[var(--ink-mute)] hover:text-[var(--c-danger-deep)] hover:bg-[var(--c-danger-wash)] rounded transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                    {roles.map((persona) => {
                      const overrideKey = `${row.permissionId}_${persona.code}`;
                      const isAssigned = matrixOverrides[overrideKey] !== undefined
                        ? matrixOverrides[overrideKey]
                        : row.personaAssignments[persona.code] || false;

                      return (
                        <td 
                          key={persona.code} 
                          className="px-[14px] py-[12px] text-center hover:bg-[var(--paper)] hover:shadow-[var(--shadow-sm)] transition-all cursor-pointer group/cell"
                          onClick={() => handleCheckboxToggle(row.permissionId, persona.code, isAssigned)}
                          title="Click to toggle permission"
                        >
                          <div
                            className={`w-[24px] h-[24px] rounded-full mx-auto flex items-center justify-center transition-all ${
                              isAssigned 
                                ? 'bg-[var(--c-sage-wash)] text-[var(--c-sage-text)]' 
                                : 'bg-transparent border border-transparent group-hover/cell:border-[var(--line-strong)]'
                            }`}
                          >
                            {isAssigned && <Check className="w-4 h-4" strokeWidth={3} />}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>



      {/* Create Custom Role Modal */}
      <Modal
        title={<span className="font-bold text-lg">Add Custom Role</span>}
        open={isCustomRoleModalOpen}
        onCancel={() => setCustomRoleModalOpen(false)}
        footer={null}
        destroyOnClose
        centered
      >
        <Form form={form} layout="vertical" onFinish={handleCreateRole} className="mt-4">
          <Form.Item
            name="name"
            label={<span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Role Name <span className="text-red-500">*</span></span>}
            rules={[{ required: true, message: "Please enter role name" }]}
          >
            <Input placeholder="e.g. Lead Author" className="rounded-xl py-2 px-4" />
          </Form.Item>

          <Form.Item
            name="code"
            label={<span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Role Code (Optional)</span>}
          >
            <Input placeholder="e.g. LEAD_AUTHOR (auto-generated if empty)" className="rounded-xl py-2 px-4" />
          </Form.Item>

          <Form.Item name="description" label={<span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Description</span>}>
            <Input.TextArea rows={3} placeholder="Describe role responsibilities..." className="rounded-xl py-2 px-4" />
          </Form.Item>

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
            <button
              type="button"
              onClick={() => setCustomRoleModalOpen(false)}
              className="px-5 py-2.5 text-sm font-semibold border border-gray-300 bg-white text-gray-700 rounded-xl hover:bg-gray-50 transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createRoleMutation.isPending}
              className="px-6 py-2.5 text-sm font-semibold bg-black text-white rounded-xl hover:bg-black/80 transition-all disabled:bg-gray-400 cursor-pointer"
            >
              {createRoleMutation.isPending ? "Creating..." : "Create Role"}
            </button>
          </div>
        </Form>
      </Modal>

      {/* Create / Edit Permission Modal */}
      <Modal
        title={<span className="font-bold text-lg">{editingPermissionId ? "Edit Permission" : "Create Permission"}</span>}
        open={isPermissionDialogOpen}
        onCancel={() => {
          setPermissionDialogOpen(false);
          setEditingPermissionId(null);
          setSelectedPermission(null);
          permissionForm.resetFields();
        }}
        footer={null}
        destroyOnClose
        centered
      >
        <Form form={permissionForm} layout="vertical" onFinish={handleSavePermission} className="mt-4">
          <Form.Item
            name="code"
            label={<span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Permission Code <span className="text-red-500">*</span></span>}
            rules={[{ required: true, message: "Please enter permission code" }]}
          >
            <Input placeholder="e.g. USER.VIEW" className="rounded-xl py-2 px-4" />
          </Form.Item>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="module"
              label={<span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Module <span className="text-red-500">*</span></span>}
              rules={[{ required: true, message: "Please select module" }]}
            >
              <Select placeholder="Select module" className="h-10">
                {SYSTEM_MODULES.map((mod) => (
                  <Select.Option key={mod} value={mod}>
                    {mod}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="action"
              label={<span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Action <span className="text-red-500">*</span></span>}
              rules={[{ required: true, message: "Please select action" }]}
            >
              <Select placeholder="Select action" className="h-10">
                {PERMISSION_ACTIONS.map((act) => (
                  <Select.Option key={act} value={act}>
                    {act}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </div>

          <Form.Item name="description" label={<span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Description</span>}>
            <Input.TextArea rows={3} placeholder="Describe permission scope..." className="rounded-xl py-2 px-4" />
          </Form.Item>

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
            <button
              type="button"
              onClick={() => {
                setPermissionDialogOpen(false);
                setEditingPermissionId(null);
                setSelectedPermission(null);
                permissionForm.resetFields();
              }}
              className="px-5 py-2.5 text-sm font-semibold border border-gray-300 bg-white text-gray-700 rounded-xl hover:bg-gray-50 transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createPermissionMutation.isPending || updatePermissionMutation.isPending}
              className="px-6 py-2.5 text-sm font-semibold bg-black text-white rounded-xl hover:bg-black/80 transition-all disabled:bg-gray-400 cursor-pointer"
            >
              {createPermissionMutation.isPending || updatePermissionMutation.isPending
                ? "Saving..."
                : editingPermissionId
                  ? "Update Permission"
                  : "Create Permission"}
            </button>
          </div>
        </Form>
      </Modal>

      {/* Delete Permission Confirmation Modal */}
      <Modal
        title={<span className="font-bold text-lg text-red-600">Delete Permission</span>}
        open={isDeleteDialogOpen}
        onCancel={() => {
          setDeleteDialogOpen(false);
          setSelectedPermission(null);
        }}
        footer={null}
        destroyOnClose
        centered
      >
        <div className="mt-2 space-y-4">
          <p className="text-sm text-gray-600">
            Are you sure you want to delete permission{" "}
            <span className="font-semibold text-gray-900">
              "{selectedPermission?.name || selectedPermission?.code}"
            </span>
            ? This action cannot be undone.
          </p>

          <div className="flex justify-end gap-3 pt-6 border-t">
            <button
              type="button"
              onClick={() => {
                setDeleteDialogOpen(false);
                setSelectedPermission(null);
              }}
              className="px-5 py-2.5 text-sm font-semibold border border-gray-300 bg-white text-gray-700 rounded-xl hover:bg-gray-50 transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmDeletePermission}
              disabled={deletePermissionMutation.isPending}
              className="px-6 py-2.5 text-sm font-semibold bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all disabled:bg-red-300 cursor-pointer"
            >
              {deletePermissionMutation.isPending ? "Deleting..." : "Delete Permission"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Set Role Expiry Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-500" />
            <span className="font-bold text-lg">Set Role Expiry</span>
          </div>
        }
        open={!!expiryModalUser}
        onCancel={() => { setExpiryModalUser(null); setExpiryDate(""); }}
        footer={null}
        destroyOnClose
        centered
      >
        {expiryModalUser && (
          <div className="mt-4 space-y-5">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p className="text-sm text-amber-800">
                Setting an expiry on <span className="font-semibold">{expiryModalUser.name}</span>'s{" "}
                <span className="font-semibold">{expiryModalUser.role}</span> role. After this date, the user will
                automatically lose this role and all associated permissions.
              </p>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                Expiry Date &amp; Time <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                value={expiryDate}
                min={new Date(Date.now() + 60_000).toISOString().slice(0, 16)}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="border border-gray-300 rounded-xl px-4 py-2 w-full outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-300 transition-all"
              />
              <p className="text-xs text-gray-400 mt-1">
                Leave empty and click "Remove Expiry" to make the role permanent.
              </p>
            </div>

            {expiryModalUser.expiresAt && (
              <div className="text-sm text-gray-600 bg-gray-50 rounded-xl px-4 py-3 border border-gray-200">
                <span className="font-semibold">Current expiry:</span>{" "}
                {new Date(expiryModalUser.expiresAt).toLocaleString()}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t">
              {expiryModalUser.expiresAt && (
                <button
                  type="button"
                  disabled={setExpiryMutation.isPending}
                  onClick={() =>
                    setExpiryMutation.mutate({
                      userId: expiryModalUser.id,
                      roleCode: expiryModalUser.roleCode,
                      expiresAt: null,
                    })
                  }
                  className="px-5 py-2.5 text-sm font-semibold border border-gray-300 bg-white text-gray-700 rounded-xl hover:bg-gray-50 transition-all cursor-pointer"
                >
                  Remove Expiry
                </button>
              )}
              <button
                type="button"
                onClick={() => { setExpiryModalUser(null); setExpiryDate(""); }}
                className="px-5 py-2.5 text-sm font-semibold border border-gray-300 bg-white text-gray-700 rounded-xl hover:bg-gray-50 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!expiryDate || setExpiryMutation.isPending}
                onClick={() => {
                  if (!expiryDate) return;
                  setExpiryMutation.mutate({
                    userId: expiryModalUser.id,
                    roleCode: expiryModalUser.roleCode,
                    expiresAt: new Date(expiryDate).toISOString(),
                  });
                }}
                className="px-6 py-2.5 text-sm font-semibold bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-all disabled:bg-gray-300 cursor-pointer"
              >
                {setExpiryMutation.isPending ? "Saving..." : "Set Expiry"}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};

export default RolesPermissions;
