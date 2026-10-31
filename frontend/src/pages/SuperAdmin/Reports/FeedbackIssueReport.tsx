import React, { useState } from 'react';
import { 
  Download, ArrowLeft, Search, ChevronDown, X, MessageSquare, Send, Mail, ChevronsUpDown
} from 'lucide-react';
import { BarChart2, CheckSquare, Star, User, Check } from '../../../assets/icons';
import { StatCard } from '../../../components/Reports/StatCard';
import { LineChartWidget } from '../../../components/Reports/LineChartWidget';
import { DonutChartWidget } from '../../../components/Reports/DonutChartWidget';
import { Link } from 'react-router';
import { useFeedbackReport } from '../../../hooks/useReports';
import { FeedbackReport, ReportFilter } from '../../../types/reports.types';
import * as XLSX from 'xlsx';
import { Skeleton } from '../../../components/ui/Skeleton/Skeleton';

const defaultMockData: FeedbackReport[] = [
  {
    id: "1",
    userId: "usr-101",
    type: "IDEA",
    title: "Downloadable lesson transcripts",
    description: "Let learners download a PDF transcript of each lesson for offline revision.",
    categoryId: "Feature",
    userName: "Nour Al-Rashid",
    submittedAt: "2026-07-14",
    status: "Planned"
  },
  {
    id: "2",
    userId: "usr-102",
    type: "IDEA",
    title: "Dark mode for the learning player",
    description: "A dark theme option would reduce eye strain during evening study sessions.",
    categoryId: "UX",
    userName: "Tariq Hamdan",
    submittedAt: "2026-07-13",
    status: "Under review"
  },
  {
    id: "3",
    userId: "usr-103",
    type: "IDEA",
    title: "Add an ISO 30401 case study course",
    description: "A dedicated course walking through an ISO 30401 knowledge-management implementation.",
    categoryId: "Course / content",
    userName: "Mariam Youssef",
    submittedAt: "2026-07-11",
    status: "New"
  },
  {
    id: "4",
    userId: "usr-104",
    type: "IDEA",
    title: "Weekly progress email summary",
    description: "Send a short weekly email recap of lessons completed and streaks kept.",
    categoryId: "Feature",
    userName: "Khalid Mansouri",
    submittedAt: "2026-07-09",
    status: "Shipped"
  },
  {
    id: "5",
    userId: "usr-105",
    type: "IDEA",
    title: "Interactive quiz checkpoints in video lectures",
    description: "Pause video playback automatically to test comprehension before continuing.",
    categoryId: "Feature",
    userName: "Sara Al-Hassan",
    submittedAt: "2026-07-08",
    status: "Planned"
  }
];

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

