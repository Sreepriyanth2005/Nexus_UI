// src/store/group.store.ts

import { create } from "zustand";

import {
  Group,
  CreateGroupPayload,
  UpdateGroupPayload,
  getGroupsApi,
  getGroupByIdApi,
  createGroupApi,
  updateGroupApi,
  updateGroupStatusApi,
  deleteGroupApi,
  getDepartmentMetricsApi,
  getDepartmentCountApi,
  getDepartmentByNameApi,
  getDepartmentsByStatusApi,
  getDepartmentUserCountApi,
  getDepartmentActiveUserCountApi,
  getGroupDetailsApi,
  getGroupMembersApi,
} from "../core/api/group.api";

interface GroupStore {
  groups: Group[];
  selectedGroup: Group | null;
  metrics: any;
  loading: boolean;
  error: string | null;

  // Core CRUD
  fetchGroups: (tenantId: string) => Promise<void>;
  getGroupById: (tenantId: string, departmentId: string) => Promise<void>;
  createGroup: (tenantId: string, payload: CreateGroupPayload) => Promise<boolean>;
  updateGroup: (
    tenantId: string,
    departmentId: string,
    payload: UpdateGroupPayload
  ) => Promise<boolean>;
  updateGroupStatus: (
    tenantId: string,
    departmentId: string,
    status: string
  ) => Promise<boolean>;
  deleteGroup: (tenantId: string, departmentId: string) => Promise<boolean>;

  // Additional queries
  getDepartmentByName: (tenantId: string, name: string) => Promise<Group | null>;
  getDepartmentsByStatus: (tenantId: string, status: string) => Promise<Group[]>;
  getDepartmentUserCount: (tenantId: string, departmentId: string) => Promise<any>;
  getDepartmentActiveUserCount: (tenantId: string, departmentId: string) => Promise<any>;
  getGroupDetails: (tenantId: string, departmentId: string) => Promise<any>;
  getGroupMembers: (tenantId: string, departmentId: string) => Promise<any[]>;

  // Utils
  fetchMetrics: (tenantId: string) => Promise<void>;
  getDepartmentCount: (tenantId: string) => Promise<number>;
  clearSelectedGroup: () => void;
}

