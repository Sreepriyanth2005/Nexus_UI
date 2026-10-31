// src/core/auth/auth.store.ts

import { create } from "zustand";
import { useUserStore } from "../../store/user.store";
import axios from "axios";

export type OtpMeta = {
  otpExpirySeconds: number;
  resendCooldownSeconds: number;
  maxOtpVerifyAttempts: number;
  maxOtpResendAttempts: number;
  temporaryBlockMinutes: number;
  lockExpiresAt: string;
  remainingVerifyAttempts: number;
  remainingResendAttempts: number;
  expiresAt: string;
  resendAvailableAt: string;
};

type AuthStep =
  | "login"
  | "register"
  | "otp"
  | "authenticated";

type TempAuth = {
  token?: string;
  role?: string;

  email?: string;
  firstName?: string;
  lastName?: string;
  countryName?: string;

  deviceId?: string;
  deviceName?: string;
  browser?: string;
  os?: string;
  userAgent?: string;
  revokeDeviceId?: string;

  purpose?: "login" | "register" | "admin_login";
};

type AuthState = {
  accessToken: string | null;
  idToken: string | null;
  refreshToken: string | null;
  role: string | null;
  status: boolean;
  otpMeta: OtpMeta | null;
  step: AuthStep;
  tempAuth: TempAuth | null;
  permissions: string[];
  systemRoles: string[];
  setPermissions: (permissions: string[]) => void;
  setSystemRoles: (roles: string[]) => void;
  setOtpMeta: (otp: OtpMeta | null) => void;
  setTempAuth: (
    email: string,
    purpose: "login" | "register" | "admin_login",
    data?: {
      firstName?: string;
      lastName?: string;
      countryName?: string;

      deviceId?: string;
      deviceName?: string;
      browser?: string;
      os?: string;
      userAgent?: string;
      revokeDeviceId?: string;

      otpMeta?: OtpMeta;
    }
  ) => void;

  clearTempAuth: () => void;

  setAuth: (
    accessToken: string | null,
    role: string | null,
    user?: any,
    refreshToken?: string | null,
    idToken?: string | null
  ) => void;

  setStep: (step: AuthStep) => void;

  setActiveRole: (role: string) => void;

  logout: () => Promise<void>;
};

const getInitialAuthState = () => {
  try {
    const stored = localStorage.getItem(
      "keycloak_session_auth"
    );

    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error(
      "Failed to restore auth session:",
      error
    );
  }

  return null;
};

const initialState = getInitialAuthState();

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: initialState?.accessToken ?? null,
  idToken: initialState?.idToken ?? null,
  refreshToken: initialState?.refreshToken ?? null,
  role: initialState?.role ?? null,

  status: !!initialState?.accessToken,

  otpMeta: null,

  step: initialState?.accessToken
    ? "authenticated"
    : "login",

  tempAuth: null,
  permissions: [],
  systemRoles: [],

  setPermissions: (permissions) => set({ permissions }),
  setSystemRoles: (systemRoles) => set({ systemRoles }),

  setOtpMeta: (otp) =>
    set({
      otpMeta: otp,
    }),

  setTempAuth: (email, purpose, data) =>
    set({
      tempAuth: {
        email,
        purpose,

        firstName: data?.firstName ?? "",
        lastName: data?.lastName ?? "",
        countryName: data?.countryName ?? "",

        deviceId: data?.deviceId ?? "",
        deviceName: data?.deviceName ?? "",
        browser: data?.browser ?? "",
        os: data?.os ?? "",
        userAgent: data?.userAgent ?? "",
        revokeDeviceId: data?.revokeDeviceId ?? "",
      },

      otpMeta: data?.otpMeta ?? null,

      step: "otp",
    }),
  clearTempAuth: () =>
    set({
      tempAuth: null,
      otpMeta: null,
      step: "login",
    }),

  setAuth: (
    accessToken,
    role,
    user = null,
    refreshToken = null,
    idToken = null
  ) => {
    set({
      accessToken,
      idToken,
      refreshToken,
      role,

      status: !!accessToken,

      step: accessToken
        ? "authenticated"
        : "login",

      tempAuth: null,
      otpMeta: null,
    });

    if (accessToken) {
      const authState = {
        accessToken,
        refreshToken,
        idToken,
        role,
      };

      localStorage.setItem(
        "keycloak_session_auth",
        JSON.stringify(authState)
      );

      if (role) {
        localStorage.setItem(
          "last_role",
          role
        );
      }

      useUserStore.getState().setAuth(
        user || {
          id: "",
          email: "",
          roles: role ? [role] : [],
        },
        accessToken,
        refreshToken
      );
    } else {
      localStorage.removeItem(
        "keycloak_session_auth"
      );

      localStorage.removeItem(
        "last_role"
      );

      useUserStore.getState().logout();
    }
  },

  setStep: (step) =>
    set({
      step,
    }),

  setActiveRole: (role) => {
    set({ role });
    localStorage.setItem("last_role", role);
    const storedAuth = localStorage.getItem("keycloak_session_auth");
    if (storedAuth) {
      try {
        const parsed = JSON.parse(storedAuth);
        parsed.role = role;
        localStorage.setItem("keycloak_session_auth", JSON.stringify(parsed));
      } catch (e) {
        console.error("Failed to parse stored auth", e);
      }
    }
  },

  logout: async () => {
    localStorage.removeItem("static_current_user");

    set({
      accessToken: null,
      idToken: null,
      refreshToken: null,
      role: null,

      status: false,

      otpMeta: null,

      step: "login",

      tempAuth: null,
    });

    localStorage.removeItem(
      "keycloak_session_auth"
    );

    localStorage.removeItem(
      "last_role"
    );

    localStorage.removeItem(
      "skip_complete_profile"
    );

    localStorage.removeItem(
      "needs_profile_completion"
    );

    useUserStore.getState().logout();
  },
}));