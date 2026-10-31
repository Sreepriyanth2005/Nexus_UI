import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import * as XLSX from "xlsx";
import { getTenantByIdApi, getTenantDashboardApi, getTenantDashboardStatsApi } from "../../core/api/tenant.api";
import { getAssignmentReportApi } from "../../core/api/corporate-learning.api";
import { Breadcrumbs } from "../../components/ui/Breadcrumbs";
import { Button } from "../../components/ui/Button";
import { Icon } from "../../components/ui/Icon";

// Import custom icons
import calendarIcon from "../../assets/icons/calendar.svg";
import downloadIcon from "../../assets/icons/download.svg";
import usersIcon from "../../assets/icons/users.svg";
import checkIcon from "../../assets/icons/check.svg";
import bookIcon from "../../assets/icons/book.svg";
import barChartIcon from "../../assets/icons/bar-chart-2.svg";
import awardIcon from "../../assets/icons/award.svg";
import lockIcon from "../../assets/icons/lock.svg";
import clockIcon from "../../assets/icons/clock.svg";
import alertTriangleIcon from "../../assets/icons/alert-triangle.svg";
import starIcon from "../../assets/icons/star.svg";
import refreshCwIcon from "../../assets/icons/refresh-cw.svg";
import arrowUpIcon from "../../assets/icons/arrow-up.svg";
import chevronDownIcon from "../../assets/icons/chevron-down.svg";
import searchIcon from "../../assets/icons/search.svg";
import buildingIcon from "../../assets/icons/building.svg";

const AssetIcon = ({ src, size = 20, className }: { src: string, size?: number | string, className?: string }) => (
  <div
    className={className}
    style={{
      width: size,
      height: size,
      backgroundColor: 'currentColor',
      WebkitMaskImage: `url("${src}")`,
      WebkitMaskSize: 'contain',
      WebkitMaskPosition: 'center',
      WebkitMaskRepeat: 'no-repeat',
      maskImage: `url("${src}")`,
      maskSize: 'contain',
      maskPosition: 'center',
      maskRepeat: 'no-repeat'
    }}
  />
);

const downloadableReports = [
  { title: "Enrollments", desc: "Overview of all course enrollments", icon: usersIcon },
  { title: "Course progress", desc: "Detailed view of learner course progression", icon: barChartIcon },
  { title: "Completion status", desc: "Track completed courses and pending requirements", icon: checkIcon },
  { title: "Certificates earned", desc: "Records of all credentials and certificates issued", icon: awardIcon },
  { title: "Assessment & Quiz Report", desc: "Attempts, scores and pass/fail by assessment", icon: searchIcon },
  { title: "Assigned learning activity", desc: "Overview of assigned tasks and deadlines", icon: calendarIcon },
];

