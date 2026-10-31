import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router';
import * as XLSX from "xlsx";
import { useGetTenantById, useTenantDashboard, useTenantDashboardStats } from "../../hooks/tenant";
import { useTenantStore } from "../../store/tenant.store";
import { getAssignmentReportApi } from "../../core/api/corporate-learning.api";
import { TenantUseManagement } from "./TenantUseManagement";

const LicenseUtilization = () => {
  const navigate = useNavigate();
  const [period, setPeriod] = useState("Last 30 days");
  const { tenantDashboard, tenantDashboardStats, setTenantDashboard, setTenantDashboardStats } = useTenantStore();
  const { mutateAsync: fetchTenant } = useGetTenantById();
  const { mutateAsync: fetchDashboard } = useTenantDashboard();
  const { mutateAsync: fetchDashboardStats } = useTenantDashboardStats();
  const [tenantName, setTenantName] = useState("Loading...");
  const [loading, setLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const [metrics, setMetrics] = useState({
    seatsAllocated: 0,
    activeLearners: 0,
    coursesCompleted: 0,
    unusedSeats: 0,
    licenseExpiry: "",
    daysRemaining: 0,
    totalUsers: 0,
    inactiveUsers: 0,
    unassignedSeats: 0,
    utilisationRate: 0,
    periodChange: 0,
    projectedFullStr: ""
  });

  const [usersList, setUsersList] = useState<any[]>([]);
  const [groupsData, setGroupsData] = useState<any[]>([]);
  const [enrollmentTrend, setEnrollmentTrend] = useState<any[]>([]);
  const [activeSeatsTrend, setActiveSeatsTrend] = useState<any[]>([]);
  const [sortField, setSortField] = useState<string>('enrolled');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const colFieldMap: Record<string, string> = {
    'User': 'name',
    'Enrolled': 'enrolled',
    'Completed': 'completed',
    'Progress': 'progress',
    'Status': 'status',
    'Country': 'country'
  };

  const sortedUsersList = useMemo(() => {
    return [...usersList].sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      if (typeof aVal === 'string') {
        return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortDirection === 'asc' ? ((aVal || 0) - (bVal || 0)) : ((bVal || 0) - (aVal || 0));
    });
  }, [usersList, sortField, sortDirection]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const storedUser = localStorage.getItem('keycloak_session_user');
        if (!storedUser) {
          setLoading(false);
          return;
        }

        const parsed = JSON.parse(storedUser);
        const user = parsed?.user || parsed;

        const tenantId = user?.tenantId || user?.tenant?.id || user?.organizationId;
        if (tenantId) {
          // Fetch real tenant info, dashboard data, stats, and real corporate learning assignments
          const [tenantResp, dashboard, stats, assignmentReport] = await Promise.all([
            fetchTenant(tenantId).catch(() => null),
            fetchDashboard(tenantId).catch(() => null),
            fetchDashboardStats({ tenantId, period }).catch(() => null),
            getAssignmentReportApi(tenantId, { limit: 100 }).catch(() => null)
          ]);

          if (dashboard) setTenantDashboard(dashboard);
          if (stats) setTenantDashboardStats(stats);

          if (tenantResp?.name) {
            setTenantName(tenantResp.name);
          } else if (user?.tenant?.name || user?.tenantName) {
            setTenantName(user?.tenant?.name || user?.tenantName);
          }

          const deliveries: any[] = Array.isArray(assignmentReport?.items)
            ? assignmentReport.items
            : Array.isArray(assignmentReport)
              ? assignmentReport
              : [];

          const completedDeliveriesCount = deliveries.filter((d: any) =>
            d.status === "COMPLETED" || d.deliveryStatus === "COMPLETED" || d.progressPercent === 100
          ).length;

          if (dashboard) {
            const seatsAllocated = dashboard.seats?.totalSeats || dashboard.tenant?.seatCount || 500;
            const activeLearners = dashboard.users?.activeUsers || 0;
            const coursesCompleted = stats?.completedEnrollments || stats?.overview?.completedEnrollments || completedDeliveriesCount || 0;
            const unusedSeats = dashboard.seats?.availableSeats ?? Math.max(0, seatsAllocated - (dashboard.users?.totalUsers || 0));

            let licenseExpiry = "N/A";
            let daysRemaining = 0;
            if (dashboard.tenant?.contractEndDate) {
              const endDate = new Date(dashboard.tenant.contractEndDate);
              licenseExpiry = endDate.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
              daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - Date.now()) / (1000 * 3600 * 24)));
            }

            const totalUsers = dashboard.users?.totalUsers || 0;
            const inactiveUsers = dashboard.users?.inactiveUsers || 0;
            const unassignedSeats = unusedSeats;
            const utilisationRate = seatsAllocated > 0 ? (activeLearners / seatsAllocated) * 100 : 0;

            let periodChange = 0;
            let projectedFullStr = "N/A";

            if (stats?.activeSeatsTrend) {
              let trendData = [...stats.activeSeatsTrend];

              if (trendData.length > 0 && activeLearners > 0) {
                const lastIdx = trendData.length - 1;
                if (trendData[lastIdx].val === 0) {
                  trendData[lastIdx] = { ...trendData[lastIdx], val: activeLearners };
                }
              }

              if (trendData.length >= 2) {
                periodChange = trendData[trendData.length - 1].val - trendData[trendData.length - 2].val;
              } else if (trendData.length === 1) {
                periodChange = trendData[0].val;
              }

              const enriched = trendData.map((t: any, idx: number) => {
                let color = 'var(--sage)';
                let textCol = '#141414';

                if (idx === trendData.length - 1 && t.val > 0) {
                  color = 'var(--honey)';
                  textCol = 'var(--honey-text, #8b6a1f)';
                }

                return {
                  ...t,
                  pct: seatsAllocated > 0 ? Math.min(100, (t.val / seatsAllocated) * 100) : 0,
                  color,
                  textCol
                };
              });

              setActiveSeatsTrend(enriched);
            }

            if (periodChange > 0 && seatsAllocated > activeLearners) {
              const monthsLeft = Math.ceil((seatsAllocated - activeLearners) / periodChange);
              const projectedDate = new Date();
              projectedDate.setMonth(projectedDate.getMonth() + monthsLeft);
              projectedFullStr = projectedDate.toLocaleString('default', { month: 'short' }) + ' ' + projectedDate.getFullYear();
            } else if (activeLearners >= seatsAllocated) {
              projectedFullStr = "Full";
            }

            setMetrics({
              seatsAllocated,
              activeLearners,
              coursesCompleted,
              unusedSeats,
              licenseExpiry,
              daysRemaining,
              totalUsers,
              inactiveUsers,
              unassignedSeats,
              utilisationRate,
              periodChange,
              projectedFullStr
            } as any);

            if (stats?.groups) {
              setGroupsData(stats.groups);
            }

            // Real learner activity aggregated from real database assignments
            const userActivityMap = new Map<string, { enrolled: number; completed: number; totalProgress: number }>();

            deliveries.forEach((d: any) => {
              const uid = d.userId;
              if (!uid) return;
              if (!userActivityMap.has(uid)) {
                userActivityMap.set(uid, { enrolled: 0, completed: 0, totalProgress: 0 });
              }
              const rec = userActivityMap.get(uid)!;
              rec.enrolled += 1;
              const isCompleted = d.status === "COMPLETED" || d.deliveryStatus === "COMPLETED" || d.progressPercent === 100;
              if (isCompleted) {
                rec.completed += 1;
              }
              rec.totalProgress += (Number(d.progressPercent) || (isCompleted ? 100 : 0));
            });

            // Gather all tenant users without duplicates
            const allTenantUsers: any[] = [];
            const seenUserIds = new Set<string>();

            if (Array.isArray(dashboard.users?.list)) {
              dashboard.users.list.forEach((u: any) => {
                if (u.id && !seenUserIds.has(u.id)) {
                  seenUserIds.add(u.id);
                  allTenantUsers.push(u);
                }
              });
            }

            deliveries.forEach((d: any) => {
              if (d.userId && !seenUserIds.has(d.userId) && d.user) {
                seenUserIds.add(d.userId);
                allTenantUsers.push(d.user);
              }
            });

            const defaultCountry = dashboard.tenant?.country || tenantResp?.country || "Oman";

            const realUsersList = allTenantUsers.map((u: any) => {
              const firstName = u.profile?.firstName || u.firstName || "";
              const lastName = u.profile?.lastName || u.lastName || "";
              const fullName = (firstName || lastName) ? `${firstName} ${lastName}`.trim() : (u.name || u.email || "Learner");

              const activity = userActivityMap.get(u.id) || { enrolled: 0, completed: 0, totalProgress: 0 };
              const enrolled = activity.enrolled;
              const completed = activity.completed;
              const progress = enrolled > 0 ? Math.round(activity.totalProgress / enrolled) : 0;

              let status = "Inactive";
              if (u.status === "ACTIVE" || u.status === "Active") {
                if (enrolled > 0 && progress === 0) {
                  status = "Not started";
                } else {
                  status = "Active";
                }
              } else if (u.status === "SUSPENDED" || u.status === "INACTIVE" || u.status === "DEACTIVATED") {
                status = "Inactive";
              } else {
                if (enrolled > 0 && progress === 0) {
                  status = "Not started";
                } else if (progress > 0 || completed > 0) {
                  status = "Active";
                } else {
                  status = "Inactive";
                }
              }

              const country = u.profile?.country || u.country || defaultCountry;
              const isUp = progress >= 50;
              const trend = enrolled > 0 ? `${progress}%` : "0%";
              const sparkline = [
                Math.round(progress * 0.1),
                Math.round(progress * 0.2),
                Math.round(progress * 0.35),
                Math.round(progress * 0.5),
                Math.round(progress * 0.65),
                Math.round(progress * 0.8),
                progress
              ].map(v => Math.max(2, Math.min(24, Math.round((v / 100) * 22) + 2)));

              return {
                id: u.id,
                name: fullName,
                enrolled,
                completed,
                progress,
                trend,
                isUp: progress > 0 ? isUp : null,
                status,
                country,
                sparkline
              };
            });

            // Default sort: highest enrolled first, then most completed, then progress
            realUsersList.sort((a, b) => {
              if (b.enrolled !== a.enrolled) return b.enrolled - a.enrolled;
              if (b.completed !== a.completed) return b.completed - a.completed;
              return b.progress - a.progress;
            });

            // Calculate enrollmentTrend for the chart (last 12 months)
            const trendMap = new Map<string, { enrolled: number; completed: number }>();
            const now = new Date();
            const months = [];
            for (let i = 11; i >= 0; i--) {
              const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
              const mStr = d.toLocaleString('default', { month: 'short' });
              const yStr = d.getFullYear();
              const key = `${mStr}-${yStr}`;
              months.push({ key, month: mStr });
              trendMap.set(key, { enrolled: 0, completed: 0 });
            }

            deliveries.forEach((d: any) => {
              const assignedAt = d.assignedAt || d.createdAt;
              if (assignedAt) {
                const cDate = new Date(assignedAt);
                const k = `${cDate.toLocaleString('default', { month: 'short' })}-${cDate.getFullYear()}`;
                if (trendMap.has(k)) trendMap.get(k)!.enrolled += 1;
              }
              const isCompleted = d.status === "COMPLETED" || d.deliveryStatus === "COMPLETED" || d.progressPercent === 100;
              const completedAt = d.completedAt || d.updatedAt || assignedAt;
              if (isCompleted && completedAt) {
                const uDate = new Date(completedAt);
                const k = `${uDate.toLocaleString('default', { month: 'short' })}-${uDate.getFullYear()}`;
                if (trendMap.has(k)) trendMap.get(k)!.completed += 1;
              }
            });

            let cumEnrolled = 0;
            let cumCompleted = 0;
            const newEnrollmentTrend = months.map(m => {
              const data = trendMap.get(m.key)!;
              cumEnrolled += data.enrolled;
              cumCompleted += data.completed;
              return {
                month: m.month,
                enrolled: cumEnrolled,
                completed: cumCompleted
              };
            });
            setEnrollmentTrend(newEnrollmentTrend);

            setUsersList(realUsersList);
          }
        }
      } catch (error) {
        console.error("Failed to load tenant data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [period]);

  // Export handlers for Excel (.xlsx) and CSV (.csv)
  const handleExport = (format: 'xlsx' | 'csv') => {
    if (!usersList || usersList.length === 0) {
      alert("No learner data available to export.");
      return;
    }

    // Matching the exact structure requested: User | Enrolled | Completed | Progress | Status | Country
    const exportData = sortedUsersList.map((user) => ({
      User: user.name,
      Enrolled: user.enrolled,
      Completed: user.completed,
      Progress: `${user.progress}%`,
      Status: user.status,
      Country: user.country,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    worksheet["!cols"] = [
      { wch: 28 }, // User
      { wch: 12 }, // Enrolled
      { wch: 12 }, // Completed
      { wch: 12 }, // Progress
      { wch: 14 }, // Status
      { wch: 16 }, // Country
    ];

    const safeTenantName = (tenantName || "tenant").replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
    const fileName = `license_utilization_${safeTenantName}.${format}`;

    if (format === 'csv') {
      const csvOutput = XLSX.utils.sheet_to_csv(worksheet);
      const blob = new Blob([csvOutput], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } else {
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Learner Activity");
      XLSX.writeFile(workbook, fileName);
    }
  };

  // Graph Calculations
  const xPoints = [38, 98.7, 159.5, 220.2, 280.9, 341.6, 402.4, 463.1, 523.8, 584.5, 645.3, 706];
  const maxEnroll = Math.max(10, ...enrollmentTrend.map((t) => t.enrolled));
  const maxScale = Math.ceil(maxEnroll / 40) * 40; // Scale dynamically

  const getPath = (key: 'enrolled' | 'completed') => {
    if (!enrollmentTrend.length) return "";
    return enrollmentTrend.map((t, idx) => {
      const x = xPoints[idx];
      const y = 210 - ((t[key] / maxScale) * 180);
      return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(" ");
  };

  if (loading) {
    return (
      <div className="min-h-screen relative w-full font-sans animate-pulse">
        {/* Header Skeleton */}
        <div className="flex flex-col md:flex-row flex-wrap md:justify-between md:items-end gap-[16px] my-[18px] mb-[20px]">
          <div>
            <div className="h-[14px] w-[200px] bg-[#e8e8e3] rounded mb-[8px]"></div>
            <div className="h-[28px] w-[250px] bg-[#e8e8e3] rounded mb-[8px]"></div>
            <div className="h-[20px] w-[400px] bg-[#e8e8e3] rounded max-w-full"></div>
          </div>
          <div className="flex flex-wrap gap-[12px]">
            <div className="h-[36px] w-[150px] bg-[#e8e8e3] rounded-[8px]"></div>
            <div className="h-[36px] w-[120px] bg-[#e8e8e3] rounded-full"></div>
            <div className="h-[36px] w-[120px] bg-[#e8e8e3] rounded-full"></div>
          </div>
        </div>

        {/* KPI Grid Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-[10px] lg:gap-[20px] mb-[24px]">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-[#fff] border border-solid border-[#1111111a] rounded-[14px] p-[24px]">
              <div className="rounded-[8px] w-[40px] h-[40px] mb-[20px] bg-[#e8e8e3]"></div>
              <div className="h-[14px] w-[120px] bg-[#e8e8e3] rounded mb-[10px]"></div>
              <div className="h-[28px] w-[80px] bg-[#e8e8e3] rounded mb-[8px]"></div>
              <div className="h-[14px] w-[140px] bg-[#e8e8e3] rounded"></div>
            </div>
          ))}
        </div>

        {/* Row 1 Charts Skeleton */}
        <div className="flex flex-col xl:flex-row gap-[16px] xl:gap-[20px] mb-[20px]">
          <div className="flex-[1.05] bg-[#fff] border border-solid border-[#1111111a] rounded-[16px] h-[380px] p-[24px]">
            <div className="h-[24px] w-[280px] bg-[#e8e8e3] rounded mb-[20px]"></div>
            <div className="w-full h-[280px] bg-[#e8e8e3] rounded-[8px]"></div>
          </div>
          <div className="flex-1 bg-[#fff] border border-solid border-[#1111111a] rounded-[16px] h-[380px] p-[24px]">
            <div className="h-[24px] w-[200px] bg-[#e8e8e3] rounded mb-[20px]"></div>
            <div className="w-full h-[280px] bg-[#e8e8e3] rounded-[8px]"></div>
          </div>
        </div>

        {/* Row 2 Charts Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[16px] md:gap-[20px] mb-[20px]">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-[#fff] border border-solid border-[#1111111a] rounded-[14px] h-[340px] p-[24px]">
              <div className="h-[24px] w-[180px] bg-[#e8e8e3] rounded mb-[20px]"></div>
              <div className="w-full h-[250px] bg-[#e8e8e3] rounded-[8px]"></div>
            </div>
          ))}
        </div>

        {/* Table Skeleton */}
        <div className="bg-[#fff] border border-solid border-[#1111111a] rounded-[14px] h-[400px] p-[24px] mb-[20px]">
          <div className="flex justify-between items-center mb-[20px]">
            <div className="h-[24px] w-[200px] bg-[#e8e8e3] rounded"></div>
            <div className="h-[36px] w-[120px] bg-[#e8e8e3] rounded-[8px]"></div>
          </div>
          <div className="w-full h-[40px] bg-[#e8e8e3] rounded mb-[10px]"></div>
          <div className="w-full h-[40px] bg-[#e8e8e3] rounded mb-[10px]"></div>
          <div className="w-full h-[40px] bg-[#e8e8e3] rounded mb-[10px]"></div>
          <div className="w-full h-[40px] bg-[#e8e8e3] rounded mb-[10px]"></div>
          <div className="w-full h-[40px] bg-[#e8e8e3] rounded"></div>
        </div>
      </div>
    );
  }

  if (selectedUserId) {
    return (
      <TenantUseManagement 
        userId={selectedUserId} 
        onBack={() => setSelectedUserId(null)} 
      />
    );
  }

  return (
    <div className="min-h-screen relative w-full font-sans text-[var(--ink)]">

      {/* Header */}
      <div className="flex flex-col md:flex-row flex-wrap md:justify-between md:items-end gap-[16px] mb-[20px]">
        <div>
          <div className="text-[12px] tracking-[0.1em] uppercase text-[#5c5c5c] mb-[4px] font-semibold">
            TENANT · {tenantName.toUpperCase()}
          </div>
          <h1 className="text-[24px] tracking-[-0.01em] text-[#141414] m-0 font-extrabold">
            Licence utilisation
          </h1>
          <p className="text-[14px] text-[#5c5c5c] max-w-[640px] mt-[6px] mb-0 leading-[1.5]">
            Seat usage, enrolment activity, and learning progress across your tenant.
          </p>
        </div>

        <div className="flex flex-wrap gap-[12px] items-center">
          <label className="text-[12px] text-[#5c5c5c] font-medium" htmlFor="clu-period">
            Period:
          </label>
          <select
            id="clu-period"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="border-[1px] border-solid border-[#11111129] bg-[#fff] h-[40px] w-[164.4px] text-[16px] text-[#141414] appearance-none cursor-pointer rounded-[8px] px-[14px] pr-[34px] font-medium focus:border-[#5c5c5c] focus:outline-none"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 24 24' width='14' height='14' fill='none' stroke='%235c5c5c' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
              backgroundPosition: 'right 10px center',
              backgroundRepeat: 'no-repeat',
              backgroundSize: '14px'
            }}
          >
            <option>Last 30 days</option>
            <option>Last 90 days</option>
            <option>Last 6 months</option>
            <option>Last 12 months</option>
          </select>

          <button
            type="button"
            onClick={() => handleExport('xlsx')}
            className="rounded-full bg-[#fcf7ae] text-[#141414] font-sans font-bold text-[14px] cursor-pointer border-[1px] border-solid border-[#c99b2e40] flex justify-center items-center gap-[6px] px-[16px] h-[36px] transition-all duration-150 shadow-none hover:bg-[#f0ea8a] hover:-translate-y-[1px]"
          >
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg> Export Excel
          </button>
          <button
            type="button"
            onClick={() => handleExport('csv')}
            className="rounded-full bg-[#fcf7ae] text-[#141414] font-sans font-bold text-[14px] cursor-pointer border-[1px] border-solid border-[#c99b2e40] flex justify-center items-center gap-[6px] px-[16px] h-[36px] transition-all duration-150 shadow-none hover:bg-[#f0ea8a] hover:-translate-y-[1px]"
          >
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg> Export CSV
          </button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-[10px] lg:gap-[16px] mb-[20px]">
        <div className="bg-[#fff] border border-solid border-[#1111111a] rounded-[14px] p-[20px] shadow-none hover:border-[#11111129] hover:-translate-y-1 hover:shadow-xl transform transition-all duration-300 ease-out">
          <div className="rounded-[8px] place-items-center w-[32px] h-[32px] mb-[16px] grid bg-[#f6e8c4] text-[#8b6a1f]">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
          </div>
          <div className="text-[12px] tracking-[0.05em] uppercase text-[#5c5c5c] mb-[6px] font-bold">SEATS ALLOCATED</div>
          <div className="text-[24px] tracking-[-0.03em] text-[#141414] font-extrabold leading-[1] mb-[4px]">{metrics.seatsAllocated}</div>
          <div className="text-[14px] text-[#5c5c5c] font-medium">Of total licence pool</div>
        </div>

        {/* Active learners */}
        <div className="bg-[#fff] border border-solid border-[#1111111a] rounded-[14px] p-[20px] shadow-none hover:border-[#11111129] hover:-translate-y-1 hover:shadow-xl transform transition-all duration-300 ease-out">
          <div className="rounded-[8px] place-items-center w-[32px] h-[32px] mb-[16px] grid bg-[#dce5d3] text-[#4e6a40]">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
          </div>
          <div className="text-[12px] tracking-[0.05em] uppercase text-[#5c5c5c] mb-[6px] font-bold">ACTIVE LEARNERS</div>
          <div className="text-[24px] tracking-[-0.03em] text-[#141414] font-extrabold leading-[1] mb-[4px]">{metrics.activeLearners}<span className="text-[18px] text-[#5c5c5c] ml-[4px] font-bold">/ {metrics.seatsAllocated}</span></div>
          <div className="text-[14px] text-[#7e9b6f] font-medium">Currently active</div>
        </div>

        {/* Courses completed */}
        <div className="bg-[#fff] border border-solid border-[#1111111a] rounded-[14px] p-[20px] shadow-none hover:border-[#11111129] hover:-translate-y-1 hover:shadow-xl transform transition-all duration-300 ease-out">
          <div className="rounded-[8px] place-items-center w-[32px] h-[32px] mb-[16px] grid bg-[#dce5d3] text-[#4e6a40]">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 11l3 3L22 4"></path><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>
          </div>
          <div className="text-[12px] tracking-[0.05em] uppercase text-[#5c5c5c] mb-[6px] font-bold">COURSES COMPLETED</div>
          <div className="text-[24px] tracking-[-0.03em] text-[#141414] font-extrabold leading-[1] mb-[4px]">{metrics.coursesCompleted.toLocaleString()}</div>
          <div className="text-[14px] text-[#7e9b6f] font-medium">Total course completions</div>
        </div>

        {/* Unused seats */}
        <div className="bg-[#fff] border border-solid border-[#1111111a] rounded-[14px] p-[20px] shadow-none hover:border-[#11111129] hover:-translate-y-1 hover:shadow-xl transform transition-all duration-300 ease-out">
          <div className="rounded-[8px] place-items-center w-[32px] h-[32px] mb-[16px] grid bg-[#efd3c7] text-[#8f3a20]">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
          </div>
          <div className="text-[12px] tracking-[0.05em] uppercase text-[#5c5c5c] mb-[6px] font-bold">UNUSED SEATS</div>
          <div className="text-[24px] tracking-[-0.03em] text-[#141414] font-extrabold leading-[1] mb-[4px]">{metrics.unusedSeats}</div>
          <div className="text-[14px] text-[#b8654e] font-medium">Seats remaining unassigned</div>
        </div>

        {/* Licence expiry */}
        <div className="bg-[#fff] border border-solid border-[#1111111a] rounded-[14px] p-[20px] shadow-none hover:border-[#11111129] hover:-translate-y-1 hover:shadow-xl transform transition-all duration-300 ease-out">
          <div className="rounded-[8px] place-items-center w-[32px] h-[32px] mb-[16px] grid bg-[#f6e8c4] text-[#8b6a1f]">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
          </div>
          <div className="text-[12px] tracking-[0.05em] uppercase text-[#5c5c5c] mb-[6px] font-bold">LICENCE EXPIRY</div>
          <div className="text-[24px] tracking-[-0.03em] text-[#141414] font-extrabold leading-[1] mb-[4px]">{metrics.licenseExpiry}</div>
          <div className="text-[14px] text-[#5c5c5c] font-medium">{metrics.daysRemaining} days remaining</div>
        </div>
      </div>

      {/* Row 1 Charts */}
      <div className="flex flex-col xl:flex-row gap-[16px] xl:gap-[20px] mb-[20px]">

        {/* Enrolment vs courses completed */}
        <div className="flex-[1.6] bg-[#fff] border border-solid border-[#1111111a] rounded-[16px] shadow-none hover:border-[#11111129] hover:-translate-y-1 hover:shadow-xl transform transition-all duration-300 ease-out overflow-hidden">
          <div className="flex justify-between items-center gap-[12px] mb-[4px] pt-[20px] px-[24px]">
            <span className="text-[16px] text-[#141414] tracking-[-0.01em] font-extrabold">Enrolment vs courses completed</span>
            <span className="text-[12px] bg-[#f6f6f4] text-[#5c5c5c] px-[10px] py-[4px] rounded-full font-bold inline-flex">{period}</span>
          </div>
          <div className="px-[24px] pb-[20px]">
            <div className="text-[14px] text-[#8c8c8c]">Monthly trend comparison for the last 12 months.</div>

            <svg className="w-full block overflow-visible mt-[16px]" width="100%" height="200" viewBox="0 0 720 240" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Enrolment vs completion trend">
              <g><line x1="38" y1="210" x2="706" y2="210" stroke="#1111111a" strokeWidth="1"></line><text x="30" y="213" textAnchor="end" fontSize="10" fill="#8c8c8c" fontFamily="sans-serif">0</text></g>
              <g><line x1="38" y1="150" x2="706" y2="150" stroke="#1111111a" strokeWidth="1"></line><text x="30" y="153" textAnchor="end" fontSize="10" fill="#8c8c8c" fontFamily="sans-serif">{Math.round(maxScale * 0.33)}</text></g>
              <g><line x1="38" y1="90" x2="706" y2="90" stroke="#1111111a" strokeWidth="1"></line><text x="30" y="93" textAnchor="end" fontSize="10" fill="#8c8c8c" fontFamily="sans-serif">{Math.round(maxScale * 0.66)}</text></g>
              <g><line x1="38" y1="30" x2="706" y2="30" stroke="#1111111a" strokeWidth="1"></line><text x="30" y="33" textAnchor="end" fontSize="10" fill="#8c8c8c" fontFamily="sans-serif">{maxScale}</text></g>

              {enrollmentTrend.map((t, i) => (
                <text key={i} x={xPoints[i]} y="230" textAnchor="middle" fontSize="10" fill="#8c8c8c" fontFamily="sans-serif">{t.month}</text>
              ))}

              <path d={getPath('enrolled')} fill="none" stroke="var(--sage, #7E9B6F)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"></path>
              <path d={getPath('completed')} fill="none" stroke="var(--honey, #C99B2E)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"></path>

              {enrollmentTrend.length > 0 && (
                <>
                  <circle cx={xPoints[enrollmentTrend.length - 1]} cy={210 - ((enrollmentTrend[enrollmentTrend.length - 1].completed / maxScale) * 180)} r="4" fill="var(--honey, #C99B2E)"></circle>
                  <circle cx={xPoints[enrollmentTrend.length - 1]} cy={210 - ((enrollmentTrend[enrollmentTrend.length - 1].enrolled / maxScale) * 180)} r="4" fill="var(--sage, #7E9B6F)"></circle>
                </>
              )}
            </svg>

            <div className="flex flex-wrap gap-[16px] mt-[16px]">
              <div className="text-[12px] text-[#5c5c5c] flex items-center gap-[6px]"><span className="rounded-[2px] shrink-0 w-[10px] h-[10px] bg-[#c99b2e]"></span>Enrolled</div>
              <div className="text-[12px] text-[#5c5c5c] flex items-center gap-[6px]"><span className="rounded-[2px] shrink-0 w-[10px] h-[10px] bg-[#7e9b6f]"></span>Courses completed</div>
            </div>
          </div>
        </div>

        {/* Seat status */}
        <div className="flex-1 bg-[#fff] border border-solid border-[#1111111a] rounded-[16px] shadow-none hover:border-[#11111129] hover:-translate-y-1 hover:shadow-xl transform transition-all duration-300 ease-out overflow-hidden">
          <div className="flex justify-between items-center gap-[12px] mb-[16px] pt-[20px] px-[24px]">
            <span className="text-[16px] text-[#141414] tracking-[-0.01em] font-extrabold">Seat status</span>
            <span className="text-[12px] bg-[#f8f3e6] text-[#8b6a1f] px-[10px] py-[4px] rounded-full font-bold inline-flex">{metrics.seatsAllocated} total</span>
          </div>
          <div className="px-[24px] pb-[20px] flex flex-col">
            <div className="flex flex-col sm:flex-row sm:items-center gap-[14px] sm:gap-[24px]">
              <div className="shrink-0 w-[120px] h-[120px] relative flex justify-center items-center">
                {/* SVG Donut */}
                <svg viewBox="0 0 140 140" className="w-[120px] h-[120px] -rotate-90 absolute inset-0">
                  <circle cx="70" cy="70" r="52" fill="none" stroke="#7e9b6f" strokeWidth="28" strokeDasharray={`${metrics.utilisationRate * 3.2673} 326.73`} strokeDashoffset="0"></circle>
                  <circle cx="70" cy="70" r="52" fill="none" stroke="#c99b2e" strokeWidth="28" strokeDasharray={`${(metrics.inactiveUsers / Math.max(1, metrics.seatsAllocated) * 100) * 3.2673} 326.73`} strokeDashoffset={`-${metrics.utilisationRate * 3.2673}`}></circle>
                  <circle cx="70" cy="70" r="52" fill="none" stroke="#b8654e" strokeWidth="28" strokeDasharray={`${(Math.max(0, metrics.totalUsers - metrics.activeLearners - metrics.inactiveUsers) / Math.max(1, metrics.seatsAllocated) * 100) * 3.2673} 326.73`} strokeDashoffset={`-${(metrics.utilisationRate + (metrics.inactiveUsers / Math.max(1, metrics.seatsAllocated) * 100)) * 3.2673}`}></circle>
                  <circle cx="70" cy="70" r="52" fill="none" stroke="#e8e8e3" strokeWidth="28" strokeDasharray={`${(metrics.unassignedSeats / Math.max(1, metrics.seatsAllocated) * 100) * 3.2673} 326.73`} strokeDashoffset={`-${((metrics.utilisationRate + (metrics.inactiveUsers / Math.max(1, metrics.seatsAllocated) * 100) + (Math.max(0, metrics.totalUsers - metrics.activeLearners - metrics.inactiveUsers) / Math.max(1, metrics.seatsAllocated) * 100))) * 3.2673}`}></circle>
                </svg>
                <div className="z-[1] text-center flex flex-col justify-center items-center relative">
                  <div className="text-[24px] text-[#141414] tracking-[-0.03em] font-extrabold leading-[1] mt-[4px]">{Math.round(metrics.utilisationRate)}%</div>
                  <div className="text-[10px] tracking-[0.05em] uppercase text-[#5c5c5c] font-bold mt-[4px]">USED</div>
                </div>
              </div>

              <div className="flex flex-col flex-1 gap-[8px]">
                <div className="flex items-center gap-[10px]">
                  <span className="rounded-[2px] shrink-0 w-[10px] h-[10px] bg-[#7e9b6f]"></span>
                  <span className="text-[14px] text-[#5c5c5c] flex-1">Active</span>
                  <span className="text-[14px] text-[#141414] font-variant-numeric:tabular-nums font-extrabold">{metrics.activeLearners}</span>
                  <span className="text-[12px] text-[#8c8c8c] text-right font-variant-numeric:tabular-nums min-w-[36px]">{metrics.utilisationRate.toFixed(1)}%</span>
                </div>
                <div className="flex items-center gap-[10px]">
                  <span className="rounded-[2px] shrink-0 w-[10px] h-[10px] bg-[#c99b2e]"></span>
                  <span className="text-[14px] text-[#5c5c5c] flex-1">Inactive</span>
                  <span className="text-[14px] text-[#141414] font-variant-numeric:tabular-nums font-extrabold">{metrics.inactiveUsers}</span>
                  <span className="text-[12px] text-[#8c8c8c] text-right font-variant-numeric:tabular-nums min-w-[36px]">{metrics.seatsAllocated > 0 ? ((metrics.inactiveUsers / metrics.seatsAllocated) * 100).toFixed(1) : 0}%</span>
                </div>
                <div className="flex items-center gap-[10px]">
                  <span className="rounded-[2px] shrink-0 w-[10px] h-[10px] bg-[#b8654e]"></span>
                  <span className="text-[14px] text-[#5c5c5c] flex-1">Never logged in</span>
                  <span className="text-[14px] text-[#141414] font-variant-numeric:tabular-nums font-extrabold">{Math.max(0, metrics.totalUsers - metrics.activeLearners - metrics.inactiveUsers)}</span>
                  <span className="text-[12px] text-[#8c8c8c] text-right font-variant-numeric:tabular-nums min-w-[36px]">{metrics.seatsAllocated > 0 ? ((Math.max(0, metrics.totalUsers - metrics.activeLearners - metrics.inactiveUsers) / metrics.seatsAllocated) * 100).toFixed(1) : 0}%</span>
                </div>
                <div className="flex items-center gap-[10px]">
                  <span className="rounded-[2px] shrink-0 w-[10px] h-[10px] bg-[#e8e8e3]"></span>
                  <span className="text-[14px] text-[#5c5c5c] flex-1">Unassigned</span>
                  <span className="text-[14px] text-[#141414] font-variant-numeric:tabular-nums font-extrabold">{metrics.unassignedSeats}</span>
                  <span className="text-[12px] text-[#8c8c8c] text-right font-variant-numeric:tabular-nums min-w-[36px]">{metrics.seatsAllocated > 0 ? ((metrics.unassignedSeats / metrics.seatsAllocated) * 100).toFixed(1) : 0}%</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-[8px] sm:gap-[12px] mt-[20px]">
              <div className="bg-[#f6f6f4] border border-solid border-[#1111111a] rounded-[10px] flex-1 p-[12px]">
                <span className="text-[12px] tracking-[0.05em] uppercase text-[#5c5c5c] mb-[6px] font-bold block">UTILISATION</span>
                <span className="text-[16px] tracking-[-0.02em] text-[#141414] font-extrabold">{metrics.utilisationRate.toFixed(1)}%</span>
              </div>
              <div className="bg-[#f6f6f4] border border-solid border-[#1111111a] rounded-[10px] flex-1 p-[12px]">
                <span className="text-[12px] tracking-[0.05em] uppercase text-[#5c5c5c] mb-[6px] font-bold block">IDLE TO RECLAIM</span>
                <span className="text-[16px] tracking-[-0.02em] text-[#141414] font-extrabold">{metrics.inactiveUsers}</span>
              </div>
              <div className="bg-[#f6f6f4] border border-solid border-[#1111111a] rounded-[10px] flex-1 p-[12px]">
                <span className="text-[12px] tracking-[0.05em] uppercase text-[#5c5c5c] mb-[6px] font-bold block">PROJECTED FULL</span>
                <span className="text-[16px] tracking-[-0.02em] text-[#141414] font-extrabold">{metrics.projectedFullStr || 'N/A'}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-[12px] sm:gap-[16px] mt-[16px]">
              <span className="text-[14px] text-[#141414] flex-1 leading-[1.5] font-medium">{metrics.inactiveUsers} seats sit idle over 30 days.<br />Reclaim them to cut licence spend.</span>
              <button type="button" onClick={() => navigate('/create-tenant-user')} className="rounded-[8px] bg-[#fcf7ae] text-[#141414] text-[14px] cursor-pointer whitespace-nowrap border-[1px] border-solid border-[#c99b2e66] flex items-center justify-center gap-[6px] px-[16px] h-[32px] font-bold transition-all shadow-none hover:bg-[#f0ea8a] hover:-translate-y-[1px]">
                Reassign idle seats <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2 Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[16px] md:gap-[20px] mb-[20px]">
        {/* Completion by group */}
        <div className="bg-[#fff] border border-solid border-[#1111111a] rounded-[14px] shadow-none hover:border-[#11111129] hover:-translate-y-1 hover:shadow-xl transform transition-all duration-300 ease-out overflow-hidden">
          <div className="flex justify-between items-center gap-[10px] mb-[14px] pt-[20px] px-[24px]">
            <span className="text-[16px] text-[#141414] tracking-[-0.01em] font-extrabold">Completion by group</span>
          </div>
          <div className="px-[24px] pb-[24px] max-h-[350px] overflow-y-auto">
            <div className="flex flex-col gap-[16px]">
              {groupsData.length > 0 ? groupsData.map((grp, idx) => (
                <div key={idx} className="flex flex-col gap-[5px]">
                  <div className="flex justify-between items-end mb-[6px]">
                    <span className="text-[14px] text-[#141414] font-bold">{grp.name}</span>
                    <div className="inline-flex items-center gap-[6px]">
                      <span className={`text-[12px] font-variant-numeric:tabular-nums font-bold ${grp.progress > 50 ? 'text-[#4e6a40]' : 'text-[#b8654e]'}`}>{grp.completed} / {grp.enrolled}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-[12px]">
                    <div className="rounded-full overflow-hidden flex-1" style={{ height: '6px', backgroundColor: '#e8e8e3' }}>
                      <div className="rounded-full h-full transition-all duration-400" style={{ width: `${grp.progress}%`, backgroundColor: '#c99b2e' }}></div>
                    </div>
                    <span className="text-[14px] text-[#141414] text-right font-variant-numeric:tabular-nums min-w-[32px] font-extrabold">{grp.progress}%</span>
                  </div>
                </div>
              )) : (
                <div className="text-center py-4 text-[#5c5c5c]">No group data available</div>
              )}
            </div>
          </div>
        </div>



        {/* Engagement Score */}
        <div className="bg-[#fff] border border-solid border-[#1111111a] rounded-[14px] shadow-none hover:border-[#11111129] hover:-translate-y-1 hover:shadow-xl transform transition-all duration-300 ease-out overflow-hidden">
          <div className="flex justify-between items-center gap-[10px] mb-[14px] pt-[20px] px-[24px]">
            <span className="text-[16px] text-[#141414] tracking-[-0.01em] font-extrabold">Engagement score</span>
            <span className="text-[12px] bg-[#7e9b6f1a] text-[#4e6a40] border border-transparent whitespace-nowrap rounded-full items-center px-[10px] py-[2px] font-bold inline-flex">This period</span>
          </div>
          <div className="px-[24px] pb-[24px]">
            <div className="flex justify-between items-center gap-[14px] mb-[6px]">
              <div className="flex items-baseline gap-[4px]">
                <span className="text-[33px] tracking-[-0.03em] text-[#141414] font-extrabold leading-[1]">{tenantDashboardStats?.engagement?.score ?? 0}</span>
                <span className="text-[16px] text-[#5c5c5c] font-bold">/ 100</span>
              </div>
              <div className="flex items-center gap-[8px]">
                {tenantDashboardStats?.engagement?.isPass ? (
                  <span className="h-[24px] text-[12px] tracking-[0.1em] uppercase text-[#4e6a40] bg-[#7e9b6f1a] border-[1.5px] border-solid border-[#7e9b6f4d] rounded-full flex items-center gap-[6px] px-[10px] font-extrabold before:content-[''] before:bg-[#4e6a40] before:rounded-full before:w-[5px] before:h-[5px]">PASS</span>
                ) : (
                  <span className="h-[24px] text-[12px] tracking-[0.1em] uppercase text-[#b8654e] bg-[#b8654e1a] border-[1.5px] border-solid border-[#b8654e4d] rounded-full flex items-center gap-[6px] px-[10px] font-extrabold before:content-[''] before:bg-[#b8654e] before:rounded-full before:w-[5px] before:h-[5px]">FAIL</span>
                )}
                <span className={`text-[14px] font-extrabold ${tenantDashboardStats?.engagement?.pointsChange >= 0 ? 'text-[#4e6a40]' : 'text-[#b8654e]'}`}>
                  {tenantDashboardStats?.engagement?.pointsChange >= 0 ? '↑ +' : '↓ '}{tenantDashboardStats?.engagement?.pointsChange ?? 0} pts
                </span>
              </div>
            </div>

            <div className="my-[6px] mb-[18px]">
              <svg className="w-full block" width="100%" height="120" viewBox="0 0 720 240" preserveAspectRatio="none" role="img" aria-label="Engagement trend">
                <defs><linearGradient id="clu-eng-grad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#7e9b6f" stopOpacity="0.22"></stop><stop offset="100%" stopColor="#7e9b6f" stopOpacity="0"></stop></linearGradient></defs>
                <line x1="38" y1="134.6" x2="706" y2="134.6" stroke="#b8654e" strokeWidth="1.5" strokeDasharray="6 6"></line>
                <path d="M 38 122.6 C 48.1 121.8 78.5 118.3 98.7 118.0 C 119.0 117.8 139.2 121.8 159.5 121.0 C 179.7 120.3 199.9 115.8 220.2 113.5 C 240.4 111.2 260.7 108.0 280.9 107.5 C 301.2 107.0 321.4 109.2 341.6 110.5 C 361.9 111.7 382.1 116.0 402.4 115.0 C 422.6 114.0 442.8 107.0 463.1 104.5 C 483.3 101.9 503.6 101.2 523.8 99.9 C 544.1 98.7 564.3 97.7 584.5 96.9 C 604.8 96.2 625.0 96.2 645.3 95.4 C 665.5 94.7 695.9 92.9 706 92.4 L 706 210 L 38 210 Z" fill="url(#clu-eng-grad)"></path>
                <path d="M 38 122.6 C 48.1 121.8 78.5 118.3 98.7 118.0 C 119.0 117.8 139.2 121.8 159.5 121.0 C 179.7 120.3 199.9 115.8 220.2 113.5 C 240.4 111.2 260.7 108.0 280.9 107.5 C 301.2 107.0 321.4 109.2 341.6 110.5 C 361.9 111.7 382.1 116.0 402.4 115.0 C 422.6 114.0 442.8 107.0 463.1 104.5 C 483.3 101.9 503.6 101.2 523.8 99.9 C 544.1 98.7 564.3 97.7 584.5 96.9 C 604.8 96.2 625.0 96.2 645.3 95.4 C 665.5 94.7 695.9 92.9 706 92.4" fill="none" stroke="#7e9b6f" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"></path>
                <circle cx="706" cy="92.4" r="5" fill="#7e9b6f" stroke="#fff" strokeWidth="2"></circle>
              </svg>
              <div className="flex gap-[16px] mt-[10px]">
                <span className="text-[12px] text-[#141414] font-bold inline-flex items-center gap-[7px]"><span className="bg-[#7e9b6f] rounded-[2px] w-[14px] h-[3px]"></span>Engagement</span>
                <span className="text-[12px] text-[#141414] font-bold inline-flex items-center gap-[7px]"><span className="border-t-[2px] border-dashed border-[#b8654e] w-[14px] h-0"></span>Pass line (50)</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-[6px] sm:gap-[8px] w-full">
              <div className="text-center bg-[#f6f6f4] rounded-[8px] p-[10px]">
                <div className="text-[12px] tracking-[0.05em] text-[#5c5c5c] uppercase mb-[8px] font-bold">Avg. time/week</div>
                <div className="text-[20px] text-[#141414] tracking-[-0.02em] font-extrabold">{tenantDashboardStats?.engagement?.avgTimePerWeek ?? '0.0'} h</div>
              </div>
              <div className="text-center bg-[#f6f6f4] rounded-[8px] p-[10px]">
                <div className="text-[12px] tracking-[0.05em] text-[#5c5c5c] uppercase mb-[8px] font-bold">Login frequency</div>
                <div className="text-[20px] text-[#141414] tracking-[-0.02em] font-extrabold">{tenantDashboardStats?.engagement?.loginFrequency ?? '0.0'} x</div>
              </div>
              <div className="text-center bg-[#f6f6f4] rounded-[8px] p-[10px]">
                <div className="text-[12px] tracking-[0.05em] text-[#5c5c5c] uppercase mb-[8px] font-bold">Active days/wk</div>
                <div className="text-[20px] text-[#141414] tracking-[-0.02em] font-extrabold">{tenantDashboardStats?.engagement?.activeDaysPerWeek ?? '0.0'}</div>
              </div>
            </div>

            <div className="rounded-[8px] bg-[#dce5d3] w-full text-[#4e6a40] text-[13px] flex items-center gap-[12px] mt-[16px] p-[10px_12px] leading-[1.45] font-medium">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="mt-[-2px] shrink-0"><polyline points="20 6 9 17 4 12"></polyline></svg>
              <span>{tenantDashboardStats?.engagement?.isPass ? 'Above' : 'Below'} the 50-point pass line · <strong className="font-bold">{tenantDashboardStats?.engagement?.pointsChange >= 0 ? '+' : ''}{tenantDashboardStats?.engagement?.pointsChange ?? 0} pts</strong> vs last period.</span>
            </div>
          </div>
        </div>

        {/* Active seats trend */}
        <div className="bg-[#fff] border border-solid border-[#1111111a] rounded-[14px] shadow-none hover:border-[#11111129] hover:-translate-y-1 hover:shadow-xl transform transition-all duration-300 ease-out overflow-hidden">
          <div className="flex justify-between items-center gap-[10px] mb-[14px] pt-[20px] px-[24px]">
            <span className="text-[16px] text-[#141414] tracking-[-0.01em] font-extrabold">Active seats trend</span>
          </div>
          <div className="px-[24px] pb-[24px]">
            <div className="flex items-end gap-[6px] h-[120px]" aria-label="Active seats by month">
              {activeSeatsTrend.map((t, idx) => (
                <div key={idx} className="flex flex-col flex-1 justify-end items-center gap-[6px] h-full group">
                  <span className="text-[12px] whitespace-nowrap font-bold" style={{ color: t.textCol || '#141414' }}>{t.val}</span>
                  <div className="rounded-t-[4px] w-full min-h-[4px] transition-opacity duration-150 group-hover:opacity-80" style={{ height: `${t.pct}%`, background: t.color === 'var(--honey)' ? '#c99b2e' : '#7e9b6f' }}></div>
                  <span className="text-[12px] text-[#8c8c8c] whitespace-nowrap font-bold">{t.month}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-solid border-[#1111111a] flex justify-between items-center mt-[24px] pt-[16px]">
              <div>
                <div className="text-[12px] tracking-[0.05em] text-[#5c5c5c] uppercase mb-[6px] font-bold">PERIOD CHANGE</div>
                <div className="inline-flex items-center gap-[6px]">
                  <div className="inline-flex items-end gap-[2px] h-[14px]">
                    <div className="w-[3px] bg-[#7e9b6f] h-[4px] rounded-[1px]"></div>
                    <div className="w-[3px] bg-[#7e9b6f] h-[7px] rounded-[1px]"></div>
                    <div className="w-[3px] bg-[#7e9b6f] h-[10px] rounded-[1px]"></div>
                    <div className="w-[3px] bg-[#7e9b6f] h-[14px] rounded-[1px]"></div>
                  </div>
                  <span className={`text-[14px] font-variant-numeric:tabular-nums font-extrabold ${(metrics as any).periodChange >= 0 ? 'text-[#4e6a40]' : 'text-[#b8654e]'}`}>
                    {(metrics as any).periodChange >= 0 ? '↑' : '↓'} {(metrics as any).periodChange > 0 ? '+' : ''}{(metrics as any).periodChange} seats
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[12px] tracking-[0.05em] text-[#5c5c5c] uppercase mb-[6px] font-bold">UTILISATION RATE</div>
                <div className="text-[24px] text-[#141414] tracking-[-0.02em] font-extrabold leading-[1]">{metrics.utilisationRate.toFixed(1)}%</div>
              </div>
            </div>

            <div className="mt-[20px]">
              <div className="flex justify-between items-baseline mb-[8px]">
                <span className="text-[12px] tracking-[0.05em] uppercase text-[#5c5c5c] font-bold">SEAT CAPACITY</span>
                <span className="text-[14px] text-[#5c5c5c] font-medium"><strong className="text-[#141414] font-bold">{metrics.activeLearners}</strong> of {metrics.seatsAllocated} used</span>
              </div>
              <div className="bg-[#e8e8e3] rounded-full h-[6px] overflow-hidden">
                <div className="rounded-full h-full transition-all duration-400 bg-[#c99b2e]" style={{ width: `${metrics.utilisationRate}%` }}></div>
              </div>
              {((metrics as any).periodChange > 0 && (metrics as any).projectedFullStr !== 'Full' && (metrics as any).projectedFullStr !== 'N/A') && (
                <div className="flex items-start gap-[8px] mt-[16px] pt-[16px] border-t border-solid border-[#1111111a]">
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#5c5c5c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="mt-[2px] shrink-0">
                    <circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line>
                  </svg>
                  <span className="text-[14px] text-[#5c5c5c] leading-[1.4] font-medium">
                    On track to reach full capacity by <strong className="text-[#141414] font-bold">{(metrics as any).projectedFullStr}</strong> at the current +{(metrics as any).periodChange} seats/month pace.
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#fff] border border-solid border-[#1111111a] rounded-[14px] shadow-none hover:border-[#11111129] hover:-translate-y-1 hover:shadow-xl transform transition-all duration-300 ease-out overflow-hidden mb-[20px]">
        <div className="flex justify-between items-center gap-[10px] mb-[16px] pt-[20px] px-[20px]">
          <span className="text-[16px] text-[#141414] tracking-[-0.01em] font-extrabold">Learner activity</span>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="border border-solid border-[#1111111a] bg-[#fff] h-[40px] w-[164.4px] text-[16px] text-[#141414] appearance-none cursor-pointer rounded-[8px] px-[12px] pr-[30px] font-medium focus:border-[#5c5c5c] focus:outline-none"
            aria-label="Table period"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 24 24' width='14' height='14' fill='none' stroke='%235c5c5c' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
              backgroundPosition: 'right 8px center',
              backgroundRepeat: 'no-repeat',
              backgroundSize: '14px'
            }}>
            <option>Last 30 days</option>
            <option>Last 90 days</option>
            <option>Last 6 months</option>
            <option>Last 12 months</option>
          </select>
        </div>
        <div className="overflow-x-auto pb-[10px]">
          <table className="w-full border-collapse min-w-[800px]">
            <thead>
              <tr>
                {['User', 'Enrolled', 'Completed', 'Progress', '7-day trend', 'Status', 'Country'].map((col, i) => (
                  <th key={i} aria-sort="none" className={`text-[12px] tracking-[0.08em] uppercase text-[#8c8c8c] text-left border-b border-solid border-[#1111111a] px-[16px] md:px-[20px] pb-[12px] pt-[0] font-bold ${i >= 3 ? 'hidden md:table-cell' : ''}`}>
                    {i === 4 ? col : (
                      <button
                        type="button"
                        onClick={() => colFieldMap[col] && handleSort(colFieldMap[col])}
                        className="font-inherit text-inherit tracking-inherit uppercase cursor-pointer bg-transparent border-0 inline-flex items-center gap-[5px] m-0 p-0 transition-colors duration-150 hover:text-[#141414] font-bold"
                      >
                        <span>{col}</span>
                        <svg className={`text-current shrink-0 ${sortField === colFieldMap[col] ? 'opacity-100' : 'opacity-45'}`} width="11" height="11" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M7 10l5-5 5 5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"></path><path d="M7 14l5 5 5-5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"></path></svg>
                      </button>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedUsersList.length > 0 ? sortedUsersList.map((user, idx) => (
                <tr key={user.id || idx} onClick={() => setSelectedUserId(user.id)} className="cursor-pointer transition-colors duration-150 hover:bg-[#f6f6f4] group/row">
                  <td className="text-[16px] text-[#141414] border-b border-solid border-[#1111111a] align-middle px-[16px] md:px-[20px] py-[14px] group-last/row:border-none font-regular">{user.name}</td>
                  <td className="text-[16px] text-[#141414] border-b border-solid border-[#1111111a] align-middle px-[16px] md:px-[20px] py-[14px] group-last/row:border-none font-regular">{user.enrolled}</td>
                  <td className="text-[16px] text-[#141414] border-b border-solid border-[#1111111a] align-middle px-[16px] md:px-[20px] py-[14px] group-last/row:border-none font-regular">{user.completed}</td>
                  <td className="hidden md:table-cell border-b border-solid border-[#1111111a] align-middle px-[16px] md:px-[20px] py-[14px] group-last/row:border-none">
                    <div className="flex items-center gap-[12px]">
                      <div className="rounded-full overflow-hidden" style={{ width: '54px', height: '6px', backgroundColor: '#e8e8e3' }}>
                        <div className="h-full rounded-full transition-all duration-400" style={{ width: `${user.progress}%`, backgroundColor: '#c99b2e' }}></div>
                      </div>
                      <span className="text-[14px] text-[#141414] font-variant-numeric:tabular-nums font-bold">{user.progress}%</span>
                    </div>
                  </td>
                  <td className="hidden md:table-cell border-b border-solid border-[#1111111a] align-middle px-[16px] md:px-[20px] py-[14px] group-last/row:border-none">
                    <div className="inline-flex items-center gap-[6px]">
                      <div className="inline-flex items-end gap-[2px] h-[24px]">
                        {user.sparkline?.map((h: any, i: number) => (
                          <div key={i} className="rounded-t-[2px]" style={{ width: '5px', height: `${h}px`, backgroundColor: user.isUp === true ? '#7e9b6f' : user.isUp === false ? '#b8654e' : '#e8e8e3' }}></div>
                        ))}
                      </div>
                      <div className={`text-[14px] font-variant-numeric:tabular-nums font-bold inline-flex items-center gap-[4px] ${user.isUp === true ? 'text-[#4e6a40]' : user.isUp === false ? 'text-[#b8654e]' : 'text-[#5c5c5c]'}`}>
                        {user.isUp !== null && <span className="leading-[1]">{user.isUp ? '↑' : '↓'}</span>}
                        <span>{user.trend}</span>
                      </div>
                    </div>
                  </td>
                  <td className="hidden md:table-cell border-b border-solid border-[#1111111a] align-middle px-[16px] md:px-[20px] py-[14px] group-last/row:border-none">
                    <span className={`text-[12px] whitespace-nowrap rounded-[16px] px-[12px] py-[4px] font-medium inline-flex ${user.status === 'Active' ? 'text-[#4e6a40] bg-[#dce5d3]' : user.status === 'Inactive' ? 'text-[#8b6a1f] bg-[#f6e8c4]' : 'text-[#8f3a20] bg-[#efd3c7]'}`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="hidden md:table-cell text-[16px] text-[#141414] border-b border-solid border-[#1111111a] align-middle px-[16px] md:px-[20px] py-[14px] group-last/row:border-none font-regular">{user.country}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={7} className="text-center py-[40px] text-[#5c5c5c]">No learner activity data available</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default LicenseUtilization;