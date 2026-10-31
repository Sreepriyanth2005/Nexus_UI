import React, { useEffect } from "react";
import { Skeleton } from "../../../components/ui/Skeleton/Skeleton";
import { Users, Check, Book, Award, Clock, Building } from "../../../assets/icons";
import { useTenantDashboardStats } from "../../../hooks/tenant";

interface AdminDetailViewTenantAdminProps { user?: any; }

const AdminDetailViewTenantAdmin: React.FC<AdminDetailViewTenantAdminProps> = ({ user }) => {
    const { mutate: getTenantStats, data: tenantStats, isPending } = useTenantDashboardStats();

    useEffect(() => {
        if (user?.tenant?.id) {
            getTenantStats(user.tenant.id);
        }
    }, [user?.tenant?.id, getTenantStats]);

    const metrics = tenantStats as any;

    const stats: any[] = [
        { 
            label: "TOTAL USERS", 
            value: isPending ? "--" : (metrics?.overview?.totalUsers ?? 0), 
            subtext: isPending ? "" : `${metrics?.overview?.activeUsers ?? 0} active · ${metrics?.overview?.inactiveUsers ?? 0} inactive`,
            Icon: Users, color: "#A48243", bg: "#f8f1e3" 
        },
        { 
            label: "UTILISATION", 
            value: isPending ? "--" : `${metrics?.seats?.allocatedSeats ?? 0}/${metrics?.seats?.totalSeats ?? 0}`, 
            subtext: isPending ? "" : `${metrics?.seats?.availableSeats ?? 0} seats remaining`,
            Icon: Building, color: "#475569", bg: "#f1f5f9", showDot: true, dotColor: "bg-amber-500" 
        },
        { 
            label: "ACTIVE (30D)", 
            value: isPending ? "--" : (metrics?.overview?.activeUsers ?? 0), 
            subtext: isPending ? "" : `${metrics?.overview?.invitedUsers ?? 0} invited pending`,
            Icon: Check, color: "#5C7A52", bg: "#eef3e9" 
        },
        { 
            label: "ENROLMENTS", 
            value: isPending ? "--" : (metrics?.overview?.totalEnrollments ?? 0), 
            subtext: "", 
            Icon: Book, color: "#AD5F50", bg: "#fae8e3" 
        },
        { 
            label: "COMPLETION RATE", 
            value: isPending ? "--" : `${metrics?.overview?.completionRate ?? 0}%`, 
            subtext: "", 
            Icon: Award, color: "#A48243", bg: "#f8f1e3" 
        },
        { 
            label: "INVITED (PENDING)", 
            value: isPending ? "--" : Math.max(0, (metrics?.overview?.totalUsers ?? 0) - (metrics?.overview?.activeUsers ?? 0)), 
            subtext: "",
            Icon: Clock, color: "#5C7A52", bg: "#eef3e9" 
        }
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
                    <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">CORPORATE &middot; TENANT VIEW &middot; {(user?.tenant?.industry || user?.department || "BANKING").toUpperCase()}</p>
                    <h2 className="text-[22px] font-bold text-slate-900 leading-tight mb-1" style={{ fontFamily: 'var(--font-sans)' }}>{user?.tenant?.name || "Unknown Tenant"} &middot; Corporate</h2>
                    <p className="text-[14px] text-slate-500">Active learners and metrics &middot; Industry: <span className="font-semibold text-slate-700">{user?.tenant?.industry || user?.department || "Banking"}</span></p>
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

export const TenantAdminTabContent: React.FC<{ activeTab: string, user: any }> = ({ activeTab, user }) => {
    if (activeTab !== "MANAGED TENANTS") return null;

    const tenants = user?.tenant ? [user.tenant] : [];

    return (
        <div className="bg-white border border-slate-200 rounded-[12px] shadow-sm animate-in fade-in duration-300">
            <div className="pt-[18px] px-5 pb-[14px] border-b border-slate-100 flex justify-between items-center">
                <h3 className="text-[16px] font-bold text-slate-800">Managed Tenants</h3>
                <span className="text-[12px] font-medium text-[#4A633F] bg-[#E5F0DE] px-3 py-1 rounded-full border border-[#D5E5CD]">{tenants.length} active</span>
            </div>
            <div className="flex flex-col divide-y divide-slate-100">
                {tenants.map((tenant: any) => (
                    <div key={tenant.id} className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 shrink-0 border border-slate-200">
                                <Building width={20} height={20} />
                            </div>
                            <div>
                                <h4 className="text-[15px] font-bold text-slate-800 mb-1">{tenant.name || 'Tenant'}</h4>
                                <p className="text-[13px] text-slate-500">
                                    {tenant.seatCount || 0} seats &middot; {tenant.country || 'Unknown'}
                                </p>
                            </div>
                        </div>
                        <button className="px-4 py-2 border border-slate-300 rounded-lg text-[13px] font-bold text-slate-700 hover:bg-slate-100 transition-colors">
                            View Tenant &rarr;
                        </button>
                    </div>
                ))}
                {tenants.length === 0 && (
                    <div className="p-6 text-center text-slate-500 text-[14px]">
                        No managed tenants found.
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminDetailViewTenantAdmin;
