import React, { useState } from 'react';
import { 
  Download, ArrowRight, CheckCircle2, Search
} from 'lucide-react';
import { CheckSquare, BarChart2, Star, User } from '../../../assets/icons';
import { StatCard } from '../../../components/Reports/StatCard';
import { LineChartWidget } from '../../../components/Reports/LineChartWidget';
import { DonutChartWidget } from '../../../components/Reports/DonutChartWidget';

import { Link } from "react-router";
import { useAssessmentReport } from '../../../hooks/useReports';
import { ReportFilter } from '../../../types/reports.types';
import * as XLSX from 'xlsx';
import { Skeleton } from '../../../components/ui/Skeleton/Skeleton';

export const QuizReport: React.FC = () => {
  const { data: reportData, isLoading } = useAssessmentReport();
  const [selectedQuiz, setSelectedQuiz] = useState<any | null>(null);
  const [filters, setFilters] = useState({ period: '30days', quiz: 'all', course: 'all', role: 'all' });
  const [search, setSearch] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };
  
  const displayData = reportData?.data || [];
  
  const uniqueQuizzes = Array.from(new Set(displayData.map((d: any) => d.quizTitle))).filter(Boolean);
  const uniqueCourses = Array.from(new Set(displayData.map((d: any) => d.courseTitle))).filter(Boolean);

  let filteredDisplayData = displayData.filter((row: any) => {
    let match = true;
    if (filters.quiz !== 'all' && row.quizTitle !== filters.quiz) match = false;
    if (filters.course !== 'all' && row.courseTitle !== filters.course) match = false;
    return match;
  });

  let tableData = [...filteredDisplayData];
  if (search.trim()) {
    const q = search.toLowerCase();
    tableData = tableData.filter((row: any) => 
       row.quizTitle?.toLowerCase().includes(q) || 
       row.courseTitle?.toLowerCase().includes(q)
    );
  }

  if (sortConfig) {
    tableData.sort((a: any, b: any) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];
      
      if (aVal == null) aVal = '';
      if (bVal == null) bVal = '';
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }

  const handleExportCSV = () => {
    if (!filteredDisplayData || filteredDisplayData.length === 0) return;
    const exportData = filteredDisplayData.map((row: any) => ({
      Quiz: row.quizTitle || 'Unknown',
      Course: row.courseTitle || 'Unknown',
      Attempts: row.totalAttempts || 0,
      'Pass rate': row.passRate || 0,
      'Avg score': row.averageScore || 0
    }));
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const csvContent = XLSX.utils.sheet_to_csv(worksheet);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'nexus-quiz-report.csv';
    link.click();
  };

  const handleExportExcel = () => {
    if (!filteredDisplayData || filteredDisplayData.length === 0) return;
    const exportData = filteredDisplayData.map((row: any) => ({
      Quiz: row.quizTitle || 'Unknown',
      Course: row.courseTitle || 'Unknown',
      Attempts: row.totalAttempts || 0,
      'Pass rate': row.passRate || 0,
      'Avg score': row.averageScore || 0
    }));
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');
    XLSX.writeFile(workbook, 'nexus-quiz-report.xlsx');
  };

  const handleViewDetails = (row: any) => {
    setSelectedQuiz(row);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Dummy data for visual fidelity matching screenshot
  const dynamicTrendData = Array.from({ length: 30 }).map((_, i) => ({
    day: `Day ${i + 1}`,
    avgScore: Math.floor(Math.random() * 20) + 70
  }));

  // Dynamic values based on selected quiz or aggregates
  let totalAttemptsDisplay = "0";
  let passRateDisplay = "0%";
  let passRateNum = 0;
  let avgScoreDisplay = "0";
  let avgScoreNum = 0;

  if (selectedQuiz) {
    totalAttemptsDisplay = (selectedQuiz.totalAttempts || 0).toLocaleString();
    passRateNum = (selectedQuiz.passRate || 0);
    passRateDisplay = `${passRateNum}%`;
    avgScoreNum = (selectedQuiz.averageScore || 0);
    avgScoreDisplay = avgScoreNum.toString();
  } else if (filteredDisplayData.length > 0) {
    const total = filteredDisplayData.reduce((acc: number, curr: any) => acc + (curr.totalAttempts || 0), 0);
    totalAttemptsDisplay = total.toLocaleString();
    passRateNum = Math.round(filteredDisplayData.reduce((acc: number, curr: any) => acc + (curr.passRate || 0), 0) / filteredDisplayData.length);
    passRateDisplay = `${passRateNum}%`;
    avgScoreNum = Math.round(filteredDisplayData.reduce((acc: number, curr: any) => acc + (curr.averageScore || 0), 0) / filteredDisplayData.length);
    avgScoreDisplay = avgScoreNum.toString();
  }
  
  const card4Title = selectedQuiz ? "STATUS" : "AVG ATTEMPTS TO PASS";
  const card4Value = selectedQuiz ? (selectedQuiz.status || 'Published') : "1.6";
  const card4Trend = selectedQuiz ? undefined : -0.2;
  const card4Icon = selectedQuiz ? CheckCircle2 : User;

  const breakdownData = [
    { name: 'Completed', value: passRateNum, color: 'var(--c-sage)' },
    { name: 'In Progress', value: selectedQuiz ? 0 : 15, color: 'var(--c-honey)' },
    { name: 'Not started', value: selectedQuiz ? (100 - passRateNum) : 13, color: 'var(--c-danger)' },
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
        {selectedQuiz ? (
          <button onClick={() => setSelectedQuiz(null)} className="inline-flex items-center text-[12px] font-medium text-[var(--ink-mute)] uppercase tracking-wider hover:text-[var(--c-honey)] transition-colors cursor-pointer">
            ← All Quizzes
          </button>
        ) : (
          <Link to="/admin/reports" className="inline-flex items-center text-[12px] font-medium text-[var(--ink-mute)] uppercase tracking-wider hover:text-[var(--c-honey)] transition-colors">
            ← REPORTS
          </Link>
        )}
      </div>
      <div className="flex flex-col md:flex-row md:justify-between items-start md:items-center gap-4 mb-6">
        <div className="w-full md:w-auto">
          <div className="flex items-center text-[12px] text-[var(--ink-mute)] uppercase tracking-wider mb-[6px] font-medium">
            Quiz performance · Drill-in
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1.5">
            {selectedQuiz ? selectedQuiz.quizTitle : 'Quiz performance report'}
          </h1>
          <p className="text-[var(--ink-mute)] text-sm break-words">
            {selectedQuiz
              ? (selectedQuiz.courseTitle || 'No Course Associated')
              : 'Last 30 days · All quizzes · All courses'}
          </p>
        </div>
        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          <button onClick={handleExportCSV} className="flex-1 md:flex-none justify-center flex items-center px-[20px] py-[8px] bg-[var(--hero-bg)] text-[var(--ink)] font-[var(--fw-medium)] rounded-[var(--r-pill)] text-[length:var(--fs-body)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-md)] border border-[var(--c-honey-soft)] cursor-pointer">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </button>
          <button onClick={handleExportExcel} className="flex-1 md:flex-none justify-center flex items-center px-[20px] py-[8px] bg-[var(--hero-bg)] text-[var(--ink)] font-[var(--fw-medium)] rounded-[var(--r-pill)] text-[length:var(--fs-body)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-md)] border border-[var(--c-honey-soft)] cursor-pointer">
            <Download className="w-4 h-4 mr-2" />
            Export Excel
          </button>
        </div>
      </div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatCard 
          title="QUIZ ATTEMPTS" 
          value={totalAttemptsDisplay} 
          trend={selectedQuiz ? undefined : 9.1} 
          icon={CheckSquare} 
          iconBgColor="bg-[var(--honey-wash)]" 
          iconColor="text-[var(--c-honey)]" 
        />
        <StatCard 
          title="PASS RATE" 
          value={passRateDisplay} 
          trend={selectedQuiz ? undefined : 6.0} 
          icon={BarChart2} 
          iconBgColor="bg-[var(--sage-wash)]" 
          iconColor="text-[var(--c-sage)]" 
        />
        <StatCard 
          title="AVG SCORE" 
          value={avgScoreDisplay} 
          trend={selectedQuiz ? undefined : -1.4} 
          trendSuffix=" pts"
          icon={Star} 
          iconBgColor="bg-[var(--clay-wash)]" 
          iconColor="text-[var(--c-clay)]" 
        />
        <StatCard 
          title={card4Title} 
          value={card4Value} 
          trend={card4Trend} 
          trendSuffix=""
          trendColorMode="inverse"
          icon={card4Icon} 
          iconBgColor="bg-[var(--honey-wash)]" 
          iconColor="text-[var(--c-honey)]" 
        />
      </div>

      {/* Filters */}
      {!selectedQuiz && (
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
                onChange={e => setFilters({...filters, period: e.target.value})}
                className="h-[36px] px-3 border border-[var(--line)] bg-[var(--paper)] rounded-[var(--r-md)] text-[length:var(--fs-body)] font-[var(--fw-regular)] text-[var(--ink)] focus:outline-none focus:border-[var(--ink-soft)] transition-colors flex-1 min-w-[150px]"
              >
                <option value="30days">Last 30 days</option>
                <option value="7days">Last 7 days</option>
                <option value="90days">Last 90 days</option>
                <option value="year">This year</option>
              </select>
              <select 
                value={filters.quiz}
                onChange={e => setFilters({...filters, quiz: e.target.value})}
                className="h-[36px] px-3 border border-[var(--line)] bg-[var(--paper)] rounded-[var(--r-md)] text-[length:var(--fs-body)] font-[var(--fw-regular)] text-[var(--ink)] focus:outline-none focus:border-[var(--ink-soft)] transition-colors flex-1 min-w-[150px]"
              >
                <option value="all">All quizzes</option>
                {uniqueQuizzes.map((q: any) => <option key={q} value={q}>{q}</option>)}
              </select>
              <select 
                value={filters.course}
                onChange={e => setFilters({...filters, course: e.target.value})}
                className="h-[36px] px-3 border border-[var(--line)] bg-[var(--paper)] rounded-[var(--r-md)] text-[length:var(--fs-body)] font-[var(--fw-regular)] text-[var(--ink)] focus:outline-none focus:border-[var(--ink-soft)] transition-colors flex-1 min-w-[150px]"
              >
                <option value="all">All courses</option>
                {uniqueCourses.map((c: any) => <option key={c} value={c}>{c}</option>)}
              </select>
              <select 
                value={filters.role}
                onChange={e => setFilters({...filters, role: e.target.value})}
                className="h-[36px] px-3 border border-[var(--line)] bg-[var(--paper)] rounded-[var(--r-md)] text-[length:var(--fs-body)] font-[var(--fw-regular)] text-[var(--ink)] focus:outline-none focus:border-[var(--ink-soft)] transition-colors flex-1 min-w-[150px]"
              >
                <option value="all">All roles</option>
                <option value="learner">Learner</option>
                <option value="developer">Content Developer</option>
                <option value="sme">SME Reviewer</option>
                <option value="admin">Org Admin</option>
              </select>
              <button 
                onClick={() => setFilters({ period: '30days', quiz: 'all', course: 'all', role: 'all' })}
                className="px-[20px] py-[8px] bg-[var(--surface-wash)] hover:bg-[var(--line)] text-[var(--ink)] font-[var(--fw-semibold)] rounded-[var(--r-pill)] text-[length:var(--fs-meta)] transition-colors ml-auto border border-[var(--line)] cursor-pointer"
              >
                Clear
              </button>
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
              yKey="avgScore"
              color="var(--c-honey)"
              variant="bare"
            />
          </div>

          <div className="hidden lg:block w-px bg-[var(--line)] absolute left-[50%] top-[18px] bottom-[18px] -translate-x-1/2" />
          
          <div className="lg:col-span-3 py-[18px] px-[28px] flex flex-col min-h-[240px]">
            <DonutChartWidget 
              title="AVG SCORE"
              data={[
                { name: 'Score', value: avgScoreNum, color: 'var(--sage)' }, 
                { name: 'Remaining', value: Math.max(0, 100 - avgScoreNum), color: 'var(--surface-3)' }
              ]}
              centerLabel={avgScoreNum.toString()}
              centerSubLabel="OUT OF 100"
              variant="bare"
            />
          </div>

          <div className="hidden lg:block w-px bg-[var(--line)] absolute left-[75%] top-[18px] bottom-[18px] -translate-x-1/2" />
          
          <div className="lg:col-span-3 py-[18px] px-[28px] flex flex-col min-h-[240px]">
            <DonutChartWidget 
              title="BREAKDOWN"
              data={breakdownData}
              centerLabel={`${passRateNum}%`}
              centerSubLabel={selectedQuiz ? "PASSED" : "DONE"}
              variant="bare"
            />
          </div>
        </div>
      </div>

      {/* Custom Tailwind Table - hidden if a quiz is selected to match the drill-down feel */}
      {!selectedQuiz && (
        <div className="bg-white rounded-[var(--r-lg)] border border-[var(--line)] shadow-[var(--shadow-sm)] overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-md)] mt-6">
          <div className="py-[14px] px-[16px] border-b border-[var(--line)] flex flex-col sm:flex-row justify-between gap-4 sm:items-center bg-[var(--surface)]">
            <div className="relative w-full sm:flex-1 max-w-3xl">
              <Search className="w-4 h-4 text-[var(--ink-mute)] absolute left-[12px] top-1/2 -translate-y-1/2 pointer-events-none" />
              <input 
                type="text" 
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search quizzes..." 
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
                  <th className="py-[14px] px-[16px] whitespace-nowrap cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('quizTitle')}>
                    Quiz <span className="ml-1 text-[var(--ink-faint)] font-[var(--fw-regular)]">{sortConfig?.key === 'quizTitle' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}</span>
                  </th>
                  <th className="py-[14px] px-[16px] whitespace-nowrap cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('courseTitle')}>
                    Course <span className="ml-1 text-[var(--ink-faint)] font-[var(--fw-regular)]">{sortConfig?.key === 'courseTitle' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}</span>
                  </th>
                  <th className="py-[14px] px-[16px] whitespace-nowrap cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('totalAttempts')}>
                    Attempts <span className="ml-1 text-[var(--ink-faint)] font-[var(--fw-regular)]">{sortConfig?.key === 'totalAttempts' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}</span>
                  </th>
                  <th className="py-[14px] px-[16px] whitespace-nowrap cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('passRate')}>
                    Pass Rate <span className="ml-1 text-[var(--ink-faint)] font-[var(--fw-regular)]">{sortConfig?.key === 'passRate' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}</span>
                  </th>
                  <th className="py-[14px] px-[16px] whitespace-nowrap cursor-pointer hover:bg-gray-100 transition-colors text-right" onClick={() => handleSort('averageScore')}>
                    Avg Score <span className="ml-1 text-[var(--ink-faint)] font-[var(--fw-regular)]">{sortConfig?.key === 'averageScore' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}</span>
                  </th>
                  <th className="py-[14px] px-[16px]"></th>
                </tr>
              </thead>
              <tbody>
              {tableData.map((row: any, index: number) => {
                  return (
                    <tr key={row.quizId || index} className="border-b border-[var(--line)] hover:bg-[var(--surface-wash)] transition-colors">
                      <td className="py-[14px] px-[16px] font-[var(--fw-medium)] text-[length:var(--fs-body)] text-[var(--ink)]">{row.quizTitle}</td>
                      <td className="py-[14px] px-[16px] text-[var(--ink-mute)] font-[var(--fw-medium)]">{row.courseTitle || '-'}</td>
                      <td className="py-[14px] px-[16px] font-[var(--fw-medium)]">{row.totalAttempts?.toLocaleString() || 0}</td>
                      <td className="py-[14px] px-[16px]">
                        <div className="flex items-center justify-start space-x-2">
                          <div className="w-32 bg-[var(--surface-3)] rounded-full h-1.5 flex-shrink-0">
                            <div className={`h-1.5 rounded-full ${row.passRate >= 70 ? 'bg-[var(--sage)]' : 'bg-[var(--c-clay)]'}`} style={{ width: `${row.passRate || 0}%` }}></div>
                          </div>
                          <span className="text-[length:var(--fs-meta)] font-[var(--fw-medium)] text-[var(--ink-mute)] w-10 text-left">{row.passRate || 0}%</span>
                        </div>
                      </td>
                      <td className="py-[14px] px-[16px] font-[var(--fw-bold)] text-right">{row.averageScore || 0}</td>
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
                    <td colSpan={6} className="py-[32px] px-[16px] text-center text-[var(--ink-mute)] text-[length:var(--fs-body)]">
                      No data available.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

