import React from "react";
import { Skeleton } from "../ui/Skeleton/Skeleton";
import { 
    Loader2, 
    Mail, 
    BellRing, 
    Clock, 
    RotateCcw, 
    Save, 
    ShieldCheck, 
    Sparkles, 
    SlidersHorizontal,
    UserCheck,
    Send
} from "lucide-react";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Field } from "../ui/Field";
import { Select } from "../ui/Select";
import { Toggle } from "../ui/Toggle";

interface EmailSettingProps {
    emailSettings: {
        notificationRetention: string;
        inactiveLearnerTrigger: string;
        notificationPriority: string;
        lessonUpdate: boolean;
    };
    setEmailSettings: React.Dispatch<React.SetStateAction<{
        notificationRetention: string;
        inactiveLearnerTrigger: string;
        notificationPriority: string;
        lessonUpdate: boolean;
    }>>;
    handleSave?: () => void;
    handleDiscard?: () => void;
    isSaving?: boolean;
    isLoading?: boolean;
}

export const EmailSetting = ({ emailSettings, setEmailSettings, handleSave, handleDiscard, isSaving, isLoading }: EmailSettingProps) => {
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
        <div className="space-y-8 animate-in fade-in duration-300">
            {/* Section Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
                <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
                        <Mail className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Email & Notifications Hub</h2>
                        <p className="text-sm text-slate-500">Configure global dispatch cadence, inactive learner nudges, and priority dispatch queues.</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        Dispatch Engine Active
                    </span>
                </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600">
                        <Clock className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Retention Window</div>
                        <div className="text-sm font-bold text-slate-900">{emailSettings.notificationRetention || "30 Days"}</div>
                    </div>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                        <UserCheck className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Inactivity Trigger</div>
                        <div className="text-sm font-bold text-slate-900">{emailSettings.inactiveLearnerTrigger || "2 weeks, 1 month"}</div>
                    </div>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600">
                        <SlidersHorizontal className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Priority Tiers</div>
                        <div className="text-sm font-bold text-slate-900">{emailSettings.notificationPriority || "High, Normal, Low"}</div>
                    </div>
                </div>
            </div>

            {/* Main Configuration Card */}
            <Card className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-7 space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-2.5">
                        <Send className="w-5 h-5 text-indigo-600" />
                        <div>
                            <h3 className="text-base font-bold text-slate-900">Delivery Rules & Retention</h3>
                            <p className="text-xs text-slate-500">Tune automated retention purging and learner engagement schedules.</p>
                        </div>
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                        Tenant-Wide
                    </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <Field label={<span className="text-xs font-semibold uppercase tracking-wider text-slate-600 inline-block mb-1.5">Notification Retention Log</span>} className="mb-0">
                            <Input 
                                type="text" 
                                value={emailSettings.notificationRetention} 
                                onChange={(e) => setEmailSettings({...emailSettings, notificationRetention: e.target.value})} 
                                placeholder="e.g. 30 days"
                                className="w-full h-11 px-3.5 rounded-xl border border-slate-300 bg-slate-50/50 text-slate-900 text-sm font-medium focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none" 
                            />
                        </Field>
                        <p className="text-xs text-slate-400 mt-1.5">Purges notification event records after the specified period.</p>
                    </div>

                    <div>
                        <Field label={<span className="text-xs font-semibold uppercase tracking-wider text-slate-600 inline-block mb-1.5">Inactive Learner Reminder Cadence</span>} className="mb-0">
                            <Select 
                                value={emailSettings.inactiveLearnerTrigger} 
                                onChange={(e) => setEmailSettings({...emailSettings, inactiveLearnerTrigger: e.target.value})} 
                                className="w-full h-11 px-3.5 rounded-xl border border-slate-300 bg-slate-50/50 text-slate-900 text-sm font-medium focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none"
                            >
                                <option>2 weeks, 1 month</option>
                                <option>1 month, 2 months</option>
                                <option>3 weeks, 6 weeks</option>
                            </Select>
                        </Field>
                        <p className="text-xs text-slate-400 mt-1.5">Dispatches personalized re-engagement nudges to enrolled users.</p>
                    </div>

                    <div className="md:col-span-2">
                        <Field label={<span className="text-xs font-semibold uppercase tracking-wider text-slate-600 inline-block mb-1.5">Notification Priority Levels</span>} className="mb-0">
                            <Input 
                                type="text" 
                                value={emailSettings.notificationPriority} 
                                onChange={(e) => setEmailSettings({...emailSettings, notificationPriority: e.target.value})} 
                                placeholder="High, Normal, Low"
                                className="w-full h-11 px-3.5 rounded-xl border border-slate-300 bg-slate-50/50 text-slate-900 text-sm font-medium focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none" 
                            />
                        </Field>
                        <p className="text-xs text-slate-400 mt-1.5">Platform-wide priority tiers applied to transactional system notifications and queues.</p>
                    </div>
                </div>

                <div className="pt-6 border-t border-slate-100 space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                        <div className="pr-4">
                            <div className="flex items-center gap-2">
                                <BellRing className="w-4 h-4 text-indigo-600" />
                                <h4 className="text-sm font-bold text-slate-900">Lesson Update Alerts</h4>
                            </div>
                            <p className="text-xs text-slate-500 mt-1">Notify in-progress learners immediately when a published lesson module is updated with revised materials.</p>
                        </div>
                        <Toggle 
                            checked={emailSettings.lessonUpdate} 
                            onCheckedChange={(checked) => setEmailSettings({...emailSettings, lessonUpdate: checked})} 
                            tone="check"
                            className="shrink-0"
                        />
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200/80 bg-slate-50/50">
                        <div className="pr-4">
                            <div className="flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-amber-500" />
                                <h4 className="text-sm font-bold text-slate-900">Weekly Executive Digest</h4>
                            </div>
                            <p className="text-xs text-slate-500 mt-1">Learner-controlled learning summary. Users configure this individually in their personal preference dashboard.</p>
                        </div>
                        <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-200 text-slate-700 shrink-0">
                            User Governed
                        </span>
                    </div>
                </div>
            </Card>

            {/* Audit & Action Footer */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2.5 text-xs text-slate-500">
                    <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span>Notification dispatch policy updates trigger instant worker cache flushes. Audit log registered.</span>
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
                        Save Notification Rules
                    </Button>
                </div>
            </div>
        </div>
    );
};