export const useGroupStore = create<GroupStore>((set, get) => ({
  groups: [],
  selectedGroup: null,
  metrics: null,
  loading: false,
  error: null,

  /**
   * GET ALL GROUPS
   */
  fetchGroups: async (tenantId) => {
    try {
      set({ loading: true, error: null });
      const groups = await getGroupsApi(tenantId);
      set({ groups: Array.isArray(groups) ? groups : [] });
    } catch (error: any) {
      set({
        error:
          error?.response?.data?.message ||
          error?.message ||
          "Failed to load groups",
      });
    } finally {
      set({ loading: false });
    }
  },

  /**
   * GET GROUP BY ID
   */
  getGroupById: async (tenantId, departmentId) => {
    try {
      set({ loading: true, error: null });
      const group = await getGroupByIdApi(tenantId, departmentId);
      set({ selectedGroup: group });
    } catch (error: any) {
      set({
        error:
          error?.response?.data?.message ||
          error?.message ||
          "Failed to load group",
      });
    } finally {
      set({ loading: false });
    }
  },

  /**
   * CREATE GROUP
   */
  createGroup: async (tenantId, payload) => {
    try {
      set({ loading: true, error: null });
      const created = await createGroupApi(tenantId, payload);

      set((state) => ({
        groups: [created, ...state.groups],
      }));

      return true;
    } catch (error: any) {
      set({
        error:
          error?.response?.data?.message ||
          error?.message ||
          "Failed to create group",
      });
      return false;
    } finally {
      set({ loading: false });
    }
  },

  /**
   * UPDATE GROUP
   */
  updateGroup: async (tenantId, departmentId, payload) => {
    try {
      set({ loading: true, error: null });
      const updated = await updateGroupApi(tenantId, departmentId, payload);

      set((state) => ({
        groups: state.groups.map((group) =>
          group.id === departmentId ? { ...group, ...updated } : group
        ),
        selectedGroup:
          state.selectedGroup?.id === departmentId
            ? { ...state.selectedGroup, ...updated }
            : state.selectedGroup,
      }));

      return true;
    } catch (error: any) {
      set({
        error:
          error?.response?.data?.message ||
          error?.message ||
          "Failed to update group",
      });
      return false;
    } finally {
      set({ loading: false });
    }
  },

  /**
   * UPDATE GROUP STATUS
   */
  updateGroupStatus: async (tenantId, departmentId, status) => {
    try {
      set({ loading: true, error: null });
      await updateGroupStatusApi(tenantId, departmentId, status);

      // Refresh the group in store
      const updatedGroup = await getGroupByIdApi(tenantId, departmentId);

      set((state) => ({
        groups: state.groups.map((group) =>
          group.id === departmentId ? { ...group, ...updatedGroup } : group
        ),
        selectedGroup:
          state.selectedGroup?.id === departmentId
            ? { ...state.selectedGroup, ...updatedGroup }
            : state.selectedGroup,
      }));

      return true;
    } catch (error: any) {
      set({
        error:
          error?.response?.data?.message ||
          error?.message ||
          "Failed to update group status",
      });
      return false;
    } finally {
      set({ loading: false });
    }
  },

  /**
   * DELETE GROUP
   */
  deleteGroup: async (tenantId, departmentId) => {
    try {
      set({ loading: true, error: null });
      await deleteGroupApi(tenantId, departmentId);

      set((state) => ({
        groups: state.groups.filter((g) => g.id !== departmentId),
        selectedGroup:
          state.selectedGroup?.id === departmentId ? null : state.selectedGroup,
      }));

      return true;
    } catch (error: any) {
      set({
        error:
          error?.response?.data?.message ||
          error?.message ||
          "Failed to delete group",
      });
      return false;
    } finally {
      set({ loading: false });
    }
  },

  /**
   * GET DEPARTMENT BY NAME
   */
  getDepartmentByName: async (tenantId, name) => {
    try {
      const group = await getDepartmentByNameApi(tenantId, name);
      return group || null;
    } catch (error) {
      console.error(error);
      return null;
    }
  },

  /**
   * GET DEPARTMENTS BY STATUS
   */
  getDepartmentsByStatus: async (tenantId, status) => {
    try {
      return await getDepartmentsByStatusApi(tenantId, status);
    } catch (error) {
      console.error(error);
      return [];
    }
  },

  /**
   * GET USER COUNT IN DEPARTMENT
   */
  getDepartmentUserCount: async (tenantId, departmentId) => {
    try {
      return await getDepartmentUserCountApi(tenantId, departmentId);
    } catch (error) {
      console.error(error);
      return { count: 0 };
    }
  },

  /**
   * GET ACTIVE USER COUNT IN DEPARTMENT
   */
  getDepartmentActiveUserCount: async (tenantId, departmentId) => {
    try {
      return await getDepartmentActiveUserCountApi(tenantId, departmentId);
    } catch (error) {
      console.error(error);
      return { count: 0 };
    }
  },

  /**
   * GET KEYCLOAK GROUP DETAILS
   */
  getGroupDetails: async (tenantId, departmentId) => {
    try {
      return await getGroupDetailsApi(tenantId, departmentId);
    } catch (error) {
      console.error(error);
      return null;
    }
  },

  /**
   * GET KEYCLOAK GROUP MEMBERS
   */
  getGroupMembers: async (tenantId, departmentId) => {
    try {
      return await getGroupMembersApi(tenantId, departmentId);
    } catch (error) {
      console.error(error);
      return [];
    }
  },

  /**
   * FETCH METRICS
   */
  fetchMetrics: async (tenantId) => {
    try {
      const metrics = await getDepartmentMetricsApi(tenantId);
      set({ metrics });
    } catch (error) {
      console.error(error);
      set({ metrics: null });
    }
  },

  /**
   * GET DEPARTMENT COUNT
   */
  getDepartmentCount: async (tenantId) => {
    try {
      const result = await getDepartmentCountApi(tenantId);
      return result?.count ?? result?.data?.count ?? 0;
    } catch {
      return 0;
    }
  },

  clearSelectedGroup: () => set({ selectedGroup: null }),
}));