const Report = () => {
  const navigate = useNavigate();
  const [tenantName, setTenantName] = useState("");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [rawDeliveries, setRawDeliveries] = useState<any[]>([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const storedUser = localStorage.getItem('keycloak_session_user');
      if (!storedUser) return;

      const parsed = JSON.parse(storedUser);
      const user = parsed?.user || parsed;
      const tenantId = user?.tenantId || user?.tenant?.id || user?.organizationId;

      if (!tenantId) return;

      const [tenantResp, dashboardResp, dashboardStats, assignmentReport] = await Promise.all([
        getTenantByIdApi(tenantId).catch(() => null),
        getTenantDashboardApi(tenantId).catch(() => null),
        getTenantDashboardStatsApi({ tenantId }).catch(() => null),
        getAssignmentReportApi(tenantId, { limit: 100 }).catch(() => null)
      ]);

      if (tenantResp?.name) {
        setTenantName(tenantResp.name);
      } else if (user?.tenant?.name) {
        setTenantName(user?.tenant?.name);
      }

      if (dashboardResp) {
        setDashboardData(dashboardResp);
      }

      if (dashboardStats) {
        setStats(dashboardStats);
      }

      const deliveries = Array.isArray(assignmentReport?.items)
        ? assignmentReport.items
        : Array.isArray(assignmentReport)
          ? assignmentReport
          : [];
      setRawDeliveries(deliveries);
    } catch (error) {
      console.error("Failed to load reports dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const filteredDeliveries = useMemo(() => {
    return rawDeliveries.filter((d: any) => {
      if (!startDate && !endDate) return true;
      const dateToTest = d.assignedAt || d.createdAt;
      if (!dateToTest) return true;
      const itemDate = new Date(dateToTest);
      if (startDate && itemDate < new Date(startDate)) return false;
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (itemDate > end) return false;
      }
      return true;
    });
  }, [rawDeliveries, startDate, endDate]);

  const { realCoursePassRates, realChartData, donutData, overallMetrics } = useMemo(() => {
    const contentMap = new Map<string, {
      id: string;
      title: string;
      contentType: string;
      enrolled: number;
      completed: number;
      inProgress: number;
      notStarted: number;
      overdue: number;
      dueDate: Date | null;
      duration: number;
    }>();

    filteredDeliveries.forEach((d: any) => {
      const cid = d.contentId || d.courseId || d.careerPathId;
      const title = d.contentTitle || "Course";
      const type = d.contentType || (d.careerPathId ? "CAREER_PATH" : "COURSE");
      if (!cid) return;

      if (!contentMap.has(cid)) {
        contentMap.set(cid, {
          id: cid,
          title,
          contentType: type,
          enrolled: 0,
          completed: 0,
          inProgress: 0,
          notStarted: 0,
          overdue: 0,
          dueDate: d.dueDate ? new Date(d.dueDate) : null,
          duration: d.duration || 0,
        });
      }

      const rec = contentMap.get(cid)!;
      rec.enrolled += 1;
      const isCompleted = d.deliveryStatus === 'COMPLETED' || d.status === 'COMPLETED' || (d.progressPercent != null && d.progressPercent >= 100);
      const isOverdue = !isCompleted && (d.complianceStatus === 'EXPIRED' || (d.dueDate && new Date(d.dueDate) < new Date()));
      const isInProgress = !isCompleted && !isOverdue && (d.progressPercent != null && d.progressPercent > 0);

      if (isCompleted) {
        rec.completed += 1;
      } else if (isInProgress) {
        rec.inProgress += 1;
      } else {
        rec.notStarted += 1;
      }

      if (isOverdue) {
        rec.overdue += 1;
      }

      if (d.dueDate) {
        const due = new Date(d.dueDate);
        if (!rec.dueDate || due < rec.dueDate) {
          rec.dueDate = due;
        }
      }
    });

    // Also merge stats courses if present and not in contentMap, ONLY if no date filter is active
    const hasDateFilter = !!(startDate || endDate);
    const statsCourseList = !hasDateFilter ? (stats?.courseEnrollmentVsCompletion || []) : [];
    statsCourseList.forEach((c: any) => {
      const cid = c.courseId || c.id;
      if (!cid) return;
      if (!contentMap.has(cid)) {
        contentMap.set(cid, {
          id: cid,
          title: c.title || "Course",
          contentType: c.contentType || (c.careerPathId ? "CAREER_PATH" : "COURSE"),
          enrolled: c.enrolled || 0,
          completed: c.completed || 0,
          inProgress: c.inProgress || 0,
          notStarted: Math.max(0, (c.enrolled || 0) - (c.completed || 0) - (c.inProgress || 0)),
          overdue: c.overdue || 0,
          dueDate: c.deadline ? new Date(c.deadline) : null,
          duration: c.duration || 0,
        });
      }
    });

    const courses = Array.from(contentMap.values()).map(c => {
      const passRate = c.enrolled > 0 ? Math.round((c.completed / c.enrolled) * 100) : 0;
      let formattedDuration = "-";
      if (c.duration > 0) {
        if (c.duration >= 60) {
          formattedDuration = `${Math.round((c.duration / 60) * 10) / 10} hrs`;
        } else {
          formattedDuration = `${c.duration} mins`;
        }
      }
      return {
        id: c.id,
        contentType: c.contentType,
        title: c.title,
        passRate,
        enrolments: c.enrolled,
        started: c.completed + c.inProgress,
        completed: c.completed,
        inProgress: c.inProgress,
        notStarted: c.notStarted,
        overdue: c.overdue,
        deadline: c.dueDate ? c.dueDate.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }) : "-",
        avgTime: formattedDuration
      };
    });

    let totalEnrolled = 0;
    let totalCompleted = 0;
    let totalInProgress = 0;
    let totalNotStarted = 0;

    courses.forEach(c => {
      totalEnrolled += c.enrolments;
      totalCompleted += c.completed;
      totalInProgress += c.inProgress;
      totalNotStarted += c.notStarted;
    });

    // Fallbacks from stats overview if rawDeliveries was empty and no date filter is active
    if (totalEnrolled === 0 && stats?.overview?.totalEnrollments && !hasDateFilter) {
      totalEnrolled = stats.overview.totalEnrollments;
      totalCompleted = stats.completedEnrollments || 0;
      totalInProgress = Math.max(0, totalEnrolled - totalCompleted);
    }

    const overallPassRate = totalEnrolled > 0 ? Math.round((totalCompleted / totalEnrolled) * 100) : 0;

    // Chart Data for Stacked Bar Chart
    const chart = courses.map(c => {
      const total = c.enrolments || 1;
      return {
        title: c.title?.length > 15 ? c.title.substring(0, 15) + "..." : c.title || "Unknown",
        completed: (c.completed / total) * 100,
        inProgress: (c.inProgress / total) * 100,
        notStarted: (c.notStarted / total) * 100
      };
    });

    // Status breakdown donut
    const donutTotal = (totalCompleted + totalInProgress + totalNotStarted) || totalEnrolled || 1;
    const donutCompletedPct = totalEnrolled > 0 ? Math.round((totalCompleted / donutTotal) * 100) : 0;
    const donutInProgressPct = totalEnrolled > 0 ? Math.round((totalInProgress / donutTotal) * 100) : 0;

    return {
      realCoursePassRates: courses,
      realChartData: chart,
      donutData: {
        completed: totalCompleted,
        inProgress: totalInProgress,
        notStarted: totalNotStarted,
        completedPct: donutCompletedPct,
        inProgressPct: donutInProgressPct,
        percent: donutCompletedPct,
        total: totalEnrolled
      },
      overallMetrics: {
        totalEnrolled,
        totalCompleted,
        totalInProgress,
        totalNotStarted,
        overallPassRate
      }
    };
  }, [filteredDeliveries, stats]);

  const overview = stats?.overview || {};
  const metrics = {
    totalUsers: dashboardData?.users?.totalUsers || overview.totalUsers || 0,
    totalUsersTrend: "",
    activeUsers: dashboardData?.users?.activeUsers || dashboardData?.users?.totalUsers || overview.totalUsers || 0,
    activeUsersTrend: "",
    enrolments: overallMetrics.totalEnrolled,
    enrolmentsTrend: "",
    completionRate: overallMetrics.overallPassRate,
    completionRateTrend: "",
    coursesCompleted: overallMetrics.totalCompleted,
    coursesCompletedTrend: ""
  };

  const overallPassRate = overallMetrics.overallPassRate;
  const hasEnrolledLearners = overallMetrics.totalEnrolled > 0;

  let gaugeColor = "#769e6b";
  let passBadgeText = "PASS";
  let passBadgeIcon = checkIcon;
  let passBadgeClass = "bg-[#e6f4ea] text-[#769e6b] border-[#d2e8d9]";

  if (!hasEnrolledLearners) {
    gaugeColor = "#a0a0a0";
    passBadgeText = "NO DATA";
    passBadgeIcon = clockIcon;
    passBadgeClass = "bg-[#f5f5f3] text-[#737373] border-[#e5e5e3]";
  } else if (overallPassRate >= 75) {
    gaugeColor = "#769e6b";
    passBadgeText = "PASS";
    passBadgeIcon = checkIcon;
    passBadgeClass = "bg-[#e6f4ea] text-[#769e6b] border-[#d2e8d9]";
  } else if (overallPassRate > 0) {
    gaugeColor = "#d8a631";
    passBadgeText = "NEEDS ATTENTION";
    passBadgeIcon = alertTriangleIcon;
    passBadgeClass = "bg-[#fef3e2] text-[#d8a631] border-[#f2dfc4]";
  } else {
    gaugeColor = "#d93025";
    passBadgeText = "0% PASS";
    passBadgeIcon = alertTriangleIcon;
    passBadgeClass = "bg-[#fce8e6] text-[#d93025] border-[#fad2cf]";
  }

  const generateReportData = (reportTitle: string) => {
    if (filteredDeliveries.length === 0) {
      return [{ "Report": reportTitle, "Status": "No learning activity records found for this organization" }];
    }

    switch (reportTitle) {
      case "Enrollments":
        return filteredDeliveries.map((d: any, idx: number) => ({
          "#": idx + 1,
          "Learner Name": d.userName || d.userEmail || "Learner",
          "Email": d.userEmail || "-",
          "Content Title": d.contentTitle || "-",
          "Content Type": d.contentType || "COURSE",
          "Requirement": d.requirement || "OPTIONAL",
          "Status": d.deliveryStatus || d.status || "NOT_STARTED",
          "Enrolled Date": d.assignedAt ? new Date(d.assignedAt).toLocaleDateString() : "-",
          "Due Date": d.dueDate ? new Date(d.dueDate).toLocaleDateString() : "-"
        }));

      case "Course progress":
        return filteredDeliveries.map((d: any, idx: number) => ({
          "#": idx + 1,
          "Learner Name": d.userName || d.userEmail || "Learner",
          "Email": d.userEmail || "-",
          "Course": d.contentTitle || "-",
          "Type": d.contentType || "COURSE",
          "Progress": `${d.progressPercent || 0}%`,
          "Status": (d.progressPercent != null && d.progressPercent >= 100) || d.deliveryStatus === 'COMPLETED'
            ? "Completed"
            : (d.progressPercent != null && d.progressPercent > 0)
              ? "In Progress"
              : "Not Started",
          "Last Activity / Completed": d.completedAt ? new Date(d.completedAt).toLocaleDateString() : "-"
        }));

      case "Completion status":
        return filteredDeliveries.map((d: any, idx: number) => ({
          "#": idx + 1,
          "Learner Name": d.userName || d.userEmail || "Learner",
          "Email": d.userEmail || "-",
          "Course": d.contentTitle || "-",
          "Status": (d.progressPercent != null && d.progressPercent >= 100) || d.deliveryStatus === 'COMPLETED'
            ? "Completed"
            : (d.progressPercent != null && d.progressPercent > 0)
              ? "In Progress"
              : "Pending",
          "Progress": `${d.progressPercent || 0}%`,
          "Completion Date": d.completedAt ? new Date(d.completedAt).toLocaleDateString() : "-",
          "Requirement": d.requirement || "OPTIONAL"
        }));

      case "Certificates earned": {
        const completed = filteredDeliveries.filter((d: any) =>
          (d.progressPercent != null && d.progressPercent >= 100) || d.deliveryStatus === 'COMPLETED' || d.completedAt
        );
        if (completed.length === 0) {
          return [{ "Status": "No certificates earned yet for this tenant" }];
        }
        return completed.map((d: any, idx: number) => ({
          "#": idx + 1,
          "Learner Name": d.userName || d.userEmail || "Learner",
          "Email": d.userEmail || "-",
          "Certificate": `${d.contentTitle} Completion Certificate`,
          "Issue Date": d.completedAt ? new Date(d.completedAt).toLocaleDateString() : new Date().toLocaleDateString(),
          "Status": "Issued"
        }));
      }

      case "Assessment & Quiz Report":
        return filteredDeliveries.map((d: any, idx: number) => ({
          "#": idx + 1,
          "Learner Name": d.userName || d.userEmail || "Learner",
          "Email": d.userEmail || "-",
          "Assessment / Course": d.contentTitle || "-",
          "Score / Progress": `${d.progressPercent || 0}%`,
          "Result": (d.progressPercent != null && d.progressPercent >= 75)
            ? "Pass"
            : (d.progressPercent != null && d.progressPercent > 0)
              ? "In Progress"
              : "Pending",
          "Date": d.completedAt ? new Date(d.completedAt).toLocaleDateString() : (d.assignedAt ? new Date(d.assignedAt).toLocaleDateString() : "-")
        }));

      case "Assigned learning activity":
        return filteredDeliveries.map((d: any, idx: number) => ({
          "#": idx + 1,
          "Learner Name": d.userName || d.userEmail || "Learner",
          "Email": d.userEmail || "-",
          "Activity": d.contentTitle || "-",
          "Type": d.contentType || "COURSE",
          "Requirement": d.requirement || "OPTIONAL",
          "Due Date": d.dueDate ? new Date(d.dueDate).toLocaleDateString() : "No deadline",
          "Progress": `${d.progressPercent || 0}%`,
          "Status": (d.progressPercent != null && d.progressPercent >= 100) || d.deliveryStatus === 'COMPLETED'
            ? "Completed"
            : (d.progressPercent != null && d.progressPercent > 0)
              ? "In Progress"
              : "Pending"
        }));

      default:
        return [{ "Report": reportTitle, "Status": "No data available" }];
    }
  };

  const handleExport = (reportTitle: string, format: 'csv' | 'xlsx') => {
    const data = generateReportData(reportTitle);
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Report");

    const fileName = `${reportTitle.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}_report.${format}`;
    XLSX.writeFile(workbook, fileName);
  };

  const handleExportTable = (format: 'csv' | 'xlsx') => {
    const exportRows = realCoursePassRates.length > 0
      ? realCoursePassRates.map((c, i) => ({
          "#": i + 1,
          "Course": c.title,
          "Type": c.contentType,
          "Enrolments": c.enrolments,
          "Started": c.started,
          "Completed": c.completed,
          "Overdue": c.overdue,
          "Completion Deadline": c.deadline,
          "Avg Time": c.avgTime,
          "Pass Rate": `${c.passRate}%`
        }))
      : [{ "Status": "No course data available" }];

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Pass Rates");
    XLSX.writeFile(workbook, `course_pass_rates_report.${format}`);
  };

  if (loading) {
    return (
      <div className="w-full font-sans max-w-[1400px] mx-auto animate-pulse">
        {/* Header Skeleton */}
        <div className="flex flex-col md:flex-row justify-between md:items-end gap-[16px] mb-[24px]">
          <div>
            <div className="h-3 w-[150px] bg-[#e5e7eb] rounded mb-[6px]"></div>
            <div className="h-8 w-[200px] bg-[#e5e7eb] rounded mb-[6px]"></div>
            <div className="h-4 w-[350px] bg-[#e5e7eb] rounded"></div>
          </div>
          <div className="flex flex-col items-end gap-[12px]">
            <div className="h-[36px] w-[320px] bg-[#e5e7eb] rounded-[14px]"></div>
            <div className="flex items-center gap-[12px]">
              <div className="h-[36px] w-[110px] bg-[#e5e7eb] rounded-[100px]"></div>
              <div className="h-[36px] w-[110px] bg-[#e5e7eb] rounded-[100px]"></div>
            </div>
          </div>
        </div>

        {/* KPI Row Skeleton */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-[16px] mb-[24px]">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="bg-white border border-[#eaeaea] rounded-[14px] p-[20px] flex flex-col justify-between min-h-[160px]">
              <div className="w-[40px] h-[40px] rounded-[10px] bg-[#e5e7eb] mb-[16px]"></div>
              <div>
                <div className="h-2 w-1/2 bg-[#e5e7eb] rounded mb-[8px]"></div>
                <div className="h-6 w-1/3 bg-[#e5e7eb] rounded mb-[8px]"></div>
                <div className="h-3 w-1/4 bg-[#e5e7eb] rounded"></div>
              </div>
            </div>
          ))}
        </div>

        {/* Charts Row Skeleton */}
        <div className="grid lg:grid-cols-10 gap-[16px] mb-[24px]">
          {/* Stacked Bar Chart Skeleton */}
          <div className="lg:col-span-7 bg-white border border-[#eaeaea] rounded-[14px] min-h-[300px] flex flex-col">
            <div className="px-[24px] py-[16px] border-b border-[#eaeaea]">
              <div className="h-5 w-[200px] bg-[#e5e7eb] rounded"></div>
            </div>
            <div className="flex-1 p-[24px] flex flex-col justify-end">
              <div className="h-[180px] w-full bg-[#e5e7eb] rounded mb-[16px]"></div>
              <div className="h-3 w-1/3 bg-[#e5e7eb] rounded"></div>
            </div>
          </div>

          {/* Donut Chart Skeleton */}
          <div className="lg:col-span-3 bg-white border border-[#eaeaea] rounded-[14px] min-h-[300px] flex flex-col">
            <div className="px-[24px] py-[16px] border-b border-[#eaeaea]">
              <div className="h-5 w-[150px] bg-[#e5e7eb] rounded"></div>
            </div>
            <div className="flex-1 p-[24px] flex flex-col md:flex-row items-center justify-center gap-[32px]">
              <div className="w-[140px] h-[140px] rounded-full bg-[#e5e7eb]"></div>
              <div className="flex flex-col gap-[16px] w-full md:w-auto">
                <div className="h-4 w-[100px] bg-[#e5e7eb] rounded"></div>
                <div className="h-4 w-[100px] bg-[#e5e7eb] rounded"></div>
                <div className="h-4 w-[100px] bg-[#e5e7eb] rounded"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Pass Rate Row Skeleton */}
        <div className="bg-white border border-[#eaeaea] rounded-[14px] mb-[24px] flex flex-col">
          <div className="flex items-center justify-between px-[28px] py-[20px] border-b border-[#eaeaea]">
            <div className="h-5 w-[200px] bg-[#e5e7eb] rounded"></div>
            <div className="h-[24px] w-[80px] bg-[#e5e7eb] rounded-[100px]"></div>
          </div>
          <div className="flex-1 p-[28px] flex flex-col md:flex-row items-center gap-[60px]">
            <div className="w-[160px] h-[160px] rounded-full bg-[#e5e7eb]"></div>
            <div className="flex-1 w-full flex flex-col gap-[28px]">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex flex-col gap-[10px]">
                  <div className="flex justify-between items-center">
                    <div className="h-4 w-[150px] bg-[#e5e7eb] rounded"></div>
                    <div className="h-4 w-[30px] bg-[#e5e7eb] rounded"></div>
                  </div>
                  <div className="w-full h-[8px] bg-[#e5e7eb] rounded-full"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full font-sans max-w-[1400px] mx-auto">
      <div className="mx-auto">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between md:items-end gap-[16px] mb-[24px]">
          <div>
            <div className="text-[12px] font-bold tracking-[0.06em] uppercase text-[#5c5c5c] mb-[6px]">
              CORPORATE · {tenantName}
            </div>
            <h1 className="text-[32px] font-bold text-ink leading-tight">Reports</h1>
            <p className="text-[16px] text-ink-mute mt-[6px]">
              Active vs inactive users, course progress, learning credentials earned.
            </p>
          </div>
          <div className="flex flex-col items-end gap-[12px]">
            <div className="flex items-center justify-between gap-[8px] bg-white border border-[#eaeaea] rounded-[14px] h-[36px] px-[16px] text-[13px] text-ink-mute focus-within:border-[#141414] transition-colors w-[320px]">
              <AssetIcon src={calendarIcon} size={14} className="text-[#141414]" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent border-none outline-none text-[#141414] text-[14px] font-medium cursor-pointer w-[105px]"
                title="Filter by start date"
              />
              <span className="text-[#a0a0a0] mx-[2px]">-</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent border-none outline-none text-[#141414] text-[14px] font-medium cursor-pointer w-[105px]"
                title="Filter by end date"
              />
              {(startDate || endDate) && (
                <button
                  type="button"
                  onClick={() => { setStartDate(""); setEndDate(""); }}
                  className="text-[11px] text-ink-mute hover:text-ink font-semibold ml-1 cursor-pointer"
                  title="Clear date filter"
                >
                  ✕
                </button>
              )}
            </div>
            <div className="flex items-center gap-[12px]">
              <Button variant="ghost" onClick={() => handleExportTable('csv')} className="gap-2 text-ink font-bold rounded-[100px] bg-[#fcf7ae] border-[#e6d595] hover:bg-[#f0ea8a] h-[36px] px-[16px] shadow-xs text-[14px]">
                <AssetIcon src={downloadIcon} size={14} /> Export CSV
              </Button>
              <Button variant="ghost" onClick={() => handleExportTable('xlsx')} className="gap-2 text-ink font-bold rounded-[100px] bg-[#fcf7ae] border-[#e6d595] hover:bg-[#f0ea8a] h-[36px] px-[16px] shadow-xs text-[14px]">
                <AssetIcon src={downloadIcon} size={14} /> Export Excel
              </Button>
            </div>
          </div>
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-[16px] mb-[24px]">
          <div className="bg-white border border-[#eaeaea] rounded-[14px] p-[20px] flex flex-col justify-between shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 min-h-[160px] cursor-pointer">
            <div className="w-[40px] h-[40px] rounded-[10px] bg-[#fcf5e3] text-[#c99b2e] flex items-center justify-center mb-[16px]">
              <AssetIcon src={usersIcon} size={20} />
            </div>
            <div>
              <p className="text-[12px] font-bold text-ink-mute uppercase tracking-[0.5px] mb-[4px]">TOTAL USERS</p>
              <div className="flex flex-col gap-[8px]">
                <h2 className="text-[24px] font-bold text-ink leading-none">{metrics.totalUsers}</h2>
                <div className="flex items-center gap-[4px] text-[12px] font-bold text-[#769e6b]">
                  <AssetIcon src={arrowUpIcon} size={12} /> <span>{metrics.totalUsersTrend}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-[#eaeaea] rounded-[14px] p-[20px] flex flex-col justify-between shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 min-h-[160px] cursor-pointer">
            <div className="w-[40px] h-[40px] rounded-[10px] bg-[#e6f4ea] text-[#769e6b] flex items-center justify-center mb-[16px]">
              <AssetIcon src={checkIcon} size={20} />
            </div>
            <div>
              <p className="text-[12px] font-bold text-ink-mute uppercase tracking-[0.5px] mb-[4px]">ACTIVE USERS</p>
              <div className="flex flex-col gap-[8px]">
                <h2 className="text-[24px] font-bold text-ink leading-none">{metrics.activeUsers}</h2>
                <div className="flex items-center gap-[4px] text-[12px] font-bold text-[#769e6b]">
                  <AssetIcon src={arrowUpIcon} size={12} /> <span>{metrics.activeUsersTrend}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-[#eaeaea] rounded-[14px] p-[20px] flex flex-col justify-between shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 min-h-[160px] cursor-pointer">
            <div className="w-[40px] h-[40px] rounded-[10px] bg-[#fcf5e3] text-[#c99b2e] flex items-center justify-center mb-[16px]">
              <AssetIcon src={bookIcon} size={20} />
            </div>
            <div>
              <p className="text-[12px] font-bold text-ink-mute uppercase tracking-[0.5px] mb-[4px]">ENROLMENTS</p>
              <div className="flex flex-col gap-[8px]">
                <h2 className="text-[24px] font-bold text-ink leading-none">{metrics.enrolments}</h2>
                <div className="flex items-center gap-[4px] text-[12px] font-bold text-[#769e6b]">
                  <AssetIcon src={arrowUpIcon} size={12} /> <span>{metrics.enrolmentsTrend}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-[#eaeaea] rounded-[14px] p-[20px] flex flex-col justify-between shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 min-h-[160px] cursor-pointer">
            <div className="w-[40px] h-[40px] rounded-[10px] bg-[#fce8e6] text-[#d93025] flex items-center justify-center mb-[16px]">
              <AssetIcon src={barChartIcon} size={20} />
            </div>
            <div>
              <p className="text-[12px] font-bold text-ink-mute uppercase tracking-[0.5px] mb-[4px]">COMPLETION RATE</p>
              <div className="flex flex-col gap-[8px]">
                <h2 className="text-[24px] font-bold text-ink leading-none">{metrics.completionRate}%</h2>
                <div className="flex items-center gap-[4px] text-[12px] font-bold text-[#d93025]">
                  <AssetIcon src={chevronDownIcon} size={12} /> <span>{metrics.completionRateTrend}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-[#eaeaea] rounded-[14px] p-[20px] flex flex-col justify-between shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 min-h-[160px] cursor-pointer">
            <div className="w-[40px] h-[40px] rounded-[10px] bg-[#e6f4ea] text-[#769e6b] flex items-center justify-center mb-[16px]">
              <AssetIcon src={awardIcon} size={20} />
            </div>
            <div>
              <p className="text-[12px] font-bold text-ink-mute uppercase tracking-[0.5px] mb-[4px]">COURSES COMPLETED</p>
              <div className="flex flex-col gap-[8px]">
                <h2 className="text-[24px] font-bold text-ink leading-none">{metrics.coursesCompleted}</h2>
                <div className="flex items-center gap-[4px] text-[12px] font-bold text-[#769e6b]">
                  <AssetIcon src={arrowUpIcon} size={12} /> <span>{metrics.coursesCompletedTrend}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid lg:grid-cols-10 gap-[16px] mb-[24px]">
          {/* Stacked Bar Chart */}
          <div className="lg:col-span-7 bg-white border border-[#eaeaea] rounded-[14px] shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 min-h-[300px] flex flex-col cursor-pointer overflow-hidden">
            <div className="px-[24px] py-[16px] border-b border-[#eaeaea]">
              <h3 className="font-bold text-ink text-[16px]">Course enrolment vs completion</h3>
            </div>
            <div className="flex-1 p-[24px] flex flex-col">
              <div className="flex-1 flex items-end justify-around pb-[16px]">
                {realChartData.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-ink-mute text-[14px] min-h-[180px]">
                    <span>No course enrollment records found yet</span>
                  </div>
                ) : (
                  realChartData.map((col: { title: string; completed: number; inProgress: number; notStarted: number; }, i: number) => (
                    <div key={i} className="flex flex-col items-center w-[120px]">
                      <div className="w-[80px] flex flex-col justify-end gap-[6px] mb-[16px] h-[180px]">
                        {col.completed > 0 && <div className="w-full bg-[#769e6b] rounded-[6px]" style={{ height: `${col.completed}%` }}></div>}
                        {col.inProgress > 0 && <div className="w-full bg-[#d8a631] rounded-[6px]" style={{ height: `${col.inProgress}%` }}></div>}
                        {col.notStarted > 0 && <div className="w-full bg-[#e5e3db] rounded-[6px]" style={{ height: `${col.notStarted}%` }}></div>}
                      </div>
                      <span className="text-[12px] font-medium text-ink-mute text-center leading-[1.2] w-full">{col.title}</span>
                    </div>
                  ))
                )}
              </div>
              <div className="flex items-center gap-[24px] mt-auto text-[12px] text-[#5c5c5c] font-medium pt-[16px]">
                <div className="flex items-center gap-[8px]"><div className="w-[12px] h-[12px] bg-[#769e6b] rounded-[3px]" /> Completed</div>
                <div className="flex items-center gap-[8px]"><div className="w-[12px] h-[12px] bg-[#d8a631] rounded-[3px]" /> In-progress</div>
                <div className="flex items-center gap-[8px]"><div className="w-[12px] h-[12px] bg-[#e5e3db] rounded-[3px]" /> Enrolments</div>
              </div>
            </div>
          </div>

          {/* Donut Chart */}
          <div className="lg:col-span-3 bg-white border border-[#eaeaea] rounded-[14px] shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 min-h-[300px] flex flex-col cursor-pointer overflow-hidden">
            <div className="px-[24px] py-[16px] border-b border-[#eaeaea]">
              <h3 className="font-semibold text-ink text-[16px]">Status breakdown</h3>
            </div>
            <div className="flex-1 p-[16px] xl:p-[24px] flex flex-row items-center justify-center gap-[16px] xl:gap-[24px]">
              {/* CSS Donut Chart */}
              <div
                className="w-[120px] h-[120px] xl:w-[140px] xl:h-[140px] rounded-full relative flex items-center justify-center shrink-0"
                style={{
                  background: donutData.total > 0
                    ? `conic-gradient(#769e6b 0% ${donutData.completedPct}%, #d8a631 ${donutData.completedPct}% ${donutData.completedPct + donutData.inProgressPct}%, #e5e3db ${donutData.completedPct + donutData.inProgressPct}% 100%)`
                    : `#e5e3db`
                }}
              >
                <div className="w-[84px] h-[84px] xl:w-[100px] xl:h-[100px] bg-white rounded-full flex flex-col items-center justify-center">
                  <span className="text-[20px] xl:text-[24px] font-bold text-ink leading-none mb-[2px]">{donutData.percent}%</span>
                  <span className="text-[10px] xl:text-[12px] font-bold uppercase tracking-[1px] text-ink-mute">DONE</span>
                </div>
              </div>

              {/* Legend */}
              <div className="flex flex-col gap-[12px] xl:gap-[16px] text-[12px] text-ink-mute font-semibold flex-1 max-w-[160px]">
                <div className="flex items-center justify-between gap-[8px]">
                  <div className="flex items-center gap-[8px]"><div className="w-[12px] h-[12px] bg-[#769e6b] rounded-[3px] shrink-0" /> <span className="truncate">Completed</span></div>
                  <span className="font-semibold text-[14px] xl:text-[16px] text-ink">{donutData.completed}</span>
                </div>
                <div className="flex items-center justify-between gap-[8px]">
                  <div className="flex items-center gap-[8px]"><div className="w-[12px] h-[12px] bg-[#d8a631] rounded-[3px] shrink-0" /> <span className="truncate">In-progress</span></div>
                  <span className="font-semibold text-[14px] xl:text-[16px] text-ink">{donutData.inProgress}</span>
                </div>
                <div className="flex items-center justify-between gap-[8px]">
                  <div className="flex items-center gap-[8px]"><div className="w-[12px] h-[12px] bg-[#e5e3db] rounded-[3px] shrink-0" /> <span className="truncate">Not started</span></div>
                  <span className="font-semibold text-[14px] xl:text-[16px] text-ink">{donutData.notStarted}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Pass Rate Row */}
        <div className="bg-white border border-[#eaeaea] rounded-[14px] mb-[24px] shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col cursor-pointer overflow-hidden">
          <div className="flex items-center justify-between px-[28px] py-[20px] border-b border-[#eaeaea]">
            <h3 className="font-bold text-ink text-[16px]">Overall pass rate gauge</h3>
            <div className={`px-[12px] py-[4px] rounded-[100px] text-[12px] font-bold tracking-[0.5px] uppercase flex items-center gap-[4px] border ${passBadgeClass}`}>
              <AssetIcon src={passBadgeIcon} size={12} /> {passBadgeText}
            </div>
          </div>
          <div className="flex-1 p-[28px] flex flex-col md:flex-row items-center gap-[60px]">
            {/* Donut Chart */}
            <div
              className="w-[160px] h-[160px] rounded-full relative flex items-center justify-center shrink-0"
              style={{
                background: hasEnrolledLearners
                  ? `conic-gradient(${gaugeColor} 0% ${overallPassRate}%, #e5e3db ${overallPassRate}% 100%)`
                  : `#e5e3db`
              }}
            >
              <div className="w-[110px] h-[110px] bg-white rounded-full flex flex-col items-center justify-center">
                <span
                  className="text-[24px] font-bold leading-none mb-[2px]"
                  style={{ color: hasEnrolledLearners ? gaugeColor : '#737373' }}
                >
                  {overallPassRate}%
                </span>
                <span className="text-[12px] font-bold uppercase tracking-[1px] text-ink-mute">AVG PASS</span>
              </div>
            </div>

            {/* Bars */}
            <div className="flex-1 w-full flex flex-col gap-[28px]">
              {realCoursePassRates.length === 0 ? (
                <div className="py-[24px] text-center text-ink-mute text-[14px]">
                  No course pass rate records available yet.
                </div>
              ) : (
                realCoursePassRates.map((course: any, i: number) => {
                  const alert = course.passRate < 75;
                  return (
                    <div
                      key={i}
                      onClick={() => course.id && navigate(`/corp/course-detail?id=${course.id}&type=${course.contentType || 'COURSE'}`)}
                      className="flex flex-col gap-[10px] cursor-pointer hover:opacity-80 transition-opacity"
                    >
                      <div className="flex justify-between items-center text-[13px]">
                        <span className="text-ink text-[12px] font-bold hover:underline">{course.title}</span>
                        <span className="font-bold text-ink text-[16px]">{course.passRate}%</span>
                      </div>
                      <div className="w-full h-[8px] bg-[#e5e3db] rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${alert ? "bg-[#d93025]" : "bg-[#769e6b]"}`}
                          style={{ width: `${course.passRate}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white border border-[#eaeaea] rounded-[14px] mb-[32px] shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden cursor-pointer">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="border-b border-[#eaeaea] text-[12px] font-bold uppercase tracking-[0.5px] text-ink-mute bg-[#fcfaf7]">
                  <th className="px-[24px] py-[20px] whitespace-nowrap">COURSE <Icon size={12} className="inline ml-1 opacity-50"><path d="M7 10L12 5l5 5M7 14l5 5 5-5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></Icon></th>
                  <th className="px-[16px] py-[20px] whitespace-nowrap">ENROLMENTS <Icon size={12} className="inline ml-1 opacity-50"><path d="M7 10L12 5l5 5M7 14l5 5 5-5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></Icon></th>
                  <th className="px-[16px] py-[20px] whitespace-nowrap">STARTED <Icon size={12} className="inline ml-1 opacity-50"><path d="M7 10L12 5l5 5M7 14l5 5 5-5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></Icon></th>
                  <th className="px-[16px] py-[20px] whitespace-nowrap">COMPLETED <Icon size={12} className="inline ml-1 opacity-50"><path d="M7 10L12 5l5 5M7 14l5 5 5-5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></Icon></th>
                  <th className="px-[16px] py-[20px] whitespace-nowrap">OVERDUE <Icon size={12} className="inline ml-1 opacity-50"><path d="M7 10L12 5l5 5M7 14l5 5 5-5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></Icon></th>
                  <th className="px-[16px] py-[20px] whitespace-nowrap">COMPLETION DEADLINE <Icon size={12} className="inline ml-1 opacity-50"><path d="M7 10L12 5l5 5M7 14l5 5 5-5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></Icon></th>
                  <th className="px-[16px] py-[20px] whitespace-nowrap">AVG TIME <Icon size={12} className="inline ml-1 opacity-50"><path d="M7 10L12 5l5 5M7 14l5 5 5-5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></Icon></th>
                  <th className="px-[24px] py-[20px] text-right whitespace-nowrap">PASS RATE <Icon size={12} className="inline ml-1 opacity-50"><path d="M7 10L12 5l5 5M7 14l5 5 5-5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></Icon></th>
                </tr>
              </thead>
              <tbody>
                {realCoursePassRates.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-[24px] py-[36px] text-center text-ink-mute text-[14px]">
                      No course records found for this organization.
                    </td>
                  </tr>
                ) : (
                  realCoursePassRates.map((item: any, index: number) => (
                    <tr
                      key={index}
                      onClick={() => item.id && navigate(`/corp/course-detail?id=${item.id}&type=${item.contentType || 'COURSE'}`)}
                      className="border-b border-[#eaeaea] last:border-none hover:bg-[#f6f6f4] transition-colors cursor-pointer"
                    >
                      <td className="px-[24px] py-[22px] font-medium text-ink text-[16px]">
                        <div className="flex items-center gap-2">
                          <span className="hover:underline font-semibold">{item.title}</span>
                          {item.contentType === 'CAREER_PATH' && (
                            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-[#f6e8c4] text-[#8b6a1f]">
                              Career Path
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-[16px] py-[22px] text-ink-mute text-[16px]">{item.enrolments}</td>
                      <td className="px-[16px] py-[22px] text-ink-mute text-[16px]">{item.started}</td>
                      <td className="px-[16px] py-[22px] text-ink-mute text-[16px]">{item.completed}</td>
                      <td className={`px-[16px] py-[22px] text-[16px] font-bold ${item.overdue > 0 ? "text-red-600 font-bold" : "text-ink-mute"}`}>{item.overdue}</td>
                      <td className="px-[16px] py-[22px] text-ink-mute text-[12px]">{item.deadline}</td>
                      <td className="px-[16px] py-[22px] text-ink-mute text-[16px]">{item.avgTime}</td>
                      <td className="px-[24px] py-[22px] text-ink-mute text-[16px] text-right">{item.passRate}%</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Downloadable Reports Grid */}
        <div className="bg-white border border-[#eaeaea] rounded-[14px] shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden mb-[60px] cursor-pointer">
          <div className="flex items-center justify-between px-[24px] py-[20px] border-b border-[#eaeaea]">
            <h3 className="font-bold text-ink text-[16px]">Downloadable reports</h3>
            <span className="text-[14px] text-ink-mute font-medium">Export as CSV or Excel</span>
          </div>
          <div className="p-[24px]">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[16px]">
              {downloadableReports.map((report, index) => (
                <div key={index} className="bg-[#fcfaf7] rounded-[12px] p-[20px] flex flex-col xl:flex-row items-start xl:items-center justify-between gap-[16px] transition-all hover:bg-[#f6f6f4] hover:shadow-sm hover:-translate-y-0.5 cursor-pointer">
                  <div className="flex items-center gap-[14px] flex-1">
                    <div className="w-[38px] h-[38px] rounded-[10px] bg-[#fcf5e3] text-[#c99b2e] flex items-center justify-center shrink-0">
                      <AssetIcon src={report.icon} size={18} />
                    </div>
                    <div className="flex flex-col gap-[2px]">
                      <h4 className="font-bold text-ink text-[16px]">{report.title}</h4>
                      <p className="text-[14px] text-ink-mute leading-snug">{report.desc}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-[8px] w-full xl:w-auto shrink-0 justify-end mt-2 xl:mt-0">
                    <Button
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleExport(report.title, 'csv');
                      }}
                      className="h-[34px] px-[12px] text-[14px] font-bold rounded-full bg-white hover:bg-paper-2 text-ink flex items-center gap-[6px] shadow-sm flex-1 xl:flex-none justify-center"
                    >
                      <AssetIcon src={downloadIcon} size={14} className="opacity-70" /> CSV
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleExport(report.title, 'xlsx');
                      }}
                      className="h-[34px] px-[12px] text-[14px] font-bold rounded-full bg-white hover:bg-paper-2 text-ink flex items-center gap-[6px] shadow-sm flex-1 xl:flex-none justify-center"
                    >
                      <AssetIcon src={downloadIcon} size={14} className="opacity-70" /> Excel
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Report;
