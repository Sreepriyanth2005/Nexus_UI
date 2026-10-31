// src/store/rolesPermissions.store.ts

import { create } from "zustand";
import { PermissionDto } from "../core/api/permission.api";

interface RolesPermissionsUiState {
  searchQuery: string;
  selectedRoleFilter: string;
  selectedStatusFilter: string;
  isCustomRoleModalOpen: boolean;
  page: number;
  pageSize: number;

  selectedPermission: (PermissionDto & { name?: string; permissionId?: string }) | null;
  editingPermissionId: string | null;
  isPermissionDialogOpen: boolean;
  isDeleteDialogOpen: boolean;

  selectedRoleId: string | null;
  editingRoleId: string | null;
  isRoleDialogOpen: boolean;
  isRoleDeleteDialogOpen: boolean;

  setSearchQuery: (query: string) => void;
  setSelectedRoleFilter: (role: string) => void;
  setSelectedStatusFilter: (status: string) => void;
  setCustomRoleModalOpen: (isOpen: boolean) => void;
  setPage: (page: number) => void;

  setSelectedPermission: (permission: (PermissionDto & { name?: string; permissionId?: string }) | null) => void;
  setEditingPermissionId: (id: string | null) => void;
  setPermissionDialogOpen: (isOpen: boolean) => void;
  setDeleteDialogOpen: (isOpen: boolean) => void;

  setSelectedRoleId: (id: string | null) => void;
  setEditingRoleId: (id: string | null) => void;
  setRoleDialogOpen: (isOpen: boolean) => void;
  setRoleDeleteDialogOpen: (isOpen: boolean) => void;
  reset: () => void;
}

export const useRolesPermissionsStore = create<RolesPermissionsUiState>()((set) => ({
  searchQuery: "",
  selectedRoleFilter: "ALL",
  selectedStatusFilter: "ALL",
  isCustomRoleModalOpen: false,
  page: 1,
  pageSize: 10,

  selectedPermission: null,
  editingPermissionId: null,
  isPermissionDialogOpen: false,
  isDeleteDialogOpen: false,

  selectedRoleId: null,
  editingRoleId: null,
  isRoleDialogOpen: false,
  isRoleDeleteDialogOpen: false,

  setSearchQuery: (searchQuery: string) => set({ searchQuery, page: 1 }),
  setSelectedRoleFilter: (selectedRoleFilter: string) => set({ selectedRoleFilter, page: 1 }),
  setSelectedStatusFilter: (selectedStatusFilter: string) => set({ selectedStatusFilter, page: 1 }),
  setCustomRoleModalOpen: (isCustomRoleModalOpen: boolean) => set({ isCustomRoleModalOpen }),
  setPage: (page: number) => set({ page }),

  setSelectedPermission: (selectedPermission: PermissionDto | null) => set({ selectedPermission }),
  setEditingPermissionId: (editingPermissionId: string | null) => set({ editingPermissionId }),
  setPermissionDialogOpen: (isPermissionDialogOpen: boolean) => set({ isPermissionDialogOpen }),
  setDeleteDialogOpen: (isDeleteDialogOpen: boolean) => set({ isDeleteDialogOpen }),

  setSelectedRoleId: (selectedRoleId: string | null) => set({ selectedRoleId }),
  setEditingRoleId: (editingRoleId: string | null) => set({ editingRoleId }),
  setRoleDialogOpen: (isRoleDialogOpen: boolean) => set({ isRoleDialogOpen }),
  setRoleDeleteDialogOpen: (isRoleDeleteDialogOpen: boolean) => set({ isRoleDeleteDialogOpen }),

  reset: () =>
    set({
      searchQuery: "",
      selectedRoleFilter: "ALL",
      selectedStatusFilter: "ALL",
      isCustomRoleModalOpen: false,
      page: 1,
      pageSize: 10,
      selectedPermission: null,
      editingPermissionId: null,
      isPermissionDialogOpen: false,
      isDeleteDialogOpen: false,
      selectedRoleId: null,
      editingRoleId: null,
      isRoleDialogOpen: false,
      isRoleDeleteDialogOpen: false,
    }),
}));

