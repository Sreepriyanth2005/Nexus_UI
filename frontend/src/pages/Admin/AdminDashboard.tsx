import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useTenantDashboard, useTenantDashboardStats } from "../../hooks/tenant";
import { getAvailableCoursesApi, getAvailableCareerPathsApi } from "../../core/api/corporate-learning.api";
import { courseApi } from "../../core/api/course/course.api";
import { getCareerPathsApi } from "../../core/api/career-path/career-path.api";
import { Icon } from "../../components/ui/Icon";
import { Breadcrumbs } from "../../components/ui/Breadcrumbs";

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [tenant, setTenant] = useState<any>(null);
  const { mutateAsync: getDashboard, isPending: loading } = useTenantDashboard();
  const { mutateAsync: getDashboardStats } = useTenantDashboardStats();

  const [metrics, setMetrics] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [recommendedItems, setRecommendedItems] = useState<any[]>([]);
  const [loadingRecommended, setLoadingRecommended] = useState<boolean>(true);
  const [isInitialLoad, setIsInitialLoad] = useState<boolean>(true);

  const loadDashboard = async () => {
    try {
      const storedUser = localStorage.getItem('keycloak_session_user');
      if (!storedUser) return;
      const parsed = JSON.parse(storedUser);
      const user = parsed?.user || parsed;
      const tenantId = user?.tenantId || user?.tenant?.id || user?.organizationId || "";

      if (!tenantId) return;
      const data = await getDashboard(tenantId);
      const statsData = await getDashboardStats({ tenantId });

      setTenant(data?.tenant || {});
      setStats(statsData);
      setMetrics({
        totalUsers: statsData?.overview?.totalUsers || data?.users?.totalUsers || 0,
        activeUsers: statsData?.overview?.activeUsers || data?.users?.activeUsers || 0,
        inactiveUsers: data?.users?.inactiveUsers || 0,
        totalEnrolments: statsData?.overview?.totalEnrollments || 0,
        completionRate: statsData?.overview?.completionRate || 0,
        inProgressRate: statsData?.overview?.inProgressRate || 0,
        notStartedRate: statsData?.overview?.notStartedRate || 0,
        mandatoryComplianceRate: statsData?.overview?.mandatoryComplianceRate || 0,
        learningHours: statsData?.overview?.learningHours || 0,
      });

      // Fetch Real Published Courses and Career Paths from Backend
      setLoadingRecommended(true);
      try {
        let coursesList: any[] = [];
        let careerPathsList: any[] = [];

        if (tenantId) {
          try {
            const [availCourses, availPaths] = await Promise.all([
              getAvailableCoursesApi(tenantId, { status: "PUBLISHED", limit: 8 }).catch(() => []),
              getAvailableCareerPathsApi(tenantId, { status: "PUBLISHED", limit: 8 }).catch(() => []),
            ]);
            if (Array.isArray(availCourses) && availCourses.length > 0) {
              coursesList = availCourses;
            }
            if (Array.isArray(availPaths) && availPaths.length > 0) {
              careerPathsList = availPaths;
            }
          } catch (e) {
            console.warn("Could not fetch available tenant learning:", e);
          }
        }

        // Fallback to published catalog courses if needed
        if (coursesList.length === 0) {
          try {
            const res = await courseApi.list({ status: "PUBLISHED", limit: 8, isStandalone: true } as any);
            const items = Array.isArray(res?.data)
              ? res.data
              : Array.isArray((res as any)?.data?.data)
              ? (res as any).data.data
              : [];
            coursesList = items;
          } catch (e) {
            console.warn("Could not fetch published courses fallback:", e);
          }
        }

        // Fallback to published career paths if needed
        if (careerPathsList.length === 0) {
          try {
            const res = await getCareerPathsApi({ status: "PUBLISHED", limit: 8 });
            const items = Array.isArray(res?.data)
              ? res.data
              : Array.isArray((res as any)?.data?.data)
              ? (res as any).data.data
              : [];
            careerPathsList = items;
          } catch (e) {
            console.warn("Could not fetch published career paths fallback:", e);
          }
        }

        // STRICTLY enforce status === 'PUBLISHED'
        const publishedCourses = coursesList
          .filter((c: any) => c && String(c.status || "").toUpperCase() === "PUBLISHED")
          .map((c: any) => ({ ...c, itemType: "COURSE" }));

        const publishedPaths = careerPathsList
          .filter((cp: any) => cp && String(cp.status || "").toUpperCase() === "PUBLISHED")
          .map((cp: any) => ({ ...cp, itemType: "CAREER_PATH" }));

        // Interleave published courses and career paths
        const combined: any[] = [];
        const maxLen = Math.max(publishedCourses.length, publishedPaths.length);
        for (let i = 0; i < maxLen; i++) {
          if (i < publishedCourses.length) combined.push(publishedCourses[i]);
          if (i < publishedPaths.length) combined.push(publishedPaths[i]);
        }

        setRecommendedItems(combined);
      } catch (err) {
        console.error("Failed to load recommended learning:", err);
      } finally {
        setLoadingRecommended(false);
      }
    } catch (error) {
      console.error("Dashboard Error:", error);
    } finally {
      setIsInitialLoad(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  if (loading || isInitialLoad) {
    return (
      <main className="pr-[16px] sm:pr-[24px] lg:pr-[28px] overflow-y-auto relative font-sans text-[#141414] w-full bg-white animate-pulse pt-[20px]">
        <div className="flex flex-col">
          {/* Page Head Skeleton */}
          <div className="flex flex-wrap justify-between items-start gap-[16px] mb-[24px]">
            <div>
              <div className="h-3 bg-gray-200 rounded w-[200px] mb-[6px]"></div>
              <div className="h-7 bg-gray-200 rounded w-[300px] mb-[6px]"></div>
              <div className="h-4 bg-gray-200 rounded w-[250px]"></div>
            </div>
            <div className="flex flex-wrap items-center gap-[10px]">
              <div className="h-[40px] bg-gray-200 rounded-full w-[80px]"></div>
              <div className="h-[40px] bg-gray-200 rounded-full w-[120px]"></div>
            </div>
          </div>

          {/* KPI Strip Skeleton */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-[14px] mb-[24px]">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="bg-white border border-[#1111111a] rounded-[14px] p-[20px] px-[22px] h-[130px]">
                <div className="w-[40px] h-[40px] rounded-[12px] bg-gray-200 mb-[14px]"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-[8px]"></div>
                <div className="h-6 bg-gray-200 rounded w-1/3"></div>
              </div>
            ))}
          </div>

          {/* Charts Row Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-[16px] mb-[20px]">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white border border-[#1111111a] rounded-[14px] p-[20px] h-[220px]">
                <div className="h-5 bg-gray-200 rounded w-1/2 mb-[20px]"></div>
                <div className="h-4 bg-gray-200 rounded w-full mb-[12px]"></div>
                <div className="h-4 bg-gray-200 rounded w-4/5 mb-[12px]"></div>
                <div className="h-4 bg-gray-200 rounded w-full mb-[12px]"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-[12px]"></div>
              </div>
            ))}
          </div>

          {/* Body Split Skeleton */}
          <div className="flex flex-col gap-[20px]">
            <div className="bg-white border border-[#1111111a] rounded-[14px] p-[20px] h-[300px]">
              <div className="h-5 bg-gray-200 rounded w-[200px] mb-[20px]"></div>
              <div className="h-10 bg-gray-200 rounded w-full mb-[10px]"></div>
              <div className="h-10 bg-gray-200 rounded w-full mb-[10px]"></div>
              <div className="h-10 bg-gray-200 rounded w-full mb-[10px]"></div>
              <div className="h-10 bg-gray-200 rounded w-full mb-[10px]"></div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // Fallback for mocked data if API fails to load anything
  const totalUsers = metrics?.totalUsers || 0;
  const activeUsers = metrics?.activeUsers || 0;
  const totalEnrolments = metrics?.totalEnrolments || 0;
  const completionRate = metrics?.completionRate || 0;
  const inProgressRate = metrics?.inProgressRate || 0;
  const notStartedRate = metrics?.notStartedRate || 0;
  const mandatoryComplianceRate = metrics?.mandatoryComplianceRate || 0;
  const learningHours = metrics?.learningHours || 0;

  const CHART_COLORS = ['#7e9b6f', '#c99b2e', '#b8654e', '#5c5c5c', '#141414'];
  const topCourses = stats?.topCourses || [];
  const maxEnrolment = topCourses.length > 0 ? topCourses[0].enrolled : 1;

  // Chart calculations
  const DONUT_CIRCUMFERENCE = 251.327;
  const completedLen = (completionRate / 100) * DONUT_CIRCUMFERENCE;
  const inProgressLen = (inProgressRate / 100) * DONUT_CIRCUMFERENCE;
  const notStartedLen = (notStartedRate / 100) * DONUT_CIRCUMFERENCE;
  const inProgressOffset = -completedLen;
  const notStartedOffset = -(completedLen + inProgressLen);

  const GAUGE_LENGTH = 219.911;
  const gaugeFillLen = (mandatoryComplianceRate / 100) * GAUGE_LENGTH;

  const complianceStatus = mandatoryComplianceRate >= 80 ? "PASS" : mandatoryComplianceRate >= 50 ? "WARNING" : "FAIL";
  const complianceStatusColor = complianceStatus === "PASS" ? "bg-[#eef3eb] text-[#7e9b6f]" : complianceStatus === "WARNING" ? "bg-[#fdf5e6] text-[#c99b2e]" : "bg-[#f6ebe8] text-[#b8654e]";

  const tenantName = tenant?.name || "Corporate Tenant";
  const industry = tenant?.industry?.name || "General";

  return (
    <main className="pr-[16px] sm:pr-[24px] lg:pr-[28px] overflow-y-auto relative font-sans text-[#141414] w-full bg-white">
      <div className="flex flex-col">



        {/* Page Head */}
        <div className="flex flex-wrap justify-between items-start gap-[16px] mb-[24px]">
          <div>
            <div className="text-[12px] tracking-[0.12em] uppercase text-[#5c5c5c] font-bold mb-[6px]">
              Corporate · Tenant view · {industry}
            </div>
            <h1 className="text-[24px] tracking-[-0.02em] text-[#141414] font-[800] leading-[1.2] m-0 mb-[6px]">
              {tenantName} · Nexus Corporate
            </h1>
            <p className="text-[14px] text-[#5c5c5c] m-0">
              {activeUsers} active learners last 30 days &nbsp;·&nbsp; Industry: <strong className="font-semibold text-[#141414]">{industry}</strong>
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-[10px]">
            <button className="rounded-full font-bold inline-flex items-center gap-[8px] bg-white border border-[#1111111a] hover:border-[#11111129] hover:bg-[#f6f6f4] py-[8px] px-[14px] text-[14px] transition-colors cursor-pointer" onClick={() => navigate("/create-tenant-user")}>
              <Icon size={14}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              </Icon>
              Invite
            </button>
            <button className="rounded-full font-bold inline-flex items-center gap-[8px] bg-[#fcf7ae] border border-[#c99b2e] text-[#141414] hover:bg-[#edd79a] py-[8px] px-[14px] text-[14px] transition-colors cursor-pointer" onClick={() => navigate("/course-assignment")}>
              Assign course
            </button>
          </div>
        </div>

        {/* KPI Strip */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-[14px] mb-[24px]">
          {/* Total users */}
          <div className="bg-white border border-[#1111111a] rounded-[14px] p-[20px] px-[22px] cursor-pointer hover:border-[#11111129] hover:-translate-y-[2px] shadow-[0_4px_12px_-4px_#2a110814] transition-all">
            <div className="w-[40px] h-[40px] rounded-[12px] flex items-center justify-center mb-[14px] bg-[#fdf5e6] text-[#c99b2e]">
              <Icon size={20}>
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </Icon>
            </div>
            <div className="text-[12px] tracking-[0.1em] uppercase text-[#5c5c5c] font-bold mb-[8px]">Total users</div>
            <div className="text-[24px] tracking-[-0.03em] font-[800] leading-none mb-[4px]">{totalUsers}</div>
          </div>

          {/* Active users */}
          <div className="bg-white border border-[#1111111a] rounded-[14px] p-[20px] px-[22px] cursor-pointer hover:border-[#11111129] hover:-translate-y-[2px] shadow-[0_4px_12px_-4px_#2a110814] transition-all">
            <div className="w-[40px] h-[40px] rounded-[12px] flex items-center justify-center mb-[14px] bg-[#eef3eb] text-[#7e9b6f]">
              <Icon size={20}>
                <polyline points="20 6 9 17 4 12"></polyline>
              </Icon>
            </div>
            <div className="text-[12px] tracking-[0.1em] uppercase text-[#5c5c5c] font-bold mb-[8px]">Active (30d)</div>
            <div className="text-[24px] tracking-[-0.03em] font-[800] leading-none mb-[4px]">{activeUsers}</div>
          </div>

          {/* Total enrolments */}
          <div className="bg-white border border-[#1111111a] rounded-[14px] p-[20px] px-[22px] cursor-pointer hover:border-[#11111129] hover:-translate-y-[2px] shadow-[0_4px_12px_-4px_#2a110814] transition-all">
            <div className="w-[40px] h-[40px] rounded-[12px] flex items-center justify-center mb-[14px] bg-[#fdf5e6] text-[#c99b2e]">
              <Icon size={20}>
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
              </Icon>
            </div>
            <div className="text-[12px] tracking-[0.1em] uppercase text-[#5c5c5c] font-bold mb-[8px]">Total enrolments</div>
            <div className="text-[24px] tracking-[-0.03em] font-[800] leading-none mb-[4px]">{totalEnrolments}</div>
          </div>

          {/* Completion */}
          <div className="bg-white border border-[#1111111a] rounded-[14px] p-[20px] px-[22px] cursor-pointer hover:border-[#11111129] hover:-translate-y-[2px] shadow-[0_4px_12px_-4px_#2a110814] transition-all">
            <div className="w-[40px] h-[40px] rounded-[12px] flex items-center justify-center mb-[14px] bg-[#f6ebe8] text-[#b8654e]">
              <Icon size={20}>
                <circle cx="12" cy="8" r="6"></circle>
                <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"></path>
              </Icon>
            </div>
            <div className="text-[12px] tracking-[0.1em] uppercase text-[#5c5c5c] font-bold mb-[8px]">Completion</div>
            <div className="text-[24px] tracking-[-0.03em] font-[800] leading-none mb-[4px]">{completionRate}<span className="font-[800]">%</span></div>
          </div>

          {/* Learning Hours */}
          <div className="bg-white border border-[#1111111a] rounded-[14px] p-[20px] px-[22px] cursor-pointer hover:border-[#11111129] hover:-translate-y-[2px] shadow-[0_4px_12px_-4px_#2a110814] transition-all">
            <div className="w-[40px] h-[40px] rounded-[12px] flex items-center justify-center mb-[14px] bg-[#eef3eb] text-[#7e9b6f]">
              <Icon size={20}>
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </Icon>
            </div>
            <div className="text-[12px] tracking-[0.1em] uppercase text-[#5c5c5c] font-bold mb-[8px]">Learning Hours</div>
            <div className="text-[24px] tracking-[-0.03em] font-[800] leading-none mb-[4px]">{learningHours}</div>
          </div>


        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-[16px] mb-[20px]">

          {/* Bar Chart Card */}
          <div className="bg-white border border-[#1111111a] rounded-[14px] shadow-[0_4px_12px_-4px_#2a110814] hover:-translate-y-[2px] hover:border-[#11111129] cursor-pointer transition-all">
            <div className="flex justify-between items-center pt-[18px] px-[22px] pb-[0px] mb-[14px]">
              <div className="text-[16px] text-[#141414] font-[800] tracking-[-0.01em]">Enrolments by content</div>
            </div>
            <div className="pt-[4px] px-[20px] pb-[18px]">
              {topCourses.length > 0 ? (
                topCourses.map((course: any, idx: number) => {
                  const widthPercent = Math.max((course.enrolled / maxEnrolment) * 100, 2);
                  const color = CHART_COLORS[idx % CHART_COLORS.length];
                  return (
                    <div key={course.courseId} className="flex items-center gap-[10px] mb-[10px]">
                      <span className="w-[110px] text-[14px] text-[#3a3a3a] overflow-hidden whitespace-nowrap text-ellipsis" title={course.title}>
                        {course.title}
                      </span>
                      <div className="flex-1 h-[10px] bg-[#eeeeea] rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${widthPercent}%`, backgroundColor: color }}></div>
                      </div>
                      <span className="w-[26px] text-right font-bold tabular-nums">{course.enrolled}</span>
                    </div>
                  );
                })
              ) : (
                <div className="text-[14px] text-[#5c5c5c] italic py-[10px]">No enrolment data available.</div>
              )}
            </div>
          </div>

          {/* Donut Card */}
          <div className="bg-white border border-[#1111111a] rounded-[14px] shadow-[0_4px_12px_-4px_#2a110814] hover:-translate-y-[2px] hover:border-[#11111129] cursor-pointer transition-all">
            <div className="flex justify-between items-center pt-[18px] px-[22px] pb-[0px] mb-[14px]">
              <div className="text-[16px] text-[#141414] font-[800] tracking-[-0.01em]">Completion breakdown</div>
            </div>
            <div className="flex items-center gap-[40px] pt-[10px] px-[24px] pb-[20px]">
              <div className="shrink-0">
                <svg width="130" height="130" viewBox="0 0 130 130" aria-label={`Completion donut chart: ${completionRate}% complete`}>
                  <circle cx="65" cy="65" r="40" fill="none" strokeWidth="20" style={{ stroke: '#eeeeea' }}></circle>
                  <circle cx="65" cy="65" r="40" fill="none" strokeWidth="20" strokeDasharray={`${completedLen} ${DONUT_CIRCUMFERENCE - completedLen}`} strokeDashoffset="0" transform="rotate(-90 65 65)" style={{ stroke: '#7e9b6f' }}></circle>
                  <circle cx="65" cy="65" r="40" fill="none" strokeWidth="20" strokeDasharray={`${inProgressLen} ${DONUT_CIRCUMFERENCE - inProgressLen}`} strokeDashoffset={inProgressOffset} transform="rotate(-90 65 65)" style={{ stroke: '#c99b2e' }}></circle>
                  <circle cx="65" cy="65" r="40" fill="none" strokeWidth="20" strokeDasharray={`${notStartedLen} ${DONUT_CIRCUMFERENCE - notStartedLen}`} strokeDashoffset={notStartedOffset} transform="rotate(-90 65 65)" style={{ stroke: '#3a3a3a' }}></circle>
                  <text x="65" y="61" textAnchor="middle" fontSize="18" fontWeight="700" style={{ fill: '#141414', fontFamily: 'Switzer, sans-serif' }}>{completionRate}%</text>
                  <text x="65" y="76" textAnchor="middle" fontSize="9" fontWeight="600" letterSpacing="0.08em" style={{ fill: '#5c5c5c', fontFamily: 'Barlow, sans-serif' }}>DONE</text>
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-[8px] text-[14px] mb-[7px]">
                  <span className="w-[10px] h-[10px] rounded-full bg-[#7e9b6f]"></span>
                  Course completed ({completionRate}%)
                </div>
                <div className="flex items-center gap-[8px] text-[14px] mb-[7px]">
                  <span className="w-[10px] h-[10px] rounded-full bg-[#c99b2e]"></span>
                  In progress ({inProgressRate}%)
                </div>
                <div className="flex items-center gap-[8px] text-[14px] mb-[7px]">
                  <span className="w-[10px] h-[10px] rounded-full bg-[#3a3a3a]"></span>
                  Not started ({notStartedRate}%)
                </div>
              </div>
            </div>
          </div>

          {/* Gauge Card */}
          <div className="bg-white border border-[#1111111a] rounded-[14px] shadow-[0_4px_12px_-4px_#2a110814] hover:-translate-y-[2px] hover:border-[#11111129] cursor-pointer transition-all">
            <div className="flex justify-between items-center pt-[18px] px-[22px] pb-[0px] mb-[14px]">
              <div className="text-[16px] text-[#141414] font-[800] tracking-[-0.01em]">Compliance score</div>
            </div>
            <div className="flex flex-col items-center gap-[10px] pt-[16px] px-[20px] pb-[18px]">
              <svg width="160" height="90" viewBox="0 0 160 90" aria-label={`Compliance score gauge: ${mandatoryComplianceRate} out of 100`}>
                <path d="M 10 80 A 70 70 0 0 1 150 80" fill="none" strokeWidth="16" strokeLinecap="round" style={{ stroke: '#eeeeea' }}></path>
                <path d="M 10 80 A 70 70 0 0 1 150 80" fill="none" strokeWidth="16" strokeLinecap="round" strokeDasharray={`${gaugeFillLen} ${GAUGE_LENGTH - gaugeFillLen}`} strokeDashoffset="0" style={{ stroke: complianceStatus === "FAIL" ? '#b8654e' : complianceStatus === "WARNING" ? '#c99b2e' : '#7e9b6f' }}></path>
                <text x="80" y="72" textAnchor="middle" fontSize="26" fontWeight="700" style={{ fill: '#141414', fontFamily: 'Switzer, sans-serif' }}>{mandatoryComplianceRate}</text>
              </svg>
              <div className="text-[12px] tracking-[0.1em] uppercase font-bold text-[#5c5c5c]">Compliance score</div>
              <div className={`${complianceStatusColor} rounded-full px-[10px] py-[3px] font-bold uppercase text-[14px]`}>{complianceStatus}</div>
            </div>
          </div>
        </div>

        {/* Body Split */}
        <div className="flex flex-col gap-[20px]">

          {/* Main Content (Full Width) */}
          <div className="flex flex-col gap-[20px]">
            {/* Top courses table */}
            <div className="bg-white border border-[#1111111a] rounded-[14px] shadow-[0_4px_12px_-4px_#2a110814] hover:-translate-y-[2px] hover:border-[#11111129] transition-all">
              <div className="flex justify-between items-center pt-[18px] px-[22px] pb-[0px] mb-[14px]">
                <div className="text-[16px] text-[#141414] font-[800] tracking-[-0.01em] flex items-center">
                  <Icon size={14} className="mr-[6px] align-middle">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                  </Icon>
                  Top courses · {tenantName}
                </div>
                <a href="/admin/reports" onClick={(e) => { e.preventDefault(); navigate('/admin/reports'); }} className="text-[14px] text-[#5c5c5c] font-semibold inline-flex items-center gap-[5px] hover:text-[#141414] transition-colors cursor-pointer">
                  View report
                  <Icon size={13}>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                  </Icon>
                </a>
              </div>
              <div className="overflow-x-auto w-full pb-[10px]">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="text-left text-[12px] tracking-[0.08em] uppercase text-[#5c5c5c] border-b border-[#1111111a] pt-[0] px-[22px] pb-[10px] font-bold">Course</th>
                      <th className="text-left text-[12px] tracking-[0.08em] uppercase text-[#5c5c5c] border-b border-[#1111111a] pt-[0] px-[22px] pb-[10px] font-bold">Enrolled</th>
                      <th className="text-left text-[12px] tracking-[0.08em] uppercase text-[#5c5c5c] border-b border-[#1111111a] pt-[0] px-[22px] pb-[10px] font-bold">Completed</th>
                      <th className="text-left text-[12px] tracking-[0.08em] uppercase text-[#5c5c5c] border-b border-[#1111111a] pt-[0] px-[22px] pb-[10px] font-bold">Avg time</th>
                      <th className="text-left text-[12px] tracking-[0.08em] uppercase text-[#5c5c5c] border-b border-[#1111111a] pt-[0] px-[22px] pb-[10px] font-bold">Pass rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topCourses && topCourses.length > 0 ? (
                      topCourses.map((course: any, idx: number) => {
                        const passRate = course.enrolled ? Math.round((course.completed / course.enrolled) * 100) : 0;
                        return (
                          <tr key={idx}>
                            <td className="py-[12px] px-[22px] border-b border-[#1111111a] text-[#141414] text-[15px] font-semibold">{course.title}</td>
                            <td className="py-[12px] px-[22px] border-b border-[#1111111a] text-[#141414] text-[15px]">{course.enrolled}</td>
                            <td className="py-[12px] px-[22px] border-b border-[#1111111a] text-[#141414] text-[15px]">{course.completed} ({passRate}%)</td>
                            <td className="py-[12px] px-[22px] border-b border-[#1111111a] text-[#141414] text-[15px]">{course.avgTime || "-"}</td>
                            <td className="py-[12px] px-[22px] border-b border-[#1111111a] text-[#141414] text-[15px]">{passRate}%</td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-[12px] px-[22px] text-center text-[#5c5c5c] text-[14px]">No course data available</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Grid 2 (Performers / Activity) */}
            <div className="grid grid-cols-1 gap-[16px]">


              {/* Recent Activity */}
              <div className="bg-white border border-[#1111111a] rounded-[14px] shadow-[0_4px_12px_-4px_#2a110814] hover:-translate-y-[2px] hover:border-[#11111129] transition-all">
                <div className="flex justify-between items-center pt-[18px] px-[22px] pb-[0px] mb-[14px]">
                  <div className="text-[16px] text-[#141414] font-[800] tracking-[-0.01em]">Recent activity</div>
                </div>

                {stats?.recentActivity?.length > 0 ? (
                  stats.recentActivity.slice(0, 5).map((activity: any, idx: number) => {
                    let actionStr = activity.action || "";
                    let actionLower = actionStr.toLowerCase();

                    let actionText = activity.reason || actionStr.replace(/_/g, ' ');
                    actionText = actionText.charAt(0).toUpperCase() + actionText.slice(1);

                    let detailsText = "";
                    let iconBg = "bg-[#f6f6f6]";
                    let iconColor = "text-[#6b7280]";
                    let ActivityIcon = (
                      <>
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="16" x2="12" y2="12"></line>
                        <line x1="12" y1="8" x2="12.01" y2="8"></line>
                      </>
                    );

                    // Time ago logic
                    const diff = Date.now() - new Date(activity.createdAt).getTime();
                    const hours = Math.floor(diff / (1000 * 60 * 60));
                    const timeAgo = hours < 24 ? `${Math.max(1, hours)}H` : `${Math.floor(hours / 24)}D`;

                    if (actionLower.includes("department")) {
                      actionText = activity.reason || 'Department modified';
                      detailsText = activity.details?.name ? `Department ${activity.details.name}` : 'Tenant organisation';
                      iconBg = "bg-[#f5f3ff]";
                      iconColor = "text-[#8b5cf6]";
                      ActivityIcon = (
                        <>
                          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                          <circle cx="9" cy="7" r="4"></circle>
                          <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                          <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                        </>
                      );
                    } else if (actionLower.includes("course_completed") || actionLower.includes("completed")) {
                      actionText = activity.reason || (activity.details?.courseTitle ? `${activity.details.courseTitle} completed` : 'Course completed');
                      detailsText = activity.details?.userName ? `Learner: ${activity.details.userName}${activity.details?.score ? ` · Score ${activity.details.score}%` : ''}` : 'Course completed';
                      iconBg = "bg-[#eef3eb]";
                      iconColor = "text-[#7e9b6f]";
                      ActivityIcon = <polyline points="20 6 9 17 4 12"></polyline>;
                    } else if (actionLower.includes("assigned")) {
                      actionText = activity.reason || (activity.details?.courseTitle ? `${activity.details.courseTitle} assigned` : 'Assignment distributed');
                      detailsText = activity.details?.team ? `Audience: ${activity.details.team}` : 'Assigned learning';
                      iconBg = "bg-[#fdf5e6]";
                      iconColor = "text-[#c99b2e]";
                      ActivityIcon = <rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect>;
                    } else if (actionLower.includes("invited")) {
                      actionText = activity.reason || 'Learner invited';
                      detailsText = activity.details?.userName ? `Sent to: ${activity.details.userName}` : 'Invitation sent';
                      iconBg = "bg-[#fdf5e6]";
                      iconColor = "text-[#c99b2e]";
                      ActivityIcon = (
                        <>
                          <line x1="12" y1="5" x2="12" y2="19"></line>
                          <line x1="5" y1="12" x2="19" y2="12"></line>
                        </>
                      );
                    } else if (actionLower.includes("user_created") || actionLower.includes("user")) {
                      const roleDisplay = activity.details?.role ? activity.details.role.charAt(0).toUpperCase() + activity.details.role.slice(1).toLowerCase() : 'Learner';
                      actionText = activity.reason || `New ${roleDisplay.toLowerCase()} joined`;
                      detailsText = activity.details?.userName ? `${roleDisplay}: ${activity.details.userName}` : 'New tenant user';
                      iconBg = "bg-[#fdf5e6]";
                      iconColor = "text-[#c99b2e]";
                      ActivityIcon = (
                        <>
                          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                          <circle cx="9" cy="7" r="4"></circle>
                        </>
                      );
                    } else if (actionLower.includes("certified") || actionLower.includes("certificate")) {
                      actionText = activity.reason || (activity.details?.courseTitle ? `${activity.details.courseTitle} certified` : 'Certificate issued');
                      detailsText = activity.details?.userName ? `Learner: ${activity.details.userName}` : 'Credential issued';
                      iconBg = "bg-[#eef3eb]";
                      iconColor = "text-[#7e9b6f]";
                      ActivityIcon = <circle cx="12" cy="8" r="7"></circle>;
                    } else {
                      actionText = activity.reason || actionText;
                      detailsText = typeof activity.details === 'string' ? activity.details : (activity.details?.userName || activity.details?.courseTitle || '');
                    }

                    return (
                      <div key={idx} className="flex items-center gap-[16px] py-[16px] px-[20px] border-b border-[#1111111a] last:border-0 hover:bg-[#f6f6f4] transition-colors cursor-pointer">
                        <div className={`w-[36px] h-[36px] rounded-full flex items-center justify-center shrink-0 ${iconBg} ${iconColor}`}>
                          <Icon size={16}>{ActivityIcon}</Icon>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[16px] text-[#141414] font-semibold leading-tight truncate">{actionText}</div>
                          {detailsText && <div className="text-[14px] text-[#5c5c5c] mt-[4px] truncate">{detailsText}</div>}
                        </div>
                        <span className="text-[12px] tracking-[0.04em] uppercase text-[#5c5c5c] font-bold shrink-0">
                          {timeAgo}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-8 text-center text-sm text-gray-400">
                    No recent activity for this tenant yet.
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* Recommended Learning Strip */}
        <div className="bg-white border border-[#1111111a] rounded-[14px] shadow-[0_4px_12px_-4px_#2a110814] mt-[20px] mb-[40px] hover:-translate-y-[2px] hover:border-[#11111129] transition-all">
          <div className="flex flex-wrap justify-between items-center pt-[18px] px-[22px] pb-[0px] mb-[14px] gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="text-[16px] text-[#141414] font-[800] tracking-[-0.01em] flex items-center">
                <Icon size={14} className="mr-[6px] align-middle">
                  <line x1="18" y1="20" x2="18" y2="10"></line>
                  <line x1="12" y1="20" x2="12" y2="4"></line>
                  <line x1="6" y1="20" x2="6" y2="14"></line>
                </Icon>
                Recommended courses
              </div>
            </div>

            <a
              href="/course-assignment"
              onClick={(e) => {
                e.preventDefault();
                navigate('/course-assignment');
              }}
              className="text-[14px] text-[#5c5c5c] font-semibold inline-flex items-center gap-[5px] hover:text-[#141414] transition-colors cursor-pointer"
            >
              Assign 
              <Icon size={13}>
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </Icon>
            </a>
          </div>
          
          {loadingRecommended ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[16px] px-[16px] pb-[16px]">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="border border-[#1111111a] rounded-[10px] overflow-hidden bg-white animate-pulse flex flex-col h-[209.7px] w-full">
                  <div className="w-full h-[96px] bg-gray-200" />
                  <div className="p-[12px] px-[14px] space-y-2">
                    <div className="h-3 bg-gray-200 rounded w-1/3" />
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-[1px] bg-gray-100 my-2" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : (() => {
            const displayedItems = recommendedItems.slice(0, 4);

            if (displayedItems.length === 0) {
              return (
                <div className="p-8 text-center text-sm text-gray-400">
                  No published courses or career paths available.
                </div>
              );
            }

            return (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[16px] px-[16px] pb-[16px]">
                {displayedItems.map((item: any, idx: number) => {
                  const isCareerPath = item.itemType === "CAREER_PATH";
                  const coverImage =
                    item.thumbnailUrl ||
                    item.thumbnailAsset?.url ||
                    item.thumbnailAssetUrl ||
                    item.coverImageUrl ||
                    item.coverImageAsset?.url ||
                    null;

                  const authorName =
                    (item.authorName ||
                    (item.owner?.profile?.firstName
                      ? `${item.owner.profile.firstName} ${item.owner.profile.lastName || ""}`.trim()
                      : item.owner?.name || "")).trim() || "Nexus Academy";

                  const authorAvatar =
                    item.owner?.profile?.avatarUrl ||
                    item.owner?.avatarUrl ||
                    `https://i.pravatar.cc/80?u=${item.owner?.id || item.id || idx}`;

                  const durationStr = isCareerPath
                    ? item.estimatedDuration
                      ? `${item.estimatedDuration} hrs`
                      : item.duration
                      ? `${Math.ceil(Number(item.duration) / 60) || 1} hrs`
                      : "4 hrs"
                    : item.duration
                    ? `${item.duration} min`
                    : item.estimatedDuration
                    ? `${item.estimatedDuration} min`
                    : "30 min";

                  const difficultyStr = (item.difficulty || (isCareerPath ? "INTERMEDIATE" : "FOUNDATION")).toUpperCase();

                  const destinationUrl = isCareerPath
                    ? `/course-assignment?careerPathId=${item.id}`
                    : `/course-assignment?courseId=${item.id}`;

                  return (
                    <article
                      key={item.id || idx}
                      onClick={() => navigate(destinationUrl)}
                      className="border border-[#1111111a] rounded-[10px] overflow-hidden hover:shadow-[0_16px_40px_-12px_#2a11081f] hover:border-[#11111129] hover:-translate-y-[2px] transition-all cursor-pointer bg-white flex flex-col justify-between h-[209.7px] w-full"
                    >
                      <div>
                        <div className="relative bg-[#f6f6f6] h-[96px] w-full">
                          {coverImage && (
                            <img
                              alt={item.title}
                              src={coverImage}
                              className="w-full h-[96px] object-cover"
                              onError={(e: any) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          )}
                          <span className="absolute top-[8px] left-[8px] bg-white rounded-full px-[8px] py-[2px] text-[12px] uppercase tracking-[0.06em] font-bold shadow-sm text-[#141414]">
                            {difficultyStr}
                          </span>
                          <span className="absolute top-[8px] right-[8px] bg-[#0000007a] text-white rounded-full px-[8px] py-[2px] text-[12px] font-medium backdrop-blur-sm">
                            {durationStr}
                          </span>
                        </div>
                        <div className="p-[8px] px-[12px]">
                          <div className="flex items-center gap-[5px] text-[12px] tracking-[0.08em] uppercase text-[#5c5c5c] font-semibold mb-[4px]">
                            {isCareerPath ? (
                              <Icon size={12}>
                                <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
                                <polyline points="2 17 12 22 22 17"></polyline>
                                <polyline points="2 12 12 17 22 12"></polyline>
                              </Icon>
                            ) : (
                              <Icon size={12}>
                                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                              </Icon>
                            )}
                            {isCareerPath ? "Career Path" : "Course"}
                          </div>
                          <h3 className="text-[16px] leading-tight text-[#141414] font-bold m-0 mb-[4px] line-clamp-2" title={item.title}>
                            {item.title}
                          </h3>
                        </div>
                      </div>
                      <div className="p-[8px] px-[12px] pt-0">
                        <div className="h-[1px] bg-[#1111111a] my-[4px] mb-[6px]"></div>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-[6px] text-[14px] text-[#3a3a3a] min-w-0">
                            <div className="w-[20px] h-[20px] rounded-full bg-[#eeeeea] flex items-center justify-center text-[10px] font-bold overflow-hidden shrink-0 text-[#5c5c5c]">
                              {authorName ? authorName.charAt(0).toUpperCase() : "I"}
                            </div>
                            <span className="truncate">
                              By: <strong className="font-bold text-[#141414]">{authorName}</strong>
                            </span>
                          </div>
                          <Icon size={14} className="text-[#5c5c5c] shrink-0">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                            <circle cx="9" cy="7" r="4"></circle>
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                          </Icon>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            );
          })()}
        </div>

      </div>
    </main>
  );
};

export default AdminDashboard;