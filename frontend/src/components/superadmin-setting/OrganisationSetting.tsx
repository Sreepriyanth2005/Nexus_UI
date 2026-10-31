import React from "react";
import { Skeleton } from "../ui/Skeleton/Skeleton";
import { Loader2, Building2, Mail, TrendingUp, Sparkles, ShieldCheck, Lock, RotateCcw, Save } from "lucide-react";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import { Toggle } from "../ui/Toggle";
import { Card } from "../ui/Card";
import { Field } from "../ui/Field";

interface OrganisationSettingProps {
    orgSettings: {
        legalName: string;
        supportEmail: string;
        language: string;
        timezone: string;
        brandColor: string;
        newReleases: boolean;
        trending: boolean;
    };
    setOrgSettings: React.Dispatch<React.SetStateAction<any>>;
    handleSave?: () => void;
    handleDiscard?: () => void;
    isSaving?: boolean;
    isLoading?: boolean;
}

export const OrganisationSetting: React.FC<OrganisationSettingProps> = ({ orgSettings, setOrgSettings, handleSave, handleDiscard, isSaving, isLoading }) => {
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
                <Skeleton className="h-[250px] w-full rounded-xl" />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-300 pb-12">
            {/* Identity & Legal Entity Card */}
            <Card className="border border-slate-200/90 bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                    <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                        <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-slate-900">Legal Tenant Identity</h3>
                        <p className="text-xs text-slate-500">Master registration name and institutional communication channels.</p>
                    </div>
                    <span className="ml-auto inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                        <Lock className="w-3 h-3 text-slate-500" /> Fixed Policy
                    </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <Field label={<span className="text-xs font-bold text-slate-700 uppercase tracking-wider inline-block mb-1.5">Legal Institution Name</span>} className="mb-0">
                            <Input 
                                value={orgSettings.legalName} 
                                readOnly 
                                className="border bg-slate-50/80 font-medium text-sm text-slate-700 border-slate-200 rounded-xl h-11 px-3.5 focus:outline-none cursor-not-allowed w-full shadow-inner" 
                            />
                        </Field>
                        <div className="mt-2 flex items-center gap-2">
                            <span className="bg-slate-200/80 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">System Verified</span>
                            <span className="text-xs text-slate-500">Locked to the root multi-tenant license contract.</span>
                        </div>
                    </div>

                    <div>
                        <Field label={<span className="text-xs font-bold text-slate-700 uppercase tracking-wider inline-block mb-1.5">System Support Contact Email</span>} className="mb-0">
                            <Input 
                                value={orgSettings.supportEmail} 
                                readOnly 
                                className="border bg-slate-50/80 font-medium text-sm text-slate-700 border-slate-200 rounded-xl h-11 px-3.5 focus:outline-none cursor-not-allowed w-full shadow-inner" 
                            />
                        </Field>
                        <div className="mt-2 flex items-center gap-2">
                            <span className="bg-slate-200/80 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">System Verified</span>
                            <span className="text-xs text-slate-500">Used for transactional notices & learner inquiry routing.</span>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Discovery & Feed Sections */}
            <Card className="border border-slate-200/90 bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                    <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
                        <TrendingUp className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-slate-900">Learner Home Experience & Feeds</h3>
                        <p className="text-xs text-slate-500">Control automated algorithmic curation displayed to all authenticated members.</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50/70 border border-slate-200/70 hover:bg-slate-50 transition-all">
                        <div className="pr-4">
                            <div className="flex items-center gap-2">
                                <h4 className="text-sm font-bold text-slate-800">Trending Courses Showcase</h4>
                                <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full">Algorithmic</span>
                            </div>
                            <p className="text-xs text-slate-500 mt-1">
                                Surfaces popular learning modules automatically calculated from platform enrolment frequency over the last 30 days.
                            </p>
                        </div>
                        <Toggle 
                            checked={orgSettings.trending} 
                            onCheckedChange={(checked) => setOrgSettings({ ...orgSettings, trending: checked })} 
                            tone="check" 
                            className="shrink-0"
                        />
                    </div>
                </div>
            </Card>

            {/* Action Bar */}
            <Card className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Modifications are signed and recorded in tenant security audit logs.</span>
                </div>
                <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                    <Button 
                        variant="ghost" 
                        onClick={handleDiscard} 
                        className="px-4 py-2 h-9 rounded-xl text-xs font-semibold border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 shadow-xs flex items-center gap-1.5"
                    >
                        <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                        Discard
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleSave}
                        disabled={isSaving}
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


