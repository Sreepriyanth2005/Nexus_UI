import React, { useState } from 'react';
import {
  CheckCircle2, ChevronDown, Download, ArrowLeft, Search, X
} from 'lucide-react';
import { Shield, BarChart2, User, CheckSquare, Check } from '../../../assets/icons';
import { StatCard } from '../../../components/Reports/StatCard';
import { LineChartWidget } from '../../../components/Reports/LineChartWidget';
import { DonutChartWidget } from '../../../components/Reports/DonutChartWidget';

import { Link } from "react-router";
import { useQuery } from '@tanstack/react-query';
import { getTenantUsersApi } from '../../../core/api/tenantuser.api';
import { useCategories } from '../../../hooks/category/useCategories';
import { useSubjects } from '../../../hooks/useSubjects';
import { useCourses } from '../../../hooks/course/useCourses';
import { useRoles } from '../../../hooks/useRolesPermissions';
import { getTenantsApi } from '../../../core/api/tenant.api';
import { useCertificateReport, useReportingCountries, useDashboardMetrics } from '../../../hooks/useReports';
import { ReportFilter, CertificateReport } from '../../../types/reports.types';
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
            className={`px-3 py-2 mb-0.5 rounded-[var(--r-md)] cursor-pointer text-[length:var(--fs-body)] transition-colors ${!value ? 'bg-[var(--c-honey-wash)] text-[var(--ink)] font-[var(--fw-medium)]' : 'text-[var(--ink-mute)] hover:text-[var(--ink)] hover:bg-[var(--surface-wash)]'}`}
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

