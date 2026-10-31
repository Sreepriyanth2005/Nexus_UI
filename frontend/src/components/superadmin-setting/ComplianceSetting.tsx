import React from "react";
import { Skeleton } from "../ui/Skeleton/Skeleton";
import { Loader2, ShieldAlert, Download, Trash2, Archive, RotateCcw, Save, Lock, CheckCircle2, Clock } from "lucide-react";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Field } from "../ui/Field";
import { Select } from "../ui/Select";

interface ComplianceSettingProps {
    complianceSettings: {
        softDeleteRetention: string;
        hardDeleteTrigger: string;
        dormantDeactivation: string;
        accountDataRetention: string;
        selfDeletionGrace?: string;
        temporaryRoleExpiry?: string;
    };
    setComplianceSettings: React.Dispatch<React.SetStateAction<any>>;
    handleSave?: () => void;
    handleDiscard?: () => void;
    isSaving?: boolean;
    isLoading?: boolean;
}

export const ComplianceSetting: React.FC<ComplianceSettingProps> = ({ 
    complianceSettings, 
    setComplianceSettings, 
    handleSave, 
    handleDiscard, 
    isSaving, 
    isLoading 
}) => {
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
            {/* Regulatory Posture Card */}
            <Card className="border border-slate-200/90 bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-all">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-red-50 text-red-600 border border-red-100">
                            <ShieldAlert className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-slate-900">GDPR & PDPA Data Governance Posture</h3>
                            <p className="text-xs text-slate-500">Right to be forgotten, account soft-deletion windows, and automated cryptographic purging.</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 self-stretch sm:self-auto">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Compliant
                        </span>
                        <Button 
                            variant="ghost" 
                            className="px-3.5 py-1.5 h-8 text-xs font-semibold rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 flex items-center gap-1.5 shadow-xs"
                            onClick={() => alert("GDPR export manifest generation initiated. Download will begin shortly.")}
                        >
                            <Download className="w-3.5 h-3.5 text-slate-600" />
                            Export Data Manifest
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                    {/* Left Column */}
                    <div className="space-y-6">
                        <div>
                            <Field label={<span className="text-xs font-bold text-slate-700 uppercase tracking-wider inline-block mb-1.5">Soft-Delete Retention Window</span>} className="mb-0">
                                <Input 
                                    type="text" 
                                    value={complianceSettings.softDeleteRetention} 
                                    onChange={(e) => setComplianceSettings({...complianceSettings, softDeleteRetention: e.target.value})} 
                                    onBlur={(e) => {
                                        const v = parseInt(e.target.value.replace(/[^0-9]/g, ''));
                                        if (v) setComplianceSettings((prev: any) => ({ ...prev, softDeleteRetention: `${v} months` }));
                                    }}
                                    className="border bg-white font-medium text-sm text-slate-800 border-slate-200 rounded-xl h-11 px-3.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-full transition-all" 
                                />
                            </Field>
                            <p className="text-xs text-slate-500 mt-2 flex items-center gap-1.5">
                                <Archive className="w-3.5 h-3.5 text-slate-400" />
                                Period user accounts remain in soft-deletion queue for recovery before purge.
                            </p>
                        </div>

                        <div>
                            <Field label={<span className="text-xs font-bold text-slate-700 uppercase tracking-wider inline-block mb-1.5">Dormant Account Auto-Deactivation</span>} className="mb-0">
                                <Input 
                                    type="text" 
                                    value={complianceSettings.dormantDeactivation} 
                                    onChange={(e) => setComplianceSettings({...complianceSettings, dormantDeactivation: e.target.value})} 
                                    onBlur={(e) => {
                                        const v = parseInt(e.target.value.replace(/[^0-9]/g, ''));
                                        if (v) setComplianceSettings((prev: any) => ({ ...prev, dormantDeactivation: `${v} months` }));
                                    }}
                                    className="border bg-white font-medium text-sm text-slate-800 border-slate-200 rounded-xl h-11 px-3.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-full transition-all" 
                                />
                            </Field>
                            <p className="text-xs text-slate-500 mt-2 flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 text-slate-400" />
                                Inactive accounts without login activity are suspended to reduce attack surface.
                            </p>
                        </div>

                        <div>
                            <Field label={<span className="text-xs font-bold text-slate-700 uppercase tracking-wider inline-block mb-1.5">Self-Deletion Cooling Grace Period</span>} className="mb-0">
                                <Input 
                                    type="text" 
                                    value={complianceSettings.selfDeletionGrace || "30 days"} 
                                    onChange={(e) => setComplianceSettings({...complianceSettings, selfDeletionGrace: e.target.value})} 
                                    onBlur={(e) => {
                                        const v = parseInt(e.target.value.replace(/[^0-9]/g, ''));
                                        if (v) setComplianceSettings((prev: any) => ({ ...prev, selfDeletionGrace: `${v} days` }));
                                    }}
                                    className="border bg-white font-medium text-sm text-slate-800 border-slate-200 rounded-xl h-11 px-3.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-full transition-all" 
                                />
                            </Field>
                            <p className="text-xs text-slate-500 mt-2">Cancellation window allowing users to abort a self-requested account termination.</p>
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-6">
                        <div>
                            <Field label={<span className="text-xs font-bold text-slate-700 uppercase tracking-wider inline-block mb-1.5">Permanent Hard-Delete Trigger</span>} className="mb-0">
                                <Select 
                                    value={complianceSettings.hardDeleteTrigger} 
                                    onChange={(e) => setComplianceSettings({...complianceSettings, hardDeleteTrigger: e.target.value})} 
                                    className="border bg-white font-medium text-sm text-slate-800 border-slate-200 rounded-xl h-11 px-3.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-full transition-all"
                                >
                                    <option>6 months</option>
                                    <option>12 months</option>
                                    <option>After soft-delete window</option>
                                    <option>Immediately after soft delete</option>
                                    <option>Manual only</option>
                                </Select>
                            </Field>
                            <p className="text-xs text-slate-500 mt-2 flex items-center gap-1.5">
                                <Trash2 className="w-3.5 h-3.5 text-red-500" />
                                Irrevocably scrubs PII database records and audit tokens.
                            </p>
                        </div>

                        <div>
                            <Field label={<span className="text-xs font-bold text-slate-700 uppercase tracking-wider inline-block mb-1.5">Post-Deletion Historical Data Archive</span>} className="mb-0">
                                <Input 
                                    type="text" 
                                    value={complianceSettings.accountDataRetention} 
                                    onChange={(e) => setComplianceSettings({...complianceSettings, accountDataRetention: e.target.value})} 
                                    onBlur={(e) => {
                                        const v = parseInt(e.target.value.replace(/[^0-9]/g, ''));
                                        if (v) setComplianceSettings((prev: any) => ({ ...prev, accountDataRetention: `${v} months` }));
                                    }}
                                    className="border bg-white font-medium text-sm text-slate-800 border-slate-200 rounded-xl h-11 px-3.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-full transition-all" 
                                />
                            </Field>
                            <p className="text-xs text-slate-500 mt-2">Maximum retention window for anonymized statistical & financial completion records.</p>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Save / Discard Footer */}
            <Card className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Lock className="w-4 h-4 text-amber-600" />
                    <span>Compliance parameters are bound to regulatory data-retention schedules.</span>
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


