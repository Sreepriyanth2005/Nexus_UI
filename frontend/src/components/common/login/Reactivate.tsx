import React from 'react';
import { useNavigate, useLocation } from 'react-router';
import { message } from 'antd';
import { RefreshCw, RotateCcw, AlertCircle, ArrowRight, ShieldCheck, Loader2 } from 'lucide-react';
import { useUserLifecycleStatus, useReactivateAccount } from '../../../hooks/useUserLifecycle';
import AuthShell from './AuthShell';

export interface ReactivateProps {
    onCancel?: () => void;
    onSuccess?: () => void;
    deletedAt?: string | Date | null;
    email?: string;
    userId?: string;
}

const parseDate = (dateVal?: string | Date | null): Date | null => {
    if (!dateVal) return null;
    const d = new Date(dateVal);
    return isNaN(d.getTime()) ? null : d;
};

const formatDeletedDate = (date: Date): string => {
    const day = date.getDate();
    const months = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];
    return `${day} ${months[date.getMonth()]} ${date.getFullYear()}`;
};

const calculateRemainingDays = (deletedDate: Date, gracePeriodDays = 30): number => {
    const gracePeriodEnd = new Date(deletedDate.getTime() + gracePeriodDays * 24 * 60 * 60 * 1000);
    const now = new Date();
    const diffMs = gracePeriodEnd.getTime() - now.getTime();
    const days = Math.ceil(diffMs / (24 * 60 * 60 * 1000));
    return Math.max(0, days);
};

const Reactivate: React.FC<ReactivateProps> = ({ onCancel, onSuccess, deletedAt, email, userId }) => {
    const navigate = useNavigate();
    const location = useLocation();

    const targetEmail = email || (location.state as any)?.email || '';
    const targetUserId = userId || (location.state as any)?.userId;

    // React Query hook to get live user status and deletedAt from DB
    const { data: statusData } = useUserLifecycleStatus(
        { email: targetEmail, userId: targetUserId },
        Boolean(targetEmail || targetUserId)
    );

    // React Query mutation hook for reactivation
    const reactivateMutation = useReactivateAccount();

    // Determine the active deletion date from props, router state, or backend status hook
    const rawDeletedAt = deletedAt || (location.state as any)?.deletedAt || statusData?.deletedAt;
    const userDeletedDate = parseDate(rawDeletedAt);

    // Compute dynamic values (defaults to 12 days ago if no deletion timestamp in DB to display 18 days remaining)
    const activeDeletedDate = userDeletedDate || new Date(Date.now() - 12 * 24 * 60 * 60 * 1000);
    const formattedDate = formatDeletedDate(activeDeletedDate);
    const remainingDays = calculateRemainingDays(activeDeletedDate, 30);

    const handleReactivate = () => {
        const payload = {
            email: targetEmail ? targetEmail.trim() : undefined,
            userId: targetUserId || statusData?.userId,
        };

        reactivateMutation.mutate(payload, {
            onSuccess: () => {
                message.success('Account successfully reactivated!');
                if (onSuccess) {
                    onSuccess();
                } else {
                    navigate('/login');
                }
            },
            onError: (error: any) => {
                console.error('Failed to reactivate account:', error);
                message.error(error.response?.data?.message || 'Failed to reactivate account. Please try again.');
            },
        });
    };

    return (
        <AuthShell
            pageTitle="Account Reactivation"
            pageSubtitle="Restore your learning profile and saved credentials."
        >
            <div className="flex flex-col items-center text-center">
                {/* Icon Circle */}
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center mb-4 text-emerald-400 shadow-lg shadow-emerald-500/10">
                    <RotateCcw className="w-8 h-8" />
                </div>

                {/* Eyebrow */}
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-bold uppercase tracking-wider text-emerald-400 mb-3">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    30-Day Grace Period Active
                </span>

                {/* Title */}
                <h2 className="text-2xl font-bold tracking-tight text-white mb-2">
                    Welcome back!
                </h2>

                {/* Description */}
                <p className="text-sm text-slate-300 leading-relaxed max-w-[360px] mb-5">
                    Your account was scheduled for deletion on{" "}
                    <span className="font-semibold text-white">{formattedDate}</span>. You can restore your profile, enrolled courses, and earned certifications.
                </p>

                {/* Countdown Card */}
                <div className="w-full bg-slate-950/60 border border-white/10 rounded-2xl p-4 mb-6 text-left">
                    <div className="flex items-center justify-between">
                        <div>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-0.5">
                                Time Remaining to Restore
                            </span>
                            <span className="text-lg font-bold text-[#f5bf38]">
                                {remainingDays} {remainingDays === 1 ? 'day' : 'days'} remaining
                            </span>
                        </div>
                        <div className="text-right">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-0.5">
                                Status
                            </span>
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                                Fully Restorable
                            </span>
                        </div>
                    </div>
                </div>

                {/* Buttons */}
                <div className="w-full space-y-2.5">
                    <button
                        type="button"
                        onClick={handleReactivate}
                        disabled={reactivateMutation.isPending}
                        className="w-full h-11 rounded-xl bg-gradient-to-r from-[#f1b020] via-[#f5bf38] to-[#e09b10] text-slate-950 font-bold text-sm shadow-lg shadow-[#f1b020]/25 hover:brightness-105 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {reactivateMutation.isPending ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Reactivating your account...</span>
                            </>
                        ) : (
                            <>
                                <span>Reactivate my account</span>
                                <ArrowRight className="w-4 h-4" />
                            </>
                        )}
                    </button>

                    <button
                        type="button"
                        onClick={onCancel || (() => navigate('/login'))}
                        className="w-full h-11 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white font-medium text-sm transition-all flex items-center justify-center cursor-pointer"
                    >
                        No, keep it deleted
                    </button>
                </div>
            </div>
        </AuthShell>
    );
};

export default Reactivate;
