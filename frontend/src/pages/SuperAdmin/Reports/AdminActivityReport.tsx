import React, { useState } from 'react';
import { 
  Download, ArrowLeft, Search, ChevronDown, X
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Shield, Users, BarChart2, User, Check, Clock } from '../../../assets/icons';
import { StatCard } from '../../../components/Reports/StatCard';
import { LineChartWidget } from '../../../components/Reports/LineChartWidget';
import { DonutChartWidget } from '../../../components/Reports/DonutChartWidget';
import { Link } from "react-router";
import { useAdminActivityReport, useDashboardMetrics } from '../../../hooks/useReports';
import { getTenantsApi } from '../../../core/api/tenant.api';
import { getTenantUsersApi } from '../../../core/api/tenantuser.api';
import { AdminActivityReport as AdminActivityReportType, ReportFilter } from '../../../types/reports.types';
import * as XLSX from 'xlsx';
import { Skeleton } from '../../../components/ui/Skeleton/Skeleton';

const CustomSelect = ({ 
  value, 
  onChange, 
  options, 
  placeholder 
}: { 
  value: any, 
  onChange: (val: any) => void, 
  options: { value: any, label: string }[], 
  placeholder: string 
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value === value || opt.value === Number(value) || String(opt.value) === String(value));

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button 
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full h-10 flex items-center justify-between px-3.5 bg-white border rounded-[var(--r-md)] text-[length:var(--fs-body)] font-[var(--fw-regular)] text-[var(--ink)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-sm)] ${isOpen ? 'border-[var(--honey)] outline-none' : 'border-[var(--line)] hover:border-[var(--ink)]'}`}
      >
        <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
        <ChevronDown className={`text-[var(--ink-mute)] transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} size={14} />
      </button>
      
      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-[var(--line)] rounded-[var(--r-md)] shadow-[var(--shadow-lg)] max-h-60 overflow-y-auto p-1">
          <div 
            onClick={() => { onChange(''); setIsOpen(false); }}
            className={`px-3 py-2 mb-0.5 rounded-[var(--r-md)] cursor-pointer text-[length:var(--fs-body)] transition-colors ${!value || value === 'all' ? 'bg-[var(--c-honey-wash)] text-[var(--ink)] font-[var(--fw-medium)]' : 'text-[var(--ink-mute)] hover:text-[var(--ink)] hover:bg-[var(--surface-wash)]'}`}
          >
            {placeholder}
          </div>
          {options.map((opt) => (
            <div 
              key={opt.value}
              onClick={() => { onChange(opt.value); setIsOpen(false); }}
              className={`px-3 py-2 mb-0.5 rounded-[var(--r-md)] cursor-pointer text-[length:var(--fs-body)] transition-colors ${String(value) === String(opt.value) ? 'bg-[var(--c-honey-wash)] text-[var(--ink)] font-[var(--fw-medium)]' : 'text-[var(--ink-mute)] hover:text-[var(--ink)] hover:bg-[var(--surface-wash)]'}`}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const AdminActivityReport: React.FC = () => {
  const [filters, setFilters] = useState<ReportFilter>({});
  const [localFilters, setLocalFilters] = useState<{
    days?: number;
    action?: string;
    entityType?: string;
    outcome?: string;
    tenantId?: string;
  }>({});
  const [search, setSearch] = useState('');
  const [isApplied, setIsApplied] = useState(false);
  const [tenants, setTenants] = useState<any[]>([]);
  const [visibleCount, setVisibleCount] = useState(6);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  React.useEffect(() => {
    getTenantsApi().then(setTenants).catch(console.error);
  }, []);

  const { data: tenantUsers } = useQuery({
    queryKey: ['tenant-users-lookup'],
    queryFn: getTenantUsersApi,
    staleTime: 5 * 60 * 1000,
  });

  const userLookupMap = React.useMemo(() => {
    const emailMap = new Map<string, string>();
    const roleMap = new Map<string, string>();
    const extractUser = (u: any) => {
      if (!u) return;
      const uid = u?.id || u?.userId || u?.user?.id || u?.actorUserId || u?.keycloakId;
      const email = u?.email || u?.user?.email || u?.actorEmail;
      let role = u?.role || u?.roleName || u?.roles?.[0]?.role?.name || u?.roles?.[0]?.role?.code || u?.roles?.[0]?.name || u?.roles?.[0]?.code || u?.user?.role;
      if (typeof role === 'object') role = role?.name || role?.code;
      if (uid) {
        const uidLower = String(uid).toLowerCase();
        if (email && typeof email === 'string' && email.includes('@')) {
          emailMap.set(uidLower, email.toLowerCase());
        }
        if (role && typeof role === 'string') {
          roleMap.set(uidLower, String(role));
        }
      }
      if (email && typeof email === 'string' && email.includes('@')) {
        const emailLower = email.toLowerCase();
        if (role && typeof role === 'string') {
          roleMap.set(emailLower, String(role));
        }
      }
    };
    if (Array.isArray(tenantUsers)) tenantUsers.forEach(extractUser);
    else if (tenantUsers && Array.isArray((tenantUsers as any).items)) (tenantUsers as any).items.forEach(extractUser);
    else if (tenantUsers && Array.isArray((tenantUsers as any).users)) (tenantUsers as any).users.forEach(extractUser);
    else if (tenantUsers && Array.isArray((tenantUsers as any).data)) (tenantUsers as any).data.forEach(extractUser);
    return { emailMap, roleMap };
  }, [tenantUsers]);

  const { data: reportData, isLoading } = useAdminActivityReport({ limit: 100 });
  const { data: dashboardMetrics } = useDashboardMetrics(filters);

  const rawData: AdminActivityReportType[] = (reportData as any)?.items || reportData?.data || [];

  // Filter raw data based on active applied filters
  const filteredRawData = rawData.filter((row: any) => {
    if (filters.action && row.action !== filters.action) return false;
    if (filters.entityType && row.entityType !== filters.entityType) return false;
    if (filters.tenantId && row.tenantId !== filters.tenantId) return false;
    if (filters.status && row.outcome !== filters.status) return false;
    if (filters.days) {
      if (!row.createdAt) return false;
      const logDate = new Date(row.createdAt);
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - filters.days);
      if (logDate < cutoff) return false;
    }
    return true;
  });

  const uniqueActions = Array.from(new Set(rawData.map((d: any) => d.action))).filter(Boolean);
  const uniqueEntityTypes = Array.from(new Set(rawData.map((d: any) => d.entityType))).filter(Boolean);
  const uniqueOutcomes = Array.from(new Set(rawData.map((d: any) => d.outcome))).filter(Boolean);

  const handleApply = () => {
    setFilters(prev => ({ 
      ...prev, 
      days: localFilters.days,
      action: localFilters.action,
      entityType: localFilters.entityType,
      status: localFilters.outcome,
      tenantId: localFilters.tenantId,
      page: 1 
    }));
    setIsApplied(true);
    setVisibleCount(6);
  };

  const handleClear = () => {
    setLocalFilters({});
    setFilters({});
    setSearch('');
    setIsApplied(false);
    setVisibleCount(6);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setVisibleCount(6);
  };

  const handleClearSearch = () => {
    setSearch('');
    setVisibleCount(6);
  };

  // Instant in-memory search filtering
  let displayData = [...filteredRawData];
  if (search.trim()) {
    const q = search.trim().toLowerCase();
    displayData = displayData.filter((d: any) =>
      (d.actorUserId || '').toLowerCase().includes(q) ||
      (d.action || '').toLowerCase().includes(q) ||
      (d.entityType || '').toLowerCase().includes(q) ||
      (d.entityId || '').toLowerCase().includes(q) ||
      (d.outcome || '').toLowerCase().includes(q)
    );
  }

  let sortedData = [...displayData];
  if (sortConfig) {
    sortedData.sort((a: any, b: any) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];
      if (aVal == null) aVal = '';
      if (bVal == null) bVal = '';
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }

  const visibleData = sortedData.slice(0, visibleCount);
  const totalCount = sortedData.length;
  const hasMore = visibleCount < sortedData.length;

  // Overview metrics calculations
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const priorMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const priorYear = currentMonth === 0 ? currentYear - 1 : currentYear;

  const totalActions = displayData.length;
  const thisMonthActions = displayData.filter((d: any) => {
    const date = new Date(d.createdAt);
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  }).length;
  const priorMonthActions = displayData.filter((d: any) => {
    const date = new Date(d.createdAt);
    return date.getMonth() === priorMonth && date.getFullYear() === priorYear;
  }).length;

  const actionsTrend = priorMonthActions > 0 
    ? parseFloat((((thisMonthActions - priorMonthActions) / priorMonthActions) * 100).toFixed(1))
    : (thisMonthActions > 0 ? 100 : 0);

  const uniqueAdmins = Array.from(new Set(displayData.map((d: any) => d.actorUserId).filter(Boolean))).length;
  
  const securityEvents = displayData.filter((d: any) => {
    const act = (d.action || '').toUpperCase();
    return act.includes('ROLE') || act.includes('PERMISSION') || act.includes('AUTH') || act.includes('PASSWORD') || act.includes('RBAC');
  }).length;

  const failedActions = displayData.filter((d: any) => {
    const out = (d.outcome || '').toUpperCase();
    return out === 'FAILURE' || out === 'FAILED' || out === 'DENIED' || out === 'ERROR';
  }).length;

  const successActions = totalActions - failedActions;
  const successRate = totalActions > 0 ? Math.round((successActions / totalActions) * 100) : 100;

  // Breakdown metrics
  const actionCounts = displayData.reduce((acc: any, curr: any) => {
    const name = curr.action || 'Unknown';
    acc[name] = (acc[name] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const colorPalette = ['var(--c-honey)', 'var(--c-sage)', 'var(--c-clay)', 'var(--sage)', 'var(--honey)', 'var(--c-clay)', 'var(--c-clay)'];
  const dynamicActionDistribution = Object.entries(actionCounts).map(([name, value], i) => ({
    name,
    value: value as number,
    color: colorPalette[i % colorPalette.length]
  }));

  const dynamicOutcomeData = [
    { name: 'Success', value: successActions, color: 'var(--sage)' },
    { name: 'Failed / Denied', value: failedActions, color: 'var(--c-clay)' },
  ].filter(d => d.value > 0);

  // Dynamic Monthly Timeline
  const monthlyTimelineMap = new Map<string, number>();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = d.toLocaleString('default', { month: 'short' });
    monthlyTimelineMap.set(label, 0);
  }

  displayData.forEach(item => {
    if (item.createdAt) {
      const d = new Date(item.createdAt);
      const label = d.toLocaleString('default', { month: 'short' });
      if (monthlyTimelineMap.has(label)) {
        monthlyTimelineMap.set(label, (monthlyTimelineMap.get(label) || 0) + 1);
      }
    }
  });

  const dynamicTrendData = Array.from(monthlyTimelineMap.entries()).map(([day, rate]) => ({
    day,
    rate
  }));

  const handleExportCSV = () => {
    if (!sortedData || sortedData.length === 0) return;
    const exportData = sortedData.map((row: any) => ({
      Timestamp: new Date(row.createdAt).toLocaleString(),
      'Admin / Actor': row.actorUserId || 'System',
      Action: row.action || '-',
      Resource: `${row.entityType || ''} ${row.entityId || ''}`.trim() || '-',
      Tenant: row.tenantId || 'Global',
      Status: row.outcome || 'SUCCESS',
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const csv = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'admin_activity_report.csv';
    link.click();
  };

  const handleExportExcel = () => {
    if (!sortedData || sortedData.length === 0) return;
    const exportData = sortedData.map((row: any) => ({
      Timestamp: new Date(row.createdAt).toLocaleString(),
      'Admin / Actor': row.actorUserId || 'System',
      Action: row.action || '-',
      Resource: `${row.entityType || ''} ${row.entityId || ''}`.trim() || '-',
      Tenant: row.tenantId || 'Global',
      Status: row.outcome || 'SUCCESS',
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Audit Log');
    XLSX.writeFile(wb, 'admin_activity_report.xlsx');
  };

  if (isLoading && !reportData) {
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
    <div>
      {/* Breadcrumb / Header */}
      <div className="mb-3.5">
        <Link to="/admin/reports" className="inline-flex items-center text-[12px] font-medium text-[var(--ink-mute)] uppercase tracking-wider hover:text-[var(--c-honey)] transition-colors">
          <ArrowLeft className="w-3.5 h-3.5 mr-1" />
          REPORTS
        </Link>
      </div>

      <div className="flex flex-col md:flex-row md:justify-between items-start md:items-center gap-4 mb-6">
        <div className="w-full md:w-auto">
          <div className="flex items-center text-[12px] text-[var(--ink-mute)] uppercase tracking-wider mb-[6px] font-medium ard-eyebrow">
            Admin activity · Audit log
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1.5">
            Admin Activity & Audit Log
          </h1>
          <p className="text-[var(--ink-mute)] text-sm break-words">
            Track administrative actions, RBAC security changes, and system access logs.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button onClick={handleExportCSV} className="px-[20px] py-[8px] bg-[var(--hero-bg)] text-[var(--ink)] font-[var(--fw-medium)] rounded-[var(--r-pill)] text-[length:var(--fs-body)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-md)] border border-[var(--c-honey-soft)] cursor-pointer flex items-center whitespace-nowrap">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </button>
          <button onClick={handleExportExcel} className="px-[20px] py-[8px] bg-[var(--hero-bg)] text-[var(--ink)] font-[var(--fw-medium)] rounded-[var(--r-pill)] text-[length:var(--fs-body)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-md)] border border-[var(--c-honey-soft)] cursor-pointer flex items-center whitespace-nowrap">
            <Download className="w-4 h-4 mr-2" />
            Export Excel
          </button>
        </div>
      </div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard 
          title="TOTAL ACTIONS" 
          value={totalActions.toLocaleString()} 
          trend={actionsTrend !== 0 ? actionsTrend : undefined} 
          trendSuffix="%"
          trendLabel="vs prior period"
          icon={BarChart2}
          iconBgColor="bg-[var(--honey-wash)]" 
          iconColor="text-[var(--c-honey)]" 
        />
        <StatCard 
          title="ACTIVE ADMINS" 
          value={uniqueAdmins.toLocaleString()} 
          trend={uniqueAdmins > 0 ? `+${uniqueAdmins}` : undefined} 
          trendSuffix=""
          trendLabel="unique actors"
          icon={Users}
          iconBgColor="bg-[var(--sage-wash)]" 
          iconColor="text-[var(--c-sage)]" 
        />
        <StatCard 
          title="SECURITY & RBAC" 
          value={securityEvents.toLocaleString()} 
          trend={securityEvents > 0 ? `+${securityEvents}` : undefined} 
          trendSuffix=""
          trendLabel="governance events"
          icon={Shield}
          iconBgColor="bg-[var(--honey-wash)]" 
          iconColor="text-[var(--c-honey)]" 
        />
        <StatCard 
          title="FAILED / BLOCKED" 
          value={failedActions.toLocaleString()} 
          trend={failedActions > 0 ? `+${failedActions}` : undefined} 
          trendSuffix=""
          trendLabel="vs prior period"
          trendColorMode="inverse"
          icon={User}
          iconBgColor="bg-[var(--clay-wash)]" 
          iconColor="text-[var(--c-clay)]" 
        />
      </div>

      {/* Filters */}
      <div className="bg-[var(--paper)] rounded-[var(--r-lg)] border border-[var(--line)] shadow-[var(--shadow-sm)] mb-6 flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-md)]">
        <div className="px-[22px] py-[16px] border-b border-[var(--line)] card-head">
          <span className="text-[length:var(--fs-label)] font-[var(--fw-bold)] text-[var(--ink-mute)] tracking-[var(--ls-label,0.16em)] uppercase">
            Filters
          </span>
        </div>
        <div className="py-[18px] px-[22px] card-body">
          <div className="flex flex-col xl:flex-row items-stretch xl:items-center gap-3">
            <div className="relative flex-1 min-w-[130px]">
              <CustomSelect
                placeholder="Last 30 days"
                value={localFilters.days || ''}
                onChange={(val) => setLocalFilters(prev => ({ ...prev, days: val ? (val === 'all' ? undefined : Number(val)) : undefined }))}
                options={[
                  { value: '7', label: 'Last 7 days' },
                  { value: '30', label: 'Last 30 days' },
                  { value: '90', label: 'Last 90 days' },
                  { value: '365', label: 'This year' },
                  { value: 'all', label: 'All time' }
                ]}
              />
            </div>

            <div className="relative flex-1 min-w-[130px]">
              <CustomSelect
                placeholder="All actions"
                value={localFilters.action || ''}
                onChange={(val) => setLocalFilters(prev => ({ ...prev, action: val || undefined }))}
                options={uniqueActions.map((a: any) => ({ value: a, label: a }))}
              />
            </div>

            <div className="relative flex-1 min-w-[130px]">
              <CustomSelect
                placeholder="All resources"
                value={localFilters.entityType || ''}
                onChange={(val) => setLocalFilters(prev => ({ ...prev, entityType: val || undefined }))}
                options={uniqueEntityTypes.map((e: any) => ({ value: e, label: e }))}
              />
            </div>

            <div className="relative flex-1 min-w-[130px]">
              <CustomSelect
                placeholder="All outcomes"
                value={localFilters.outcome || ''}
                onChange={(val) => setLocalFilters(prev => ({ ...prev, outcome: val || undefined }))}
                options={uniqueOutcomes.map((o: any) => ({ value: o, label: o }))}
              />
            </div>

            <div className="relative flex-1 min-w-[130px]">
              <CustomSelect
                placeholder="All tenants"
                value={localFilters.tenantId || ''}
                onChange={(val) => setLocalFilters(prev => ({ ...prev, tenantId: val || undefined }))}
                options={tenants.map((t: any) => ({ value: t.id, label: t.name }))}
              />
            </div>

            <div className="flex items-center">
              {isApplied ? (
                <button
                  onClick={handleClear}
                  className="h-10 px-[24px] bg-[var(--surface)] hover:bg-[var(--surface-wash)] text-[var(--ink)] font-[var(--fw-semibold)] text-[length:var(--fs-meta)] rounded-[var(--r-pill)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[var(--shadow-sm)] border border-[var(--line)] whitespace-nowrap shadow-[var(--shadow-xs)] cursor-pointer"
                >
                  Clear
                </button>
              ) : (
                <button
                  onClick={handleApply}
                  className="h-10 px-[24px] bg-[var(--btn)] hover:bg-[var(--btn-hover)] text-[var(--btn-ink)] font-[var(--fw-semibold)] text-[length:var(--fs-meta)] rounded-[var(--r-pill)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[var(--shadow-sm)] border border-[var(--honey)] whitespace-nowrap shadow-[var(--shadow-xs)] nexus-btn sm cursor-pointer"
                >
                  Apply
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="bg-[var(--paper)] rounded-[var(--r-lg)] border border-[var(--line)] shadow-[var(--shadow-sm)] mb-6 flex flex-col overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-md)]">
        <div className="px-[22px] py-[16px] border-b border-[var(--line)] flex justify-between items-center card-head">
          <h3 className="text-[length:var(--fs-h3)] font-[var(--fw-semibold)] text-[var(--ink)]">
            Audit activity & event breakdown
          </h3>
          <span 
            className="h-[20px] px-[10px] flex items-center justify-center text-[length:var(--fs-label)] font-[var(--fw-medium)] text-[var(--ink-mute)] bg-[var(--surface)] rounded-[var(--r-pill)] border border-[var(--line)]"
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            Last 30 days · Daily
          </span>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-0 min-h-[320px] card-body relative py-[18px] px-[22px]">
          <div className="lg:col-span-6 px-[14px] flex flex-col">
            <LineChartWidget 
              title=""
              data={dynamicTrendData}
              xKey="day"
              yKey="rate"
              color="var(--c-honey)"
              variant="bare"
            />
          </div>
          
          <div className="hidden lg:block w-px bg-[var(--line)] absolute left-[50%] top-[18px] bottom-[18px] -translate-x-1/2" />
          
          <div className="lg:col-span-3 py-[18px] px-[28px] flex flex-col ard-chart-col relative">
            <DonutChartWidget 
              title="OUTCOME RATE"
              data={dynamicOutcomeData}
              centerLabel={`${successRate}%`}
              centerSubLabel="SUCCESS"
              variant="bare"
              hideLegend={true}
              roundedCaps={true}
            />
            <div className="flex justify-center pb-[4px]">
              <span className="bg-[var(--sage-wash)] text-[var(--sage-text)] text-[length:var(--fs-label)] font-[var(--fw-semibold)] px-[12px] py-[4px] rounded-[var(--r-pill)] flex items-center justify-center gap-1.5 uppercase tracking-wider">
                <Check className="w-3.5 h-3.5" />
                VERIFIED
              </span>
            </div>
          </div>
          
          <div className="hidden lg:block w-px bg-[var(--line)] absolute left-[75%] top-[18px] bottom-[18px] -translate-x-1/2" />
          
          <div className="lg:col-span-3 py-[18px] px-[28px] flex flex-col ard-chart-col">
            <DonutChartWidget 
              title="ACTION TYPES"
              data={dynamicActionDistribution.slice(0, 5)}
              centerLabel={totalActions.toString()}
              centerSubLabel="TOTAL"
              variant="bare"
              ariaLabel="Action type distribution"
              chartSpacingClass="mt-4 mb-4"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-[var(--r-lg)] border border-[var(--line)] shadow-[var(--shadow-sm)] overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-md)]">
        <div className="py-[14px] px-[16px] border-b border-[var(--line)] flex flex-col sm:flex-row justify-between gap-4 sm:items-center bg-[var(--surface)]">
          <div className="relative w-full sm:flex-1">
            <Search className="w-4 h-4 text-[var(--ink-mute)] absolute left-[12px] top-1/2 -translate-y-1/2 pointer-events-none" />
            <input 
              type="text" 
              placeholder="Search by admin name, action, resource, or status..." 
              value={search}
              onChange={handleSearch}
              className="h-[36px] w-full py-0 pr-[36px] pl-[34px] border border-[var(--line)] bg-[var(--paper)] rounded-[var(--r-md)] text-[length:var(--fs-body)] font-[var(--fw-regular)] text-[var(--ink)] placeholder:text-[var(--ink-mute)] focus:outline-none focus:border-[var(--ink-soft)] transition-colors"
            />
            {search && (
              <button 
                onClick={handleClearSearch}
                aria-label="Clear search"
                className="absolute right-[10px] top-1/2 -translate-y-1/2 p-1 rounded-full text-[var(--ink-mute)] hover:text-[var(--ink)] hover:bg-[var(--surface-wash)] transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <span className="text-[length:var(--fs-meta)] font-[var(--fw-medium)] text-[var(--ink-faint)] whitespace-nowrap">Click a column to sort</span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-[length:var(--fs-body)] text-left text-[var(--ink)]">
            <thead 
              className="text-[length:var(--fs-label)] text-[var(--ink-mute)] uppercase bg-[#FAFAFA] border-b border-[var(--line)] font-[var(--fw-bold)] tracking-widest"
              style={{ fontFamily: 'var(--font-serif)' }}
            >
              <tr>
                <th className="py-[14px] px-[16px] whitespace-nowrap cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('createdAt')}>
                  Timestamp <span className="ml-1 text-[var(--ink-faint)] font-[var(--fw-regular)]">{sortConfig?.key === 'createdAt' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}</span>
                </th>
                <th className="py-[14px] px-[16px] whitespace-nowrap cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('actorUserId')}>
                  Admin / Actor <span className="ml-1 text-[var(--ink-faint)] font-[var(--fw-regular)]">{sortConfig?.key === 'actorUserId' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}</span>
                </th>
                <th className="py-[14px] px-[16px] whitespace-nowrap cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('action')}>
                  Action <span className="ml-1 text-[var(--ink-faint)] font-[var(--fw-regular)]">{sortConfig?.key === 'action' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}</span>
                </th>
                <th className="py-[14px] px-[16px] whitespace-nowrap cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('entityType')}>
                  Resource <span className="ml-1 text-[var(--ink-faint)] font-[var(--fw-regular)]">{sortConfig?.key === 'entityType' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}</span>
                </th>
                <th className="py-[14px] px-[16px] whitespace-nowrap cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('tenantId')}>
                  Tenant <span className="ml-1 text-[var(--ink-faint)] font-[var(--fw-regular)]">{sortConfig?.key === 'tenantId' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}</span>
                </th>
                <th className="py-[14px] px-[16px] whitespace-nowrap text-center cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('outcome')}>
                  Status <span className="ml-1 text-[var(--ink-faint)] font-[var(--fw-regular)]">{sortConfig?.key === 'outcome' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {visibleData.map((row: any) => {
                const isSuccess = (row.outcome || 'SUCCESS').toUpperCase() === 'SUCCESS';
                return (
                  <tr key={row.id} className="border-b border-[var(--line)] hover:bg-[var(--surface-wash)] transition-colors">
                    <td className="py-[14px] px-[16px] font-mono text-[length:var(--fs-meta)] text-[var(--ink-mute)] whitespace-nowrap">
                      {row.createdAt ? new Date(row.createdAt).toLocaleString() : '-'}
                    </td>
                    <td className="py-[14px] px-[16px] font-[var(--fw-medium)] text-[var(--ink)]">
                      <div className="flex flex-col">
                        <span className="font-medium text-sm text-[var(--ink)] font-sans leading-tight">
                          {row.actorEmail || userLookupMap.emailMap.get(String(row.actorUserId).toLowerCase()) || (row.actorUserId === "system" ? "System" : row.actorUserId || "System")}
                        </span>
                        {(row.actorRole || userLookupMap.roleMap.get(String(row.actorUserId).toLowerCase())) && (
                          <span className="text-[11px] font-bold text-[var(--ink-mute)] uppercase tracking-wider">
                            {row.actorRole || userLookupMap.roleMap.get(String(row.actorUserId).toLowerCase())}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-[14px] px-[16px]">
                      <span className="font-[var(--fw-medium)]">{row.action}</span>
                    </td>
                    <td className="py-[14px] px-[16px] text-[var(--ink-mute)]">
                      {row.entityType ? `${row.entityType} ${row.entityId || ''}`.trim() : '-'}
                    </td>
                    <td className="py-[14px] px-[16px] text-[var(--ink-mute)]">
                      {row.tenantId || 'Global'}
                    </td>
                    <td className="py-[14px] px-[16px] text-center">
                      <span className={`inline-flex items-center px-[10px] py-[3px] rounded-[var(--r-pill)] text-[length:var(--fs-label)] font-[var(--fw-semibold)] uppercase tracking-wider ${
                        isSuccess ? 'bg-[var(--sage-wash)] text-[var(--sage-text)]' : 'bg-[var(--clay-wash)] text-[var(--c-clay)]'
                      }`}>
                        {row.outcome || 'SUCCESS'}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {visibleData.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-[24px] px-[16px] text-center text-[var(--ink-mute)]">
                    {search ? `No activity records match "${search}".` : 'No admin activity records found.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="py-[14px] px-[16px] border-t border-[var(--line)] text-center">
          <span
            className="text-[length:var(--fs-meta)] font-[var(--fw-medium)] text-[var(--ink-mute)]"
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            Showing {visibleData.length} of {totalCount} activity logs
            {search && ` (filtered by "${search}")`}
            {hasMore && (
              <>
                {' · '}
                <button
                  onClick={() => setVisibleCount(v => v + 6)}
                  className="text-[var(--c-honey)] hover:underline font-[var(--fw-semibold)] cursor-pointer"
                >
                  Load more
                </button>
              </>
            )}
          </span>
        </div>
      </div>
    </div>
  );
};