export const LearningCredentialReport: React.FC = () => {
  const [filters, setFilters] = useState<ReportFilter>({});
  const [localFilters, setLocalFilters] = useState<{
    days?: number;
    courseId?: string;
    categoryId?: string;
    subjectId?: string;
    roleId?: string;
    country?: string;
    tenantId?: string;
  }>({});
  const [search, setSearch] = useState('');
  const [isApplied, setIsApplied] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<any | null>(null);
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
    const extractUser = (u: any) => {
      if (!u) return;
      const uid = u?.id || u?.userId || u?.user?.id || u?.actorUserId || u?.keycloakId;
      const email = u?.email || u?.user?.email || u?.actorEmail;
      if (uid && email && typeof email === 'string' && email.includes('@')) {
        emailMap.set(String(uid).toLowerCase(), email.toLowerCase());
      }
    };
    if (Array.isArray(tenantUsers)) tenantUsers.forEach(extractUser);
    else if (tenantUsers && Array.isArray((tenantUsers as any).items)) (tenantUsers as any).items.forEach(extractUser);
    else if (tenantUsers && Array.isArray((tenantUsers as any).users)) (tenantUsers as any).users.forEach(extractUser);
    else if (tenantUsers && Array.isArray((tenantUsers as any).data)) (tenantUsers as any).data.forEach(extractUser);
    return { emailMap };
  }, [tenantUsers]);

  const { data: reportData, isLoading } = useCertificateReport({ limit: 100 });
  const { categories } = useCategories();
  const { subjects } = useSubjects();
  const { courses } = useCourses();
  const { data: roles } = useRoles();
  const { data: countries } = useReportingCountries({ tenantId: localFilters.tenantId });
  const { data: dashboardMetrics } = useDashboardMetrics(filters);

  const categoriesList = categories || [];
  const subjectsList = subjects || [];
  const coursesList = courses?.data?.data || [];

  const handleApply = () => {
    setFilters(prev => ({ ...prev, ...localFilters, page: 1 }));
    setIsApplied(true);
    setVisibleCount(6);
  };

  const handleClear = () => {
    setLocalFilters({});
    setFilters({});
    setSearch('');
    setIsApplied(false);
    setSelectedCourse(null);
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

  const rawData: CertificateReport[] = reportData?.data || [];

  // Filter raw data based on active filters
  const filteredRawData = rawData.filter((row: CertificateReport) => {
    if (filters.courseId && row.courseId !== filters.courseId) return false;
    if (filters.tenantId && row.tenantId !== filters.tenantId) return false;
    if (filters.days) {
      if (!row.issueDate) return false;
      const certDate = new Date(row.issueDate);
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - filters.days);
      if (certDate < cutoff) return false;
    }
    return true;
  });

  // Date helpers for calculating real period comparisons
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const priorMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const priorYear = currentMonth === 0 ? currentYear - 1 : currentYear;

  // Aggregate raw certificates by course
  const courseMap = new Map<string, any>();

  filteredRawData.forEach((row: CertificateReport) => {
    const courseId = row.courseId || row.courseName || 'Unknown Course';
    const courseName = row.courseName || 'Unknown Course';

    if (!courseMap.has(courseId)) {
      courseMap.set(courseId, {
        courseId,
        courseName,
        issued: 0,
        thisMonth: 0,
        priorMonth: 0,
        revoked: 0,
        verifiedCount: 0,
        verifiedScore: 0,
        tenant: row.tenantName || 'Unknown Tenant',
        certificates: [] as CertificateReport[]
      });
    }

    const course = courseMap.get(courseId);
    course.certificates.push(row);
    course.issued += 1;

    const issueDate = row.issueDate ? new Date(row.issueDate) : new Date();
    if (issueDate.getMonth() === currentMonth && issueDate.getFullYear() === currentYear) {
      course.thisMonth += 1;
    } else if (issueDate.getMonth() === priorMonth && issueDate.getFullYear() === priorYear) {
      course.priorMonth += 1;
    }

    if (row.isRevoked) {
      course.revoked += 1;
    } else if (row.isVerified) {
      course.verifiedCount += 1;
    }
  });

  // Compute verification rate % for each course
  Array.from(courseMap.values()).forEach((course: any) => {
    course.verifiedScore = course.issued > 0
      ? Math.round((course.verifiedCount / course.issued) * 100)
      : 0;
  });

  const baseAggregatedData = Array.from(courseMap.values());

  const displayData = selectedCourse
    ? baseAggregatedData.filter((c: any) => (c.courseId || c.courseName) === (selectedCourse.courseId || selectedCourse.courseName))
    : baseAggregatedData;

  // Filter display data based on live table search (text by text instant filtering)
  let tableData = [...displayData];
  if (search.trim() && !selectedCourse) {
    const q = search.trim().toLowerCase();
    tableData = tableData.filter((row: any) =>
      row.courseName?.toLowerCase().includes(q) ||
      row.tenant?.toLowerCase().includes(q)
    );
  }

  let sortedData = [...tableData];
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

  // Filter drill-in certificates list text-by-text
  const drillInCertificates = (selectedCourse?.certificates || []).filter((cert: CertificateReport) => {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return (
      cert.userName?.toLowerCase().includes(q) ||
      cert.userId?.toLowerCase().includes(q) ||
      cert.serialNumber?.toLowerCase().includes(q) ||
      cert.tenantName?.toLowerCase().includes(q) ||
      (cert.isVerified && !cert.isRevoked ? 'verified' : cert.isRevoked ? 'revoked' : 'pending').includes(q)
    );
  });

  // Calculate Real Overview Metrics on the currently searched/filtered subset
  const activeCertificateList: CertificateReport[] = selectedCourse
    ? drillInCertificates
    : (search.trim() ? tableData.flatMap((c: any) => c.certificates) : filteredRawData);

  const totalIssued = activeCertificateList.length;
  const totalThisMonth = activeCertificateList.filter((r: CertificateReport) => {
    const d = r.issueDate ? new Date(r.issueDate) : new Date();
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  }).length;
  const totalPriorMonth = activeCertificateList.filter((r: CertificateReport) => {
    const d = r.issueDate ? new Date(r.issueDate) : new Date();
    return d.getMonth() === priorMonth && d.getFullYear() === priorYear;
  }).length;
  const totalRevoked = activeCertificateList.filter((r: CertificateReport) => r.isRevoked).length;
  const totalVerified = activeCertificateList.filter((r: CertificateReport) => r.isVerified && !r.isRevoked).length;
  const avgVerificationRate = totalIssued > 0 ? Math.round((totalVerified / totalIssued) * 100) : 0;

  // Calculate Real Dynamic Trends (comparing current vs prior period)
  const proofsTrend = totalPriorMonth > 0
    ? parseFloat((((totalThisMonth - totalPriorMonth) / totalPriorMonth) * 100).toFixed(1))
    : (totalThisMonth > 0 ? 100 : 0);

  const issuedMonthDelta = totalThisMonth - totalPriorMonth;
  const issuedMonthTrend = totalPriorMonth > 0 || totalThisMonth > 0 ? issuedMonthDelta : undefined;

  const priorVerifiedCount = activeCertificateList.filter(r => {
    if (!r.issueDate) return false;
    const d = new Date(r.issueDate);
    return d.getMonth() === priorMonth && d.getFullYear() === priorYear && r.isVerified && !r.isRevoked;
  }).length;
  const priorVerificationRate = totalPriorMonth > 0 ? Math.round((priorVerifiedCount / totalPriorMonth) * 100) : avgVerificationRate;
  const verificationRateDelta = parseFloat((avgVerificationRate - priorVerificationRate).toFixed(1));

  // Breakdown metrics
  const totalPending = Math.max(0, totalIssued - totalVerified - totalRevoked);
  const breakdownTotal = totalVerified + totalPending + totalRevoked;
  const dynamicBreakdownData = [
    { name: 'Verified', value: breakdownTotal > 0 ? Math.round((totalVerified / breakdownTotal) * 100) : 0, color: 'var(--sage)' },
    { name: 'Pending', value: breakdownTotal > 0 ? Math.round((totalPending / breakdownTotal) * 100) : 0, color: 'var(--c-honey)' },
    { name: 'Revoked', value: breakdownTotal > 0 ? Math.round((totalRevoked / breakdownTotal) * 100) : 0, color: 'var(--c-clay)' },
  ].filter(d => d.value > 0);

  const dynamicScoreData = [
    { name: 'Verified', value: avgVerificationRate, color: 'var(--sage)' },
    { name: 'Remaining', value: Math.max(0, 100 - avgVerificationRate), color: 'var(--surface-3)' },
  ];

  // Dynamic Monthly Issuance Timeline from actual active certificate issuance dates
  const monthlyTimelineMap = new Map<string, number>();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = d.toLocaleString('default', { month: 'short' });
    monthlyTimelineMap.set(label, 0);
  }

  activeCertificateList.forEach(cert => {
    if (cert.issueDate) {
      const d = new Date(cert.issueDate);
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
    if (selectedCourse) {
      const exportData = drillInCertificates.map((row: CertificateReport) => ({
        Recipient: row.userName || row.userId || 'Unknown',
        Course: row.courseName || selectedCourse.courseName || 'Unknown',
        'Issue Date': row.issueDate ? new Date(row.issueDate).toLocaleDateString() : 'N/A',
        'Serial Number': row.serialNumber || '-',
        'Status': row.isVerified && !row.isRevoked ? 'Verified' : row.isRevoked ? 'Revoked' : 'Pending',
        'Tenant': row.tenantName || 'N/A'
      }));
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const csvContent = XLSX.utils.sheet_to_csv(worksheet);
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `credential_issuance_${selectedCourse.courseName.replace(/\s+/g, '_')}.csv`;
      link.click();
    } else {
      if (!sortedData || sortedData.length === 0) return;
      const exportData = sortedData.map(row => ({
        Course: row.courseName || 'Unknown',
        'Total Issued': row.issued || 0,
        'Issued This Month': row.thisMonth || 0,
        'Revoked': row.revoked || 0,
        'Verification Rate (%)': `${row.verifiedScore || 0}%`,
        'Tenant': row.tenant || 'Unknown'
      }));
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const csvContent = XLSX.utils.sheet_to_csv(worksheet);
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'learning_credential_report.csv';
      link.click();
    }
  };

  const handleExportExcel = () => {
    if (selectedCourse) {
      const exportData = drillInCertificates.map((row: CertificateReport) => ({
        Recipient: row.userName || row.userId || 'Unknown',
        Course: row.courseName || selectedCourse.courseName || 'Unknown',
        'Issue Date': row.issueDate ? new Date(row.issueDate).toLocaleDateString() : 'N/A',
        'Serial Number': row.serialNumber || '-',
        'Status': row.isVerified && !row.isRevoked ? 'Verified' : row.isRevoked ? 'Revoked' : 'Pending',
        'Tenant': row.tenantName || 'N/A'
      }));
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Certificates');
      XLSX.writeFile(workbook, `credential_issuance_${selectedCourse.courseName.replace(/\s+/g, '_')}.xlsx`);
    } else {
      if (!sortedData || sortedData.length === 0) return;
      const exportData = sortedData.map(row => ({
        Course: row.courseName || 'Unknown',
        'Total Issued': row.issued || 0,
        'Issued This Month': row.thisMonth || 0,
        'Revoked': row.revoked || 0,
        'Verification Rate (%)': `${row.verifiedScore || 0}%`,
        'Tenant': row.tenant || 'Unknown'
      }));
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Credentials');
      XLSX.writeFile(workbook, 'learning_credential_report.xlsx');
    }
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
            Learning credential · Drill-in
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1.5">
            {selectedCourse ? `Credentials · ${selectedCourse.courseName || 'Unknown Course'}` : 'Learning credential issuance report'}
          </h1>
          <p className="text-[var(--ink-mute)] text-sm break-words">
            Last 30 days · All credentials · All categories
            {selectedCourse && (
              <button
                onClick={() => {
                  setSelectedCourse(null);
                  setSearch('');
                }}
                className="ml-2 text-orange-600 hover:text-orange-800 font-medium cursor-pointer inline-block"
              >
                Show all courses
              </button>
            )}
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
          title="PROOFS ISSUED"
          value={totalIssued.toLocaleString()}
          trend={selectedCourse ? undefined : proofsTrend}
          trendLabel="vs prior period"
          icon={Shield}
          iconBgColor="bg-[var(--honey-wash)]"
          iconColor="text-[var(--c-honey)]"
        />
        <StatCard
          title="ISSUED THIS MONTH"
          value={totalThisMonth.toLocaleString()}
          trend={selectedCourse ? undefined : (issuedMonthTrend !== undefined ? `${issuedMonthTrend >= 0 ? '+' : ''}${issuedMonthTrend}` : undefined)}
          trendSuffix=""
          trendLabel="vs prior period"
          icon={BarChart2}
          iconBgColor="bg-[var(--sage-wash)]"
          iconColor="text-[var(--c-sage)]"
        />
        <StatCard
          title="REVOKED"
          value={totalRevoked.toLocaleString()}
          trend={selectedCourse ? undefined : (totalRevoked > 0 ? `+${totalRevoked}` : undefined)}
          trendSuffix=""
          trendLabel="vs prior period"
          trendColorMode="inverse"
          icon={User}
          iconBgColor="bg-[var(--clay-wash)]"
          iconColor="text-[var(--c-clay)]"
        />
        <StatCard
          title="VERIFICATION RATE"
          value={`${avgVerificationRate}%`}
          trend={selectedCourse ? undefined : (verificationRateDelta !== 0 ? verificationRateDelta : undefined)}
          trendSuffix="%"
          trendLabel="vs prior period"
          icon={CheckSquare}
          iconBgColor="bg-[var(--honey-wash)]"
          iconColor="text-[var(--c-honey)]"
        />
      </div>

      {/* Filters */}
      <div className="bg-[var(--paper)] rounded-[var(--r-lg)] border border-[var(--line)] shadow-[var(--shadow-sm)] mb-6 flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-md)]">
        <div className="px-[22px] py-[16px] border-b border-[var(--line)] card-head">
          <span className="text-[length:var(--fs-label)] font-[var(--fw-bold)] text-[var(--ink-mute)] tracking-[var(--ls-label,0.16em)] uppercase">
            Filters
          </span>
        </div>
        <div className="py-[18px] px-[22px] flex flex-col gap-4 card-body">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
            <div className="relative">
              <CustomSelect
                placeholder="Last 30 days"
                value={localFilters.days || ''}
                onChange={(val) => setLocalFilters(prev => ({ ...prev, days: val ? (val === 'all' ? undefined : Number(val)) : undefined }))}
                options={[
                  { value: '7', label: 'Last 7 days' },
                  { value: '90', label: 'Last 90 days' },
                  { value: '365', label: 'This year' },
                  { value: 'all', label: 'All time' }
                ]}
              />
            </div>

            <div className="relative">
              <CustomSelect
                placeholder="All courses"
                value={localFilters.courseId || ''}
                onChange={(val) => setLocalFilters(prev => ({ ...prev, courseId: val || undefined }))}
                options={coursesList.map((c: any) => ({ value: c.id || c.title, label: c.title }))}
              />
            </div>

            <div className="relative">
              <CustomSelect
                placeholder="All categories"
                value={localFilters.categoryId || ''}
                onChange={(val) => setLocalFilters(prev => ({ ...prev, categoryId: val || undefined }))}
                options={categoriesList.map((c: any) => ({ value: c.id, label: c.name }))}
              />
            </div>

            <div className="relative">
              <CustomSelect
                placeholder="All subjects"
                value={localFilters.subjectId || ''}
                onChange={(val) => setLocalFilters(prev => ({ ...prev, subjectId: val || undefined }))}
                options={subjectsList.map((s: any) => ({ value: s.id, label: s.name }))}
              />
            </div>

            <div className="relative">
              <CustomSelect
                placeholder="All roles"
                value={localFilters.roleId || ''}
                onChange={(val) => setLocalFilters(prev => ({ ...prev, roleId: val || undefined }))}
                options={roles?.map((r: any) => ({ value: r.id, label: r.name })) || []}
              />
            </div>

            <div className="relative">
              <CustomSelect
                placeholder="All countries"
                value={localFilters.country || ''}
                onChange={(val) => setLocalFilters(prev => ({ ...prev, country: val || undefined }))}
                options={countries?.map((c: string) => ({ value: c, label: c })) || []}
              />
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <CustomSelect
                placeholder="All tenants"
                value={localFilters.tenantId || ''}
                onChange={(val) => setLocalFilters(prev => ({ ...prev, tenantId: val || undefined }))}
                options={tenants.map((t: any) => ({ value: t.id, label: t.name }))}
              />
            </div>
            {isApplied ? (
              <button
                onClick={handleClear}
                className="py-[8px] px-[24px] bg-[var(--surface)] hover:bg-[var(--surface-wash)] text-[var(--ink)] font-[var(--fw-semibold)] text-[length:var(--fs-meta)] rounded-[var(--r-pill)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-md)] border border-[var(--line)] whitespace-nowrap shadow-[var(--shadow-xs)] cursor-pointer"
              >
                Clear
              </button>
            ) : (
              <button
                onClick={handleApply}
                className="py-[8px] px-[24px] bg-[var(--btn)] hover:bg-[var(--btn-hover)] text-[var(--btn-ink)] font-[var(--fw-semibold)] text-[length:var(--fs-meta)] rounded-[var(--r-pill)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-md)] border border-[var(--honey)] whitespace-nowrap shadow-[var(--shadow-xs)] nexus-btn sm"
              >
                Apply
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="bg-[var(--paper)] rounded-[var(--r-lg)] border border-[var(--line)] shadow-[var(--shadow-sm)] mb-6 flex flex-col overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-md)]">
        {/* Card Header */}
        <div className="px-[22px] py-[16px] border-b border-[var(--line)] flex justify-between items-center card-head">
          <h3 className="text-[length:var(--fs-h3)] font-[var(--fw-semibold)] text-[var(--ink)]">
            Credential issuance trend
          </h3>
          <span
            className="h-[20px] px-[10px] flex items-center justify-center text-[length:var(--fs-label)] font-[var(--fw-medium)] text-[var(--ink-mute)] bg-[var(--surface)] rounded-[var(--r-pill)] border border-[var(--line)]"
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            Last 30 days · Daily
          </span>
        </div>

        {/* Card Body with Grid */}
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

          {/* Divider */}
          <div className="hidden lg:block w-px bg-[var(--line)] absolute left-[50%] top-[18px] bottom-[18px] -translate-x-1/2" />

          <div className="lg:col-span-3 py-[18px] px-[28px] flex flex-col ard-chart-col relative">
            <DonutChartWidget
              title="VERIFICATION RATE"
              data={dynamicScoreData}
              centerLabel={`${avgVerificationRate}%`}
              centerSubLabel="VERIFIED"
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

          {/* Divider */}
          <div className="hidden lg:block w-px bg-[var(--line)] absolute left-[75%] top-[18px] bottom-[18px] -translate-x-1/2" />

          <div className="lg:col-span-3 py-[18px] px-[28px] flex flex-col ard-chart-col">
            <DonutChartWidget
              title="BREAKDOWN"
              data={dynamicBreakdownData}
              centerLabel={`${avgVerificationRate}%`}
              centerSubLabel="VERIFIED"
              variant="bare"
              ariaLabel="Verification breakdown donut"
              chartSpacingClass="mt-4 mb-4"
            />
          </div>
        </div>
      </div>

      {/* Custom Tailwind Table */}
      <div className="bg-white rounded-[var(--r-lg)] border border-[var(--line)] shadow-[var(--shadow-sm)] overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-md)]">
        <div className="py-[14px] px-[16px] border-b border-[var(--line)] flex flex-col sm:flex-row justify-between gap-4 sm:items-center bg-[var(--surface)]">
          <div className="relative w-full sm:flex-1">
            <Search className="w-4 h-4 text-[var(--ink-mute)] absolute left-[12px] top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder={selectedCourse ? "Search recipient name, serial number, tenant, status..." : "Search courses, credentials, or tenants..."}
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
          {!selectedCourse ? (
            <table className="w-full text-[length:var(--fs-body)] text-left text-[var(--ink)]">
              <thead
                className="text-[length:var(--fs-label)] text-[var(--ink-mute)] uppercase bg-[#FAFAFA] border-b border-[var(--line)] font-[var(--fw-bold)] tracking-widest"
                style={{ fontFamily: 'var(--font-serif)' }}
              >
                <tr>
                  <th className="py-[14px] px-[16px] whitespace-nowrap cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('courseName')}>
                    Course / Path <span className="ml-1 text-[var(--ink-faint)] font-[var(--fw-regular)]">{sortConfig?.key === 'courseName' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}</span>
                  </th>
                  <th className="py-[14px] px-[16px] whitespace-nowrap cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('issued')}>
                    Issued <span className="ml-1 text-[var(--ink-faint)] font-[var(--fw-regular)]">{sortConfig?.key === 'issued' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}</span>
                  </th>
                  <th className="py-[14px] px-[16px] whitespace-nowrap cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('thisMonth')}>
                    This Month <span className="ml-1 text-[var(--ink-faint)] font-[var(--fw-regular)]">{sortConfig?.key === 'thisMonth' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}</span>
                  </th>
                  <th className="py-[14px] px-[16px] whitespace-nowrap cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('revoked')}>
                    Revoked <span className="ml-1 text-[var(--ink-faint)] font-[var(--fw-regular)]">{sortConfig?.key === 'revoked' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}</span>
                  </th>
                  <th className="py-[14px] px-[16px] min-w-[200px] whitespace-nowrap cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('verifiedScore')}>
                    Verification Rate <span className="ml-1 text-[var(--ink-faint)] font-[var(--fw-regular)]">{sortConfig?.key === 'verifiedScore' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}</span>
                  </th>
                  <th className="py-[14px] px-[16px] whitespace-nowrap cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('tenant')}>
                    Tenant <span className="ml-1 text-[var(--ink-faint)] font-[var(--fw-regular)]">{sortConfig?.key === 'tenant' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}</span>
                  </th>
                  <th className="py-[14px] px-[16px] whitespace-nowrap text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleData.map((row, index) => {
                  const key = row.courseId || index;
                  const courseName = row.courseName || 'Unknown Course';
                  const issued = row.issued ?? 0;
                  const thisMonth = row.thisMonth ?? 0;
                  const revoked = row.revoked ?? 0;
                  const rate = row.verifiedScore ?? 0;
                  const tenantName = row.tenant || '-';

                  return (
                    <tr key={key} className="border-b border-[var(--line)] hover:bg-[var(--surface-wash)] transition-colors">
                      <td className="py-[14px] px-[16px] font-[var(--fw-regular)] text-[length:var(--fs-body)] text-[var(--ink)]">
                        {courseName}
                      </td>
                      <td className="py-[14px] px-[16px]">{issued}</td>
                      <td className="py-[14px] px-[16px]">{thisMonth}</td>
                      <td className="py-[14px] px-[16px]">{revoked}</td>
                      <td className="py-[14px] px-[16px]">
                        <div className="flex items-center space-x-2">
                          <div className="w-full bg-[var(--surface-3)] rounded-full h-1.5">
                            <div className="bg-[var(--sage)] h-1.5 rounded-full" style={{ width: `${rate}%` }}></div>
                          </div>
                          <span className="text-[length:var(--fs-meta)] font-[var(--fw-medium)] text-[var(--ink-mute)] w-10 text-right">{rate}%</span>
                        </div>
                      </td>
                      <td className="py-[14px] px-[16px]">{tenantName}</td>
                      <td className="py-[14px] px-[16px] text-center">
                        <button
                          onClick={() => {
                            setSelectedCourse(row);
                            setSearch('');
                          }}
                          className="text-[var(--c-honey)] hover:opacity-80 font-[var(--fw-medium)] text-[length:var(--fs-meta)] inline-flex items-center justify-center gap-1 transition-opacity cursor-pointer"
                        >
                          View &rarr;
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {visibleData.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-[24px] px-[16px] text-center text-[var(--ink-mute)]">
                      {search ? `No credential records match "${search}".` : 'No credential records found.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-[length:var(--fs-body)] text-left text-[var(--ink)]">
              <thead
                className="text-[length:var(--fs-label)] text-[var(--ink-mute)] uppercase bg-[#FAFAFA] border-b border-[var(--line)] font-[var(--fw-bold)] tracking-widest"
                style={{ fontFamily: 'var(--font-serif)' }}
              >
                <tr>
                  <th className="py-[14px] px-[16px] whitespace-nowrap">Recipient</th>
                  <th className="py-[14px] px-[16px] whitespace-nowrap">Issue Date</th>
                  <th className="py-[14px] px-[16px] whitespace-nowrap">Serial Number</th>
                  <th className="py-[14px] px-[16px] whitespace-nowrap">Tenant</th>
                  <th className="py-[14px] px-[16px] whitespace-nowrap text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {drillInCertificates.map((cert: CertificateReport, index: number) => {
                  const isVerified = cert.isVerified && !cert.isRevoked;
                  const isRevoked = cert.isRevoked;

                  return (
                    <tr key={cert.certificateId || index} className="border-b border-[var(--line)] hover:bg-[var(--surface-wash)] transition-colors">
                      <td className="py-[14px] px-[16px] font-[var(--fw-medium)] text-[var(--ink)]">
                        {cert.userName || (cert.userId && userLookupMap.emailMap.get(String(cert.userId).toLowerCase())) || cert.userId || 'Unknown User'}
                      </td>
                      <td className="py-[14px] px-[16px] text-[var(--ink-mute)]">
                        {cert.issueDate ? new Date(cert.issueDate).toLocaleDateString() : '-'}
                      </td>
                      <td className="py-[14px] px-[16px] font-mono text-[length:var(--fs-meta)] text-[var(--ink-mute)]">
                        {cert.serialNumber || '-'}
                      </td>
                      <td className="py-[14px] px-[16px] text-[var(--ink-mute)]">
                        {cert.tenantName || selectedCourse.tenant || '-'}
                      </td>
                      <td className="py-[14px] px-[16px] text-center">
                        {isVerified ? (
                          <span className="inline-flex items-center px-[10px] py-[3px] rounded-[var(--r-pill)] text-[length:var(--fs-label)] font-[var(--fw-semibold)] bg-[var(--sage-wash)] text-[var(--sage-text)] uppercase tracking-wider">
                            VERIFIED
                          </span>
                        ) : isRevoked ? (
                          <span className="inline-flex items-center px-[10px] py-[3px] rounded-[var(--r-pill)] text-[length:var(--fs-label)] font-[var(--fw-semibold)] bg-[var(--clay-wash)] text-[var(--c-clay)] uppercase tracking-wider">
                            REVOKED
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-[10px] py-[3px] rounded-[var(--r-pill)] text-[length:var(--fs-label)] font-[var(--fw-semibold)] bg-[var(--honey-wash)] text-[var(--c-honey)] uppercase tracking-wider">
                            PENDING
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {drillInCertificates.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-[24px] px-[16px] text-center text-[var(--ink-mute)]">
                      {search ? `No certificates match "${search}" for this course.` : 'No individual certificates found for this course.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
        <div className="py-[14px] px-[16px] border-t border-[var(--line)] text-center">
          <span
            className="text-[length:var(--fs-meta)] font-[var(--fw-medium)] text-[var(--ink-mute)]"
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            {selectedCourse ? (
              <>
                Showing {drillInCertificates.length} certificates for {selectedCourse.courseName}
                {search && ` (filtered by "${search}")`}
              </>
            ) : (
              <>
                Showing {visibleData.length} of {totalCount} courses
                {search && ` (filtered by "${search}")`}
              </>
            )}
            {!selectedCourse && hasMore && (
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

