import React, { useEffect } from "react";
import { Skeleton } from "../../../components/ui/Skeleton/Skeleton";
import { Activity } from "lucide-react";
import { Users, Bell, BarChart2, CheckSquare } from "../../../assets/icons";
import { useSuperAdminDashboard } from "../../../hooks/useReports";

interface AdminDetailViewSuperAdminProps { user?: any; }

const AdminDetailViewSuperAdmin: React.FC<AdminDetailViewSuperAdminProps> = ({ user }) => {
    const name = (user?.firstName || user?.lastName) ? `${user.firstName || ""} ${user.lastName || ""}`.trim() : (user?.email?.split('@')[0] || "Unknown User");
    
    const { data: systemStats, isLoading: isPending } = useSuperAdminDashboard();

    const metrics = systemStats as any;

    const stats: any[] = [
        { label: "TOTAL USERS", value: isPending ? "--" : (metrics?.totalUsers || 0), subtext: "Overall registered users", trend: "", trendColor: "text-emerald-600", Icon: Users, color: "#A48243", bg: "#f8f1e3" },
        { label: "ACTIVE USERS", value: isPending ? "--" : (metrics?.activeUsers || 0), subtext: "Currently active", trend: "", trendColor: "text-emerald-600", Icon: Bell, color: "#5C7A52", bg: "#eef3e9" },
        { label: "ENROLMENTS", value: isPending ? "--" : (metrics?.totalEnrollments || 0), subtext: "Total course enrolments", trend: "", trendColor: "text-emerald-600", Icon: BarChart2, color: "#AD5F50", bg: "#fae8e3" },
        { label: "COMPLETION RATE", value: isPending ? "--" : `${metrics?.totalEnrollments ? ((metrics.completedEnrollments / metrics.totalEnrollments) * 100).toFixed(1) : 0}%`, subtext: "Overall completion rate", trend: "", trendColor: "text-rose-600", Icon: CheckSquare, color: "#A48243", bg: "#f8f1e3" }
    ];

    if (isPending) {
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
                    <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">SYSTEM OVERVIEW</p>
                    <h2 className="text-[22px] font-bold text-slate-900 leading-tight mb-1" style={{ fontFamily: 'var(--font-sans)' }}>Super Admin dashboard</h2>
                    <p className="text-[14px] text-slate-500">Logged in as {name}. Review system overview and items needing attention.</p>
                </div>

            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                {stats.map((stat, idx) => {
                    const Icon = stat.Icon;
                    return (
                        <div key={idx} className="bg-white border border-slate-100 rounded-2xl py-5 px-[22px] shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] flex flex-col justify-between">
                            <div>
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-[14px]" style={{ backgroundColor: stat.bg }}>
                                    <Icon size={18} style={{ color: stat.color }} />
                                </div>
                                <p className="text-[12px] font-bold tracking-wider text-slate-500 uppercase mb-2">{stat.label}</p>
                                <p className="text-[24px] font-bold text-[var(--ink)] leading-none" style={{ fontFamily: 'var(--font-sans)' }}>{stat.value}</p>
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

export default AdminDetailViewSuperAdmin;
