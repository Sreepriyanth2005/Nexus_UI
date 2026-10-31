import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";

import { useAuthStore } from "../../../core/auth/auth.store";
import { useUserStore } from "../../../store/user.store";
import { useLoginSendOtp, useRevokeDeviceDuringLogin } from "../../../hooks/useAuth";

import AccountSuspended from "./AccountSuspended";
import AccountLocked from "./AccountLocked";
import SessionLimit from "./SessionLimit";
import NetworkError from "./NetworkError";
import LoginAccount from "./LoginAccount";
import Reactivate from "./Reactivate";
import AuthShell from "./AuthShell";

const LoginPage: React.FC = () => {
    const navigate = useNavigate();

    const { setTempAuth, status } = useAuthStore();

    const isAuthenticated = useUserStore(
        (state) => state.isAuthenticated
    );

    const [email, setEmail] = useState("");
    const [errorMsg, setErrorMsg] = useState("");
    const [adminRedirect, setAdminRedirect] = useState(false);
    const [isNetworkError, setIsNetworkError] = useState(false);
    const [isAccountLocked, setIsAccountLocked] = useState(false);
    const [isAccountSuspended, setIsAccountSuspended] = useState(false);
    const [isAccountInactive, setIsAccountInactive] = useState(false);
    const [accountDeletedAt, setAccountDeletedAt] = useState<string | null>(null);
    const [isSessionLimit, setIsSessionLimit] = useState(false);
    const [activeDevices, setActiveDevices] = useState<any[]>([]);
    const [lockExpiresAt, setLockExpiresAt] = useState<string | null>(null);
    const [lockUnlockSeconds, setLockUnlockSeconds] = useState<number>(0);
    const [lockMaxAttempts, setLockMaxAttempts] = useState<number>();
    const [lockDurationMinutes, setLockDurationMinutes] = useState<number>();

    const loginSendOtpMutation = useLoginSendOtp();
    const revokeDeviceMutation = useRevokeDeviceDuringLogin();

    useEffect(() => {
        if (!lockUnlockSeconds || lockUnlockSeconds <= 0) return;
        const interval = setInterval(() => {
            setLockUnlockSeconds((prev) => Math.max(0, prev - 1));
        }, 1000);
        return () => clearInterval(interval);
    }, [lockUnlockSeconds]);

    /* ─── Format lock duration from minutes to days/hours/minutes ─── */
    const formatLockDuration = (minutes?: number) => {
        if (!minutes) return "24 hours";
        if (minutes >= 1440) {
            const days = Math.floor(minutes / 1440);
            const remainingMinutes = minutes % 1440;
            const hours = Math.floor(remainingMinutes / 60);
            const mins = remainingMinutes % 60;
            let res = `${days} day${days > 1 ? 's' : ''}`;
            if (hours > 0) res += ` ${hours} hour${hours > 1 ? 's' : ''}`;
            if (mins > 0) res += ` ${mins} minute${mins > 1 ? 's' : ''}`;
            return res;
        } else if (minutes >= 60) {
            const hours = Math.floor(minutes / 60);
            const mins = minutes % 60;
            let res = `${hours} hour${hours > 1 ? 's' : ''}`;
            if (mins > 0) res += ` ${mins} minute${mins > 1 ? 's' : ''}`;
            return res;
        }
        return `${minutes} minute${minutes > 1 ? 's' : ''}`;
    };

    /* ─── Format unlock countdown ─── */
    const formatUnlocksAt = (expiresAt?: string | null) => {
        if (!expiresAt) return "";
        const date = new Date(expiresAt);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');

        const offsetMinutes = -date.getTimezoneOffset();
        const offsetHrs = Math.floor(Math.abs(offsetMinutes) / 60);
        const offsetMins = Math.abs(offsetMinutes) % 60;
        const tzSign = offsetMinutes >= 0 ? "+" : "-";
        const tzStr = offsetMins > 0
            ? `${tzSign}${offsetHrs}:${String(offsetMins).padStart(2, '0')}`
            : `${tzSign}${offsetHrs}`;

        return `${day}/${month}/${year}, ${hours}:${minutes} GMT${tzStr}`;
    };

    const getUnlockInText = (secs: number) => {
        if (secs <= 0) return "0 min";
        const hrs = Math.floor(secs / 3600);
        const mins = Math.floor((secs % 3600) / 60);
        if (hrs > 0) return `${hrs} hr ${mins} min`;
        return `${mins} min`;
    };

    useEffect(() => {
        if (isAuthenticated && status) {
            navigate("/", { replace: true });
        }
    }, [isAuthenticated, status, navigate]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        setErrorMsg("");

        const trimmedEmail = email.trim();

        if (!trimmedEmail) {
            setErrorMsg("Please enter your email.");
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(trimmedEmail)) {
            setErrorMsg("Enter a complete email address with an @ and domain.");
            return;
        }

        loginSendOtpMutation.mutate(
            {
                email: trimmedEmail,
            },
            {
                onSuccess: (response: any) => {
                    setErrorMsg("");

                    let otpMeta =
                        response?.otp ??
                        response?.data?.otp ??
                        response?.otpMeta ??
                        response?.data?.otpMeta ??
                        response?.meta ??
                        response?.data?.meta ??
                        null;

                    if (!otpMeta && (response?.expiresAt || response?.otpExpirySeconds)) otpMeta = response;
                    if (!otpMeta && (response?.data?.expiresAt || response?.data?.otpExpirySeconds)) otpMeta = response.data;

                    setTempAuth(
                        trimmedEmail,
                        "login",
                        {
                            otpMeta,
                        }
                    );

                    navigate("/otp-verify", {
                        replace: true,
                    });
                },

                onError: (error: any) => {
                    const message = (error?.response?.data?.message || error?.message || "").toLowerCase();

                    if (
                        error?.message === "Network Error" ||
                        (!error?.response && error?.request) ||
                        message.includes("connection is closed") ||
                        message.includes("max retries per request")
                    ) {
                        setIsNetworkError(true);
                        return;
                    }
                    setIsNetworkError(false);

                    const status = error?.response?.status;
                    const code = error?.response?.data?.code;

                    if (status === 423 || code === "ACCOUNT_LOCKED" || message.includes("lock") || message.includes("blocked")) {
                        setIsAccountLocked(true);

                        const meta = error?.response?.data?.meta;

                        const attempts = meta?.failedAttempts || meta?.resendAttempts || meta?.maxAttempts;
                        if (attempts) setLockMaxAttempts(attempts);

                        const blockedMins = meta?.temporaryBlockedMinutes || meta?.lockDurationMinutes || (meta?.lockDurationHours ? meta.lockDurationHours * 60 : undefined);
                        if (blockedMins) setLockDurationMinutes(blockedMins);

                        const otpData = error?.response?.data?.otp || error?.response?.data?.data?.otp || meta;
                        if (otpData?.lockExpiresAt) {
                            setLockExpiresAt(otpData.lockExpiresAt);
                            setLockUnlockSeconds(Math.max(0, Math.floor((new Date(otpData.lockExpiresAt).getTime() - Date.now()) / 1000)));
                        }
                        return;
                    }

                    if (code === "ACCOUNT_SUSPENDED" || message.includes("suspended")) {
                        setIsAccountSuspended(true);
                        return;
                    }

                    if (code === "ACCOUNT_INACTIVE" || code === "ACCOUNT_DELETED" || message.includes("inactive") || message.includes("deleted")) {
                        const meta = error?.response?.data?.meta;
                        const deletedAt = meta?.deletedAt || error?.response?.data?.deletedAt;
                        setAccountDeletedAt(deletedAt || null);
                        setIsAccountInactive(true);
                        return;
                    }

                    if (code === "ADMIN_LOGIN_REQUIRED") {
                        setAdminRedirect(true);
                        setErrorMsg("");
                        return;
                    }
                    if (code === "SESSION_LIMIT") {
                        setIsSessionLimit(true);
                        setActiveDevices(error?.response?.data?.meta?.activeDevices || error?.response?.data?.activeDevices || []);
                        return;
                    }
                    setAdminRedirect(false);
                    setErrorMsg(
                        error?.response?.data?.message ||
                        error?.message ||
                        "Failed to send OTP. Please try again."
                    );
                },
            }
        );
    };

    const handleRevokeDeviceOnly = (deviceId: string) => {
        revokeDeviceMutation.mutate(
            { email: email.trim(), deviceId },
            {
                onSuccess: (response: any) => {
                    setErrorMsg("");
                    setActiveDevices(response.activeDevices || []);
                },
                onError: (error: any) => {
                    setErrorMsg(error?.response?.data?.message || error?.message || "Failed to revoke device.");
                }
            }
        );
    };

    if (isAccountInactive) {
        return (
            <Reactivate
                email={email.trim()}
                deletedAt={accountDeletedAt}
                onCancel={() => {
                    setIsAccountInactive(false);
                    setEmail("");
                    setAccountDeletedAt(null);
                }}
            />
        );
    }

    return (
        <AuthShell activePortal="learner" badgeText="Enterprise Learning Portal">
            {isAccountSuspended ? (
                <AccountSuspended onBackToHome={() => { setIsAccountSuspended(false); setEmail(""); }} />
            ) : isAccountLocked ? (
                <AccountLocked
                    lockMaxAttempts={lockMaxAttempts}
                    lockDurationMinutes={lockDurationMinutes}
                    lockUnlockSeconds={lockUnlockSeconds}
                    lockExpiresAt={lockExpiresAt}
                    onBackToSignIn={() => setIsAccountLocked(false)}
                />
            ) : isSessionLimit ? (
                <SessionLimit
                    activeDevices={activeDevices}
                    onRevokeDevice={handleRevokeDeviceOnly}
                    onCancel={() => setIsSessionLimit(false)}
                    isPending={revokeDeviceMutation.isPending}
                />
            ) : isNetworkError ? (
                <NetworkError
                    onRetry={() => setIsNetworkError(false)}
                />
            ) : (
                <LoginAccount
                    email={email}
                    setEmail={setEmail}
                    errorMsg={errorMsg}
                    setErrorMsg={setErrorMsg}
                    adminRedirect={adminRedirect}
                    setAdminRedirect={setAdminRedirect}
                    handleSubmit={handleSubmit}
                    isPending={loginSendOtpMutation.isPending}
                />
            )}
        </AuthShell>
    );
};

export default LoginPage;