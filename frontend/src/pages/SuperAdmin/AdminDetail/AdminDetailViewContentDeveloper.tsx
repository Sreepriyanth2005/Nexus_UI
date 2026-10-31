import React from "react";
import { Skeleton } from "../../../components/ui/Skeleton/Skeleton";
import { FileText, Clock, Check, AlertTriangle } from "../../../assets/icons";
import { BookOpen } from "lucide-react";
import { useDashboardStats } from "../../../hooks/dashboard/Usedashboardstats";

interface AdminDetailViewContentDeveloperProps { user?: any; isLoading?: boolean; }

const AdminDetailViewContentDeveloper: React.FC<AdminDetailViewContentDeveloperProps> = ({ user, isLoading }) => {
    const name = (user?.firstName || user?.lastName) ? `${user.firstName || ""} ${user.lastName || ""}`.trim() : (user?.email?.split('@')[0] || "Unknown User");
    const ownedCourses = user?.ownedCourses || [];
    const createdCareerPaths = user?.createdCareerPaths || [];
    const authoredContent = [...ownedCourses, ...createdCareerPaths];

    const draftCount = authoredContent.filter(c => c.status === 'DRAFT').length;
    const smeReviewCount = authoredContent.filter(c => c.status === 'IN_REVIEW' || c.status === 'PENDING').length;
    const publishedCount = authoredContent.filter(c => c.status === 'PUBLISHED').length;
    const changesRequestedCount = authoredContent.filter(c => c.status === 'CHANGES_REQUESTED' || c.status === 'RETURNED').length;

    const stats: any[] = [
        { label: "IN DRAFT", value: draftCount, Icon: FileText, color: "#A48243", bg: "#f8f1e3" },
        { label: "IN SME REVIEW", value: smeReviewCount, Icon: Clock, color: "#5C7A52", bg: "#eef3e9" },
        { label: "PUBLISHED", value: publishedCount, Icon: Check, color: "#AD5F50", bg: "#fae8e3" },
        { label: "RETURNED", value: changesRequestedCount, Icon: AlertTriangle, color: "#475569", bg: "#f1f5f9", showDot: true, dotColor: "bg-rose-500" }
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
                    <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">CONTENT DEVELOPER WORKSPACE</p>
                    <h2 className="text-[22px] font-bold text-slate-900 leading-tight mb-1" style={{ fontFamily: 'var(--font-sans)' }}>Author your craft</h2>
                    <p className="text-[14px] text-slate-500">{name}. Courses in draft, awaiting SME approval, and<br/>courses with changes requested.</p>
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

export const ContentDeveloperTabContent: React.FC<{ activeTab: string, user: any }> = ({ activeTab, user }) => {
    if (activeTab !== "AUTHORED CONTENT") return null;

    const ownedCourses = user?.ownedCourses || [];
    const createdCareerPaths = user?.createdCareerPaths || [];
    
    // Combine both and sort by updatedAt desc
    const authoredContent = [...ownedCourses, ...createdCareerPaths].sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );

    const publishedCount = authoredContent.filter(item => item.status === 'PUBLISHED').length;

    return (
        <div className="bg-white border border-slate-200 rounded-[12px] shadow-sm animate-in fade-in duration-300">
            <div className="pt-[18px] px-5 pb-[14px] border-b border-slate-100 flex justify-between items-center">
                <h3 className="text-[16px] font-bold text-slate-800">Authored Content</h3>
                <span className="text-[12px] font-medium text-[#4A633F] bg-[#E5F0DE] px-3 py-1 rounded-full border border-[#D5E5CD]">{publishedCount} published</span>
            </div>
            <div className="flex flex-col divide-y divide-slate-100">
                {authoredContent.map((item: any) => (
                    <div key={item.id} className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 shrink-0 border border-slate-200">
                                <BookOpen size={20} />
                            </div>
                            <div>
                                <h4 className="text-[15px] font-bold text-slate-800 mb-1">{item.title || 'Untitled Content'}</h4>
                                <p className="text-[13px] text-slate-500">
                                    Last updated: {new Date(item.updatedAt).toLocaleDateString()} {item.totalLessons !== undefined ? `· ${item.totalLessons} lessons` : ''}
                                </p>
                            </div>
                        </div>
                        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold border ${item.status === 'PUBLISHED' ? 'bg-[#E5F0DE] text-[#4A633F] border-[#D5E5CD]' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${item.status === 'PUBLISHED' ? 'bg-[#4A633F]' : 'bg-slate-400'}`}></span> {item.status}
                        </div>
                    </div>
                ))}
                {authoredContent.length === 0 && (
                    <div className="p-6 text-center text-slate-500 text-[14px]">
                        No authored content found.
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminDetailViewContentDeveloper;
