import React from "react";
import { Skeleton } from "../ui/Skeleton/Skeleton";
import { Loader2, Award, CheckCircle2, Lock, ShieldCheck, Save, RotateCcw, Calendar, FileCheck } from "lucide-react";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Field } from "../ui/Field";

interface CredentialsSettingProps {
    credSettings: {
        validity: string;
        verifyBase: string;
        autoIssue: boolean;
    };
    setCredSettings: React.Dispatch<React.SetStateAction<any>>;
    handleSave?: () => void;
    handleDiscard?: () => void;
    isSaving?: boolean;
    isLoading?: boolean;
}

export const CredentialsSetting: React.FC<CredentialsSettingProps> = ({ credSettings, setCredSettings, handleSave, handleDiscard, isSaving, isLoading }) => {
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
            {/* Eligibility Rule Card */}
            <Card className="border border-slate-200/90 bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                    <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                        <FileCheck className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-slate-900">Credential Eligibility Formula</h3>
                        <p className="text-xs text-slate-500">Core academic standards required for the automated issuance engine to generate certificates.</p>
                    </div>
                    <span className="ml-auto inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                        <Lock className="w-3 h-3 text-slate-500" /> Core Contract
                    </span>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 mb-3 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    <span className="bg-white border border-slate-200 text-slate-700 text-xs font-bold px-2 py-1 rounded-md shrink-0 shadow-xs uppercase tracking-wider">
                        CRITERIA
                    </span>
                    <span className="text-xs sm:text-sm font-medium text-slate-800 leading-relaxed">
                        100% of module lessons completed <span className="text-blue-600 font-bold">+</span> Final quiz score &ge; 70% <span className="text-blue-600 font-bold">+</span> Verified learner profile complete
                    </span>
                </div>
                <p className="text-xs text-slate-500">Eligibility logic is enforced at the platform microservice layer for ISO 17024 compliance.</p>
            </Card>

            {/* Validity and Issuance Card */}
            <Card className="border border-slate-200/90 bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                    <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
                        <Award className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-slate-900">Issuance Lifecycles & Verification Base</h3>
                        <p className="text-xs text-slate-500">Expiration windows, digital seals, and automatic certificate provisioning.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                        <Field label={<span className="text-xs font-bold text-slate-700 uppercase tracking-wider inline-block mb-1.5">Default Credential Validity Period</span>} className="mb-0">
                            <Input 
                                value={credSettings.validity} 
                                onChange={(e) => setCredSettings({ ...credSettings, validity: e.target.value })} 
                                placeholder="e.g. 3 years"
                                className="border bg-white font-medium text-sm text-slate-800 border-slate-200 rounded-xl h-11 px-3.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-full transition-all" 
                            />
                        </Field>
                        <p className="text-xs text-slate-500 mt-2 flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            Default duration before expiration requiring re-certification.
                        </p>
                    </div>

                    <div>
                        <Field label={<span className="text-xs font-bold text-slate-700 uppercase tracking-wider inline-block mb-1.5">Verification Base URL</span>} className="mb-0">
                            <Input 
                                value={credSettings.verifyBase} 
                                onChange={(e) => setCredSettings({ ...credSettings, verifyBase: e.target.value })} 
                                placeholder="nexusacademy.org/verify/"
                                className="border bg-white font-medium text-sm text-slate-800 border-slate-200 rounded-xl h-11 px-3.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-full transition-all" 
                            />
                        </Field>
                        <p className="text-xs text-slate-500 mt-2">QR codes and verification links resolve to: <code className="font-mono text-slate-700 bg-slate-100 px-1 py-0.5 rounded">{credSettings.verifyBase}[cert-id]</code></p>
                    </div>
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50/70 border border-slate-200/70">
                    <div>
                        <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-slate-800">Automated Instant Issuance</h4>
                            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> ACTIVE
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                            Generates digitally signed PDF credential and fires delivery email immediately upon eligibility confirmation.
                        </p>
                    </div>
                    <span className="text-xs font-bold text-slate-500 bg-slate-200/80 px-2.5 py-1 rounded-lg shrink-0 ml-4">
                        System Locked
                    </span>
                </div>
            </Card>

            {/* Save / Discard Footer */}
            <Card className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Credential template engines re-sync immediately upon updating validity.</span>
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


