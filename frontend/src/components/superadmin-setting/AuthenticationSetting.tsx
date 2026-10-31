import React, { useState, useEffect } from "react";
import { Skeleton } from "../ui/Skeleton/Skeleton";
import { Loader2, KeyRound, ShieldCheck, Lock, Clock, AlertTriangle, RotateCcw, Save, CheckCircle2 } from "lucide-react";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Field } from "../ui/Field";
import { OtpConfig } from "../../core/api/otp.api";
import { useGetOtpConfig, useUpdateOtpConfig } from "../../hooks/useOtp";
import { useSettingsStore } from "../../store/settings.store";
import { toast } from "sonner";

interface AuthenticationSettingProps {
    handleDiscard?: () => void;
    isSaving?: boolean;
    authSettings?: any;
    setAuthSettings?: React.Dispatch<React.SetStateAction<any>>;
    isLoading?: boolean;
}

export const AuthenticationSetting: React.FC<AuthenticationSettingProps> = ({ handleDiscard, isSaving: externalIsSaving, isLoading: externalIsLoading }) => {
    const { otpConfig } = useSettingsStore();
    const { isLoading: queryLoading, error } = useGetOtpConfig();
    const isLoading = queryLoading || externalIsLoading;
    const mutation = useUpdateOtpConfig();

    const [formData, setFormData] = useState<Partial<OtpConfig>>({});

    useEffect(() => {
        if (otpConfig) {
            setFormData(otpConfig);
        }
    }, [otpConfig]);

    const handleChange = (field: keyof OtpConfig, value: string | number | boolean) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleSave = () => {
        if (Object.keys(formData).length === 0) return;

        mutation.mutate(formData, {
            onSuccess: () => {
                toast.success("Authentication settings saved successfully.");
            },
            onError: (err: any) => {
                toast.error(err?.message || "Failed to save authentication settings.");
            },
        });
    };

    const handleDiscardChanges = () => {
        if (otpConfig) {
            setFormData(otpConfig);
        }
        handleDiscard?.();
        toast.info("Changes discarded.");
    };

    const isSaving = mutation.isPending || externalIsSaving;

    if (isLoading) {
        return (
            <div className="p-6 space-y-6 w-full min-h-screen bg-slate-50">
                <div className="space-y-2 mb-8">
                    <Skeleton className="h-8 w-1/4 rounded-lg" />
                    <Skeleton className="h-4 w-1/3 rounded-lg" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    <Skeleton className="h-[120px] rounded-xl" />
                    <Skeleton className="h-[120px] rounded-xl" />
                </div>
                <Skeleton className="h-[300px] w-full rounded-xl" />
            </div>
        );
    }

    if (error && !otpConfig) {
        return (
            <div className="space-y-6 animate-in fade-in duration-300">
                <div className="text-red-700 text-xs p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                    <span>Error loading authentication configuration: {(error as Error).message}</span>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-300 pb-12">
            {/* OTP Thresholds & Protection Card */}
            <Card className="border border-slate-200/90 bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                    <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                        <KeyRound className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-slate-900">One-Time Password (OTP) Policy & Rate Limits</h3>
                        <p className="text-xs text-slate-500">Configure cryptographic code expiry, brute-force limits, and account cool-downs.</p>
                    </div>
                    <span className="ml-auto inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Active Security
                    </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* OTP Length */}
                    <div>
                        <Field label={<span className="text-xs font-bold text-slate-700 uppercase tracking-wider inline-block mb-1.5">OTP Length (Digits)</span>} className="mb-0">
                            <Input
                                value="6 Digits"
                                readOnly
                                className="border bg-slate-50/80 font-medium text-sm text-slate-700 border-slate-200 rounded-xl h-11 px-3.5 focus:outline-none cursor-not-allowed w-full shadow-inner"
                            />
                        </Field>
                        <div className="mt-2 flex items-center gap-2">
                            <span className="bg-slate-200/80 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">System Locked</span>
                            <span className="text-xs text-slate-500">Mandated for SMS/email cipher security.</span>
                        </div>
                    </div>

                    {/* OTP Expiry Seconds */}
                    <div>
                        <Field label={<span className="text-xs font-bold text-slate-700 uppercase tracking-wider inline-block mb-1.5">OTP Expiry Time (Seconds)</span>} className="mb-0">
                            <Input
                                type="number"
                                value={formData.otpExpirySeconds ?? ""}
                                onChange={(e) => handleChange("otpExpirySeconds", Number(e.target.value))}
                                min={1}
                                className="border bg-white font-medium text-sm text-slate-800 border-slate-200 rounded-xl h-11 px-3.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-full transition-all"
                            />
                        </Field>
                        {formData.otpExpirySeconds != null && (
                            <p className="mt-2 text-xs text-slate-500 flex items-center gap-1.5">
                                <Clock className="w-3 h-3 text-slate-400" />
                                {formData.otpExpirySeconds}s ={" "}
                                <span className="font-semibold text-slate-700">
                                    {formData.otpExpirySeconds < 60
                                        ? `${formData.otpExpirySeconds} seconds`
                                        : formData.otpExpirySeconds % 60 === 0
                                            ? `${formData.otpExpirySeconds / 60} minute${formData.otpExpirySeconds / 60 !== 1 ? "s" : ""}`
                                            : `${Math.floor(formData.otpExpirySeconds / 60)}m ${formData.otpExpirySeconds % 60}s`}
                                </span>
                            </p>
                        )}
                    </div>

                    {/* Max OTP Retries */}
                    <div>
                        <Field label={<span className="text-xs font-bold text-slate-700 uppercase tracking-wider inline-block mb-1.5">Max Verification Retries</span>} className="mb-0">
                            <Input
                                type="number"
                                value={formData.maxOtpVerifyAttempts ?? ""}
                                onChange={(e) => handleChange("maxOtpVerifyAttempts", Number(e.target.value))}
                                min={1}
                                className="border bg-white font-medium text-sm text-slate-800 border-slate-200 rounded-xl h-11 px-3.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-full transition-all"
                            />
                        </Field>
                        <p className="mt-2 text-xs text-slate-500">Failed code entries before the active challenge is revoked.</p>
                    </div>

                    {/* Temporary Block Duration */}
                    <div>
                        <Field label={<span className="text-xs font-bold text-slate-700 uppercase tracking-wider inline-block mb-1.5">Temporary Lockout (Minutes)</span>} className="mb-0">
                            <Input
                                type="number"
                                value={formData.temporaryBlockMinutes ?? ""}
                                onChange={(e) => handleChange("temporaryBlockMinutes", Number(e.target.value))}
                                min={1}
                                className="border bg-white font-medium text-sm text-slate-800 border-slate-200 rounded-xl h-11 px-3.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-full transition-all"
                            />
                        </Field>
                        {formData.temporaryBlockMinutes != null && (
                            <p className="mt-2 text-xs text-slate-500 flex items-center gap-1.5">
                                <Clock className="w-3 h-3 text-slate-400" />
                                {formData.temporaryBlockMinutes}m ={" "}
                                <span className="font-semibold text-slate-700">
                                    {formData.temporaryBlockMinutes < 60
                                        ? `${formData.temporaryBlockMinutes} minute${formData.temporaryBlockMinutes !== 1 ? "s" : ""}`
                                        : formData.temporaryBlockMinutes % 60 === 0
                                            ? `${formData.temporaryBlockMinutes / 60} hour${formData.temporaryBlockMinutes / 60 !== 1 ? "s" : ""}`
                                            : `${Math.floor(formData.temporaryBlockMinutes / 60)}h ${formData.temporaryBlockMinutes % 60}m`}
                                </span>
                            </p>
                        )}
                    </div>

                    {/* Resend Cooldown */}
                    <div>
                        <Field label={<span className="text-xs font-bold text-slate-700 uppercase tracking-wider inline-block mb-1.5">Resend Cooldown (Seconds)</span>} className="mb-0">
                            <Input
                                type="number"
                                value={formData.resendCooldownSeconds ?? ""}
                                onChange={(e) => handleChange("resendCooldownSeconds", Number(e.target.value))}
                                min={30}
                                className="border bg-white font-medium text-sm text-slate-800 border-slate-200 rounded-xl h-11 px-3.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-full transition-all"
                            />
                        </Field>
                        <p className="mt-2 text-xs text-slate-500">Wait interval required before requesting a new code.</p>
                    </div>

                    {/* Max Failed Login Attempts */}
                    <div>
                        <Field label={<span className="text-xs font-bold text-slate-700 uppercase tracking-wider inline-block mb-1.5">Max Failed Login Attempts</span>} className="mb-0">
                            <Input
                                type="number"
                                value={formData.maxFailedLoginAttempts ?? ""}
                                onChange={(e) => handleChange("maxFailedLoginAttempts", Number(e.target.value))}
                                min={1}
                                className="border bg-white font-medium text-sm text-slate-800 border-slate-200 rounded-xl h-11 px-3.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-full transition-all"
                            />
                        </Field>
                        <p className="mt-2 text-xs text-slate-500">Failed password attempts before triggering automated lockout.</p>
                    </div>
                </div>
            </Card>

            {/* MFA Mandate & Governance Card */}
            <Card className="border border-slate-200/90 bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                    <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
                        <Lock className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-slate-900">Regulatory MFA Mandate & Active Sessions</h3>
                        <p className="text-xs text-slate-500">System-enforced security baselines required by GDPR, PDPA & ISO 27001.</p>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50/70 border border-slate-200/70">
                        <div>
                            <div className="flex items-center gap-2">
                                <h4 className="text-sm font-bold text-slate-800">Administrator Multi-Factor Authentication (MFA)</h4>
                                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-600" /> MANDATORY
                                </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-1">
                                Multi-factor verification is enforced on all Super Admin, Corporate Admin, and Support Engineer accounts.
                            </p>
                        </div>
                        <span className="text-xs font-bold text-slate-500 bg-slate-200/80 px-2.5 py-1 rounded-lg">
                            Non-Bypassable
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                        <div>
                            <Field label={<span className="text-xs font-bold text-slate-700 uppercase tracking-wider inline-block mb-1.5">Admin Session Inactivity Ceiling</span>} className="mb-0">
                                <Input
                                    value={
                                        otpConfig?.adminSessionTimeoutMinutes != null
                                            ? `${otpConfig.adminSessionTimeoutMinutes} minutes`
                                            : "30 minutes"
                                    }
                                    readOnly
                                    className="border bg-slate-50/80 font-medium text-sm text-slate-700 border-slate-200 rounded-xl h-11 px-3.5 focus:outline-none cursor-not-allowed w-full shadow-inner"
                                />
                            </Field>
                            <div className="mt-2 flex items-center gap-2">
                                <span className="bg-slate-200/80 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">Session Policy</span>
                                <span className="text-xs text-slate-500">Admin tokens auto-expire on inactivity.</span>
                            </div>
                        </div>

                        <div>
                            <Field label={<span className="text-xs font-bold text-slate-700 uppercase tracking-wider inline-block mb-1.5">Learner Session Maximum Window</span>} className="mb-0">
                                <Input
                                    value={(() => {
                                        const mins = otpConfig?.userSessionTimeoutMinutes;
                                        if (mins == null) return "7 days";
                                        if (mins >= 1440 && mins % 1440 === 0) return `${mins / 1440} day${mins / 1440 !== 1 ? 's' : ''}`;
                                        if (mins >= 60 && mins % 60 === 0) return `${mins / 60} hour${mins / 60 !== 1 ? 's' : ''}`;
                                        return `${mins} minutes`;
                                    })()}
                                    readOnly
                                    className="border bg-slate-50/80 font-medium text-sm text-slate-700 border-slate-200 rounded-xl h-11 px-3.5 focus:outline-none cursor-not-allowed w-full shadow-inner"
                                />
                            </Field>
                            <div className="mt-2 flex items-center gap-2">
                                <span className="bg-slate-200/80 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">Session Policy</span>
                                <span className="text-xs text-slate-500">Learner refresh tokens expire after maximum window.</span>
                            </div>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Save / Discard Footer */}
            <Card className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>OTP parameters update instantly across all auth gate microservices.</span>
                </div>
                <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                    <Button
                        variant="ghost"
                        onClick={handleDiscardChanges}
                        className="px-4 py-2 h-9 rounded-xl text-xs font-semibold border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 shadow-xs flex items-center gap-1.5"
                    >
                        <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                        Discard
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleSave}
                        disabled={isSaving || !otpConfig}
                        className="px-4 py-2 h-9 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-xs flex items-center gap-1.5 transition-all disabled:opacity-50"
                    >
                        {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                        Save Changes
                    </Button>
                </div>
            </Card>
        </div>
    );
};


