import React from 'react';
import { Download, Search, Calendar, Clock, AlertCircle, AlertTriangle, ChevronLeft, ChevronRight, Award, X, Info, ChevronsUpDown, RefreshCw } from '../../assets/icons';
import { Loader2 } from "lucide-react";
import { useCertificateAdminList, useCertificateAdminStats, useCertificateBulkResend } from '../../hooks/certificate/certificate';
import { useCertificateStore } from '../../store/certificate/certificate.store';
import { toast } from 'sonner';
import { Skeleton } from '../../components/ui/Skeleton/Skeleton';

const LearningCredentials = () => {
    // Connect to Zustand store for filters and pagination
    const { search, setSearch, page, setPage, limit, selectedIds, toggleSelect, selectAll, filters, setFilter, resetFilters, clearSelection } = useCertificateStore();
    
    // Fetch stats
    const { data: statsResponse, isLoading: isStatsLoading } = useCertificateAdminStats();
    const statsData = statsResponse?.data;

    const DotIcon = ({ size, className }: any) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className={className}>
            <circle cx="12" cy="12" r="4" />
        </svg>
    );

    const stats = [
        { label: "Total issued", value: statsData?.totalIssued || 0, icon: Award, color: "text-[var(--c-honey-text)]", bg: "bg-[var(--c-honey-wash)]" },
        { label: "This week", value: statsData?.thisWeek || 0, icon: Calendar, color: "text-[var(--c-sage-text)]", bg: "bg-[var(--c-sage-wash)]" },
        { label: "Pending issuance", subtext: "profile <100% complete", value: statsData?.pendingIssuance || 0, icon: Clock, color: "text-[var(--c-clay-text)]", bg: "bg-[var(--c-clay-wash)]" },
        { label: "Revoked / expired", value: statsData?.revoked || 0, icon: DotIcon, color: "text-[var(--c-clay-text)]", bg: "bg-[var(--c-clay-wash)]" },
    ];

    // Fetch list
    const { data: listResponse, isLoading } = useCertificateAdminList({
        page,
        limit,
        ...filters,
        search: search || undefined,
    });
    
    const bulkResendMutation = useCertificateBulkResend();
    
    const handleBulkResend = async () => {
        if (selectedIds.size === 0) {
            toast.warning('Please select at least one certificate');
            return;
        }

        try {
            const res = await bulkResendMutation.mutateAsync(Array.from(selectedIds));
            toast.success(`Successfully resent ${res.data?.successCount || 0} certificates`);
            clearSelection();
        } catch (error: any) {
            toast.error(error.message || 'Failed to resend certificates');
        }
    };
    
    const credentials = Array.isArray(listResponse?.data?.data) ? listResponse.data.data : [];
    const totalPages = listResponse?.data?.totalPages || 1;
    const totalItems = listResponse?.data?.total || 0;

    const [sortConfig, setSortConfig] = React.useState<{key: string, direction: 'asc'|'desc'} | null>(null);

    const handleSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const sortedCredentials = React.useMemo(() => {
        let sortableItems = [...credentials];
        if (sortConfig !== null) {
            sortableItems.sort((a, b) => {
                let aVal: any = '';
                let bVal: any = '';
                
                switch(sortConfig.key) {
                    case 'id':
                        aVal = a.id; bVal = b.id; break;
                    case 'name':
                        aVal = `${a.user.profile.firstName} ${a.user.profile.lastName}`;
                        bVal = `${b.user.profile.firstName} ${b.user.profile.lastName}`;
                        break;
                    case 'email':
                        aVal = a.user.email; bVal = b.user.email; break;
                    case 'course':
                        aVal = a.course.title; bVal = b.course.title; break;
                    case 'date':
                        aVal = new Date(a.issuedAt).getTime();
                        bVal = new Date(b.issuedAt).getTime();
                        break;
                }

                if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return sortableItems;
    }, [credentials, sortConfig]);

    const handleExportCsv = () => {
        const itemsToExport = selectedIds.size > 0 
            ? sortedCredentials.filter(c => selectedIds.has(c.id))
            : sortedCredentials;

        if (itemsToExport.length === 0) return;

        const headers = ['ID', 'Name', 'Email', 'Course', 'Completion Date'];
        const csvRows = [headers.join(',')];

        for (const cred of itemsToExport) {
            const name = cred.recipientName || `${cred.user?.profile?.firstName || ''} ${cred.user?.profile?.lastName || ''}`.trim();
            const email = cred.user?.email || '';
            const course = cred.course?.title || cred.career_paths?.title || '';
            const date = new Date(cred.issuedAt).toLocaleDateString();
            
            const row = [
                `"${cred.serialNumber || cred.id}"`,
                `"${name.replace(/"/g, '""')}"`,
                `"${email}"`,
                `"${course.replace(/"/g, '""')}"`,
                `"${date}"`
            ];
            csvRows.push(row.join(','));
        }

        const csvContent = csvRows.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `learning-credentials-${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (isLoading || isStatsLoading) {
        return (
            <div className="p-6 space-y-6 w-full">
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
        <>
            {/* Header */}
            <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-start gap-4">
                <div>
                    <div className="text-[length:var(--fs-label)] uppercase tracking-wider font-[var(--fw-bold)] text-[var(--ink-faint)] mb-1.5 font-[family-name:var(--font-serif)]">
                        LEARNING CREDENTIALS
                    </div>
                    <h1 className="mb-1.5 text-[length:var(--fs-h1)] font-[var(--fw-extrabold)] text-[var(--ink)] font-[family-name:var(--font-sans)]">Learning Credentials</h1>
                    <p className="text-[length:var(--fs-h3)] text-[var(--ink-mute)] font-[var(--fw-medium)] font-[family-name:var(--font-sans)]">
                        All learning credentials issued by Nexus Academy to date.
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto mt-4 sm:mt-0">
                    <button 
                        onClick={handleExportCsv}
                        className="flex-1 sm:flex-none justify-center inline-flex items-center gap-2 bg-[var(--hero-bg)] border border-[var(--c-honey-soft)] text-[var(--ink)] text-[length:var(--fs-meta)] font-[var(--fw-bold)] py-[8px] px-[14px] rounded-full hover:-translate-y-[2px] transition-colors shadow-sm cursor-pointer font-[family-name:var(--font-sans)]"
                    >
                        <Download width={14} height={14} className="stroke-[2.5]" />
                        Export CSV
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((card, idx) => (
                    <div key={idx} className="bg-[var(--paper)] border border-[var(--line)] rounded-[16px] py-[18px] px-[20px] flex items-center gap-3 sm:gap-5 w-full hover:border-[var(--line-strong)] hover:-translate-y-1 transition-all duration-200 cursor-pointer">
                        <div className={`w-[38px] h-[38px] flex items-center justify-center rounded-[12px] ${card.bg} ${card.color} shrink-0`}>
                            <card.icon width={20} height={20} className="stroke-[1.5]" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="text-[length:var(--fs-h1)] font-[var(--fw-bold)] text-[var(--ink)] leading-none truncate font-[family-name:var(--font-sans)]">
                                {card.value}
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[length:var(--fs-meta)] text-[var(--ink-mute)] font-[var(--fw-medium)] mt-[3px] truncate font-[family-name:var(--font-serif)]">
                                    {card.label}
                                </span>
                                {card.subtext && (
                                    <span className="text-[length:var(--fs-label)] text-[var(--ink-faint)] font-[var(--fw-medium)] mt-[3px] font-[family-name:var(--font-serif)]">
                                        {card.subtext}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Toolbar Search / Filter */}
            <div className="mb-4.5 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between mb-[18px]">
                <div className="flex flex-col md:flex-row gap-3 flex-wrap items-center">
                    <div className="relative w-full md:w-[220px]">
                        <input
                            type="text"
                            placeholder="Search learning credentials..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full h-[38px] border border-[var(--line)] rounded-full bg-[var(--paper)] pl-[34px] pr-[14px] py-0 text-[length:var(--fs-meta)] font-[var(--fw-medium)] text-[var(--ink)] placeholder-[var(--ink-faint)] focus:outline-none focus:border-[var(--c-honey)] transition-colors"
                        />
                        <Search width={14} height={14} className="absolute left-[12px] top-1/2 -translate-y-1/2 text-[var(--ink-faint)]" />
                    </div>
                    
                    <div className="relative flex items-center">
                        <select 
                            value={filters.careerPath || ""}
                            onChange={(e) => setFilter("careerPath", e.target.value)}
                            className="w-full md:w-[160px] h-[40px] appearance-none border border-[var(--line)] rounded-[8px] bg-[var(--paper)] pl-[14px] pr-[36px] py-0 text-[length:var(--fs-meta)] font-[var(--fw-medium)] text-[var(--ink)] focus:outline-none focus:border-[var(--c-honey)] cursor-pointer hover:border-[var(--line-strong)] transition-colors"
                        >
                            <option value="">Career path</option>
                        </select>
                        <svg className="absolute right-[14px] pointer-events-none text-[var(--ink-faint)]" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                    </div>

                    <div className="relative flex items-center">
                        <select 
                            value={filters.tenantId || ""}
                            onChange={(e) => setFilter("tenantId", e.target.value)}
                            className="w-full md:w-[160px] h-[40px] appearance-none border border-[var(--line)] rounded-[8px] bg-[var(--paper)] pl-[14px] pr-[36px] py-0 text-[length:var(--fs-meta)] font-[var(--fw-medium)] text-[var(--ink)] focus:outline-none focus:border-[var(--c-honey)] cursor-pointer hover:border-[var(--line-strong)] transition-colors"
                        >
                            <option value="">Tenant</option>
                        </select>
                        <svg className="absolute right-[14px] pointer-events-none text-[var(--ink-faint)]" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                    </div>

                    <div className="relative flex items-center">
                        <select 
                            value={filters.status || ""}
                            onChange={(e) => setFilter("status", e.target.value as any || undefined)}
                            className="w-full md:w-[160px] h-[40px] appearance-none border border-[var(--line)] rounded-[8px] bg-[var(--paper)] pl-[14px] pr-[36px] py-0 text-[length:var(--fs-meta)] font-[var(--fw-medium)] text-[var(--ink)] focus:outline-none focus:border-[var(--c-honey)] cursor-pointer hover:border-[var(--line-strong)] transition-colors"
                        >
                            <option value="">Status</option>
                            <option value="ACTIVE">Active</option>
                        </select>
                        <svg className="absolute right-[14px] pointer-events-none text-[var(--ink-faint)]" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                    </div>

                    <button 
                        onClick={resetFilters}
                        className="border border-[var(--line)] rounded-full bg-[var(--paper)] py-[8px] px-[14px] text-[length:var(--fs-meta)] font-[var(--fw-bold)] text-[var(--ink)] hover:bg-[var(--paper-2)] transition-colors font-[family-name:var(--font-sans)]"
                    >
                        Clear filters
                    </button>
                </div>
            </div>

            {/* Table Area */}
            <div className="border border-[var(--line)] rounded-[var(--r-lg)] overflow-hidden mb-[var(--space-12)] shadow-[var(--shadow-sm)] bg-[var(--paper)] flex min-h-0 flex-1 flex-col">
                <div className="flex flex-col sm:flex-row shrink-0 items-start sm:items-center justify-between gap-4 border-b border-[var(--line-strong)] pt-[16px] px-[20px] pb-[12px] hover:bg-[var(--paper-2)] transition-colors cursor-pointer bg-[var(--paper)]">
                    <div className="flex items-center gap-4">
                        <h2 className="text-[length:var(--fs-body)] font-[var(--fw-bold)] text-[var(--ink)] font-[family-name:var(--font-sans)]">
                            All learning credentials
                        </h2>
                        {/* <span className="rounded-[var(--r-pill)] border border-[var(--line-strong)] bg-[var(--paper)] px-3 py-1 text-[length:var(--fs-meta)] font-[var(--fw-medium)] leading-none text-[var(--ink-mute)]">
                            {totalItems} total
                        </span> */}
                    </div>
                    <div className="flex gap-3 w-full sm:w-auto">
                        <button 
                            onClick={handleBulkResend}
                            disabled={bulkResendMutation.isPending || selectedIds.size === 0}
                            className="nexus-btn sm flex-1 sm:flex-none justify-center inline-flex items-center gap-2 bg-[var(--hero-bg)] border border-[var(--c-honey-soft)] shadow-sm text-[var(--ink)] text-[length:var(--fs-meta)] font-[var(--fw-semibold)] px-[14px] py-[8px] rounded-full hover:-translate-y-[2px] transition-all duration-200 cursor-pointer font-[family-name:var(--font-sans)] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <RefreshCw width={14} height={14} className={`stroke-[2.5] ${bulkResendMutation.isPending ? 'animate-spin' : ''}`} /> Bulk: resend
                        </button>
                        {/* <button className="px-[14px] py-[6px] text-[length:var(--fs-meta)] font-[var(--fw-bold)] text-[var(--ink-mute)] bg-[var(--paper-2)] border border-[var(--c-honey-soft)] rounded-full cursor-pointer inline-flex items-center gap-1.5 transition-colors hover:bg-[var(--paper-2)]">
                            <X width={14} height={14} className="stroke-[2.5]" /> Bulk: revoke
                        </button> */}
                        {/* <button 
                            onClick={handleExportCsv}
                            className="px-[14px] py-[6px] text-[length:var(--fs-meta)] font-[var(--fw-bold)] text-[var(--c-sage-text)] bg-[var(--c-sage-wash)] border border-[var(--c-sage-soft)] rounded-full cursor-pointer inline-flex items-center gap-1.5 transition-colors hover:-translate-y-[2px]"
                        >
                            <Download width={14} height={14} className="stroke-[2.5]" /> Bulk: export
                        </button> */}
                    </div>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-[length:var(--fs-meta)] text-[var(--ink-soft)]">
                            <thead className="bg-[var(--paper-2)] border-b border-[var(--line-strong)] font-[var(--fw-semibold)] uppercase tracking-wider text-[var(--ink-faint)] text-[length:var(--fs-label)] font-[family-name:var(--font-serif)]">
                                <tr>
                                    <th className="px-[16px] py-[11px] w-12 text-center">
                                        <input 
                                            type="checkbox" 
                                            className="rounded border-[var(--line-strong)] text-[var(--ink)] focus:ring-black cursor-pointer" 
                                            checked={sortedCredentials.length > 0 && sortedCredentials.every(c => selectedIds.has(c.id))}
                                            onChange={() => selectAll(sortedCredentials.map(c => c.id))}
                                        />
                                    </th>
                                    <th className="py-[18px] px-[16px] cursor-pointer hover:bg-[var(--paper-2)] transition-colors text-[length:var(--fs-label)] font-[family-name:var(--font-serif)]" onClick={() => handleSort('id')}>
                                        <div className="flex items-center gap-1">ID <ChevronsUpDown width={14} height={14} className="text-[var(--line-strong)]" /></div>
                                    </th>
                                    <th className="py-[18px] px-[16px] cursor-pointer hover:bg-[var(--paper-2)] transition-colors text-[length:var(--fs-body)] font-[family-name:var(--font-serif)]" onClick={() => handleSort('name')}>
                                        <div className="flex items-center gap-1">NAME <ChevronsUpDown width={14} height={14} className="text-[var(--line-strong)]" /></div>
                                    </th>
                                    <th className="py-[18px] px-[16px] cursor-pointer hover:bg-[var(--paper-2)] transition-colors text-[length:var(--fs-meta)] font-[family-name:var(--font-serif)]" onClick={() => handleSort('email')}>
                                        <div className="flex items-center gap-1">EMAIL <ChevronsUpDown width={14} height={14} className="text-[var(--line-strong)]" /></div>
                                    </th>
                                    <th className="py-[18px] px-[16px] cursor-pointer hover:bg-[var(--paper-2)] transition-colors text-[length:var(--fs-meta)] font-[family-name:var(--font-serif)]" onClick={() => handleSort('course')}>
                                        <div className="flex items-center gap-1">COURSE <ChevronsUpDown width={14} height={14} className="text-[var(--line-strong)]" /></div>
                                    </th>
                                    <th className="py-[18px] px-[16px] cursor-pointer hover:bg-[var(--paper-2)] transition-colors text-[length:var(--fs-meta)] font-[family-name:var(--font-serif)]" onClick={() => handleSort('date')}>
                                        <div className="flex items-center gap-1">COMPLETION DATE <ChevronsUpDown width={14} height={14} className="text-[var(--line-strong)]" /></div>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--line-strong)]">
                                {sortedCredentials.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-12 text-center text-[var(--ink-faint)]">
                                            No credentials found.
                                        </td>
                                    </tr>
                                ) : (
                                    sortedCredentials.map((cred, idx) => (
                                        <tr key={cred.id || idx} className="hover:bg-[var(--paper-2)] transition-colors">
                                            <td className="px-[18px] py-[16px] text-center">
                                                <input 
                                                    type="checkbox" 
                                                    className="rounded border-[var(--line-strong)] text-[var(--ink)] focus:ring-black cursor-pointer" 
                                                    checked={selectedIds.has(cred.id)}
                                                    onChange={() => toggleSelect(cred.id)}
                                                />
                                            </td>
                                            <td className="px-[18px] py-[16px] text-[length:var(--fs-label)] font-[family-name:var(--font-serif)]">{cred.serialNumber || cred.id}</td>
                                            <td className="px-[18px] py-[16px] font-[var(--fw-bold)] text-[var(--ink)] text-[length:var(--fs-h3)] font-[family-name:var(--font-sans)]">
                                                {cred.recipientName || `${cred.user?.profile?.firstName || ''} ${cred.user?.profile?.lastName || ''}`.trim()}
                                            </td>
                                            <td className="px-[18px] py-[16px] font-[family-name:var(--font-sans)]">{cred.user?.email || '-'}</td>
                                            <td className="px-[18px] py-[16px] font-[family-name:var(--font-sans)]">{cred.course?.title || cred.career_paths?.title || '-'}</td>
                                            <td className="px-[18px] py-[16px] font-[family-name:var(--font-serif)]">{new Date(cred.issuedAt).toLocaleDateString()}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                </div>

                <div className="py-[14px] px-[20px] border-t border-[var(--line-strong)] flex flex-col sm:flex-row justify-between items-center gap-4 text-[length:var(--fs-meta)] text-[var(--ink-faint)] font-[var(--fw-medium)] font-[family-name:var(--font-serif)]">
                    <div>Showing {(page - 1) * limit + 1}-{Math.min(page * limit, totalItems)} of {totalItems}</div>
                    <div className="flex items-center gap-4">
                        <button 
                            disabled={page === 1}
                            onClick={() => setPage(page - 1)}
                            className="inline-flex items-center gap-1 text-[var(--ink-mute)] hover:text-[var(--ink)] disabled:text-[var(--line-strong)] disabled:cursor-not-allowed"
                        >
                            <ChevronLeft width={14} height={14} /> Prev
                        </button>
                        <span>{page} of {totalPages}</span>
                        <button 
                            disabled={page >= totalPages}
                            onClick={() => setPage(page + 1)}
                            className="inline-flex items-center gap-1 text-[var(--ink-mute)] hover:text-[var(--ink)] disabled:text-[var(--line-strong)] disabled:cursor-not-allowed"
                        >
                            Next <ChevronRight width={14} height={14} />
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default LearningCredentials;





