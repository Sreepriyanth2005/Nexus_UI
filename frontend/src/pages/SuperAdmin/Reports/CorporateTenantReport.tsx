import React, { useState } from 'react';
import { 
  Download, ArrowRight, Search, ArrowLeft, ChevronDown
} from 'lucide-react';
import { Building, Users, BarChart2, Star } from '../../../assets/icons';
import { StatCard } from '../../../components/Reports/StatCard';
import { LineChartWidget } from '../../../components/Reports/LineChartWidget';
import { DonutChartWidget } from '../../../components/Reports/DonutChartWidget';

import { Link } from "react-router";
import { useCorporateTenantReport } from '../../../hooks/useReports';
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
            onClick={() => { onChange('all'); setIsOpen(false); }}
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

export const CorporateTenantReport: React.FC = () => {
  const { data: reportData, isLoading } = useCorporateTenantReport();
  const [selectedTenant, setSelectedTenant] = useState<any | null>(null);
  const initialFilters = { period: '30days', tenant: 'all', group: 'all', country: 'all' };
  const [filters, setFilters] = useState(initialFilters);
  const [localFilters, setLocalFilters] = useState(initialFilters);
  const [isApplied, setIsApplied] = useState(false);
  const [visibleCount, setVisibleCount] = useState(6);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleApply = () => {
    setFilters({ ...localFilters });
    setIsApplied(true);
    setVisibleCount(6);
  };

  const handleClear = () => {
    setLocalFilters(initialFilters);
    setFilters(initialFilters);
    setIsApplied(false);
    setSelectedTenant(null);
    setVisibleCount(6);
  };
  
  const displayData = reportData?.data || [];

  const uniqueTenants = Array.from(new Set(displayData.map((d: any) => d.tenantName))).filter(Boolean);
  
  // Split comma-separated groups so they appear individually in the dropdown
  const allGroups = displayData.reduce((acc: string[], d: any) => {
    if (d.group) {
      d.group.split(',').forEach((g: string) => {
        acc.push(g.trim());
      });
    }
    return acc;
  }, []);
  const uniqueGroups = Array.from(new Set(allGroups)).filter(Boolean);

  const uniqueCountries = Array.from(new Set(displayData.map((d: any) => d.country))).filter(Boolean);

  const filteredDisplayData = displayData.filter((row: any) => {
    let match = true;
    if (filters.tenant !== 'all' && row.tenantName !== filters.tenant) match = false;
    // Check if the comma-separated group string includes the selected group
    if (filters.group !== 'all' && !(row.group && row.group.includes(filters.group))) match = false;
    if (filters.country !== 'all' && row.country !== filters.country) match = false;
    return match;
  });

  let sortedData = [...filteredDisplayData];
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

  const handleExportCSV = () => {
    if (!filteredDisplayData || filteredDisplayData.length === 0) return;
    const exportData = filteredDisplayData.map((row: any) => ({
      Tenant: row.tenantName || 'Unknown',
      Group: row.group,
      Country: row.country,
      SeatsUsed: row.activeLearners,
      TotalSeats: row.totalSeats,
      Utilisation: `${row.licenseUtilization}%`,
      AvgScore: row.avgCompletionRate
    }));
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const csvContent = XLSX.utils.sheet_to_csv(worksheet);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'nexus-corporate-tenant-report.csv';
    link.click();
  };

  const handleExportExcel = () => {
    if (!filteredDisplayData || filteredDisplayData.length === 0) return;
    const exportData = filteredDisplayData.map((row: any) => ({
      Tenant: row.tenantName || 'Unknown',
      Group: row.group,
      Country: row.country,
      SeatsUsed: row.activeLearners,
      TotalSeats: row.totalSeats,
      Utilisation: `${row.licenseUtilization}%`,
      AvgScore: row.avgCompletionRate
    }));
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');
    XLSX.writeFile(workbook, 'nexus-corporate-tenant-report.xlsx');
  };

  const handleViewDetails = (row: any) => {
    setSelectedTenant(row);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Dummy trend data
  const dynamicTrendData = Array.from({ length: 30 }).map((_, i) => ({
    day: `Day ${i + 1}`,
    activity: Math.floor(Math.random() * 200) + 700
  }));

  // Dynamic metrics calculation
  let activeTenants = 0;
  let seatsUsed = 0;
  let avgUtilisation = 0;
  let avgScore = 0;

  if (selectedTenant) {
    activeTenants = 1;
    seatsUsed = selectedTenant.usedSeats;
    avgUtilisation = selectedTenant.licenseUtilization;
    avgScore = selectedTenant.avgScore;
  } else if (filteredDisplayData.length > 0) {
    activeTenants = filteredDisplayData.length;
    seatsUsed = filteredDisplayData.reduce((acc: number, curr: any) => acc + (curr.usedSeats || 0), 0);
    avgUtilisation = Math.round(filteredDisplayData.reduce((acc: number, curr: any) => acc + (curr.licenseUtilization || 0), 0) / filteredDisplayData.length);
    avgScore = Math.round(filteredDisplayData.reduce((acc: number, curr: any) => acc + (curr.avgScore || 0), 0) / filteredDisplayData.length);
  }

  const breakdownData = [
    { name: 'Completed', value: avgScore, color: 'var(--c-sage)' },
    { name: 'In Progress', value: selectedTenant ? 0 : 15, color: 'var(--c-honey)' },
    { name: 'Not started', value: selectedTenant ? (100 - avgScore) : 13, color: 'var(--c-danger)' },
  ].filter(d => d.value > 0);

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
          ← REPORTS
        </Link>
      </div>
      <div className="flex flex-col md:flex-row md:justify-between items-start md:items-center gap-4 mb-6">
        <div className="w-full md:w-auto">
          <div className="flex items-center text-[12px] text-[var(--ink-mute)] uppercase tracking-wider mb-[6px] font-medium">
            Corporate tenant · Drill-in
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1.5">
            {selectedTenant ? `Corporate tenant – ${selectedTenant.tenantName}` : 'Corporate tenant report'}
          </h1>
          <p className="text-[var(--ink-mute)] text-sm break-words">
            Last 30 days · All tenants · All groups
            {selectedTenant && (
              <button
                onClick={() => setSelectedTenant(null)}
                className="ml-2 text-orange-600 hover:text-orange-800 font-medium cursor-pointer inline-block"
              >
                Show all tenants
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
          title="ACTIVE TENANTS" 
          value={activeTenants.toLocaleString()} 
          trend={selectedTenant ? undefined : 2} 
          trendSuffix=""
          trendLabel="vs prior period"
          icon={Building} 
          iconBgColor="bg-[var(--honey-wash)]" 
          iconColor="text-[var(--c-honey)]" 
        />
        <StatCard 
          title="SEATS USED" 
          value={seatsUsed.toLocaleString()} 
          trend={selectedTenant ? undefined : 64} 
          trendSuffix=""
          trendLabel="vs prior period"
          icon={Users} 
          iconBgColor="bg-[var(--sage-wash)]" 
          iconColor="text-[var(--c-sage)]" 
        />
        <StatCard 
          title="AVG UTILISATION" 
          value={`${avgUtilisation}%`} 
          trend={selectedTenant ? undefined : 3.4} 
          trendSuffix="%"
          trendLabel="vs prior period"
          icon={BarChart2} 
          iconBgColor="bg-[var(--clay-wash)]" 
          iconColor="text-[var(--c-clay)]" 
        />
        <StatCard 
          title="AVG TENANT SCORE" 
          value={`${avgScore}%`} 
          trend={selectedTenant ? undefined : 1.1} 
          trendSuffix="%"
          trendLabel="vs prior period"
          icon={Star} 
          iconBgColor="bg-[var(--honey-wash)]" 
          iconColor="text-[var(--c-honey)]" 
        />
      </div>

      {/* Filters */}
      {!selectedTenant && (
        <div className="bg-[var(--paper)] rounded-[var(--r-lg)] border border-[var(--line)] shadow-[var(--shadow-sm)] mb-6 flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-md)]">
          <div className="px-[22px] py-[16px] border-b border-[var(--line)] card-head">
            <span className="text-[length:var(--fs-label)] font-[var(--fw-bold)] text-[var(--ink-mute)] tracking-[var(--ls-label,0.16em)] uppercase">
              Filters
            </span>
          </div>
          <div className="py-[18px] px-[22px] flex flex-col gap-4 card-body">
            <div className="flex flex-wrap lg:flex-nowrap gap-3 items-center">
              <div className="relative flex-1 min-w-[150px]">
                <CustomSelect 
                  placeholder="Last 30 days"
                  value={localFilters.period}
                  onChange={val => setLocalFilters(prev => ({ ...prev, period: val || '30days' }))}
                  options={[
                    { value: '30days', label: 'Last 30 days' },
                    { value: '7days', label: 'Last 7 days' },
                    { value: '90days', label: 'Last 90 days' },
                    { value: 'year', label: 'This year' }
                  ]}
                />
              </div>
              <div className="relative flex-1 min-w-[150px]">
                <CustomSelect 
                  placeholder="All tenants"
                  value={localFilters.tenant}
                  onChange={val => setLocalFilters(prev => ({ ...prev, tenant: val || 'all' }))}
                  options={uniqueTenants.map((t: any) => ({ value: t, label: t }))}
                />
              </div>
              <div className="relative flex-1 min-w-[150px]">
                <CustomSelect 
                  placeholder="All groups"
                  value={localFilters.group}
                  onChange={val => setLocalFilters(prev => ({ ...prev, group: val || 'all' }))}
                  options={uniqueGroups.map((g: any) => ({ value: g, label: g }))}
                />
              </div>
              <div className="relative flex-1 min-w-[150px]">
                <CustomSelect 
                  placeholder="All countries"
                  value={localFilters.country}
                  onChange={val => setLocalFilters(prev => ({ ...prev, country: val || 'all' }))}
                  options={uniqueCountries.map((c: any) => ({ value: c, label: c }))}
                />
              </div>
              <div className="flex items-center gap-2">
                {isApplied ? (
                  <button 
                    onClick={handleClear}
                    className="py-[9px] px-[28px] bg-[var(--surface)] hover:bg-[var(--surface-wash)] text-[var(--ink)] font-[var(--fw-medium)] text-[length:var(--fs-body)] rounded-[var(--r-pill)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[var(--shadow-sm)] border border-[var(--line)] whitespace-nowrap shadow-[var(--shadow-xs)] cursor-pointer"
                  >
                    Clear
                  </button>
                ) : (
                  <button 
                    onClick={handleApply}
                    className="py-[9px] px-[28px] bg-[var(--btn)] hover:bg-[var(--btn-hover)] text-[var(--btn-ink)] font-[var(--fw-medium)] text-[length:var(--fs-body)] rounded-[var(--r-pill)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[var(--shadow-sm)] border border-[var(--honey)] whitespace-nowrap shadow-[var(--shadow-xs)] cursor-pointer"
                  >
                    Apply
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="bg-[var(--paper)] rounded-[var(--r-lg)] border border-[var(--line)] shadow-[var(--shadow-sm)] mb-6 flex flex-col overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-md)]">
        <div className="px-[22px] py-[16px] border-b border-[var(--line)] flex justify-between items-center card-head">
          <h3 className="text-[length:var(--fs-h3)] font-[var(--fw-semibold)] text-[var(--ink)]">Completion rate trend</h3>
          <span className="h-[20px] px-[10px] flex items-center justify-center text-[length:var(--fs-label)] font-[var(--fw-medium)] text-[var(--ink-mute)] bg-[var(--surface)] rounded-[var(--r-pill)] border border-[var(--line)]" style={{ fontFamily: 'var(--font-serif)' }}>Last 30 days - Daily</span>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 relative py-[18px] px-[22px] card-body">
          <div className="lg:col-span-6 px-[14px] flex flex-col min-h-[240px]">
            <LineChartWidget 
              title=""
              data={dynamicTrendData}
              xKey="day"
              yKey="activity"
              color="var(--c-honey)"
              variant="bare"
            />
          </div>

          <div className="hidden lg:block w-px bg-[var(--line)] absolute left-[50%] top-[18px] bottom-[18px] -translate-x-1/2" />
          
          <div className="lg:col-span-3 py-[18px] px-[28px] flex flex-col min-h-[240px]">
            <DonutChartWidget 
              title="AVG SCORE"
              data={[
                { name: 'Score', value: avgScore, color: 'var(--sage)' }, 
                { name: 'Remaining', value: Math.max(0, 100 - avgScore), color: 'var(--surface-3)' }
              ]}
              centerLabel={avgScore.toString()}
              centerSubLabel="OUT OF 100"
              variant="bare"
            />
          </div>

          <div className="hidden lg:block w-px bg-[var(--line)] absolute left-[75%] top-[18px] bottom-[18px] -translate-x-1/2" />
          
          <div className="lg:col-span-3 py-[18px] px-[28px] flex flex-col min-h-[240px]">
            <DonutChartWidget 
              title="BREAKDOWN"
              data={breakdownData}
              centerLabel={`${avgScore}%`}
              centerSubLabel={selectedTenant ? "PASSED" : "DONE"}
              variant="bare"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      {!selectedTenant && (
        <div className="bg-white rounded-[var(--r-lg)] border border-[var(--line)] shadow-[var(--shadow-sm)] overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-md)] mt-6">
          <div className="py-[14px] px-[16px] border-b border-[var(--line)] flex flex-col sm:flex-row justify-between gap-4 sm:items-center bg-[var(--surface)]">
            <div className="relative w-full sm:flex-1">
              <Search className="w-4 h-4 text-[var(--ink-mute)] absolute left-[12px] top-1/2 -translate-y-1/2 pointer-events-none" />
              <input 
                type="text" 
                placeholder="Search tenants..." 
                onChange={(e) => {
                  // If we had a search filter we would set it here.
                  // For now, let's just assume we reset visible count on any interaction if search is added later.
                }}
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
                  <th className="py-[14px] px-[16px] whitespace-nowrap cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('tenantName')}>
                    Tenant <span className="ml-1 text-[var(--ink-faint)] font-[var(--fw-regular)]">{sortConfig?.key === 'tenantName' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}</span>
                  </th>
                  <th className="py-[14px] px-[16px] whitespace-nowrap cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('group')}>
                    Group <span className="ml-1 text-[var(--ink-faint)] font-[var(--fw-regular)]">{sortConfig?.key === 'group' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}</span>
                  </th>
                  <th className="py-[14px] px-[16px] whitespace-nowrap cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('activeLearners')}>
                    Seats <span className="ml-1 text-[var(--ink-faint)] font-[var(--fw-regular)]">{sortConfig?.key === 'activeLearners' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}</span>
                  </th>
                  <th className="py-[14px] px-[16px] whitespace-nowrap cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('completed')}>
                    Completed <span className="ml-1 text-[var(--ink-faint)] font-[var(--fw-regular)]">{sortConfig?.key === 'completed' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}</span>
                  </th>
                  <th className="py-[14px] px-[16px] whitespace-nowrap cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('licenseUtilization')}>
                    Utilisation <span className="ml-1 text-[var(--ink-faint)] font-[var(--fw-regular)]">{sortConfig?.key === 'licenseUtilization' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}</span>
                  </th>
                  <th className="py-[14px] px-[16px] whitespace-nowrap cursor-pointer hover:bg-gray-100 transition-colors text-right" onClick={() => handleSort('avgCompletionRate')}>
                    Avg Completion Rate <span className="ml-1 text-[var(--ink-faint)] font-[var(--fw-regular)]">{sortConfig?.key === 'avgCompletionRate' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}</span>
                  </th>
                  <th className="py-[14px] px-[16px]"></th>
                </tr>
              </thead>
              <tbody>
                {visibleData.map((row: any, index: number) => {
                  return (
                    <tr key={row.id || index} className="border-b border-[var(--line)] hover:bg-[var(--surface-wash)] transition-colors">
                      <td className="py-[14px] px-[16px] font-[var(--fw-medium)] text-[length:var(--fs-body)] text-[var(--ink)]">{row.tenantName}</td>
                      <td className="py-[14px] px-[16px] text-[var(--ink-mute)] font-[var(--fw-medium)]">{row.group || '-'}</td>
                      <td className="py-[14px] px-[16px] font-[var(--fw-medium)]">
                        {row.activeLearners} / {row.totalSeats}
                      </td>
                      <td className="py-[14px] px-[16px] font-[var(--fw-medium)]">
                         {row.completed || 0}
                      </td>
                      <td className="py-[14px] px-[16px]">
                        <div className="flex items-center justify-start space-x-2">
                          <div className="w-32 bg-[var(--surface-3)] rounded-full h-1.5 flex-shrink-0">
                            <div className={`h-1.5 rounded-full ${row.licenseUtilization >= 70 ? 'bg-[var(--sage)]' : 'bg-[var(--c-clay)]'}`} style={{ width: `${row.licenseUtilization || 0}%` }}></div>
                          </div>
                          <span className="text-[length:var(--fs-meta)] font-[var(--fw-medium)] text-[var(--ink-mute)] w-10 text-left">{row.licenseUtilization || 0}%</span>
                        </div>
                      </td>
                      <td className="py-[14px] px-[16px] font-[var(--fw-bold)] text-right">{row.avgCompletionRate || 0}%</td>
                      <td className="py-[14px] px-[16px] text-right text-center">
                         <button onClick={() => handleViewDetails(row)} className="text-[var(--c-honey)] hover:opacity-80 font-[var(--fw-medium)] text-[length:var(--fs-meta)] inline-flex items-center justify-center gap-1 transition-opacity cursor-pointer">
                           View <ArrowRight className="w-3 h-3 ml-1" />
                         </button>
                      </td>
                    </tr>
                  );
                })}
                {filteredDisplayData.length === 0 && !isLoading && (
                  <tr>
                    <td colSpan={7} className="py-[32px] px-[16px] text-center text-[var(--ink-mute)] text-[length:var(--fs-body)]">
                      No data available.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {filteredDisplayData.length > visibleCount && (
            <div className="py-[16px] px-[22px] border-t border-[var(--line)] bg-[var(--surface)] text-center">
              <button 
                onClick={() => setVisibleCount(prev => prev + 6)}
                className="text-[var(--c-honey)] hover:opacity-80 font-[var(--fw-bold)] text-[length:var(--fs-body)] transition-opacity cursor-pointer"
              >
                Load more
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

