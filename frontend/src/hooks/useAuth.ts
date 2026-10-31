import { useMutation } from "@tanstack/react-query";

const networkRetryPolicy = (failureCount: number, error: any) => {
  if (failureCount >= 3) return false;
  if (!error.response || error.response.status >= 500) return true;
  return false;
};

const networkRetryDelay = (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 10000);


import {
  sendRegisterOtpApi,
  verifyRegisterOtpApi,
  completeRegisterApi,
  sendLoginOtpApi,
  verifyLoginOtpApi,
  logoutApi,
  refreshTokenApi,
  resendOtpApi,
  loginApi,
  adminLoginApi,
  verifyAdminLoginOtpApi,
  revokeDeviceDuringLoginApi,
} from "../core/api/auth.api";

// ─────────────────────────────────────────────
// PASSWORD LOGIN
// POST /auth/login
// ─────────────────────────────────────────────

export const useLoginWithPassword = () => {
  return useMutation({
    mutationFn: loginApi,
  });
};

export const useAdminLogin = () => {
  return useMutation({
    mutationFn: adminLoginApi,
  });
};

export const useAdminVerifyOtp = () => {
  return useMutation({
    mutationFn: verifyAdminLoginOtpApi,
  });
};

// ─────────────────────────────────────────────
// REGISTER
// ─────────────────────────────────────────────

export const useRegisterSendOtp = () => {
  return useMutation({
    mutationFn: sendRegisterOtpApi,
  });
};

export const useRegisterVerifyOtp = () => {
  return useMutation({
    mutationFn: verifyRegisterOtpApi,
    retry: networkRetryPolicy,
    retryDelay: networkRetryDelay,
  });
};

export const useRegisterComplete = () => {
  return useMutation({
    mutationFn: completeRegisterApi,
    retry: networkRetryPolicy,
    retryDelay: networkRetryDelay,
  });
};

// ─────────────────────────────────────────────
// LOGIN OTP
// ─────────────────────────────────────────────

export const useLoginSendOtp = () => {
  return useMutation({
    mutationFn: sendLoginOtpApi,
  });
};

export const useRevokeDeviceDuringLogin = () => {
  return useMutation({
    mutationFn: revokeDeviceDuringLoginApi,
  });
};

export const useLoginVerifyOtp = () => {
  return useMutation({
    mutationFn: verifyLoginOtpApi,
    retry: networkRetryPolicy,
    retryDelay: networkRetryDelay,
  });
};

// ─────────────────────────────────────────────
// TOKEN
// ─────────────────────────────────────────────

export const useRefreshToken = () => {
  return useMutation({
    mutationFn: refreshTokenApi,
  });
};

// ─────────────────────────────────────────────
// LOGOUT
// ─────────────────────────────────────────────

export const useLogout = () => {
  return useMutation({
    mutationFn: logoutApi,
  });
};

// ─────────────────────────────────────────────
// RESEND OTP
// ─────────────────────────────────────────────

export const useResendOtp = () => {
  return useMutation({
    mutationFn: (data: {
      email: string;
      purpose?: "login" | "register" | "admin_login";
    }) => resendOtpApi(data),
  });
};

// ─────────────────────────────────────────────
// BACKWARD COMPATIBILITY
// ─────────────────────────────────────────────

// Existing code using useRegister()
export const useRegister = useRegisterSendOtp;

// Existing code using useVerifyRegisterOtp()
export const useVerifyRegisterOtp = useRegisterVerifyOtp;

// Existing code using useCompleteRegister()
export const useCompleteRegister = useRegisterComplete;

// IMPORTANT:
// Old code using useLogin() will continue OTP login
export const useLogin = useLoginSendOtp;

// Existing code using useVerifyLoginOtp()
export const useVerifyLoginOtp = useLoginVerifyOtp;