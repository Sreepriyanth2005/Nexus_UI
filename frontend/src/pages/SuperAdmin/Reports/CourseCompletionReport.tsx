import React, { useState } from 'react';
import { 
  Users, CheckCircle2, Check, ChevronDown, Download, ArrowLeft, Search
} from 'lucide-react';
import { BarChart2, CheckSquare, User, Star } from '../../../assets/icons';
import { StatCard } from '../../../components/Reports/StatCard';
import { LineChartWidget } from '../../../components/Reports/LineChartWidget';
import { DonutChartWidget } from '../../../components/Reports/DonutChartWidget';

import { Link } from "react-router";
import { useCourseAnalyticsReport, useReportingCountries, useDashboardMetrics } from '../../../hooks/useReports';
import { useCategories } from '../../../hooks/category/useCategories';
import { useSubjects } from '../../../hooks/useSubjects';
import { useCourses } from '../../../hooks/course/useCourses';
import { useRoles } from '../../../hooks/useRolesPermissions';
import { getTenantsApi } from '../../../core/api/tenant.api';
import { ReportFilter } from '../../../types/reports.types';
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
  options: {value: any, label: string}[], 
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
export const CourseCompletionReport: React.FC = () => {
  const [filters, setFilters] = useState<ReportFilter>({});
  const [localFilters, setLocalFilters] = useState<{
    days?: number;
    categoryId?: string;
    subjectId?: string;
    roleId?: string;
    country?: string;
    tenantId?: string;
  }>({});
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

  const { data: reportData, isLoading } = useCourseAnalyticsReport(filters);
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
    setIsApplied(false);
    setSelectedCourse(null);
    setVisibleCount(6);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters(prev => ({ ...prev, search: e.target.value, page: 1 }));
    setVisibleCount(6);
  };
  
  const baseData = reportData?.data && reportData.data.length > 0 
    ? reportData.data 
    : [];

  const handleExportCSV = () => {
    if (!baseData || baseData.length === 0) return;
    const exportData = baseData.map(row => ({
      Course: row.title || 'Unknown',
      Type: row.isCareerPath ? 'Career Path' : 'Standalone Course',
      Enrollees: row.totalEnrollments || 0,
      Completed: row.completedEnrollments || 0,
      'Completion Rate (%)': row.completionRate || 0,
      'Avg Score (%)': row.avgScore || 0,
      'Status': row.status || 'Unknown'
    }));
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const csvContent = XLSX.utils.sheet_to_csv(worksheet);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'course_completion_report.csv';
    link.click();
  };

  const handleExportExcel = () => {
    if (!baseData || baseData.length === 0) return;
    const exportData = baseData.map(row => ({
      Course: row.title || 'Unknown',
      Type: row.isCareerPath ? 'Career Path' : 'Standalone Course',
      Enrollees: row.totalEnrollments || 0,
      Completed: row.completedEnrollments || 0,
      'Completion Rate (%)': row.completionRate || 0,
      'Avg Score (%)': row.avgScore || 0,
      'Status': row.status || 'Unknown'
    }));
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');
    XLSX.writeFile(workbook, 'course_completion_report.xlsx');
  };

  const displayData = selectedCourse 
    ? baseData.filter((c: any) => (c.courseId || c.title) === (selectedCourse.courseId || selectedCourse.title))
    : baseData;

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
  const totalCount = reportData?.total || displayData.length;
  const hasMore = visibleCount < displayData.length;

  const totalEnrollees = displayData.reduce((acc: number, curr: any) => acc + (curr.totalEnrollments || 0), 0);
  const totalCompleted = displayData.reduce((acc, curr) => acc + (curr.completedEnrollments || 0), 0);
  const avgCompletionRate = totalEnrollees > 0 ? Math.round((totalCompleted / totalEnrollees) * 100) : 0;
  
  const ratedCourses = displayData.filter(c => c.avgScore > 0);
  const avgScore = ratedCourses.length > 0 
    ? (ratedCourses.reduce((acc, curr) => acc + (curr.avgScore || 0), 0) / ratedCourses.length).toFixed(1) 
    : '-';

  // Calculate Breakdown Data
  const totalInProgress = displayData.reduce((acc, curr) => acc + (curr.inProgressEnrollments || 0), 0);
  const totalNotStarted = displayData.reduce((acc, curr) => acc + (curr.notStartedEnrollments || 0), 0);
  const breakdownTotal = totalCompleted + totalInProgress + totalNotStarted;
  const dynamicBreakdownData = [
    { name: 'Completed', value: breakdownTotal > 0 ? Math.round((totalCompleted / breakdownTotal) * 100) : 0, color: 'var(--sage)' },
    { name: 'In Progress', value: breakdownTotal > 0 ? Math.round((totalInProgress / breakdownTotal) * 100) : 0, color: 'var(--c-honey)' },
    { name: 'Not started', value: breakdownTotal > 0 ? Math.round((totalNotStarted / breakdownTotal) * 100) : 0, color: 'var(--c-clay)' },
  ].filter(d => d.value > 0);

  const numScore = avgScore === '-' ? 0 : Number(avgScore);
  const dynamicScoreData = [
    { name: 'Score', value: numScore, color: 'var(--sage)' },
    { name: 'Remaining', value: Math.max(0, 100 - numScore), color: 'var(--surface-3)' },
  ];
  
  // Use real monthly enrollments trend from dashboard metrics
  const dynamicTrendData = dashboardMetrics?.monthlyEnrollments?.map(m => ({
    day: m.name,
    rate: m.value
  })) || [];

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
            Course completion · Drill-in
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1.5">
            {selectedCourse ? selectedCourse.title || 'Unknown Course' : 'Course completion report'}
          </h1>
          <p className="text-[var(--ink-mute)] text-sm break-words">
            Last 30 days · All courses · All categories
            {selectedCourse && (
              <button 
                onClick={() => setSelectedCourse(null)} 
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
          title="ENROLLED" 
          value={totalEnrollees.toLocaleString()} 
          trend={0} 
          icon={BarChart2}
          iconBgColor="bg-[var(--honey-wash)]" 
          iconColor="text-[var(--c-honey)]" 
        />
        <StatCard 
          title="COURSE COMPLETED" 
          value={totalCompleted.toLocaleString()} 
          trend={0} 
          icon={CheckSquare}
          iconBgColor="bg-[var(--sage-wash)]" 
          iconColor="text-[var(--c-sage)]" 
        />
        <StatCard 
          title="AVG COMPLETION RATE" 
          value={`${avgCompletionRate}%`} 
          trend={0} 
          icon={User}
          iconBgColor="bg-[var(--clay-wash)]" 
          iconColor="text-[var(--c-clay)]" 
        />
        <StatCard 
          title="AVG SCORE" 
          value={avgScore} 
          trend={0} 
          icon={Star}
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
                value={filters.search || ''}
                onChange={(val) => {
                  setFilters(prev => ({ ...prev, search: val, page: 1 }));
                  setLocalFilters(prev => ({ ...prev, search: val }));
                }}
                options={coursesList.map((c: any) => ({ value: c.title, label: c.title }))}
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
                className="py-[8px] px-[24px] bg-[var(--btn)] hover:bg-[var(--btn-hover)] text-[var(--btn-ink)] font-[var(--fw-semibold)] text-[length:var(--fs-meta)] rounded-[var(--r-pill)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-md)] border border-[var(--honey)] whitespace-nowrap shadow-[var(--shadow-xs)] nexus-btn sm cursor-pointer"
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
            Completion rate trend
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
              title="AVG SCORE"
              data={dynamicScoreData}
              centerLabel={avgScore.toString()}
              centerSubLabel="OUT OF 100"
              variant="bare"
              hideLegend={true}
              roundedCaps={true}
            />
            <div className="flex justify-center pb-[4px]">
              <span className="bg-[var(--sage-wash)] text-[var(--sage-text)] text-[length:var(--fs-label)] font-[var(--fw-semibold)] px-[12px] py-[4px] rounded-[var(--r-pill)] flex items-center justify-center gap-1.5 uppercase tracking-wider">
                <Check className="w-3.5 h-3.5" />
                PASS
              </span>
            </div>
          </div>
          
          {/* Divider */}
          <div className="hidden lg:block w-px bg-[var(--line)] absolute left-[75%] top-[18px] bottom-[18px] -translate-x-1/2" />
          
          <div className="lg:col-span-3 py-[18px] px-[28px] flex flex-col ard-chart-col">
            <DonutChartWidget 
              title="BREAKDOWN"
              data={dynamicBreakdownData}
              centerLabel={`${avgCompletionRate}%`}
              centerSubLabel="COMPLETED"
              variant="bare"
              ariaLabel="Completion breakdown donut"
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
              placeholder="Search courses and career paths..." 
              value={filters.search || ''}
              onChange={handleSearch}
              className="h-[36px] w-full py-0 pr-[12px] pl-[34px] border border-[var(--line)] bg-[var(--paper)] rounded-[var(--r-md)] text-[length:var(--fs-body)] font-[var(--fw-regular)] text-[var(--ink)] placeholder:text-[var(--ink-mute)] focus:outline-none focus:border-[var(--ink-soft)] transition-colors"
            />
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
                <th className="py-[14px] px-[16px] whitespace-nowrap cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('title')}>
                  Course <span className="ml-1 text-[var(--ink-faint)] font-[var(--fw-regular)]">{sortConfig?.key === 'title' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}</span>
                </th>
                <th className="py-[14px] px-[16px] whitespace-nowrap cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('totalEnrollments')}>
                  Enrolled <span className="ml-1 text-[var(--ink-faint)] font-[var(--fw-regular)]">{sortConfig?.key === 'totalEnrollments' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}</span>
                </th>
                <th className="py-[14px] px-[16px] whitespace-nowrap cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('completedEnrollments')}>
                  Completed <span className="ml-1 text-[var(--ink-faint)] font-[var(--fw-regular)]">{sortConfig?.key === 'completedEnrollments' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}</span>
                </th>
                <th className="py-[14px] px-[16px] min-w-[200px] whitespace-nowrap cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('completionRate')}>
                  Rate <span className="ml-1 text-[var(--ink-faint)] font-[var(--fw-regular)]">{sortConfig?.key === 'completionRate' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}</span>
                </th>
                <th className="py-[14px] px-[16px] whitespace-nowrap cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('avgScore')}>
                  Avg Score <span className="ml-1 text-[var(--ink-faint)] font-[var(--fw-regular)]">{sortConfig?.key === 'avgScore' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}</span>
                </th>
                <th className="py-[14px] px-[16px] whitespace-nowrap cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('avgTime')}>
                  Avg Time <span className="ml-1 text-[var(--ink-faint)] font-[var(--fw-regular)]">{sortConfig?.key === 'avgTime' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}</span>
                </th>
                <th className="py-[14px] px-[16px] whitespace-nowrap text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleData.map((row, index) => {
                const key = row.courseId || index;
                const courseName = row.title || 'Unknown Course';
                const enrollees = row.totalEnrollments ?? 0;
                const completed = row.completedEnrollments ?? 0;
                const rate = row.completionRate ?? 0;
                const avgScore = row.avgScore ?? '-';
                const avgTime = row.avgTime ? `${Math.floor(row.avgTime / 60)}h ${row.avgTime % 60}m` : '-';

                return (
                  <tr key={key} className="border-b border-[var(--line)] hover:bg-[var(--surface-wash)] transition-colors">
                    <td className="py-[14px] px-[16px] font-[var(--fw-regular)] text-[length:var(--fs-body)] text-[var(--ink)]">
                      {/* {row.isCareerPath && (
                        <span className="inline-flex items-center px-[8px] h-[20px] rounded-[var(--r-pill)] text-[length:var(--fs-label)] font-[var(--fw-medium)] bg-[var(--c-ocean-wash)] text-[var(--c-ocean)] mr-2">
                          Career Path
                        </span>
                      )} */}
                      {courseName}
                    </td>
                    <td className="py-[14px] px-[16px]">{enrollees}</td>
                    <td className="py-[14px] px-[16px]">{completed}</td>
                    <td className="py-[14px] px-[16px]">
                      <div className="flex items-center space-x-2">
                        <div className="w-full bg-[var(--surface-3)] rounded-full h-1.5">
                          <div className="bg-[var(--sage)] h-1.5 rounded-full" style={{ width: `${rate}%` }}></div>
                        </div>
                        <span className="text-[length:var(--fs-meta)] font-[var(--fw-medium)] text-[var(--ink-mute)] w-10 text-right">{rate}%</span>
                      </div>
                    </td>
                    <td className="py-[14px] px-[16px]">{avgScore}</td>
                    <td className="py-[14px] px-[16px]">{avgTime}</td>
                    <td className="py-[14px] px-[16px] text-center">
                      <button 
                        onClick={() => setSelectedCourse(row)}
                        className="text-[var(--c-honey)] hover:opacity-80 font-[var(--fw-medium)] text-[length:var(--fs-meta)] inline-flex items-center justify-center gap-1 transition-opacity"
                      >
                        View &rarr;
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="py-[14px] px-[16px] border-t border-[var(--line)] text-center">
          <span
            className="text-[length:var(--fs-meta)] font-[var(--fw-medium)] text-[var(--ink-mute)]"
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            Showing {visibleData.length} of {totalCount} courses
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

