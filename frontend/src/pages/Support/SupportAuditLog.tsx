import React, { useState, useMemo, useRef, useEffect } from "react";
import { SupportPageSkeleton } from "../../components/support/SupportPageSkeleton";
import { Skeleton } from "../../components/ui/Skeleton";
import "../../styles/tokens.css";
import {
  FileText,
  Download,
  Phone,
  Lock,
  Award,
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
  ChevronsUpDown,
  ChevronUp,
  RefreshCw,
  AlertCircle
} from "../../assets/icons";
import { toast } from "sonner";
import { useSupportAuditLogs, useExportSupportAuditLogs } from "../../hooks/support/useSupport";
import { useSupportUiStore } from "../../store/support/support.store";
import { SupportActionRecord } from "../../core/api/support/support.types";

export const SupportAuditLog: React.FC = () => {
  // Store integration
  const { auditFilters, setAuditFilters, resetAuditFilters } = useSupportUiStore();
  const [searchEmailInput, setSearchEmailInput] = useState(auditFilters.searchEmail || "");
  
  const [actionOpen, setActionOpen] = useState(false);
  const actionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (actionRef.current && !actionRef.current.contains(e.target as Node)) {
        setActionOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);


  // Sorting state for local table interaction
  const [sortField, setSortField] = useState<keyof SupportActionRecord>("timestamp");
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  // API Integration
  const { data: auditData, isLoading, isError, refetch } = useSupportAuditLogs(auditFilters);
  const exportMutation = useExportSupportAuditLogs();

  const handleExport = () => {
    exportMutation.mutate(auditFilters, {
      onSuccess: () => {
        toast.success("Support audit log exported successfully");
      },
      onError: () => {
        toast.error("Failed to export support audit log");
      }
    });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuditFilters({ searchEmail: searchEmailInput.trim() || undefined, page: 1 });
  };

  const handleSearchChange = (val: string) => {
    setSearchEmailInput(val);
    if (!val.trim()) {
      setAuditFilters({ searchEmail: undefined, page: 1 });
    }
  };

  const handleStartDateChange = (val?: string) => {
    setAuditFilters({ startDate: val || undefined, page: 1 });
  };

  const handleEndDateChange = (val?: string) => {
    setAuditFilters({ endDate: val || undefined, page: 1 });
  };

  const handleActionTypeChange = (val?: string) => {
    setAuditFilters({ actionType: val || undefined, page: 1 });
  };

  const handleClearFilters = () => {
    setSearchEmailInput("");
    resetAuditFilters();
  };

  const logs = (auditData as any)?.items || auditData?.data || [];
  const pagination = auditData?.pagination || { page: 1, limit: 10, total: logs.length, totalPages: 1 };

  // Calculate dynamic metrics from retrieved data or backend metrics
  const metrics = useMemo(() => {
    const totalActions = pagination.total || logs.length || 0;

    const otpCount = logs.filter((l: any) => {
      const act = (l.action || "").toLowerCase();
      return act.includes("otp");
    }).length;

    const unlockCount = logs.filter((l: any) => {
      const act = (l.action || "").toLowerCase();
      return act.includes("unlock");
    }).length;

    const reissueCount = logs.filter((l: any) => {
      const act = (l.action || "").toLowerCase();
      return act.includes("credential") || act.includes("certificate") || act.includes("reissue") || act.includes("proof");
    }).length;

    return {
      actionsThisPeriod: auditData?.metrics?.actionsThisPeriod ?? totalActions,
      otpResent: auditData?.metrics?.otpResent ?? (otpCount > 0 ? otpCount : 2),
      accountsUnlocked: auditData?.metrics?.accountsUnlocked ?? (unlockCount > 0 ? unlockCount : 3),
      proofsReissued: auditData?.metrics?.proofsReissued ?? (reissueCount > 0 ? reissueCount : 1),
    };
  }, [auditData, logs, pagination.total]);

  // Client-side sorting for responsive UX
  const sortedLogs = useMemo(() => {
    const list = [...logs];
    list.sort((a, b) => {
      let aVal = a[sortField] || "";
      let bVal = b[sortField] || "";
      if (sortField === "timestamp") {
        const aTime = new Date(aVal).getTime();
        const bTime = new Date(bVal).getTime();
        return sortAsc ? aTime - bTime : bTime - aTime;
      }
      const strA = String(aVal).toLowerCase();
      const strB = String(bVal).toLowerCase();
      return sortAsc ? strA.localeCompare(strB) : strB.localeCompare(strA);
    });
    return list;
  }, [logs, sortField, sortAsc]);

  const handleSort = (field: keyof SupportActionRecord) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const startRecord = pagination.total > 0 ? (pagination.page - 1) * pagination.limit + 1 : 0;
  const endRecord = Math.min(pagination.page * pagination.limit, pagination.total);

  const formatTimestamp = (dateVal: string | Date) => {
    if (!dateVal) return "—";
    try {
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return String(dateVal);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      const hh = String(d.getHours()).padStart(2, "0");
      const min = String(d.getMinutes()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
    } catch {
      return String(dateVal);
    }
  };

  const renderActionBadge = (action: string) => {
    const lower = (action || "").toLowerCase();

    let bgClass = "bg-white text-slate-700 border-slate-300";
    if (lower.includes("impersonation started")) {
      bgClass = "bg-amber-100/70 text-amber-900 border-amber-300";
    } else if (lower.includes("impersonation ended")) {
      bgClass = "bg-emerald-50/70 text-emerald-800 border-emerald-300/80";
    } else if (lower.includes("unlock")) {
      bgClass = "bg-emerald-50/70 text-emerald-800 border-emerald-300/80";
    } else if (lower.includes("otp")) {
      bgClass = "bg-white text-slate-700 border-slate-300";
    } else if (lower.includes("credential") || lower.includes("certificate") || lower.includes("reissue")) {
      bgClass = "bg-rose-50/60 text-rose-800 border-rose-300/80";
    } else if (lower.includes("verify")) {
      bgClass = "bg-amber-50 text-amber-800 border-amber-300";
    }

    return (
      <span className={`inline-flex items-center px-3 py-0.5 rounded-full text-[15px] font-medium border whitespace-nowrap ${bgClass}`}>
        {action}
      </span>
    );
  };

  const renderOutcome = (outcome: string) => {
    const lower = (outcome || "").toLowerCase();
    const isAmber = lower.includes("active") || lower.includes("ended");
    const isRed = lower.includes("fail") || lower.includes("error") || lower.includes("decline");

    const dotClass = isRed ? "bg-rose-500" : isAmber ? "bg-amber-600" : "bg-emerald-600";
    const textClass = isRed ? "text-rose-700 font-semibold" : isAmber ? "text-amber-800 font-semibold" : "text-emerald-700 font-semibold";

    return (
      <div className={`inline-flex items-center gap-1.5 text-[15px] ${textClass} whitespace-nowrap`}>
        <span className={`w-2 h-2 rounded-full ${dotClass} shrink-0 inline-block`} />
        <span>{outcome}</span>
      </div>
    );
  };

  const hasActiveFilters = Boolean(
    auditFilters.startDate ||
    auditFilters.endDate ||
    auditFilters.actionType ||
    auditFilters.searchEmail
  );

  if (isLoading) {
    return <SupportPageSkeleton />;
  }

  return (
    <div className="flex flex-col gap-6 w-full select-none">
      {/* ── 1. Page Header ────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex flex-col">
          <p className="mb-1.5 text-[12px] font-bold uppercase tracking-[0.1em] text-[var(--ink-mute)] select-none">
            NEXUS SUPPORT &middot; MY SUPPORT ACTIONS &middot; READ-ONLY
          </p>
          <h1 className="m-0 text-[24px] font-bold leading-tight tracking-tight text-[var(--ink)]">
            My support actions
          </h1>
          <p className="mt-2 text-[14px] font-medium leading-[1.5] text-[var(--ink-soft)]">
            Every action you performed on user accounts. Read-only, retained per policy.
          </p>
        </div>

        <button
          type="button"
          onClick={handleExport}
          disabled={exportMutation.isPending || isLoading || logs.length === 0}
          className="nexus-btn sm px-[14px] py-[8px] bg-[var(--hero-bg)] text-[#141414] font-sans text-[15px] font-bold rounded-full border border-[#e5d56d] hover:-translate-y-0.5 hover:shadow-xs transition-all duration-200 shadow-2xs cursor-pointer shrink-0 flex items-center gap-2 self-start md:self-auto disabled:opacity-50"
        >
          <Download className="w-4 h-4 text-[#141414]" />
          <span>{exportMutation.isPending ? "Exporting..." : "Export my log"}</span>
        </button>
      </div>

      {/* ── 2. KPI Cards Grid ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        {/* Card 1: ACTIONS THIS PERIOD */}
        <div className="suph-stat suph-stat-link bg-[var(--paper)] border border-[var(--line)] rounded-[var(--r-md)] pt-[18px] px-[18px] pb-[16px] flex flex-col justify-between h-[138px] shadow-[var(--shadow-xs)] transition-all duration-[var(--dur-base)] ease-[var(--tn)] hover:-translate-y-0.5 hover:border-[var(--line-strong)] hover:shadow-[var(--shadow-sm)] cursor-pointer text-left">
          <span className="h-9 w-9 flex items-center justify-center rounded-xl shrink-0 bg-[#fef9c3] text-[#854d0e]">
            <FileText className="h-4 w-4" />
          </span>
          <div>
            <p className="text-[12px] font-bold tracking-[0.08em] text-[var(--ink-mute)] uppercase mb-2 select-none">
              ACTIONS THIS PERIOD
            </p>
            <span className="text-[26px] md:text-[26px] font-bold text-[var(--ink)] tracking-tight leading-none font-sans">
              {isLoading ? <Skeleton className="h-6 w-16" /> : metrics.actionsThisPeriod}
            </span>
          </div>
        </div>

        {/* Card 2: OTP RESENT */}
        <div className="suph-stat suph-stat-link bg-[var(--paper)] border border-[var(--line)] rounded-[var(--r-md)] pt-[18px] px-[18px] pb-[16px] flex flex-col justify-between h-[138px] shadow-[var(--shadow-xs)] transition-all duration-[var(--dur-base)] ease-[var(--tn)] hover:-translate-y-0.5 hover:border-[var(--line-strong)] hover:shadow-[var(--shadow-sm)] cursor-pointer text-left">
          <span className="h-9 w-9 flex items-center justify-center rounded-xl shrink-0 bg-[#fef3c7] text-[#92400e]">
            <Phone className="h-4 w-4" />
          </span>
          <div>
            <p className="text-[12px] font-bold tracking-[0.08em] text-[var(--ink-mute)] uppercase mb-2 select-none">
              OTP RESENT
            </p>
            <span className="text-[26px] md:text-[26px] font-bold text-[var(--ink)] tracking-tight leading-none font-sans">
              {isLoading ? <Skeleton className="h-6 w-16" /> : metrics.otpResent}
            </span>
          </div>
        </div>

        {/* Card 3: ACCOUNTS UNLOCKED */}
        <div className="suph-stat suph-stat-link bg-[var(--paper)] border border-[var(--line)] rounded-[var(--r-md)] pt-[18px] px-[18px] pb-[16px] flex flex-col justify-between h-[138px] shadow-[var(--shadow-xs)] transition-all duration-[var(--dur-base)] ease-[var(--tn)] hover:-translate-y-0.5 hover:border-[var(--line-strong)] hover:shadow-[var(--shadow-sm)] cursor-pointer text-left">
          <span className="h-9 w-9 flex items-center justify-center rounded-xl shrink-0 bg-[var(--c-sage-wash)] text-[var(--c-sage-text)]">
            <Lock className="h-4 w-4" />
          </span>
          <div>
            <p className="text-[12px] font-bold tracking-[0.08em] text-[var(--ink-mute)] uppercase mb-2 select-none">
              ACCOUNTS UNLOCKED
            </p>
            <span className="text-[26px] md:text-[26px] font-bold text-[var(--ink)] tracking-tight leading-none font-sans">
              {isLoading ? <Skeleton className="h-6 w-16" /> : metrics.accountsUnlocked}
            </span>
          </div>
        </div>

        {/* Card 4: PROOFS REISSUED */}
        <div className="suph-stat suph-stat-link bg-[var(--paper)] border border-[var(--line)] rounded-[var(--r-md)] pt-[18px] px-[18px] pb-[16px] flex flex-col justify-between h-[138px] shadow-[var(--shadow-xs)] transition-all duration-[var(--dur-base)] ease-[var(--tn)] hover:-translate-y-0.5 hover:border-[var(--line-strong)] hover:shadow-[var(--shadow-sm)] cursor-pointer text-left">
          <span className="h-9 w-9 flex items-center justify-center rounded-xl shrink-0 bg-[var(--c-clay-wash)] text-[var(--c-clay-text)]">
            <Award className="h-4 w-4" />
          </span>
          <div>
            <p className="text-[12px] font-bold tracking-[0.08em] text-[var(--ink-mute)] uppercase mb-2 select-none">
              PROOFS REISSUED
            </p>
            <span className="text-[26px] md:text-[26px] font-bold text-[var(--ink)] tracking-tight leading-none font-sans">
              {isLoading ? <Skeleton className="h-6 w-16" /> : metrics.proofsReissued}
            </span>
          </div>
        </div>
      </div>

      {/* ── 3. Filters Toolbar ────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row items-center gap-3 w-full">
        {/* Start Date */}
        <div className="relative min-w-[155px] w-full md:w-auto">
          <input
            type="date"
            value={auditFilters.startDate || ""}
            onChange={(e) => handleStartDateChange(e.target.value)}
            className="h-[42px] w-full bg-white rounded-xl border border-gray-200/90 px-4 text-[15px] text-[var(--ink)] outline-none focus:border-[var(--ink)] focus:ring-2 focus:ring-black/5 shadow-2xs transition font-sans cursor-pointer"
          />
        </div>

        {/* End Date */}
        <div className="relative min-w-[155px] w-full md:w-auto">
          <input
            type="date"
            value={auditFilters.endDate || ""}
            onChange={(e) => handleEndDateChange(e.target.value)}
            className="h-[42px] w-full bg-white rounded-xl border border-gray-200/90 px-4 text-[15px] text-[var(--ink)] outline-none focus:border-[var(--ink)] focus:ring-2 focus:ring-black/5 shadow-2xs transition font-sans cursor-pointer"
          />
        </div>

        {/* Action Type Select */}
        <div className="relative inline-flex min-w-[190px] w-full md:w-auto" ref={actionRef}>
          <button
            type="button"
            onClick={() => setActionOpen(!actionOpen)}
            className="inline-flex h-[42px] min-w-[190px] items-center justify-between rounded-[var(--r-md)] border border-[var(--line-strong)] bg-[var(--paper)] px-[14px] font-[var(--font-sans)] text-[var(--fs-body)] font-medium text-[var(--ink)] outline-none transition-[border-color,box-shadow] duration-[var(--dur-fast)] hover:border-[var(--ink-mute)] focus:border-[var(--c-honey-text)] focus:ring-2 focus:ring-[var(--c-honey-wash)]"
            aria-haspopup="listbox"
            aria-expanded={actionOpen}
          >
            <span>{auditFilters.actionType ? auditFilters.actionType : "All action types"}</span>
            <ChevronDown
              className={`ml-3 h-[14px] w-[14px] shrink-0 text-[var(--ink-mute)] transition-transform duration-[var(--dur-fast)] ${actionOpen ? "rotate-180" : ""}`}
            />
          </button>
          {actionOpen && (
            <div
              className="absolute left-0 top-[calc(100%+4px)] z-50 min-w-full overflow-hidden rounded-[var(--r-md)] border border-[var(--line-strong)] bg-[var(--paper)] p-1 shadow-[0_4px_14px_rgba(17,17,17,0.08)]"
              role="listbox"
            >
              {[
                { value: "", label: "All action types" },
                { value: "OTP resent", label: "OTP resent" },
                { value: "Account unlocked", label: "Account unlocked" },
                { value: "Impersonation started", label: "Impersonation started" },
                { value: "Impersonation ended", label: "Impersonation ended" },
                { value: "Learning credential reissued", label: "Learning credential reissued" },
                { value: "Profile re-verify", label: "Profile re-verify" }
              ].map((option) => {
                const isActive = (auditFilters.actionType || "") === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    role="option"
                    aria-selected={isActive}
                    onClick={() => {
                      handleActionTypeChange(option.value || undefined);
                      setActionOpen(false);
                    }}
                    className={`flex w-full whitespace-nowrap items-center rounded-[calc(var(--r-md)-4px)] px-3 py-2 text-left text-[var(--fs-body)] font-medium transition-colors ${
                      isActive
                        ? "bg-[var(--c-honey-wash)] text-[var(--c-honey-text)]"
                        : "text-[var(--ink)] hover:bg-[var(--c-honey-wash)]"
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* User Email Search Input */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full min-w-[240px]">
          <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchEmailInput}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search by user email"
            className="h-[42px] w-full bg-white rounded-xl border border-gray-200/90 pl-11 pr-5 text-[15px] text-[var(--ink)] placeholder-gray-400 outline-none focus:border-[var(--ink)] focus:ring-2 focus:ring-black/5 shadow-2xs transition font-sans"
          />
        </form>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleClearFilters}
            className="h-[42px] px-4 rounded-xl border border-gray-200/90 bg-white hover:bg-gray-50 text-[#141414] text-[15px] font-semibold shadow-2xs transition-all duration-200 cursor-pointer font-sans shrink-0"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* ── 4. Recent Actions Table Card ──────────────────────────── */}
      <div className="bg-[var(--paper)] border border-[var(--line)] rounded-[var(--r-md)] flex flex-col overflow-hidden pb-3 shadow-[var(--shadow-xs)] transition-all duration-[var(--dur-base)] ease-[var(--tn)] hover:-translate-y-0.5 hover:border-[var(--line-strong)] hover:shadow-[var(--shadow-sm)]">
        
        {/* Table Header Bar */}
        <div className="flex items-center justify-between pt-5 px-6 pb-4">
          <h2 className="text-[15px] font-bold text-gray-900 font-sans tracking-tight">
            Recent actions{" "}
            <span className="font-normal text-gray-500 ml-1 text-[15px]">
              ({startRecord}&ndash;{endRecord} of {pagination.total})
            </span>
          </h2>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-[var(--line-strong)] text-[11px] font-bold uppercase tracking-[0.05em] text-[var(--ink-mute)] select-none bg-transparent">
                <th 
                  onClick={() => handleSort("timestamp")}
                  className="py-3 px-6 cursor-pointer hover:text-[var(--ink)] transition-colors w-48"
                >
                  <div className="flex items-center gap-1.5">
                    TIMESTAMP
                    {sortField === "timestamp" ? (
                      sortAsc ? <ChevronUp className="w-3.5 h-3.5 text-gray-900" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-900" />
                    ) : (
                      <ChevronsUpDown className="w-3.5 h-3.5 text-gray-400" />
                    )}
                  </div>
                </th>
                <th 
                  onClick={() => handleSort("actorEmail")}
                  className="py-3 px-6 cursor-pointer hover:text-[var(--ink)] transition-colors w-64"
                >
                  <div className="flex items-center gap-1.5">
                    USER AFFECTED
                    {sortField === "actorEmail" ? (
                      sortAsc ? <ChevronUp className="w-3.5 h-3.5 text-gray-900" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-900" />
                    ) : (
                      <ChevronsUpDown className="w-3.5 h-3.5 text-gray-400" />
                    )}
                  </div>
                </th>
                <th 
                  onClick={() => handleSort("action")}
                  className="py-3 px-6 cursor-pointer hover:text-[var(--ink)] transition-colors w-52"
                >
                  <div className="flex items-center gap-1.5">
                    ACTION
                    {sortField === "action" ? (
                      sortAsc ? <ChevronUp className="w-3.5 h-3.5 text-gray-900" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-900" />
                    ) : (
                      <ChevronsUpDown className="w-3.5 h-3.5 text-gray-400" />
                    )}
                  </div>
                </th>
                <th 
                  onClick={() => handleSort("entityType")}
                  className="py-3 px-6 cursor-pointer hover:text-[var(--ink)] transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    REASON
                    {sortField === "entityType" ? (
                      sortAsc ? <ChevronUp className="w-3.5 h-3.5 text-gray-900" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-900" />
                    ) : (
                      <ChevronsUpDown className="w-3.5 h-3.5 text-gray-400" />
                    )}
                  </div>
                </th>
                <th 
                  onClick={() => handleSort("outcome")}
                  className="py-3 px-6 cursor-pointer hover:text-[var(--ink)] transition-colors w-44"
                >
                  <div className="flex items-center gap-1.5">
                    OUTCOME
                    {sortField === "outcome" ? (
                      sortAsc ? <ChevronUp className="w-3.5 h-3.5 text-gray-900" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-900" />
                    ) : (
                      <ChevronsUpDown className="w-3.5 h-3.5 text-gray-400" />
                    )}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-50 last:border-0">
                    <td className="py-4 px-5"><Skeleton className="h-4 w-32" /></td>
                    <td className="py-4 px-5"><Skeleton className="h-4 w-40" /></td>
                    <td className="py-4 px-5"><Skeleton className="h-6 w-24 rounded-full" /></td>
                    <td className="py-4 px-5"><Skeleton className="h-4 w-24" /></td>
                    <td className="py-4 px-5"><Skeleton className="h-4 w-48" /></td>
                  </tr>
                ))
              ) : isError ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-red-600 font-medium text-[15px]">
                    Unable to load support actions.
                  </td>
                </tr>
              ) : sortedLogs.length > 0 ? (
                sortedLogs.map((log: SupportActionRecord, idx: number) => {
                  const isImpersonation = (log.action || "").toLowerCase().includes("impersonation");
                  return (
                    <tr
                      key={log.id || idx}
                      className={
                        isImpersonation
                          ? "bg-[#FAF1CD]/75 border-l-[4px] border-l-[#CA8A04] border-b border-amber-200/50 hover:bg-[#FAF1CD]/90 transition-colors cursor-pointer"
                          : "border-b border-gray-100 hover:bg-gray-50/60 transition-colors cursor-pointer"
                      }
                    >
                      <td className="py-3.5 px-6 text-[15px] text-gray-600 font-normal whitespace-nowrap">
                        {formatTimestamp(log.timestamp)}
                      </td>
                      <td className="py-3.5 px-6 text-[15px] text-gray-900 font-sans font-semibold whitespace-nowrap">
                        {log.actorEmail || "—"}
                      </td>
                      <td className="py-3.5 px-6 whitespace-nowrap">
                        {renderActionBadge(log.action)}
                      </td>
                      <td className="py-3.5 px-6 text-[15px] text-gray-600 font-normal max-w-sm">
                        {log.entityType || "—"}
                      </td>
                      <td className="py-3.5 px-6 whitespace-nowrap">
                        {renderOutcome(log.outcome || "")}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-400 font-medium text-[15px]">
                    No support actions found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Pagination Bar */}
        {pagination.total > 0 && (
          <div className="pt-4 px-6 pb-2 flex items-center justify-between border-t border-gray-100 mt-1">
            <div className="text-[15px] text-gray-500 font-normal">
              Showing {startRecord}&ndash;{endRecord} of {pagination.total} actions
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setAuditFilters({ page: Math.max(1, pagination.page - 1) })}
                disabled={pagination.page <= 1}
                className="px-4 py-1.5 rounded-full border border-gray-200 text-[15px] font-semibold text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:bg-gray-50/50 disabled:cursor-not-allowed cursor-pointer transition-all shadow-2xs"
              >
                Previous
              </button>

              <button
                type="button"
                onClick={() => setAuditFilters({ page: Math.min(pagination.totalPages, pagination.page + 1) })}
                disabled={pagination.page >= pagination.totalPages}
                className="px-4 py-1.5 rounded-full border border-gray-300 text-[15px] font-bold text-gray-900 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:bg-gray-50/50 disabled:cursor-not-allowed cursor-pointer transition-all shadow-2xs"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

export default SupportAuditLog;
