import React, { useState, useEffect } from "react";
import { Skeleton } from "../ui/Skeleton/Skeleton";
import { 
    Loader2, 
    Laptop, 
    Clock, 
    ShieldAlert, 
    Users, 
    RotateCcw, 
    Save, 
    ShieldCheck, 
    CheckCircle2,
    Activity,
    Lock
} from "lucide-react";
import { toast } from "sonner";
import { api } from "../../config/axios";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Field } from "../ui/Field";

interface SessionPolicyProps {
    sessionTimeout?: string;
    setSessionTimeout?: React.Dispatch<React.SetStateAction<string>>;
    handleSave?: () => void;
    handleDiscard?: () => void;
    isSaving?: boolean;
    isLoading?: boolean;
}

export const SessionPolicy: React.FC<SessionPolicyProps> = ({
    sessionTimeout: propSessionTimeout,
    setSessionTimeout: propSetSessionTimeout,
    handleSave: propHandleSave,
    handleDiscard: propHandleDiscard,
    isSaving: propIsSaving,
    isLoading
}) => {
    // Local state for standalone mode or fallback
    const [localSessionTimeout, setLocalSessionTimeout] = useState("30");
    const [snapSessionTimeout, setSnapSessionTimeout] = useState("30");
    const [localIsSaving, setLocalIsSaving] = useState(false);
    const [maxConcurrentSessions, setMaxConcurrentSessions] = useState("2");
    const [snapMaxConcurrentSessions, setSnapMaxConcurrentSessions] = useState("2");
    const [userSessionTimeout, setUserSessionTimeout] = useState("10080"); // minutes (7 days)

    const sessionTimeout = propSessionTimeout ?? localSessionTimeout;
    const setSessionTimeout = propSetSessionTimeout ?? setLocalSessionTimeout;
    const isSaving = propIsSaving ?? localIsSaving;

    useEffect(() => {
        const fetchPolicy = async () => {
            try {
                const res = await api.get("/auth/otp-config");
                if (res.data?.data) {
                    const d = res.data.data;
                    const timeout = d.adminSessionTimeoutMinutes?.toString() || "30";
                    if (!propSessionTimeout) {
                        setLocalSessionTimeout(timeout);
                        setSnapSessionTimeout(timeout);
                    }
                    if (d.maxConcurrentSessions != null) {
                        setMaxConcurrentSessions(d.maxConcurrentSessions.toString());
                        setSnapMaxConcurrentSessions(d.maxConcurrentSessions.toString());
                    }
                    if (d.userSessionTimeoutMinutes != null) {
                        setUserSessionTimeout(d.userSessionTimeoutMinutes.toString());
                    }
                }
            } catch (err) {
                console.error("Failed to load session policy:", err);
            }
        };

        fetchPolicy();
    }, [propSessionTimeout]);

    const handleLocalDiscard = () => {
        if (propHandleDiscard) {
            propHandleDiscard();
        } else {
            setLocalSessionTimeout(snapSessionTimeout);
            setMaxConcurrentSessions(snapMaxConcurrentSessions);
            toast.info("Changes discarded.");
        }
    };

    const handleLocalSave = async () => {
        if (propHandleSave) {
            propHandleSave();
            return;
        }

        setLocalIsSaving(true);
        try {
            const adminMinutes = parseInt(sessionTimeout) || 30;
            const concurrentSessions = parseInt(maxConcurrentSessions) || 2;
            await api.put("/auth/otp-config", {
                adminSessionTimeoutMinutes: adminMinutes,
                userSessionTimeoutMinutes: parseInt(userSessionTimeout) || 10080,
                maxConcurrentSessions: concurrentSessions,
            });
            setSnapSessionTimeout(sessionTimeout);
            setSnapMaxConcurrentSessions(maxConcurrentSessions);
            toast.success("Session policy saved successfully!");
        } catch (error) {
            console.error("Failed to save session policy:", error);
            toast.error("Failed to save session policy.");
        } finally {
            setLocalIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-6 animate-pulse">
                <div className="h-28 bg-slate-100 rounded-2xl" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="h-64 bg-slate-100 rounded-2xl" />
                    <div className="h-64 bg-slate-100 rounded-2xl" />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-300 pb-12">
            {/* Section Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
                <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-purple-500/20">
                        <Laptop className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Session Governance & Token Policy</h2>
                        <p className="text-sm text-slate-500">Configure idle expiration thresholds, concurrent device ceilings, and live session auditing.</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        Zero-Trust Guard Active
                    </span>
                </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600">
                        <Clock className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Admin Idle Expiry</div>
                        <div className="text-sm font-bold text-slate-900">{sessionTimeout} Minutes</div>
                    </div>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600">
                        <Users className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Concurrency Cap</div>
                        <div className="text-sm font-bold text-slate-900">{maxConcurrentSessions} Simultaneous Devices</div>
                    </div>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600">
                        <Activity className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Audit Trail Status</div>
                        <div className="text-sm font-bold text-slate-900">Active Telemetry</div>
                    </div>
                </div>
            </div>

            {/* Main Configuration Card */}
            <Card className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-7 space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-2.5">
                        <ShieldAlert className="w-5 h-5 text-purple-600" />
                        <div>
                            <h3 className="text-base font-bold text-slate-900">Device Lifespan & Concurrency Limits</h3>
                            <p className="text-xs text-slate-500">Prevent credential sharing and protect privileged management sessions.</p>
                        </div>
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-purple-50 text-purple-700 border border-purple-200">
                        JWT Policy
                    </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <Field label={<span className="text-xs font-semibold uppercase tracking-wider text-slate-600 inline-block mb-1.5">Admin Session Idle Timeout (Minutes)</span>} className="mb-0">
                            <Input 
                                type="number"
                                min={5}
                                max={480}
                                value={sessionTimeout} 
                                onChange={(e) => setSessionTimeout(e.target.value)} 
                                className="w-full h-11 px-3.5 rounded-xl border border-slate-300 bg-slate-50/50 text-slate-900 text-sm font-medium focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all outline-none" 
                            />
                        </Field>
                        <p className="text-xs text-slate-400 mt-1.5">Administrators are automatically logged out after inactivity. Default is 30 minutes.</p>
                    </div>

                    <div>
                        <Field label={<span className="text-xs font-semibold uppercase tracking-wider text-slate-600 inline-block mb-1.5">Maximum Concurrent Sessions</span>} className="mb-0">
                            <Input
                                type="number"
                                min={1}
                                max={10}
                                value={maxConcurrentSessions}
                                onChange={(e) => setMaxConcurrentSessions(e.target.value)}
                                className="w-full h-11 px-3.5 rounded-xl border border-slate-300 bg-slate-50/50 text-slate-900 text-sm font-medium focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all outline-none"
                            />
                        </Field>
                        <p className="text-xs text-slate-400 mt-1.5">Number of simultaneous active login tokens allowed per individual user account.</p>
                    </div>
                </div>

                <div className="pt-6 border-t border-slate-100 space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200/80 bg-slate-50/50">
                        <div className="pr-4">
                            <div className="flex items-center gap-2">
                                <Activity className="w-4 h-4 text-emerald-600" />
                                <h4 className="text-sm font-bold text-slate-900">Comprehensive Session Telemetry Logging</h4>
                            </div>
                            <p className="text-xs text-slate-500 mt-1">Record all authentication handshakes, token refreshes, IP changes, and involuntary timeouts to immutable audit storage.</p>
                        </div>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            ACTIVE
                        </span>
                    </div>

                    <div className="p-4 rounded-xl border border-purple-100 bg-purple-50/40 flex items-start gap-3">
                        <Lock className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
                        <div className="text-xs text-purple-900 leading-relaxed">
                            <span className="font-bold">Strict Invalidation:</span> When a session is invalidated via timeout or concurrent eviction, refresh tokens are immediately blacklisted across Redis clusters.
                        </div>
                    </div>
                </div>
            </Card>

            {/* Audit & Action Footer */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2.5 text-xs text-slate-500">
                    <ShieldCheck className="w-4 h-4 text-purple-600 shrink-0" />
                    <span>Changes take effect immediately across all active JWT authentication barriers.</span>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <Button 
                        variant="ghost" 
                        onClick={handleLocalDiscard}
                        className="flex-1 sm:flex-initial h-10 px-5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900 text-sm font-semibold transition-all flex items-center justify-center gap-2"
                    >
                        <RotateCcw className="w-4 h-4" />
                        Discard
                    </Button>
                    <Button 
                        variant="primary" 
                        onClick={handleLocalSave} 
                        disabled={isSaving}
                        className="flex-1 sm:flex-initial h-10 px-6 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-sm shadow-sm shadow-blue-500/20 hover:shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Save Session Policy
                    </Button>
                </div>
            </div>
        </div>
    );
};
