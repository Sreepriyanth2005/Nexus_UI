import React from 'react';
import { ShieldAlert, Clock, Calendar, ArrowRight, Mail } from 'lucide-react';

interface AccountLockedProps {
    lockMaxAttempts?: number;
    lockDurationMinutes?: number;
    lockUnlockSeconds: number;
    lockExpiresAt?: string | null;
    onBackToSignIn: () => void;
}

const AccountLocked: React.FC<AccountLockedProps> = ({
    lockMaxAttempts,
    lockDurationMinutes,
    lockUnlockSeconds,
    lockExpiresAt,
    onBackToSignIn
}) => {
    /* Format lock duration from minutes to days/hours/minutes */
    const formatLockDuration = (minutes?: number) => {
        if (!minutes) return "24 hours";
        if (minutes >= 1440) {
            const days = Math.floor(minutes / 1440);
            const remainingMinutes = minutes % 1440;
            const hours = Math.floor(remainingMinutes / 60);
            const mins = remainingMinutes % 60;
            let res = `${days} day${days > 1 ? 's' : ''}`;
            if (hours > 0) res += ` ${hours} hour${hours > 1 ? 's' : ''}`;
            if (mins > 0) res += ` ${mins} minute${mins > 1 ? 's' : ''}`;
            return res;
        } else if (minutes >= 60) {
            const hours = Math.floor(minutes / 60);
            const mins = minutes % 60;
            let res = `${hours} hour${hours > 1 ? 's' : ''}`;
            if (mins > 0) res += ` ${mins} minute${mins > 1 ? 's' : ''}`;
            return res;
        }
        return `${minutes} minute${minutes > 1 ? 's' : ''}`;
    };

    /* Format unlock countdown */
    const formatUnlocksAt = (expiresAt?: string | null) => {
        if (!expiresAt) return "";
        const date = new Date(expiresAt);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');

        const offsetMinutes = -date.getTimezoneOffset();
        const offsetHrs = Math.floor(Math.abs(offsetMinutes) / 60);
        const offsetMins = Math.abs(offsetMinutes) % 60;
        const tzSign = offsetMinutes >= 0 ? "+" : "-";
        const tzStr = offsetMins > 0
            ? `${tzSign}${offsetHrs}:${String(offsetMins).padStart(2, '0')}`
            : `${tzSign}${offsetHrs}`;

        return `${day}/${month}/${year}, ${hours}:${minutes} GMT${tzStr}`;
    };

    const getUnlockInText = (secs: number) => {
        if (secs <= 0) return "0 min";
        const hrs = Math.floor(secs / 3600);
        const mins = Math.floor((secs % 3600) / 60);
        if (hrs > 0) return `${hrs} hr ${mins} min`;
        return `${mins} min`;
    };

    return (
        <div className="flex flex-col items-center text-center">
            {/* Lock Icon */}
            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/25 flex items-center justify-center mb-4 text-rose-400 shadow-lg shadow-rose-500/10">
                <ShieldAlert className="w-7 h-7" />
            </div>

            {/* Security Notice Eyebrow */}
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-[11px] font-bold uppercase tracking-wider text-rose-400 mb-2.5">
                Security Protocol Triggered
            </span>

            {/* Title */}
            <h2 className="text-2xl font-bold tracking-tight text-white mb-2">
                Account temporarily locked
            </h2>

            {/* Description */}
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-[360px] mb-5">
                You have entered an incorrect verification code {lockMaxAttempts || 3} times. For your security, this account is locked for {formatLockDuration(lockDurationMinutes)}.
            </p>

            {/* Countdown / Unlock Data Box */}
            <div className="w-full bg-slate-950/60 border border-white/10 rounded-2xl p-4 mb-5 text-left divide-y divide-white/5">
                <div className="flex items-center justify-between pb-3">
                    <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-[#f5bf38]" />
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                            Unlocks In
                        </span>
                    </div>
                    <span className="text-sm font-bold text-[#f5bf38]">
                        {lockUnlockSeconds <= 0 ? "Unlocked" : getUnlockInText(lockUnlockSeconds)}
                    </span>
                </div>
                <div className="flex items-center justify-between pt-3">
                    <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                            Estimated Time
                        </span>
                    </div>
                    <span className="text-xs text-slate-300 font-mono">
                        {formatUnlocksAt(lockExpiresAt) || "Pending cooldown"}
                    </span>
                </div>
            </div>

            {/* Actions */}
            <div className="w-full space-y-2.5">
                <button
                    type="button"
                    onClick={() => window.location.href = "mailto:support@nexus.org"}
                    className="w-full h-11 rounded-xl bg-gradient-to-r from-[#f1b020] via-[#f5bf38] to-[#e09b10] text-slate-950 font-bold text-sm shadow-lg shadow-[#f1b020]/25 hover:brightness-105 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                    <Mail className="w-4 h-4" />
                    <span>Contact Enterprise Support</span>
                </button>

                <button
                    type="button"
                    onClick={onBackToSignIn}
                    className="w-full h-11 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white font-medium text-sm transition-all flex items-center justify-center cursor-pointer"
                >
                    Back to sign in
                </button>
            </div>
        </div>
    );
};

export default AccountLocked;
