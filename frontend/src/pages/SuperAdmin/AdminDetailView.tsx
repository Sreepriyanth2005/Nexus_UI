import React, { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { ArrowLeft, Book, Check, Award, User, FileText } from "../../assets/icons";
import { toast } from "sonner";
import { useAuthStore } from "../../core/auth/auth.store";
import {
    useUser,
    useAdminChangeStatus,
    useAdminHardPurge,
    useDeleteUser,
    useReactivateUser
} from "../../hooks/internal-user/useInternalUser";
import { useQueryClient } from "@tanstack/react-query";
import AdminDetailViewSuperAdmin from "./AdminDetail/AdminDetailViewSuperAdmin";
import { Skeleton } from "../../components/ui/Skeleton/Skeleton";
import AdminDetailViewTenantAdmin, { TenantAdminTabContent } from "./AdminDetail/AdminDetailViewTenantAdmin";
import AdminDetailViewContentDeveloper, { ContentDeveloperTabContent } from "./AdminDetail/AdminDetailViewContentDeveloper";
import AdminDetailViewSME, { SMETabContent } from "./AdminDetail/AdminDetailViewSME";
import AdminDetailViewSSE, { SupportTabContent } from "./AdminDetail/AdminDetailViewSSE";

const AdminDetailView: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const { data: user, isLoading } = useUser(id || "");
    const queryClient = useQueryClient();
    const { role } = useAuthStore();
    const isAdmin = role === "SUPER_ADMIN" || role === "TENANT_ADMIN" || role === "ADMIN";
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    const changeStatusMutation = useAdminChangeStatus();
    const hardPurgeMutation = useAdminHardPurge();
    const softDeleteMutation = useDeleteUser();
    const reactivateMutation = useReactivateUser();

    // Role Evaluation
    const hasRole = (roleCode: string) => {
        return user?.roles?.some((r: any) => {
            const code = typeof r === 'string' ? r : (r?.role?.code || r?.code || r?.name || "");
            return code.toUpperCase() === roleCode;
        });
    };

    const isTenantAdmin = hasRole("TENANT_ADMIN") || hasRole("CORPORATE_ADMIN");
    const isContentDev = hasRole("CONTENT_DEVELOPER");
    const isSME = hasRole("SME") || hasRole("SUBJECT_MATTER_EXPERT");
    const isSupport = hasRole("SYSTEM_SUPPORT") || hasRole("SYSTEM_SUPPORT_ENGINEER") || hasRole("SUPPORT");
    const isSuperAdmin = hasRole("SUPER_ADMIN");

    const availableAdminRoles = React.useMemo(() => {
        const roles = [];
        if (isSuperAdmin) roles.push({ id: "SUPER_ADMIN", label: "Super Admin" });
        if (isTenantAdmin) roles.push({ id: "TENANT_ADMIN", label: "Corporate Admin" });
        if (isContentDev) roles.push({ id: "CONTENT_DEVELOPER", label: "Content Developer" });
        if (isSME) roles.push({ id: "SME", label: "Subject Matter Expert" });
        if (isSupport) roles.push({ id: "SUPPORT", label: "Support Engineer" });
        return roles;
    }, [isSuperAdmin, isTenantAdmin, isContentDev, isSME, isSupport]);

    const [selectedRoleView, setSelectedRoleView] = React.useState("");
    const activeRoleView = availableAdminRoles.find(r => r.id === selectedRoleView) 
        ? selectedRoleView 
        : (availableAdminRoles[0]?.id || "DEFAULT");

    // Dynamic Tabs
    const tabs = ["OVERVIEW", "ACTIVITY"];
    if (activeRoleView === "TENANT_ADMIN") tabs.push("MANAGED TENANTS");
    if (activeRoleView === "CONTENT_DEVELOPER") tabs.push("AUTHORED CONTENT");
    if (activeRoleView === "SME") tabs.push("REVIEW ITEMS");
    if (activeRoleView === "SUPPORT") tabs.push("ASSIGNED QUERIES");
    tabs.push("ROLES");

    const [activeTab, setActiveTab] = React.useState(tabs[0]);

    React.useEffect(() => {
        if (!tabs.includes(activeTab)) {
            setActiveTab("OVERVIEW");
        }
    }, [activeRoleView, activeTab, tabs]);

    const handleLifecycleAction = async (action: 'SUSPENDED' | 'INACTIVE' | 'ACTIVE' | 'SOFT_DELETE' | 'PURGE') => {
        if (!user?.id) return;
        const confirmMsg = action === 'PURGE'
            ? "WARNING: Are you sure you want to completely delete this user? This cannot be undone."
            : action === 'SOFT_DELETE'
                ? "Are you sure you want to soft delete this user? They will be scheduled for purge."
                : `Are you sure you want to change the user status to ${action}?`;

        if (!window.confirm(confirmMsg)) return;

        try {
            setIsSubmitting(true);
            if (action === 'PURGE') {
                await hardPurgeMutation.mutateAsync(user.id);
                navigate("/admin-user-management");
            } else if (action === 'SOFT_DELETE') {
                await softDeleteMutation.mutateAsync(user.id);
                queryClient.invalidateQueries({ queryKey: ["internal-users"] });
                navigate("/admin-user-management");
            } else if (action === 'ACTIVE') {
                await reactivateMutation.mutateAsync(user.id);
                queryClient.invalidateQueries({ queryKey: ["internal-users"] });
            } else {
                await changeStatusMutation.mutateAsync({ userId: user.id, status: action, reason: "Admin action via UI" });
                queryClient.invalidateQueries({ queryKey: ["internal-users"] });
            }
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Operation failed.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading || !user) {
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

    const rawName = `${user.firstName || ""} ${user.lastName || ""}`;
    const name = rawName.trim() || user.email?.split('@')[0] || "Unknown Admin";

    let initials = (user.firstName?.[0] || "") + (user.lastName?.[0] || "");
    initials = initials ? initials.toUpperCase() : (user.email?.[0] || "A").toUpperCase();

    const status = (user.status || "ACTIVE").toUpperCase();

    const rolesList = (() => {
        if (user.roles && Array.isArray(user.roles) && user.roles.length > 0) {
            return user.roles.map((r: any) => {
                const roleName = typeof r === 'string' ? r : (r?.role?.name || r?.role?.code || r?.name || r);
                return {
                    role: roleName,
                    scope: "Platform-wide",
                    granted: user.createdAt ? new Date(user.createdAt).toISOString().split('T')[0] : "N/A",
                    status: "Active"
                };
            });
        }
        return [
            { role: "Administrator", scope: "Platform-wide", granted: user.createdAt ? new Date(user.createdAt).toISOString().split('T')[0] : "N/A", status: "Active" }
        ];
    })();

    return (
        <div className="font-sans">
            <div>
                {/* Header */}
                <div className="mb-7 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div>
                        <button
                            onClick={() => navigate("/admin-user-management")}
                            className="text-[12px] font-semibold text-[var(--ink-mute)] hover:text-[var(--ink-soft)] uppercase tracking-widest flex items-center gap-1.5 mb-4 transition-colors font-[family-name:var(--font-serif)]"
                        >
                            <span className="text-sm leading-none">←</span> BACK TO ADMINS
                        </button>
                        <p className="text-[12px] font-bold text-[var(--ink-faint)] uppercase tracking-widest mb-1.5 font-[family-name:var(--font-serif)]">ADMIN MANAGEMENT DRILL-IN</p>
                        <div className="flex flex-wrap items-center gap-4">
                            <h1 className="text-2xl font-bold text-[var(--ink)] tracking-tight font-[family-name:var(--font-sans)]">
                                {name}
                            </h1>
                            {status === "DELETED" && (
                                <span className="text-[13px] font-semibold text-[var(--c-danger)]">Blocked - deleted admin</span>
                            )}
                            {status === "SUSPENDED" && (
                                <span className="text-[13px] font-semibold text-[var(--c-danger)]">Blocked - suspended admin</span>
                            )}
                        </div>
                    </div>
                    
                    {/* Role Switcher */}
                    {availableAdminRoles.length > 1 && (
                        <div className="lg:mt-[34px]">
                            <div className="relative inline-block w-[240px]">
                                <select 
                                    className="appearance-none bg-white border border-slate-300 rounded-full px-5 py-2.5 text-[15px] font-medium text-[#14305c] outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 cursor-pointer w-full"
                                    value={activeRoleView}
                                    onChange={(e) => setSelectedRoleView(e.target.value)}
                                >
                                    {availableAdminRoles.map(r => (
                                        <option key={r.id} value={r.id}>{r.label}</option>
                                    ))}
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4">
                                    <svg className="h-4 w-4 text-[#14305c]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Dynamic Cards */}

                {activeRoleView === "SUPER_ADMIN" ? (
                    <AdminDetailViewSuperAdmin user={user} />
                ) : activeRoleView === "TENANT_ADMIN" ? (
                    <AdminDetailViewTenantAdmin user={user} />
                ) : activeRoleView === "CONTENT_DEVELOPER" ? (
                    <AdminDetailViewContentDeveloper user={user} isLoading={isLoading} />
                ) : activeRoleView === "SME" ? (
                    <AdminDetailViewSME user={user} />
                ) : activeRoleView === "SUPPORT" ? (
                    <AdminDetailViewSSE user={user} />
                ) : null}

                {/* Profile & Lifecycle */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
                    <div className="border border-[var(--line)] rounded-2xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] flex flex-col">
                        <div className="pt-[18px] px-5 pb-[14px] border-b border-[var(--line)]/60">
                            <h3 className="text-[16px] font-bold text-[var(--ink)] font-[family-name:var(--font-sans)]">Profile</h3>
                        </div>
                        <div className="p-5 flex flex-col sm:flex-row gap-5 items-center sm:items-start flex-1 text-center sm:text-left">
                            <div className="w-[54.4px] h-[54.4px] shrink-0 rounded-full bg-[var(--line)] flex items-center justify-center overflow-hidden text-xl font-semibold text-[var(--ink-soft)] ring-2 ring-white shadow-sm">
                                {(user.profile as any)?.profileImageUrl || (user as any).profileImageUrl ? (
                                    <img src={(user.profile as any)?.profileImageUrl || (user as any).profileImageUrl} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    initials
                                )}
                            </div>
                            <div className="pt-1">
                                <h4 className="text-[16px] font-bold text-[var(--ink)] leading-tight font-[family-name:var(--font-sans)]">{name}</h4>
                                <p className="text-[16px] text-[var(--ink-mute)] mt-[3px] font-[family-name:var(--font-sans)]">{user.email}</p>
                                <div className="flex flex-wrap gap-2.5 mt-3 justify-center sm:justify-start">
                                    <span className="inline-flex items-center gap-1.5 bg-[var(--c-sage-wash)] text-[var(--c-sage-text)] px-[10px] py-0 rounded-full text-[12px] font-bold tracking-wide font-[family-name:var(--font-serif)]">
                                        <span className={`w-1.5 h-1.5 rounded-full ${status === "ACTIVE" ? "bg-[var(--c-sage)]" : "bg-[var(--c-danger)]"}`}></span>
                                        {status === "ACTIVE" ? "Active" : status}
                                    </span>
                                    {user.roles && Array.isArray(user.roles) && user.roles
                                        .filter((r: any) => {
                                            const code = typeof r === 'string' ? r : (r?.role?.code || r?.code || r?.name || "");
                                            return !["LEARNER", "USER", "CORPORATE_USER", "CORPORATE USER"].includes(code.toUpperCase());
                                        })
                                        .map((r: any, idx: number) => {
                                            const roleName = typeof r === 'string' ? r : (r?.role?.name || r?.name || r?.role?.code || r);
                                            const roleCode = typeof r === 'string' ? r : (r?.role?.code || r?.code || r?.name || "");
                                            
                                            // Map role codes to our view IDs for highlighting
                                            let roleId = "DEFAULT";
                                            const c = roleCode.toUpperCase();
                                            if (c === "SUPER_ADMIN" || c === "SUPER ADMIN") roleId = "SUPER_ADMIN";
                                            else if (c === "TENANT_ADMIN" || c === "TENANT ADMIN" || c === "TENANT ADMINISTRATOR") roleId = "TENANT_ADMIN";
                                            else if (c === "CONTENT_DEVELOPER" || c === "CONTENT DEVELOPER") roleId = "CONTENT_DEVELOPER";
                                            else if (c === "SME" || c === "SUBJECT_MATTER_EXPERT" || c === "SUBJECT MATTER EXPERT") roleId = "SME";
                                            else if (c === "SYSTEM_SUPPORT" || c === "SYSTEM_SUPPORT_ENGINEER" || c === "SUPPORT") roleId = "SUPPORT";

                                            const isActive = activeRoleView === roleId;

                                            return (
                                                <button 
                                                    key={idx} 
                                                    onClick={() => {
                                                        if(roleId !== "DEFAULT") setSelectedRoleView(roleId);
                                                    }}
                                                    className={`inline-flex items-center px-[10px] py-0 rounded-full text-[12px] font-bold tracking-wide transition-colors font-[family-name:var(--font-serif)] ${
                                                        isActive 
                                                        ? "bg-[var(--ink)] text-[var(--paper)] border border-[var(--ink)]" 
                                                        : "bg-[#f4f4f5] text-[var(--ink-soft)] border border-[var(--line-strong)] hover:bg-[#e4e4e7] cursor-pointer"
                                                    }`}
                                                >
                                                    {roleName}
                                                </button>
                                            );
                                        })
                                    }
                                    {(!user.roles || user.roles.length === 0) && (
                                        <span className="inline-flex items-center bg-[#f4f4f5] text-[var(--ink-soft)] px-[10px] py-0 rounded-full text-[12px] font-bold tracking-wide font-[family-name:var(--font-serif)]">Admin Org</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="border border-[var(--line)] rounded-2xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] flex flex-col">
                        <div className="pt-[18px] px-5 pb-[14px] border-b border-[var(--line)]/60">
                            <h3 className="text-[16px] font-bold text-[var(--ink)] font-[family-name:var(--font-sans)]">Lifecycle state</h3>
                        </div>
                        <div className="p-5 flex-1 flex flex-col justify-start">
                            <p className="text-[16px] text-[var(--ink-mute)] mb-[16px] leading-relaxed font-[family-name:var(--font-sans)]">
                                Admin account lifecycle controls. Each action triggers a confirmation dialog and is written to the audit trail.
                            </p>
                            <div className="flex gap-3 flex-wrap">
                                {status !== "SUSPENDED" && (
                                    <button onClick={() => handleLifecycleAction('SUSPENDED')} disabled={changeStatusMutation.isPending} className="px-[14px] py-[8px] rounded-full border border-[var(--line-strong)] text-[14px] font-bold text-[var(--ink-soft)] shadow-sm hover:bg-[var(--paper)] transition-colors">Suspend</button>
                                )}
                                {status === "SUSPENDED" && (
                                    <button onClick={() => handleLifecycleAction('ACTIVE')} disabled={reactivateMutation.isPending} className="px-[14px] py-[8px] rounded-full border border-[var(--line-strong)] text-[14px] font-bold text-[var(--ink-soft)] shadow-sm hover:bg-[var(--paper)] transition-colors">Unsuspend</button>
                                )}
                                {status === "ACTIVE" && (
                                    <button onClick={() => handleLifecycleAction('INACTIVE')} disabled={changeStatusMutation.isPending} className="px-[14px] py-[8px] rounded-full border border-[var(--line-strong)] text-[14px] font-bold text-[var(--ink-soft)] shadow-sm hover:bg-[var(--paper)] transition-colors">Deactivate</button>
                                )}
                                {(status === "INACTIVE" || status === "DELETED") && (
                                    <button onClick={() => handleLifecycleAction('ACTIVE')} disabled={reactivateMutation.isPending} className="px-[14px] py-[8px] rounded-full border border-[var(--line-strong)] text-[14px] font-bold text-[var(--ink-soft)] shadow-sm hover:bg-[var(--paper)] transition-colors">Activate</button>
                                )}
                                {status !== "DELETED" && (
                                    <button onClick={() => handleLifecycleAction('SOFT_DELETE')} disabled={softDeleteMutation.isPending} className="px-[14px] py-[8px] rounded-full border border-[var(--line-strong)] text-[14px] font-bold text-[var(--ink-soft)] shadow-sm hover:bg-[var(--paper)] transition-colors">Soft delete</button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="border-b border-[var(--line-strong)] mb-5">
                    <nav className="flex overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
                        {tabs.map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`pt-[10px] pb-[9px] px-4 text-[12px] whitespace-nowrap tracking-widest transition-colors border-b-2 uppercase font-[family-name:var(--font-serif)] ${activeTab === tab
                                    ? "border-[var(--ink)] text-[var(--ink)] font-bold"
                                    : "border-transparent text-[var(--ink-mute)] font-semibold hover:text-[var(--ink-soft)] hover:border-[var(--line-strong)]"
                                    }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Tab Content */}
                {activeTab === "OVERVIEW" && (
                    <div className="border border-[var(--line-strong)] rounded-[12px] shadow-sm animate-in fade-in duration-300">
                        <div className="pt-[18px] px-5 pb-[14px] border-b border-[var(--line)]">
                            <h3 className="text-[16px] font-bold text-[var(--ink-soft)]">Account info</h3>
                        </div>
                        <div className="px-5 py-5">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-[18px] gap-x-6">
                                <div>
                                    <p className="text-[12px] font-semibold text-[var(--ink-mute)] uppercase tracking-widest mb-[5px] font-[family-name:var(--font-serif)]">JOINED</p>
                                    <p className="text-[16px] font-medium text-[var(--ink-soft)] font-[family-name:var(--font-sans)]">{user.createdAt ? new Date(user.createdAt).toISOString().split('T')[0] : "N/A"}</p>
                                </div>
                                <div>
                                    <p className="text-[12px] font-semibold text-[var(--ink-mute)] uppercase tracking-widest mb-[5px] font-[family-name:var(--font-serif)]">LAST LOGIN</p>
                                    <p className="text-[16px] font-medium text-[var(--ink-soft)] font-[family-name:var(--font-sans)]">
                                        {(user as any).userAnalytics?.lastLoginAt ? new Date((user as any).userAnalytics.lastLoginAt).toLocaleString('sv-SE').slice(0, 16).replace('T', ' ') + ' GST' : "N/A"}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[12px] font-semibold text-[var(--ink-mute)] uppercase tracking-widest mb-[5px] font-[family-name:var(--font-serif)]">SECURITY LEVEL</p>
                                    <p className="text-[16px] font-medium text-[var(--ink-soft)] font-[family-name:var(--font-sans)]">{(user as any).security?.mfaEnabled ? 'MFA Enabled' : 'Standard'}</p>
                                </div>
                                <div>
                                    <p className="text-[12px] font-semibold text-[var(--ink-mute)] uppercase tracking-widest mb-[5px] font-[family-name:var(--font-serif)]">ACCESS SCOPE</p>
                                    <p className="text-[16px] font-medium text-[var(--ink-soft)] font-[family-name:var(--font-sans)]">{isTenantAdmin ? 'Tenant Scoped' : isSuperAdmin ? 'Global / All' : 'Role Scoped'}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === "ACTIVITY" && (
                    <div className="border border-[var(--line-strong)] rounded-[12px] shadow-sm animate-in fade-in duration-300">
                        <div className="pt-[18px] px-5 pb-[14px] border-b border-[var(--line)]">
                            <h3 className="text-[16px] font-bold text-[var(--ink-soft)]">Admin activity</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-[var(--line)]">
                                        <th className="py-[12px] px-[16px] text-[12px] font-semibold text-[var(--ink-mute)] uppercase tracking-widest font-[family-name:var(--font-serif)]">DATE</th>
                                        <th className="py-[12px] px-[16px] text-[12px] font-semibold text-[var(--ink-mute)] uppercase tracking-widest font-[family-name:var(--font-serif)]">ACTION</th>
                                        <th className="py-[12px] px-[16px] text-[12px] font-semibold text-[var(--ink-mute)] uppercase tracking-widest font-[family-name:var(--font-serif)]">DETAILS</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {(user as any).auditLogs && (user as any).auditLogs.length > 0 ? (
                                        (user as any).auditLogs.map((log: any) => (
                                            <tr key={log.id} className="hover:bg-[var(--paper)] transition-colors">
                                                <td className="py-[13px] px-[16px] text-[14px] text-[var(--ink-soft)] font-medium whitespace-nowrap">{new Date(log.createdAt).toISOString().split('T')[0]}</td>
                                                <td className="py-[13px] px-[16px] text-[16px] text-[var(--ink-soft)]">{log.action}</td>
                                                <td className="py-[13px] px-[16px] text-[16px] text-[var(--ink-soft)]">
                                                    {log.entityType} {log.entityId ? `#${log.entityId.slice(-4)}` : ""}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr className="hover:bg-[var(--paper)] transition-colors">
                                            <td colSpan={3} className="py-[13px] px-[16px] text-[14px] text-[var(--ink-soft)] font-medium text-center">No recent activity</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                <TenantAdminTabContent activeTab={activeTab} user={user} />
                <ContentDeveloperTabContent activeTab={activeTab} user={user} />
                <SMETabContent activeTab={activeTab} user={user} />
                <SupportTabContent activeTab={activeTab} user={user} />

                {activeTab === "ROLES" && (
                    <div className="border border-[var(--line-strong)] rounded-[12px] shadow-sm animate-in fade-in duration-300">
                        <div className="pt-[18px] px-5 pb-[14px] border-b border-[var(--line)] flex justify-between items-center">
                            <h3 className="text-[16px] font-bold text-[var(--ink-soft)] font-[family-name:var(--font-sans)]">Roles & permissions</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-[var(--line)]">
                                        <th className="py-[12px] px-[16px] text-[12px] font-bold text-[var(--ink-mute)] uppercase tracking-widest font-[family-name:var(--font-serif)]">ROLE</th>
                                        <th className="py-[12px] px-[16px] text-[12px] font-bold text-[var(--ink-mute)] uppercase tracking-widest font-[family-name:var(--font-serif)]">SCOPE</th>
                                        <th className="py-[12px] px-[16px] text-[12px] font-bold text-[var(--ink-mute)] uppercase tracking-widest font-[family-name:var(--font-serif)]">GRANTED</th>
                                        <th className="py-[12px] px-[16px] text-[12px] font-bold text-[var(--ink-mute)] uppercase tracking-widest font-[family-name:var(--font-serif)]">STATUS</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--line)]">
                                    {rolesList.map((r: any, i: number) => (
                                        <tr key={i} className="hover:bg-[var(--paper-2)] transition-colors">
                                            <td className="py-[13px] px-[16px] whitespace-nowrap">
                                                <span className="inline-block border border-[var(--line-strong)] bg-[var(--paper-2)] text-[var(--ink-soft)] px-[10px] py-0 rounded-full text-[12px] font-semibold font-[family-name:var(--font-serif)]">{r.role}</span>
                                            </td>
                                            <td className="py-[13px] px-[16px] text-[16px] text-[var(--ink-soft)] font-medium font-[family-name:var(--font-sans)]">{r.scope}</td>
                                            <td className="py-[13px] px-[16px] text-[16px] text-[var(--ink-soft)] font-medium font-[family-name:var(--font-sans)]">{r.granted}</td>
                                            <td className="py-[13px] px-[16px]">
                                                <span className="inline-flex items-center gap-1.5 bg-[var(--c-sage-wash)] text-[var(--c-sage-text)] px-[10px] py-0 rounded-full text-[12px] font-bold border border-[var(--line-strong)] font-[family-name:var(--font-serif)]">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--c-sage)]"></span> {r.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminDetailView;