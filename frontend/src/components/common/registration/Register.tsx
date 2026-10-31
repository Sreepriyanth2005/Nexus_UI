import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router";
import Select from "react-select";
import { Country } from "country-state-city";

import { useAuthStore } from "../../../core/auth/auth.store";
import { useUserStore } from "../../../store/user.store";
import { useRegisterSendOtp } from "../../../hooks/useAuth";
import Reactivate from "../login/Reactivate";
import AuthShell from "../login/AuthShell";
import { User, Mail, Globe, ArrowRight, Loader2, ShieldAlert, WifiOff } from "lucide-react";

const countryOptions = Country.getAllCountries().map((country) => ({
    value: country.name,
    label: `${country.flag}  ${country.name}`,
}));

const Register: React.FC = () => {
    const navigate = useNavigate();
    const { setTempAuth, status } = useAuthStore();
    const { isAuthenticated } = useUserStore();

    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [selectedCountry, setSelectedCountry] = useState("");
    const [errorMsg, setErrorMsg] = useState("");
    const [isNetworkError, setIsNetworkError] = useState(false);
    const [isAccountInactive, setIsAccountInactive] = useState(false);
    const [accountDeletedAt, setAccountDeletedAt] = useState<string | null>(null);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isFormValid =
        firstName.trim().length > 0 &&
        lastName.trim().length > 0 &&
        emailRegex.test(email.trim()) &&
        selectedCountry.length > 0;

    const registerSendOtpMutation = useRegisterSendOtp();

    // Redirect if already authenticated
    useEffect(() => {
        if (isAuthenticated && status) {
            window.history.pushState(null, "", window.location.href);
            navigate("/", { replace: true });
        }
    }, [isAuthenticated, status, navigate]);

    const handleRegister = (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg("");

        if (!firstName.trim() || !lastName.trim()) {
            setErrorMsg("First Name and Last Name are required.");
            return;
        }

        if (!email.trim()) {
            setErrorMsg("Email address is required.");
            return;
        }

        if (!emailRegex.test(email.trim())) {
            setErrorMsg("Enter a complete email address with an @ and domain.");
            return;
        }

        if (!selectedCountry) {
            setErrorMsg("Please select your country.");
            return;
        }

        registerSendOtpMutation.mutate(
            {
                email: email.trim(),
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                countryName: selectedCountry,
                consent: {
                    accepted: true,
                    marketingConsent: true,
                    consentVersion: "v1",
                    termsVersion: "v1",
                    privacyPolicyVersion: "v1",
                    platformVersion: "web-1.0.0",
                    source: "WEB_APP"
                }
            },
            {
                onSuccess: (data: any) => {
                    setErrorMsg("");
                    const otpMeta =
                        data?.otp ??
                        data?.data?.otp ??
                        data?.otpMeta ??
                        data?.data?.otpMeta ??
                        null;
                    setTempAuth(
                        email.trim(),
                        "register",
                        {
                            firstName: firstName.trim(),
                            lastName: lastName.trim(),
                            countryName: selectedCountry,
                            otpMeta,
                        }
                    );
                    navigate("/register-verify-otp", { replace: true });
                },
                onError: (error: any) => {
                    if (
                        !error.response ||
                        error.message === "Network Error" ||
                        (error.response?.data?.message || "").toLowerCase().includes("connection is closed") ||
                        (error.message || "").toLowerCase().includes("connection is closed") ||
                        (error.message || "").toLowerCase().includes("max retries per request")
                    ) {
                        setIsNetworkError(true);
                        return;
                    }

                    const code = error.response?.data?.code;
                    const message = (error.response?.data?.message || error.message || "").toLowerCase();
                    if (code === "ACCOUNT_INACTIVE" || code === "ACCOUNT_DELETED" || message.includes("inactive") || message.includes("deleted")) {
                        const meta = error.response?.data?.meta;
                        const deletedAt = meta?.deletedAt || error.response?.data?.deletedAt;
                        setAccountDeletedAt(deletedAt || null);
                        setIsAccountInactive(true);
                        return;
                    }

                    const errMsg =
                        error.response?.data?.message ||
                        error.message ||
                        "Registration failed. The email may already be in use.";
                    setErrorMsg(errMsg);
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
        <AuthShell activePortal="register">
            {!isNetworkError ? (
                <div>
                    {/* Header */}
                    <div className="mb-6">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#f1b020]/10 border border-[#f1b020]/25 text-[11px] font-semibold text-[#f5bf38] uppercase tracking-wider mb-2.5">
                            New Learner Onboarding
                        </div>
                        <h2 className="text-2xl font-bold tracking-tight text-white">Create your account</h2>
                        <p className="text-xs sm:text-sm text-slate-400 mt-1">
                            Set up your account to access curated enterprise learning tracks.
                        </p>
                    </div>

                    <form onSubmit={handleRegister} noValidate className="space-y-4">
                        {/* First Name & Last Name */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                            <div>
                                <label
                                    htmlFor="firstName"
                                    className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5"
                                >
                                    First Name
                                </label>
                                <div className="relative">
                                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                                        <User className="h-4 w-4" />
                                    </div>
                                    <input
                                        id="firstName"
                                        type="text"
                                        placeholder="First name"
                                        value={firstName}
                                        onChange={(e) => {
                                            setFirstName(e.target.value);
                                            setErrorMsg("");
                                        }}
                                        className={`h-11 w-full rounded-xl bg-slate-950/60 border pl-10 pr-3.5 text-sm text-white placeholder-slate-500 transition-all focus:outline-none ${
                                            errorMsg && !firstName.trim()
                                                ? "border-rose-500/80 focus:ring-1 focus:ring-rose-500"
                                                : "border-white/10 focus:border-[#f1b020] focus:ring-1 focus:ring-[#f1b020]"
                                        }`}
                                    />
                                </div>
                            </div>

                            <div>
                                <label
                                    htmlFor="lastName"
                                    className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5"
                                >
                                    Last Name
                                </label>
                                <div className="relative">
                                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                                        <User className="h-4 w-4" />
                                    </div>
                                    <input
                                        id="lastName"
                                        type="text"
                                        placeholder="Last name"
                                        value={lastName}
                                        onChange={(e) => {
                                            setLastName(e.target.value);
                                            setErrorMsg("");
                                        }}
                                        className={`h-11 w-full rounded-xl bg-slate-950/60 border pl-10 pr-3.5 text-sm text-white placeholder-slate-500 transition-all focus:outline-none ${
                                            errorMsg && !lastName.trim()
                                                ? "border-rose-500/80 focus:ring-1 focus:ring-rose-500"
                                                : "border-white/10 focus:border-[#f1b020] focus:ring-1 focus:ring-[#f1b020]"
                                        }`}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Email Address */}
                        <div>
                            <label
                                htmlFor="email"
                                className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5"
                            >
                                Email Address
                            </label>
                            <div className="relative">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                                    <Mail className="h-4 w-4" />
                                </div>
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    autoComplete="email"
                                    placeholder="you@nexus.org"
                                    onChange={(e) => {
                                        setEmail(e.target.value);
                                        setErrorMsg("");
                                    }}
                                    className={`h-11 w-full rounded-xl bg-slate-950/60 border pl-10 pr-3.5 text-sm text-white placeholder-slate-500 transition-all focus:outline-none ${
                                        errorMsg && !email.trim()
                                            ? "border-rose-500/80 focus:ring-1 focus:ring-rose-500"
                                            : "border-white/10 focus:border-[#f1b020] focus:ring-1 focus:ring-[#f1b020]"
                                    }`}
                                />
                            </div>
                        </div>

                        {/* Country Selection */}
                        <div>
                            <label
                                htmlFor="country"
                                className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5"
                            >
                                Country
                            </label>
                            <Select
                                id="country"
                                options={countryOptions}
                                value={countryOptions.find((c) => c.value === selectedCountry) || null}
                                onChange={(option) => {
                                    setSelectedCountry(option?.value || "");
                                    setErrorMsg("");
                                }}
                                placeholder="Select your country..."
                                isSearchable
                                styles={{
                                    control: (base, state) => ({
                                        ...base,
                                        borderRadius: "12px",
                                        minHeight: "44px",
                                        backgroundColor: "rgba(2, 6, 23, 0.6)",
                                        borderColor: errorMsg && !selectedCountry
                                            ? "rgba(244, 63, 94, 0.8)"
                                            : state.isFocused
                                            ? "#f1b020"
                                            : "rgba(255, 255, 255, 0.1)",
                                        boxShadow: state.isFocused ? "0 0 0 1px #f1b020" : "none",
                                        "&:hover": {
                                            borderColor: state.isFocused ? "#f1b020" : "rgba(255, 255, 255, 0.25)"
                                        },
                                        padding: "0 4px",
                                        cursor: "pointer"
                                    }),
                                    valueContainer: (base) => ({
                                        ...base,
                                        padding: "0 8px"
                                    }),
                                    singleValue: (base) => ({
                                        ...base,
                                        color: "#f8fafc",
                                        fontSize: "14px"
                                    }),
                                    input: (base) => ({
                                        ...base,
                                        color: "#f8fafc",
                                        fontSize: "14px"
                                    }),
                                    placeholder: (base) => ({
                                        ...base,
                                        color: "#64748b",
                                        fontSize: "14px"
                                    }),
                                    menu: (base) => ({
                                        ...base,
                                        backgroundColor: "#0b1120",
                                        border: "1px solid rgba(255, 255, 255, 0.12)",
                                        borderRadius: "12px",
                                        overflow: "hidden",
                                        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)",
                                        zIndex: 60
                                    }),
                                    option: (base, state) => ({
                                        ...base,
                                        backgroundColor: state.isSelected
                                            ? "#f1b020"
                                            : state.isFocused
                                            ? "rgba(241, 176, 32, 0.15)"
                                            : "transparent",
                                        color: state.isSelected ? "#020617" : "#e2e8f0",
                                        fontSize: "13.5px",
                                        cursor: "pointer",
                                        padding: "8px 14px",
                                        fontWeight: state.isSelected ? 600 : 400
                                    })
                                }}
                            />
                        </div>

                        {/* Error Notice */}
                        {errorMsg && (
                            <div className="flex items-start gap-2.5 bg-rose-500/10 border border-rose-500/25 p-3 rounded-xl text-rose-300 text-xs">
                                <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                                <span className="leading-relaxed">{errorMsg}</span>
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={!isFormValid || registerSendOtpMutation.isPending}
                            className={`w-full h-11 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 mt-2 ${
                                isFormValid && !registerSendOtpMutation.isPending
                                    ? "bg-gradient-to-r from-[#f1b020] via-[#f5bf38] to-[#e09b10] text-slate-950 font-bold shadow-lg shadow-[#f1b020]/25 hover:brightness-105 active:scale-[0.99] cursor-pointer"
                                    : "bg-white/5 border border-white/10 text-slate-500 cursor-not-allowed"
                            }`}
                        >
                            {registerSendOtpMutation.isPending ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    <span>Creating account...</span>
                                </>
                            ) : (
                                <>
                                    <span>Create account</span>
                                    <ArrowRight className="h-4 w-4" />
                                </>
                            )}
                        </button>

                        {/* Terms Note */}
                        <p className="text-[11px] text-slate-400 text-center leading-relaxed pt-1">
                            By creating an account, you agree to our{" "}
                            <a href="#" onClick={(e) => e.preventDefault()} className="text-slate-300 hover:text-white underline underline-offset-2">
                                Terms of Use
                            </a>
                            ,{" "}
                            <a href="#" onClick={(e) => e.preventDefault()} className="text-slate-300 hover:text-white underline underline-offset-2">
                                Privacy Policy
                            </a>
                            , and{" "}
                            <a href="#" onClick={(e) => e.preventDefault()} className="text-slate-300 hover:text-white underline underline-offset-2">
                                Cookie Policy
                            </a>.
                        </p>

                        {/* Divider */}
                        <div className="relative my-4">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-white/10" />
                            </div>
                            <div className="relative flex justify-center text-xs">
                                <span className="bg-[#0b101b] px-3 text-slate-500">or</span>
                            </div>
                        </div>

                        {/* Redirect to Sign In */}
                        <div className="text-center">
                            <p className="text-xs text-slate-400">
                                Already have an account?{" "}
                                <Link
                                    to="/login"
                                    className="font-semibold text-[#f5bf38] hover:text-[#f1b020] hover:underline underline-offset-2 transition-colors ml-1"
                                >
                                    Sign in
                                </Link>
                            </p>
                        </div>
                    </form>
                </div>
            ) : (
                /* Network Error State */
                <div className="flex flex-col items-center justify-center text-center py-6">
                    <div className="h-14 w-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-4 text-rose-400">
                        <WifiOff className="w-7 h-7" />
                    </div>

                    <span className="text-[11px] font-bold tracking-widest text-slate-400 uppercase mb-1.5">
                        Connectivity Issue
                    </span>

                    <h3 className="text-xl font-bold text-white mb-2">
                        Connection lost
                    </h3>

                    <p className="text-xs sm:text-sm text-slate-400 mb-6 max-w-[280px] leading-relaxed">
                        Please check your network connection and retry the registration request.
                    </p>

                    <button
                        type="button"
                        onClick={() => setIsNetworkError(false)}
                        className="w-full h-11 rounded-xl bg-gradient-to-r from-[#f1b020] to-[#e09b10] text-slate-950 font-bold text-sm shadow-lg shadow-[#f1b020]/25 hover:brightness-105 transition-all flex items-center justify-center cursor-pointer mb-3"
                    >
                        Retry Connection
                    </button>

                    <p className="text-[11px] text-slate-500 leading-relaxed max-w-[300px]">
                        If this continues, contact your network administrator or support.
                    </p>
                </div>
            )}
        </AuthShell>
    );
};

export default Register;
