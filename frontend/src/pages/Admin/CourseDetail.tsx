import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { getAssignmentReportApi } from '../../core/api/corporate-learning.api';
import { courseDetailsApi } from '../../core/api/course-details/courseDetails.api';
import { getCareerPathApi } from '../../core/api/career-path/career-path.api';
import { getTenantDashboardStatsApi } from '../../core/api/tenant.api';
import { ArrowLeft, Loader2, Search, Users } from 'lucide-react';

const CourseDetail: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const queryId = searchParams.get('id');
  const queryType = (searchParams.get('type') || 'COURSE').toUpperCase();

  const [loading, setLoading] = useState(true);
  const [, setActiveId] = useState<string | null>(queryId);
  const [activeType, setActiveType] = useState<string>(queryType);
  const [metadata, setMetadata] = useState<any>(null);
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [searchFilter, setSearchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'COMPLETED' | 'IN_PROGRESS' | 'NOT_STARTED' | 'OVERDUE'>('ALL');
  const [showAll, setShowAll] = useState(false);
  const [reminderSent, setReminderSent] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        setLoading(true);
        const storedUser = localStorage.getItem('keycloak_session_user');
        if (!storedUser) return;
        const parsed = JSON.parse(storedUser);
        const user = parsed?.user || parsed;
        const tenantId = user?.tenantId || user?.tenant?.id || user?.organizationId;
        if (!tenantId) return;

        let contentId = queryId;
        let contentType = queryType;

        // Fallback to first active course or career path if id is omitted in URL
        if (!contentId) {
          try {
            const stats = await getTenantDashboardStatsApi(tenantId);
            const courses = stats?.courseEnrollmentVsCompletion || [];
            if (courses.length > 0) {
              contentId = courses[0].courseId || courses[0].id;
              contentType = courses[0].contentType || (courses[0].careerPathId ? 'CAREER_PATH' : 'COURSE');
            }
          } catch (e) {
            console.error("Failed to load tenant stats fallback", e);
          }
        }

        if (!contentId) {
          if (isMounted) setLoading(false);
          return;
        }

        if (isMounted) {
          setActiveId(contentId);
          setActiveType(contentType);
        }

        // 1. Fetch assignment deliveries for this content
        const reportPromise = getAssignmentReportApi(tenantId, {
          contentId,
          contentType: contentType as any,
          limit: 100,
        }).catch(() => []);

        // 2. Fetch course or career path details
        const metadataPromise = (contentType === 'CAREER_PATH'
          ? getCareerPathApi(contentId).then(r => r?.data || r)
          : courseDetailsApi.getCourseDetails(contentId)
        ).catch(() => null);

        const [reportData, metaData] = await Promise.all([reportPromise, metadataPromise]);

        if (isMounted) {
          const items = Array.isArray(reportData) ? reportData : (reportData?.items || []);
          setDeliveries(items);
          setMetadata(metaData);
        }
      } catch (err) {
        console.error("Failed to load course details", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [queryId, queryType]);

  // Derived Title & Properties
  const title = metadata?.title || deliveries[0]?.contentTitle || "Course Details";
  const categoryName = metadata?.category?.name || metadata?.category || (activeType === 'CAREER_PATH' ? 'Career Path' : 'Course');
  const difficulty = metadata?.difficulty || deliveries[0]?.difficulty || 'Intermediate';
  const isMandatory = deliveries.some((d: any) => d.requirement === 'MANDATORY') || metadata?.isMandatory;

  const totalLessonsOrCourses = useMemo(() => {
    if (activeType === 'CAREER_PATH') {
      return metadata?.courses?.length || deliveries[0]?.totalCourses || 0;
    }
    return metadata?.courseLessons?.length || deliveries[0]?.totalLessons || 0;
  }, [activeType, metadata, deliveries]);

  const durationFormatted = useMemo(() => {
    const mins = metadata?.duration || deliveries[0]?.duration || 0;
    if (!mins) return null;
    if (mins >= 60) {
      const hrs = Math.round((mins / 60) * 10) / 10;
      return `${hrs} ${hrs === 1 ? 'hour' : 'hours'}`;
    }
    return `${mins} mins`;
  }, [metadata, deliveries]);

  // Map Real Enrollees
  const enrollees = useMemo(() => {
    return deliveries.map((d: any, index: number) => {
      const isCompleted = d.progressPercent >= 100 || d.deliveryStatus === 'COMPLETED';
      const isOverdue = !isCompleted && (d.complianceStatus === 'EXPIRED' || (d.dueDate && new Date(d.dueDate) < new Date()));
      const isInProgress = !isCompleted && !isOverdue && d.progressPercent > 0;

      let statusText = 'Not Started';
      let statusBadgeClass = 'text-[var(--ink-soft)] border-[var(--line-strong)] bg-transparent';
      let statusCode = 'NOT_STARTED';

      if (isCompleted) {
        statusText = 'Course Completed';
        statusBadgeClass = 'text-[#2e7d32] !border-[#a5d6a7] bg-[#e8f5e9]';
        statusCode = 'COMPLETED';
      } else if (isOverdue) {
        statusText = 'Overdue';
        statusBadgeClass = 'text-[#c62828] !border-[#ef9a9a] bg-[#ffebee]';
        statusCode = 'OVERDUE';
      } else if (isInProgress) {
        statusText = 'In Progress';
        statusBadgeClass = 'text-[#8b6a1f] !border-[#f6e8c4] bg-[#fdf8ed]';
        statusCode = 'IN_PROGRESS';
      }

      let completionDateFormatted = '-';
      let dueDateFormatted = '-';

      if (d.completedAt) {
        completionDateFormatted = new Date(d.completedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      } else if (isCompleted && d.assignedAt) {
        completionDateFormatted = new Date(d.assignedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      }

      if (d.dueDate) {
        dueDateFormatted = new Date(d.dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      }

      return {
        id: d.deliveryId || d.userId || index,
        userId: d.userId,
        name: d.userName || d.userEmail || `Member ${index + 1}`,
        email: d.userEmail,
        progress: Math.min(100, Math.max(0, Math.round(d.progressPercent || 0))),
        status: statusText,
        statusCode,
        statusBadgeClass,
        date: completionDateFormatted,
        completionDate: completionDateFormatted,
        dueDate: dueDateFormatted,
      };
    });
  }, [deliveries]);

  // Metric Computations
  const totalAssigned = enrollees.length;
  const completedCount = enrollees.filter(e => e.statusCode === 'COMPLETED').length;
  const completionPercent = totalAssigned > 0 ? Math.round((completedCount / totalAssigned) * 100) : 0;
  const overdueCount = enrollees.filter(e => e.statusCode === 'OVERDUE').length;

  // Filtering
  const filteredEnrollees = useMemo(() => {
    return enrollees.filter(e => {
      if (statusFilter !== 'ALL' && e.statusCode !== statusFilter) return false;
      if (searchFilter) {
        const q = searchFilter.toLowerCase();
        return e.name.toLowerCase().includes(q) || (e.email && e.email.toLowerCase().includes(q));
      }
      return true;
    });
  }, [enrollees, statusFilter, searchFilter]);

  const displayedEnrollees = showAll ? filteredEnrollees : filteredEnrollees.slice(0, 8);

  const handleSendReminder = () => {
    setReminderSent(true);
    setTimeout(() => setReminderSent(false), 3500);
  };

  if (loading) {
    return (
      <div className="min-w-0 relative w-full animate-pulse">
        {/* Back button skeleton */}
        <div className="h-4 w-32 bg-gray-200 rounded mb-[18px]"></div>
        
        {/* Header Info skeleton */}
        <div className="grid grid-cols-[minmax(0,1fr)_400px] items-start gap-[32px] mb-[28px] max-[1100px]:grid-cols-1">
          <div>
            <div className="h-4 w-48 bg-gray-200 rounded mb-[6px]"></div>
            <div className="h-10 w-3/4 bg-gray-200 rounded mb-[12px]"></div>
            <div className="flex gap-[8px]">
              <div className="h-6 w-24 bg-gray-200 rounded-full"></div>
              <div className="h-6 w-24 bg-gray-200 rounded-full"></div>
              <div className="h-6 w-32 bg-gray-200 rounded-full"></div>
            </div>
          </div>
          <div className="flex gap-[10px] sm:justify-end">
            <div className="h-10 w-32 bg-gray-200 rounded-full"></div>
            <div className="h-10 w-40 bg-gray-200 rounded-full"></div>
          </div>
        </div>

        {/* Metrics Row skeleton */}
        <div className="grid grid-cols-3 gap-[14px] mb-[28px] max-lg:grid-cols-2 max-[600px]:grid-cols-1">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-[var(--paper)] border border-solid border-[var(--line)] rounded-[var(--r-lg)] pt-[18px] px-[18px] pb-[16px]">
              <div className="rounded-[11px] w-[38px] h-[38px] mb-[12px] bg-gray-200"></div>
              <div className="h-3 w-20 bg-gray-200 rounded mb-[8px]"></div>
              <div className="h-8 w-16 bg-gray-200 rounded mb-[6px]"></div>
              <div className="h-3 w-32 bg-gray-200 rounded mt-[6px]"></div>
            </div>
          ))}
        </div>

        {/* Enrollees List Card skeleton */}
        <div className="bg-[var(--paper)] border border-solid border-[var(--line)] rounded-[var(--r-lg)] mb-[40px]">
          <div className="border-b border-solid border-[var(--line)] justify-between items-center px-[22px] py-[16px] flex flex-wrap gap-4">
            <div className="h-6 w-48 bg-gray-200 rounded"></div>
            <div className="flex gap-3">
              <div className="h-8 w-[180px] bg-gray-200 rounded-lg"></div>
              <div className="h-8 w-[120px] bg-gray-200 rounded-lg"></div>
            </div>
          </div>
          <div className="p-0 overflow-x-auto">
            <table className="w-full min-w-[800px] border-separate border-spacing-0">
              <thead>
                <tr>
                  {[1, 2, 3, 4].map((i) => (
                    <th key={i} className="border-b border-[var(--line)] bg-[var(--paper-2)] px-[16px] py-[11px]">
                      <div className="h-4 w-24 bg-gray-200 rounded"></div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[1, 2, 3, 4, 5].map((row) => (
                  <tr key={row}>
                    <td className="border-b border-[var(--line)] px-[16px] py-[14px]">
                      <div className="h-4 w-32 bg-gray-200 rounded mb-2"></div>
                      <div className="h-3 w-40 bg-gray-200 rounded"></div>
                    </td>
                    <td className="border-b border-[var(--line)] px-[16px] py-[14px]">
                      <div className="h-6 w-24 bg-gray-200 rounded-full"></div>
                    </td>
                    <td className="border-b border-[var(--line)] px-[16px] py-[14px]">
                      <div className="flex gap-2 items-center">
                        <div className="h-2 flex-1 bg-gray-200 rounded-full"></div>
                        <div className="h-4 w-8 bg-gray-200 rounded"></div>
                      </div>
                    </td>
                    <td className="border-b border-[var(--line)] px-[16px] py-[14px]">
                      <div className="h-4 w-24 bg-gray-200 rounded"></div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-w-0 relative w-full">
      {/* Back button */}
      <button
        type="button"
        className="font-[family-name:var(--font-label)] text-[length:var(--fs-label)] tracking-[0.1em] uppercase text-[var(--ink-mute)] cursor-pointer bg-transparent border-none items-center gap-[6px] mb-[18px] p-0 font-medium transition-colors duration-150 inline-flex hover:text-[var(--accent)]"
        onClick={() => navigate('/admin/reports')}
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to reports
      </button>

      {/* Header Info */}
      <div className="grid grid-cols-[minmax(0,1fr)_400px] items-start gap-[32px] mb-[28px] max-[1100px]:grid-cols-1">
        <div>
          <div className="font-[family-name:var(--font-label)] text-[length:var(--fs-label)] tracking-[0.14em] uppercase text-[var(--ink-mute)] mb-[6px] font-medium">
            {activeType === 'CAREER_PATH' ? 'Career Path' : 'Course'} {categoryName ? `· ${categoryName}` : ''}
          </div>
          <h1 className="font-sans tracking-[-0.02em] text-[var(--ink)] text-[32px] font-bold leading-[1.15]">
            {title}
          </h1>
          <div className="flex flex-wrap gap-[8px] mt-[12px]">
            {totalLessonsOrCourses > 0 && (
              <span className="rounded-[var(--r-pill)] border-[1.5px] border-solid border-[var(--line-strong)] h-[22px] font-[family-name:var(--font-label)] text-[length:var(--fs-label)] tracking-[0.06em] text-[var(--ink-soft)] whitespace-nowrap bg-transparent items-center gap-[5px] px-[10px] font-medium inline-flex">
                {activeType === 'CAREER_PATH' ? `${totalLessonsOrCourses} courses` : `${totalLessonsOrCourses} lessons`}
              </span>
            )}
            {durationFormatted && (
              <span className="rounded-[var(--r-pill)] border-[1.5px] border-solid border-[var(--line-strong)] h-[22px] font-[family-name:var(--font-label)] text-[length:var(--fs-label)] tracking-[0.06em] text-[var(--ink-soft)] whitespace-nowrap bg-transparent items-center gap-[5px] px-[10px] font-medium inline-flex">
                {durationFormatted}
              </span>
            )}
            {difficulty && (
              <span className="rounded-[var(--r-pill)] border-[1.5px] border-solid border-[var(--line-strong)] h-[22px] font-[family-name:var(--font-label)] text-[length:var(--fs-label)] tracking-[0.06em] text-[var(--ink-soft)] whitespace-nowrap bg-transparent items-center gap-[5px] px-[10px] font-medium inline-flex">
                {difficulty.charAt(0).toUpperCase() + difficulty.slice(1).toLowerCase()}
              </span>
            )}
            {isMandatory ? (
              <span className="rounded-[var(--r-pill)] border-[1.5px] border-solid !border-[#7e9b6f99] h-[22px] font-[family-name:var(--font-label)] text-[length:var(--fs-label)] tracking-[0.06em] text-[var(--c-sage-text)] whitespace-nowrap bg-transparent items-center gap-[5px] px-[10px] font-medium inline-flex before:content-[''] before:bg-current before:rounded-full before:w-[6px] before:h-[6px]">
                Mandatory for your team
              </span>
            ) : (
              <span className="rounded-[var(--r-pill)] border-[1.5px] border-solid border-[var(--line-strong)] h-[22px] font-[family-name:var(--font-label)] text-[length:var(--fs-label)] tracking-[0.06em] text-[var(--ink-soft)] whitespace-nowrap bg-transparent items-center gap-[5px] px-[10px] font-medium inline-flex">
                Optional
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-[10px] flex-wrap sm:flex-nowrap sm:justify-end">

          <button
            type="button"
            onClick={() => navigate('/course-assignment')}
            className="rounded-[var(--r-pill)] bg-[var(--btn,#f6e8c4)] text-[var(--ink)] font-sans font-semibold text-[length:var(--fs-meta)] cursor-pointer border-[1.5px] border-solid border-[#c99b2e8c] justify-center items-center gap-[8px] px-[14px] py-[8px] transition-all duration-150 inline-flex shadow-[0_4px_16px_-4px_#2a11081f] hover:bg-[var(--btn-hover,#edd79a)] hover:-translate-y-[1px]"
          >
            Manage assignment
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-3 gap-[14px] mb-[28px] max-lg:grid-cols-2 max-[600px]:grid-cols-1">
        <div className="bg-[var(--paper)] border border-solid border-[var(--line)] rounded-[var(--r-lg)] transition-all duration-200 ease-[var(--tn,ease)] pt-[18px] px-[18px] pb-[16px] hover:-translate-y-[2px] hover:shadow-[0_6px_22px_-12px_#1111112e]">
          <div className="rounded-[11px] place-items-center w-[38px] h-[38px] mb-[12px] grid bg-[var(--sage-wash,#dce5d3)] text-[var(--sage-text,#4e6a40)]">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
          </div>
          <div className="font-[family-name:var(--font-label)] text-[length:var(--fs-label)] tracking-[0.08em] uppercase text-[var(--ink-mute)] mb-[8px] font-medium">Assigned to</div>
          <div className="text-[length:var(--fs-h2)] tracking-[-0.02em] text-[var(--ink)] tabular-nums font-bold leading-none">{totalAssigned}</div>
          <div className="font-[family-name:var(--font-label)] text-[length:var(--fs-label)] tracking-[0.06em] text-[var(--ink-mute)] mt-[6px] font-medium">team {totalAssigned === 1 ? 'member' : 'members'}</div>
        </div>
        <div className="bg-[var(--paper)] border border-solid border-[var(--line)] rounded-[var(--r-lg)] transition-all duration-200 ease-[var(--tn,ease)] pt-[18px] px-[18px] pb-[16px] hover:-translate-y-[2px] hover:shadow-[0_6px_22px_-12px_#1111112e]">
          <div className="rounded-[11px] place-items-center w-[38px] h-[38px] mb-[12px] grid bg-[var(--honey-wash,#f6e8c4)] text-[var(--honey-text,#8b6a1f)]">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
          <div className="font-[family-name:var(--font-label)] text-[length:var(--fs-label)] tracking-[0.08em] uppercase text-[var(--ink-mute)] mb-[8px] font-medium">Completed</div>
          <div className="text-[length:var(--fs-h2)] tracking-[-0.02em] text-[var(--ink)] tabular-nums font-bold leading-none">{completedCount}</div>
          <div className="font-[family-name:var(--font-label)] text-[length:var(--fs-label)] tracking-[0.06em] text-[var(--ink-mute)] mt-[6px] font-medium">{completionPercent}% completion</div>
        </div>
        <div className="bg-[var(--paper)] border border-solid border-[var(--line)] rounded-[var(--r-lg)] transition-all duration-200 ease-[var(--tn,ease)] pt-[18px] px-[18px] pb-[16px] hover:-translate-y-[2px] hover:shadow-[0_6px_22px_-12px_#1111112e]">
          <div className="rounded-[11px] place-items-center w-[38px] h-[38px] mb-[12px] grid bg-[var(--clay-wash,#efd3c7)] text-[var(--accent,#b8523e)]">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
          </div>
          <div className="font-[family-name:var(--font-label)] text-[length:var(--fs-label)] tracking-[0.08em] uppercase text-[var(--ink-mute)] mb-[8px] font-medium">Overdue</div>
          <div className={`text-[length:var(--fs-h2)] tracking-[-0.02em] tabular-nums font-bold leading-none ${overdueCount > 0 ? "text-[var(--accent)]" : "text-[var(--ink)]"}`}>{overdueCount}</div>
          <div className="font-[family-name:var(--font-label)] text-[length:var(--fs-label)] tracking-[0.06em] text-[var(--ink-mute)] mt-[6px] font-medium">past deadline</div>
        </div>
      </div>

      {/* Enrollees List Card */}
      <div className="bg-[var(--paper)] border border-solid border-[var(--line)] rounded-[var(--r-lg)] shadow-[var(--shadow-sm)] transition-all duration-200 overflow-hidden hover:border-[var(--line-strong)] mb-[40px]">
        <div className="border-b border-solid border-[var(--line)] justify-between items-center px-[22px] py-[16px] flex flex-wrap gap-4">
          <div className="text-[length:var(--fs-h3)] tracking-[-0.01em] text-[var(--ink)] font-bold">
            Team completion <strong className="font-sans text-[var(--ink)] not-italic font-extrabold">status</strong>
          </div>
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search member..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-[#c99b2e] w-[180px]"
              />
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            </div>
            {/* Status select */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="text-xs py-1.5 px-2.5 bg-white border border-gray-300 rounded-lg focus:outline-none text-gray-700 cursor-pointer"
            >
              <option value="ALL">All Status</option>
              <option value="COMPLETED">Completed</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="NOT_STARTED">Not Started</option>
              <option value="OVERDUE">Overdue</option>
            </select>
          </div>
        </div>
        <div className="p-0 overflow-x-auto">
          {filteredEnrollees.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center justify-center">
              <Users className="w-10 h-10 text-gray-300 mb-3" />
              <h4 className="text-base font-semibold text-gray-800 mb-1">
                {totalAssigned === 0 ? "No team members assigned yet" : "No matching members found"}
              </h4>
              <p className="text-sm text-gray-500 max-w-sm mb-5">
                {totalAssigned === 0
                  ? "Assign this course or career path to your organisation members to track their progress here."
                  : "Try clearing your search or status filter to see other members."}
              </p>
              {totalAssigned === 0 && (
                <button
                  type="button"
                  onClick={() => navigate('/course-assignment')}
                  className="px-5 py-2 text-xs font-semibold rounded-full bg-[#c99b2e] text-white hover:bg-[#b08524] transition shadow-sm"
                >
                  Assign to team members
                </button>
              )}
            </div>
          ) : (
            <table className="w-full min-w-[800px] text-[length:var(--fs-body)] border-separate border-spacing-0">
              <thead>
                <tr>
                  <th className="text-left font-[family-name:var(--font-label)] text-[var(--ink-mute)] border-b border-solid border-[var(--line)] bg-[var(--paper-2)] font-medium text-[length:var(--fs-label)] uppercase tracking-[0.08em] px-[16px] py-[11px] first:pl-[16px] last:pr-[16px]">
                    Member
                  </th>
                  <th className="text-left font-[family-name:var(--font-label)] text-[var(--ink-mute)] border-b border-solid border-[var(--line)] bg-[var(--paper-2)] font-medium text-[length:var(--fs-label)] uppercase tracking-[0.08em] px-[16px] py-[11px] first:pl-[16px] last:pr-[16px]">
                    Status
                  </th>
                  <th className="text-left font-[family-name:var(--font-label)] text-[var(--ink-mute)] border-b border-solid border-[var(--line)] bg-[var(--paper-2)] font-medium text-[length:var(--fs-label)] uppercase tracking-[0.08em] px-[16px] py-[11px] first:pl-[16px] last:pr-[16px]">
                    Progress
                  </th>
                  <th className="text-left font-[family-name:var(--font-label)] text-[var(--ink-mute)] border-b border-solid border-[var(--line)] bg-[var(--paper-2)] font-medium text-[length:var(--fs-label)] uppercase tracking-[0.08em] px-[16px] py-[11px] first:pl-[16px] last:pr-[16px]">
                    Due date
                  </th>
                  <th className="text-left font-[family-name:var(--font-label)] text-[var(--ink-mute)] border-b border-solid border-[var(--line)] bg-[var(--paper-2)] font-medium text-[length:var(--fs-label)] uppercase tracking-[0.08em] px-[16px] py-[11px] first:pl-[16px] last:pr-[16px]">
                    Completion date
                  </th>
                </tr>
              </thead>
              <tbody>
                {displayedEnrollees.map((enrollee) => (
                  <tr className="group/row hover:bg-[var(--paper-2)] transition-colors" key={enrollee.id}>
                    <td className="border-b border-solid border-[var(--line)] text-[var(--ink-soft)] align-middle px-[16px] py-[14px] group-last/row:border-b-0 first:text-[var(--ink)] first:pl-[16px] first:font-normal last:pr-[16px]">
                      <div>
                        <div className="font-semibold text-gray-900 text-[16px]">{enrollee.name}</div>
                        {enrollee.email && enrollee.name !== enrollee.email && (
                          <div className="text-[14px] text-gray-500">{enrollee.email}</div>
                        )}
                      </div>
                    </td>
                    <td className="border-b border-solid border-[var(--line)] text-[var(--ink-soft)] align-middle px-[16px] py-[14px] group-last/row:border-b-0 first:text-[var(--ink)] first:pl-[16px] first:font-normal last:pr-[16px]">
                      <span className={`rounded-[var(--r-pill)] border-[1.5px] border-solid h-[22px] font-[family-name:var(--font-label)] text-[12px] !text-[#aebfa5] !border-[#aebfa5] tracking-[0.06em] whitespace-nowrap items-center gap-[5px] px-[10px] font-medium inline-flex before:content-[''] before:bg-current before:rounded-full before:w-[6px] before:h-[6px] ${enrollee.statusBadgeClass}`}>
                        {enrollee.status}
                      </span>
                    </td>
                    <td className="border-b border-solid border-[var(--line)] text-[var(--ink-soft)] align-middle px-[16px] py-[14px] group-last/row:border-b-0 first:text-[var(--ink)] first:pl-[16px] first:font-normal last:pr-[16px]">
                      <div className="items-center gap-[10px] min-w-[140px] flex">
                        <div className="bg-[var(--surface-3,#eaeaea)] rounded-[100px] h-[6px] overflow-hidden flex-1">
                          <div
                            className={`rounded-[var(--r-pill)] h-full transition-[width] duration-300 ${
                              enrollee.statusCode === 'COMPLETED'
                                ? 'bg-[#2e7d32]'
                                : enrollee.statusCode === 'OVERDUE'
                                ? 'bg-[#c62828]'
                                : 'bg-[#c99b2e]'
                            }`}
                            style={{ width: `${enrollee.progress}%` }}
                          />
                        </div>
                        <span className="font-[family-name:var(--font-label)] text-[14px] text-[var(--ink-soft)] text-right tabular-nums min-w-[36px] font-semibold">
                          {enrollee.progress}%
                        </span>
                      </div>
                    </td>
                    <td className="border-b border-solid border-[var(--line)] text-[var(--ink-soft)] align-middle px-[16px] py-[14px] group-last/row:border-b-0 first:text-[var(--ink)] first:pl-[16px] first:font-normal last:pr-[16px] text-[16px]">
                      {enrollee.dueDate !== '-' ? `Due ${enrollee.dueDate}` : '-'}
                    </td>
                    <td className="border-b border-solid border-[var(--line)] text-[var(--ink-soft)] align-middle px-[16px] py-[14px] group-last/row:border-b-0 first:text-[var(--ink)] first:pl-[16px] first:font-normal last:pr-[16px] text-[16px]">
                      {enrollee.completionDate}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {filteredEnrollees.length > 8 && (
            <div className="border-t border-solid border-[var(--line)] items-center justify-between px-[16px] py-[14px] flex">
              <button
                type="button"
                className="rounded-[var(--r-pill)] text-[var(--ink)] font-sans font-semibold text-[length:var(--fs-meta)] cursor-pointer border-[1.5px] border-solid justify-center items-center gap-[8px] px-[14px] py-[8px] transition-all duration-150 inline-flex !bg-[var(--card)] !border-[var(--line-strong)] !shadow-none hover:!bg-[var(--card-2)] hover:!border-[var(--ink-mute,var(--muted))] hover:-translate-y-[1px]"
                onClick={() => setShowAll(!showAll)}
              >
                {showAll ? "Show fewer members" : `View all ${filteredEnrollees.length} members`}
              </button>
              <span className="font-[family-name:var(--font-label)] text-[length:var(--fs-meta)] text-[var(--ink-mute)]">
                {showAll ? `Showing all ${filteredEnrollees.length} members` : `Showing ${displayedEnrollees.length} of ${filteredEnrollees.length}`}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseDetail;
