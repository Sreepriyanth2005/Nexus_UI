import { create } from "zustand";

export type UserData = {
  id: string;
  email: string;
  emailVerified?: boolean;
  status?: string;
  tenantId?: string | null;
  roles?: string[];
  firstName?: string;
  lastName?: string;
  country?: string;
  acceptedTerms?: boolean;
  isFirstLogin?: boolean;
};

type UserState = {
  user: UserData | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoaded: boolean;

  // Impersonation state
  isImpersonating: boolean;
  impersonatorId: string | null;
  originalSession: { accessToken: string; refreshToken: string | null; user: UserData } | null;

  setAuth: (
    user: UserData,
    accessToken: string,
    refreshToken?: string | null
  ) => void;

  updateUser: (data: Partial<UserData>) => void;

  updateToken: (accessToken: string, refreshToken?: string | null) => void;

  startImpersonation: (
    impersonatorId: string, 
    targetUser: UserData, 
    accessToken: string, 
    refreshToken?: string | null
  ) => void;
  stopImpersonation: () => void;

  logout: () => void;

  clearAuth: () => void;
};

const getInitialUserState = () => {
  try {
    const storedUser = localStorage.getItem("keycloak_session_user");
    if (storedUser) {
      return JSON.parse(storedUser);
    }
  } catch (error) {
    console.error("Failed to parse user from session", error);
  }
  return null;
};

const initialUserState = getInitialUserState();

export const useUserStore = create<UserState>()((set, get) => ({
  user: initialUserState?.user || null,
  accessToken: initialUserState?.accessToken || null,
  refreshToken: initialUserState?.refreshToken || null,
  isAuthenticated: !!initialUserState?.accessToken,
  isLoaded: !!initialUserState?.accessToken,
  isImpersonating: initialUserState?.isImpersonating || false,
  impersonatorId: initialUserState?.impersonatorId || null,
  originalSession: initialUserState?.originalSession || null,

  setAuth: (user, accessToken, refreshToken = null) => {
    set({
      user,
      accessToken,
      refreshToken: refreshToken ?? null,
      isAuthenticated: true,
      isLoaded: true,
    });
    localStorage.setItem("keycloak_session_user", JSON.stringify({ user, accessToken, refreshToken }));
  },

  updateUser: (data) => {
    const { user } = get();
    if (user) {
      const updatedUser = { ...user, ...data };
      set({ user: updatedUser });
      localStorage.setItem("keycloak_session_user", JSON.stringify({ user: updatedUser, accessToken: get().accessToken, refreshToken: get().refreshToken }));
    }
  },

  updateToken: (accessToken, refreshToken = null) => {
    const current = get();
    set({
      accessToken,
      refreshToken: refreshToken ?? current.refreshToken,
    });
  },

  startImpersonation: (impersonatorId, targetUser, accessToken, refreshToken = null) => {
    const current = get();
    // Save original session if not already saved (prevents nesting)
    const originalSession = current.originalSession || {
      accessToken: current.accessToken!,
      refreshToken: current.refreshToken,
      user: current.user!
    };

    set({
      user: targetUser,
      accessToken,
      refreshToken,
      isImpersonating: true,
      impersonatorId,
      originalSession
    });

    localStorage.setItem("keycloak_session_user", JSON.stringify({ 
      user: targetUser, 
      accessToken, 
      refreshToken,
      isImpersonating: true,
      impersonatorId,
      originalSession
    }));
  },

  stopImpersonation: () => {
    const { originalSession } = get();
    if (originalSession) {
      set({
        user: originalSession.user,
        accessToken: originalSession.accessToken,
        refreshToken: originalSession.refreshToken,
        isImpersonating: false,
        impersonatorId: null,
        originalSession: null
      });

      localStorage.setItem("keycloak_session_user", JSON.stringify({ 
        user: originalSession.user, 
        accessToken: originalSession.accessToken, 
        refreshToken: originalSession.refreshToken 
      }));
    } else {
      get().logout();
    }
  },

  logout: () => {
    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoaded: false,
    });
    localStorage.removeItem("keycloak_session_user");
  },

  clearAuth: () => {
    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoaded: false,
    });
    localStorage.removeItem("keycloak_session_user");
  },
}));
