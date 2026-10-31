import React, { useState, useEffect } from "react";
import { Skeleton } from "../ui/Skeleton/Skeleton";
import { 
    Loader2, 
    Sliders, 
    Globe, 
    Mail, 
    Clock, 
    TrendingUp, 
    PlaySquare, 
    RotateCcw, 
    Save, 
    ShieldCheck, 
    Lock,
    Sparkles,
    CheckCircle2,
    Calendar
} from "lucide-react";
import { toast } from "sonner";
import { api } from "../../config/axios";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import { Toggle } from "../ui/Toggle";
import { Card } from "../ui/Card";
import { Field } from "../ui/Field";

interface GeneralProps {
    handleSave?: () => void;
    handleDiscard?: () => void;
    isSaving?: boolean;
    isLoading?: boolean;
}

const defaultGeneral = {
    platformName: "Nexus Academy",
    defaultLanguage: "English (EN)",
    defaultTimezone: "Asia/Muscat (UTC+4)",
    supportEmail: "support@nexus.org",
    minEnrolmentAge: "16",
};

const defaultToggles = {
    newReleasesSection: true,
    trendingSection: true,
    videoPlayerFastForward: false,
};

export const General: React.FC<GeneralProps> = ({
    handleSave: propHandleSave,
    handleDiscard: propHandleDiscard,
    isSaving: propIsSaving,
    isLoading
}) => {
    const [localIsSaving, setLocalIsSaving] = useState(false);
    const [tenantConfigId, setTenantConfigId] = useState<number | null>(null);
    const [videoConfigId, setVideoConfigId] = useState<string | null>(null);
    const [tenantId, setTenantId] = useState<string | null>(null);

    const [generalSettings, setGeneralSettings] = useState({ ...defaultGeneral });
    const [snapGeneralSettings, setSnapGeneralSettings] = useState({ ...defaultGeneral });

    const [featureToggles, setFeatureToggles] = useState({ ...defaultToggles });
    const [snapFeatureToggles, setSnapFeatureToggles] = useState({ ...defaultToggles });

    const isSaving = propIsSaving ?? localIsSaving;

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const [res, videoRes] = await Promise.all([
                    api.get("/tenant-configurations"),
                    api.get("/video-player-configurations").catch(() => null)
                ]);

                let newToggles = { ...defaultToggles };

                if (res.data?.data && res.data.data.length > 0) {
                    const config = res.data.data[0];
                    setTenantConfigId(config.id);
                    setTenantId(config.tenantId);

                    const gen = {
                        platformName: config.legalName || defaultGeneral.platformName,
                        supportEmail: config.supportEmail || defaultGeneral.supportEmail,
                        defaultLanguage: config.defaultLanguage || defaultGeneral.defaultLanguage,
                        defaultTimezone: config.timezone || defaultGeneral.defaultTimezone,
                        minEnrolmentAge: config.minEnrolmentAge?.toString() || defaultGeneral.minEnrolmentAge,
                    };
                    setGeneralSettings(gen);
                    setSnapGeneralSettings(gen);

                    newToggles.newReleasesSection = config.showNewReleases ?? true;
                    newToggles.trendingSection = config.showTrending ?? true;
                }

                if (videoRes?.data?.data && videoRes.data.data.length > 0) {
                    const videoConfig = videoRes.data.data[0];
                    setVideoConfigId(videoConfig.id);
                    newToggles.videoPlayerFastForward = videoConfig.videoPlayerFastForward ?? false;
                }

                setFeatureToggles(newToggles);
                setSnapFeatureToggles(newToggles);

            } catch (err) {
                console.error("Error fetching config:", err);
                toast.error("Failed to load general settings.");
            }
        };

        fetchConfig();
    }, []);

    const handleDiscard = () => {
        if (propHandleDiscard) {
            propHandleDiscard();
            return;
        }
        setGeneralSettings({ ...snapGeneralSettings });
        setFeatureToggles({ ...snapFeatureToggles });
        toast.info("Changes discarded.");
    };

    const handleSave = async () => {
        if (propHandleSave) {
            propHandleSave();
            return;
        }

        setLocalIsSaving(true);
        try {
            const promises = [];
            
            if (tenantConfigId) {
                const payload = {
                    platformName: generalSettings.platformName,
                    supportEmail: generalSettings.supportEmail,
                    defaultLanguage: generalSettings.defaultLanguage,
                    timezone: generalSettings.defaultTimezone,
                    minEnrolmentAge: generalSettings.minEnrolmentAge ? parseInt(generalSettings.minEnrolmentAge) : undefined,
                    showTrending: featureToggles.trendingSection,
                    showNewReleases: featureToggles.newReleasesSection,
                };
                promises.push(api.put(`/tenant-configurations/${tenantConfigId}`, payload));
            }

            if (videoConfigId) {
                promises.push(api.put(`/video-player-configurations/${videoConfigId}`, {
                    videoPlayerFastForward: featureToggles.videoPlayerFastForward,
                    videoPlayerCaption: false,
                    videoPlayerFullscreen: false,
                    videoPlayerStreaming: false,
                    videoPlayerVolumeCtrl: false,
                    videoPlayerCustomizeCaption: false
                }));
            } else if (tenantId) {
                promises.push(api.post(`/video-player-configurations`, {
                    tenantId: tenantId,
                    videoPlayerFastForward: featureToggles.videoPlayerFastForward,
                    videoPlayerCaption: false,
                    videoPlayerFullscreen: false,
                    videoPlayerStreaming: false,
                    videoPlayerVolumeCtrl: false,
                    videoPlayerCustomizeCaption: false
                }).then(res => {
                    if (res.data?.data?.id) {
                        setVideoConfigId(res.data.data.id);
                    }
                }));
            }

            await Promise.all(promises);
            
            setSnapGeneralSettings({ ...generalSettings });
            setSnapFeatureToggles({ ...featureToggles });
            toast.success("General settings saved successfully!");
        } catch (error) {
            toast.error("Failed to save general settings.");
            console.error(error);
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
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
                        <Sliders className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Institutional & Core Defaults</h2>
                        <p className="text-sm text-slate-500">Core organizational metadata, language standards, and home-page feature flags.</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        Live Cluster Node
                    </span>
                </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                        <Globe className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Default Locale</div>
                        <div className="text-sm font-bold text-slate-900 truncate max-w-[120px]">{generalSettings.defaultLanguage}</div>
                    </div>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600">
                        <Clock className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">System Timezone</div>
                        <div className="text-sm font-bold text-slate-900 truncate max-w-[120px]">{generalSettings.defaultTimezone}</div>
                    </div>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600">
                        <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Min Enrolment Age</div>
                        <div className="text-sm font-bold text-slate-900">{generalSettings.minEnrolmentAge}+ Years</div>
                    </div>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600">
                        <TrendingUp className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Trending Feed</div>
                        <div className="text-sm font-bold text-slate-900">{featureToggles.trendingSection ? "Enabled" : "Disabled"}</div>
                    </div>
                </div>
            </div>

            {/* Institutional Details */}
            <Card className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-7 space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-2.5">
                        <Globe className="w-5 h-5 text-blue-600" />
                        <div>
                            <h3 className="text-base font-bold text-slate-900">Institutional Identity & Localization</h3>
                            <p className="text-xs text-slate-500">System-enforced platform parameters governed by tenant license agreement.</p>
                        </div>
                    </div>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                        <Lock className="w-3.5 h-3.5 text-slate-500" />
                        System Locked
                    </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <Field label={<span className="text-xs font-semibold uppercase tracking-wider text-slate-600 inline-block mb-1.5">Platform Brand Name</span>} className="mb-0">
                            <Input 
                                value={generalSettings.platformName} 
                                readOnly 
                                className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-slate-100/70 text-slate-600 text-sm font-medium cursor-not-allowed outline-none" 
                            />
                        </Field>
                        <div className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-400">
                            <Lock className="w-3 h-3 text-slate-400" />
                            <span>Enforced by institutional root license.</span>
                        </div>
                    </div>

                    <div>
                        <Field label={<span className="text-xs font-semibold uppercase tracking-wider text-slate-600 inline-block mb-1.5">System Default Language</span>} className="mb-0">
                            <Input 
                                value={generalSettings.defaultLanguage} 
                                readOnly 
                                className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-slate-100/70 text-slate-600 text-sm font-medium cursor-not-allowed outline-none" 
                            />
                        </Field>
                        <div className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-400">
                            <Lock className="w-3 h-3 text-slate-400" />
                            <span>Standard institutional primary locale.</span>
                        </div>
                    </div>

                    <div>
                        <Field label={<span className="text-xs font-semibold uppercase tracking-wider text-slate-600 inline-block mb-1.5">Default Cluster Timezone</span>} className="mb-0">
                            <Input 
                                value={generalSettings.defaultTimezone} 
                                readOnly 
                                className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-slate-100/70 text-slate-600 text-sm font-medium cursor-not-allowed outline-none" 
                            />
                        </Field>
                        <div className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-400">
                            <Lock className="w-3 h-3 text-slate-400" />
                            <span>Aligned with server cluster node region.</span>
                        </div>
                    </div>

                    <div>
                        <Field label={<span className="text-xs font-semibold uppercase tracking-wider text-slate-600 inline-block mb-1.5">Public Support Email</span>} className="mb-0">
                            <Input 
                                value={generalSettings.supportEmail} 
                                readOnly 
                                className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-slate-100/70 text-slate-600 text-sm font-medium cursor-not-allowed outline-none" 
                            />
                        </Field>
                        <div className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-400">
                            <Lock className="w-3 h-3 text-slate-400" />
                            <span>Displayed across public learner contact forms.</span>
                        </div>
                    </div>

                    <div>
                        <Field label={<span className="text-xs font-semibold uppercase tracking-wider text-slate-600 inline-block mb-1.5">Minimum Enrolment Age</span>} className="mb-0">
                            <Input 
                                value={generalSettings.minEnrolmentAge} 
                                readOnly 
                                className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-slate-100/70 text-slate-600 text-sm font-medium cursor-not-allowed outline-none" 
                            />
                        </Field>
                        <div className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-400">
                            <Lock className="w-3 h-3 text-slate-400" />
                            <span>Legal minor eligibility gate.</span>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Feature Flags & Player Controls */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Feature Toggles Card */}
                <Card className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 space-y-5">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-amber-500" />
                            <h3 className="text-base font-bold text-slate-900">Learner Discovery Feeds</h3>
                        </div>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                            Discovery UI
                        </span>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                            <div className="pr-4">
                                <h4 className="text-sm font-bold text-slate-900">Trending Courses Showcase</h4>
                                <p className="text-xs text-slate-500 mt-1">Dynamically highlight trending courses on the learner home feed based on recent 30-day enrolment volume.</p>
                            </div>
                            <Toggle 
                                checked={featureToggles.trendingSection} 
                                onCheckedChange={(checked) => setFeatureToggles({...featureToggles, trendingSection: checked})} 
                                tone="check" 
                                className="shrink-0"
                            />
                        </div>

                        <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                            <div className="pr-4">
                                <h4 className="text-sm font-bold text-slate-900">New Releases Feed</h4>
                                <p className="text-xs text-slate-500 mt-1">Feature newly published learning paths prominently for all registered learners.</p>
                            </div>
                            <Toggle 
                                checked={featureToggles.newReleasesSection} 
                                onCheckedChange={(checked) => setFeatureToggles({...featureToggles, newReleasesSection: checked})} 
                                tone="check" 
                                className="shrink-0"
                            />
                        </div>
                    </div>
                </Card>

                {/* Video Configuration Card */}
                <Card className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 space-y-5">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-2">
                            <PlaySquare className="w-5 h-5 text-indigo-600" />
                            <h3 className="text-base font-bold text-slate-900">Video Player Experience</h3>
                        </div>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                            Streaming Engine
                        </span>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                            <div className="pr-4">
                                <h4 className="text-sm font-bold text-slate-900">Allow Video Fast-Forward</h4>
                                <p className="text-xs text-slate-500 mt-1">When disabled, learners are restricted from skipping ahead of unwatched video timeline segments.</p>
                            </div>
                            <Toggle 
                                checked={featureToggles.videoPlayerFastForward} 
                                onCheckedChange={(checked) => setFeatureToggles({...featureToggles, videoPlayerFastForward: checked})} 
                                tone="check" 
                                className="shrink-0"
                            />
                        </div>

                        <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/50 flex items-start gap-3">
                            <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                            <div className="text-xs text-blue-900 leading-relaxed">
                                Advanced video player parameters including captions, fullscreen, and adaptive bitrate streaming are configurable via the top-bar <span className="font-bold">"Video Player Engine"</span> modal.
                            </div>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Audit & Action Footer */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2.5 text-xs text-slate-500">
                    <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Global configuration updates propagate across all edge instances instantly. Super Admin audit logged.</span>
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
                        Save General Configuration
                    </Button>
                </div>
            </div>
        </div>
    );
};
