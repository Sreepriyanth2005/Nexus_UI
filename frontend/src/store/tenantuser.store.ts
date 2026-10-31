// src/store/tenantuser.store.ts

import { create } from "zustand";

import {
  TenantUser,
  getTenantUsersApi,
  getTenantUserByIdApi,
  createTenantUserApi,
  updateTenantUserApi,
  deleteTenantUserApi,
  BulkUser,
  bulkCreateTenantUsersApi,
} from "../core/api/tenantuser.api";

interface TenantUserStore {
  users: TenantUser[];

  selectedUser: TenantUser | null;

  loading: boolean;

  error: string | null;

  fetchUsers: () => Promise<void>;

  getUserById: (
    userId: string
  ) => Promise<void>;

  createUser: (
    payload: TenantUser
  ) => Promise<boolean>;

  bulkCreateUsers: (
    tenantId: string,
    users: BulkUser[],
  ) => Promise<any>;

  updateUser: (
    userId: string,
    payload: Partial<TenantUser>
  ) => Promise<boolean>;

  deleteUser: (
    userId: string
  ) => Promise<boolean>;

  clearSelectedUser: () => void;
}

bulkCreateUsers: (
  tenantId: string,
  users: BulkUser[],
) => Promise<any>;

export const useTenantUserStore =
  create<TenantUserStore>((set, get) => ({
    users: [],

    selectedUser: null,

    loading: false,

    error: null,

    /**
     * GET ALL USERS
     */
    fetchUsers: async () => {
      try {
        set({
          loading: true,
          error: null,
        });

        const users =
          await getTenantUsersApi();

        set({
          users: Array.isArray(users)
            ? users
            : [],
        });
      } catch (error: any) {
        set({
          error:
            error?.response?.data
              ?.message ||
            error?.message ||
            "Failed to load users",
        });
      } finally {
        set({
          loading: false,
        });
      }
    },

    /**
     * GET USER BY ID
     */
    getUserById: async (
      userId
    ) => {
      try {
        set({
          loading: true,
          error: null,
        });

        const user =
          await getTenantUserByIdApi(
            userId
          );

        set({
          selectedUser: user,
        });
      } catch (error: any) {
        set({
          error:
            error?.response?.data
              ?.message ||
            error?.message ||
            "Failed to load user",
        });
      } finally {
        set({
          loading: false,
        });
      }
    },

    /**
     * CREATE USER
     */
    createUser: async (
      payload
    ) => {
      try {
        set({
          loading: true,
          error: null,
        });

        const createdUser =
          await createTenantUserApi(
            payload
          );

        set((state) => ({
          users: [
            createdUser,
            ...state.users,
          ],
        }));

        return true;
      } catch (error: any) {
        set({
          error:
            error?.response?.data
              ?.message ||
            error?.message ||
            "Failed to create user",
        });

        return false;
      } finally {
        set({
          loading: false,
        });
      }
    },

    /**
 * BULK CREATE USERS
 */
bulkCreateUsers: async (
  tenantId,
  users,
) => {
  try {
    set({
      loading: true,
      error: null,
    });

    const result =
      await bulkCreateTenantUsersApi(
        tenantId,
        users,
      );

    // Refresh users after successful upload
    await get().fetchUsers();

    return result;
  } catch (error: any) {
    set({
      error:
        error?.response?.data?.message ||
        error?.message ||
        "Bulk upload failed",
    });

    throw error;
  } finally {
    set({
      loading: false,
    });
  }
},

    /**
     * UPDATE USER
     */
    updateUser: async (
      userId,
      payload
    ) => {
      try {
        set({
          loading: true,
          error: null,
        });

        const updatedUser =
          await updateTenantUserApi(
            userId,
            payload
          );

        set((state) => ({
          users: state.users.map(
            (user) =>
              user.id === userId
                ? {
                    ...user,
                    ...updatedUser,
                  }
                : user
          ),
        }));

        return true;
      } catch (error: any) {
        set({
          error:
            error?.response?.data
              ?.message ||
            error?.message ||
            "Failed to update user",
        });

        return false;
      } finally {
        set({
          loading: false,
        });
      }
    },

    /**
     * DELETE USER
     */
    deleteUser: async (
      userId
    ) => {
      try {
        set({
          loading: true,
          error: null,
        });

        await deleteTenantUserApi(
          userId
        );

        set((state) => ({
          users: state.users.filter(
            (user) =>
              user.id !== userId
          ),
        }));

        return true;
      } catch (error: any) {
        set({
          error:
            error?.response?.data
              ?.message ||
            error?.message ||
            "Failed to delete user",
        });

        return false;
      } finally {
        set({
          loading: false,
        });
      }
    },

    clearSelectedUser: () =>
      set({
        selectedUser: null,
      }),
  }));