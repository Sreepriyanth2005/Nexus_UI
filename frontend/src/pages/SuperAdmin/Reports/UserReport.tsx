import React, { useState } from 'react';
import {
  Download, ArrowRight, Search
} from 'lucide-react';
import { Users, BarChart2, CheckSquare, User } from '../../../assets/icons';
import { StatCard } from '../../../components/Reports/StatCard';
import { LineChartWidget } from '../../../components/Reports/LineChartWidget';
import { DonutChartWidget } from '../../../components/Reports/DonutChartWidget';

import { Link } from 'react-router';
import { useLearnerProgressReport, useReportingCountries } from '../../../hooks/useReports';
import { useRoles } from '../../../hooks/useRolesPermissions';
import { HasPermission } from '../../../components/common/HasPermission';
import { ReportFilter } from '../../../types/reports.types';
import * as XLSX from 'xlsx';
import { Skeleton } from '../../../components/ui/Skeleton/Skeleton';

export const UserReport: React.FC = () => {
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [filters, setFilters] = useState({ period: '30days', role: 'all', country: 'all' });
  const [search, setSearch] = useState('');
  const [visibleCount, setVisibleCount] = useState(6);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const { data: rolesData } = useRoles();
  const allRoles = Array.isArray(rolesData) ? rolesData : (rolesData as any)?.data || [];

  const { data: countries } = useReportingCountries();

  const apiFilters: any = {};
  if (filters.period === '30days') apiFilters.days = 30;
  if (filters.period === '7days') apiFilters.days = 7;
  if (filters.country !== 'all') apiFilters.country = filters.country;
  if (filters.role !== 'all') apiFilters.role = filters.role;

  const { data: reportData, isLoading } = useLearnerProgressReport(apiFilters);

  const displayData = reportData?.data || [];
  
  let tableData = [...displayData];
  
  if (search.trim()) {
    const q = search.toLowerCase();
    tableData = tableData.filter((row: any) => 
       row.name?.toLowerCase().includes(q) || 
       row.email?.toLowerCase().includes(q) ||
       row.role?.toLowerCase().includes(q) ||
       row.country?.toLowerCase().includes(q)
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
  const filteredDisplayData = sortedData;
  const visibleData = filteredDisplayData.slice(0, visibleCount);
  const totalUsers = reportData?.total || filteredDisplayData.length;
  const hasMore = visibleCount < filteredDisplayData.length;

  const handleExportCSV = () => {
    if (!filteredDisplayData || filteredDisplayData.length === 0) return;
    const exportData = filteredDisplayData.map((row: any) => ({
      User: row.name || 'Unknown',
      Courses: row.courses,
      Completed: row.completed,
      Progress: `${row.progress || 0}%`,
      AvgScore: row.avgScore,
      Role: row.role,
      Country: row.country
    }));
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const csvContent = XLSX.utils.sheet_to_csv(worksheet);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'nexus-user-progress-report.csv';
    link.click();
  };

  const handleExportExcel = () => {
    if (!filteredDisplayData || filteredDisplayData.length === 0) return;
    const exportData = filteredDisplayData.map((row: any) => ({
      User: row.name || 'Unknown',
      Courses: row.courses,
      Completed: row.completed,
      Progress: `${row.progress || 0}%`,
      AvgScore: row.avgScore,
      Role: row.role,
      Country: row.country
    }));
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');
    XLSX.writeFile(workbook, 'nexus-user-progress-report.xlsx');
  };

  const handleViewDetails = (row: any) => {
    setSelectedUser(row);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Dynamic metrics calculation
  let activeUsers = 0;
  let coursesPerUser = 0;
  let avgProgress = 0;
  let atRiskLearners = 0;
  let avgScore = 0;

  if (selectedUser) {
    activeUsers = 1;
    coursesPerUser = selectedUser.courses;
    avgProgress = selectedUser.progress || 0;
    atRiskLearners = selectedUser.progress < 50 ? 1 : 0;
    avgScore = selectedUser.avgScore;
  } else if (displayData.length > 0) {
    activeUsers = displayData.length;
    coursesPerUser = Number((displayData.reduce((acc: number, curr: any) => acc + curr.courses, 0) / activeUsers).toFixed(1));
    avgProgress = Math.round(displayData.reduce((acc: number, curr: any) => acc + (curr.progress || 0), 0) / activeUsers);
    atRiskLearners = displayData.filter((d: any) => (d.progress || 0) < 50).length;
    avgScore = Math.round(displayData.reduce((acc: number, curr: any) => acc + curr.avgScore, 0) / activeUsers);
  }

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
            User progress · Drill-in
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1.5">
            {selectedUser ? `User progress report – ${selectedUser.name}` : 'User progress report'}
          </h1>
          <p className="text-[var(--ink-mute)] text-sm break-words">
            Last 30 days · All users · All roles
            {selectedUser && (
              <button
                onClick={() => { setSelectedUser(null); setFilters({ period: '30days', role: 'all', country: 'all' }); setSearch(''); setVisibleCount(6); }}
                className="ml-2 text-orange-600 hover:text-orange-800 font-medium cursor-pointer inline-block"
              >
                Show all users
              </button>
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          <HasPermission requiredPermission="REPORT.EXPORT">
            <button onClick={handleExportCSV} className="flex-1 md:flex-none justify-center flex items-center px-[20px] py-[8px] bg-[var(--hero-bg)] text-[var(--ink)] font-[var(--fw-medium)] rounded-[var(--r-pill)] text-[length:var(--fs-body)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-md)] border border-[var(--c-honey-soft)] cursor-pointer">
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </button>
            <button onClick={handleExportExcel} className="flex-1 md:flex-none justify-center flex items-center px-[20px] py-[8px] bg-[var(--hero-bg)] text-[var(--ink)] font-[var(--fw-medium)] rounded-[var(--r-pill)] text-[length:var(--fs-body)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-md)] border border-[var(--c-honey-soft)] cursor-pointer">
              <Download className="w-4 h-4 mr-2" />
              Export Excel
            </button>
          </HasPermission>
        </div>
      </div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatCard 
          title="ACTIVE USERS" 
          value={activeUsers.toLocaleString()} 
          trend={selectedUser ? undefined : 4.0}
          icon={Users} 
          iconBgColor="bg-[var(--honey-wash)]" 
          iconColor="text-[var(--c-honey)]" 
        />
        <StatCard 
          title="COURSES PER USER" 
          value={coursesPerUser.toString()} 
          trend={selectedUser ? undefined : 0.3}
          trendSuffix=""
          icon={BarChart2} 
          iconBgColor="bg-[var(--sage-wash)]" 
          iconColor="text-[var(--c-sage)]" 
        />
        <StatCard 
          title="AVG PROGRESS" 
          value={`${avgProgress}%`} 
          trend={selectedUser ? undefined : 5.2}
          icon={CheckSquare} 
          iconBgColor="bg-[var(--clay-wash)]" 
          iconColor="text-[var(--c-clay)]" 
        />
        <StatCard 
          title="AT-RISK LEARNERS" 
          value={atRiskLearners.toLocaleString()} 
          trend={selectedUser ? undefined : "↓ +11 vs prior period"}
          icon={User} 
          iconBgColor="bg-[var(--honey-wash)]" 
          iconColor="text-[var(--c-honey)]" 
        />
      </div>

      {/* Filters */}
      {!selectedUser && (
        <div className="bg-[var(--paper)] rounded-[var(--r-lg)] border border-[var(--line)] shadow-[var(--shadow-sm)] mb-6 flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-md)]">
          <div className="px-[22px] py-[16px] border-b border-[var(--line)] card-head">
            <span className="text-[length:var(--fs-label)] font-[var(--fw-bold)] text-[var(--ink-mute)] tracking-[var(--ls-label,0.16em)] uppercase">
              Filters
            </span>
          </div>
          <div className="py-[18px] px-[22px] flex flex-col gap-4 card-body">
            <div className="flex flex-wrap gap-4 items-center">
              <select
                value={filters.period}
                onChange={e => { setFilters({ ...filters, period: e.target.value }); setVisibleCount(6); }}
                className="h-[36px] px-3 border border-[var(--line)] bg-[var(--paper)] rounded-[var(--r-md)] text-[length:var(--fs-body)] font-[var(--fw-regular)] text-[var(--ink)] focus:outline-none focus:border-[var(--ink-soft)] transition-colors flex-1 min-w-[150px]"
              >
                <option value="all">All time</option>
                <option value="30days">Last 30 days</option>
                <option value="7days">Last 7 days</option>
              </select>
              <select
                value={filters.role}
                onChange={e => { setFilters({ ...filters, role: e.target.value }); setVisibleCount(6); }}
                className="h-[36px] px-3 border border-[var(--line)] bg-[var(--paper)] rounded-[var(--r-md)] text-[length:var(--fs-body)] font-[var(--fw-regular)] text-[var(--ink)] focus:outline-none focus:border-[var(--ink-soft)] transition-colors flex-1 min-w-[150px]"
              >
                <option value="all">All roles</option>
                {allRoles.map((r: any) => <option key={r.id} value={r.name}>{r.name}</option>)}
              </select>
              <select
                value={filters.country}
                onChange={e => { setFilters({ ...filters, country: e.target.value }); setVisibleCount(6); }}
                className="h-[36px] px-3 border border-[var(--line)] bg-[var(--paper)] rounded-[var(--r-md)] text-[length:var(--fs-body)] font-[var(--fw-regular)] text-[var(--ink)] focus:outline-none focus:border-[var(--ink-soft)] transition-colors flex-1 min-w-[150px]"
              >
                <option value="all">All countries</option>
                {countries?.map((c: string) => <option key={c} value={c}>{c}</option>)}
              </select>
              <button
                onClick={() => { setFilters({ period: '30days', role: 'all', country: 'all' }); setSearch(''); setVisibleCount(6); }}
                className="px-[20px] py-[8px] bg-[var(--surface-wash)] hover:bg-[var(--line)] text-[var(--ink)] font-[var(--fw-semibold)] rounded-[var(--r-pill)] text-[length:var(--fs-meta)] transition-colors ml-auto border border-[var(--line)] cursor-pointer"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Table */}
      {!selectedUser && (
        <div className="bg-white rounded-[var(--r-lg)] border border-[var(--line)] shadow-[var(--shadow-sm)] overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-md)] mt-6">
          <div className="py-[14px] px-[16px] border-b border-[var(--line)] flex justify-between items-center bg-[var(--surface)] gap-4">
            <div className="relative flex-1 max-w-3xl">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink-mute)]" />
              <input
                type="text"
                value={search}
                onChange={e => { setSearch(e.target.value); setVisibleCount(6); }}
                placeholder="Search users..."
                className="w-full h-[36px] pl-9 pr-3 border border-[var(--line)] bg-[var(--paper)] rounded-[var(--r-md)] text-[length:var(--fs-body)] font-[var(--fw-regular)] text-[var(--ink)] placeholder:text-[var(--ink-mute)] focus:outline-none focus:border-[var(--ink-soft)] transition-colors"
              />
            </div>
            <div className="text-[length:var(--fs-meta)] font-[var(--fw-medium)] text-[var(--ink-faint)] whitespace-nowrap">Click a column to sort</div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-[length:var(--fs-body)] text-left text-[var(--ink)]">
              <thead 
                className="text-[length:var(--fs-label)] text-[var(--ink-mute)] uppercase bg-[#FAFAFA] border-b border-[var(--line)] font-[var(--fw-bold)] tracking-widest"
                style={{ fontFamily: 'var(--font-serif)' }}
              >
                <tr>
                  <th className="py-[14px] px-[16px] whitespace-nowrap cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('name')}>
                    User <span className="ml-1 text-[var(--ink-faint)] font-[var(--fw-regular)]">{sortConfig?.key === 'name' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}</span>
                  </th>
                  <th className="py-[14px] px-[16px] whitespace-nowrap cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('courses')}>
                    Courses <span className="ml-1 text-[var(--ink-faint)] font-[var(--fw-regular)]">{sortConfig?.key === 'courses' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}</span>
                  </th>
                  <th className="py-[14px] px-[16px] whitespace-nowrap cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('completed')}>
                    Completed <span className="ml-1 text-[var(--ink-faint)] font-[var(--fw-regular)]">{sortConfig?.key === 'completed' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}</span>
                  </th>
                  <th className="py-[14px] px-[16px] whitespace-nowrap cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('progress')}>
                    Progress <span className="ml-1 text-[var(--ink-faint)] font-[var(--fw-regular)]">{sortConfig?.key === 'progress' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}</span>
                  </th>
                  <th className="py-[14px] px-[16px] whitespace-nowrap cursor-pointer hover:bg-gray-100 transition-colors text-right" onClick={() => handleSort('avgScore')}>
                    Avg Score <span className="ml-1 text-[var(--ink-faint)] font-[var(--fw-regular)]">{sortConfig?.key === 'avgScore' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}</span>
                  </th>
                  <th className="py-[14px] px-[16px] whitespace-nowrap cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('role')}>
                    Role <span className="ml-1 text-[var(--ink-faint)] font-[var(--fw-regular)]">{sortConfig?.key === 'role' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}</span>
                  </th>
                  <th className="py-[14px] px-[16px]"></th>
                </tr>
              </thead>
              <tbody>
                {visibleData.map((row: any, index: number) => {
                  return (
                    <tr key={row.id || index} className="border-b border-[var(--line)] hover:bg-[var(--surface-wash)] transition-colors">
                      <td className="py-[14px] px-[16px] font-[var(--fw-medium)] text-[length:var(--fs-body)] text-[var(--ink)]">{row.name}</td>
                      <td className="py-[14px] px-[16px] font-[var(--fw-medium)]">{row.courses}</td>
                      <td className="py-[14px] px-[16px] font-[var(--fw-medium)]">{row.completed}</td>
                      <td className="py-[14px] px-[16px]">
                        <div className="flex items-center justify-start space-x-2">
                          <div className="w-full bg-[var(--surface-3)] rounded-full h-1.5 flex-shrink-0">
                            <div className={`h-1.5 rounded-full ${row.progress >= 70 ? 'bg-[var(--sage)]' : 'bg-[var(--c-clay)]'}`} style={{ width: `${row.progress || 0}%` }}></div>
                          </div>
                          <span className="text-[length:var(--fs-meta)] font-[var(--fw-medium)] text-[var(--ink-mute)] w-10 text-left">{row.progress || 0}%</span>
                        </div>
                      </td>
                      <td className="py-[14px] px-[16px] font-[var(--fw-bold)] text-right">{row.avgScore || 0}%</td>
                      <td className="py-[14px] px-[16px] text-[var(--ink-mute)] font-[var(--fw-medium)]">{row.role}</td>
                      <td className="py-[14px] px-[16px] text-right text-center">
                        <button 
                          onClick={() => handleViewDetails(row)} 
                          className="text-[var(--c-honey)] hover:opacity-80 font-[var(--fw-medium)] text-[length:var(--fs-meta)] inline-flex items-center justify-center gap-1 transition-opacity cursor-pointer"
                        >
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

          {/* Load more footer */}
          <div className="py-[14px] px-[16px] border-t border-[var(--line)] text-center bg-white">
            <span 
              className="text-[length:var(--fs-meta)] font-[var(--fw-medium)] text-[var(--ink-mute)]"
              style={{ fontFamily: 'var(--font-serif)' }}
            >
              Showing {visibleData.length} of {totalUsers} users
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
      )}
    </div>
  );
};

