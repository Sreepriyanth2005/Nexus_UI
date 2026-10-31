// src/Store/profile/profileStore.ts

import { create } from "zustand";

import type {
  AuditLog,
  CareerHistory,
  Certificate,
  EducationHistory,
  OnboardingProgress,
  PersonalLink,
  ProfileCompletion,
  SecurityStatus,
  UpdateProfileRequest,
  UserProfile,
  UserAuditLog,
} from "../types/profile.type";

interface ProfileStore {
  /* ==========================================================================
   * SERVER STATE
   * ========================================================================== */

  profile?: UserProfile;
  completion?: ProfileCompletion;
  onboarding?: OnboardingProgress;
  security?: SecurityStatus;
  audits: AuditLog[];
  userAudits: UserAuditLog[];
  certificates: Certificate[];
  loading: boolean;
  error: string | null;

  /* ==========================================================================
   * UI STATE
   * ========================================================================== */

  isEditing: boolean;
  activeTab: string;
  otpDialogOpen: boolean;
  pendingProfile: UpdateProfileRequest | null;
  completionDrawerOpen: boolean;
  selectedCareer?: CareerHistory;
  selectedEducation?: EducationHistory;
  selectedPersonalLink?: PersonalLink;
  selectedCertificateId?: string;

  /* ==========================================================================
   * SERVER ACTIONS
   * ========================================================================== */

  setProfile: (profile: UserProfile) => void;
  updateProfile: (profile: Partial<UserProfile>) => void;
  clearProfile: () => void;
  setCompletion: (completion: ProfileCompletion) => void;
  setSecurity: (security: SecurityStatus) => void;
  setOnboarding: (onboarding: OnboardingProgress) => void;
  setAudits: (audits: AuditLog[]) => void;
  setUserAudits: (userAudits: UserAuditLog[]) => void;
  setCertificates: (certificates: Certificate[]) => void;
  addCertificate: (certificate: Certificate) => void;
  updateCertificate: (certificate: Certificate) => void;
  removeCertificate: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  /* ==========================================================================
   * UI ACTIONS
   * ========================================================================== */

  setEditing: (editing: boolean) => void;
  setActiveTab: (tab: string) => void;
  openOtpDialog: () => void;
  closeOtpDialog: () => void;
  setPendingProfile: (payload: UpdateProfileRequest | null) => void;
  openCompletionDrawer: () => void;
  closeCompletionDrawer: () => void;
  selectCareer: (career?: CareerHistory) => void;
  selectEducation: (education?: EducationHistory) => void;
  selectPersonalLink: (link?: PersonalLink) => void;
  selectCertificate: (id?: string) => void;
  reset: () => void;
}

const initialState = {
  /* ==========================================================================
   * SERVER
   * ========================================================================== */

  profile: undefined,
  completion: undefined,
  onboarding: undefined,
  security: undefined,
  audits: [],
  userAudits: [],
  certificates: [],
  loading: false,
  error: null,

  /* ==========================================================================
   * UI
   * ========================================================================== */

  isEditing: false,
  activeTab: "basic",
  otpDialogOpen: false,
  pendingProfile: null,
  completionDrawerOpen: false,
  selectedCareer: undefined,
  selectedEducation: undefined,
  selectedPersonalLink: undefined,
  selectedCertificateId: undefined,
};

export const useProfileStore =
  create<ProfileStore>((set) => ({
    ...initialState,

    /* ==========================================================================
     * SERVER ACTIONS
     * ========================================================================== */
    setProfile: (profile) =>set({profile,}),

    updateProfile: (profile) =>
      set((state) => ({
        profile: state.profile
          ? {
              ...state.profile,
              ...profile,
            }
          : undefined,
      })),

    clearProfile: () =>set({profile: undefined,}),
    setCompletion: (completion) =>set({completion,}),
    setSecurity: (security) =>set({security,}),
    setOnboarding: (onboarding) =>set({onboarding,}),
    setAudits: (audits) =>set({audits,}),
    setUserAudits: (userAudits) =>set({userAudits,}),
    setCertificates: (certificates) =>set({certificates,}),
    addCertificate: (certificate) =>
      set((state) => ({
        certificates: [
          certificate,
          ...state.certificates,
        ],
      })),

    updateCertificate: (certificate) =>
      set((state) => ({
        certificates:
          state.certificates.map((c) =>
            c.id === certificate.id
              ? certificate
              : c
          ),
      })),

    removeCertificate: (id) =>
      set((state) => ({
        certificates:
          state.certificates.filter(
            (c) => c.id !== id
          ),
      })),

    setLoading: (loading) =>set({loading,}),
    setError: (error) =>set({error,}),

    /* ==========================================================================
     * UI ACTIONS
     * ========================================================================== */

    setEditing: (editing) =>set({isEditing: editing,}),
    setActiveTab: (tab) =>set({activeTab: tab,}),
    openOtpDialog: () =>set({otpDialogOpen: true,}),
    closeOtpDialog: () =>set({otpDialogOpen: false,}),
    setPendingProfile: (payload) =>set({pendingProfile: payload,}),
    openCompletionDrawer: () =>set({completionDrawerOpen: true,}),
    closeCompletionDrawer: () =>set({completionDrawerOpen: false,}),
    selectCareer: (career) =>set({selectedCareer: career,}),
    selectEducation: (education) =>set({selectedEducation: education,}),

    selectPersonalLink: (link) =>set({selectedPersonalLink: link,}),
    selectCertificate: (id) =>set({selectedCertificateId: id,}),
    reset: () =>set(initialState),}));