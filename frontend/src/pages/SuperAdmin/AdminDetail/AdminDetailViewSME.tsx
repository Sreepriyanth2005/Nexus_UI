import React from "react";
import { Skeleton } from "../../../components/ui/Skeleton/Skeleton";
import { FileText, Clock, Check, RefreshCw, Shield } from "../../../assets/icons";
import { useDashboardStatistics } from "../../../hooks/review-queue/useSmeDashboard";

interface AdminDetailViewSMEProps { user?: any; }

const AdminDetailViewSME: React.FC<AdminDetailViewSMEProps> = ({ user }) => {
    const name = (user?.firstName || user?.lastName) ? `${user.firstName || ""} ${user.lastName || ""}`.trim() : (user?.email?.split('@')[0] || "Unknown User");
    
    const { data: smeStatsArray, isLoading } = useDashboardStatistics(user?.id);
    const getStatValue = (label: string) => {
        if (isLoading) return "--";
        const found = smeStatsArray?.find((s: any) => s.label.toLowerCase() === label.toLowerCase());
        return found ? found.value : "0";
    };

    const stats: any[] = [
        { label: "AWAITING REVIEW", value: getStatValue("AWAITING REVIEW"), Icon: FileText, color: "#AD5F50", bg: "#fae8e3" },
        { label: "IN PROGRESS", value: getStatValue("IN PROGRESS"), Icon: Clock, color: "#A48243", bg: "#f8f1e3" },
        { label: "COMPLETED", value: getStatValue("COMPLETED"), Icon: Check, color: "#5C7A52", bg: "#eef3e9" },
        { label: "RETURNED", value: getStatValue("RETURNED"), Icon: RefreshCw, color: "#475569", bg: "#f1f5f9" },
        { label: "SLA TARGET", value: "3", suffix: " days", Icon: Shield, color: "#5C7A52", bg: "#eef3e9" }
    ];

    if (isLoading) {
        return (
            <div className="p-6 space-y-6 w-full min-h-screen bg-[var(--surface)]">
                <div className="space-y-2 mb-8">
                    <Skeleton className="h-8 w-1/4 rounded-[var(--r-sm)]" />
                    <Skeleton className="h-4 w-1/3 rounded-[var(--r-sm)]" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <Skeleton className="h-[100px] rounded-[var(--r-lg)]" />
                    <Skeleton className="h-[100px] rounded-[var(--r-lg)]" />
                    <Skeleton className="h-[100px] rounded-[var(--r-lg)]" />
                    <Skeleton className="h-[100px] rounded-[var(--r-lg)]" />
                </div>
                <Skeleton className="h-[400px] w-full rounded-xl" />
            </div>
        );
    }

    return (
        <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
                <div>
                    <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">SME REVIEW HOME</p>
                    <h2 className="text-[22px] font-bold text-slate-900 leading-tight mb-1" style={{ fontFamily: 'var(--font-sans)' }}>Review queue</h2>
                    <p
                      className="m-0 max-w-xl text-[var(--ink-mute)]"
                      style={{
                        fontSize: "14px",
                        fontWeight: 500,
                        lineHeight: 1.4,
                        fontFamily: "var(--font-sans)",
                      }}
                    >
                      Subject Matter Expert
                      <span className="mx-1.5 text-[var(--ink-mute)]">&middot;</span>
                      {name && name.toLowerCase() !== "temp" ? name : "Dr. Faris Al-Maamari"}. Courses in your domain expertise, awaiting your
                      review.
                    </p>
                </div>

            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {stats.map((stat, idx) => {
                    const Icon = stat.Icon;
                    return (
                        <div key={idx} className="bg-white border border-slate-100 rounded-2xl py-5 px-[22px] shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] flex flex-col justify-between">
                            <div>
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-[14px]" style={{ backgroundColor: stat.bg }}>
                                    <Icon size={18} style={{ color: stat.color }} />
                                </div>
                                <p className="text-[12px] font-bold tracking-wider text-slate-500 uppercase mb-2">{stat.label}</p>
                                <div className="flex items-baseline gap-1.5 mb-2">
                                    <p className="text-[24px] font-bold text-[var(--ink)] leading-none" style={{ fontFamily: 'var(--font-sans)' }}>{stat.value}</p>
                                    {stat.suffix && <span className="text-[13px] text-slate-500 font-medium">{stat.suffix}</span>}
                                </div>
                            </div>
                            {(stat.subtext || stat.trend) && (
                                <div className="mt-3 flex flex-col gap-1.5">
                                    {stat.subtext && <p className="text-[13px] text-slate-500">{stat.subtext}</p>}
                                    {stat.trend && <p className={`text-[13px] font-medium ${stat.trendColor || "text-slate-500"}`}>{stat.trend}</p>}
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    );
};

export const SMETabContent: React.FC<{ activeTab: string, user: any }> = ({ activeTab, user }) => {
    if (activeTab !== "REVIEW ITEMS") return null;

    const reviewsToApprove = user?.reviewsToApprove || [];
    const pendingReviews = reviewsToApprove.filter((r: any) => r.status === 'PENDING').length;

    return (
        <div className="bg-white border border-slate-200 rounded-[12px] shadow-sm animate-in fade-in duration-300">
            <div className="pt-[18px] px-5 pb-[14px] border-b border-slate-100 flex justify-between items-center">
                <h3 className="text-[16px] font-bold text-slate-800">Review Items</h3>
                <span className="text-[12px] font-medium text-[#8C6D33] bg-[#F5EAD4] px-3 py-1 rounded-full border border-[#E8D9BB]">{pendingReviews} pending review</span>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-slate-100">
                            <th className="py-4 px-6 text-[12px] font-semibold text-slate-500 uppercase tracking-widest">ITEM TYPE</th>
                            <th className="py-4 px-6 text-[12px] font-semibold text-slate-500 uppercase tracking-widest">TITLE</th>
                            <th className="py-4 px-6 text-[12px] font-semibold text-slate-500 uppercase tracking-widest">SUBMITTED AT</th>
                            <th className="py-4 px-6 text-[12px] font-semibold text-slate-500 uppercase tracking-widest">STATUS</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {reviewsToApprove.map((review: any) => (
                            <tr key={review.id} className="hover:bg-slate-50 transition-colors">
                                <td className="py-5 px-6 text-[14px] text-slate-600 font-medium whitespace-nowrap capitalize">{review.entityType?.toLowerCase() || 'Content'}</td>
                                <td className="py-5 px-6 text-[14px] text-slate-800 font-semibold truncate max-w-xs">{review.course?.title || review.entityId || 'Untitled'}</td>
                                <td className="py-5 px-6 text-[14px] text-slate-500">{new Date(review.submittedAt).toLocaleDateString()}</td>
                                <td className="py-5 px-6">
                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-[12px] font-semibold ${
                                        review.status === 'PENDING' ? 'bg-[#F5EAD4] text-[#8C6D33]' : 
                                        review.status === 'APPROVED' ? 'bg-[#eef3e9] text-[#5C7A52]' :
                                        'bg-slate-100 text-slate-600'
                                    }`}>
                                        {review.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                        {reviewsToApprove.length === 0 && (
                            <tr>
                                <td colSpan={4} className="py-8 px-6 text-center text-[14px] text-slate-500">
                                    No review items found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminDetailViewSME;
