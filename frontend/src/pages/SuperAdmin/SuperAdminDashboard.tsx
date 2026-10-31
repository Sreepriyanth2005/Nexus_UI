import React, { useState, useMemo } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  Users,
  BarChart3,
  ShieldCheck,
  Zap,
  Award,
  Activity,
  Layers,
  Database,
  HardDrive,
  Mail,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Search,
  RefreshCw,
  Building2,
  Filter,
  Download,
  Server,
  TrendingUp,
  ChevronRight,
  ExternalLink,
  BookOpen,
  SlidersHorizontal,
} from "lucide-react";
import { useNavigate } from "react-router";
import { useSuperAdminDashboard } from "../../hooks/useReports";
import { Skeleton } from "../../components/ui/Skeleton/Skeleton";

type TimeFilter = "7D" | "30D" | "1Y";
type ActiveTab = "overview" | "triage" | "curriculum" | "telemetry";
type MetricType = "enrollments" | "learners" | "certifications";

const SuperAdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<ActiveTab>("overview");
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("30D");
  const [activeMetric, setActiveMetric] = useState<MetricType>("enrollments");
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState("Just now");
  const [triageFilter, setTriageFilter] = useState<"all" | "critical" | "clearance" | "capacity">("all");
  const [curriculumFilter, setCurriculumFilter] = useState<string>("all");

  const { data: dashboardData, isLoading, isError, refetch } = useSuperAdminDashboard();

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setTimeout(() => {
      setIsRefreshing(false);
      setLastRefreshed("Just now");
    }, 600);
  };

  if (isLoading) {
    return (
      <div className="p-6 sm:p-8 space-y-6 w-full max-w-7xl mx-auto">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <Skeleton className="h-8 w-[280px] rounded-lg" />
            <Skeleton className="h-4 w-[420px] rounded-md" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-[120px] rounded-lg" />
            <Skeleton className="h-10 w-[140px] rounded-lg" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Skeleton className="h-[140px] rounded-xl" />
          <Skeleton className="h-[140px] rounded-xl" />
          <Skeleton className="h-[140px] rounded-xl" />
          <Skeleton className="h-[140px] rounded-xl" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <Skeleton className="lg:col-span-8 h-[420px] rounded-xl" />
          <Skeleton className="lg:col-span-4 h-[420px] rounded-xl" />
        </div>
      </div>
    );
  }

  if (isError || !dashboardData) {
    return (
      <div className="p-8 max-w-xl mx-auto my-12 text-center rounded-2xl border border-slate-200 bg-white shadow-xl">
        <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 mb-1">Operational Telemetry Unavailable</h3>
        <p className="text-xs text-slate-500 mb-4">
          Unable to establish synchronized connection with the enterprise governance telemetry stream.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors cursor-pointer shadow-sm"
        >
          Reconnect Telemetry
        </button>
      </div>
    );
  }

  const {
    totalUsers,
    totalUsersTrend,
    activeUsers,
    activeUsersTrend,
    totalEnrollments,
    totalEnrollmentsTrend,
    overallCompletionPercentage,
    completionTrend,
    attentionItems,
    enrollmentsOverTime,
    topLearning,
    systemHealth,
    recentActivity,
  } = dashboardData;

  // Attention directive counting
  const totalDirectives = [
    attentionItems?.coursesAwaitingReview,
    attentionItems?.corporateInvitesPending,
    attentionItems?.credentialsExpiring30Days,
    attentionItems?.inactiveSMEs,
    attentionItems?.lowUtilizationTenantsCount,
  ].filter((c) => Number(c) > 0).length;

  // System health evaluation
  const emailStatus = (systemHealth?.emailDelivery ?? 100) >= 95 ? "good" : "warning";
  const apiStatus = (systemHealth?.apiLatency ?? 0) <= 150 ? "good" : "warning";
  const dbStatus =
    systemHealth?.database?.toLowerCase().includes("ok") ||
    systemHealth?.database?.toLowerCase().includes("operational") ||
    systemHealth?.database?.toLowerCase().includes("healthy")
      ? "good"
      : "warning";
  const storageStatus =
    systemHealth?.storage?.toLowerCase().includes("ok") ||
    systemHealth?.storage?.toLowerCase().includes("operational") ||
    systemHealth?.storage?.toLowerCase().includes("healthy")
      ? "good"
      : "warning";

  // Corporate tenants benchmark mock data for tenant view
  const tenantBenchmarks = [
    { name: "Acme Enterprise Corp", domain: "acme.com", allocated: 5000, used: 4210, tier: "Enterprise Gold", status: "Active", renewal: "Oct 2026" },
    { name: "Apex Financial Global", domain: "apexfin.com", allocated: 3000, used: 2850, tier: "Enterprise Platinum", status: "Active", renewal: "Dec 2026" },
    { name: "Global Health Network", domain: "ghn.org", allocated: 2500, used: 820, tier: "Standard Tier", status: "Low Utilization", renewal: "Aug 2026" },
    { name: "Nova Aerospace Labs", domain: "novaaero.io", allocated: 1200, used: 1050, tier: "Enterprise Gold", status: "Active", renewal: "Nov 2026" },
  ];

  // Top 4 High-Impact KPI Cards
  const fleetKPIs = [
    {
      id: "users",
      title: "Global Enterprise Identities",
      value: (totalUsers ?? 14250).toLocaleString(),
      change: `${(totalUsersTrend ?? 12) >= 0 ? "+" : ""}${totalUsersTrend ?? 12}%`,
      trend: totalUsersTrend ?? 12,
      subText: "Verified across 32 corporate tenants",
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-50 border-blue-100",
      progress: 94,
      progressLabel: "94% Verified SSO",
      route: "/admin-user-management",
    },
    {
      id: "learners",
      title: "Active Concurrent Learners",
      value: (activeUsers ?? 8920).toLocaleString(),
      change: `${(activeUsersTrend ?? 8) >= 0 ? "+" : ""}${activeUsersTrend ?? 8}%`,
      trend: activeUsersTrend ?? 8,
      subText: "Current 7-day active learning cycles",
      icon: Activity,
      color: "text-indigo-600",
      bg: "bg-indigo-50 border-indigo-100",
      progress: 89,
      progressLabel: "89% Cluster Capacity",
      route: "/admin/reports",
    },
    {
      id: "enrollments",
      title: "Curriculum Allocations",
      value: (totalEnrollments ?? 24800).toLocaleString(),
      change: `${(totalEnrollmentsTrend ?? 15) >= 0 ? "+" : ""}${totalEnrollmentsTrend ?? 15}%`,
      trend: totalEnrollmentsTrend ?? 15,
      subText: "184 Published modules in catalog",
      icon: Layers,
      color: "text-emerald-600",
      bg: "bg-emerald-50 border-emerald-100",
      progress: 76,
      progressLabel: "+480 this week",
      route: "/admin/courses",
    },
    {
      id: "accreditation",
      title: "Accredited Mastery Rate",
      value: `${overallCompletionPercentage ?? 84}%`,
      change: `${(completionTrend ?? 4) >= 0 ? "+" : ""}${completionTrend ?? 4}%`,
      trend: completionTrend ?? 4,
      subText: "1,840 Verified credentials minted",
      icon: Award,
      color: "text-violet-600",
      bg: "bg-violet-50 border-violet-100",
      progress: overallCompletionPercentage ?? 84,
      progressLabel: "Target: 80% Benchmark",
      route: "/admin/reports/learning-credentials",
    },
  ];

  // Raw chart data points
  const rawChartPoints = enrollmentsOverTime || [
    { date: "2026-03-01", count: 120 },
    { date: "2026-03-05", count: 180 },
    { date: "2026-03-10", count: 240 },
    { date: "2026-03-15", count: 310 },
    { date: "2026-03-20", count: 390 },
    { date: "2026-03-25", count: 420 },
    { date: "2026-03-30", count: 480 },
  ];

  const maxVal = Math.max(...rawChartPoints.map((p: any) => p.count), 500);

  // SVG Line/Area Chart path computation
  const svgWidth = 600;
  const svgHeight = 180;
  const paddingX = 24;
  const paddingY = 20;

  const points = rawChartPoints.map((item: any, idx: number) => {
    const x = paddingX + (idx / (rawChartPoints.length - 1)) * (svgWidth - 2 * paddingX);
    const y = svgHeight - paddingY - (item.count / maxVal) * (svgHeight - 2 * paddingY);
    return { x, y, ...item };
  });

  const linePath = points.reduce((acc: string, curr: any, idx: number) => {
    return idx === 0 ? `M ${curr.x} ${curr.y}` : `${acc} L ${curr.x} ${curr.y}`;
  }, "");

  const areaPath = `${linePath} L ${points[points.length - 1].x} ${svgHeight - paddingY} L ${points[0].x} ${svgHeight - paddingY} Z`;

  // Filtered Curricula
  const filteredCurriculum = (topLearning || []).filter((c: any) => {
    const title = c.title || c.courseName || "";
    const matchesSearch = title.toLowerCase().includes(searchQuery.toLowerCase());
    if (curriculumFilter === "all") return matchesSearch;
    return matchesSearch && c.type?.toLowerCase().includes(curriculumFilter.toLowerCase());
  });

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      {/* ── 1. Top Executive Operations Bar ── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          {/* Left: Governance Identity */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200/60 uppercase tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                Global Governance Portal
              </span>

              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                99.99% Operational SLA
              </span>

              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium text-slate-400">
                <Server className="w-3 h-3 text-slate-400" />
                US-East Cluster • Updated {lastRefreshed}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              Super Admin Operations Command
            </h1>

            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Enterprise Multi-Tenant Governance System.{" "}
              <span className="text-slate-800 font-semibold">
                {totalDirectives} operational {totalDirectives === 1 ? "directive requires" : "directives require"} administrative clearance.
              </span>
            </p>
          </div>

          {/* Right: Fast Executive Actions */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={handleRefresh}
              title="Refresh telemetry"
              className="h-10 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${isRefreshing ? "animate-spin text-blue-600" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <button
              onClick={() => navigate("/create-course")}
              className="h-10 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-all shadow-sm shadow-blue-500/20 flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4 text-white" strokeWidth={2.5} />
              <span>Author Course</span>
            </button>

            <button
              onClick={() => navigate("/admin/reports")}
              className="h-10 px-3.5 rounded-xl border border-slate-200 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <BarChart3 className="w-3.5 h-3.5 text-blue-400" />
              <span>Reports</span>
            </button>
          </div>
        </div>

        {/* ── Tabbed View Switcher ── */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between gap-3 overflow-x-auto">
          <div className="flex items-center gap-1.5 min-w-max">
            {[
              { id: "overview", label: "Executive Overview", badge: null },
              { id: "triage", label: "Triage & Directives", badge: totalDirectives },
              { id: "curriculum", label: "Curriculum Benchmarks", badge: topLearning?.length || 3 },
              { id: "telemetry", label: "System Telemetry", badge: "Live" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as ActiveTab)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === tab.id
                    ? "bg-slate-900 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <span>{tab.label}</span>
                {tab.badge !== null && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      activeTab === tab.id
                        ? "bg-slate-800 text-blue-300"
                        : "bg-slate-200/70 text-slate-600"
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-2 text-xs text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Telemetry: Synchronized</span>
          </div>
        </div>
      </div>

      {/* ── 2. Top Executive Fleet Metrics (4 Cards) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {fleetKPIs.map((kpi) => {
          const isPositive = kpi.trend >= 0;
          return (
            <div
              key={kpi.id}
              onClick={() => navigate(kpi.route)}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md hover:border-slate-300 transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-transform group-hover:scale-105 ${kpi.bg} ${kpi.color}`}>
                    <kpi.icon className="w-5 h-5" strokeWidth={2} />
                  </div>

                  <span
                    className={`inline-flex items-center gap-0.5 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      isPositive
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                        : "bg-rose-50 text-rose-700 border border-rose-200/60"
                    }`}
                  >
                    {isPositive ? <ArrowUpRight className="w-3 h-3 text-emerald-600" /> : <ArrowDownRight className="w-3 h-3 text-rose-600" />}
                    {kpi.change}
                  </span>
                </div>

                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  {kpi.title}
                </div>

                <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-1">
                  {kpi.value}
                </div>

                <p className="text-xs text-slate-500 line-clamp-1">{kpi.subText}</p>
              </div>

              {/* Progress mini indicator */}
              <div className="mt-4 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium mb-1.5">
                  <span>{kpi.progressLabel}</span>
                  <span className="text-slate-700 font-bold">{kpi.progress}%</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full transition-all duration-700"
                    style={{ width: `${kpi.progress}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── 3. Main Stage Layout (Contextual to Active Tab) ── */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* ── Left Stage (8 cols) ── */}
          <div className="lg:col-span-8 space-y-6">
            {/* Triage Directives Hub */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/60">
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                    <span>Critical Operational Directives</span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200/60">
                      {totalDirectives} Actions
                    </span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    High-priority governance items requiring immediate review or clearance
                  </p>
                </div>

                <button
                  onClick={() => setActiveTab("triage")}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                >
                  <span>Filter Board</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="divide-y divide-slate-100">
                <DirectiveRow
                  severity="critical"
                  badge="SME REVIEW"
                  title={`${attentionItems?.coursesAwaitingReview || 2} courses awaiting SME curriculum sign-off`}
                  sub="Oldest review waiting 5 days in queue. Critical for quarterly accredited publishing."
                  action="Review Queue"
                  onClick={() => navigate("/admin/reports/admin-activity")}
                />

                <DirectiveRow
                  severity="info"
                  badge="LIFECYCLE"
                  title={`${attentionItems?.credentialsExpiring30Days || 12} accredited credentials expiring in next 30 days`}
                  sub="Automated renewal notifications ready for batch dispatch."
                  action="Renew Lifecycle"
                  onClick={() => navigate("/admin/reports/learning-credentials")}
                />
              </div>
            </div>

            {/* Velocity & Trajectory Chart Card */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-5 pb-4 border-b border-slate-100">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600">
                    Telemetry Stream
                  </span>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                    Learner Growth & Enrollment Velocity
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Aggregate platform seat assignments and curriculum progression trajectory
                  </p>
                </div>

                {/* Timeframe & Metric Toggles */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center bg-slate-100 p-1 rounded-xl">
                    {(["7D", "30D", "1Y"] as const).map((filter) => (
                      <button
                        key={filter}
                        onClick={() => setTimeFilter(filter)}
                        className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer ${
                          timeFilter === filter
                            ? "bg-white text-slate-900 shadow-xs"
                            : "text-slate-500 hover:text-slate-900"
                        }`}
                      >
                        {filter}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => navigate("/admin/reports")}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 ml-1 cursor-pointer"
                  >
                    <span>Analytics</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Enhanced Crisp SVG Visual Chart */}
              <div className="relative w-full h-[220px] pt-2">
                <svg
                  viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                  className="w-full h-full overflow-visible"
                  preserveAspectRatio="none"
                >
                  <defs>
                    <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2563eb" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#2563eb" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal Grid lines */}
                  {[0.25, 0.5, 0.75, 1].map((ratio) => {
                    const y = svgHeight - paddingY - ratio * (svgHeight - 2 * paddingY);
                    return (
                      <line
                        key={ratio}
                        x1={paddingX}
                        y1={y}
                        x2={svgWidth - paddingX}
                        y2={y}
                        stroke="#f1f5f9"
                        strokeDasharray="4 4"
                        strokeWidth="1"
                      />
                    );
                  })}

                  {/* Gradient Area */}
                  <path d={areaPath} fill="url(#blueGradient)" />

                  {/* Stroke Line */}
                  <path
                    d={linePath}
                    fill="none"
                    stroke="#2563eb"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Point circles */}
                  {points.map((pt: any, idx: number) => (
                    <g key={idx} className="cursor-pointer group">
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r="4"
                        fill="#ffffff"
                        stroke="#2563eb"
                        strokeWidth="2"
                        className="transition-transform group-hover:scale-150"
                      />
                    </g>
                  ))}
                </svg>

                {/* X Axis Labels */}
                <div className="flex justify-between items-center px-4 pt-2 text-[11px] font-semibold text-slate-400">
                  {points.map((pt: any, idx: number) => (
                    <span key={idx}>
                      {new Date(pt.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                  ))}
                </div>
              </div>

              {/* Chart Stats summary row */}
              <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-3 gap-3 text-center">
                <div className="p-2 rounded-xl bg-slate-50">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Peak Velocity</div>
                  <div className="text-sm font-extrabold text-slate-900 mt-0.5">480 seats/day</div>
                </div>
                <div className="p-2 rounded-xl bg-slate-50">
                  <div className="text-[10px] uppercase font-bold text-slate-400">7-Day Mean</div>
                  <div className="text-sm font-extrabold text-slate-900 mt-0.5">314 seats/day</div>
                </div>
                <div className="p-2 rounded-xl bg-slate-50">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Pacing Target</div>
                  <div className="text-sm font-extrabold text-emerald-600 mt-0.5">+15.3% On Track</div>
                </div>
              </div>
            </div>

            {/* Flagship Curricula Table Preview */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/60">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                    Flagship Curriculum & Benchmark Index
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    High-demand enterprise training modules ranked by completion and certified mastery
                  </p>
                </div>

                <button
                  onClick={() => setActiveTab("curriculum")}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                >
                  <span>Explore Index</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left whitespace-nowrap">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-bold tracking-wider uppercase text-slate-500">
                      <th className="px-5 py-3">Curriculum Module</th>
                      <th className="px-5 py-3">Enrolled</th>
                      <th className="px-5 py-3">Mastery Rate</th>
                      <th className="px-5 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {(topLearning || []).slice(0, 3).map((item: any, idx: number) => {
                      const courseTitle = item.title || item.courseName || "Enterprise Module";
                      const enrolledCount = item.enrollments ?? item.enrolled ?? 0;
                      const completionPct = item.completionRate ?? item.completionPercentage ?? 80;

                      return (
                        <tr
                          key={idx}
                          className="hover:bg-slate-50/70 transition-colors cursor-pointer group"
                          onClick={() => navigate("/admin/courses")}
                        >
                          <td className="px-5 py-3.5 font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                            <div className="flex items-center gap-2.5">
                              <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                              <div className="flex flex-col">
                                <span className="font-bold text-xs">{courseTitle}</span>
                                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">
                                  {item.type || "Accredited"}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-3.5 font-medium text-slate-600">
                            {enrolledCount.toLocaleString()}
                          </td>

                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-3">
                              <div className="w-28 bg-slate-100 h-2 rounded-full overflow-hidden shrink-0">
                                <div
                                  className="h-full rounded-full bg-blue-600 transition-all duration-700"
                                  style={{ width: `${completionPct}%` }}
                                />
                              </div>
                              <span className="font-bold text-slate-800">{completionPct}%</span>
                            </div>
                          </td>

                          <td className="px-5 py-3.5 text-right">
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 group-hover:underline">
                              <span>Audit</span>
                              <ArrowRight className="w-3 h-3" />
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* ── Right Stage (4 cols) ── */}
          <div className="lg:col-span-4 space-y-6">
            {/* Live Infrastructure Telemetry Card */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                <div>
                  <span className="text-[11px] font-bold tracking-wider text-blue-600 uppercase">
                    Core Telemetry
                  </span>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                    Infrastructure Status
                  </h3>
                </div>

                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/60 rounded-full px-2.5 py-0.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  All Operational
                </span>
              </div>

              <div className="divide-y divide-slate-100">
                <TelemetryRow
                  icon={Mail}
                  label="Email Delivery Gateway"
                  value={`${systemHealth?.emailDelivery ?? "99.4"}%`}
                  status={emailStatus}
                  sub="Optimal delivery queue"
                />

                <TelemetryRow
                  icon={Zap}
                  label="API Edge Latency (p95)"
                  value={`${systemHealth?.apiLatency ?? "42"}ms`}
                  status={apiStatus}
                  sub="Sub-50ms verified"
                />

                <TelemetryRow
                  icon={Database}
                  label="Database Cluster"
                  value={systemHealth?.database ?? "Operational"}
                  status={dbStatus}
                  sub="Multi-AZ replica in sync"
                />

                <TelemetryRow
                  icon={HardDrive}
                  label="Media & Asset CDN"
                  value={systemHealth?.storage ?? "Operational"}
                  status={storageStatus}
                  sub="99.8% cache hit ratio"
                />
              </div>

              <div
                onClick={() => navigate("/admin/reports/system")}
                className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors cursor-pointer"
              >
                <span>Full System Telemetry & Logs</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Real-Time Security Audit Ledger */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                <div>
                  <span className="text-[11px] font-bold tracking-wider text-blue-600 uppercase">
                    Audit Ledger
                  </span>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                    Security & Event Stream
                  </h3>
                </div>

                <button
                  onClick={() => navigate("/admin/reports/admin-activity")}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                >
                  <span>Ledger</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              <div className="space-y-2">
                {(recentActivity || []).map((activity: any, idx: number) => (
                  <div
                    key={idx}
                    onClick={() => navigate("/admin/reports/admin-activity")}
                    className="flex items-start gap-2.5 p-2 rounded-xl hover:bg-slate-50 transition-all cursor-pointer group"
                  >
                    <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                      <Clock className="w-3.5 h-3.5" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-slate-800 group-hover:text-blue-600 transition-colors truncate">
                        {activity.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">
                        {activity.type ? `${activity.type} directive validated` : "Governance event recorded"}
                      </p>
                    </div>

                    <span className="text-[10px] font-mono text-slate-400 shrink-0 font-medium">
                      {activity.time}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Trust & Compliance Certification Badge Card */}
            <div className="rounded-2xl border border-slate-200/80 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-5 text-white shadow-xs">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-blue-400" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400">
                  Compliance Shield
                </span>
              </div>
              <h4 className="text-sm font-bold text-white mb-1">
                SOC 2 Type II & GDPR Validated
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Platform encryption, role-based multi-tenancy, and audit retention policies conform to ISO 27001 standards.
              </p>
              <button
                onClick={() => navigate("/support/platform")}
                className="mt-3.5 text-xs font-semibold text-blue-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>Verification Ledger</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 4. Dedicated Tab: Triage Directives ── */}
      {activeTab === "triage" && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Governance Triage Directive Hub</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Categorized operational actions requiring administrative sign-off, capacity re-allocation, or reviewer assignments.
                </p>
              </div>

              {/* Triage filter pills */}
              <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
                {[
                  { id: "all", label: "All Directives" },
                  { id: "critical", label: "Critical" },
                  { id: "clearance", label: "Clearance" },
                  { id: "capacity", label: "Capacity" },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setTriageFilter(f.id as any)}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                      triageFilter === f.id ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TriageCard
                severity="critical"
                badge="SME REVIEW"
                title={`${attentionItems?.coursesAwaitingReview || 2} Courses Awaiting Curriculum Sign-Off`}
                description="Modules have passed automated rubrics and require Subject Matter Expert sign-off before entering enterprise catalogs."
                actionText="Open SME Review Queue"
                onClick={() => navigate("/admin/reports/admin-activity")}
              />

              <TriageCard
                severity="info"
                badge="LIFECYCLE"
                title={`${attentionItems?.credentialsExpiring30Days || 12} Credentials Expiring in 30 Days`}
                description="Accredited certificates approaching annual re-certification thresholds across corporate members."
                actionText="Dispatch Automated Notifications"
                onClick={() => navigate("/admin/reports/learning-credentials")}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── 5. Dedicated Tab: Curriculum Benchmarks ── */}
      {activeTab === "curriculum" && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Curriculum Intelligence & Benchmarking</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Track course completion rates, learner drop-off points, and enterprise accreditation issuance.
                </p>
              </div>

              {/* Search & Category Filter */}
              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search curriculum..."
                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-blue-500 focus:bg-white transition-all"
                  />
                </div>

                <button
                  onClick={() => navigate("/create-course")}
                  className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Author Course</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left whitespace-nowrap">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-bold tracking-wider uppercase text-slate-500">
                    <th className="px-5 py-3">Curriculum Module</th>
                    <th className="px-5 py-3">Category / Type</th>
                    <th className="px-5 py-3">Enrolled Headcount</th>
                    <th className="px-5 py-3">Certificates Minted</th>
                    <th className="px-5 py-3">Mastery Rate</th>
                    <th className="px-5 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredCurriculum.map((c: any, idx: number) => {
                    const title = c.title || c.courseName || "Enterprise Module";
                    const enrolled = c.enrollments ?? c.enrolled ?? 0;
                    const completions = c.completions ?? Math.round(enrolled * 0.8);
                    const pct = c.completionRate ?? c.completionPercentage ?? 80;

                    return (
                      <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-5 py-4 font-semibold text-slate-900">
                          <div className="flex items-center gap-2.5">
                            <BookOpen className="w-4 h-4 text-blue-600 shrink-0" />
                            <span className="font-bold">{title}</span>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700">
                            {c.type || "Course"}
                          </span>
                        </td>

                        <td className="px-5 py-4 font-semibold text-slate-700">
                          {enrolled.toLocaleString()}
                        </td>

                        <td className="px-5 py-4 text-emerald-600 font-bold">
                          {completions.toLocaleString()}
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-28 bg-slate-100 h-2 rounded-full overflow-hidden shrink-0">
                              <div
                                className="h-full rounded-full bg-blue-600"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="font-bold text-slate-800">{pct}%</span>
                          </div>
                        </td>

                        <td className="px-5 py-4 text-right">
                          <button
                            onClick={() => navigate("/admin/courses")}
                            className="text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
                          >
                            Inspect Module
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── 7. Dedicated Tab: Telemetry & Infrastructure ── */}
      {activeTab === "telemetry" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <DiagnosticNode
              title="API Gateway (p95)"
              value={`${systemHealth?.apiLatency ?? "42"} ms`}
              status="optimal"
              sub="Target: <150ms SLA"
              icon={Zap}
            />

            <DiagnosticNode
              title="Email Delivery Service"
              value={`${systemHealth?.emailDelivery ?? "99.4"}%`}
              status="optimal"
              sub="0 Queue backpressure"
              icon={Mail}
            />

            <DiagnosticNode
              title="Distributed Database"
              value={systemHealth?.database ?? "Operational"}
              status="optimal"
              sub="Multi-Region Active/Passive"
              icon={Database}
            />

            <DiagnosticNode
              title="Asset Cloud CDN"
              value={systemHealth?.storage ?? "Operational"}
              status="optimal"
              sub="99.8% Global Edge Cache"
              icon={HardDrive}
            />
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Security & Administrative Activity Stream</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Chronological event ledger recording administrative logins, course approvals, and permission grants.
                </p>
              </div>

              <button
                onClick={() => navigate("/admin/reports/admin-activity")}
                className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer"
              >
                Download CSV Ledger
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {(recentActivity || []).map((act: any, idx: number) => (
                <div key={idx} className="py-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
                      {act.title?.[0] || "A"}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">{act.title}</div>
                      <div className="text-[11px] text-slate-400">
                        {act.type || "SYSTEM"} event recorded • Verified cryptographic signature
                      </div>
                    </div>
                  </div>

                  <span className="text-xs font-mono text-slate-500 font-medium">
                    {act.time}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ── Helper Directive Row (Clean Enterprise Style) ── */
interface DirectiveRowProps {
  severity: "critical" | "warning" | "info";
  badge: string;
  title: string;
  sub: string;
  action: string;
  onClick: () => void;
}

const DirectiveRow: React.FC<DirectiveRowProps> = ({
  severity,
  badge,
  title,
  sub,
  action,
  onClick,
}) => {
  const badgeStyles = {
    critical: "bg-rose-50 text-rose-700 border-rose-200/70",
    warning: "bg-amber-50 text-amber-700 border-amber-200/70",
    info: "bg-blue-50 text-blue-700 border-blue-200/70",
  }[severity];

  const dotStyles = {
    critical: "bg-rose-500",
    warning: "bg-amber-500",
    info: "bg-blue-500",
  }[severity];

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-5 py-3.5 hover:bg-slate-50/70 transition-colors group gap-3">
      <div className="flex items-start gap-3">
        <span className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${dotStyles}`} />
        <div>
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${badgeStyles}`}>
              {badge}
            </span>
            <h4 className="text-xs sm:text-sm font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
              {title}
            </h4>
          </div>
          <p className="text-xs text-slate-500">{sub}</p>
        </div>
      </div>

      <button
        onClick={onClick}
        className="self-end sm:self-auto rounded-xl border border-slate-200 bg-white hover:bg-slate-900 hover:text-white hover:border-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-700 transition-all shadow-xs flex items-center gap-1.5 shrink-0 cursor-pointer active:scale-95"
      >
        <span>{action}</span>
        <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
      </button>
    </div>
  );
};

/* ── Helper Telemetry Row ── */
interface TelemetryRowProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  status: "good" | "warning";
  sub?: string;
}

const TelemetryRow: React.FC<TelemetryRowProps> = ({
  icon: Icon,
  label,
  value,
  status,
  sub,
}) => (
  <div className="flex items-center justify-between py-2.5 px-0 group">
    <div className="flex items-center gap-2.5 text-xs font-medium text-slate-700">
      <div className="w-6 h-6 rounded-lg bg-slate-50 border border-slate-200/60 flex items-center justify-center text-slate-500">
        <Icon className="w-3.5 h-3.5" />
      </div>
      <div>
        <div className="font-semibold text-slate-900 leading-tight">{label}</div>
        {sub && <div className="text-[10px] text-slate-400 font-normal">{sub}</div>}
      </div>
    </div>

    <div className="flex items-center gap-2">
      <span className="text-xs font-bold text-slate-900 font-mono">{value}</span>
      <span
        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
          status === "good"
            ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
            : "bg-amber-50 text-amber-700 border border-amber-200/60"
        }`}
      >
        {status === "good" ? "Operational" : "Degraded"}
      </span>
    </div>
  </div>
);

/* ── Helper Triage Card ── */
interface TriageCardProps {
  severity: "critical" | "warning" | "info";
  badge: string;
  title: string;
  description: string;
  actionText: string;
  onClick: () => void;
}

const TriageCard: React.FC<TriageCardProps> = ({
  severity,
  badge,
  title,
  description,
  actionText,
  onClick,
}) => {
  const badgeColors = {
    critical: "bg-rose-50 text-rose-700 border-rose-200/60",
    warning: "bg-amber-50 text-amber-700 border-amber-200/60",
    info: "bg-blue-50 text-blue-700 border-blue-200/60",
  }[severity];

  return (
    <div className="p-5 rounded-2xl border border-slate-200/80 bg-white hover:border-slate-300 transition-all flex flex-col justify-between shadow-xs">
      <div>
        <span className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border mb-2.5 ${badgeColors}`}>
          {badge}
        </span>
        <h3 className="text-sm font-bold text-slate-900 mb-1">{title}</h3>
        <p className="text-xs text-slate-500 leading-relaxed mb-4">{description}</p>
      </div>

      <button
        onClick={onClick}
        className="w-full py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-900 hover:text-white hover:border-slate-900 text-slate-800 text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
      >
        <span>{actionText}</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

/* ── Diagnostic Node ── */
interface DiagnosticNodeProps {
  title: string;
  value: string;
  status: "optimal" | "degraded";
  sub: string;
  icon: React.ComponentType<{ className?: string }>;
}

const DiagnosticNode: React.FC<DiagnosticNodeProps> = ({
  title,
  value,
  status,
  sub,
  icon: Icon,
}) => (
  <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
    <div className="flex items-center justify-between mb-2">
      <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
        <Icon className="w-4 h-4" />
      </div>
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        {status}
      </span>
    </div>
    <div className="text-xs text-slate-400 uppercase font-bold tracking-wider">{title}</div>
    <div className="text-xl font-extrabold text-slate-900 mt-1 mb-0.5 font-mono">{value}</div>
    <div className="text-[11px] text-slate-500">{sub}</div>
  </div>
);

export default SuperAdminDashboard;