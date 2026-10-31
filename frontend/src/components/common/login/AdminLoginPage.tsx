import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";

import { useAuthStore } from "../../../core/auth/auth.store";
import { useUserStore } from "../../../store/user.store";
import { useAdminLogin, useRevokeDeviceDuringLogin } from "../../../hooks/useAuth";

import { Mail, Lock, Eye, EyeOff, ShieldCheck, ShieldAlert, ArrowRight, Loader2, RefreshCw } from "lucide-react";
import AccountSuspended from "./AccountSuspended";
import AccountLocked from "./AccountLocked";
import SessionLimit from "./SessionLimit";
import Reactivate from "./Reactivate";
import { DemoRoleSelector } from "./DemoRoleSelector";
import AuthShell from "./AuthShell";

const AdminLoginPage: React.FC = () => {
    const navigate = useNavigate();

    const { setTempAuth, setOtpMeta, status } = useAuthStore();

    const isAuthenticated = useUserStore(
        (state) => state.isAuthenticated
    );

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errorMsg, setErrorMsg] = useState("");
    const [showPassword, setShowPassword] = useState(false);
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

    const loginMutation = useAdminLogin();
    const revokeDeviceMutation = useRevokeDeviceDuringLogin();

    useEffect(() => {
        if (isAuthenticated && status) {
            navigate("/", { replace: true });
        }
    }, [isAuthenticated, status, navigate]);

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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        setErrorMsg("");

        const trimmedEmail = email.trim();
        const trimmedPassword = password.trim();

        if (!trimmedEmail || !trimmedPassword) {
            setErrorMsg("Email and password are required.");
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(trimmedEmail)) {
            setErrorMsg("Enter a complete email address with an @ and domain.");
            return;
        }

        loginMutation.mutate(
            {
                email: trimmedEmail,
                password: trimmedPassword,
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

                    setTempAuth(trimmedEmail, "admin_login", { otpMeta });

                    navigate("/otp-verify", { replace: true });
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
                    const data = error?.response?.data;
                    let msg = data?.message || error?.message || "Invalid email or password.";

                    if (status === 423 || code === "ACCOUNT_LOCKED" || message.includes("lock") || message.includes("blocked")) {
                        setIsAccountLocked(true);

                        const meta = error?.response?.data?.meta;

                        const attempts = meta?.failedAttempts || meta?.resendAttempts || meta?.maxAttempts;
                        if (attempts) setLockMaxAttempts(attempts);

                        const blockedMins = meta?.temporaryBlockedMinutes || meta?.lockDurationMinutes || (meta?.lockDurationHours ? meta.lockDurationHours * 60 : undefined);
                        if (blockedMins) setLockDurationMinutes(blockedMins);

                        const otpData = data?.otp || data?.data?.otp || meta;
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
                        const meta = data?.meta;
                        const deletedAt = meta?.deletedAt || data?.deletedAt;
                        setAccountDeletedAt(deletedAt || null);
                        setIsAccountInactive(true);
                        return;
                    }

                    if (code === "SESSION_LIMIT") {
                        setIsSessionLimit(true);
                        setActiveDevices(data?.meta?.activeDevices || data?.activeDevices || error?.response?.data?.activeDevices || []);
                        return;
                    }

                    if (data?.code === "USER_NOT_FOUND" || msg === "User not found") {
                        msg = "Email not found. Please check and try again.";
                    } else if (msg === "Incorrect password") {
                        msg = "Password incorrect. Please try again.";
                    }

                    setErrorMsg(msg);
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
                    setPassword("");
                    setAccountDeletedAt(null);
                }}
            />
        );
    }

    return (
        <AuthShell activePortal="admin" badgeText="Enterprise Administration Console">
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
            ) : !isNetworkError ? (
                <div className="w-full">
                    {/* Header Eyebrow & Title */}
                    <div className="mb-3.5">
                        <div className="flex items-center gap-1.5 mb-1">
                            <span className="inline-block text-[11px] font-bold tracking-wider text-cyan-400 uppercase">
                                Governance & Staff Console
                            </span>
                            <span className="text-slate-600">·</span>
                            <span className="text-[10px] text-slate-400 font-medium">Secured RBAC</span>
                        </div>
                        <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                            Staff & Admin Portal
                        </h2>
                        <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                            Sign in with your administrative credentials to manage platform policies, curriculum, and governance.
                        </p>
                    </div>

                    <DemoRoleSelector
                        onSelectEmail={setEmail}
                        onSelectPassword={setPassword}
                        isAdminLogin={true}
                    />

                    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3">
                        {/* Email field */}
                        <div>
                            <label
                                htmlFor="admin-email"
                                className="block text-xs font-semibold text-slate-300 mb-1.5"
                            >
                                Admin / Staff Email
                            </label>
                            <div className="relative group">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 group-focus-within:text-cyan-400 transition-colors">
                                    <Mail className="h-4 w-4" />
                                </div>
                                <input
                                    id="admin-email"
                                    type="email"
                                    value={email}
                                    autoComplete="email"
                                    placeholder="admin@nexus.org"
                                    onChange={(e) => {
                                        setEmail(e.target.value);
                                        setErrorMsg("");
                                    }}
                                    className="w-full rounded-xl border border-white/10 bg-slate-950/70 pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 shadow-inner outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/25"
                                />
                            </div>
                        </div>

                        {/* Password field */}
                        <div>
                            <label
                                htmlFor="admin-password"
                                className="block text-xs font-semibold text-slate-300 mb-1.5"
                            >
                                Password
                            </label>
                            <div className="relative group">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 group-focus-within:text-cyan-400 transition-colors">
                                    <Lock className="h-4 w-4" />
                                </div>
                                <input
                                    id="admin-password"
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    autoComplete="current-password"
                                    placeholder="••••••••"
                                    onChange={(e) => {
                                        setPassword(e.target.value);
                                        setErrorMsg("");
                                    }}
                                    className="w-full rounded-xl border border-white/10 bg-slate-950/70 pl-10 pr-10 py-2.5 text-sm text-white placeholder-slate-500 shadow-inner outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/25"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white transition-colors cursor-pointer"
                                    tabIndex={-1}
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-4 w-4" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Error Message */}
                        {errorMsg && (
                            <div className="flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/25 px-3 py-2 text-xs text-red-300">
                                <ShieldAlert className="h-4 w-4 text-red-400 shrink-0" />
                                <span>{errorMsg}</span>
                            </div>
                        )}

                        {/* Sign In Button */}
                        <button
                            type="submit"
                            disabled={loginMutation.isPending}
                            className="mt-1.5 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 font-bold text-white shadow-lg shadow-blue-600/25 transition-all hover:brightness-110 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-xs sm:text-sm"
                        >
                            {loginMutation.isPending ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                                    <span>Authenticating console...</span>
                                </>
                            ) : (
                                <>
                                    <span>Sign In to Console</span>
                                    <ArrowRight className="h-4 w-4" />
                                </>
                            )}
                        </button>

                        {/* Security notice with lock icon */}
                        <div className="flex items-start gap-2 rounded-xl border border-white/[0.08] bg-white/[0.02] p-2.5 text-[11px] text-slate-400 mt-1">
                            <ShieldCheck className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
                            <p className="leading-relaxed">
                                Administrative access enforces multi-factor security verification and automated session expiration under zero-trust governance.
                            </p>
                        </div>

                        {/* Sign in as learner link */}
                        <div className="text-center pt-1">
                            <Link
                                to="/login"
                                className="text-xs font-semibold text-slate-300 hover:text-cyan-400 transition-colors inline-flex items-center gap-1"
                            >
                                Looking for Learner Access? Switch to Learner Portal →
                            </Link>
                        </div>
                    </form>
                </div>
            ) : (
                /* Connection Lost View */
                <div className="flex flex-col items-center justify-center text-center py-4">
                    <div className="h-16 w-16 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center mb-4 shadow-lg text-red-400">
                        <RefreshCw className="h-7 w-7" />
                    </div>

                    <span className="text-xs font-bold tracking-widest text-slate-400 uppercase mb-1">
                        Network
                    </span>

                    <h2 className="text-2xl font-bold text-white mb-2">
                        Connection Lost
                    </h2>

                    <p className="text-xs text-slate-400 mb-6 max-w-xs leading-relaxed">
                        We could not reach the server. Please check your internet connection and try again.
                    </p>

                    <button
                        onClick={() => setIsNetworkError(false)}
                        className="w-full h-11 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-colors flex items-center justify-center cursor-pointer"
                    >
                        Retry Connection
                    </button>
                </div>
            )}
        </AuthShell>
    );
};

export default AdminLoginPage;