import React, { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { api } from "../../config/axios";
import {
    Building2,
    KeyRound,
    Award,
    GraduationCap,
    Users,
    Mail,
    ShieldAlert,
    Sliders,
    Server,
    Laptop,
    ShieldCheck,
    CheckCircle2,
    RotateCcw,
    Save,
    Loader2,
    PlaySquare,
    Activity,
    Lock,
    Search,
    Sparkles,
    Info,
    ExternalLink,
    ChevronRight,
    SlidersHorizontal,
    Database,
    Zap
} from "lucide-react";

import { OrganisationSetting } from "../../components/superadmin-setting/OrganisationSetting";
import { AuthenticationSetting } from "../../components/superadmin-setting/AuthenticationSetting";
import { CredentialsSetting } from "../../components/superadmin-setting/CredentialsSetting";
import { AssessmentSetting } from "../../components/superadmin-setting/AssessmentSetting";
import { ReviewerSetting } from "../../components/superadmin-setting/ReviewerSetting";
import { ComplianceSetting } from "../../components/superadmin-setting/ComplianceSetting";
import { EmailSetting } from "../../components/superadmin-setting/EmailSetting";
import { General } from "../../components/superadmin-setting/General";
import { EmailServer } from "../../components/superadmin-setting/EmailServer";
import { SessionPolicy } from "../../components/superadmin-setting/SessionPolicy";
import { VideoPlayerSettingModal } from "../../components/superadmin-setting/VideoPlayerSettingModal";

type TabType = "organisation" | "authentication" | "credentials" | "assessment" | "reviewer" | "email" | "compliance" | "general" | "email_server" | "session_policy";

// ─── Helper ───────────────────────────────────────────────────────────────────
// Extract integer from strings like "70%", "24 hours", "3 years", "6 months", "30"
const num = (s: string): number | undefined => {
    const v = parseInt(s.replace(/[^0-9]/g, ''));
    return isNaN(v) ? undefined : v;
};

// ─── Default Values ───────────────────────────────────────────────────────────
const defaultOrg = {
    legalName: "Nexus Academy",
    supportEmail: "support@nexus.org",
    language: "English (EN)",
    timezone: "Asia/Muscat (UTC+4)",
    brandColor: "#1e1e1e",
    newReleases: true,
    trending: true,
};

const defaultAuth = {
    otpLength: "6",
    otpExpiry: "120",            // seconds
    maxRetries: "3",
    lockoutDuration: "60",      // minutes
    passwordResetExpiry: "24", // hours (no backend field yet)
    resendCooldownTime: "30",  // seconds
    maxFailedLoginAttempts: "5",
    maxOtpResendAttempts: "3",
    loginOtpEnabled: false,
    adminMfa: true,
    adminSessionTimeout: "30",  // minutes (from DB: adminSessionTimeoutMinutes)
    userSessionTimeout: "10080", // minutes (from DB: userSessionTimeoutMinutes, 7 days)
};

const defaultCred = {
    validity: "3 years",
    verifyBase: "nexusacademy.org/verify/",
    autoIssue: true,
};

const defaultAssessment = {
    passMark: "70%",
    maxAttempts: "3",
    retakeCooldown: "24 hours",
    videoThreshold: "90%",
    noResume: true,
};

const defaultReviewer = {
    domains: ["Knowledge Management", "Records Management", "Data Governance", "Data Management", "Document Control", "ISO Standards"],
    maxConcurrent: "3",
    slaLeadTime: "24 hours before deadline",
    autoDecline: true,
};

const defaultCompliance = {
    softDeleteRetention: "6 months",   // months (backend: softDeleteRetentionMonths)
    hardDeleteTrigger: "6 months",
    selfDeletionGrace: "30 days",      // days
    dormantDeactivation: "6 months",   // months
    accountDataRetention: "6 months",  // months (backend: accountDataRetentionMonths)
};

const defaultEmail = {
    notificationRetention: "90",  // days
    inactiveLearnerTrigger: "2 weeks, 1 month",
    notificationPriority: "High / Normal / Critical / Low",
    lessonUpdate: true,
};

const defaultVideo = {
    caption: true,
    fastForwarding: false,
    fullscreen: true,
    streaming: true,
    volumeCtrl: true,
    customizeCaption: true,
};

interface TabConfig {
    id: TabType;
    label: string;
    category: "Identity & Access" | "Academics & Quality" | "Governance & Infra";
    badge?: string;
    description: string;
    icon: React.ElementType;
}

// ─── Component ────────────────────────────────────────────────────────────────
const SuperadminSetting = () => {
    const [activeTab, setActiveTab] = useState<TabType>("organisation");
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [tenantConfigId, setTenantConfigId] = useState<number | null>(null);
    const [searchQuery, setSearchQuery] = useState("");

    // Live editable state
    const [orgSettings, setOrgSettings] = useState({ ...defaultOrg });
    const [authSettings, setAuthSettings] = useState({ ...defaultAuth });
    const [credSettings, setCredSettings] = useState({ ...defaultCred });
    const [assessmentSettings, setAssessmentSettings] = useState({ ...defaultAssessment });
    const [reviewerSettings, setReviewerSettings] = useState({ ...defaultReviewer });
    const [complianceSettings, setComplianceSettings] = useState({ ...defaultCompliance });
    const [emailSettings, setEmailSettings] = useState({ ...defaultEmail });
    const [videoSettings, setVideoSettings] = useState({ ...defaultVideo });

    // Snapshots for Discard (updated after every successful save or fetch)
    const [snapOrg, setSnapOrg] = useState({ ...defaultOrg });
    const [snapAuth, setSnapAuth] = useState({ ...defaultAuth });
    const [snapCred, setSnapCred] = useState({ ...defaultCred });
    const [snapAssessment, setSnapAssessment] = useState({ ...defaultAssessment });
    const [snapReviewer, setSnapReviewer] = useState({ ...defaultReviewer });
    const [snapCompliance, setSnapCompliance] = useState({ ...defaultCompliance });
    const [snapEmail, setSnapEmail] = useState({ ...defaultEmail });
    const [snapVideo, setSnapVideo] = useState({ ...defaultVideo });

    // Modal state
    const [videoConfigId, setVideoConfigId] = useState<string | null>(null);
    const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
    const [isVideoSaving, setIsVideoSaving] = useState(false);

    // ── Fetch & hydrate all state ─────────────────────────────────────────────
    const fetchConfig = useCallback(async () => {
        try {
            // ── Tenant configuration ──
            const res = await api.get('/tenant-configurations');
            if (res.data?.data && res.data.data.length > 0) {
                const c = res.data.data[0];
                setTenantConfigId(c.id);

                // Organisation
                const org = {
                    legalName: c.legalName || defaultOrg.legalName,
                    supportEmail: c.supportEmail || defaultOrg.supportEmail,
                    language: c.defaultLanguage || defaultOrg.language,
                    timezone: c.timezone || defaultOrg.timezone,
                    brandColor: c.brandColorToken || defaultOrg.brandColor,
                    newReleases: c.showNewReleases ?? true,
                    trending: c.showTrending ?? true,
                };
                setOrgSettings(org); setSnapOrg(org);

                // Credentials
                const cred = {
                    validity: c.credentialValidityMonths ? `${c.credentialValidityMonths / 12} years` : defaultCred.validity,
                    verifyBase: c.credentialVerifyUrlBase || defaultCred.verifyBase,
                    autoIssue: c.autoIssueCredentials ?? true,
                };
                setCredSettings(cred); setSnapCred(cred);

                // Assessment
                const assessment = {
                    passMark: c.defaultPassMarkPercentage != null ? `${c.defaultPassMarkPercentage}%` : defaultAssessment.passMark,
                    maxAttempts: c.defaultMaxAssessmentAttempts?.toString() || defaultAssessment.maxAttempts,
                    retakeCooldown: c.assessmentRetakeCooldownHours != null ? `${c.assessmentRetakeCooldownHours} hours` : defaultAssessment.retakeCooldown,
                    videoThreshold: c.videoCompletionThreshold != null ? `${c.videoCompletionThreshold}%` : defaultAssessment.videoThreshold,
                    noResume: c.assessmentNoResumeOnExit ?? true,
                };
                setAssessmentSettings(assessment); setSnapAssessment(assessment);

                // Reviewer
                let domains = defaultReviewer.domains;
                if (c.reviewerDomains) {
                    try { domains = typeof c.reviewerDomains === 'string' ? JSON.parse(c.reviewerDomains) : c.reviewerDomains; } catch { }
                }
                const reviewer = {
                    domains,
                    maxConcurrent: c.maxConcurrentReviews?.toString() || defaultReviewer.maxConcurrent,
                    slaLeadTime: c.slaReminderLeadTimeHours ? `${c.slaReminderLeadTimeHours} hours before deadline` : defaultReviewer.slaLeadTime,
                    autoDecline: c.autoDeclineOutsideExpertise ?? true,
                };
                setReviewerSettings(reviewer); setSnapReviewer(reviewer);

                // Compliance — backend uses *Months (NOT *Days) for softDelete & accountData
                const compliance = {
                    softDeleteRetention: c.softDeleteRetentionMonths != null ? `${c.softDeleteRetentionMonths} months` : defaultCompliance.softDeleteRetention,
                    hardDeleteTrigger: c.hardDeleteTriggerMonths != null ? `${c.hardDeleteTriggerMonths} months` : defaultCompliance.hardDeleteTrigger,
                    selfDeletionGrace: c.selfDeletionGracePeriodDays != null ? `${c.selfDeletionGracePeriodDays} days` : defaultCompliance.selfDeletionGrace,
                    dormantDeactivation: c.dormantUserAutoDeactivationMonths != null ? `${c.dormantUserAutoDeactivationMonths} months` : defaultCompliance.dormantDeactivation,
                    accountDataRetention: c.accountDataRetentionMonths != null ? `${c.accountDataRetentionMonths} months` : defaultCompliance.accountDataRetention,
                };
                setComplianceSettings(compliance); setSnapCompliance(compliance);

                // Email & Notifications
                const email = {
                    notificationRetention: c.notificationRetentionDays?.toString() || defaultEmail.notificationRetention,
                    inactiveLearnerTrigger: c.inactiveLearnerReminderWeeks === 2
                        ? "2 weeks, 1 month"
                        : c.inactiveLearnerReminderWeeks
                            ? `${c.inactiveLearnerReminderWeeks} weeks`
                            : defaultEmail.inactiveLearnerTrigger,
                    notificationPriority: c.notificationPriorityLevels
                        ? (Array.isArray(c.notificationPriorityLevels) ? c.notificationPriorityLevels.join(" / ") : c.notificationPriorityLevels)
                        : defaultEmail.notificationPriority,
                    lessonUpdate: c.notifyOnLessonUpdate ?? defaultEmail.lessonUpdate,
                };
                setEmailSettings(email); setSnapEmail(email);

            }

            // ── Video configuration ──
            const videoRes = await api.get('/video-player-configurations');
            if (videoRes.data?.data && videoRes.data.data.length > 0) {
                const vc = videoRes.data.data[0];
                setVideoConfigId(vc.id);
                
                const videoConfig = {
                    caption: vc.videoPlayerCaption ?? true,
                    fastForwarding: vc.videoPlayerFastForward ?? false,
                    fullscreen: vc.videoPlayerFullscreen ?? true,
                    streaming: vc.videoPlayerStreaming ?? true,
                    volumeCtrl: vc.videoPlayerVolumeCtrl ?? true,
                    customizeCaption: vc.videoPlayerCustomizeCaption ?? true,
                };
                setVideoSettings(videoConfig);
                setSnapVideo(videoConfig);
            }

            // ── Auth / OTP config ──
            const authRes = await api.get('/auth/otp-config');
            if (authRes.data?.data) {
                const o = authRes.data.data;
                const auth = {
                    otpLength: "6", // system-fixed
                    otpExpiry: o.otpExpirySeconds?.toString() || defaultAuth.otpExpiry,
                    maxRetries: o.maxOtpVerifyAttempts?.toString() || defaultAuth.maxRetries,
                    resendCooldownTime: o.resendCooldownSeconds?.toString() || defaultAuth.resendCooldownTime,
                    maxFailedLoginAttempts: o.maxFailedLoginAttempts?.toString() || defaultAuth.maxFailedLoginAttempts,
                    lockoutDuration: o.temporaryBlockMinutes?.toString() || defaultAuth.lockoutDuration,
                    maxOtpResendAttempts: o.maxOtpResendAttempts?.toString() || defaultAuth.maxOtpResendAttempts,
                    loginOtpEnabled: o.loginOtpEnabled ?? defaultAuth.loginOtpEnabled,
                    passwordResetExpiry: defaultAuth.passwordResetExpiry,
                    adminMfa: true, // system-locked per GDPR/PDPA policy
                    adminSessionTimeout: o.adminSessionTimeoutMinutes?.toString() || defaultAuth.adminSessionTimeout,
                    userSessionTimeout: o.userSessionTimeoutMinutes?.toString() || defaultAuth.userSessionTimeout,
                };
                setAuthSettings(auth); setSnapAuth(auth);
            }
        } catch (err) {
            console.error("Failed to load settings", err);
            toast.error("Failed to load system settings.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => { fetchConfig(); }, [fetchConfig]);

    // ── Discard — restore active tab from its snapshot ────────────────────────
    const handleDiscard = () => {
        switch (activeTab) {
            case "organisation":   setOrgSettings({ ...snapOrg }); break;
            case "authentication": setAuthSettings({ ...snapAuth }); break;
            case "credentials":    setCredSettings({ ...snapCred }); break;
            case "assessment":     setAssessmentSettings({ ...snapAssessment }); break;
            case "reviewer":       setReviewerSettings({ ...snapReviewer }); break;
            case "compliance":     setComplianceSettings({ ...snapCompliance }); break;
            case "email":          setEmailSettings({ ...snapEmail }); break;
            default: break;
        }
        toast.info("Changes discarded.");
    };

    // ── Save — sends only the active tab's payload ────────────────────────────
    const handleSave = async () => {
        setIsSaving(true);
        try {
            const tenantTabs: TabType[] = ["organisation", "credentials", "assessment", "reviewer", "compliance", "email"];

            if (tenantTabs.includes(activeTab)) {
                if (!tenantConfigId) { toast.error("Tenant configuration not found."); return; }

                let payload: Record<string, any> = {};

                if (activeTab === "organisation") {
                    payload = {
                        showNewReleases: orgSettings.newReleases,
                        showTrending: orgSettings.trending,
                    };
                }

                if (activeTab === "credentials") {
                    const years = num(credSettings.validity);
                    payload = {
                        credentialValidityMonths: years ? years * 12 : undefined,
                        credentialVerifyUrlBase: credSettings.verifyBase || undefined,
                        autoIssueCredentials: credSettings.autoIssue,
                    };
                }

                if (activeTab === "assessment") {
                    payload = {
                        defaultPassMarkPercentage: num(assessmentSettings.passMark),
                        defaultMaxAssessmentAttempts: num(assessmentSettings.maxAttempts),
                        assessmentRetakeCooldownHours: num(assessmentSettings.retakeCooldown),
                        videoCompletionThreshold: num(assessmentSettings.videoThreshold),
                        assessmentNoResumeOnExit: assessmentSettings.noResume,
                    };
                }

                if (activeTab === "reviewer") {
                    payload = {
                        reviewerDomains: reviewerSettings.domains,
                        maxConcurrentReviews: num(reviewerSettings.maxConcurrent),
                        slaReminderLeadTimeHours: num(reviewerSettings.slaLeadTime),
                        autoDeclineOutsideExpertise: reviewerSettings.autoDecline,
                    };
                }

                if (activeTab === "compliance") {
                    const hardDeleteRaw = complianceSettings.hardDeleteTrigger;
                    let hardDeleteMonths: number | undefined;
                    if (hardDeleteRaw.includes("Immediately")) hardDeleteMonths = 0;
                    else if (hardDeleteRaw.includes("Manual")) hardDeleteMonths = undefined;
                    else if (hardDeleteRaw.includes("After soft-delete")) hardDeleteMonths = undefined;
                    else hardDeleteMonths = num(hardDeleteRaw);

                    payload = {
                        softDeleteRetentionMonths: num(complianceSettings.softDeleteRetention),
                        hardDeleteTriggerMonths: hardDeleteMonths,
                        selfDeletionGracePeriodDays: num(complianceSettings.selfDeletionGrace),
                        dormantUserAutoDeactivationMonths: num(complianceSettings.dormantDeactivation),
                        accountDataRetentionMonths: num(complianceSettings.accountDataRetention),
                    };
                }

                if (activeTab === "email") {
                    payload = {
                        notificationRetentionDays: emailSettings.notificationRetention ? parseInt(emailSettings.notificationRetention) : undefined,
                        inactiveLearnerReminderWeeks: emailSettings.inactiveLearnerTrigger === "2 weeks, 1 month" ? 2 : parseInt(emailSettings.inactiveLearnerTrigger),
                        notificationPriorityLevels: emailSettings.notificationPriority.split(/[/,]/).map(s => s.trim()).filter(Boolean),
                        notifyOnLessonUpdate: emailSettings.lessonUpdate,
                    };
                }

                Object.keys(payload).forEach(k => payload[k] === undefined && delete payload[k]);
                await api.put(`/tenant-configurations/${tenantConfigId}`, payload);

                if (activeTab === "organisation")  setSnapOrg({ ...orgSettings });
                if (activeTab === "credentials")   setSnapCred({ ...credSettings });
                if (activeTab === "assessment")    setSnapAssessment({ ...assessmentSettings });
                if (activeTab === "reviewer")      setSnapReviewer({ ...reviewerSettings });
                if (activeTab === "compliance")    setSnapCompliance({ ...complianceSettings });
                if (activeTab === "email")         setSnapEmail({ ...emailSettings });
            }

            toast.success("Settings saved successfully!");
        } catch (error: any) {
            const msg = error?.response?.data?.message || "Failed to save settings.";
            toast.error(msg);
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleVideoSave = async () => {
        setIsVideoSaving(true);
        try {
            if (!tenantConfigId) { toast.error("Tenant configuration not found."); return; }
            
            const payload = {
                videoPlayerCaption: videoSettings.caption,
                videoPlayerFastForward: videoSettings.fastForwarding,
                videoPlayerFullscreen: videoSettings.fullscreen,
                videoPlayerStreaming: videoSettings.streaming,
                videoPlayerVolumeCtrl: videoSettings.volumeCtrl,
                videoPlayerCustomizeCaption: videoSettings.customizeCaption,
            };

            await api.put(`/tenant-configurations/${tenantConfigId}`, payload);
            if (videoConfigId) {
                await api.put(`/video-player-configurations/${videoConfigId}`, payload);
            } else {
                await api.post(`/video-player-configurations`, payload);
            }
            
            setSnapVideo({ ...videoSettings });
            toast.success("Video player settings saved successfully!");
            setIsVideoModalOpen(false);
        } catch (error) {
            console.error("Save error:", error);
            toast.error("Failed to save video settings.");
        } finally {
            setIsVideoSaving(false);
        }
    };

    const tabList: TabConfig[] = useMemo(() => [
        {
            id: "organisation",
            label: "Organisation",
            category: "Identity & Access",
            description: "Tenant identity, support contacts & curation",
            badge: "Active",
            icon: Building2
        },
        {
            id: "authentication",
            label: "Authentication",
            category: "Identity & Access",
            description: "MFA enforcement, OTP rules & lockout controls",
            badge: "MFA Locked",
            icon: KeyRound
        },
        {
            id: "session_policy",
            label: "Session Policy",
            category: "Identity & Access",
            description: "Concurrency ceilings & token timeout thresholds",
            badge: "30m Admin",
            icon: Laptop
        },
        {
            id: "credentials",
            label: "Learning Credentials",
            category: "Academics & Quality",
            description: "Validity terms, certificate seals & auto-issuance",
            badge: "3 Years",
            icon: Award
        },
        {
            id: "assessment",
            label: "Assessment Defaults",
            category: "Academics & Quality",
            description: "Pass thresholds, retake cool-down & video gate",
            badge: "70% Pass",
            icon: GraduationCap
        },
        {
            id: "reviewer",
            label: "Reviewer Routing",
            category: "Academics & Quality",
            description: "Subject matter routing, SLA deadlines & limits",
            badge: "24h SLA",
            icon: Users
        },
        {
            id: "compliance",
            label: "Data & Compliance",
            category: "Governance & Infra",
            description: "GDPR/PDPA retention, soft-deletion & purging",
            badge: "GDPR Enforced",
            icon: ShieldAlert
        },
        {
            id: "email",
            label: "Email & Notifications",
            category: "Governance & Infra",
            description: "Event triggers, digest frequencies & retention",
            badge: "90 Days",
            icon: Mail
        },
        {
            id: "email_server",
            label: "Email Server (SMTP)",
            category: "Governance & Infra",
            description: "SMTP relay, TLS transport & mail gateways",
            badge: "TLS Ready",
            icon: Server
        },
        {
            id: "general",
            label: "General Platform",
            category: "Governance & Infra",
            description: "Global runtime flags, locales & system defaults",
            badge: "Production",
            icon: Sliders
        },
    ], []);

    // Filter tabs if search query is provided
    const filteredTabs = useMemo(() => {
        if (!searchQuery.trim()) return tabList;
        const q = searchQuery.toLowerCase();
        return tabList.filter(t => 
            t.label.toLowerCase().includes(q) || 
            t.description.toLowerCase().includes(q) || 
            t.category.toLowerCase().includes(q)
        );
    }, [tabList, searchQuery]);

    const activeTabMeta = useMemo(() => {
        return tabList.find(t => t.id === activeTab) || tabList[0];
    }, [tabList, activeTab]);

    const sharedProps = { handleSave, handleDiscard, isSaving };

    return (
        <div className="min-h-screen bg-slate-50/70 text-slate-800 pb-16">
            {/* Top Executive Header */}
            <header className="relative bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white border-b border-slate-800 shadow-xl overflow-hidden">
                {/* Background ambient lighting */}
                <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 right-10 w-80 h-80 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-10 relative z-10">
                    {/* Badge & Breadcrumb */}
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-blue-500/10 border border-blue-400/20 text-blue-300">
                            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                            <span>System Governance • Super Admin Console</span>
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        </div>

                        {/* Top quick actions */}
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setIsVideoModalOpen(true)}
                                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-slate-700 transition-all hover:border-blue-400/50 shadow-sm"
                                title="Configure playback features, adaptive streaming, captions and fast-forward"
                            >
                                <PlaySquare className="w-4 h-4 text-blue-400" />
                                <span>Video Player Engine</span>
                                <span className="bg-blue-500/20 text-blue-300 text-[10px] px-1.5 py-0.5 rounded font-mono font-bold">
                                    {videoSettings.caption ? "CC:ON" : "CC:OFF"}
                                </span>
                            </button>

                            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs font-medium">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                <span>Audit Logs Active</span>
                            </div>
                        </div>
                    </div>

                    {/* Title & Subtitle */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                        <div>
                            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-2">
                                Platform & System Governance
                            </h1>
                            <p className="text-sm sm:text-base text-slate-300 max-w-3xl leading-relaxed">
                                Authoritative configuration for multi-tenant identity, cryptographic credentials, compliance retentions, MFA policies, and reviewer SLAs. Critical parameters are locked by regulatory compliance mandates.
                            </p>
                        </div>
                    </div>

                    {/* Cockpit Status Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 pt-2">
                        <div className="bg-slate-800/60 backdrop-blur-sm border border-slate-700/70 rounded-xl p-3.5 hover:border-slate-600 transition-all">
                            <div className="flex items-center gap-2 text-xs font-medium text-slate-400 mb-1">
                                <Building2 className="w-3.5 h-3.5 text-blue-400" />
                                <span>Tenant Node</span>
                            </div>
                            <div className="text-sm font-bold text-white truncate">
                                {orgSettings.legalName || "Nexus Enterprise Core"}
                            </div>
                            <div className="text-[11px] text-emerald-400 font-medium flex items-center gap-1 mt-0.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                Production Active
                            </div>
                        </div>

                        <div className="bg-slate-800/60 backdrop-blur-sm border border-slate-700/70 rounded-xl p-3.5 hover:border-slate-600 transition-all">
                            <div className="flex items-center gap-2 text-xs font-medium text-slate-400 mb-1">
                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                                <span>Compliance Posture</span>
                            </div>
                            <div className="text-sm font-bold text-white">
                                GDPR / PDPA Shield
                            </div>
                            <div className="text-[11px] text-blue-300 font-medium mt-0.5">
                                Strict Privacy Locks
                            </div>
                        </div>

                        <div className="bg-slate-800/60 backdrop-blur-sm border border-slate-700/70 rounded-xl p-3.5 hover:border-slate-600 transition-all">
                            <div className="flex items-center gap-2 text-xs font-medium text-slate-400 mb-1">
                                <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                                <span>Admin MFA Policy</span>
                            </div>
                            <div className="text-sm font-bold text-white">
                                Mandatory MFA
                            </div>
                            <div className="text-[11px] text-amber-400 font-medium flex items-center gap-1 mt-0.5">
                                <Lock className="w-3 h-3" />
                                Non-Bypassable
                            </div>
                        </div>

                        <div className="bg-slate-800/60 backdrop-blur-sm border border-slate-700/70 rounded-xl p-3.5 hover:border-slate-600 transition-all">
                            <div className="flex items-center gap-2 text-xs font-medium text-slate-400 mb-1">
                                <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-400" />
                                <span>Policy Modules</span>
                            </div>
                            <div className="text-sm font-bold text-white">
                                10 Configured Hubs
                            </div>
                            <div className="text-[11px] text-indigo-300 font-medium mt-0.5">
                                Synchronized
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-5 relative z-20">
                {/* Search & Navigation Bar Card */}
                <div className="bg-white rounded-2xl shadow-lg border border-slate-200/90 p-4 mb-6 transition-all">
                    {/* Search and Section Header */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-3 border-b border-slate-100">
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                                <Sliders className="w-3.5 h-3.5 text-blue-600" /> System Hubs
                            </span>
                            <span className="text-xs text-slate-400">({tabList.length} categories)</span>
                        </div>

                        {/* Search input for quick jump */}
                        <div className="relative w-full sm:w-72">
                            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Filter settings & policies..."
                                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                            />
                            {searchQuery && (
                                <button 
                                    onClick={() => setSearchQuery("")}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
                                >
                                    ✕
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Nav Tabs Pill Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 pt-3">
                        {filteredTabs.map((tab) => {
                            const IconComponent = tab.icon;
                            const isActive = activeTab === tab.id;

                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`group relative text-left p-2.5 rounded-xl border transition-all flex flex-col justify-between ${
                                        isActive
                                            ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-600 shadow-md shadow-blue-500/20 -translate-y-0.5"
                                            : "bg-slate-50/70 hover:bg-slate-100/90 text-slate-700 border-slate-200/80 hover:border-slate-300"
                                    }`}
                                >
                                    <div className="flex items-center justify-between w-full mb-1.5">
                                        <div className={`p-1.5 rounded-lg ${
                                            isActive ? "bg-white/20 text-white" : "bg-white text-slate-600 shadow-xs border border-slate-200/60 group-hover:text-blue-600"
                                        }`}>
                                            <IconComponent className="w-4 h-4" />
                                        </div>
                                        {tab.badge && (
                                            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                                                isActive ? "bg-white/25 text-white" : "bg-slate-200/70 text-slate-600"
                                            }`}>
                                                {tab.badge}
                                            </span>
                                        )}
                                    </div>
                                    <div>
                                        <div className={`text-xs font-bold leading-tight ${isActive ? "text-white" : "text-slate-800"}`}>
                                            {tab.label}
                                        </div>
                                        <div className={`text-[10px] truncate mt-0.5 ${isActive ? "text-blue-100" : "text-slate-500"}`}>
                                            {tab.category}
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Active Hub Breadcrumb & Overview Card */}
                <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-blue-950 text-white rounded-2xl p-5 mb-6 shadow-md border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3.5">
                        <div className="p-3 bg-blue-500/20 border border-blue-400/30 rounded-xl text-blue-400 shadow-inner">
                            <activeTabMeta.icon className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400">
                                    {activeTabMeta.category}
                                </span>
                                <span className="text-slate-500">•</span>
                                <span className="text-[11px] text-slate-400">Module ID: {activeTabMeta.id}</span>
                            </div>
                            <h2 className="text-xl font-bold text-white">
                                {activeTabMeta.label} Configuration
                            </h2>
                            <p className="text-xs text-slate-300 mt-0.5">
                                {activeTabMeta.description}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
                        <button
                            onClick={handleDiscard}
                            className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all flex items-center gap-1.5 shadow-sm"
                        >
                            <RotateCcw className="w-3.5 h-3.5" />
                            Discard
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="px-4 py-2 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                        >
                            {isSaving ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                                <Save className="w-3.5 h-3.5" />
                            )}
                            Save Changes
                        </button>
                    </div>
                </div>

                {/* Subcomponent Container */}
                <div className="bg-transparent">
                    {(() => {
                        switch (activeTab) {
                            case "organisation":   
                                return <OrganisationSetting orgSettings={orgSettings} setOrgSettings={setOrgSettings} isLoading={isLoading} {...sharedProps} />;
                            case "authentication": 
                                return <AuthenticationSetting handleDiscard={handleDiscard} isSaving={isSaving} authSettings={authSettings} setAuthSettings={setAuthSettings} isLoading={isLoading} />;
                            case "credentials":    
                                return <CredentialsSetting credSettings={credSettings} setCredSettings={setCredSettings} isLoading={isLoading} {...sharedProps} />;
                            case "assessment":     
                                return <AssessmentSetting assessmentSettings={assessmentSettings} setAssessmentSettings={setAssessmentSettings} isLoading={isLoading} {...sharedProps} />;
                            case "reviewer":       
                                return <ReviewerSetting reviewerSettings={reviewerSettings} setReviewerSettings={setReviewerSettings} isLoading={isLoading} {...sharedProps} />;
                            case "email":          
                                return <EmailSetting emailSettings={emailSettings} setEmailSettings={setEmailSettings} isLoading={isLoading} {...sharedProps} />;
                            case "compliance":     
                                return <ComplianceSetting complianceSettings={complianceSettings} setComplianceSettings={setComplianceSettings} isLoading={isLoading} {...sharedProps} />;
                            case "general":        
                                return <General handleSave={handleSave} handleDiscard={handleDiscard} isSaving={isSaving} isLoading={isLoading} />;
                            case "email_server":   
                                return <EmailServer handleSave={handleSave} handleDiscard={handleDiscard} isSaving={isSaving} isLoading={isLoading} />;
                            case "session_policy": 
                                return <SessionPolicy isLoading={isLoading} />;
                            default: 
                                return null;
                        }
                    })()}
                </div>
            </main>

            {/* Video Player Configuration Modal */}
            <VideoPlayerSettingModal 
                isOpen={isVideoModalOpen} 
                onClose={() => setIsVideoModalOpen(false)} 
                videoSettings={videoSettings}
                setVideoSettings={setVideoSettings}
                onSave={handleVideoSave}
                isSaving={isVideoSaving}
            />
        </div>
    );
};

export default SuperadminSetting;


