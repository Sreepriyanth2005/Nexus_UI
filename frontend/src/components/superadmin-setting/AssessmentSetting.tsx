import React from "react";
import { Skeleton } from "../ui/Skeleton/Skeleton";
import { Loader2, GraduationCap, Clock, Film, ShieldCheck, CheckCircle2, RotateCcw, Save, Lock } from "lucide-react";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Field } from "../ui/Field";

interface AssessmentSettingProps {
    assessmentSettings: {
        passMark: string;
        maxAttempts: string;
        retakeCooldown: string;
        videoThreshold: string;
        noResume: boolean;
    };
    setAssessmentSettings: React.Dispatch<React.SetStateAction<any>>;
    handleSave?: () => void;
    handleDiscard?: () => void;
    isSaving?: boolean;
    isLoading?: boolean;
}

export const AssessmentSetting: React.FC<AssessmentSettingProps> = ({ assessmentSettings, setAssessmentSettings, handleSave, handleDiscard, isSaving, isLoading }) => {
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
            {/* Rules & Thresholds Card */}
            <Card className="border border-slate-200/90 bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                    <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                        <GraduationCap className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-slate-900">Pass Marks & Academic Retake Baselines</h3>
                        <p className="text-xs text-slate-500">Platform-wide grading benchmarks. Specific courses may fine-tune above these global minimums.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    {/* Default Pass Mark */}
                    <div>
                        <Field label={<span className="text-xs font-bold text-slate-700 uppercase tracking-wider inline-block mb-1.5">Default Passing Threshold</span>} className="mb-0">
                            <Input 
                                type="text" 
                                value={assessmentSettings.passMark} 
                                readOnly 
                                className="border bg-slate-50/80 font-medium text-sm text-slate-700 border-slate-200 rounded-xl h-11 px-3.5 focus:outline-none cursor-not-allowed w-full shadow-inner" 
                            />
                        </Field>
                        <div className="mt-2 flex items-center gap-2">
                            <span className="bg-slate-200/80 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">System Verified</span>
                            <span className="text-xs text-slate-500">Fixed institutional baseline (70%).</span>
                        </div>
                    </div>

                    {/* Retake Cooldown */}
                    <div>
                        <Field label={<span className="text-xs font-bold text-slate-700 uppercase tracking-wider inline-block mb-1.5">Retake Cool-down Window</span>} className="mb-0">
                            <Input 
                                type="text" 
                                value={assessmentSettings.retakeCooldown} 
                                onChange={(e) => setAssessmentSettings({...assessmentSettings, retakeCooldown: e.target.value})} 
                                onBlur={(e) => {
                                    const v = parseInt(e.target.value.replace(/[^0-9]/g, ''));
                                    if (v) setAssessmentSettings((prev: any) => ({ ...prev, retakeCooldown: `${v} hours` }));
                                }}
                                className="border bg-white font-medium text-sm text-slate-800 border-slate-200 rounded-xl h-11 px-3.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-full transition-all" 
                            />
                        </Field>
                        <p className="text-xs text-slate-500 mt-2 flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            Lockout duration between failed quiz attempts.
                        </p>
                    </div>

                    {/* Video Completion Threshold */}
                    <div>
                        <Field label={<span className="text-xs font-bold text-slate-700 uppercase tracking-wider inline-block mb-1.5">Video Completion Gate</span>} className="mb-0">
                            <Input 
                                type="text" 
                                value={assessmentSettings.videoThreshold} 
                                onChange={(e) => setAssessmentSettings({...assessmentSettings, videoThreshold: e.target.value})} 
                                onBlur={(e) => {
                                    const v = parseInt(e.target.value.replace(/[^0-9]/g, ''));
                                    if (v) setAssessmentSettings((prev: any) => ({ ...prev, videoThreshold: `${v}%` }));
                                }}
                                className="border bg-white font-medium text-sm text-slate-800 border-slate-200 rounded-xl h-11 px-3.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-full transition-all" 
                            />
                        </Field>
                        <p className="text-xs text-slate-500 mt-2 flex items-center gap-1.5">
                            <Film className="w-3.5 h-3.5 text-slate-400" />
                            Minimum playback percentage to unlock post-video quiz.
                        </p>
                    </div>
                </div>

                {/* Academic Integrity Lock */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50/70 border border-slate-200/70">
                    <div>
                        <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-slate-800">No Resume on Assessment Exit (Anti-Cheating)</h4>
                            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> ENFORCED
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                            Prematurely exiting or closing an active assessment session burns one attempt to prevent tab-switching and credential leakage.
                        </p>
                    </div>
                    <span className="text-xs font-bold text-slate-500 bg-slate-200/80 px-2.5 py-1 rounded-lg shrink-0 ml-4 flex items-center gap-1">
                        <Lock className="w-3 h-3" /> Integrity Policy
                    </span>
                </div>
            </Card>

            {/* Save / Discard Footer */}
            <Card className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Grading and threshold changes apply to newly launched exam sessions.</span>
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


