import React from 'react';
import { Ban, Mail, ArrowLeft, BellRing, Info } from 'lucide-react';

interface AccountSuspendedProps {
    onBackToHome: () => void;
}

const AccountSuspended: React.FC<AccountSuspendedProps> = ({ onBackToHome }) => {
    return (
        <div className="flex flex-col items-center text-center">
            {/* Suspended Icon */}
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center mb-4 text-amber-400 shadow-lg shadow-amber-500/10">
                <Ban className="w-7 h-7" />
            </div>

            {/* Suspended Eyebrow */}
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-[11px] font-bold uppercase tracking-wider text-amber-400 mb-2.5">
                Administrative Notice
            </span>

            {/* Title */}
            <h2 className="text-2xl font-bold tracking-tight text-white mb-2">
                Account suspended
            </h2>

            {/* Description */}
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-[360px] mb-5">
                This account has been temporarily suspended by an organization administrator.
            </p>

            {/* What this means box */}
            <div className="w-full bg-slate-950/60 border border-white/10 rounded-2xl p-4 mb-5 text-left">
                <div className="flex items-center gap-2 mb-2">
                    <Info className="w-4 h-4 text-[#f5bf38]" />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                        What this means
                    </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                    To reactivate, notify your organization administrator or contact{" "}
                    <a href="mailto:support@nexus.org" className="text-[#f5bf38] underline underline-offset-2 hover:text-[#f1b020]">
                        support@nexus.org
                    </a>. Your learning history and earned badges remain safe.
                </p>
            </div>

            {/* Actions */}
            <div className="w-full space-y-2.5">
                <button
                    type="button"
                    onClick={() => {}}
                    className="w-full h-11 rounded-xl bg-gradient-to-r from-[#f1b020] via-[#f5bf38] to-[#e09b10] text-slate-950 font-bold text-sm shadow-lg shadow-[#f1b020]/25 hover:brightness-105 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                    <BellRing className="w-4 h-4" />
                    <span>Notify Organization Administrator</span>
                </button>

                <button
                    type="button"
                    onClick={() => window.location.href = "mailto:support@nexus.org"}
                    className="w-full h-11 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white font-medium text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                    <Mail className="w-4 h-4" />
                    <span>Contact Support</span>
                </button>

                <button
                    type="button"
                    onClick={onBackToHome}
                    className="w-full h-10 text-xs font-semibold text-slate-400 hover:text-white transition-colors flex items-center justify-center gap-1.5 cursor-pointer mt-1"
                >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Return to Portal</span>
                </button>
            </div>
        </div>
    );
};

export default AccountSuspended;
