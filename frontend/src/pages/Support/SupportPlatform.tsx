import React, { useMemo, useState } from "react";
import { SupportPageSkeleton } from "../../components/support/SupportPageSkeleton";
import { Skeleton } from "../../components/ui/Skeleton";
import {
  Server,
  Database,
  Clock,
  Lock,
  Bell,
  Video,
  Mail,
  RotateCw,
  Activity,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  Search,
  Download,
  Cpu,
  HardDrive,
  Gauge,
  Wifi,
  MemoryStick,
  Cloud,
  RefreshCw,
} from "lucide-react";
import {
  usePlatformHealth,
  usePlatformMetrics,
} from "../../hooks/support/useSupport";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";

/* ============================================================
 * Types
 * ========================================================== */

type MetricChartProps = {
  metric: string;
  range: string;
  title: string;
  subtitle?: string;
  unit?: string;
  color?: string;
  type?: "line" | "area";
};

type StatusType =
  | "Operational"
  | "Degraded"
  | "Down"
  | "Maintenance"
  | "Healthy"
  | "Warning"
  | "Critical"
  | string;

/* ============================================================
 * Helpers
 * ========================================================== */

const getNumericValue = (
  value: unknown,
  fallback = 0
): number => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number.parseFloat(value.replace(/[^\d.-]/g, ""));
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  return fallback;
};

const formatNumber = (value: unknown): string => {
  const numeric = getNumericValue(value);

  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 1,
  }).format(numeric);
};

const formatPercent = (value: unknown): string => {
  const numeric = getNumericValue(value);

  return `${numeric.toFixed(numeric % 1 === 0 ? 0 : 2)}%`;
};

