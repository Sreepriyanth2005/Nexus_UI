import React from "react";
import { Skeleton } from "../ui/Skeleton/Skeleton";
import { Loader2, Users, Clock, ShieldCheck, CheckCircle2, RotateCcw, Save, Layers } from "lucide-react";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import { Select } from "../ui/Select";
import { Toggle } from "../ui/Toggle";
import { Card } from "../ui/Card";
import { Field } from "../ui/Field";

interface ReviewerSettingProps {
    reviewerSettings: {
        domains: string[];
        maxConcurrent: string;
        slaLeadTime: string;
        autoDecline: boolean;
    };
    setReviewerSettings: React.Dispatch<React.SetStateAction<any>>;
    handleSave?: () => void;
    handleDiscard?: () => void;
    isSaving?: boolean;
    isLoading?: boolean;
}

export const ReviewerSetting: React.FC<ReviewerSettingProps> = ({ reviewerSettings, setReviewerSettings, handleSave, handleDiscard, isSaving, isLoading }) => {
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

    return (
        <div className="space-y-6 animate-in fade-in duration-300 pb-12">
            {/* Routing Defaults Card */}
            <Card className="border border-slate-200/90 bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                    <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                        <Users className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-slate-900">SME Reviewer Routing & Concurrency</h3>
                        <p className="text-xs text-slate-500">Global queue limits and automated SLA reminder lead times for subject matter expert evaluations.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                        <Field label={<span className="text-xs font-bold text-slate-700 uppercase tracking-wider inline-block mb-1.5">Max Concurrent Reviews Per SME</span>} className="mb-0">
                            <Input 
                                type="text" 
                                value={reviewerSettings.maxConcurrent} 
                                onChange={(e) => setReviewerSettings({...reviewerSettings, maxConcurrent: e.target.value})} 
                                className="border bg-white font-medium text-sm text-slate-800 border-slate-200 rounded-xl h-11 px-3.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-full transition-all" 
                            />
                        </Field>
                        <p className="text-xs text-slate-500 mt-2 flex items-center gap-1.5">
                            <Layers className="w-3.5 h-3.5 text-slate-400" />
                            A reviewer's queue stops accepting new course submissions upon reaching this limit.
                        </p>
                    </div>

                    <div>
                        <Field label={<span className="text-xs font-bold text-slate-700 uppercase tracking-wider inline-block mb-1.5">Default SLA Reminder Lead Time</span>} className="mb-0">
                            <Select 
                                value={reviewerSettings.slaLeadTime} 
                                onChange={(e) => setReviewerSettings({...reviewerSettings, slaLeadTime: e.target.value})} 
                                className="border bg-white font-medium text-sm text-slate-800 border-slate-200 rounded-xl h-11 px-3.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-full transition-all"
                            >
                                <option>24 hours before deadline</option>
                                <option>48 hours before deadline</option>
                                <option>72 hours before deadline</option>
                            </Select>
                        </Field>
                        <p className="text-xs text-slate-500 mt-2 flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            Dispatches reminder notifications to reviewer and assignment leads.
                        </p>
                    </div>
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50/70 border border-slate-200/70">
                    <div className="pr-4">
                        <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-slate-800">Auto-Decline Outside Domain Expertise</h4>
                            <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                Routing Filter
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                            Automatically re-routes courses that do not align with an SME's approved competency tags back into the general review pool.
                        </p>
                    </div>
                    <Toggle 
                        checked={reviewerSettings.autoDecline} 
                        onCheckedChange={(checked) => setReviewerSettings({...reviewerSettings, autoDecline: checked})} 
                        tone="check" 
                        className="shrink-0"
                    />
                </div>
            </Card>

            {/* Save / Discard Footer */}
            <Card className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Routing queue rules update dynamically without requiring reviewer re-login.</span>
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


