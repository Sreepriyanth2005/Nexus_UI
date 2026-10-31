// src/core/api/otp.api.ts

import { api } from "../../config/axios";
import * as Sentry from "@sentry/react";

export type OtpConfig = {
  data: OtpConfig;
  id?: string;

  otpExpirySeconds: number;
  resendCooldownSeconds: number;
  maxOtpVerifyAttempts: number;
  maxOtpResendAttempts: number;
  maxFailedLoginAttempts: number;
  temporaryBlockMinutes: number;
  loginOtpEnabled: boolean;
  registerOtpEnabled: boolean;
  // Session / concurrency fields
  adminSessionTimeoutMinutes?: number;
  userSessionTimeoutMinutes?: number;
  maxConcurrentSessions?: number;
  createdAt?: string;
  updatedAt?: string;
};

/**
 * GET OTP CONFIG
 */
export const getOtpConfig =
  async (): Promise<OtpConfig> => {

    const res =
      await api.get<{
        success?: boolean;
        data: OtpConfig;
        message?: string;
      }>(
        "/auth/otp-config"
      );

    return res.data.data;
  };

/**
 * UPDATE OTP CONFIG
 */
export const updateOtpConfig =
  async (
    config: Partial<OtpConfig>
  ): Promise<{
    data: OtpConfig;
    message?: string;
  }> => {

    const res =
      await api.put<{
        data: OtpConfig;
        message?: string;
      }>(
        "/auth/otp-config",
        config
      );

    return res.data;
  };