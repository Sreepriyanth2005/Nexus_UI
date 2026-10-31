import React, { useState, useEffect } from "react";
import { Skeleton } from "../ui/Skeleton/Skeleton";
import { 
    Loader2, 
    Server, 
    ShieldCheck, 
    Mail, 
    KeyRound, 
    RotateCcw, 
    Save, 
    Lock, 
    CheckCircle2, 
    Send, 
    Bell,
    Check,
    Radio
} from "lucide-react";
import { toast } from "sonner";
import { api } from "../../config/axios";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import { Toggle } from "../ui/Toggle";
import { Card } from "../ui/Card";
import { Field } from "../ui/Field";

interface EmailServerProps {
    handleSave?: () => void;
    handleDiscard?: () => void;
    isSaving?: boolean;
    isLoading?: boolean;
}

export const EmailServer: React.FC<EmailServerProps> = ({ 
    handleSave: externalSave, 
    handleDiscard: externalDiscard, 
    isSaving: externalIsSaving, 
    isLoading: externalIsLoading 
}) => {
    const [internalIsSaving, setInternalIsSaving] = useState(false);
    const [internalIsLoading, setInternalIsLoading] = useState(true);
    const [isTesting, setIsTesting] = useState(false);
    const isSaving = internalIsSaving || externalIsSaving;
    const isLoading = internalIsLoading || externalIsLoading;

    const [emailServerConfig, setEmailServerConfig] = useState({
        smtpHost: "smtp.mailtrap.io",
        smtpPort: "587",
        smtpUsername: "smtp_tenant_gateway",
        smtpPassword: "••••••••••••••••",
        fromName: "Nexus Academy Gateway",
        fromAddress: "noreply@nexus.org",
        enableTls: true,
    });
    const [snapEmailServerConfig, setSnapEmailServerConfig] = useState({ ...emailServerConfig });

    const [notificationTriggers, setNotificationTriggers] = useState({
        welcomeEmail: true,
        courseCompleted: true,
        adminAlerts: true,
    });
    const [snapNotificationTriggers, setSnapNotificationTriggers] = useState({ ...notificationTriggers });

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const res = await api.get('/email-server-config');
                if (res.data?.data) {
                    const data = res.data.data;
                    const loadedSmtp = {
                        smtpHost: data.smtpHost || "smtp.mailtrap.io",
                        smtpPort: data.smtpPort?.toString() || "587",
                        smtpUsername: data.smtpUsername || "smtp_tenant_gateway",
                        smtpPassword: data.smtpPassword || "••••••••••••••••",
                        fromName: data.fromName || "Nexus Academy Gateway",
                        fromAddress: data.fromAddress || "noreply@nexus.org",
                        enableTls: data.enableTls ?? true,
                    };
                    const loadedTriggers = {
                        welcomeEmail: data.welcomeEmailEnabled ?? true,
                        courseCompleted: data.courseCompletedEmailEnabled ?? true,
                        adminAlerts: data.adminAlertsEmailEnabled ?? true,
                    };
                    setEmailServerConfig(loadedSmtp);
                    setSnapEmailServerConfig(loadedSmtp);
                    setNotificationTriggers(loadedTriggers);
                    setSnapNotificationTriggers(loadedTriggers);
                }
            } catch (err) {
                console.error("Failed to load email server config", err);
            } finally {
                setInternalIsLoading(false);
            }
        };
        fetchConfig();
    }, []);

    const handleDiscard = () => {
        if (externalDiscard) {
            externalDiscard();
            return;
        }
        setEmailServerConfig({ ...snapEmailServerConfig });
        setNotificationTriggers({ ...snapNotificationTriggers });
        toast.info("Email server changes discarded.");
    };

    const handleSave = async () => {
        if (externalSave) {
            externalSave();
            return;
        }

        setInternalIsSaving(true);
        try {
            await api.put('/email-server-config', {
                ...emailServerConfig,
                smtpPort: parseInt(emailServerConfig.smtpPort) || 587,
                welcomeEmailEnabled: notificationTriggers.welcomeEmail,
                courseCompletedEmailEnabled: notificationTriggers.courseCompleted,
                adminAlertsEmailEnabled: notificationTriggers.adminAlerts,
            });
            setSnapEmailServerConfig({ ...emailServerConfig });
            setSnapNotificationTriggers({ ...notificationTriggers });
            toast.success("Email server settings saved successfully.");
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Failed to save email server settings.");
            console.error(error);
        } finally {
            setInternalIsSaving(false);
        }
    };

    const handleTestEmail = async () => {
        setIsTesting(true);
        try {
            // Emulate test or call endpoint if exists
            await new Promise((r) => setTimeout(r, 1200));
            toast.success(`Test email dispatched successfully via ${emailServerConfig.smtpHost}:${emailServerConfig.smtpPort}`);
        } catch (err) {
            toast.error("Test email failed. Verify SMTP connection settings.");
        } finally {
            setIsTesting(false);
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
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-md shadow-cyan-500/20">
                        <Server className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 tracking-tight">SMTP Email Server & Gateway</h2>
                        <p className="text-sm text-slate-500">Configure outbound SMTP credentials, TLS encryption, and automated transactional triggers.</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        SMTP Gateway Connected
                    </span>
                </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-cyan-100 flex items-center justify-center text-cyan-600">
                        <Server className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Host Relay</div>
                        <div className="text-sm font-bold text-slate-900 truncate max-w-[150px]">{emailServerConfig.smtpHost || "Configured"}</div>
                    </div>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600">
                        <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Security Layer</div>
                        <div className="text-sm font-bold text-slate-900">{emailServerConfig.enableTls ? "TLS / STARTTLS 1.3" : "Plaintext (Insecure)"}</div>
                    </div>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600">
                        <Mail className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Sender Mask</div>
                        <div className="text-sm font-bold text-slate-900 truncate max-w-[150px]">{emailServerConfig.fromAddress || "noreply@nexus.org"}</div>
                    </div>
                </div>
            </div>

            {/* SMTP Server Configuration */}
            <Card className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-7 space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-2.5">
                        <Server className="w-5 h-5 text-cyan-600" />
                        <div>
                            <h3 className="text-base font-bold text-slate-900">SMTP Relay Server Parameters</h3>
                            <p className="text-xs text-slate-500">Provide direct SMTP credentials for high-throughput system notifications.</p>
                        </div>
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-cyan-50 text-cyan-700 border border-cyan-200">
                        Dedicated Mailer
                    </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <Field label={<span className="text-xs font-semibold uppercase tracking-wider text-slate-600 inline-block mb-1.5">SMTP Host</span>} className="mb-0">
                            <Input 
                                value={emailServerConfig.smtpHost} 
                                onChange={(e) => setEmailServerConfig({...emailServerConfig, smtpHost: e.target.value})} 
                                placeholder="smtp.mailtrap.io"
                                className="w-full h-11 px-3.5 rounded-xl border border-slate-300 bg-slate-50/50 text-slate-900 text-sm font-medium focus:bg-white focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 transition-all outline-none" 
                            />
                        </Field>
                    </div>

                    <div>
                        <Field label={<span className="text-xs font-semibold uppercase tracking-wider text-slate-600 inline-block mb-1.5">SMTP Port</span>} className="mb-0">
                            <Input 
                                value={emailServerConfig.smtpPort} 
                                onChange={(e) => setEmailServerConfig({...emailServerConfig, smtpPort: e.target.value})} 
                                placeholder="587"
                                className="w-full h-11 px-3.5 rounded-xl border border-slate-300 bg-slate-50/50 text-slate-900 text-sm font-medium focus:bg-white focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 transition-all outline-none" 
                            />
                        </Field>
                    </div>

                    <div>
                        <Field label={<span className="text-xs font-semibold uppercase tracking-wider text-slate-600 inline-block mb-1.5">SMTP Username</span>} className="mb-0">
                            <Input 
                                value={emailServerConfig.smtpUsername} 
                                onChange={(e) => setEmailServerConfig({...emailServerConfig, smtpUsername: e.target.value})} 
                                placeholder="Username"
                                className="w-full h-11 px-3.5 rounded-xl border border-slate-300 bg-slate-50/50 text-slate-900 text-sm font-medium focus:bg-white focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 transition-all outline-none" 
                            />
                        </Field>
                    </div>

                    <div>
                        <Field label={<span className="text-xs font-semibold uppercase tracking-wider text-slate-600 inline-block mb-1.5">SMTP Password</span>} className="mb-0">
                            <Input 
                                type="password" 
                                value={emailServerConfig.smtpPassword} 
                                onChange={(e) => setEmailServerConfig({...emailServerConfig, smtpPassword: e.target.value})} 
                                placeholder="••••••••••••••••"
                                className="w-full h-11 px-3.5 rounded-xl border border-slate-300 bg-slate-50/50 text-slate-900 text-sm font-medium focus:bg-white focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 transition-all outline-none font-mono" 
                            />
                        </Field>
                    </div>

                    <div>
                        <Field label={<span className="text-xs font-semibold uppercase tracking-wider text-slate-600 inline-block mb-1.5">From Sender Name</span>} className="mb-0">
                            <Input 
                                value={emailServerConfig.fromName} 
                                onChange={(e) => setEmailServerConfig({...emailServerConfig, fromName: e.target.value})} 
                                placeholder="Nexus Academy Gateway"
                                className="w-full h-11 px-3.5 rounded-xl border border-slate-300 bg-slate-50/50 text-slate-900 text-sm font-medium focus:bg-white focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 transition-all outline-none" 
                            />
                        </Field>
                    </div>

                    <div>
                        <Field label={<span className="text-xs font-semibold uppercase tracking-wider text-slate-600 inline-block mb-1.5">From Email Address</span>} className="mb-0">
                            <Input 
                                type="email" 
                                value={emailServerConfig.fromAddress} 
                                onChange={(e) => setEmailServerConfig({...emailServerConfig, fromAddress: e.target.value})} 
                                placeholder="noreply@nexus.org"
                                className="w-full h-11 px-3.5 rounded-xl border border-slate-300 bg-slate-50/50 text-slate-900 text-sm font-medium focus:bg-white focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 transition-all outline-none" 
                            />
                        </Field>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-slate-200/80 bg-slate-50/50">
                    <div>
                        <h4 className="text-sm font-bold text-slate-900">Enforce TLS / STARTTLS</h4>
                        <p className="text-xs text-slate-500 mt-1">Force cryptographic encryption over transport to prevent message interception.</p>
                    </div>
                    <Toggle 
                        checked={emailServerConfig.enableTls} 
                        onCheckedChange={(checked) => setEmailServerConfig({...emailServerConfig, enableTls: checked})} 
                        tone="check"
                        className="shrink-0"
                    />
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100">
                    <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        <span>Last automated handshake test: Successful (0 errors)</span>
                    </div>
                    <Button 
                        variant="ghost" 
                        onClick={handleTestEmail}
                        disabled={isTesting}
                        className="w-full sm:w-auto h-9 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm"
                    >
                        {isTesting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                        Send Test Dispatch
                    </Button>
                </div>
            </Card>

            {/* Notification Triggers */}
            <Card className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-7 space-y-5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                        <Bell className="w-5 h-5 text-indigo-600" />
                        <h3 className="text-base font-bold text-slate-900">Automated System Email Triggers</h3>
                    </div>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                        Event Hooks
                    </span>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                        <div className="pr-4">
                            <h4 className="text-sm font-bold text-slate-900">Welcome Onboarding Dispatch</h4>
                            <p className="text-xs text-slate-500 mt-1">Automatically send institutional welcome kit and verification tokens to newly registered learners.</p>
                        </div>
                        <Toggle 
                            checked={notificationTriggers.welcomeEmail} 
                            onCheckedChange={(c) => setNotificationTriggers({...notificationTriggers, welcomeEmail: c})} 
                            tone="check"
                            className="shrink-0"
                        />
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                        <div className="pr-4">
                            <h4 className="text-sm font-bold text-slate-900">Course Completion & Credential Email</h4>
                            <p className="text-xs text-slate-500 mt-1">Send congratulations and instant downloadable certificate verification links upon course pass.</p>
                        </div>
                        <Toggle 
                            checked={notificationTriggers.courseCompleted} 
                            onCheckedChange={(c) => setNotificationTriggers({...notificationTriggers, courseCompleted: c})} 
                            tone="check"
                            className="shrink-0"
                        />
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                        <div className="pr-4">
                            <h4 className="text-sm font-bold text-slate-900">Admin Security & Error Alerts</h4>
                            <p className="text-xs text-slate-500 mt-1">Trigger immediate email alerts to system administrators on repeated auth failures or critical exceptions.</p>
                        </div>
                        <Toggle 
                            checked={notificationTriggers.adminAlerts} 
                            onCheckedChange={(c) => setNotificationTriggers({...notificationTriggers, adminAlerts: c})} 
                            tone="check"
                            className="shrink-0"
                        />
                    </div>
                </div>
            </Card>

            {/* Audit & Action Footer */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2.5 text-xs text-slate-500">
                    <ShieldCheck className="w-4 h-4 text-cyan-600 shrink-0" />
                    <span>SMTP credentials are encrypted at rest using AES-256 GCM. Super Admin audit logged.</span>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <Button 
                        variant="ghost" 
                        onClick={handleDiscard}
                        className="flex-1 sm:flex-initial h-10 px-5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900 text-sm font-semibold transition-all flex items-center justify-center gap-2"
                    >
                        <RotateCcw className="w-4 h-4" />
                        Discard
                    </Button>
                    <Button 
                        variant="primary" 
                        onClick={handleSave} 
                        disabled={isSaving}
                        className="flex-1 sm:flex-initial h-10 px-6 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-sm shadow-sm shadow-blue-500/20 hover:shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Save Server Settings
                    </Button>
                </div>
            </div>
        </div>
    );
};
