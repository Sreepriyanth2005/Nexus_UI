import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router";
import * as Sentry from "@sentry/react";
import { useAuthStore } from "../../../core/auth/auth.store";
import { useUserStore } from "../../../store/user.store";
import {
    useRegisterVerifyOtp,
    useRegisterComplete,
    useResendOtp
} from "../../../hooks/useAuth";
import { roleMenuConfig } from "../menu/menuConfig";
import AccountSuspended from "../login/AccountSuspended";
import AccountLocked from "../login/AccountLocked";
import SessionLimit from "../login/SessionLimit";
import NetworkError from "../login/NetworkError";
import Reactivate from "../login/Reactivate";
import AuthShell from "../login/AuthShell";
import { Button } from "../../ui/Button";

/* ─── Error state type ─── */
type ErrorType = "incorrect" | "locked" | "suspended" | "session_limit" | "network" | "inactive" | null;

/* ─── Shared dark card wrapper ─── */
const DarkCard: React.FC<{ children: React.ReactNode; redBorder?: boolean }> = ({ children, redBorder }) => (
    // <div className={`w-full max-w-[480px] bg-black/40 backdrop-blur-xl rounded-3xl p-8 sm:p-10 border ${redBorder ? "border-red-500/80" : "border-white/10"} shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] text-white`}>
    <div className={`w-full max-w-[480px] p-8 sm:p-10  text-white`}>
        {children}
    </div>
);

/* ─── Icon circle ─── */
const IconCircle: React.FC<{ bg: string; border?: string; children: React.ReactNode }> = ({ bg, border, children }) => (
    <div className="flex justify-center mb-5">
        <div className={`w-14 h-14 rounded-full flex items-center justify-center ${bg} ${border ?? ""}`}>
            {children}
        </div>
    </div>
);

/* ─── Primary (yellow/gold) button ─── */
const BtnPrimary: React.FC<{ onClick?: () => void; disabled?: boolean; children: React.ReactNode }> = ({ onClick, disabled, children }) => (
    <Button onClick={onClick} disabled={disabled}
        className="w-full py-4 text-body font-bold text-gray-900 bg-[#efb322] hover:bg-[#e0a61d] active:scale-[0.99] rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg cursor-pointer mb-3">
        {children}
    </Button>
);

/* ─── Outline button ─── */
const BtnOutline: React.FC<{ onClick?: () => void; children: React.ReactNode }> = ({ onClick, children }) => (
    <Button onClick={onClick}
        className="w-full py-3.5 text-meta font-semibold text-white bg-white/10 border border-white/20 rounded-full hover:bg-white/20 transition-colors cursor-pointer mb-3">
        {children}
    </Button>
);

/* ─── Footnote ─── */
const Footnote: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <p className="text-label text-white/60 text-center mt-2 leading-relaxed">{children}</p>
);

/* ─── OTP digit box ─── */
interface OtpBoxProps {
    digit: string; index: number; hasError: boolean; isFocused: boolean;
    inputRefs: React.MutableRefObject<(HTMLInputElement | null)[]>;
    onChange: (v: string, i: number) => void;
    onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>, i: number) => void;
    onPaste: (e: React.ClipboardEvent<HTMLInputElement>) => void;
    onFocus: (i: number) => void;
}
const OtpBox: React.FC<OtpBoxProps> = ({ digit, index, hasError, isFocused, inputRefs, onChange, onKeyDown, onPaste, onFocus }) => (
    <input
        ref={(el) => { inputRefs.current[index] = el; }}
        type="text" inputMode="numeric" maxLength={1} value={digit}
        onChange={(e) => onChange(e.target.value, index)}
        onKeyDown={(e) => onKeyDown(e, index)}
        onPaste={onPaste}
        onFocus={() => onFocus(index)}
        className={`w-full max-w-[48px] sm:max-w-[54px] h-[52px] sm:h-[58px] text-center text-xl sm:text-2xl font-mono font-bold rounded-xl outline-none transition-all duration-150 cursor-text bg-slate-950/80 text-white shadow-inner border ${
            hasError
                ? "border-red-500 ring-2 ring-red-500/40"
                : isFocused || digit
                ? "border-[#f1b020] ring-2 ring-[#f1b020]/40"
                : "border-white/10 hover:border-white/30"
        }`}
    />
);