const formatTimestamp = (timestamp: unknown): string => {
  if (!timestamp) return "";

  const date = new Date(String(timestamp));

  if (Number.isNaN(date.getTime())) {
    return String(timestamp);
  }

  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getStatusTone = (status: StatusType) => {
  const normalized = String(status).toLowerCase();

  if (
    normalized === "operational" ||
    normalized === "healthy" ||
    normalized === "up"
  ) {
    return {
      text: "text-emerald-700",
      bg: "bg-emerald-50",
      border: "border-emerald-100",
      dot: "bg-emerald-500",
      iconBg: "bg-emerald-50",
      iconText: "text-emerald-600",
    };
  }

  if (
    normalized === "degraded" ||
    normalized === "warning" ||
    normalized === "maintenance"
  ) {
    return {
      text: "text-amber-700",
      bg: "bg-amber-50",
      border: "border-amber-100",
      dot: "bg-amber-500",
      iconBg: "bg-amber-50",
      iconText: "text-amber-600",
    };
  }

  if (
    normalized === "down" ||
    normalized === "critical" ||
    normalized === "failed"
  ) {
    return {
      text: "text-red-700",
      bg: "bg-red-50",
      border: "border-red-100",
      dot: "bg-red-500",
      iconBg: "bg-red-50",
      iconText: "text-red-600",
    };
  }

  return {
    text: "text-gray-700",
    bg: "bg-gray-50",
    border: "border-gray-200",
    dot: "bg-gray-400",
    iconBg: "bg-gray-50",
    iconText: "text-gray-600",
  };
};

const getIssueSeverity = (issue: any): string => {
  return String(
    issue?.severity ||
      issue?.level ||
      issue?.status ||
      "WARNING"
  ).toUpperCase();
};

const getIssueTone = (severity: string) => {
  if (severity === "CRITICAL" || severity === "ERROR") {
    return {
      container: "border-red-100 bg-red-50 hover:bg-red-100",
      icon: "text-red-500",
      title: "text-red-900",
      detail: "text-red-700",
    };
  }

  if (severity === "INFO") {
    return {
      container: "border-blue-100 bg-blue-50 hover:bg-blue-100",
      icon: "text-blue-500",
      title: "text-blue-900",
      detail: "text-blue-700",
    };
  }

  return {
    container: "border-amber-100 bg-amber-50 hover:bg-amber-100",
    icon: "text-amber-500",
    title: "text-amber-900",
    detail: "text-amber-700",
  };
};

/* ============================================================
 * Metric Chart
 * ========================================================== */

const MetricChart: React.FC<MetricChartProps> = ({
  metric,
  range,
  title,
  subtitle,
  unit,
  color = "var(--c-brand)",
  type = "line",
}) => {
  const { data, isLoading } = usePlatformMetrics(metric, range);

  const points = Array.isArray(data?.points)
    ? data.points
    : [];

  const chartUnit = unit || data?.unit || "";

  return (
    <div className="bg-[var(--paper)] border border-[var(--line)] rounded-[var(--r-md)] p-5 flex flex-col gap-4 h-56 shadow-[var(--shadow-xs)] transition-all duration-[var(--dur-base)] ease-[var(--tn)] hover:-translate-y-0.5 hover:border-[var(--line-strong)] hover:shadow-[var(--shadow-sm)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold tracking-[0.08em] uppercase text-[var(--ink-mute)] m-0">
            {title}
          </h3>

          {subtitle && (
            <p className="text-[var(--fs-micro)] text-[var(--ink-mute)] mt-1 leading-snug">
              {subtitle}
            </p>
          )}
        </div>

        <span className="w-8 h-8 rounded-lg bg-[var(--paper-2)] border border-[var(--line)] flex items-center justify-center">
          <Activity
            size={14}
            className="text-[var(--ink-mute)]"
          />
        </span>
      </div>

      <div className="flex-1 w-full min-h-0">
        {isLoading ? (
          <div className="w-full h-full flex items-center justify-center">
            <div className="flex items-center gap-2 text-[var(--ink-mute)] text-sm">
              <RotateCw
                size={13}
                className="animate-spin"
              />
              Loading metrics...
            </div>
          </div>
        ) : points.length === 0 ? (
          <div className="w-full h-full flex items-center justify-center text-[var(--ink-mute)] text-sm">
            No metric data available
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {type === "area" ? (
              <AreaChart data={points}>
                <defs>
                  <linearGradient
                    id={`gradient-${metric}`}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor={color}
                      stopOpacity={0.22}
                    />
                    <stop
                      offset="100%"
                      stopColor={color}
                      stopOpacity={0.02}
                    />
                  </linearGradient>
                </defs>

                <XAxis
                  dataKey="timestamp"
                  hide
                />

                <YAxis
                  hide
                  domain={["auto", "auto"]}
                />

                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    border: "1px solid #eae5df",
                    boxShadow:
                      "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    fontSize: 11,
                  }}
                  labelFormatter={(label) =>
                    formatTimestamp(label)
                  }
                  formatter={(value: any) => [
                    `${value}${chartUnit ? ` ${chartUnit}` : ""}`,
                    title,
                  ]}
                />

                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={color}
                  fill={`url(#gradient-${metric})`}
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              </AreaChart>
            ) : (
              <LineChart data={points}>
                <XAxis
                  dataKey="timestamp"
                  hide
                />

                <YAxis
                  hide
                  domain={["auto", "auto"]}
                />

                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    border: "1px solid #eae5df",
                    boxShadow:
                      "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    fontSize: 11,
                  }}
                  labelFormatter={(label) =>
                    formatTimestamp(label)
                  }
                  formatter={(value: any) => [
                    `${value}${chartUnit ? ` ${chartUnit}` : ""}`,
                    title,
                  ]}
                />

                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={color}
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            )}
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

/* ============================================================
 * KPI Card
 * ========================================================== */

const KpiCard: React.FC<{
  label: string;
  value: React.ReactNode;
  detail?: React.ReactNode;
  icon: React.ElementType;
  tone?: "brand" | "sage" | "honey" | "clay" | "neutral";
}> = ({
  label,
  value,
  detail,
  icon: Icon,
  tone = "neutral",
}) => {
  const toneMap = {
    brand: "bg-[var(--sage-wash)] text-[var(--c-brand)]",
    sage: "bg-emerald-50 text-emerald-700",
    honey: "bg-amber-50 text-amber-700",
    clay: "bg-red-50 text-red-700",
    neutral: "bg-[#f4f2ef] text-[var(--ink-mute)]",
  };

  return (
    <div className="bg-[var(--paper)] border border-[var(--line)] rounded-[var(--r-md)] p-5 min-h-[128px] flex flex-col justify-between shadow-[var(--shadow-xs)] transition-all duration-[var(--dur-base)] ease-[var(--tn)] hover:-translate-y-0.5 hover:border-[var(--line-strong)] hover:shadow-[var(--shadow-sm)]">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[var(--fs-micro)] font-bold text-[var(--ink-mute)] uppercase tracking-[0.14em]">
          {label}
        </span>

        <span
          className={`w-7 h-7 rounded-lg flex items-center justify-center ${toneMap[tone]}`}
        >
          <Icon size={14} />
        </span>
      </div>

      <div>
        <div className="text-[26px] font-extrabold text-[var(--ink)] leading-none tracking-tight">
          {value}
        </div>

        {detail && (
          <div className="text-[var(--fs-micro)] font-medium text-[var(--ink-mute)] mt-2 leading-snug">
            {detail}
          </div>
        )}
      </div>
    </div>
  );
};

/* ============================================================
 * Resource Card
 * ========================================================== */

const ResourceCard: React.FC<{
  title: string;
  subtitle?: string;
  icon: React.ElementType;
  value?: React.ReactNode;
  detail?: string;
  progress?: number;
  status?: string;
}> = ({
  title,
  subtitle,
  icon: Icon,
  value,
  detail,
  progress,
  status,
}) => {
  const safeProgress = Math.min(
    100,
    Math.max(0, getNumericValue(progress))
  );

  const isCritical = safeProgress >= 90;
  const isWarning = safeProgress >= 75;

  return (
    <div className="bg-[var(--paper)] border border-[var(--line)] rounded-[var(--r-md)] p-5 shadow-[var(--shadow-xs)] transition-all duration-[var(--dur-base)] ease-[var(--tn)] hover:-translate-y-0.5 hover:border-[var(--line-strong)] hover:shadow-[var(--shadow-sm)]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[var(--paper-2)] border border-[var(--line)] flex items-center justify-center">
            <Icon
              size={16}
              className="text-[var(--ink-mute)]"
            />
          </div>

          <div>
            <h3 className="text-sm font-bold tracking-[0.08em] uppercase text-[var(--ink-mute)] m-0">
              {title}
            </h3>

            {subtitle && (
              <p className="text-[var(--fs-micro)] text-[var(--ink-mute)] mt-1 leading-snug">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {status && (
          <span
            className={`text-[9px] font-bold px-2 py-1 rounded-full border ${getStatusTone(status).bg} ${getStatusTone(status).text} ${getStatusTone(status).border}`}
          >
            {status}
          </span>
        )}
      </div>

      <div className="mt-4 flex items-end justify-between">
        <div>
          <div className="text-[22px] font-extrabold text-[var(--ink)] leading-tight tracking-tight">
            {value ?? "--"}
          </div>

          {detail && (
            <p className="text-[var(--fs-micro)] text-[var(--ink-mute)] mt-1 leading-snug">
              {detail}
            </p>
          )}
        </div>

        {typeof progress === "number" && (
          <span
            className={`text-sm font-bold ${
              isCritical
                ? "text-red-600"
                : isWarning
                ? "text-amber-600"
                : "text-emerald-600"
            }`}
          >
            {safeProgress}%
          </span>
        )}
      </div>

      {typeof progress === "number" && (
        <div className="mt-3 h-1.5 rounded-full bg-[#eeeae5] overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              isCritical
                ? "bg-red-500"
                : isWarning
                ? "bg-amber-500"
                : "bg-emerald-500"
            }`}
            style={{ width: `${safeProgress}%` }}
          />
        </div>
      )}
    </div>
  );
};

/* ============================================================
 * Main Component
 * ========================================================== */

export const SupportPlatform: React.FC = () => {
  const {
    data: healthData,
    isLoading,
    refetch,
    isFetching,
  } = usePlatformHealth();

  const [timeRange, setTimeRange] = useState("24h");
  const [logSearch, setLogSearch] = useState("");
  const [logLevel, setLogLevel] = useState("ALL");

  /* ----------------------------------------------------------
   * Safe data extraction
   * -------------------------------------------------------- */

  const data: any = healthData || {};

  const services = Array.isArray(data.services)
    ? data.services
    : [];

  const activeIssuesList = Array.isArray(
    data.activeIssues
  )
    ? data.activeIssues
    : [];

  const errorLogs = Array.isArray(data.errorLogs)
    ? data.errorLogs
    : [];

  const platformUpdates = Array.isArray(
    data.platformUpdates
  )
    ? data.platformUpdates
    : [];

  const gke = data.gke || {};
  const gkePods = gke.pods || {};

  const cloudSql =
    data.cloudSql ||
    data.cloudSQL ||
    data.databaseInfrastructure ||
    {};

  const redis = data.redis || {};

  /* ----------------------------------------------------------
   * Derived values
   * -------------------------------------------------------- */

  const healthScore = getNumericValue(
    data.healthScore ??
      data.score ??
      data.platformHealthScore,
    0
  );

  const overallStatus =
    data.overallStatus ||
    data.status ||
    (healthScore >= 90
      ? "HEALTHY"
      : healthScore >= 70
      ? "WARNING"
      : "CRITICAL");

  const errorRate = getNumericValue(
    data.errorRate ??
      data.performance?.errorRate ??
      data.errors?.rate,
    0
  );

  const requestRate = getNumericValue(
    data.requestsPerMinute ??
      data.requestRate ??
      data.performance?.requests?.perSecond,
    0
  );

  const activeUsers = getNumericValue(
    data.activeUsers ??
      data.performance?.activeUsers,
    0
  );

  const storagePercentage = getNumericValue(
    data.storagePercentage ??
      data.storage?.percentage ??
      data.storage?.usedPercentage,
    0
  );

  /* ----------------------------------------------------------
   * Service icon
   * -------------------------------------------------------- */

  const getServiceIcon = (name: string) => {
    const lower = String(name || "").toLowerCase();

    if (
      lower.includes("gateway") ||
      lower.includes("api")
    ) {
      return Server;
    }

    if (
      lower.includes("database") ||
      lower.includes("db") ||
      lower.includes("sql")
    ) {
      return Database;
    }

    if (
      lower.includes("auth") ||
      lower.includes("otp") ||
      lower.includes("lock") ||
      lower.includes("keycloak")
    ) {
      return Lock;
    }

    if (
      lower.includes("video") ||
      lower.includes("media") ||
      lower.includes("stream")
    ) {
      return Video;
    }

    if (
      lower.includes("email") ||
      lower.includes("mail")
    ) {
      return Mail;
    }

    if (
      lower.includes("notification") ||
      lower.includes("queue") ||
      lower.includes("bell")
    ) {
      return Bell;
    }

    return Server;
  };

  /* ----------------------------------------------------------
   * Filter logs
   * -------------------------------------------------------- */

  const filteredLogs = useMemo(() => {
    const search = logSearch.trim().toLowerCase();

    return errorLogs.filter((log: any) => {
      const level = String(log?.level || "").toUpperCase();

      if (
        logLevel !== "ALL" &&
        level !== logLevel
      ) {
        return false;
      }

      if (!search) {
        return true;
      }

      const message = String(
        log?.message || ""
      ).toLowerCase();

      const service = String(
        log?.service || ""
      ).toLowerCase();

      return (
        message.includes(search) ||
        service.includes(search)
      );
    });
  }, [errorLogs, logLevel, logSearch]);

  /* ----------------------------------------------------------
   * Export logs
   * -------------------------------------------------------- */

  const handleExportLogs = () => {
    if (!filteredLogs.length) {
      return;
    }

    const headers = [
      "Time",
      "Level",
      "Service",
      "Message",
      "Count",
    ];

    const rows = filteredLogs.map((log: any) => [
      log?.time || "",
      log?.level || "",
      log?.service || "",
      log?.message || "",
      log?.count ?? "",
    ]);

    const csv = [
      headers,
      ...rows,
    ]
      .map((row) =>
        row
          .map((value:any) => {
            const text = String(value).replace(
              /"/g,
              '""'
            );

            return `"${text}"`;
          })
          .join(",")
      )
      .join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = `nexus-platform-error-logs-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;

    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    URL.revokeObjectURL(url);
  };

  /* ----------------------------------------------------------
   * Loading
   * -------------------------------------------------------- */

  if (isLoading) {
    return <SupportPageSkeleton />;
  }

  const statusTone = getStatusTone(overallStatus);

  /* ==========================================================
   * Render
   * ======================================================== */

  return (
    <div
      className="flex flex-col gap-5 pb-10"
      style={{ fontFamily: "var(--font-sans)" }}
    >
      {/* ======================================================
       * PAGE HEADER
       * ==================================================== */}

      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5 select-none pb-1">
        <div className="flex flex-col gap-1">
          <p className="text-[10px] font-bold text-[var(--ink-mute)] uppercase tracking-widest flex items-center gap-2">
            SUPPORT · SYSTEM STATUS

            <span
              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full normal-case tracking-normal border ${statusTone.bg} ${statusTone.text} ${statusTone.border}`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${statusTone.dot} ${
                  String(overallStatus).toLowerCase() ===
                    "healthy" ||
                  String(overallStatus).toLowerCase() ===
                    "operational"
                    ? "animate-pulse"
                    : ""
                }`}
              />

              {String(overallStatus)
                .charAt(0)
                .toUpperCase() +
                String(overallStatus)
                  .slice(1)
                  .toLowerCase()}
            </span>
          </p>

          <h1 className="m-0 text-[24px] font-bold leading-tight tracking-tight text-[var(--ink)]">
            Platform status
          </h1>

          <p className="mt-2 text-sm font-medium leading-[1.5] text-[var(--ink-soft)]">
            Technical status and performance of the Nexus platform
            platform.
          </p>

          <div className="flex flex-wrap items-center gap-3 mt-2">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-medium text-[var(--ink-mute)]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Auto-refresh: 30s
            </span>

            {data.lastUpdated && (
              <span className="text-[10px] text-[var(--ink-mute)]">
                Last updated: {data.lastUpdated}
              </span>
            )}

            {healthScore > 0 && (
              <span
                className={`text-[10px] font-bold px-2 py-1 rounded-full ${statusTone.bg} ${statusTone.text}`}
              >
                Health score: {healthScore}/100
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="btn-ghost"
            style={{
              height: 36,
              padding: "0 16px",
              gap: 6,
              borderRadius: "var(--r-pill)",
            }}
          >
            <RotateCw
              className={
                isFetching ? "animate-spin" : ""
              }
              style={{
                width: 15,
                height: 15,
              }}
            />

            <span className="text-sm font-semibold">
              {isFetching ? "Refreshing..." : "Refresh"}
            </span>
          </button>
        </div>
      </div>

      {/* ======================================================
       * KPI CARDS
       * ==================================================== */}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        <KpiCard
          label="Storage"
          value={data.storageUsed || "--"}
          detail={
            data.storageGrowth ||
            data.storage?.growth ||
            "Platform storage"
          }
          icon={HardDrive}
          tone="honey"
        />

        <KpiCard
          label="Database"
          value={data.databaseSize || "--"}
          detail={
            data.databaseGrowth ||
            data.database?.growth ||
            "Cloud SQL"
          }
          icon={Database}
          tone="sage"
        />

        <KpiCard
          label="Availability"
          value={
            data.uptimePct ||
            data.availability ||
            "--"
          }
          detail={`SLA ${
            data.slaTarget || "99.9%"
          }`}
          icon={CheckCircle}
          tone="sage"
        />

        <KpiCard
          label="Avg Latency"
          value={
            data.avgLatencyMs !== undefined
              ? `${data.avgLatencyMs} ms`
              : "--"
          }
          detail={`P95 ${
            data.latencyP95
              ? `${data.latencyP95} ms`
              : "--"
          }`}
          icon={Clock}
          tone="brand"
        />

        <KpiCard
          label="API Requests"
          value={
            requestRate > 0
              ? formatNumber(requestRate)
              : "--"
          }
          detail={
            data.requestsUnit ||
            "requests / min"
          }
          icon={Activity}
          tone="brand"
        />

        <KpiCard
          label="Error Rate"
          value={
            errorRate > 0
              ? formatPercent(errorRate)
              : "0%"
          }
          detail={
            activeUsers > 0
              ? `${formatNumber(activeUsers)} active users`
              : "Application errors"
          }
          icon={
            errorRate > 5
              ? AlertCircle
              : CheckCircle
          }
          tone={
            errorRate > 5
              ? "clay"
              : "sage"
          }
        />
      </div>

      {/* ======================================================
       * PERFORMANCE METRICS
       * ==================================================== */}

      <div className="bg-[var(--paper)] border border-[var(--line)] rounded-[var(--r-md)] p-6 shadow-[var(--shadow-xs)] transition-all duration-[var(--dur-base)] ease-[var(--tn)] hover:-translate-y-0.5 hover:border-[var(--line-strong)] hover:shadow-[var(--shadow-sm)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
          <div>
            <h2 className="text-[12px] font-bold tracking-[0.08em] uppercase text-[var(--ink-mute)] m-0 flex items-center gap-2">
              <Gauge size={18} />
              Performance metrics
            </h2>

            <p className="text-sm text-[var(--ink-mute)] mt-1">
              Real-time application and infrastructure
              performance.
            </p>
          </div>

          <div className="flex bg-[var(--paper-2)] rounded-lg p-1 border border-[var(--line)]">
            {[
              "1h",
              "6h",
              "24h",
              "7d",
              "30d",
            ].map((range) => (
              <button
                key={range}
                type="button"
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1.5 rounded-md text-[10px] font-bold transition-all ${
                  timeRange === range
                    ? "bg-white text-[var(--ink)] shadow-sm"
                    : "text-gray-500 hover:text-[var(--ink)]"
                }`}
              >
                {range.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <MetricChart
            metric="requests"
            range={timeRange}
            title="API Requests"
            subtitle="Request throughput"
            unit="/min"
            color="var(--c-brand)"
            type="area"
          />

          <MetricChart
            metric="latency"
            range={timeRange}
            title="P50 Latency"
            subtitle="Median API response"
            unit="ms"
            color="var(--c-honey)"
          />

          <MetricChart
            metric="errors"
            range={timeRange}
            title="Error Rate"
            subtitle="4xx + 5xx responses"
            unit="%"
            color="var(--c-clay)"
          />

          <MetricChart
            metric="cpu"
            range={timeRange}
            title="GKE CPU"
            subtitle="Cluster workload"
            unit="%"
            color="var(--c-sage)"
            type="area"
          />
        </div>
      </div>

      {/* ======================================================
       * INFRASTRUCTURE
       * ==================================================== */}

      <div className="bg-[var(--paper)] border border-[var(--line)] rounded-[var(--r-md)] p-6 shadow-[var(--shadow-xs)] transition-all duration-[var(--dur-base)] ease-[var(--tn)] hover:-translate-y-0.5 hover:border-[var(--line-strong)] hover:shadow-[var(--shadow-sm)]">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-[12px] font-bold tracking-[0.08em] uppercase text-[var(--ink-mute)] m-0 flex items-center gap-2">
              <Cloud size={18} />
              Infrastructure
            </h2>

            <p className="text-sm text-[var(--ink-mute)] mt-1">
              GKE, Cloud SQL and Redis resource utilization.
            </p>
          </div>

          <span className="text-[10px] font-bold text-[var(--ink-mute)]">
            LIVE
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* GKE */}

          <ResourceCard
            title="GKE"
            subtitle="Kubernetes workloads"
            icon={Server}
            value={
              gke.cpuUsage !== undefined
                ? `${gke.cpuUsage}% CPU`
                : "--"
            }
            detail={`${
              gkePods.running ??
              gke.runningPods ??
              0
            } / ${
              gkePods.desired ??
              gke.desiredPods ??
              0
            } pods running`}
            progress={
              gke.cpuUsage !== undefined
                ? getNumericValue(gke.cpuUsage)
                : undefined
            }
            status={
              gke.status ||
              (getNumericValue(gke.cpuUsage) >= 90
                ? "Degraded"
                : "Operational")
            }
          />

          {/* Cloud SQL */}

          <ResourceCard
            title="Cloud SQL"
            subtitle="PostgreSQL database"
            icon={Database}
            value={
              cloudSql.cpuUsage !== undefined
                ? `${cloudSql.cpuUsage}% CPU`
                : data.databaseSize || "--"
            }
            detail={`${formatNumber(
              cloudSql.connections ??
                cloudSql.activeConnections ??
                0
            )} active connections`}
            progress={
              cloudSql.cpuUsage !== undefined
                ? getNumericValue(cloudSql.cpuUsage)
                : undefined
            }
            status={
              cloudSql.status ||
              (getNumericValue(
                cloudSql.cpuUsage
              ) >= 90
                ? "Degraded"
                : "Operational")
            }
          />

          {/* Redis */}

          <ResourceCard
            title="Redis"
            subtitle="Cache & write-behind queue"
            icon={MemoryStick}
            value={
              redis.hitRate !== undefined
                ? `${redis.hitRate}% hit rate`
                : "--"
            }
            detail={`${formatNumber(
              redis.commandsPerSecond ??
                redis.commands ??
                0
            )} commands/sec`}
            progress={
              redis.memoryUsage !== undefined
                ? getNumericValue(redis.memoryUsage)
                : undefined
            }
            status={
              redis.status ||
              "Operational"
            }
          />
        </div>

        {/* Secondary infrastructure metrics */}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
          <div className="rounded-xl bg-[#faf9f8] border border-[#eae5df] p-3">
            <div className="flex items-center gap-2 text-[var(--ink-mute)]">
              <Cpu size={13} />
              <span className="text-[10px] font-bold uppercase">
                GKE Memory
              </span>
            </div>

            <p className="text-lg font-extrabold text-[var(--ink)] mt-2">
              {gke.memoryUsage !== undefined
                ? `${gke.memoryUsage}%`
                : "--"}
            </p>
          </div>

          <div className="rounded-xl bg-[#faf9f8] border border-[#eae5df] p-3">
            <div className="flex items-center gap-2 text-[var(--ink-mute)]">
              <Wifi size={13} />
              <span className="text-[10px] font-bold uppercase">
                DB Connections
              </span>
            </div>

            <p className="text-lg font-extrabold text-[var(--ink)] mt-2">
              {cloudSql.connections !==
              undefined
                ? `${cloudSql.connections}${
                    cloudSql.maxConnections
                      ? ` / ${cloudSql.maxConnections}`
                      : ""
                  }`
                : "--"}
            </p>
          </div>

          <div className="rounded-xl bg-[#faf9f8] border border-[#eae5df] p-3">
            <div className="flex items-center gap-2 text-[var(--ink-mute)]">
              <Activity size={13} />
              <span className="text-[10px] font-bold uppercase">
                DB IOPS
              </span>
            </div>

            <p className="text-lg font-extrabold text-[var(--ink)] mt-2">
              {cloudSql.iops !== undefined
                ? formatNumber(cloudSql.iops)
                : "--"}
            </p>
          </div>

          <div className="rounded-xl bg-[#faf9f8] border border-[#eae5df] p-3">
            <div className="flex items-center gap-2 text-[var(--ink-mute)]">
              <MemoryStick size={13} />
              <span className="text-[10px] font-bold uppercase">
                Redis Memory
              </span>
            </div>

            <p className="text-lg font-extrabold text-[var(--ink)] mt-2">
              {redis.memoryUsage !== undefined
                ? `${redis.memoryUsage}%`
                : "--"}
            </p>
          </div>
        </div>
      </div>

      {/* ======================================================
       * STORAGE + ACTIVE ISSUES
       * ==================================================== */}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Storage */}

        <div className="bg-[var(--paper)] border border-[var(--line)] rounded-[var(--r-md)] p-6 shadow-[var(--shadow-xs)] transition-all duration-[var(--dur-base)] ease-[var(--tn)] hover:-translate-y-0.5 hover:border-[var(--line-strong)] hover:shadow-[var(--shadow-sm)]">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-[12px] font-bold tracking-[0.08em] uppercase text-[var(--ink-mute)] m-0">
                Storage & capacity
              </h2>

              <p className="text-sm text-[var(--ink-mute)] mt-1">
                Current platform storage consumption.
              </p>
            </div>

            <span className="text-[10px] font-bold text-[var(--ink-mute)]">
              {storagePercentage > 0
                ? `${storagePercentage}% used`
                : "Total"}
            </span>
          </div>

          <div className="h-3 rounded-full bg-[#eeeae5] overflow-hidden flex">
            <div
              className="bg-[#e4b24b]"
              style={{
                width: `${Math.min(
                  100,
                  getNumericValue(
                    data.storage?.mediaPercentage,
                    0
                  )
                )}%`,
              }}
            />

            <div
              className="bg-[#7da47c]"
              style={{
                width: `${Math.min(
                  100,
                  getNumericValue(
                    data.storage?.databasePercentage,
                    0
                  )
                )}%`,
              }}
            />

            <div
              className="bg-[#c87559]"
              style={{
                width: `${Math.min(
                  100,
                  getNumericValue(
                    data.storage?.backupPercentage,
                    0
                  )
                )}%`,
              }}
            />

            <div
              className="bg-[#4b4b4b]"
              style={{
                width: `${Math.min(
                  100,
                  getNumericValue(
                    data.storage?.logsPercentage,
                    0
                  )
                )}%`,
              }}
            />
          </div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-3 mt-5">
            <div className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2 text-[10px] text-[var(--ink-mute)]">
                <span className="w-2 h-2 rounded-full bg-[#e4b24b]" />
                Media & Video
              </span>

              <span className="text-sm font-bold text-[var(--ink)]">
                {data.storage?.media ||
                  data.mediaStorage ||
                  "--"}
              </span>
            </div>

            <div className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2 text-[10px] text-[var(--ink-mute)]">
                <span className="w-2 h-2 rounded-full bg-[#7da47c]" />
                Database
              </span>

              <span className="text-sm font-bold text-[var(--ink)]">
                {data.storage?.database ||
                  data.databaseStorage ||
                  data.databaseSize ||
                  "--"}
              </span>
            </div>

            <div className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2 text-[10px] text-[var(--ink-mute)]">
                <span className="w-2 h-2 rounded-full bg-[#c87559]" />
                Backups
              </span>

              <span className="text-sm font-bold text-[var(--ink)]">
                {data.storage?.backups ||
                  data.backupStorage ||
                  "--"}
              </span>
            </div>

            <div className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2 text-[10px] text-[var(--ink-mute)]">
                <span className="w-2 h-2 rounded-full bg-[#4b4b4b]" />
                Logs & Audit
              </span>

              <span className="text-sm font-bold text-[var(--ink)]">
                {data.storage?.logs ||
                  data.logStorage ||
                  "--"}
              </span>
            </div>
          </div>
        </div>

        {/* Active Issues */}

        <div className="bg-[var(--paper)] border border-[var(--line)] rounded-[var(--r-md)] p-6 flex flex-col shadow-[var(--shadow-xs)] transition-all duration-[var(--dur-base)] ease-[var(--tn)] hover:-translate-y-0.5 hover:border-[var(--line-strong)] hover:shadow-[var(--shadow-sm)]">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-[12px] font-bold tracking-[0.08em] uppercase text-[var(--ink-mute)] m-0">
                Active issues
              </h2>

              <p className="text-sm text-[var(--ink-mute)] mt-1">
                Incidents and service degradations.
              </p>
            </div>

            <span
              className={`px-2.5 py-1 rounded-full text-sm font-bold ${
                activeIssuesList.length > 0
                  ? "bg-red-50 text-red-700 border border-red-100"
                  : "bg-emerald-50 text-emerald-700 border border-emerald-100"
              }`}
            >
              {activeIssuesList.length}
            </span>
          </div>

          <div className="flex flex-col gap-2">
            {activeIssuesList.length === 0 ? (
              <div className="min-h-[150px] flex flex-col items-center justify-center text-[var(--ink-mute)]">
                <CheckCircle
                  size={32}
                  className="text-emerald-500 mb-2 opacity-60"
                />

                <p className="text-sm font-semibold">
                  No active incidents
                </p>

                <p className="text-[10px] mt-1">
                  All monitored systems are operating normally.
                </p>
              </div>
            ) : (
              activeIssuesList.map(
                (issue: any, index: number) => {
                  const severity =
                    getIssueSeverity(issue);

                  const tone =
                    getIssueTone(severity);

                  const IssueIcon =
                    severity === "CRITICAL" ||
                    severity === "ERROR"
                      ? AlertCircle
                      : severity === "INFO"
                      ? CheckCircle
                      : AlertTriangle;

                  return (
                    <button
                      key={
                        issue?.id ||
                        `${issue?.title}-${index}`
                      }
                      type="button"
                      className={`w-full text-left rounded-xl p-3 transition flex items-start gap-3 border ${tone.container}`}
                      onClick={() => {
                        if (
                          issue?.id &&
                          typeof window !==
                            "undefined"
                        ) {
                          window.dispatchEvent(
                            new CustomEvent(
                              "nexus-platform-issue-selected",
                              {
                                detail: issue,
                              }
                            )
                          );
                        }
                      }}
                    >
                      <IssueIcon
                        className={`${tone.icon} w-5 h-5 shrink-0 mt-0.5`}
                      />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <h4
                            className={`text-sm font-bold ${tone.title}`}
                          >
                            {issue?.title ||
                              "Platform issue"}
                          </h4>

                          <span
                            className={`text-[9px] font-bold uppercase ${tone.detail}`}
                          >
                            {severity}
                          </span>
                        </div>

                        <p
                          className={`text-sm font-medium mt-1 line-clamp-2 ${tone.detail}`}
                        >
                          {issue?.detail ||
                            issue?.message ||
                            "No additional details available."}
                        </p>

                        {issue?.startedAt && (
                          <p
                            className={`text-[10px] mt-2 ${tone.detail}`}
                          >
                            Started{" "}
                            {formatTimestamp(
                              issue.startedAt
                            )}
                          </p>
                        )}
                      </div>
                    </button>
                  );
                }
              )
            )}
          </div>
        </div>
      </div>

      {/* ======================================================
       * SYSTEM VITALS
       * ==================================================== */}

      <div className="bg-[var(--paper)] border border-[var(--line)] rounded-[var(--r-md)] p-6 shadow-[var(--shadow-xs)] transition-all duration-[var(--dur-base)] ease-[var(--tn)] hover:-translate-y-0.5 hover:border-[var(--line-strong)] hover:shadow-[var(--shadow-sm)]">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-[12px] font-bold tracking-[0.08em] uppercase text-[var(--ink-mute)] m-0">
              System vitals
            </h2>

            <p className="text-sm text-[var(--ink-mute)] mt-1">
              Health of the core Nexus platform services.
            </p>
          </div>

          <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            {services.length} services monitored
          </span>
        </div>

        {services.length === 0 ? (
          <div className="py-10 flex flex-col items-center justify-center text-[var(--ink-mute)]">
            <Server
              size={30}
              className="mb-2 opacity-40"
            />

            <p className="text-sm font-semibold">
              No service health data available
            </p>

            <p className="text-sm mt-1">
              Connect the platform health provider to display
              service status.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {services.map(
              (service: any, idx: number) => {
                const ServiceIcon =
                  getServiceIcon(
                    service?.name || ""
                  );

                const status =
                  service?.status ||
                  "Unknown";

                const tone =
                  getStatusTone(status);

                return (
                  <div
                    key={
                      service?.id ||
                      `${service?.name}-${idx}`
                    }
                    className="border border-[#eae5df] rounded-xl p-3.5 flex items-start gap-3 bg-[#faf9f8] hover:bg-white transition"
                  >
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${tone.iconBg} ${tone.iconText}`}
                    >
                      <ServiceIcon className="w-4 h-4" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-sm font-bold text-[var(--ink)] truncate">
                          {service?.name ||
                            "Unknown service"}
                        </h3>

                        <span
                          className={`text-[9px] font-bold whitespace-nowrap ${tone.text}`}
                        >
                          {status}
                        </span>
                      </div>

                      <p className="text-[10px] text-[var(--ink-mute)] font-medium mt-1 line-clamp-1">
                        {service?.detail ||
                          service?.message ||
                          "No details available"}
                      </p>

                      <div className="flex items-center gap-3 mt-2">
                        {service?.latency !==
                          undefined && (
                          <span className="text-[9px] text-[var(--ink-mute)]">
                            {service.latency}ms
                          </span>
                        )}

                        {service?.uptime !==
                          undefined && (
                          <span className="text-[9px] text-[var(--ink-mute)]">
                            {service.uptime} uptime
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              }
            )}
          </div>
        )}
      </div>

      {/* ======================================================
       * VIDEO / ASYNC PROCESSING
       * ==================================================== */}

      {(data.videoProgress ||
        data.videoStreaming ||
        data.asyncProcessing) && (
        <div className="bg-[var(--paper)] border border-[var(--line)] rounded-[var(--r-md)] p-6 shadow-[var(--shadow-xs)] transition-all duration-[var(--dur-base)] ease-[var(--tn)] hover:-translate-y-0.5 hover:border-[var(--line-strong)] hover:shadow-[var(--shadow-sm)]">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-[12px] font-bold tracking-[0.08em] uppercase text-[var(--ink-mute)] m-0 flex items-center gap-2">
                <Video size={18} />
                Video & async processing
              </h2>

              <p className="text-sm text-[var(--ink-mute)] mt-1">
                Write-behind progress and background processing
                health.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="border border-[#eae5df] rounded-xl p-3 bg-[#faf9f8]">
              <span className="text-[9px] font-bold text-[var(--ink-mute)] uppercase">
                Progress Events
              </span>

              <p className="text-lg font-extrabold text-[var(--ink)] mt-2">
                {formatNumber(
                  data.videoProgress
                    ?.eventsPerSecond ??
                    data.videoStreaming
                      ?.eventsPerSecond ??
                    0
                )}
                <span className="text-[10px] font-semibold ml-1">
                  /sec
                </span>
              </p>
            </div>

            <div className="border border-[#eae5df] rounded-xl p-3 bg-[#faf9f8]">
              <span className="text-[9px] font-bold text-[var(--ink-mute)] uppercase">
                Redis Pending
              </span>

              <p className="text-lg font-extrabold text-[var(--ink)] mt-2">
                {formatNumber(
                  data.videoProgress
                    ?.pendingUpdates ??
                    0
                )}
              </p>
            </div>

            <div className="border border-[#eae5df] rounded-xl p-3 bg-[#faf9f8]">
              <span className="text-[9px] font-bold text-[var(--ink-mute)] uppercase">
                DB Flushes
              </span>

              <p className="text-lg font-extrabold text-[var(--ink)] mt-2">
                {formatNumber(
                  data.videoProgress
                    ?.flushRate ??
                    0
                )}
                <span className="text-[10px] font-semibold ml-1">
                  /min
                </span>
              </p>
            </div>

            <div className="border border-[#eae5df] rounded-xl p-3 bg-[#faf9f8]">
              <span className="text-[9px] font-bold text-[var(--ink-mute)] uppercase">
                Failed Flushes
              </span>

              <p
                className={`text-lg font-extrabold mt-2 ${
                  getNumericValue(
                    data.videoProgress
                      ?.failedFlushes
                  ) > 0
                    ? "text-red-600"
                    : "text-emerald-600"
                }`}
              >
                {formatNumber(
                  data.videoProgress
                    ?.failedFlushes ??
                    0
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================
       * RECENT ERROR LOGS
       * ==================================================== */}

      <div className="bg-[var(--paper)] border border-[var(--line)] rounded-[var(--r-md)] p-6 shadow-[var(--shadow-xs)] transition-all duration-[var(--dur-base)] ease-[var(--tn)] hover:-translate-y-0.5 hover:border-[var(--line-strong)] hover:shadow-[var(--shadow-sm)]">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-5">
          <div>
            <h2 className="text-[12px] font-bold tracking-[0.08em] uppercase text-[var(--ink-mute)] m-0">
              Recent error logs
            </h2>

            <p className="text-[var(--fs-label)] text-[var(--ink-mute)] mt-1 leading-relaxed">
              Latest application and infrastructure errors.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />

              <input
                type="text"
                placeholder="Search logs..."
                value={logSearch}
                onChange={(e) =>
                  setLogSearch(e.target.value)
                }
                className="pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm w-52 bg-white focus:outline-none focus:border-gray-400"
              />
            </div>

            <select
              value={logLevel}
              onChange={(e) =>
                setLogLevel(e.target.value)
              }
              className="py-2 px-3 border border-gray-200 rounded-lg text-sm bg-white text-gray-700 font-medium focus:outline-none"
            >
              <option value="ALL">
                All Levels
              </option>

              <option value="ERROR">
                Error
              </option>

              <option value="WARN">
                Warning
              </option>

              <option value="INFO">
                Info
              </option>
            </select>

            <button
              type="button"
              onClick={handleExportLogs}
              disabled={
                filteredLogs.length === 0
              }
              className="py-2 px-3 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 text-sm font-semibold"
            >
              <Download size={14} />
              Export
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse min-w-[720px]">
            <thead>
              <tr className="border-b border-[#eae5df] text-[var(--ink-mute)] font-bold uppercase tracking-wider">
                <th className="pb-3 px-2 font-semibold">
                  Time
                </th>

                <th className="pb-3 px-2 font-semibold">
                  Level
                </th>

                <th className="pb-3 px-2 font-semibold">
                  Service
                </th>

                <th className="pb-3 px-2 font-semibold w-1/2">
                  Message
                </th>

                <th className="pb-3 px-2 font-semibold text-right">
                  Count
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#eae5df]">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="py-10 text-center text-gray-400 font-medium"
                  >
                    <div className="flex flex-col items-center">
                      <CheckCircle
                        size={24}
                        className="text-emerald-500 mb-2 opacity-60"
                      />

                      <span>
                        No logs matched your filters
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredLogs.map(
                  (log: any, index: number) => {
                    const level = String(
                      log?.level || "INFO"
                    ).toUpperCase();

                    return (
                      <tr
                        key={
                          log?.id ||
                          `${log?.time}-${index}`
                        }
                        className="hover:bg-[#faf9f8] transition"
                      >
                        <td className="py-3 px-2 font-mono text-[var(--ink)] whitespace-nowrap">
                          {log?.time ||
                            formatTimestamp(
                              log?.timestamp
                            ) ||
                            "--"}
                        </td>

                        <td className="py-3 px-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              level === "ERROR"
                                ? "bg-red-100 text-red-700"
                                : level ===
                                  "WARN"
                                ? "bg-orange-100 text-orange-700"
                                : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {level}
                          </span>
                        </td>

                        <td className="py-3 px-2 font-semibold text-[var(--ink)]">
                          {log?.service ||
                            "--"}
                        </td>

                        <td className="py-3 px-2 text-[var(--ink-mute)]">
                          <div
                            className="max-w-[700px] truncate"
                            title={
                              log?.message || ""
                            }
                          >
                            {log?.message ||
                              "--"}
                          </div>
                        </td>

                        <td className="py-3 px-2 text-right font-semibold text-[var(--ink)]">
                          {log?.count !==
                          undefined
                            ? `${log.count}x`
                            : "--"}
                        </td>
                      </tr>
                    );
                  }
                )
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ======================================================
       * PLATFORM UPDATES
       * ==================================================== */}

      <div className="bg-[var(--paper)] border border-[var(--line)] rounded-[var(--r-md)] p-6 shadow-[var(--shadow-xs)] transition-all duration-[var(--dur-base)] ease-[var(--tn)] hover:-translate-y-0.5 hover:border-[var(--line-strong)] hover:shadow-[var(--shadow-sm)]">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-[12px] font-bold tracking-[0.08em] uppercase text-[var(--ink-mute)] m-0">
              Platform updates
            </h2>

            <p className="text-sm text-[var(--ink-mute)] mt-1">
              Recent deployments and scheduled platform changes.
            </p>
          </div>

          <span className="text-[10px] font-bold text-[var(--ink-mute)]">
            CHANGELOG
          </span>
        </div>

        {platformUpdates.length === 0 ? (
          <div className="py-8 text-center text-[var(--ink-mute)] text-sm">
            No platform updates available.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse min-w-[620px]">
              <thead>
                <tr className="border-b border-[#eae5df] text-[var(--ink-mute)] font-bold uppercase tracking-wider">
                  <th className="pb-3 px-2">
                    Version
                  </th>

                  <th className="pb-3 px-2 w-2/3">
                    Changelog
                  </th>

                  <th className="pb-3 px-2 text-right">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#eae5df]">
                {platformUpdates.map(
                  (
                    update: any,
                    index: number
                  ) => {
                    const status =
                      update?.status ||
                      "Scheduled";

                    const tone =
                      getStatusTone(status);

                    return (
                      <tr
                        key={
                          update?.id ||
                          `${update?.version}-${index}`
                        }
                        className="hover:bg-[#faf9f8] transition cursor-pointer"
                      >
                        <td className="py-3 px-2">
                          <span className="inline-flex items-center px-2 py-1 rounded-md bg-[var(--sage-wash)] text-emerald-700 font-mono font-bold">
                            {update?.version ||
                              "--"}
                          </span>

                          {update?.date && (
                            <div className="text-[9px] text-[var(--ink-mute)] mt-1">
                              {update.date}
                            </div>
                          )}
                        </td>

                        <td className="py-3 px-2 font-medium text-[var(--ink)]">
                          <div>
                            {update?.title ||
                              update?.changelog ||
                              "--"}
                          </div>

                          {update?.description && (
                            <div className="text-[10px] text-[var(--ink-mute)] mt-1">
                              {
                                update.description
                              }
                            </div>
                          )}
                        </td>

                        <td className="py-3 px-2 text-right">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-1 border ${tone.bg} ${tone.text} ${tone.border}`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${tone.dot}`}
                            />

                            {status}
                          </span>
                        </td>
                      </tr>
                    );
                  }
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ======================================================
       * FOOTER STATUS
       * ==================================================== */}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-2 text-[10px] text-[var(--ink-mute)]">
          <RefreshCw
            size={12}
            className={
              isFetching
                ? "animate-spin"
                : ""
            }
          />

          <span>
            Platform monitoring is{" "}
            <strong className="text-[var(--ink)]">
              {String(overallStatus)
                .toLowerCase()}
            </strong>
          </span>
        </div>

        <div className="text-[10px] text-[var(--ink-mute)]">
          Nexus Platform Monitoring
        </div>
      </div>
    </div>
  );
};

export default SupportPlatform;