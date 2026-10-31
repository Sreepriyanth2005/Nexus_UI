// src/store/role.store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getRoles, createRole, updateRole, deleteRole, CreateRolePayload } from '../core/api/role.api';

/** Shape of a role object returned by the backend */
export type RoleType = {
    id: string;
    code: string;
    name: string;
    description?: string;
    created_at: string;
    updated_at: string;
};

type RoleState = {
    /** Cached list of roles */
    roles: RoleType[];

    /** Load the latest roles from the server */
    fetchRoles: () => Promise<void>;

    /** Create a new role (server + store) */
    createRole: (payload: CreateRolePayload) => Promise<void>;

    /** Update an existing role (server + store) */
    updateRole: (
        id: string,
        payload: Partial<CreateRolePayload>
    ) => Promise<void>;

    /** Delete a role (server + store) */
    deleteRole: (id: string) => Promise<void>;
};

/**
 * Persistent Zustand store – keeps the last fetched role list across page reloads.
 * All actions keep the server and the local cache in sync.
 */
export const useRoleStore = create<RoleState>()(
    persist(
        (set, get) => ({
            roles: [],

            // -----------------------------------------------------------------
            // FETCH
            // -----------------------------------------------------------------
            fetchRoles: async () => {
                try {
                    const data = await getRoles();
                    set({ roles: data });
                } catch (err) {
                    console.error('Failed to fetch roles:', err);
                }
            },

            // -----------------------------------------------------------------
            // CREATE
            // -----------------------------------------------------------------
            createRole: async (payload: CreateRolePayload) => {
                try {
                    const newRole = await createRole(payload);
                    set((state) => ({ roles: [...state.roles, newRole] }));
                } catch (err) {
                    console.error('Failed to create role:', err);
                    throw err;
                }
            },

            // -----------------------------------------------------------------
            // UPDATE
            // -----------------------------------------------------------------
            updateRole: async (id: string, payload: Partial<CreateRolePayload>) => {
                try {
                    const updated = await updateRole(id, payload);
                    set((state) => ({
                        roles: state.roles.map((r) => (r.id === id ? updated : r)),
                    }));
                } catch (err) {
                    console.error('Failed to update role:', err);
                    throw err;
                }
            },

            // -----------------------------------------------------------------
            // DELETE
            // -----------------------------------------------------------------
            deleteRole: async (id: string) => {
                try {
                    await deleteRole(id);
                    set((state) => ({
                        roles: state.roles.filter((r) => r.id !== id),
                    }));
                } catch (err) {
                    console.error('Failed to delete role:', err);
                    throw err;
                }
            },
        }),
        {
            name: 'roles-storage', // storage key
        }
    )
);
