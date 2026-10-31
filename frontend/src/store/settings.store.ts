import { create } from "zustand";
import { persist } from "zustand/middleware";
import { OtpConfig } from "../core/api/otp.api";
import { NotificationPreferences } from "../core/api/notification.api";

export interface AuthoringPreferences {
  defaultVisibility: string;
  autoSave: boolean;
}

type SettingsState = {
  otpConfig: OtpConfig | null;
  setOtpConfig: (config: OtpConfig | null) => void;
  resetOtpConfig: () => void;
  preferences: NotificationPreferences | null;
  setPreferences: (preferences: NotificationPreferences | null) => void;
  authoringPreferences: AuthoringPreferences;
  setAuthoringPreferences: (prefs: Partial<AuthoringPreferences>) => void;
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      otpConfig: null,
      preferences: null,
      authoringPreferences: {
        defaultVisibility: "Draft (private)",
        autoSave: true,
      },

      setOtpConfig: (config) => set({ otpConfig: config }),

      resetOtpConfig: () => set({ otpConfig: null }),

      setPreferences: (preferences) => set({ preferences }),

      setAuthoringPreferences: (prefs) =>
        set((state) => ({
          authoringPreferences: {
            ...state.authoringPreferences,
            ...prefs,
          },
        })),
    }),
    {
      name: "app-settings-storage",
      partialize: (state) => ({
        otpConfig: state.otpConfig,
        authoringPreferences: state.authoringPreferences,
      }),
    }
  )
);