import React, { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { EmailSettingsTab } from "./EmailSettingsTab";
import { api } from "../../config/axios";

type TabType = "organisation" | "authentication" | "credentials" | "assessment" | "reviewer" | "email" | "corporate" | "integrations" | "compliance";

const SystemSettings = () => {
    const [activeTab, setActiveTab] = useState<TabType>("organisation");
    const [isSaving, setIsSaving] = useState(false);
    const [tenantConfigId, setTenantConfigId] = useState<number | null>(null);

    const [orgSettings, setOrgSettings] = useState({
        legalName: "Nexus Academy",
        supportEmail: "support@nexus.org",
        language: "English (EN)",
        timezone: "Asia/Muscat (UTC+4)",
        brandColor: "#1e1e1e",
        newReleases: true,
        trending: true,
    });

    const [authSettings, setAuthSettings] = useState({
        otpLength: "6",
        otpExpiry: "2 minutes",
        maxRetries: "3",
        lockoutDuration: "1 day",
        adminMfa: true,
        adminSessionTimeout: "30 minutes",
        userSessionTimeout: "7 days",
    });

    const [credSettings, setCredSettings] = useState({
        validity: "3 years",
        verifyBase: "nexusacademy.org/verify/",
        autoIssue: true,
    });

    const [assessmentSettings, setAssessmentSettings] = useState({
        passMark: "70%",
        maxAttempts: "3",
        retakeCooldown: "24 hours",
        videoThreshold: "90%",
        noResume: true,
    });

    const [reviewerSettings, setReviewerSettings] = useState({
        domains: ["Knowledge Management", "Records Management", "Data Governance", "Data Management", "Document Control", "ISO Standards"],
        maxConcurrent: "3",
        slaLeadTime: "24 hours before deadline",
        autoDecline: true,
    });

    const [corporateSettings, setCorporateSettings] = useState({
        inviteLinkExpiry: "48 hours",
        tempRoleExpiry: "30 days"
    });

    const [complianceSettings, setComplianceSettings] = useState({
        softDeleteRetention: "6 months",
        hardDeleteTrigger: "6 months",
        selfDeletionGrace: "30 days",
        dormantDeactivation: "6 months",
        accountDataRetention: "6 months",
    });

    const [emailSettings, setEmailSettings] = useState({
        notificationRetention: "90 days",
        inactiveLearnerTrigger: "2 weeks + 1 month",
        notificationPriority: "High / Normal / Critical / Low"
    });

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const res = await api.get('/tenant-configurations');
                if (res.data?.data && res.data.data.length > 0) {
                    const config = res.data.data[0];
                    setTenantConfigId(config.id);
                    
                    if (config.invitationExpiryDays) {
                        setCorporateSettings(prev => ({ ...prev, inviteLinkExpiry: `${config.invitationExpiryDays} days` }));
                    }
                    if (config.temporaryRoleExpiryDays) {
                        setCorporateSettings(prev => ({ ...prev, tempRoleExpiry: `${config.temporaryRoleExpiryDays} days` }));
                    }
                    
                    setComplianceSettings({
                        softDeleteRetention: config.softDeleteRetentionMonths ? `${config.softDeleteRetentionMonths} months` : "6 months",
                        hardDeleteTrigger: config.hardDeleteTriggerMonths ? `${config.hardDeleteTriggerMonths} months` : "6 months",
                        selfDeletionGrace: config.selfDeletionGracePeriodDays ? `${config.selfDeletionGracePeriodDays} days` : "30 days",
                        dormantDeactivation: config.dormantUserAutoDeactivationMonths ? `${config.dormantUserAutoDeactivationMonths} months` : "6 months",
                        accountDataRetention: config.accountDataRetentionMonths ? `${config.accountDataRetentionMonths} months` : "6 months",
                    });

                    setEmailSettings({
                        notificationRetention: config.notificationRetentionDays ? `${config.notificationRetentionDays} days` : "90 days",
                        inactiveLearnerTrigger: config.inactiveLearnerReminderWeeks ? `${config.inactiveLearnerReminderWeeks} weeks` : "2 weeks + 1 month",
                        notificationPriority: config.notificationPriorityLevels ? JSON.stringify(config.notificationPriorityLevels) : "High / Normal / Critical / Low"
                    });

                    setOrgSettings({
                        legalName: config.legalName || "Nexus Academy",
                        supportEmail: config.supportEmail || "support@nexus.org",
                        language: config.defaultLanguage || "English (EN)",
                        timezone: config.timezone || "Asia/Muscat (UTC+4)",
                        brandColor: config.brandColorToken || "#1e1e1e",
                        newReleases: config.showNewReleases ?? true,
                        trending: config.showTrending ?? true,
                    });

                    setCredSettings({
                        validity: config.credentialValidityMonths ? `${config.credentialValidityMonths / 12} years` : "3 years",
                        verifyBase: config.credentialVerifyUrlBase || "nexusacademy.org/verify/",
                        autoIssue: config.autoIssueCredentials ?? true,
                    });

                    setAssessmentSettings({
                        passMark: config.defaultPassMarkPercentage ? `${config.defaultPassMarkPercentage}%` : "70%",
                        maxAttempts: config.defaultMaxAssessmentAttempts?.toString() || "3",
                        retakeCooldown: config.assessmentRetakeCooldownHours ? `${config.assessmentRetakeCooldownHours} hours` : "24 hours",
                        videoThreshold: config.videoCompletionThreshold ? `${config.videoCompletionThreshold}%` : "90%",
                        noResume: config.assessmentNoResumeOnExit ?? true,
                    });

                    let parsedDomains = ["Knowledge Management", "Records Management", "Data Governance", "Data Management", "Document Control", "ISO Standards"];
                    if (config.reviewerDomains) {
                        try { parsedDomains = typeof config.reviewerDomains === 'string' ? JSON.parse(config.reviewerDomains) : config.reviewerDomains; } catch (e) { }
                    }
                    
                    setReviewerSettings({
                        domains: parsedDomains,
                        maxConcurrent: config.maxConcurrentReviews?.toString() || "3",
                        slaLeadTime: config.slaReminderLeadTimeHours ? `${config.slaReminderLeadTimeHours} hours before deadline` : "24 hours before deadline",
                        autoDecline: config.autoDeclineOutsideExpertise ?? true,
                    });
                }

                // Fetch auth / otp config
                const authRes = await api.get('/auth/otp-config');
                if (authRes.data?.data) {
                    const otpConfig = authRes.data.data;
                    setAuthSettings(prev => ({
                        ...prev,
                        otpExpiry: otpConfig.otpExpirySeconds ? `${Math.floor(otpConfig.otpExpirySeconds / 60)} minutes` : "2 minutes",
                        maxRetries: otpConfig.maxOtpVerifyAttempts?.toString() || "3",
                        lockoutDuration: otpConfig.temporaryBlockMinutes ? `${Math.floor(otpConfig.temporaryBlockMinutes / 1440)} day(s)` : "1 day",
                        adminSessionTimeout: otpConfig.adminSessionTimeoutMinutes ? `${otpConfig.adminSessionTimeoutMinutes} minutes` : "30 minutes",
                        userSessionTimeout: otpConfig.userSessionTimeoutMinutes ? `${Math.floor(otpConfig.userSessionTimeoutMinutes / 1440)} days` : "7 days"
                    }));
                }
            } catch (err) {
                console.error("Failed to load settings", err);
            }
        };
        fetchConfig();
    }, []);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            if (tenantConfigId) {
                const payload = {
                    invitationExpiryDays: parseInt(corporateSettings.inviteLinkExpiry) || undefined,
                    temporaryRoleExpiryDays: parseInt(corporateSettings.tempRoleExpiry) || undefined,
                    softDeleteRetentionMonths: parseInt(complianceSettings.softDeleteRetention) || undefined,
                    hardDeleteTriggerMonths: parseInt(complianceSettings.hardDeleteTrigger) || undefined,
                    selfDeletionGracePeriodDays: parseInt(complianceSettings.selfDeletionGrace) || undefined,
                    dormantUserAutoDeactivationMonths: parseInt(complianceSettings.dormantDeactivation) || undefined,
                    accountDataRetentionMonths: parseInt(complianceSettings.accountDataRetention) || undefined,
                    notificationRetentionDays: parseInt(emailSettings.notificationRetention) || undefined,
                    inactiveLearnerReminderWeeks: parseInt(emailSettings.inactiveLearnerTrigger) || undefined,
                    
                    legalName: orgSettings.legalName,
                    supportEmail: orgSettings.supportEmail,
                    defaultLanguage: orgSettings.language,
                    timezone: orgSettings.timezone,
                    brandColorToken: orgSettings.brandColor,
                    showNewReleases: orgSettings.newReleases,
                    showTrending: orgSettings.trending,

                    credentialValidityMonths: parseInt(credSettings.validity) ? parseInt(credSettings.validity) * 12 : undefined,
                    credentialVerifyUrlBase: credSettings.verifyBase,
                    autoIssueCredentials: credSettings.autoIssue,

                    defaultPassMarkPercentage: parseInt(assessmentSettings.passMark) || undefined,
                    defaultMaxAssessmentAttempts: parseInt(assessmentSettings.maxAttempts) || undefined,
                    assessmentRetakeCooldownHours: parseInt(assessmentSettings.retakeCooldown) || undefined,
                    videoCompletionThreshold: parseInt(assessmentSettings.videoThreshold) || undefined,
                    assessmentNoResumeOnExit: assessmentSettings.noResume,

                    reviewerDomains: reviewerSettings.domains,
                    maxConcurrentReviews: parseInt(reviewerSettings.maxConcurrent) || undefined,
                    slaReminderLeadTimeHours: parseInt(reviewerSettings.slaLeadTime) || undefined,
                    autoDeclineOutsideExpertise: reviewerSettings.autoDecline,
                };
                await api.put(`/tenant-configurations/${tenantConfigId}`, payload);
            }

            // Update Auth settings
            const parseMinutes = (str: string, isDays = false) => {
                const val = parseInt(str);
                if (isNaN(val)) return undefined;
                return isDays || str.includes('day') ? val * 1440 : val;
            };

            const authPayload = {
                otpExpirySeconds: parseInt(authSettings.otpExpiry) ? parseInt(authSettings.otpExpiry) * 60 : undefined,
                maxOtpVerifyAttempts: parseInt(authSettings.maxRetries) || undefined,
                temporaryBlockMinutes: parseMinutes(authSettings.lockoutDuration, true),
                adminSessionTimeoutMinutes: parseMinutes(authSettings.adminSessionTimeout),
                userSessionTimeoutMinutes: parseMinutes(authSettings.userSessionTimeout, true)
            };
            await api.put('/auth/otp-config', authPayload);

            toast.success("System settings saved successfully!");
        } catch (error) {
            toast.error("Failed to save system settings.");
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };

    const removeDomain = (domain: string) => {
        setReviewerSettings(prev => ({
            ...prev,
            domains: prev.domains.filter(d => d !== domain)
        }));
    };

    const renderTabs = () => {
        const tabs: { id: TabType, label: string }[] = [
            { id: "organisation", label: "Organisation" },
            { id: "authentication", label: "Authentication" },
            { id: "credentials", label: "Learning credentials" },
            { id: "assessment", label: "Assessment defaults" },
            { id: "reviewer", label: "Reviewer routing" },
            { id: "email", label: "Email & notifications" },
            { id: "corporate", label: "Corporate / tenancy" },
            { id: "integrations", label: "Integrations" },
            { id: "compliance", label: "Data & compliance" },
        ];

        return (
            <div className="flex space-x-6 border-b border-gray-200 mb-8 overflow-x-auto scrollbar-hide text-[13px]">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`pb-4 px-1 whitespace-nowrap transition-colors font-medium ${
                            activeTab === tab.id
                                ? "text-gray-900 border-b-2 border-gray-900"
                                : "text-gray-500 hover:text-gray-700"
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>
        );
    };

    const renderOrganisation = () => (
        <div className="space-y-8 animate-in fade-in duration-300">
            <div>
                <p className="text-xs text-gray-500 mb-6">Legal identity and platform-wide locale settings.</p>
                
                <div className="bg-white border border-gray-200/60 rounded-xl p-6 shadow-sm">
                    <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-5">Identity</h4>
                    <div className="grid md:grid-cols-2 gap-6 mb-6">
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-2 uppercase">Legal Institution Name</label>
                            <input type="text" value={orgSettings.legalName} onChange={(e) => setOrgSettings({...orgSettings, legalName: e.target.value})} className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-[#C16253]/20 focus:border-[#C16253] transition-all" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-2 uppercase">Support Email</label>
                            <input type="email" value={orgSettings.supportEmail} onChange={(e) => setOrgSettings({...orgSettings, supportEmail: e.target.value})} className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-[#C16253]/20 focus:border-[#C16253] transition-all" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-2 uppercase">Default Language</label>
                            <select value={orgSettings.language} onChange={(e) => setOrgSettings({...orgSettings, language: e.target.value})} className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm bg-white cursor-pointer focus:ring-[#C16253]/20 focus:border-[#C16253] transition-all">
                                <option>English (EN)</option>
                                <option>Arabic (AR)</option>
                            </select>
                            <p className="text-[10px] text-gray-400 mt-1">Arabic (AR) available as secondary locale</p>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-2 uppercase">Timezone</label>
                            <select value={orgSettings.timezone} onChange={(e) => setOrgSettings({...orgSettings, timezone: e.target.value})} className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm bg-white cursor-pointer focus:ring-[#C16253]/20 focus:border-[#C16253] transition-all">
                                <option>Asia/Muscat (UTC+4)</option>
                                <option>Asia/Dubai (UTC+4)</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="bg-white border border-gray-200/60 rounded-xl p-6 shadow-sm mt-6">
                    <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-5">Branding</h4>
                    <div className="grid md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-2 uppercase">Logo</label>
                            <div className="w-full border border-dashed border-gray-300 rounded-lg h-16 flex items-center justify-center bg-gray-50 text-xs text-gray-400 cursor-pointer hover:bg-gray-100 transition-colors">
                                Logo upload placeholder - PNG / SVG
                            </div>
                            <p className="text-[10px] text-gray-400 mt-2">Shown in email headers, learning credential seal, and admin topbar.</p>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-2 uppercase">Primary Brand Colour Token</label>
                            <input type="text" value={orgSettings.brandColor} onChange={(e) => setOrgSettings({...orgSettings, brandColor: e.target.value})} className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm font-mono focus:ring-[#C16253]/20 focus:border-[#C16253] transition-all" />
                            <p className="text-[10px] text-gray-400 mt-2">Used in generated learning credential PDFs and email templates only. UI theme is fixed.</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white border border-gray-200/60 rounded-xl p-6 shadow-sm mt-6">
                    <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-5">Content Sections (Platform-wide)</h4>
                    <div className="space-y-6">
                        <div className="flex items-start justify-between">
                            <div>
                                <h5 className="text-sm font-semibold text-gray-800">New releases section</h5>
                                <p className="text-xs text-gray-500 mt-1">Show a "New releases" section on the learner home page, highlighting recently published courses.</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer group shrink-0">
                                <input type="checkbox" className="sr-only peer" checked={orgSettings.newReleases} onChange={() => setOrgSettings({...orgSettings, newReleases: !orgSettings.newReleases})} />
                                <div className="w-11 h-6 bg-green-500 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                            </label>
                        </div>
                        <div className="flex items-start justify-between border-t border-gray-100 pt-6">
                            <div>
                                <h5 className="text-sm font-semibold text-gray-800">Trending section</h5>
                                <p className="text-xs text-gray-500 mt-1">Show a "Trending" section on the learner home page based on enrolment activity in the past 30 days.</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer group shrink-0">
                                <input type="checkbox" className="sr-only peer" checked={orgSettings.trending} onChange={() => setOrgSettings({...orgSettings, trending: !orgSettings.trending})} />
                                <div className="w-11 h-6 bg-green-500 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                            </label>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderAuthentication = () => (
        <div className="space-y-8 animate-in fade-in duration-300">
            <div>
                <p className="text-xs text-gray-500 mb-6">OTP rules and session policy. Compliance-critical values are locked.</p>
                
                <div className="bg-white border border-gray-200/60 rounded-xl p-6 shadow-sm">
                    <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-5">OTP Policy</h4>
                    <div className="grid md:grid-cols-2 gap-6 mb-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-2 uppercase">OTP Length (Digits)</label>
                            <input type="text" value={authSettings.otpLength} readOnly className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm bg-gray-50 text-gray-500 focus:outline-none" />
                            <div className="mt-2 flex items-center gap-2">
                                <span className="bg-gray-200 text-gray-600 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase">System</span>
                                <span className="text-[10px] text-gray-400">Fixed for OTP compliance.</span>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-2 uppercase">OTP Expiry</label>
                            <input type="text" value={authSettings.otpExpiry} onChange={(e) => setAuthSettings({...authSettings, otpExpiry: e.target.value})} className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-[#C16253]/20 focus:border-[#C16253] transition-all" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-2 uppercase">Max OTP Retries Before Lockout</label>
                            <input type="text" value={authSettings.maxRetries} onChange={(e) => setAuthSettings({...authSettings, maxRetries: e.target.value})} className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-[#C16253]/20 focus:border-[#C16253] transition-all" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-2 uppercase">Lockout Duration</label>
                            <input type="text" value={authSettings.lockoutDuration} onChange={(e) => setAuthSettings({...authSettings, lockoutDuration: e.target.value})} className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-[#C16253]/20 focus:border-[#C16253] transition-all" />
                        </div>
                    </div>
                    <a href="#" className="text-xs text-gray-700 underline font-medium hover:text-black">Open full OTP configuration (resend attempts, cooldown) ↗</a>
                </div>

                <div className="bg-white border border-gray-200/60 rounded-xl p-6 shadow-sm mt-6">
                    <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-5">MFA and Sessions</h4>
                    <div className="space-y-6">
                        <div className="flex items-start justify-between">
                            <div>
                                <h5 className="text-sm font-semibold text-gray-800">Admin MFA required</h5>
                                <div className="mt-1 flex items-center gap-2">
                                    <span className="bg-gray-200 text-gray-600 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase">Locked</span>
                                    <span className="text-xs text-gray-500">Mandatory for GDPR/PDPA compliance, MFA requires for all admin access.</span>
                                </div>
                            </div>
                            <span className="bg-gray-500 text-white text-xs px-3 py-1 rounded-full font-medium">ON</span>
                        </div>
                        
                        <div className="grid md:grid-cols-2 gap-6 border-t border-gray-100 pt-6">
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-2 uppercase">Admin Session Timeout</label>
                                <input type="text" value={authSettings.adminSessionTimeout} onChange={(e) => setAuthSettings({...authSettings, adminSessionTimeout: e.target.value})} className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-[#C16253]/20 focus:border-[#C16253] transition-all" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-2 uppercase">User Session Timeout</label>
                                <input type="text" value={authSettings.userSessionTimeout} onChange={(e) => setAuthSettings({...authSettings, userSessionTimeout: e.target.value})} className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-[#C16253]/20 focus:border-[#C16253] transition-all" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderCredentials = () => (
        <div className="space-y-8 animate-in fade-in duration-300">
            <div>
                <p className="text-xs text-gray-500 mb-6">Platform-wide learning credential eligibility, validity, and template settings.</p>
                
                <div className="bg-white border border-gray-200/60 rounded-xl p-6 shadow-sm">
                    <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-5">Eligibility Rule</h4>
                    <div className="border border-gray-200 bg-gray-50 rounded-lg px-4 py-3 text-sm text-gray-600 font-mono mb-2">
                        <span className="bg-white border border-gray-300 rounded px-1.5 py-0.5 text-[10px] font-bold text-gray-500 mr-2">READ-ONLY</span>
                        100% of lessons completed + quiz score ≥ 70% + learner profile 100% complete
                    </div>
                    <p className="text-[10px] text-gray-400">Eligibility rule is defined in product logic. Contact engineering to modify.</p>
                </div>

                <div className="bg-white border border-gray-200/60 rounded-xl p-6 shadow-sm mt-6">
                    <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-5">Validity and Issuance</h4>
                    <div className="grid md:grid-cols-2 gap-6 mb-6">
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-2 uppercase">Default Learning Credential Validity</label>
                            <input type="text" value={credSettings.validity} onChange={(e) => setCredSettings({...credSettings, validity: e.target.value})} className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-[#C16253]/20 focus:border-[#C16253] transition-all" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-2 uppercase">Verify URL Base</label>
                            <input type="text" value={credSettings.verifyBase} onChange={(e) => setCredSettings({...credSettings, verifyBase: e.target.value})} className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-[#C16253]/20 focus:border-[#C16253] transition-all" />
                            <p className="text-[10px] text-gray-400 mt-1">Full URL: nexusacademy.org/verify/[cert-id]</p>
                        </div>
                    </div>
                    
                    <div className="flex items-start justify-between border-t border-gray-100 pt-6">
                        <div>
                            <h5 className="text-sm font-semibold text-gray-800">Auto-issue on eligibility met</h5>
                            <div className="mt-1 flex items-center gap-2">
                                <span className="bg-gray-200 text-gray-600 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase">Locked</span>
                                <span className="text-xs text-gray-500">Fixed system behaviour. Learning credential generated and emailed automatically; cannot be disabled.</span>
                            </div>
                        </div>
                        <span className="bg-gray-500 text-white text-xs px-3 py-1 rounded-full font-medium shrink-0">ON</span>
                    </div>
                </div>

                <div className="bg-white border border-gray-200/60 rounded-xl p-6 shadow-sm mt-6">
                    <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-5">Learning Credential Template</h4>
                    <div className="w-full border border-dashed border-gray-300 rounded-lg h-24 flex items-center justify-center bg-gray-50 text-xs text-gray-400 cursor-pointer hover:bg-gray-100 transition-colors mb-2">
                        Template upload placeholder - PDF / DOCX
                    </div>
                    <p className="text-[10px] text-gray-500 mb-2">Uploaded template overrides the default certificate layout. Must include: [learner_name], [course], [issue_date], [cert_id] merge fields.</p>
                    <a href="#" className="text-xs text-gray-700 underline font-medium hover:text-black">Open certificate design & field mapping ↗</a>
                </div>
            </div>
        </div>
    );

    const renderAssessment = () => (
        <div className="space-y-8 animate-in fade-in duration-300">
            <div>
                <p className="text-xs text-gray-500 mb-6">Platform defaults for all quizzes and assessments. Course builders may override unless locked.</p>
                
                <div className="bg-white border border-gray-200/60 rounded-xl p-6 shadow-sm">
                    <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-5">Pass and Retry Rules</h4>
                    
                    <div className="grid md:grid-cols-2 gap-6 mb-6">
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-2 uppercase">Default Pass Mark</label>
                            <input type="text" value={assessmentSettings.passMark} onChange={(e) => setAssessmentSettings({...assessmentSettings, passMark: e.target.value})} className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-[#C16253]/20 focus:border-[#C16253] transition-all" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-2 uppercase">Max Attempts Per Assessment</label>
                            <input type="text" value={assessmentSettings.maxAttempts} onChange={(e) => setAssessmentSettings({...assessmentSettings, maxAttempts: e.target.value})} className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-[#C16253]/20 focus:border-[#C16253] transition-all" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-2 uppercase">Retake Cooldown</label>
                            <input type="text" value={assessmentSettings.retakeCooldown} onChange={(e) => setAssessmentSettings({...assessmentSettings, retakeCooldown: e.target.value})} className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-[#C16253]/20 focus:border-[#C16253] transition-all" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-2 uppercase">Video Completion Threshold</label>
                            <input type="text" value={assessmentSettings.videoThreshold} onChange={(e) => setAssessmentSettings({...assessmentSettings, videoThreshold: e.target.value})} className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-[#C16253]/20 focus:border-[#C16253] transition-all" />
                            <p className="text-[10px] text-gray-400 mt-1">Minimum viewing percentage required to mark a video lesson complete. Override per course.</p>
                        </div>
                    </div>
                    
                    <div className="flex items-start justify-between border-t border-gray-100 pt-6">
                        <div>
                            <h5 className="text-sm font-semibold text-gray-800">No resume on exit</h5>
                            <div className="mt-1 flex items-center gap-2">
                                <span className="bg-gray-200 text-gray-600 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase">Locked</span>
                                <span className="text-xs text-gray-500">Exiting an assessment counts as an attempt (academic integrity policy).</span>
                            </div>
                        </div>
                        <span className="bg-gray-500 text-white text-xs px-3 py-1 rounded-full font-medium shrink-0">ON</span>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderReviewer = () => (
        <div className="space-y-8 animate-in fade-in duration-300">
            <div>
                <p className="text-xs text-gray-500 mb-6">Control how courses route to SME reviewers: the subjects reviewers can cover, plus concurrency, SLA reminder, and auto-decline defaults. SMEs fine-tune within these limits in their own settings.</p>
                
                <div className="bg-white border border-gray-200/60 rounded-xl p-6 shadow-sm">
                    <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-5">Available Reviewer Domains</h4>
                    
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-2 uppercase">Subjects Reviewers Can Be Assigned To</label>
                        <select className="border border-gray-200 rounded-lg px-4 py-2 text-sm bg-white cursor-pointer w-48 mb-4 hover:bg-gray-50 transition-colors">
                            <option>Add a subject...</option>
                        </select>
                        
                        <div className="flex flex-wrap gap-2">
                            {reviewerSettings.domains.map((domain, i) => (
                                <div key={i} className="inline-flex items-center gap-2 border border-[#E9C37A] bg-white px-3 py-1.5 rounded-full text-[11px] font-medium text-gray-700">
                                    {domain}
                                    <button onClick={() => removeDomain(domain)} className="text-gray-400 hover:text-gray-600 ml-1">×</button>
                                </div>
                            ))}
                        </div>
                        <p className="text-[10px] text-gray-400 mt-3">This is the master list. SMEs choose their domains of expertise from in their reviewer preferences.</p>
                    </div>
                </div>

                <div className="bg-white border border-gray-200/60 rounded-xl p-6 shadow-sm mt-6">
                    <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-5">Routing Defaults</h4>
                    
                    <div className="grid md:grid-cols-2 gap-6 mb-6">
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-2 uppercase">Default Max Concurrent Reviews</label>
                            <input type="text" value={reviewerSettings.maxConcurrent} onChange={(e) => setReviewerSettings({...reviewerSettings, maxConcurrent: e.target.value})} className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-[#C16253]/20 focus:border-[#C16253] transition-all" />
                            <p className="text-[10px] text-gray-400 mt-1">A reviewer's queue stops accepting new assignments at this limit.</p>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-2 uppercase">Default SLA Reminder Lead Time</label>
                            <select value={reviewerSettings.slaLeadTime} onChange={(e) => setReviewerSettings({...reviewerSettings, slaLeadTime: e.target.value})} className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm bg-white cursor-pointer focus:ring-[#C16253]/20 focus:border-[#C16253] transition-all">
                                <option>24 hours before deadline</option>
                                <option>48 hours before deadline</option>
                                <option>72 hours before deadline</option>
                            </select>
                            <p className="text-[10px] text-gray-400 mt-1">When to send the SLA reminder notification to reviewers.</p>
                        </div>
                    </div>
                    
                    <div className="flex items-start justify-between border-t border-gray-100 pt-6">
                        <div>
                            <h5 className="text-sm font-semibold text-gray-800">Auto-decline outside expertise (default)</h5>
                            <p className="text-xs text-gray-500 mt-1">Automatically decline course submissions that do not match a reviewer's active domains, notify the admin, and re-queue for another reviewer. SMEs may override this in their own settings.</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer group shrink-0 ml-4">
                            <input type="checkbox" className="sr-only peer" checked={reviewerSettings.autoDecline} onChange={() => setReviewerSettings({...reviewerSettings, autoDecline: !reviewerSettings.autoDecline})} />
                            <div className="w-11 h-6 bg-green-500 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                        </label>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderCorporate = () => (
        <div className="space-y-8 animate-in fade-in duration-300">
            <div>
                <p className="text-xs text-gray-500 mb-6">Tenancy and corporate access management defaults.</p>
                
                <div className="bg-white border border-gray-200/60 rounded-xl p-6 shadow-sm">
                    <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-5">Tenancy & Access</h4>
                    <div className="grid md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-2 uppercase">Corporate Invite-Link Expiry</label>
                            <input type="text" value={corporateSettings.inviteLinkExpiry} onChange={(e) => setCorporateSettings({...corporateSettings, inviteLinkExpiry: e.target.value})} className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-[#C16253]/20 focus:border-[#C16253] transition-all" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-2 uppercase">Temporary Role Expiry</label>
                            <input type="text" value={corporateSettings.tempRoleExpiry} onChange={(e) => setCorporateSettings({...corporateSettings, tempRoleExpiry: e.target.value})} className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-[#C16253]/20 focus:border-[#C16253] transition-all" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderCompliance = () => (
        <div className="space-y-8 animate-in fade-in duration-300">
            <div>
                <p className="text-xs text-gray-500 mb-6">Data retention policies and user lifecycle settings.</p>
                
                <div className="bg-white border border-gray-200/60 rounded-xl p-6 shadow-sm">
                    <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-5">Data Retention & Deletion</h4>
                    <div className="grid md:grid-cols-2 gap-6 mb-6">
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-2 uppercase">Soft-Delete Retention</label>
                            <input type="text" value={complianceSettings.softDeleteRetention} onChange={(e) => setComplianceSettings({...complianceSettings, softDeleteRetention: e.target.value})} className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-[#C16253]/20 focus:border-[#C16253] transition-all" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-2 uppercase">Hard-Delete Trigger</label>
                            <input type="text" value={complianceSettings.hardDeleteTrigger} onChange={(e) => setComplianceSettings({...complianceSettings, hardDeleteTrigger: e.target.value})} className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-[#C16253]/20 focus:border-[#C16253] transition-all" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-2 uppercase">Self-Deletion Grace Period</label>
                            <input type="text" value={complianceSettings.selfDeletionGrace} onChange={(e) => setComplianceSettings({...complianceSettings, selfDeletionGrace: e.target.value})} className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-[#C16253]/20 focus:border-[#C16253] transition-all" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-2 uppercase">Account Data Retention</label>
                            <input type="text" value={complianceSettings.accountDataRetention} onChange={(e) => setComplianceSettings({...complianceSettings, accountDataRetention: e.target.value})} className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-[#C16253]/20 focus:border-[#C16253] transition-all" />
                        </div>
                    </div>
                </div>

                <div className="bg-white border border-gray-200/60 rounded-xl p-6 shadow-sm mt-6">
                    <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-5">User Lifecycle</h4>
                    <div className="grid md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-2 uppercase">Dormant-User Auto-Deactivation</label>
                            <input type="text" value={complianceSettings.dormantDeactivation} onChange={(e) => setComplianceSettings({...complianceSettings, dormantDeactivation: e.target.value})} className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-[#C16253]/20 focus:border-[#C16253] transition-all" />
                            <p className="text-[10px] text-gray-400 mt-1">Automatically deactivate users after this period of inactivity.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderEmpty = (title: string) => (
        <div className="py-12 text-center text-gray-500 text-sm">
            {title} settings will be displayed here.
        </div>
    );

    const renderContent = () => {
        switch (activeTab) {
            case "organisation": return renderOrganisation();
            case "authentication": return renderAuthentication();
            case "credentials": return renderCredentials();
            case "assessment": return renderAssessment();
            case "reviewer": return renderReviewer();
            case "email": return <EmailSettingsTab emailSettings={emailSettings} setEmailSettings={setEmailSettings} />;
            case "corporate": return renderCorporate();
            case "integrations": return renderEmpty("Integrations");
            case "compliance": return renderCompliance();
            default: return null;
        }
    };

    return (
        <div className="min-h-screen bg-[#fafafa] pt-8 pb-32 px-4 lg:px-8 font-sans relative">
            <div className="max-w-7xl mx-auto">
                <div className="mb-6">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span> Configuration
                    </p>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">System settings</h1>
                    <p className="text-sm text-gray-500 mt-2 max-w-3xl">
                        Platform-wide configuration. Super Admin only. Several values are locked for GDPR/PDPA compliance, MFA mandate, and academic integrity.
                    </p>
                </div>

                {renderTabs()}

                <div className="pb-12">
                    {renderContent()}
                </div>
            </div>

            {/* Sticky Footer */}
            <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-gray-200 p-4 z-50">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <span className="text-xs text-gray-500">Super Admin only. Changes are audit-logged.</span>
                    <div className="flex gap-3">
                        <button className="px-5 py-2 rounded-lg text-sm font-semibold border border-gray-200 bg-white hover:bg-gray-50 transition-colors text-gray-700">
                            Discard
                        </button>
                        <button 
                            onClick={handleSave}
                            disabled={isSaving}
                            className="px-5 py-2 rounded-lg text-sm font-semibold bg-[#FEF5B8] hover:bg-[#FBE98A] transition-colors text-gray-900 shadow-sm flex items-center gap-2 disabled:opacity-50"
                        >
                            {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                            Save changes
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SystemSettings;
