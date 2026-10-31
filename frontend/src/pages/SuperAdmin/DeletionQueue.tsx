import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { ChevronLeft, Download, Info, ArrowRight, ChevronsUpDown, ChevronUp, ChevronDown } from '../../assets/icons';
import { Loader2 } from "lucide-react";
import { useUsers, useReactivateUser, useAdminHardPurge } from '../../hooks/internal-user/useInternalUser';
import { Skeleton } from '../../components/ui/Skeleton/Skeleton';

const DeletionQueue: React.FC = () => {
    const navigate = useNavigate();
    const [filter, setFilter] = useState('all');
    const [sortBy, setSortBy] = useState<string | null>(null);
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | null>(null);

    const { data: users, isLoading } = useUsers({ status: 'DELETED' });
    const reactivateMutation = useReactivateUser();
    const hardPurgeMutation = useAdminHardPurge();
    console.log("DELETED USERS FETCHED:", users);

    // Client side filtering
    const filteredUsers = useMemo(() => {
        if (!users) return [];
        return users.filter(u => {
            if (filter === 'all') return true;
            
            let isAdmin = false;
            const lifecycle: any = u.lifecycle || {};
            
            if (lifecycle.initiatedBy) {
                isAdmin = lifecycle.initiatedBy === 'ADMIN';
            } else if (lifecycle.deletionInitiator) {
                isAdmin = lifecycle.deletionInitiator === 'ADMIN';
            } else if (lifecycle.deletedByAdmin !== undefined) {
                isAdmin = lifecycle.deletedByAdmin;
            } else if (lifecycle.isSelfRequested !== undefined) {
                isAdmin = !lifecycle.isSelfRequested;
            } else {
                // Default to Admin-initiated if we don't have specific backend flags.
                // When an admin soft-deletes a user, the backend may not set a flag,
                // whereas self-requested deletions typically set a specific flag.
                isAdmin = true;
            }

            if (filter === 'admin') return isAdmin;
            if (filter === 'user') return !isAdmin;
            return true;
        });
    }, [users, filter]);

    const handleSort = (column: string) => {
        if (sortBy === column) {
            if (sortOrder === 'asc') setSortOrder('desc');
            else if (sortOrder === 'desc') {
                setSortBy(null);
                setSortOrder(null);
            }
            else setSortOrder('asc');
        } else {
            setSortBy(column);
            setSortOrder('asc');
        }
    };

    const renderSortIcon = (column: string) => {
        if (sortBy !== column || !sortOrder) {
            return <ChevronsUpDown width={11} height={11} className="sort-th-caret opacity-40" />;
        }
        return sortOrder === "asc" ? (
            <ChevronUp width={11} height={11} className="sort-th-caret text-[var(--ink-soft)]" />
        ) : (
            <ChevronDown width={11} height={11} className="sort-th-caret text-[var(--ink-soft)]" />
        );
    };

    const calculateGraceDaysLeft = (softDeletedAt: string | null | undefined) => {
        if (!softDeletedAt) return 0;
        const deletedDate = new Date(softDeletedAt);
        deletedDate.setHours(0, 0, 0, 0);
        const graceEndsDate = new Date(deletedDate.getTime() + 30 * 24 * 60 * 60 * 1000);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const daysLeft = Math.round((graceEndsDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return daysLeft < 0 ? 0 : daysLeft;
    }

    const formatDate = (dateString: string | null | undefined) => {
        if (!dateString) return "N/A";
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
    }

    const getGraceEndsDate = (softDeletedAt: string | null | undefined) => {
        if (!softDeletedAt) return "N/A";
        const deletedDate = new Date(softDeletedAt);
        const graceEndsDate = new Date(deletedDate.getTime() + 30 * 24 * 60 * 60 * 1000);
        return graceEndsDate.toISOString().split('T')[0];
    }

    const sortedUsers = useMemo(() => {
        let sortableItems = [...filteredUsers];
        if (sortBy && sortOrder) {
            sortableItems.sort((a, b) => {
                let aVal: any = '';
                let bVal: any = '';
                
                const getSoftDeletedAt = (u: any) => u.lifecycle?.softDeletedAt || u.deletedAt || u.updatedAt;

                switch (sortBy) {
                    case 'user':
                        aVal = `${a.firstName || ''} ${a.lastName || ''}`.toLowerCase();
                        bVal = `${b.firstName || ''} ${b.lastName || ''}`.toLowerCase();
                        break;
                    case 'deletionType':
                    case 'initiatedBy':
                        aVal = a.roles?.some(r => typeof r === 'string' && r.includes('ADMIN')) ? 'admin' : 'self';
                        bVal = b.roles?.some(r => typeof r === 'string' && r.includes('ADMIN')) ? 'admin' : 'self';
                        break;
                    case 'deletedDate':
                        aVal = new Date(getSoftDeletedAt(a) || 0).getTime();
                        bVal = new Date(getSoftDeletedAt(b) || 0).getTime();
                        break;
                    case 'graceEnds':
                        aVal = new Date(getGraceEndsDate(getSoftDeletedAt(a))).getTime();
                        bVal = new Date(getGraceEndsDate(getSoftDeletedAt(b))).getTime();
                        break;
                    case 'daysLeft':
                        aVal = calculateGraceDaysLeft(getSoftDeletedAt(a));
                        bVal = calculateGraceDaysLeft(getSoftDeletedAt(b));
                        break;
                    case 'state':
                        const getState = (u: any) => {
                            const days = calculateGraceDaysLeft(getSoftDeletedAt(u));
                            if (u.roles?.some((r: any) => typeof r === 'string' && r.includes('CERTIFIED'))) return 'a-retention';
                            if (days === 0) return 'b-pending';
                            return 'c-grace';
                        };
                        aVal = getState(a);
                        bVal = getState(b);
                        break;
                }
                
                if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
                if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return sortableItems;
    }, [filteredUsers, sortBy, sortOrder]);

    if (isLoading) {
        return (
            <div className="p-6 space-y-6 w-full h-full bg-[var(--paper)]">
                <div className="space-y-2 mb-8">
                    <Skeleton className="h-8 w-1/4 rounded-[var(--r-sm)]" />
                    <Skeleton className="h-4 w-1/3 rounded-[var(--r-sm)]" />
                </div>
                <Skeleton className="h-[400px] w-full rounded-xl" />
            </div>
        );
    }

    return (
        <main className="main flex-1 bg-[var(--paper)] h-full">
            {/* Header */}
            <div className="mb-6">
                <button
                    onClick={() => navigate('/user-management-dashboard')}
                    className="flex items-center text-[length:var(--fs-label)] font-[var(--fw-semibold)] tracking-wide text-[var(--ink-mute)] hover:text-[var(--ink)] uppercase mb-3.5 transition-colors font-[family-name:var(--font-serif)]"
                >
                    <ChevronLeft width={14} height={14} className="mr-1" />
                    User management
                </button>

                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-[24px] adq-page-head">
                    <div>
                        <div className="text-[length:var(--fs-label)] font-[var(--fw-bold)] uppercase tracking-wider text-[var(--ink-mute)] mb-1.5 font-[family-name:var(--font-serif)] ">
                            User lifecycle
                        </div>
                        <h1 className="text-[length:var(--fs-h1)] font-[var(--fw-extrabold)] text-[var(--ink)] leading-tight mb-1.5">
                            Deletion queue
                        </h1>
                        <p className="text-[length:var(--fs-body)] text-[var(--ink-mute)]">
                            Soft-deleted accounts pending hard-delete after the 30-day grace period (policy LIFE-08).
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                        <select
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="adq-filter-select h-10 w-full sm:w-auto pl-[14px] pr-[36px] py-0 rounded-lg border border-[var(--line-strong)] text-[length:var(--fs-meta)] font-[var(--fw-semibold)] text-[var(--ink)] bg-[var(--paper)] hover:border-[var(--ink)] focus:outline-none focus:border-[var(--ink)] focus:ring-0 cursor-pointer appearance-none shadow-xs transition-all duration-200 font-[family-name:var(--font-sans)]" aria-label="Filter by initiator"
                        >
                            <option value="all">All requests</option>
                            <option value="user">User-initiated</option>
                            <option value="admin">Admin-initiated</option>
                        </select>

                         <button
                            className="whitespace-nowrap px-[16px] py-[8px] rounded-full text-[length:var(--fs-meta)] font-[var(--fw-bold)] flex items-center justify-center gap-2 w-full sm:w-auto shadow-xs transition-all duration-200 hover:-translate-y-[1px]  cursor-pointer font-[family-name:var(--font-sans)]"
                        >
                            <Download width={16} height={16} />
                            Export
                        </button>
                    </div>
                </div>
            </div>


            {/* Table Card */}
            <div className="bg-[var(--paper)] rounded-xl border border-[var(--line)] shadow-sm overflow-hidden mb-0 transition-all duration-200 hover:-translate-y-[2px] hover:shadow-md">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-[var(--line)]">
                                <th className="py-[10px] px-[12px] bg-[var(--paper)] whitespace-nowrap">
                                    <button onClick={() => handleSort('user')} className="sort-th-btn flex items-center gap-1.5 text-[length:var(--fs-label)] font-[var(--fw-bold)] text-[var(--ink-mute)] uppercase tracking-wider group w-full text-left">
                                        User
                                        {renderSortIcon('user')}
                                    </button>
                                </th>
                                <th className="py-[10px] px-[12px] bg-[var(--paper)] whitespace-nowrap">
                                    <button onClick={() => handleSort('deletionType')} className="sort-th-btn flex items-center gap-1.5 text-[length:var(--fs-label)] font-[var(--fw-bold)] text-[var(--ink-mute)] uppercase tracking-wider group w-full text-left">
                                        Deletion type
                                        {renderSortIcon('deletionType')}
                                    </button>
                                </th>
                                <th className="py-[10px] px-[12px] bg-[var(--paper)] whitespace-nowrap">
                                    <button onClick={() => handleSort('initiatedBy')} className="sort-th-btn flex items-center gap-1.5 text-[length:var(--fs-label)] font-[var(--fw-bold)] text-[var(--ink-mute)] uppercase tracking-wider group w-full text-left">
                                        Initiated by
                                        {renderSortIcon('initiatedBy')}
                                    </button>
                                </th>
                                <th className="py-[10px] px-[12px] bg-[var(--paper)] whitespace-nowrap">
                                    <button onClick={() => handleSort('deletedDate')} className="sort-th-btn flex items-center gap-1.5 text-[length:var(--fs-label)] font-[var(--fw-bold)] text-[var(--ink-mute)] uppercase tracking-wider group w-full text-left">
                                        Deleted date
                                        {renderSortIcon('deletedDate')}
                                    </button>
                                </th>
                                <th className="py-[10px] px-[12px] bg-[var(--paper)] whitespace-nowrap">
                                    <button onClick={() => handleSort('graceEnds')} className="sort-th-btn flex items-center gap-1.5 text-[length:var(--fs-label)] font-[var(--fw-bold)] text-[var(--ink-mute)] uppercase tracking-wider group w-full text-left">
                                        Grace ends
                                        {renderSortIcon('graceEnds')}
                                    </button>
                                </th>
                                <th className="py-[10px] px-[12px] bg-[var(--paper)] whitespace-nowrap">
                                    <button onClick={() => handleSort('daysLeft')} className="sort-th-btn flex items-center gap-1.5 text-[length:var(--fs-label)] font-[var(--fw-bold)] text-[var(--ink-mute)] uppercase tracking-wider group w-full text-left">
                                        Days left
                                        {renderSortIcon('daysLeft')}
                                    </button>
                                </th>
                                <th className="py-[10px] px-[12px] bg-[var(--paper)] whitespace-nowrap">
                                    <button onClick={() => handleSort('state')} className="sort-th-btn flex items-center gap-1.5 text-[length:var(--fs-label)] font-[var(--fw-bold)] text-[var(--ink-mute)] uppercase tracking-wider group w-full text-left">
                                        State
                                        {renderSortIcon('state')}
                                    </button>
                                </th>
                                <th className="py-[10px] px-[12px] text-[length:var(--fs-label)] font-[var(--fw-bold)] text-[var(--ink-mute)] uppercase tracking-wider bg-[var(--paper)] whitespace-nowrap">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--line)] text-[length:var(--fs-meta)]">
                            {sortedUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="py-8 text-center text-[var(--ink-mute)]">
                                        No users in the deletion queue matching the criteria.
                                    </td>
                                </tr>
                            ) : (
                                sortedUsers.map((user) => {
                                    const softDeletedAt = user.lifecycle?.softDeletedAt || user.deletedAt || user.updatedAt;
                                    const daysLeft = calculateGraceDaysLeft(softDeletedAt);
                                    const isPendingPurge = daysLeft === 0;
                                    const isRetained = user.roles?.some(r => typeof r === 'string' && r.includes('CERTIFIED'));

                                    return (
                                        <tr key={user.id} className="hover:bg-[var(--paper-2)]/50 transition-colors">
                                            <td className="py-[14px] px-[12px] whitespace-nowrap">
                                                <div className="font-[var(--fw-semibold)] text-[var(--ink)] text-[length:var(--fs-body)]">{user.firstName || 'Unknown'} {user.lastName || 'User'}</div>
                                                <div className="text-[var(--ink-mute)] text-[length:var(--fs-meta)] font-[family-name:var(--font-serif)]">{user.email}</div>
                                                {isRetained && (
                                                    <div className="text-[#446038] text-[length:var(--fs-meta)] mt-0.5 font-[var(--fw-medium)]">Locally certified</div>
                                                )}
                                            </td>
                                            <td className="py-[14px] px-[12px] whitespace-nowrap">
                                                {(() => {
                                                    let isAdmin = false;
                                                    const lifecycle: any = user.lifecycle || {};
                                                    
                                                    if (lifecycle.initiatedBy) {
                                                        isAdmin = lifecycle.initiatedBy === 'ADMIN';
                                                    } else if (lifecycle.deletionInitiator) {
                                                        isAdmin = lifecycle.deletionInitiator === 'ADMIN';
                                                    } else if (lifecycle.deletedByAdmin !== undefined) {
                                                        isAdmin = lifecycle.deletedByAdmin;
                                                    } else if (lifecycle.isSelfRequested !== undefined) {
                                                        isAdmin = !lifecycle.isSelfRequested;
                                                    } else {
                                                        isAdmin = true; // Default to Admin-initiated
                                                    }

                                                    return isAdmin ? (
                                                        <span className="text-[length:var(--fs-meta)] font-[var(--fw-semibold)] text-[var(--ink-soft)] font-[family-name:var(--font-serif)]">
                                                            Admin-initiated
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[length:var(--fs-meta)] font-[var(--fw-semibold)] bg-[var(--paper-2)] text-[var(--ink-soft)] font-[family-name:var(--font-serif)]">
                                                            Self-requested
                                                        </span>
                                                    );
                                                })()}
                                            </td>
                                            <td className="py-[14px] px-[12px] text-[length:var(--fs-meta)] text-[var(--ink-soft)] whitespace-nowrap">
                                                {user.roles?.some(r => typeof r === 'string' && r.includes('ADMIN')) ? 'Admin' : 'User'}
                                            </td>
                                            <td className="py-[14px] px-[12px] text-[var(--ink-soft)] font-[family-name:var(--font-sans)] text-[length:var(--fs-body)] whitespace-nowrap">{formatDate(softDeletedAt)}</td>
                                            <td className="py-[14px] px-[12px] text-[var(--ink-soft)] font-[family-name:var(--font-sans)] text-[length:var(--fs-body)] whitespace-nowrap">
                                                {isRetained ? "Retained" : getGraceEndsDate(softDeletedAt)}
                                            </td>
                                            <td className="py-[14px] px-[12px] whitespace-nowrap ">
                                                {isRetained ? (
                                                    <span className="inline-flex items-center  px-2.5 py-1 rounded-full text-[length:var(--fs-meta)] font-[var(--fw-bold)] bg-[#dce5d3] text-[#446038]">
                                                        Never
                                                    </span>
                                                ) : isPendingPurge ? (
                                                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[length:var(--fs-meta)] font-[var(--fw-bold)] bg-[var(--paper-2)] text-[var(--ink-soft)] font-[family-name:var(--font-serif)]">
                                                        0d
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[length:var(--fs-meta)] font-[var(--fw-bold)] bg-[#f6e8c4] text-[#755a12] font-[family-name:var(--font-serif)]">
                                                        {daysLeft}d
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-[14px] px-[12px] whitespace-nowrap">
                                                {isRetained ? (
                                                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[length:var(--fs-meta)] font-[var(--fw-bold)] bg-[#dce5d3] text-[#446038]">
                                                        Retention locked
                                                    </span>
                                                ) : isPendingPurge ? (
                                                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[length:var(--fs-meta)] font-[var(--fw-bold)] bg-[#f7d9d4] text-[#9e2014]">
                                                        Pending purge
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[length:var(--fs-meta)] font-[var(--fw-bold)] bg-[#f6e8c4] text-[#755a12] font-[family-name:var(--font-serif)]">
                                                        Grace period
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-[14px] px-[12px] whitespace-nowrap">
                                                <div className="flex items-center gap-2 font-[var(--fw-semibold)] text-[length:var(--fs-meta)]">
                                                    {isPendingPurge && !isRetained ? (
                                                        <span className="text-[var(--ink-faint)] cursor-not-allowed" title="Grace period expired - restore not available">Restore</span>
                                                    ) : (
                                                        <button 
                                                            onClick={() => reactivateMutation.mutate(user.id!)}
                                                            disabled={reactivateMutation.isPending || hardPurgeMutation.isPending}
                                                            className="text-[#446038] hover:text-[#2e9f5b] transition-colors disabled:opacity-50"
                                                        >
                                                            {reactivateMutation.isPending && reactivateMutation.variables === user.id ? "Restoring..." : "Restore"}
                                                        </button>
                                                    )}
                                                    
                                                    <span className="text-[var(--line-strong)]">·</span>

                                                    {isRetained ? (
                                                        <span className="text-[var(--ink-faint)] cursor-not-allowed" title="Locally certified - retained per LIFE-08, hard-delete not permitted">Force purge</span>
                                                    ) : (
                                                        <button 
                                                            onClick={() => hardPurgeMutation.mutate(user.id!)}
                                                            disabled={reactivateMutation.isPending || hardPurgeMutation.isPending}
                                                            className="text-[#c12a1c] hover:text-[#9e2014] transition-colors disabled:opacity-50"
                                                        >
                                                            {hardPurgeMutation.isPending && hardPurgeMutation.variables === user.id ? "Purging..." : (isPendingPurge ? "Purge now" : "Force purge")}
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Footer */}
            <div className="adq-foot flex flex-col sm:flex-row sm:justify-between items-start sm:items-center gap-2 sm:gap-0 text-[length:var(--fs-meta)] text-[var(--ink-mute)] px-1 mt-[18px] font-[family-name:var(--font-serif)]">
                <div>
                    {filteredUsers?.length || 0} accounts in queue
                </div>
                <button
                    onClick={() => navigate('/admin/audit')}
                    className="flex items-center font-[var(--fw-semibold)] text-[var(--ink-soft)] hover:text-[var(--ink)] transition-colors"
                >
                    View purged log (audit)
                    <ArrowRight width={14} height={14} className="ml-1" />
                </button>
            </div>
        </main>
    );
};

export default DeletionQueue;