export const FeedbackIssueReport: React.FC = () => {
  const [reportType, setReportType] = useState<'IDEA' | 'ISSUE' | 'ALL'>('ALL');
  const [filters, setFilters] = useState<ReportFilter>({});
  const [localFilters, setLocalFilters] = useState<{
    days?: number;
    status?: string;
    categoryId?: string;
    type?: string;
  }>({});
  
  const { data: reportData, isLoading } = useFeedbackReport({ ...filters, type: reportType });
  
  const rawData: FeedbackReport[] = reportData?.data && reportData.data.length > 0 
    ? reportData.data 
    : defaultMockData;
  const [isApplied, setIsApplied] = useState(false);
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  // Local state to simulate responses
  const [localUpdates, setLocalUpdates] = useState<Record<string, { status: string, response: string }>>({
    "1": { status: "Planned", response: "Great suggestion. Transcript downloads are on the roadmap for the next content update and will ship with the revised player." },
    "2": { status: "Under review", response: "" },
    "3": { status: "New", response: "" },
    "4": { status: "Shipped", response: "Weekly progress summaries have been shipped in v2.4." },
    "5": { status: "Planned", response: "Quiz checkpoints are planned for interactive video modules." }
  });

  const [draftResponse, setDraftResponse] = useState("");
  const [draftStatus, setDraftStatus] = useState("New");
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
    setFilters(prev => ({ 
      ...prev, 
      days: localFilters.days,
      status: localFilters.status,
      categoryId: localFilters.categoryId,
      page: 1 
    }));
    if (localFilters.type) {
      setReportType(localFilters.type as any);
    }
    setIsApplied(true);
    setVisibleCount(6);
  };

  const handleClear = () => {
    setLocalFilters({});
    setFilters({});
    setReportType('ALL');
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

  // Filter raw data based on active filters
  const filteredRawData = rawData.filter((row: FeedbackReport) => {
    const activeStatus = (localUpdates[row.id]?.status || row.status || 'New');
    if (filters.status && activeStatus.toLowerCase() !== filters.status.toLowerCase()) return false;
    if (filters.categoryId && row.categoryId !== filters.categoryId) return false;
    if (filters.days) {
      if (!row.submittedAt) return false;
      const subDate = new Date(row.submittedAt);
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - filters.days);
      if (subDate < cutoff) return false;
    }
    return true;
  });

  // Search filtering
  let displayData = [...filteredRawData];
  if (search.trim()) {
    const q = search.trim().toLowerCase();
    displayData = displayData.filter((d: any) =>
      (d.title || '').toLowerCase().includes(q) ||
      (d.description || '').toLowerCase().includes(q) ||
      (d.userName || '').toLowerCase().includes(q) ||
      (d.categoryId || '').toLowerCase().includes(q) ||
      (localUpdates[d.id]?.status || d.status || '').toLowerCase().includes(q)
    );
  }

  let sortedData = [...displayData];
  if (sortConfig) {
    sortedData.sort((a: any, b: any) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];
      
      if (sortConfig.key === 'status') {
        aVal = (localUpdates[a.id] || { status: a.status || 'New' }).status;
        bVal = (localUpdates[b.id] || { status: b.status || 'New' }).status;
      }

      if (aVal == null) aVal = '';
      if (bVal == null) bVal = '';
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }

  const totalItems = sortedData.length;
  const visibleData = sortedData.slice(0, visibleCount);
  const hasMore = visibleCount < sortedData.length;

  // Calculate real metrics
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const priorMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const priorYear = currentMonth === 0 ? currentYear - 1 : currentYear;

  let awaitingCount = 0;
  let respondedCount = 0;
  let shippedCount = 0;
  let plannedCount = 0;
  let underReviewCount = 0;
  let declinedCount = 0;

  displayData.forEach((row) => {
    const update = localUpdates[row.id];
    const status = update?.status || row.status || 'New';
    const hasResponse = !!(update?.response && update.response.trim().length > 0);
    
    // Awaiting response: status is New/Under review and no response recorded yet
    if (!hasResponse && (status === 'New' || status === 'Under review')) {
      awaitingCount++;
    } else {
      respondedCount++;
    }

    if (status === 'Shipped') shippedCount++;
    else if (status === 'Planned') plannedCount++;
    else if (status === 'Under review') underReviewCount++;
    else if (status === 'Declined') declinedCount++;
  });

  const responseRate = totalItems > 0 ? Math.round((respondedCount / totalItems) * 100) : 0;

  const thisMonthItems = displayData.filter(d => {
    const date = new Date(d.submittedAt);
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  }).length;
  const priorMonthItems = displayData.filter(d => {
    const date = new Date(d.submittedAt);
    return date.getMonth() === priorMonth && date.getFullYear() === priorYear;
  }).length;
  const submissionsTrend = priorMonthItems > 0 
    ? parseFloat((((thisMonthItems - priorMonthItems) / priorMonthItems) * 100).toFixed(1))
    : (thisMonthItems > 0 ? 100 : 0);

  const uniqueCategories = Array.from(new Set(rawData.map((d: any) => d.categoryId).filter(Boolean)));

  // Donut chart distributions
  const dynamicStatusDistribution = [
    { name: 'Shipped', value: shippedCount, color: 'var(--sage)' },
    { name: 'Planned', value: plannedCount, color: 'var(--c-honey)' },
    { name: 'Under review', value: underReviewCount, color: 'var(--c-clay)' },
    { name: 'Awaiting Response', value: awaitingCount, color: 'var(--c-clay)' },
    { name: 'Declined', value: declinedCount, color: 'var(--ink-mute)' },
  ].filter(d => d.value > 0);

  const categoryCounts = displayData.reduce((acc: any, curr: any) => {
    const cat = curr.categoryId || 'General';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const colorPalette = ['var(--c-honey)', 'var(--c-sage)', 'var(--c-clay)', 'var(--sage)', 'var(--honey)', 'var(--c-clay)', 'var(--c-clay)'];
  const dynamicCategoryDistribution = Object.entries(categoryCounts).map(([name, value], i) => ({
    name,
    value: value as number,
    color: colorPalette[i % colorPalette.length]
  }));

  // Timeline Trend
  const monthlyTimelineMap = new Map<string, number>();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = d.toLocaleString('default', { month: 'short' });
    monthlyTimelineMap.set(label, 0);
  }

  displayData.forEach(item => {
    if (item.submittedAt) {
      const d = new Date(item.submittedAt);
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

  const handleActionClick = (row: any) => {
    if (expandedId === row.id) {
      setExpandedId(null);
    } else {
      setExpandedId(row.id);
      const update = localUpdates[row.id] || { status: row.status || 'New', response: '' };
      setDraftStatus(update.status);
      setDraftResponse(update.response);
    }
  };

  const handleSendResponse = (id: string) => {
    setLocalUpdates(prev => ({
      ...prev,
      [id]: { status: draftStatus, response: draftResponse }
    }));
    setExpandedId(null);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch {
      return dateStr;
    }
  };

  const handleExportCSV = () => {
    if (!sortedData || sortedData.length === 0) return;
    const exportData = sortedData.map((row: any) => ({
      Title: row.title || '-',
      Description: row.description || '-',
      Category: row.categoryId || 'General',
      'Submitted By': row.userName || 'Anonymous',
      'Date Submitted': formatDate(row.submittedAt),
      Status: (localUpdates[row.id]?.status || row.status || 'New'),
      Response: (localUpdates[row.id]?.response || '')
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const csv = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'feedback_issue_report.csv';
    link.click();
  };

  const handleExportExcel = () => {
    if (!sortedData || sortedData.length === 0) return;
    const exportData = sortedData.map((row: any) => ({
      Title: row.title || '-',
      Description: row.description || '-',
      Category: row.categoryId || 'General',
      'Submitted By': row.userName || 'Anonymous',
      'Date Submitted': formatDate(row.submittedAt),
      Status: (localUpdates[row.id]?.status || row.status || 'New'),
      Response: (localUpdates[row.id]?.response || '')
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Feedback');
    XLSX.writeFile(wb, 'feedback_issue_report.xlsx');
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
    <div className="pb-12">
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
            Feedback & Ideas · User Voice
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1.5">
            Submitted Ideas & Feedback {totalItems > 0 ? `(${totalItems})` : ''}
          </h1>
          <p className="text-[var(--ink-mute)] text-sm break-words max-w-2xl">
            Suggestions and feedback submitted by learners and corporate users. Reply to record action taken; your response is displayed back to the submitter.
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
          title="TOTAL SUBMISSIONS" 
          value={totalItems.toLocaleString()} 
          trend={submissionsTrend !== 0 ? submissionsTrend : undefined} 
          trendSuffix="%"
          trendLabel="vs prior period"
          icon={BarChart2}
          iconBgColor="bg-[var(--honey-wash)]" 
          iconColor="text-[var(--c-honey)]" 
        />
        <StatCard 
          title="AWAITING RESPONSE" 
          value={awaitingCount.toLocaleString()} 
          trend={awaitingCount > 0 ? `+${awaitingCount}` : undefined} 
          trendSuffix=""
          trendLabel="requires reply"
          trendColorMode="inverse"
          icon={User}
          iconBgColor="bg-[var(--clay-wash)]" 
          iconColor="text-[var(--c-clay)]" 
        />
        <StatCard 
          title="ACTIONED / RESPONDED" 
          value={respondedCount.toLocaleString()} 
          trend={respondedCount > 0 ? `+${respondedCount}` : undefined} 
          trendSuffix=""
          trendLabel="replied items"
          icon={CheckSquare}
          iconBgColor="bg-[var(--sage-wash)]" 
          iconColor="text-[var(--c-sage)]" 
        />
        <StatCard 
          title="RESPONSE RATE" 
          value={`${responseRate}%`} 
          trend={responseRate > 0 ? `+${responseRate}%` : undefined} 
          trendSuffix=""
          trendLabel="turnaround rate"
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
        <div className="py-[18px] px-[22px] card-body">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
            <div className="relative flex-1 min-w-[140px]">
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

            <div className="relative flex-1 min-w-[160px]">
              <CustomSelect
                placeholder="All types"
                value={localFilters.type || reportType}
                onChange={(val) => setLocalFilters(prev => ({ ...prev, type: val || 'ALL' }))}
                options={[
                  { value: 'ALL', label: 'All types (Ideas & Issues)' },
                  { value: 'IDEA', label: 'Ideas only' },
                  { value: 'ISSUE', label: 'Issues only' }
                ]}
              />
            </div>

            <div className="relative flex-1 min-w-[140px]">
              <CustomSelect
                placeholder="All statuses"
                value={localFilters.status || ''}
                onChange={(val) => setLocalFilters(prev => ({ ...prev, status: val || undefined }))}
                options={[
                  { value: 'New', label: 'New / Awaiting' },
                  { value: 'Under review', label: 'Under review' },
                  { value: 'Planned', label: 'Planned' },
                  { value: 'Shipped', label: 'Shipped' },
                  { value: 'Declined', label: 'Declined' }
                ]}
              />
            </div>

            <div className="relative flex-1 min-w-[140px]">
              <CustomSelect
                placeholder="All categories"
                value={localFilters.categoryId || ''}
                onChange={(val) => setLocalFilters(prev => ({ ...prev, categoryId: val || undefined }))}
                options={uniqueCategories.map((c: any) => ({ value: c, label: c }))}
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
            Submission volume & status overview
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
              title="ACTIONED RATE"
              data={dynamicStatusDistribution}
              centerLabel={`${responseRate}%`}
              centerSubLabel="RESPONDED"
              variant="bare"
              hideLegend={true}
              roundedCaps={true}
            />
            <div className="flex justify-center pb-[4px]">
              <span className="bg-[var(--sage-wash)] text-[var(--sage-text)] text-[length:var(--fs-label)] font-[var(--fw-semibold)] px-[12px] py-[4px] rounded-[var(--r-pill)] flex items-center justify-center gap-1.5 uppercase tracking-wider">
                <Check className="w-3.5 h-3.5" />
                ACTIVE
              </span>
            </div>
          </div>
          
          <div className="hidden lg:block w-px bg-[var(--line)] absolute left-[75%] top-[18px] bottom-[18px] -translate-x-1/2" />
          
          <div className="lg:col-span-3 py-[18px] px-[28px] flex flex-col ard-chart-col">
            <DonutChartWidget 
              title="CATEGORIES"
              data={dynamicCategoryDistribution.slice(0, 5)}
              centerLabel={totalItems.toString()}
              centerSubLabel="ITEMS"
              variant="bare"
              ariaLabel="Category distribution"
              chartSpacingClass="mt-4 mb-4"
            />
          </div>
        </div>
      </div>

      {/* Top Status Summary Badges (as shown in design) */}
      <div className="flex flex-wrap items-center gap-2.5 mb-4">
        <span className="inline-flex items-center px-3.5 py-1.5 rounded-full text-xs font-medium bg-[var(--c-honey-wash)] text-[var(--c-honey-text)] border border-[#E9DFB8] shadow-sm">
          <span className="w-2 h-2 rounded-full bg-[var(--c-honey)] mr-2"></span>
          {totalItems} total
        </span>
        <span className="inline-flex items-center px-3.5 py-1.5 rounded-full text-xs font-medium bg-[var(--c-danger-wash)] text-[var(--c-danger)] border border-[#FED7D7] shadow-sm">
          <span className="w-2 h-2 rounded-full bg-[var(--c-danger)] mr-2"></span>
          {awaitingCount} awaiting response
        </span>
        <span className="inline-flex items-center px-3.5 py-1.5 rounded-full text-xs font-medium bg-[var(--c-sage-wash)] text-[var(--c-sage-text)] border border-[#C6F6D5] shadow-sm">
          <span className="w-2 h-2 rounded-full bg-[var(--c-sage)] mr-2"></span>
          {respondedCount} responded
        </span>
      </div>

      {/* Ideas Table Card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md">
        <div className="py-4 px-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between gap-4 sm:items-center bg-white">
          <h2 className="text-base font-bold text-gray-900">
            All ideas
          </h2>
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input 
              type="text" 
              placeholder="Search ideas..." 
              value={search}
              onChange={handleSearch}
              className="h-9 w-full pr-8 pl-9 border border-gray-200 bg-[#FAFAFA] rounded-full text-xs text-gray-800 placeholder:text-gray-400 focus:bg-white focus:outline-none focus:border-amber-400 transition-colors"
            />
            {search && (
              <button 
                onClick={handleClearSearch}
                aria-label="Clear search"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="text-[11px] text-gray-400 uppercase bg-[#FAFAFA] border-b border-gray-100 font-semibold tracking-wider">
              <tr>
                <th className="py-3.5 px-6 whitespace-nowrap w-[38%] cursor-pointer hover:text-gray-700 transition-colors" onClick={() => handleSort('title')}>
                  <div className="flex items-center gap-1">
                    IDEA
                    <ChevronsUpDown className="w-3 h-3 text-gray-400" />
                  </div>
                </th>
                <th className="py-3.5 px-6 whitespace-nowrap cursor-pointer hover:text-gray-700 transition-colors" onClick={() => handleSort('categoryId')}>
                  <div className="flex items-center gap-1">
                    CATEGORY
                    <ChevronsUpDown className="w-3 h-3 text-gray-400" />
                  </div>
                </th>
                <th className="py-3.5 px-6 whitespace-nowrap cursor-pointer hover:text-gray-700 transition-colors" onClick={() => handleSort('userName')}>
                  <div className="flex items-center gap-1">
                    SUBMITTED BY
                    <ChevronsUpDown className="w-3 h-3 text-gray-400" />
                  </div>
                </th>
                <th className="py-3.5 px-6 whitespace-nowrap cursor-pointer hover:text-gray-700 transition-colors" onClick={() => handleSort('submittedAt')}>
                  <div className="flex items-center gap-1">
                    DATE
                    <ChevronsUpDown className="w-3 h-3 text-gray-400" />
                  </div>
                </th>
                <th className="py-3.5 px-6 whitespace-nowrap cursor-pointer hover:text-gray-700 transition-colors" onClick={() => handleSort('status')}>
                  <div className="flex items-center gap-1">
                    STATUS
                    <ChevronsUpDown className="w-3 h-3 text-gray-400" />
                  </div>
                </th>
                <th className="py-3.5 px-6 whitespace-nowrap text-right pr-8">
                  ACTION
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {visibleData.map((row: any) => {
                const update = localUpdates[row.id] || { status: row.status || 'New', response: '' };
                const currentStatus = update.status;
                const hasRecordedResponse = !!(update.response && update.response.trim().length > 0);
                const isAwaiting = !hasRecordedResponse && (currentStatus === 'New' || currentStatus === 'Under review');
                const isExpanded = expandedId === row.id;

                return (
                  <React.Fragment key={row.id}>
                    <tr className={`transition-colors ${isExpanded ? 'bg-amber-50/30' : 'hover:bg-gray-50/60'}`}>
                      <td className="py-4 px-6 align-middle">
                        <div className="font-bold text-gray-900 text-sm mb-0.5">
                          {row.title}
                        </div>
                        <div className="text-gray-500 text-xs leading-relaxed max-w-lg">
                          {row.description}
                        </div>
                      </td>
                      <td className="py-4 px-6 align-middle whitespace-nowrap">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white text-gray-600 border border-gray-200 shadow-2xs">
                          {row.categoryId || 'Feature'}
                        </span>
                      </td>
                      <td className="py-4 px-6 align-middle text-gray-800 text-sm whitespace-nowrap">
                        {row.userName || 'Anonymous'}
                      </td>
                      <td className="py-4 px-6 align-middle text-sm text-gray-600 whitespace-nowrap">
                        {formatDate(row.submittedAt)}
                      </td>
                      <td className="py-4 px-6 align-middle whitespace-nowrap">
                        {currentStatus === 'Planned' && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[var(--c-honey-wash)] text-[var(--c-honey-text)] border border-[#FDE68A]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[var(--c-honey)] mr-1.5"></span>
                            Planned
                          </span>
                        )}
                        {currentStatus === 'Under review' && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[var(--c-clay-wash)] text-[var(--c-clay-text)] border border-[#BFDBFE]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[var(--c-clay)] mr-1.5"></span>
                            Under review
                          </span>
                        )}
                        {currentStatus === 'New' && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[#F9FAFB] text-[#4B5563] border border-[#E5E7EB]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#9CA3AF] mr-1.5"></span>
                            New
                          </span>
                        )}
                        {currentStatus === 'Shipped' && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[var(--c-sage-wash)] text-[var(--c-sage-text)] border border-[#A7F3D0]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[var(--c-sage)] mr-1.5"></span>
                            Shipped
                          </span>
                        )}
                        {currentStatus === 'Declined' && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[var(--c-danger-wash)] text-[var(--c-danger)] border border-[#FECACA]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[var(--c-danger)] mr-1.5"></span>
                            Declined
                          </span>
                        )}
                        {!['Planned', 'Under review', 'New', 'Shipped', 'Declined'].includes(currentStatus) && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-50 text-gray-700 border border-gray-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-gray-400 mr-1.5"></span>
                            {currentStatus}
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 align-middle text-right pr-8 whitespace-nowrap">
                        {isAwaiting ? (
                          <button 
                            onClick={() => handleActionClick(row)} 
                            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold bg-[#FEF08A] hover:bg-[#FDE047] text-gray-900 border border-[#FDE047] shadow-xs transition-all duration-200 hover:-translate-y-0.5 cursor-pointer"
                          >
                            <Mail className="w-3.5 h-3.5 stroke-[2.2]" />
                            Reply
                          </button>
                        ) : (
                          <button 
                            onClick={() => handleActionClick(row)} 
                            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 shadow-xs transition-all duration-200 hover:-translate-y-0.5 cursor-pointer"
                          >
                            <Mail className="w-3.5 h-3.5 stroke-[2.2]" />
                            Edit reply
                          </button>
                        )}
                      </td>
                    </tr>
                    
                    {/* Collapsible Action Drawer */}
                    {isExpanded && (
                      <tr className="bg-amber-50/20 border-b border-gray-200">
                        <td colSpan={6} className="py-4 px-6">
                          <div className="max-w-3xl space-y-4 bg-white p-5 rounded-xl border border-gray-200 shadow-sm my-2">
                            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                Response to {row.userName || 'Submitter'}
                              </span>
                              <span className="text-xs text-gray-500">
                                Original: "{row.title}"
                              </span>
                            </div>
                            
                            {update.response && (
                              <div className="bg-[var(--c-sage-wash)] border border-[#C6F6D5] rounded-lg p-3.5 space-y-1">
                                <div className="text-[11px] font-bold text-[var(--c-sage-text)] uppercase tracking-wider">
                                  Current published response (visible to user)
                                </div>
                                <div className="text-sm text-gray-800 leading-relaxed">
                                  {update.response}
                                </div>
                              </div>
                            )}

                            <div className="flex items-center gap-3">
                              <span className="text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                                Update Status
                              </span>
                              <select 
                                value={draftStatus}
                                onChange={(e) => setDraftStatus(e.target.value)}
                                className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-semibold text-gray-800 bg-white focus:outline-none focus:border-amber-400 shadow-2xs"
                              >
                                <option value="New">New</option>
                                <option value="Under review">Under review</option>
                                <option value="Planned">Planned</option>
                                <option value="Shipped">Shipped</option>
                                <option value="Declined">Declined</option>
                              </select>
                            </div>

                            <div>
                              <textarea 
                                value={draftResponse}
                                onChange={(e) => setDraftResponse(e.target.value)}
                                placeholder="Write the response the user will see, e.g. what action is being taken on this idea..."
                                className="w-full border border-gray-200 rounded-lg p-3 text-xs text-gray-800 focus:outline-none focus:border-amber-400 shadow-2xs min-h-[90px] resize-y"
                              />
                            </div>

                            <div className="flex space-x-3 pt-1">
                              <button 
                                onClick={() => handleSendResponse(row.id)}
                                className="px-5 py-2 bg-amber-400 hover:bg-amber-500 text-gray-900 font-semibold rounded-full text-xs transition-all duration-200 hover:-translate-y-0.5 shadow-sm cursor-pointer flex items-center gap-1.5"
                              >
                                <Send className="w-3.5 h-3.5" />
                                Save response
                              </button>
                              <button 
                                onClick={() => setExpandedId(null)}
                                className="px-5 py-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 font-semibold rounded-full text-xs transition-colors cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
              
              {visibleData.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 px-6 text-center text-gray-500 text-sm">
                    {search ? `No ideas match "${search}".` : 'No feedback or ideas submitted yet.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="py-4 px-6 border-t border-gray-100 text-center bg-white">
          <span className="text-xs font-medium text-gray-500">
            Showing {visibleData.length} of {totalItems} submissions
            {search && ` (filtered by "${search}")`}
            {hasMore && (
              <>
                {' · '}
                <button
                  onClick={() => setVisibleCount(v => v + 6)}
                  className="text-amber-600 hover:underline font-semibold cursor-pointer"
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

