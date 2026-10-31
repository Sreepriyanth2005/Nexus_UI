import { create } from "zustand";
import { UserAccountStatus } from "../core/api/user-lifecycle.api";

interface UserLifecycleState {
  accountStatus: UserAccountStatus | null;
  deletedAt: string | null;
  email: string | null;
  userId: string | null;
  setAccountStatus: (status: UserAccountStatus | null) => void;
  setDeletedAt: (deletedAt: string | null) => void;
  setEmail: (email: string | null) => void;
  setUserId: (userId: string | null) => void;
  resetStore: () => void;
}

export const useUserLifecycleStore = create<UserLifecycleState>((set) => ({
  accountStatus: null,
  deletedAt: null,
  email: null,
  userId: null,

  setAccountStatus: (accountStatus) =>
    set({
      accountStatus,
      deletedAt: accountStatus?.deletedAt || null,
      email: accountStatus?.email || null,
      userId: accountStatus?.userId || null,
    }),

  setDeletedAt: (deletedAt) => set({ deletedAt }),
  setEmail: (email) => set({ email }),
  setUserId: (userId) => set({ userId }),

  resetStore: () =>
    set({
      accountStatus: null,
      deletedAt: null,
      email: null,
      userId: null,
    }),
}));
