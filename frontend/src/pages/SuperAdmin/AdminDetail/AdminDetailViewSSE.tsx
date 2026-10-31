import React from "react";
import { Skeleton } from "../../../components/ui/Skeleton/Skeleton";
import { Inbox, CheckSquare, Eye, Lock } from "../../../assets/icons";
import { useSupportDashboardMetrics } from "../../../hooks/support/useSupport";

interface AdminDetailViewSSEProps { user?: any; }

const AdminDetailViewSSE: React.FC<AdminDetailViewSSEProps> = ({ user }) => {
    const name = (user?.firstName || user?.lastName) ? `${user.firstName || ""} ${user.lastName || ""}`.trim() : (user?.email?.split('@')[0] || "Unknown User");
    
    const { data: supportMetricsData, isLoading } = useSupportDashboardMetrics();
    const metrics = supportMetricsData;

    const stats: any[] = [
        { label: "OPEN TICKETS", value: isLoading ? "--" : (metrics?.openTickets || 0), Icon: Inbox, color: "#AD5F50", bg: "#fae8e3", showDot: true, dotColor: "bg-rose-500" },
        { label: "RESOLVED THIS WEEK", value: isLoading ? "--" : (metrics?.resolvedTickets || 0), Icon: CheckSquare, color: "#5C7A52", bg: "#eef3e9", showDot: true, dotColor: "bg-emerald-500" },
        { label: "IN REVIEW", value: isLoading ? "--" : (metrics?.pendingTickets || 0), Icon: Eye, color: "#A48243", bg: "#f8f1e3" },
        { label: "LOCKED TICKETS", value: isLoading ? "--" : (metrics?.slaBreached || 0), Icon: Lock, color: "#475569", bg: "#f1f5f9" }
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
                    <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">ROLE-SPECIFIC HOME &middot; SUPPORT ENGINEER</p>
                    <h2 className="text-[22px] font-bold text-slate-900 leading-tight mb-1" style={{ fontFamily: 'var(--font-sans)' }}>Support console</h2>
                    <p className="text-[14px] text-slate-500">Support Engineer &middot; {name}. Resolve open tickets, look up users, and run quick account actions. Every action is written to the audit log.</p>
                </div>
            </div>


            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                {stats.map((stat, idx) => {
                    const Icon = stat.Icon;
                    return (
                        <div key={idx} className="bg-white border border-slate-100 rounded-2xl py-5 px-[22px] shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] flex flex-col justify-between relative">
                            <div>
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-[14px]" style={{ backgroundColor: stat.bg }}>
                                    <Icon size={18} style={{ color: stat.color }} />
                                </div>
                                <p className="text-[12px] font-bold tracking-wider text-slate-500 uppercase mb-2">{stat.label}</p>
                                <div className="flex items-center gap-2">
                                    <p className="text-[24px] font-bold text-[var(--ink)] leading-none" style={{ fontFamily: 'var(--font-sans)' }}>{stat.value}</p>
                                    {stat.showDot && <div className={`w-2 h-2 rounded-full ${stat.dotColor}`}></div>}
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    );
};

import { useMyTickets } from "../../../hooks/support/useSupport";

export const SupportTabContent: React.FC<{ activeTab: string, user: any }> = ({ activeTab, user }) => {
    if (activeTab !== "ASSIGNED QUERIES") return null;

    const { data: myTicketsData } = useMyTickets({ assignedTo: user?.id });
    const tickets = myTicketsData?.data || myTicketsData || [];
    const pendingTickets = tickets.filter((t: any) => t.status !== 'RESOLVED' && t.status !== 'CLOSED').length;

    return (
        <div className="bg-white border border-slate-200 rounded-[12px] shadow-sm animate-in fade-in duration-300">
            <div className="pt-[18px] px-5 pb-[14px] border-b border-slate-100 flex justify-between items-center">
                <h3 className="text-[16px] font-bold text-slate-800">Assigned Queries</h3>
                <span className="text-[12px] font-medium text-[#8C6D33] bg-[#F5EAD4] px-3 py-1 rounded-full border border-[#E8D9BB]">{pendingTickets} pending</span>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-slate-100">
                            <th className="py-4 px-6 text-[12px] font-semibold text-slate-500 uppercase tracking-widest">TICKET ID</th>
                            <th className="py-4 px-6 text-[12px] font-semibold text-slate-500 uppercase tracking-widest">TITLE</th>
                            <th className="py-4 px-6 text-[12px] font-semibold text-slate-500 uppercase tracking-widest">CREATED AT</th>
                            <th className="py-4 px-6 text-[12px] font-semibold text-slate-500 uppercase tracking-widest">STATUS</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {tickets.map((ticket: any) => (
                            <tr key={ticket.id} className="hover:bg-slate-50 transition-colors">
                                <td className="py-5 px-6 text-[14px] text-slate-600 font-medium whitespace-nowrap">#{ticket.id?.substring(0, 8)}</td>
                                <td className="py-5 px-6 text-[14px] text-slate-800 font-semibold truncate max-w-xs">{ticket.subject || ticket.title || 'Untitled Ticket'}</td>
                                <td className="py-5 px-6 text-[14px] text-slate-500">{new Date(ticket.createdAt).toLocaleDateString()}</td>
                                <td className="py-5 px-6">
                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-[12px] font-semibold ${
                                        ['RESOLVED', 'CLOSED'].includes(ticket.status) ? 'bg-[#eef3e9] text-[#5C7A52]' :
                                        'bg-[#F5EAD4] text-[#8C6D33]'
                                    }`}>
                                        {ticket.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                        {tickets.length === 0 && (
                            <tr>
                                <td colSpan={4} className="py-8 px-6 text-center text-[14px] text-slate-500">
                                    No assigned queries found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminDetailViewSSE;
