// src/core/api/profile/profile.api.ts

import { api } from "../../../config/axios";

import type {
  ApiResponse,
  AuditLog,
  Certificate,
  OnboardingProgress,
  OtpResponse,
  ProfileCompletion,
  SecurityStatus,
  UpdateProfileRequest,
  UpdateProfileResponse,
  UploadCertificateRequest,
  UserProfile,
  VerifyProfileOtpRequest,
  UserAuditLog,
} from "../../../types/profile.type";

/* ==========================================================================
 * PROFILE
 * ========================================================================== */

export const getProfileApi =
  async (): Promise<UserProfile> => {
    const { data } =
      await api.get<ApiResponse<UserProfile>>(
        "/profile/me"
      );

    return data.data;
  };

export const updateProfileApi =
  async (
    payload: UpdateProfileRequest
  ): Promise<UpdateProfileResponse> => {
    const { data } =
      await api.patch<UpdateProfileResponse>(
        "/profile/me",
        payload
      );

    return data;
  };

/* ==========================================================================
 * OTP
 * ========================================================================== */

export const verifyProfileOtpApi =
  async (
    payload: VerifyProfileOtpRequest
  ): Promise<OtpResponse> => {
    const { data } =
      await api.post<OtpResponse>(
        "/profile/me/verify-otp",
        payload
      );

    return data;
  };

export const resendProfileOtpApi =
  async (): Promise<OtpResponse> => {
    const { data } =
      await api.post<OtpResponse>(
        "/profile/me/resend-otp"
      );

    return data;
  };

export const cancelPendingProfileUpdateApi =
  async (): Promise<OtpResponse> => {
    const { data } =
      await api.delete<OtpResponse>(
        "/profile/me/pending-update"
      );

    return data;
  };

/* ==========================================================================
 * PROFILE COMPLETION
 * ========================================================================== */

export const getProfileCompletionApi =
  async (): Promise<ProfileCompletion> => {
    const { data } =
      await api.get<ApiResponse<ProfileCompletion>>(
        "/profile/me/completion"
      );

    return data.data;
  };

export const getCompletionRulesApi =
  async (): Promise<any[]> => {
    const { data } =
      await api.get<ApiResponse<any[]>>(
        "/profile/me/completion-rules"
      );

    return data.data;
  };

/* ==========================================================================
 * ONBOARDING
 * ========================================================================== */

export const getOnboardingProgressApi =
  async (): Promise<OnboardingProgress> => {
    const { data } =
      await api.get<ApiResponse<OnboardingProgress>>(
        "/profile/me/onboarding"
      );

    return data.data;
  };

export const resetOnboardingApi =
  async (): Promise<OnboardingProgress> => {
    const { data } =
      await api.post<ApiResponse<OnboardingProgress>>(
        "/profile/me/onboarding/reset"
      );

    return data.data;
  };

/* ==========================================================================
 * SECURITY
 * ========================================================================== */

export const getProfileSecurityApi =
  async (): Promise<SecurityStatus> => {
    const { data } =
      await api.get<ApiResponse<SecurityStatus>>(
        "/profile/me/security"
      );

    return data.data;
  };

/* ==========================================================================
 * AUDITS
 * ========================================================================== */

export const getProfileAuditsApi =
  async (): Promise<AuditLog[]> => {
    const { data } =
      await api.get<ApiResponse<AuditLog[]>>(
        "/profile/me/audits"
      );

    return data.data;
  };

export const getUserAuditsApi =
  async (): Promise<UserAuditLog[]> => {
    const { data } =
      await api.get<ApiResponse<UserAuditLog[]>>(
        "/profile/me/user-audits"
      );

    return data.data;
  };
/* ==========================================================================
 * PROFILE PHOTO
 * ========================================================================== */

export const uploadProfilePhotoApi =
  async (
    assetId: string
  ): Promise<UserProfile> => {
    const { data } =
      await api.post<ApiResponse<UserProfile>>(
        "/profile/me/photo",
        { assetId }
      );

    return data.data;
  };

export const deleteProfilePhotoApi =
  async (): Promise<UserProfile> => {
    const { data } =
      await api.delete<ApiResponse<UserProfile>>(
        "/profile/me/photo"
      );

    return data.data;
  };

/* ==========================================================================
 * RESUME
 * ========================================================================== */

export const uploadResumeApi =
  async (
    assetId: string
  ): Promise<UserProfile> => {
    const { data } =
      await api.post<ApiResponse<UserProfile>>(
        "/profile/me/resume",
        { assetId }
      );

    return data.data;
  };

export const deleteResumeApi =
  async (): Promise<UserProfile> => {
    const { data } =
      await api.delete<ApiResponse<UserProfile>>(
        "/profile/me/resume"
      );

    return data.data;
  };

/* ==========================================================================
 * CERTIFICATES
 * ========================================================================== */

export const uploadCertificateApi =
  async (
    payload: UploadCertificateRequest
  ): Promise<Certificate> => {
    const { data } =
      await api.post<ApiResponse<Certificate>>(
        "/profile/me/certificates",
        payload
      );

    return data.data;
  };

export const deleteCertificateApi =
  async (
    certificateId: string
  ): Promise<void> => {
    await api.delete<ApiResponse<null>>(
      `/profile/me/certificates/${certificateId}`
    );
  };

/* ==========================================================================
 * ACCOUNT
 * ========================================================================== */

export const selfDeleteAccountApi =
  async (otp: string): Promise<void> => {
    await api.delete<ApiResponse<null>>(
      "/profile/me/account",
      { data: { otp } }
    );
  };