/* ══════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════ */
const RegisterVerifyOtp: React.FC = () => {
    const navigate = useNavigate();
    const { tempAuth, otpMeta, setAuth, logout, setOtpMeta, status } = useAuthStore();
    const { isAuthenticated, user } = useUserStore();

    const [otp, setOtp] = useState(["", "", "", "", "", ""]);
    const [focusedIndex, setFocusedIndex] = useState<number>(0);
    const [errorType, setErrorType] = useState<ErrorType>(null);
    const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);
    const [maxAttempts, setMaxAttempts] = useState<number>();
    const [failedAttempts, setFailedAttempts] = useState<number>();
    const [lockDurationMinutes, setLockDurationMinutes] = useState<number>();
    const [lockUnlockSeconds, setLockUnlockSeconds] = useState(0);
    const [lockUnlockAt, setLockUnlockAt] = useState("");
    const [otpExpiry, setOtpExpiry] = useState(0);
    const [resendTimer, setResendTimer] = useState(0);
    const [showResendSuccess, setShowResendSuccess] = useState(false);
    const [showLockStatus, setShowLockStatus] = useState(false);
    const [statusText, setStatusText] = useState("");

    const verifyOtpMutation = useRegisterVerifyOtp();
    const completeRegisterMutation = useRegisterComplete();
    const resendMutation = useResendOtp();
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    const purpose = tempAuth?.purpose || "register";
    const email = tempAuth?.email || "";

    const blockMins = (otpMeta as any)?.temporaryBlockedMinutes || (otpMeta as any)?.lockDurationMinutes || ((otpMeta as any)?.lockDurationHours ? (otpMeta as any).lockDurationHours * 60 : undefined) || 24 * 60;
    const blockDurationText = blockMins >= 60 && blockMins % 60 === 0
        ? `${blockMins / 60} hour${blockMins / 60 > 1 ? "s" : ""}`
        : `${blockMins} minute${blockMins > 1 ? "s" : ""}`;

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

    /* ─── Classify API error into ErrorType ─── */
    const classifyError = (error: any): ErrorType => {
        if (!error.response || error.message === "Network Error" || (error.response?.data?.message || "").toLowerCase().includes("connection is closed") || (error.message || "").toLowerCase().includes("connection is closed") || (error.message || "").toLowerCase().includes("max retries per request")) return "network";
        const status = error.response?.status;
        const code = error.response?.data?.code || "";
        const message: string = (error.response?.data?.message || error.message || "").toLowerCase();

        if (status === 423 || code === "ACCOUNT_LOCKED" || message.includes("lock") || message.includes("24 hour")) return "locked";
        if (code === "ACCOUNT_INACTIVE" || code === "ACCOUNT_DELETED" || message.includes("inactive") || message.includes("deleted")) return "inactive";
        if (status === 403 && (code === "ACCOUNT_SUSPENDED" || message.includes("suspend") || message.includes("unavailable"))) return "suspended";
        if (status === 429 && (code === "SESSION_LIMIT" || message.includes("session") || message.includes("device"))) return "session_limit";
        if (status === 401 || status === 400 || code === "INVALID_OTP" || message.includes("invalid") || message.includes("incorrect") || message.includes("wrong") || message.includes("match")) return "incorrect";
        return "incorrect";
    };

    /* ─── Format time mm:ss ─── */
    const fmt = (s: number) => `${Math.floor(s / 60)}:${s % 60 < 10 ? "0" : ""}${s % 60}`;

    const getUnlockInText = (seconds: number) => {
        if (seconds <= 0) return "0 min";
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        if (h > 0) return `${h} hr ${m} min`;
        return `${m} min`;
    };

    const formatUnlocksAt = (isoString?: string | null) => {
        if (!isoString) return "";
        try {
            const date = new Date(isoString);
            const day = String(date.getDate()).padStart(2, '0');
            const month = date.toLocaleString('en-GB', { month: 'short' });
            const year = date.getFullYear();
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            return `${day} ${month} ${year}, ${hours}:${minutes}`;
        } catch {
            return "";
        }
    };

    /* ─── Resend timer from otpMeta ─── */
    useEffect(() => {
        if (otpMeta?.resendAvailableAt) {
            const tick = () => setResendTimer(Math.max(0, Math.floor((new Date(otpMeta.resendAvailableAt).getTime() - Date.now()) / 1000)));
            tick();
            const id = setInterval(tick, 1000);
            return () => clearInterval(id);
        } else if (otpMeta?.resendCooldownSeconds) {
            setResendTimer(otpMeta.resendCooldownSeconds);
            const id = setInterval(() => {
                setResendTimer((prev) => Math.max(0, prev - 1));
            }, 1000);
            return () => clearInterval(id);
        } else {
            setResendTimer(59);
            const id = setInterval(() => {
                setResendTimer((prev) => Math.max(0, prev - 1));
            }, 1000);
            return () => clearInterval(id);
        }
    }, [otpMeta?.resendAvailableAt, otpMeta?.resendCooldownSeconds]);

    /* ─── OTP expiry from otpMeta ─── */
    useEffect(() => {
        if (otpMeta?.expiresAt) {
            const tick = () => setOtpExpiry(Math.max(0, Math.floor((new Date(otpMeta.expiresAt).getTime() - Date.now()) / 1000)));
            tick();
            const id = setInterval(tick, 1000);
            return () => clearInterval(id);
        } else if (otpMeta?.otpExpirySeconds) {
            setOtpExpiry(otpMeta.otpExpirySeconds);
            const id = setInterval(() => {
                setOtpExpiry((prev) => Math.max(0, prev - 1));
            }, 1000);
            return () => clearInterval(id);
        } else {
            const id = setInterval(() => {
                setOtpExpiry((prev) => Math.max(0, prev - 1));
            }, 1000);
            return () => clearInterval(id);
        }
    }, [otpMeta?.expiresAt, otpMeta?.otpExpirySeconds]);

    /* ─── Lock countdown ─── */
    useEffect(() => {
        if (!lockUnlockSeconds) return;
        const id = setInterval(() => setLockUnlockSeconds((p) => Math.max(0, p - 1)), 1000);
        return () => clearInterval(id);
    }, [lockUnlockSeconds > 0]);

    /* ─── Sync otpMeta attempts ─── */
    useEffect(() => {
        if (otpMeta?.remainingVerifyAttempts != null) setRemainingAttempts(otpMeta.remainingVerifyAttempts);
        if (otpMeta?.maxOtpVerifyAttempts) setMaxAttempts(otpMeta.maxOtpVerifyAttempts);

        if (otpMeta?.lockExpiresAt) {
            const d = new Date(otpMeta.lockExpiresAt);
            if (d.getTime() > Date.now()) {
                const secs = Math.max(0, Math.floor((d.getTime() - Date.now()) / 1000));
                setLockUnlockSeconds(secs);
                const tz = -d.getTimezoneOffset() / 60;
                const tzStr = tz >= 0 ? `+${tz}` : `${tz}`;
                const dateStr = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, '0') + "-" + String(d.getDate()).padStart(2, '0');
                const timeStr = String(d.getHours()).padStart(2, '0') + ":" + String(d.getMinutes()).padStart(2, '0');
                setLockUnlockAt(`${dateStr} ${timeStr} GMT${tzStr}`);
                setErrorType("locked");
            }
        }
    }, [otpMeta]);

    /* ─── Redirect if no tempAuth ─── */
    useEffect(() => {
        if (!tempAuth?.email) navigate("/register", { replace: true });
    }, [tempAuth, navigate]);

    /* ─── Redirect after login ─── */
    useEffect(() => {
        if (isAuthenticated && status) {
            const role = String(user?.roles?.[0] || (user as any)?.role || "MEMBER").toUpperCase();
            navigate(roleMenuConfig?.[role]?.[0]?.path || "/", { replace: true });
        }
    }, [isAuthenticated, status, navigate, user]);

    /* ─── OTP handlers ─── */
    const handleChange = (value: string, index: number) => {
        if (isNaN(Number(value))) return;
        const n = [...otp]; n[index] = value.slice(-1); setOtp(n);
        if (value && index < 5) inputRefs.current[index + 1]?.focus();
    };
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
        if (e.key === "Backspace" && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
            setFocusedIndex(index - 1);
        }
    };
    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        const p = e.clipboardData.getData("text").trim();
        if (!/^\d+$/.test(p)) return;
        const n = [...otp];
        for (let i = 0; i < 6; i++) { if (i < p.length) n[i] = p[i]; }
        setOtp(n);
        const lastIndex = Math.min(p.length, 5);
        inputRefs.current[lastIndex]?.focus();
        setFocusedIndex(lastIndex);
    };

    /* ─── Verify ─── */
    const handleVerify = () => {
        const code = otp.join("");
        if (code.length !== 6) return;

        setStatusText("Verifying verification code...");

        verifyOtpMutation.mutate(
            { email, otp: code },
            {
                onSuccess: (verifyData: any) => {
                    const verificationToken = verifyData?.verificationToken || verifyData?.data?.verificationToken;

                    if (!verificationToken) {
                        setErrorType("incorrect");
                        setStatusText("");
                        return;
                    }

                    setStatusText("Provisioning institutional workspace & accounts...");

                    completeRegisterMutation.mutate(
                        { verificationToken },
                        {
                            onSuccess: (completeData: any) => {
                                setStatusText("");
                                const user = completeData?.user || completeData?.data?.user;
                                const auth = completeData?.auth || completeData?.data?.auth;

                                setAuth(
                                    auth?.accessToken || null,
                                    user?.role || user?.roles?.[0] || "MEMBER",
                                    user,
                                    auth?.refreshToken || null
                                );

                                const userRole = user?.role || user?.roles?.[0] || "MEMBER";
                                const dashboardPath = roleMenuConfig?.[String(userRole).toUpperCase()]?.[0]?.path || "/";
                                navigate(dashboardPath, { replace: true });
                            },
                            onError: (error: any) => {
                                setStatusText("");
                                const rd = error?.response?.data;
                                if (rd?.otp) {
                                    setOtpMeta(rd.otp);
                                    const failCount = rd.otp.failedAttempts ?? rd.otp.resendAttempts;
                                    if (failCount != null) setFailedAttempts(failCount);

                                    const maxCount = rd.otp.maxOtpVerifyAttempts ?? rd.otp.maxAttempts;
                                    if (maxCount != null) setMaxAttempts(maxCount);

                                    if (rd.otp.remainingVerifyAttempts != null) {
                                        setRemainingAttempts(rd.otp.remainingVerifyAttempts);
                                    } else if (maxCount != null && failCount != null) {
                                        setRemainingAttempts(Math.max(0, maxCount - failCount));
                                    }

                                    const blockedMins = rd.otp.temporaryBlockedMinutes || rd.otp.lockDurationMinutes || (rd.otp.lockDurationHours ? rd.otp.lockDurationHours * 60 : undefined);
                                    if (blockedMins) setLockDurationMinutes(blockedMins);

                                    /* lock expiry */
                                    if (rd.otp.lockExpiresAt) {
                                        const d = new Date(rd.otp.lockExpiresAt);
                                        const secs = Math.max(0, Math.floor((d.getTime() - Date.now()) / 1000));
                                        setLockUnlockSeconds(secs);
                                    }
                                }
                                Sentry.captureException(new Error(rd?.message || error?.message));
                                setErrorType(classifyError(error));
                            }
                        }
                    );
                },
                onError: (error: any) => {
                    setStatusText("");
                    const rd = error?.response?.data;
                    if (rd?.otp) {
                        setOtpMeta(rd.otp);
                        const failCount = rd.otp.failedAttempts ?? rd.otp.resendAttempts;
                        if (failCount != null) setFailedAttempts(failCount);

                        const maxCount = rd.otp.maxOtpVerifyAttempts ?? rd.otp.maxAttempts;
                        if (maxCount != null) setMaxAttempts(maxCount);

                        if (rd.otp.remainingVerifyAttempts != null) {
                            setRemainingAttempts(rd.otp.remainingVerifyAttempts);
                        } else if (maxCount != null && failCount != null) {
                            setRemainingAttempts(Math.max(0, maxCount - failCount));
                        }

                        const blockedMins = rd.otp.temporaryBlockedMinutes || rd.otp.lockDurationMinutes || (rd.otp.lockDurationHours ? rd.otp.lockDurationHours * 60 : undefined);
                        if (blockedMins) setLockDurationMinutes(blockedMins);

                        /* lock expiry */
                        if (rd.otp.lockExpiresAt) {
                            const d = new Date(rd.otp.lockExpiresAt);
                            const secs = Math.max(0, Math.floor((d.getTime() - Date.now()) / 1000));
                            setLockUnlockSeconds(secs);
                            const tz = -d.getTimezoneOffset() / 60;
                            const tzStr = tz >= 0 ? `+${tz}` : `${tz}`;
                            const dateStr = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, '0') + "-" + String(d.getDate()).padStart(2, '0');
                            const timeStr = String(d.getHours()).padStart(2, '0') + ":" + String(d.getMinutes()).padStart(2, '0');
                            setLockUnlockAt(`${dateStr} ${timeStr} GMT${tzStr}`);
                        }
                    }
                    Sentry.captureException(new Error(rd?.message || error?.message));
                    setErrorType(classifyError(error));
                }
            }
        );
    };

    /* ─── Resend ─── */
    const handleResend = () => {
        resendMutation.mutate(
            { email, purpose },
            {
                onSuccess: (data: any) => {
                    if (data?.otp) {
                        setOtpMeta(data.otp);
                    }
                    setOtp(["", "", "", "", "", ""]);
                    setErrorType(null);
                    setShowResendSuccess(true);
                    setStatusText("");
                    setFocusedIndex(0);
                    setTimeout(() => inputRefs.current[0]?.focus(), 50);
                },
                onError: (error: any) => {
                    Sentry.captureException(new Error(error?.message));
                    setErrorType(classifyError(error));
                }
            }
        );
    };

    const lockHrs = Math.floor(lockUnlockSeconds / 3600);
    const lockMins = Math.floor((lockUnlockSeconds % 3600) / 60);
    const isPending = verifyOtpMutation.isPending || completeRegisterMutation.isPending;
    const failureCount = verifyOtpMutation.failureCount + completeRegisterMutation.failureCount;

    /* ══════════════ RENDER ══════════════ */
    if (errorType === "inactive") {
        return <Reactivate onCancel={() => { setErrorType(null); navigate("/register"); }} />;
    }

    return (
        <AuthShell activePortal="register" badgeText="Learner Registration Verification">
            {errorType === "suspended" ? (
                <AccountSuspended onBackToHome={() => { logout(); navigate("/register"); }} />
            ) : errorType === "locked" ? (
                <AccountLocked
                    lockMaxAttempts={maxAttempts}
                    lockDurationMinutes={lockDurationMinutes}
                    lockUnlockSeconds={lockUnlockSeconds}
                    lockExpiresAt={otpMeta?.lockExpiresAt || (errorType === "locked" ? new Date(Date.now() + lockUnlockSeconds * 1000).toISOString() : null)}
                    onBackToSignIn={() => navigate("/register")}
                />
            ) : errorType === "session_limit" ? (
                <SessionLimit
                    activeDevices={[]}
                    onRevokeDevice={() => { }}
                    onCancel={() => { logout(); navigate("/register"); }}
                    isPending={isPending}
                />
            ) : errorType === "network" ? (
                <NetworkError
                    onRetry={() => { setErrorType(null); handleVerify(); }}
                    isPending={isPending}
                />
            ) : (
                <div className="w-full">
                    {errorType === "incorrect" ? (
                                    /* ══ INCORRECT CODE ══ */
                                    <div className="w-full">
                                        {/* Back to Sign In Button */}
                                        <button
                                            type="button"
                                            onClick={() => navigate("/register")}
                                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[11px] font-bold tracking-[0.06em] uppercase text-white/90 border border-white/20 bg-black/25 hover:bg-white/10 transition-colors mb-5 cursor-pointer shadow-sm"
                                            style={{ fontFamily: 'var(--font-sans)' }}
                                        >
                                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                                            </svg>
                                            BACK TO SIGN IN
                                        </button>

                                        <div className="flex justify-center mb-3 sm:mb-4">
                                            <div className="h-11 w-11 sm:h-12 sm:w-12 rounded-full flex items-center justify-center border border-[#d97706]/40 bg-[#d97706]/15">
                                                <span className="text-xl font-bold text-[#f59e0b]">!</span>
                                            </div>
                                        </div>
                                        <h1 className="text-2xl sm:text-[28px] font-extrabold text-center mb-2 tracking-tight text-white" style={{ fontFamily: 'var(--font-sans)' }}>Incorrect code</h1>
                                        <p className="text-center leading-[1.5] mb-4 text-xs sm:text-[14px] text-white/80" style={{ fontFamily: 'var(--font-sans)' }}>
                                            Please try again. Make sure you entered the latest 6-digit code sent to your email.
                                        </p>

                                        {remainingAttempts !== null && (
                                            <div className="mb-4 rounded-xl border border-[#d97706]/40 bg-[#d97706]/15 px-3.5 py-3 text-left">
                                                <p className="font-bold mb-1 text-xs sm:text-[13px] text-[#fcd34d]" style={{ fontFamily: 'var(--font-sans)' }}>
                                                    {otpMeta?.remainingVerifyAttempts ?? remainingAttempts} attempts remaining
                                                </p>
                                                <p className="leading-[1.5] text-xs sm:text-[13px] text-amber-100/90" style={{ fontFamily: 'var(--font-sans)' }}>
                                                    After {maxAttempts} incorrect attempts, this account will be locked for {blockDurationText}.
                                                </p>
                                            </div>
                                        )}

                                        <div className="grid grid-cols-6 gap-2 sm:gap-2.5 md:gap-3 mb-4 max-w-[420px]">
                                            {otp.map((digit, i) => (
                                                <OtpBox key={i} digit={digit} index={i} hasError={true} isFocused={focusedIndex === i}
                                                    inputRefs={inputRefs} onChange={handleChange} onFocus={setFocusedIndex}
                                                    onKeyDown={handleKeyDown} onPaste={handlePaste} />
                                            ))}
                                        </div>

                                        <Button
                                            type="button"
                                            onClick={() => handleVerify()}
                                            disabled={otp.join("").length !== 6 || isPending}
                                            className="flex h-[48px] sm:h-[52px] w-full items-center justify-center gap-2 rounded-full font-bold shadow-[0_6px_20px_-6px_rgba(0,0,0,0.4)] transition-[transform,box-shadow] duration-150 hover:-translate-y-[1px] disabled:opacity-60 disabled:cursor-not-allowed border-none outline-none text-[15px] sm:text-[16px] cursor-pointer"
                                            style={{ backgroundColor: '#f1b020', color: '#141414', fontFamily: 'var(--font-sans)' }}
                                        >
                                            {isPending ? (
                                                <>
                                                    <svg className="w-5 h-5 animate-spin mr-2" fill="none" viewBox="0 0 24 24">
                                                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
                                                        <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                                    </svg>
                                                    Verifying…
                                                </>
                                            ) : (
                                                <>
                                                    Verify code
                                                    <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                                                        <line x1="5" y1="12" x2="19" y2="12" />
                                                        <polyline points="12 5 19 12 12 19" />
                                                    </svg>
                                                </>
                                            )}
                                        </Button>

                                        <div className="flex items-center justify-between w-full mt-5 sm:mt-6">
                                            <div className="flex items-center gap-2 sm:gap-3">
                                                <span className="font-medium text-[13px] sm:text-[14px] text-white/90" style={{ fontFamily: 'var(--font-sans)' }}>Didn't get it?</span>
                                                {resendTimer > 0 ? (
                                                    <span className="px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full bg-white font-bold text-[13px] sm:text-[14px] text-[#141414]" style={{ fontFamily: 'var(--font-sans)' }}>
                                                        Resend ({fmt(resendTimer)})
                                                    </span>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        onClick={handleResend}
                                                        disabled={resendMutation.isPending}
                                                        className="px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full bg-white hover:bg-white/90 font-bold text-[13px] sm:text-[14px] text-[#141414] shadow-sm transition-colors cursor-pointer border-none disabled:opacity-60"
                                                        style={{ fontFamily: 'var(--font-sans)' }}
                                                    >
                                                        {resendMutation.isPending ? "Sending…" : "Resend code"}
                                                    </button>
                                                )}
                                            </div>
                                            <a
                                                href="mailto:support@nexus.org"
                                                className="font-bold text-[13px] sm:text-[14px] text-white hover:text-white/80 underline underline-offset-2 transition-colors"
                                                style={{ fontFamily: 'var(--font-sans)' }}
                                            >
                                                Need help?
                                            </a>
                                        </div>
                                    </div>
                                ) : (
                                    /* ══ NORMAL VIEW (MATCHES ACTUAL UI DESIGN IN SCREENSHOT EXACTLY) ══ */
                                    <div className="w-full">
                                        {/* Back to Sign In Button */}
                                        <button
                                            type="button"
                                            onClick={() => navigate("/register")}
                                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[11px] font-bold tracking-[0.06em] uppercase text-white/90 border border-white/20 bg-black/25 hover:bg-white/10 transition-colors mb-5 cursor-pointer shadow-sm"
                                            style={{ fontFamily: 'var(--font-sans)' }}
                                        >
                                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                                            </svg>
                                            BACK TO SIGN IN
                                        </button>

                                        {/* Eyebrow Header */}
                                        <p className="mb-2 text-[11px] sm:text-[12px] font-bold tracking-[0.14em] uppercase text-white/70" style={{ fontFamily: 'var(--font-sans)' }}>
                                            VERIFY YOUR EMAIL
                                        </p>

                                        {/* Main Title */}
                                        <h1 className="mb-2 sm:mb-3 text-[30px] sm:text-[34px] lg:text-[38px] font-extrabold leading-[1.08] tracking-[-0.02em] text-white [text-shadow:0_1px_6px_#0009]" style={{ fontFamily: 'var(--font-sans)' }}>
                                            Check your inbox
                                        </h1>

                                        {/* Subtitle */}
                                        <p className="mb-6 sm:mb-7 text-[14px] sm:text-[15px] md:text-[16px] leading-[1.5] text-white/85" style={{ fontFamily: 'var(--font-sans)' }}>
                                            We sent a 6-digit code to {email ? <span className="font-bold text-white">{email}</span> : "your email"}
                                        </p>

                                        {/* Resend Success Banner */}
                                        {showResendSuccess && (
                                            <div className="mb-4 rounded-xl border border-[#22c55e]/40 bg-[#22c55e]/15 p-3.5 text-center">
                                                <p className="font-bold mb-1 text-xs sm:text-sm text-[#22c55e]" style={{ fontFamily: 'var(--font-sans)' }}>New code sent! Check your inbox.</p>
                                                <p className="text-xs sm:text-[13px] text-[#22c55e]/80" style={{ fontFamily: 'var(--font-sans)' }}>A fresh 6-digit verification code has been dispatched.</p>
                                            </div>
                                        )}

                                        {/* Status Text (Creating Workspace) */}
                                        {statusText && (
                                            <div className="mb-4 rounded-xl border border-[#3b82f6]/40 bg-[#3b82f6]/15 p-3.5 flex items-center gap-3">
                                                <span className="w-2.5 h-2.5 rounded-full bg-[#60a5fa] animate-ping shrink-0" />
                                                <p className="font-medium text-xs sm:text-[13px] text-[#bfdbfe]" style={{ fontFamily: 'var(--font-sans)' }}>{statusText}</p>
                                            </div>
                                        )}

                                        {/* Input Header */}
                                        <label className="block mb-2.5 sm:mb-3 text-[14px] sm:text-[15px] md:text-[16px] font-bold text-white" style={{ fontFamily: 'var(--font-sans)' }}>
                                            Enter OTP
                                        </label>

                                        {/* 6-Digit OTP Boxes */}
                                        <div className="grid grid-cols-6 gap-2 sm:gap-2.5 md:gap-3 mb-4 sm:mb-5 max-w-[420px]">
                                            {otp.map((digit, i) => (
                                                <OtpBox
                                                    key={i}
                                                    digit={digit}
                                                    index={i}
                                                    hasError={false}
                                                    isFocused={focusedIndex === i}
                                                    inputRefs={inputRefs}
                                                    onChange={handleChange}
                                                    onKeyDown={handleKeyDown}
                                                    onPaste={handlePaste}
                                                    onFocus={setFocusedIndex}
                                                />
                                            ))}
                                        </div>

                                        {/* Code Expiry Timer */}
                                        <p className="mb-5 sm:mb-6 text-[13px] sm:text-[14px] md:text-[15px] text-white/80" style={{ fontFamily: 'var(--font-sans)' }}>
                                            Code expires in <strong className="font-bold text-white">{fmt(otpExpiry)}</strong>
                                        </p>

                                        {/* Verify Button */}
                                        <Button
                                            type="button"
                                            onClick={() => handleVerify()}
                                            disabled={otp.join("").length !== 6 || isPending}
                                            className="flex h-[48px] sm:h-[52px] w-full items-center justify-center gap-2 rounded-full font-bold shadow-[0_6px_20px_-6px_rgba(0,0,0,0.4)] transition-[transform,box-shadow] duration-150 hover:-translate-y-[1px] disabled:opacity-60 disabled:cursor-not-allowed border-none outline-none text-[15px] sm:text-[16px] cursor-pointer"
                                            style={{ backgroundColor: '#f1b020', color: '#141414', fontFamily: 'var(--font-sans)' }}
                                        >
                                            {isPending ? (
                                                <>
                                                    <svg className="w-5 h-5 animate-spin mr-2" fill="none" viewBox="0 0 24 24">
                                                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
                                                        <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                                    </svg>
                                                    {failureCount > 0
                                                        ? `Network interrupted, retrying... (${failureCount}/3)`
                                                        : completeRegisterMutation.isPending
                                                            ? "Creating workspace…"
                                                            : "Verifying…"}
                                                </>
                                            ) : (
                                                <>
                                                    Verify
                                                    <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                                                        <line x1="5" y1="12" x2="19" y2="12" />
                                                        <polyline points="12 5 19 12 12 19" />
                                                    </svg>
                                                </>
                                            )}
                                        </Button>

                                        {/* Resend Code + Need Help Row */}
                                        <div className="flex items-center justify-between w-full mt-5 sm:mt-6">
                                            <div className="flex items-center gap-2 sm:gap-3">
                                                <span className="font-medium text-[13px] sm:text-[14px] text-white/90" style={{ fontFamily: 'var(--font-sans)' }}>Didn't get it?</span>
                                                {resendTimer > 0 ? (
                                                    <span className="px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full bg-white font-bold text-[13px] sm:text-[14px] text-[#141414]" style={{ fontFamily: 'var(--font-sans)' }}>
                                                        Resend ({fmt(resendTimer)})
                                                    </span>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        onClick={handleResend}
                                                        disabled={resendMutation.isPending}
                                                        className="px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full bg-white hover:bg-white/90 font-bold text-[13px] sm:text-[14px] text-[#141414] shadow-sm transition-colors cursor-pointer border-none disabled:opacity-60"
                                                        style={{ fontFamily: 'var(--font-sans)' }}
                                                    >
                                                        {resendMutation.isPending ? "Sending…" : "Resend code"}
                                                    </button>
                                                )}
                                            </div>
                                            <a
                                                href="mailto:support@nexus.org"
                                                className="font-bold text-[13px] sm:text-[14px] text-white hover:text-white/80 underline underline-offset-2 transition-colors"
                                                style={{ fontFamily: 'var(--font-sans)' }}
                                            >
                                                Need help?
                                            </a>
                                        </div>
                                    </div>
                                )}
                </div>
            )}
        </AuthShell>
    );
};

export default RegisterVerifyOtp;