import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { ArrowRight, Filter, X, ChevronDown } from "../../assets/icons";

import ReviewMetricCard from "../../components/sme/dashboard/ReviewMetricCard";
import RecentlyReviewedList from "../../components/sme/dashboard/RecentlyReviewedList";
import MyDomainsCard, { DomainItem } from "../../components/sme/dashboard/MyDomainsCard";
import PlatformHealthCard from "../../components/sme/dashboard/PlatformHealthCard";
import ReviewQueueTable from "../../components/sme/dashboard/ReviewQueueTable";
import { Skeleton } from "../../components/ui/Skeleton/Skeleton";

import { useUserStore } from "../../store/user.store";
import { useProfileStore } from "../../store/profile.store";
import {useDashboardStatistics,useRecentlyReviewed,} from "../../hooks/review-queue/useSmeDashboard";
import { usePlatformHealth } from "../../hooks/support/useSupport";
import { useReviewQueue } from "../../hooks/review-queue/useSmeReviewQueue";


const CardSkeleton = () => (
  <div className="flex h-full min-h-[300px] flex-col rounded-[var(--r-md)] border border-[var(--line)] bg-[var(--paper)] shadow-[var(--shadow-xs)] p-5">
    <div className="flex items-center justify-between border-b border-[var(--line)] pb-4 mb-4">
      <Skeleton className="h-5 w-32" />
      <Skeleton className="h-3 w-16" />
    </div>
    <div className="space-y-4">
      {[1, 2, 3].map(i => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

const TableSkeleton = () => (
  <div className="rounded-[var(--r-md)] border border-[var(--line)] bg-[var(--paper)] shadow-[var(--shadow-xs)] p-5">
    <div className="space-y-4">
      <Skeleton className="h-8 w-full" />
      {[1, 2, 3, 4, 5].map(i => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  </div>
);

const shell =
  "rounded-[var(--r-md)] border border-[var(--line)] bg-[var(--paper)] shadow-[var(--shadow-xs)]";

export const SubjectMatterDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useUserStore();
  const { profile } = useProfileStore();
  const reviewerId = user?.id || "";
  const [searchQuery, setSearchQuery] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterType, setFilterType] = useState("");
  const [filterSubject, setFilterSubject] = useState("");
  const [filterPriority, setFilterPriority] = useState("");

  const userFullName = user?.firstName
    ? `${user.firstName} ${user.lastName || ""}`.trim()
    : profile?.profile?.firstName
      ? `${profile.profile.firstName} ${profile.profile.lastName || ""}`.trim()
      : (user as any)?.name || (profile as any)?.name || "";

  const reviewerName =
    userFullName && userFullName.toLowerCase() !== "temp"
      ? userFullName
      : user?.email && !user.email.toLowerCase().startsWith("temp")
        ? user.email.split("@")[0]
        : "Dr. Faris Al-Maamari";

  const { data: statsData, isLoading: statsLoading } =
    useDashboardStatistics(reviewerId);
  const { data: queueDataRes, isLoading: queueLoading } = useReviewQueue(
    reviewerId,
    "pending",
    1,
    100
  );
  const queueData = queueDataRes?.items || [];
  const { data: recentlyReviewedData, isLoading: recentlyLoading } =
    useRecentlyReviewed(reviewerId);
  const { data: healthData, isLoading: healthLoading } = usePlatformHealth();

  const healthItems = useMemo(() => {
    if (!healthData?.services) return [];
    return healthData.services.map((svc: any) => ({
      name: svc.name,
      detail: svc.detail || svc.status,
      status:
        svc.status === "Down"
          ? ("Degraded" as const)
          : (svc.status as "Operational" | "Degraded"),
    }));
  }, [healthData]);

  const stats = useMemo(() => {
    if (statsData?.length) return statsData;
    return [
      { label: "AWAITING REVIEW", value: "4", unit: "", accent: false },
      { label: "IN PROGRESS", value: "2", unit: "", accent: false },
      { label: "APPROVED (ALL-TIME)", value: "38", unit: "", accent: false },
      { label: "AVG TURNAROUND", value: "1.2", unit: "day", accent: false },
      { label: "SLA TARGET", value: "3", unit: "days", accent: false },
    ];
  }, [statsData]);

  const domainsList = useMemo<DomainItem[]>(() => {
    if (!queueData?.length) return [];
    const domainMap = new Map<
      string,
      { pendingCount: number; reviewedCount: number }
    >();
    queueData.forEach((item: any) => {
      const domainName = item.domain?.trim() || "General";
      if (!domainMap.has(domainName))
        domainMap.set(domainName, { pendingCount: 0, reviewedCount: 0 });
      domainMap.get(domainName)!.pendingCount++;
    });
    return Array.from(domainMap.entries()).map(([title, counts], idx) => ({
      id: String(idx + 1),
      title,
      pendingCount: counts.pendingCount,
      reviewedCount: counts.reviewedCount,
    }));
  }, [queueData]);

  const handleReview = (item: any) => {
    const entityId = item.id || item.entityId || item.reviewId;
    if (!entityId) {
      navigate("/sme/queue");
      return;
    }
    const entityTypeRaw = (
      item.type ||
      item.entityType ||
      "course"
    ).toLowerCase();
    // Normalize type to the format SubjectMatterReview expects
    const typeParam = entityTypeRaw.includes("career path") || entityTypeRaw.includes("career-path") || entityTypeRaw === "careerpath"
      ? "career-path"
      : entityTypeRaw === "lesson"
        ? "lesson"
        : "course";
    // Navigate to /sme-review with query params (not route params)
    navigate(`/sme-review?id=${entityId}&type=${typeParam}&viewOnly=false`);
  };

  const handleStartNext = () => {
    if (queueData?.length) handleReview(queueData[0]);
    else navigate("/sme/queue");
  };

  const filteredQueue = useMemo(() => {
    let result = queueData;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (item: any) =>
          item.title?.toLowerCase().includes(q) ||
          item.domain?.toLowerCase().includes(q) ||
          item.subject?.toLowerCase().includes(q)
      );
    }
    if (filterType) {
      result = result.filter((item: any) =>
        (item.type || item.entityType || "").toLowerCase().includes(filterType.toLowerCase())
      );
    }
    if (filterSubject) {
      result = result.filter((item: any) =>
        (item.subject || item.domain || "").toLowerCase().includes(filterSubject.toLowerCase())
      );
    }
    if (filterPriority) {
      // priority derived from waiting days — High ≥5d, Medium ≥2d, Normal <2d
      result = result.filter((item: any) => {
        if (!item.submittedDate || item.submittedDate === "-") return filterPriority === "Normal";
        const days = Math.floor((Date.now() - new Date(item.submittedDate).getTime()) / 86400000);
        const p = days >= 5 ? "High" : days >= 2 ? "Medium" : "Normal";
        return p === filterPriority;
      });
    }
    return result;
  }, [queueData, searchQuery, filterType, filterSubject, filterPriority]);

  return (
    <main className="smerep-dashboard w-full text-gray-900 antialiased">
      <div className="mx-auto flex w-full flex-col gap-6">
        {/* Header */}
        <header className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="mb-1.5 text-xs font-bold uppercase tracking-[0.12em] text-gray-500">
              SME REVIEW HOME
            </p>
            <h1 className="m-0 mb-1.5 text-2xl font-bold leading-tight tracking-tight text-gray-900">
              Review queue
            </h1>
            <p className="max-w-xl text-sm leading-relaxed text-gray-500">
              Subject Matter Expert
              <span className="mx-0.5 text-gray-400">&middot;</span>
              {reviewerName}. Courses in your domain expertise, awaiting your review.
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2 pt-0.5">
            <button
              type="button"
              id="sme-filter-toggle"
              onClick={() => setFilterOpen((v) => !v)}
              className={`inline-flex h-10 items-center  justify-center gap-1.5 rounded-full border px-4 text-sm font-semibold transition-all active:scale-[0.98] hover:shadow-[var(--shadow-lg)] ${
                filterOpen
                  ? "border-black bg-black text-white"
                  : "border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50"
              }`}
            >
              <Filter className="h-[13px] w-[13px]" />
              Filter
              {(filterType || filterSubject || filterPriority) && (
                <span className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-[#d4a017] text-[10px] font-bold text-white">
                  {[filterType, filterSubject, filterPriority].filter(Boolean).length}
                </span>
              )}
            </button>
         <button
  type="button"
  onClick={handleStartNext}
  className="inline-flex h-10 items-center justify-center gap-1.5 rounded-full border border-[var(--c-honey)]/45 bg-[var(--hero-bg)] px-4 text-sm font-semibold text-[var(--ink)] shadow-sm transition-all hover:shadow-[var(--shadow-lg)] active:scale-[0.98]"
>
  Start next
   <ArrowRight className="h-[13px] w-[13px]" strokeWidth={1.8} />
</button>
          </div>
        </header>

        {/* Metric cards */}
        <section>
          <div className="mb-2.5">
            <h2
              className="m-0 uppercase text-[var(--ink-mute)]"
              style={{
                fontSize: "12px",
                fontWeight: 700,
                letterSpacing: "0.12em",
                fontFamily: "var(--font-sans)",
              }}
            >
              ASSIGNED TO ME
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
            {statsLoading
              ? [...Array(5)].map((_, idx) => (
                  <div key={idx} className={`${shell} min-h-[108px] px-[18px] pt-[18px] pb-[16px]`}>
                    <div className="flex flex-col gap-3">
                      <Skeleton className="h-10 w-10 rounded-xl" />
                      <Skeleton className="mt-2 h-3 w-16" />
                      <Skeleton className="h-6 w-10" />
                    </div>
                  </div>
                ))
              : stats.map((stat, idx) => (
                  <ReviewMetricCard
                    key={`${stat.label}-${idx}`}
                    title={stat.label}
                    value={stat.value}
                    subtitle={stat.unit}
                    accent={stat.accent}
                  />
                ))}
          </div>
        </section>

        {/* Review queue table */}
        <section className="relative">
          {/* ── Inline Filter Panel ─────────────────────────────────── */}
          {filterOpen && (
            <div
              id="sme-filter-panel"
              className="mb-4 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm"
            >
              <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3">
                <span className="text-[13px] font-semibold text-gray-900">
                  Filter Queue
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setFilterType("");
                    setFilterSubject("");
                    setFilterPriority("");
                    setFilterOpen(false);
                  }}
                  className="flex items-center gap-1 text-[11px] font-semibold text-gray-500 hover:text-gray-900 transition-colors"
                >
                  <X className="h-3.5 w-3.5" /> Clear & close
                </button>
              </div>
              <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-3">
                {/* Type */}
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="filter-type"
                    className="text-[10px] font-bold uppercase tracking-[0.1em] text-gray-500"
                  >
                    Content Type
                  </label>
                  <div className="relative">
                    <select
                      id="filter-type"
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value)}
                      className="w-full appearance-none rounded-md border border-gray-300 bg-gray-50 px-3 py-2 pr-8 text-[13px] text-gray-900 outline-none focus:border-black transition-colors"
                    >
                      <option value="">All types</option>
                      <option value="course">Course</option>
                      <option value="lesson">Lesson</option>
                      <option value="career path">Career Path</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-500" />
                  </div>
                </div>

                {/* Priority */}
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="filter-priority"
                    className="text-[10px] font-bold uppercase tracking-[0.1em] text-gray-500"
                  >
                    Priority
                  </label>
                  <div className="relative">
                    <select
                      id="filter-priority"
                      value={filterPriority}
                      onChange={(e) => setFilterPriority(e.target.value)}
                      className="w-full appearance-none rounded-md border border-gray-300 bg-gray-50 px-3 py-2 pr-8 text-[13px] text-gray-900 outline-none focus:border-black transition-colors"
                    >
                      <option value="">All priorities</option>
                      <option value="High">High (≥5 days)</option>
                      <option value="Medium">Medium (2–5 days)</option>
                      <option value="Normal">Normal (&lt;2 days)</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-500" />
                  </div>
                </div>

                {/* Subject search */}
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="filter-subject"
                    className="text-[10px] font-bold uppercase tracking-[0.1em] text-gray-500"
                  >
                    Subject / Domain
                  </label>
                  <input
                    id="filter-subject"
                    type="text"
                    placeholder="e.g. Knowledge Mgmt"
                    value={filterSubject}
                    onChange={(e) => setFilterSubject(e.target.value)}
                    className="w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-[13px] text-gray-900 outline-none placeholder:text-gray-400 focus:border-black transition-colors"
                  />
                </div>
              </div>
              {/* Active filter summary */}
              {(filterType || filterSubject || filterPriority) && (
                <div className="border-t border-gray-200 px-5 py-2.5 flex items-center gap-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Active:</span>
                  {filterType && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 border border-gray-200 px-2.5 py-0.5 text-[11px] font-semibold">
                      {filterType}
                      <button type="button" onClick={() => setFilterType("")} className="ml-0.5 text-gray-400 hover:text-gray-900"><X className="h-2.5 w-2.5" /></button>
                    </span>
                  )}
                  {filterPriority && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 border border-gray-200 px-2.5 py-0.5 text-[11px] font-semibold">
                      {filterPriority}
                      <button type="button" onClick={() => setFilterPriority("")} className="ml-0.5 text-gray-400 hover:text-gray-900"><X className="h-2.5 w-2.5" /></button>
                    </span>
                  )}
                  {filterSubject && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 border border-gray-200 px-2.5 py-0.5 text-[11px] font-semibold">
                      {filterSubject}
                      <button type="button" onClick={() => setFilterSubject("")} className="ml-0.5 text-gray-400 hover:text-gray-900"><X className="h-2.5 w-2.5" /></button>
                    </span>
                  )}
                  <span className="text-[11px] text-gray-500">
                    — {filteredQueue.length} result{filteredQueue.length !== 1 ? "s" : ""}
                  </span>
                </div>
              )}
            </div>
          )}
          {queueLoading ? <TableSkeleton /> : <ReviewQueueTable items={filteredQueue} onReview={handleReview} onTitleClick={handleReview} />}
        </section>

        {/* Bottom cards */}
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="relative min-w-0">
            {recentlyLoading ? <CardSkeleton /> : <RecentlyReviewedList
              reviewed={recentlyReviewedData || []}
              onViewAll={() => navigate("/sme/queue")}
            />}
          </div>
          <div className="relative min-w-0">
            {queueLoading ? <CardSkeleton /> : <MyDomainsCard
              domains={domainsList}
              onViewAll={() => navigate("/sme/queue")}
              onViewDomain={() => navigate("/sme/queue")}
            />}
          </div>
          <div className="relative min-w-0">
            {healthLoading ? <CardSkeleton /> : <PlatformHealthCard
              score={healthData?.performanceScore ?? 98}
              items={healthItems}
              onViewAll={() => navigate("/sme/reports")}
            />}
          </div>
        </section>
      </div>
    </main>
  );
};

const LoadingOverlay: React.FC<{ label: string }> = ({ label }) => (
  <div className="absolute inset-0 z-20 flex items-center justify-center rounded-[var(--r-md)] bg-[var(--paper)]/[0.68] backdrop-blur-[1.5px]">
    <span
      className="inline-flex items-center gap-2 rounded-[var(--r-pill)] border border-[var(--line)] bg-[var(--paper)] px-3 py-1.5 text-[var(--ink-mute)] shadow-[var(--shadow-sm)]"
      style={{
        fontSize: "11px",
        fontWeight: 500,
        fontFamily: "var(--font-sans)",
      }}
    >
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--c-honey)]" />
      {label}
    </span>
  </div>
);

export default SubjectMatterDashboard;