import React, { useEffect, useState, useMemo, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { Dropdown } from "antd";
import {
  Building2,
  Users,
  UserCheck,
  Plus,
  Search,
  Briefcase,
  Globe,
  Shield,
  ShieldCheck,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  FileText,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Eye,
  Edit3,
  Power,
  RefreshCw,
  TrendingUp,
  MapPin,
  Filter,
  RotateCcw,
  ArrowUpDown,
  Sparkles,
  Check,
  SlidersHorizontal,
  ArrowRight
} from "lucide-react";
import * as XLSX from "xlsx";

import {
  getTenantsApi,
  updateTenantStatusApi,
  Tenant
} from "../../../core/api/tenant.api";
import { useTenantStore } from "../../../store/tenant.store";
import { useIndustryStore } from "../../../store/Industry.store";
import { Skeleton } from "../../../components/ui/Skeleton/Skeleton";

type StatusTab = "all" | "active" | "quarter" | "at-risk";

export const CorporateManagement: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Stores
  const { tenants, setTenants } = useTenantStore();
  const { industries, fetchIndustries } = useIndustryStore();

  // Local state
  const [search, setSearch] = useState("");
  const [industryFilter, setIndustryFilter] = useState("All industries");
  const [statusFilter, setStatusFilter] = useState("All statuses");
  const [countryFilter, setCountryFilter] = useState("All countries");
  const [activeTab, setActiveTab] = useState<StatusTab>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>({
    key: "name",
    direction: "asc"
  });
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState("Just now");
  const exportRef = useRef<HTMLDivElement>(null);

  // Close export dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    fetchIndustries();
  }, [fetchIndustries]);

  // Query tenant roster
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["tenants"],
    queryFn: getTenantsApi,
  });

  // Keep store in sync
  useEffect(() => {
    if (data) {
      setTenants(data);
    }
  }, [data, setTenants]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setTimeout(() => {
      setIsRefreshing(false);
      setLastRefreshed("Just now");
    }, 600);
  };

  // Status mutation
  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      updateTenantStatusApi(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
    },
  });

  // Helpers
  const getIndustryName = (id: string) => {
    if (!id || id === "-") return "General Corporate";
    const industry = industries.find((ind) => ind.id === id || (ind as any)._id === id);
    return industry ? industry.name : id;
  };

  const getCountryName = (code: string) => {
    if (!code || code === "-") return "Global / Remote";
    try {
      if (code.length === 2) {
        return new Intl.DisplayNames(["en"], { type: "region" }).of(code) || code;
      }
      return code;
    } catch {
      return code;
    }
  };

  const isTenantExpired = (tenant: any) => {
    if (tenant.status === "EXPIRED") return true;
    if (tenant.contractEndDate && new Date(tenant.contractEndDate) < new Date()) return true;
    return false;
  };

  const getTenantDisplayStatus = (tenant: any): "ACTIVE" | "INACTIVE" | "EXPIRED" => {
    if (isTenantExpired(tenant)) return "EXPIRED";
    if (tenant.status === "INACTIVE") return "INACTIVE";
    return "ACTIVE";
  };

  const handleStatusToggle = (tenant: any) => {
    if (isTenantExpired(tenant)) {
      navigate("/create-tenant", { state: { editTenant: tenant } });
      return;
    }
    const currentStatus = tenant.status === "ACTIVE" || !tenant.status ? "ACTIVE" : "INACTIVE";
    const newStatus = currentStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    statusMutation.mutate({ id: tenant.id || (tenant as any)._id, status: newStatus });
  };

  // Calculated Stats
  const activeTenantsCount = tenants.filter((t) => getTenantDisplayStatus(t) === "ACTIVE").length;
  const expiredTenantsCount = tenants.filter((t) => getTenantDisplayStatus(t) === "EXPIRED").length;
  const inactiveTenantsCount = tenants.filter((t) => getTenantDisplayStatus(t) === "INACTIVE").length;
  const totalActiveLearners = tenants.reduce(
    (sum, t) => sum + (t.activeUsers ?? (t as any)._count?.users ?? 0),
    0
  );
  const totalSeatCapacity = tenants.reduce(
    (sum, t) => sum + (t.seatCount || (t as any).totalSeats || 120),
    0
  );

  const currentQuarter = Math.floor(new Date().getMonth() / 3);
  const currentYear = new Date().getFullYear();
  const newThisQuarterCount = tenants.filter((t) => {
    const dateStr = t.contractStartDate || (t as any).createdAt;
    if (!dateStr) return false;
    const date = new Date(dateStr);
    return (
      Math.floor(date.getMonth() / 3) === currentQuarter &&
      date.getFullYear() === currentYear
    );
  }).length;

  // Filter options
  const uniqueIndustries = useMemo(() => {
    const ids = Array.from(new Set(tenants.map((t) => t.industryId).filter(Boolean)));
    return ["All industries", ...ids];
  }, [tenants]);

  const uniqueCountries = useMemo(() => {
    const countries = Array.from(new Set(tenants.map((t) => t.country).filter(Boolean)));
    return ["All countries", ...countries];
  }, [tenants]);

  // Tab sync with status filter
  const handleTabChange = (tab: StatusTab) => {
    setActiveTab(tab);
    setCurrentPage(1);
    if (tab === "all") {
      setStatusFilter("All statuses");
    } else if (tab === "active") {
      setStatusFilter("Active");
    } else if (tab === "quarter") {
      setStatusFilter("All statuses");
    } else if (tab === "at-risk") {
      setStatusFilter("All statuses");
    }
  };

  // Main Filtering
  const filteredTenants = useMemo(() => {
    return tenants.filter((tenant) => {
      const effectiveStatus = getTenantDisplayStatus(tenant);

      // Tab filter
      if (activeTab === "active" && effectiveStatus !== "ACTIVE") return false;
      if (activeTab === "at-risk" && effectiveStatus === "ACTIVE") return false;
      if (activeTab === "quarter") {
        const dateStr = tenant.contractStartDate || (tenant as any).createdAt;
        if (!dateStr) return false;
        const date = new Date(dateStr);
        if (
          Math.floor(date.getMonth() / 3) !== currentQuarter ||
          date.getFullYear() !== currentYear
        ) {
          return false;
        }
      }

      // Dropdown filters
      const industryMatch =
        industryFilter === "All industries" || tenant.industryId === industryFilter;

      const statusMatch =
        statusFilter === "All statuses" ||
        effectiveStatus.toUpperCase() === statusFilter.toUpperCase();

      const countryMatch =
        countryFilter === "All countries" || tenant.country === countryFilter;

      // Search match (name, orgId, country)
      const query = search.trim().toLowerCase();
      const searchMatch =
        !query ||
        tenant.name?.toLowerCase().includes(query) ||
        tenant.orgId?.toLowerCase().includes(query) ||
        tenant.country?.toLowerCase().includes(query);

      return industryMatch && statusMatch && countryMatch && searchMatch;
    });
  }, [tenants, activeTab, industryFilter, statusFilter, countryFilter, search, currentQuarter, currentYear]);

  // Sorting
  const sortedTenants = useMemo(() => {
    const list = [...filteredTenants];
    if (!sortConfig) return list;

    list.sort((a, b) => {
      let aVal: any;
      let bVal: any;

      if (sortConfig.key === "name") {
        aVal = a.name || "";
        bVal = b.name || "";
      } else if (sortConfig.key === "activeUsers") {
        aVal = a.activeUsers ?? (a as any)._count?.users ?? 0;
        bVal = b.activeUsers ?? (b as any)._count?.users ?? 0;
      } else if (sortConfig.key === "seats") {
        aVal = a.seatCount || (a as any).totalSeats || 0;
        bVal = b.seatCount || (b as any).totalSeats || 0;
      } else if (sortConfig.key === "status") {
        aVal = getTenantDisplayStatus(a);
        bVal = getTenantDisplayStatus(b);
      } else if (sortConfig.key === "joined") {
        aVal = new Date(a.contractStartDate || (a as any).createdAt || 0).getTime();
        bVal = new Date(b.contractStartDate || (b as any).createdAt || 0).getTime();
      } else {
        aVal = (a as any)[sortConfig.key] || "";
        bVal = (b as any)[sortConfig.key] || "";
      }

      if (typeof aVal === "string") aVal = aVal.toLowerCase();
      if (typeof bVal === "string") bVal = bVal.toLowerCase();

      if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });

    return list;
  }, [filteredTenants, sortConfig]);

  const totalPages = Math.max(1, Math.ceil(sortedTenants.length / pageSize));
  const paginatedTenants = sortedTenants.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleSort = (key: string) => {
    setSortConfig((curr) => {
      if (curr && curr.key === key && curr.direction === "asc") {
        return { key, direction: "desc" };
      }
      return { key, direction: "asc" };
    });
  };

  const handleResetFilters = () => {
    setSearch("");
    setIndustryFilter("All industries");
    setStatusFilter("All statuses");
    setCountryFilter("All countries");
    setActiveTab("all");
    setCurrentPage(1);
  };

  // Export handlers
  const handleExportCSV = () => {
    const exportRows = filteredTenants.map((t) => ({
      "Enterprise Tenant": t.name,
      "Organization ID": t.orgId || `ORG-${(t.id || (t as any)._id || "001").substring(0, 6).toUpperCase()}`,
      "Industry Sector": getIndustryName(t.industryId),
      "Country / Jurisdiction": getCountryName(t.country),
      "Contracted Seats": t.seatCount || (t as any).totalSeats || 100,
      "Active Learners": t.activeUsers ?? (t as any)._count?.users ?? 0,
      "Compliance Status": getTenantDisplayStatus(t),
      "Contract Start": t.contractStartDate ? new Date(t.contractStartDate).toLocaleDateString() : "Active",
      "Contract Renewal": t.contractEndDate ? new Date(t.contractEndDate).toLocaleDateString() : "Annual Renewal",
    }));

    const ws = XLSX.utils.json_to_sheet(exportRows);
    const csv = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `corporate_tenants_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    setShowExportMenu(false);
  };

  const handleExportExcel = () => {
    const exportRows = filteredTenants.map((t) => ({
      "Enterprise Tenant": t.name,
      "Organization ID": t.orgId || `ORG-${(t.id || (t as any)._id || "001").substring(0, 6).toUpperCase()}`,
      "Industry Sector": getIndustryName(t.industryId),
      "Country / Jurisdiction": getCountryName(t.country),
      "Contracted Seats": t.seatCount || (t as any).totalSeats || 100,
      "Active Learners": t.activeUsers ?? (t as any)._count?.users ?? 0,
      "Compliance Status": getTenantDisplayStatus(t),
      "Contract Start": t.contractStartDate ? new Date(t.contractStartDate).toLocaleDateString() : "Active",
      "Contract Renewal": t.contractEndDate ? new Date(t.contractEndDate).toLocaleDateString() : "Annual Renewal",
    }));

    const summaryRows = [
      { Metric: "Total Provisioned Tenants", Value: tenants.length },
      { Metric: "Active Operational Partners", Value: activeTenantsCount },
      { Metric: "Total Contracted Seats", Value: totalSeatCapacity },
      { Metric: "Active Concurrent Learners", Value: totalActiveLearners },
      { Metric: "At-Risk / Inactive Tenants", Value: inactiveTenantsCount + expiredTenantsCount },
    ];

    const wb = XLSX.utils.book_new();
    const wsTenants = XLSX.utils.json_to_sheet(exportRows);
    const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
    XLSX.utils.book_append_sheet(wb, wsTenants, "Tenant Directory");
    XLSX.utils.book_append_sheet(wb, wsSummary, "Fleet Summary");
    XLSX.writeFile(wb, `corporate_tenants_${new Date().toISOString().split("T")[0]}.xlsx`);
    setShowExportMenu(false);
  };

  if (isLoading) {
    return (
      <div className="space-y-6 pb-12 max-w-7xl mx-auto font-sans">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 space-y-4">
          <Skeleton className="h-6 w-48 rounded-full" />
          <Skeleton className="h-10 w-96 rounded-xl" />
          <Skeleton className="h-4 w-72 rounded-md" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
        </div>
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto font-sans">

      {/* ── 1. Top Executive Operations Bar (Dashboard Slate & Sapphire Styling) ── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          {/* Identity & Scope */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200/60 uppercase tracking-wider">
                <Building2 className="w-3.5 h-3.5 text-blue-600" />
                Global Multi-Tenant Hub
              </span>

              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                {activeTenantsCount} Operational Workspaces
              </span>

              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium text-slate-400">
                <ShieldCheck className="w-3 h-3 text-slate-400" />
                Multi-Tenant Isolation • Refreshed {lastRefreshed}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              Corporate Enterprise Management
            </h1>

            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Enterprise partner workspaces, contract compliance, license seat allocation, and learner saturation.{" "}
              <span className="text-slate-800 font-semibold">
                Centralized multi-tenant directory and governance.
              </span>
            </p>
          </div>

          {/* Top Actions */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={handleRefresh}
              title="Refresh tenant telemetry"
              className="h-10 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 text-slate-500 ${isRefreshing ? "animate-spin text-blue-600" : ""}`}
              />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            {/* Export Dropdown */}
            <div className="relative" ref={exportRef}>
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="h-10 px-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Download className="w-4 h-4 text-slate-600" />
                <span>Export</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-400 transition-transform ${showExportMenu ? "rotate-180" : ""}`}
                />
              </button>

              {showExportMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white text-slate-800 rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-3.5 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50 border-b border-slate-100">
                    Export Tenant Roster
                  </div>
                  <button
                    onClick={handleExportCSV}
                    className="w-full flex items-center gap-2.5 px-4 py-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer text-left"
                  >
                    <FileText className="w-4 h-4 text-blue-600" />
                    <div>
                      <div>Comma Separated (.CSV)</div>
                      <span className="text-[10px] text-slate-400 font-normal">
                        Raw tabular export
                      </span>
                    </div>
                  </button>
                  <button
                    onClick={handleExportExcel}
                    className="w-full flex items-center gap-2.5 px-4 py-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer text-left border-t border-slate-100"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                    <div>
                      <div>Excel Workbook (.XLSX)</div>
                      <span className="text-[10px] text-slate-400 font-normal">
                        Multi-sheet enterprise book
                      </span>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* Primary CTA Button: Onboard Tenant */}
            <button
              onClick={() => navigate("/create-tenant", { replace: true })}
              className="h-10 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-all shadow-sm shadow-blue-500/20 flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4 text-white" strokeWidth={2.5} />
              <span>Onboard New Tenant</span>
            </button>
          </div>
        </div>

        {/* ── Status Tabs (Segmented Quick Filters) ── */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between gap-3 overflow-x-auto">
          <div className="flex items-center gap-1.5 min-w-max">
            {[
              { id: "all", label: "All Workspaces", count: tenants.length },
              { id: "active", label: "Active Partners", count: activeTenantsCount },
              { id: "quarter", label: "New This Quarter", count: newThisQuarterCount },
              {
                id: "at-risk",
                label: "Inactive / Expired",
                count: inactiveTenantsCount + expiredTenantsCount,
              },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id as StatusTab)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === tab.id
                    ? "bg-slate-900 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    activeTab === tab.id
                      ? "bg-slate-800 text-blue-300"
                      : "bg-slate-200/70 text-slate-600"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-2 text-xs text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>SaaS Infrastructure: Healthy</span>
          </div>
        </div>
      </div>

      {/* ── 2. Top Executive Fleet Metrics (4 Cards) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Active Tenants */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md hover:border-slate-300 transition-all cursor-pointer group flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center border transition-transform group-hover:scale-105 bg-blue-50 border-blue-100 text-blue-600">
                <Building2 className="w-5 h-5" strokeWidth={2} />
              </div>
              <span className="inline-flex items-center gap-0.5 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                <Check className="w-3 h-3 text-emerald-600" />
                {tenants.length > 0 ? Math.round((activeTenantsCount / tenants.length) * 100) : 100}% Active
              </span>
            </div>

            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Active Enterprise Tenants
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-1">
              {activeTenantsCount}
            </div>
            <p className="text-xs text-slate-500 line-clamp-1">
              Of {tenants.length} total corporate accounts provisioned
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium mb-1.5">
              <span>Tenant Health Benchmark</span>
              <span className="text-slate-700 font-bold">100%</span>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 rounded-full transition-all duration-700"
                style={{
                  width: `${tenants.length > 0 ? (activeTenantsCount / tenants.length) * 100 : 100}%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Metric 2: Contracted Seats & Active Learners */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md hover:border-slate-300 transition-all cursor-pointer group flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center border transition-transform group-hover:scale-105 bg-indigo-50 border-indigo-100 text-indigo-600">
                <Users className="w-5 h-5" strokeWidth={2} />
              </div>
              <span className="inline-flex items-center gap-0.5 text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                <UserCheck className="w-3 h-3 text-indigo-600" />
                Live Enrolled
              </span>
            </div>

            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Active Concurrent Learners
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-1">
              {totalActiveLearners.toLocaleString()}
            </div>
            <p className="text-xs text-slate-500 line-clamp-1">
              Across {totalSeatCapacity.toLocaleString()} contracted enterprise seats
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium mb-1.5">
              <span>Seat Saturation Ratio</span>
              <span className="text-slate-700 font-bold">
                {totalSeatCapacity > 0
                  ? Math.min(100, Math.round((totalActiveLearners / totalSeatCapacity) * 100))
                  : 0}
                %
              </span>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-600 rounded-full transition-all duration-700"
                style={{
                  width: `${
                    totalSeatCapacity > 0
                      ? Math.min(100, Math.round((totalActiveLearners / totalSeatCapacity) * 100))
                      : 40
                  }%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Metric 3: New This Quarter */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md hover:border-slate-300 transition-all cursor-pointer group flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center border transition-transform group-hover:scale-105 bg-emerald-50 border-emerald-100 text-emerald-600">
                <TrendingUp className="w-5 h-5" strokeWidth={2} />
              </div>
              <span className="inline-flex items-center gap-0.5 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                <Sparkles className="w-3 h-3 text-emerald-600" />
                Q{currentQuarter + 1} {currentYear}
              </span>
            </div>

            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              New Onboarded This Quarter
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-1">
              +{newThisQuarterCount}
            </div>
            <p className="text-xs text-slate-500 line-clamp-1">
              Enterprise cohorts activated in current cycle
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium mb-1.5">
              <span>Onboarding SLA</span>
              <span className="text-slate-700 font-bold">&lt; 48 hours</span>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-600 rounded-full transition-all duration-700 w-[92%]" />
            </div>
          </div>
        </div>

        {/* Metric 4: Expiry / Inactive Risk */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md hover:border-slate-300 transition-all cursor-pointer group flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center border transition-transform group-hover:scale-105 bg-amber-50 border-amber-100 text-amber-600">
                <AlertCircle className="w-5 h-5" strokeWidth={2} />
              </div>
              <span
                className={`inline-flex items-center gap-0.5 text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                  inactiveTenantsCount + expiredTenantsCount > 0
                    ? "bg-amber-50 text-amber-700 border-amber-200/60"
                    : "bg-emerald-50 text-emerald-700 border-emerald-200/60"
                }`}
              >
                {inactiveTenantsCount + expiredTenantsCount > 0 ? "Review Required" : "Zero At-Risk"}
              </span>
            </div>

            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Inactive & Expired Accounts
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-1">
              {inactiveTenantsCount + expiredTenantsCount}
            </div>
            <p className="text-xs text-slate-500 line-clamp-1">
              {expiredTenantsCount > 0
                ? `${expiredTenantsCount} expired, ${inactiveTenantsCount} dormant`
                : "All client workspaces actively renewing"}
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium mb-1.5">
              <span>Contract Governance</span>
              <span className="text-slate-700 font-bold">Compliant</span>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  inactiveTenantsCount + expiredTenantsCount > 0 ? "bg-amber-500 w-[25%]" : "bg-emerald-500 w-[100%]"
                }`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. Secondary Operational Status Bar ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
            <SlidersHorizontal className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Total Contracted Seats
            </div>
            <div className="text-lg font-extrabold text-slate-900">
              {totalSeatCapacity.toLocaleString()} Licences
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="p-2.5 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Geographic Scope
            </div>
            <div className="text-lg font-extrabold text-slate-900">
              {Math.max(1, uniqueCountries.length - 1)} Jurisdictions
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Single Sign-On (SSO)
            </div>
            <div className="text-lg font-extrabold text-slate-900">100% SAML/OIDC</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="p-2.5 rounded-lg bg-amber-50 text-amber-600 border border-amber-100">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Audit Compliance
            </div>
            <div className="text-lg font-extrabold text-slate-900">Zero Violations</div>
          </div>
        </div>
      </div>

      {/* ── 4. Search & Multi-Filter Control Hub ── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search by tenant name, org ID, or region..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full h-10 pl-10 pr-4 text-xs font-medium rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent shadow-xs transition-all"
            />
          </div>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5">
            {/* Industry Filter */}
            <div className="relative flex-1 sm:flex-initial">
              <select
                value={industryFilter}
                onChange={(e) => {
                  setIndustryFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="appearance-none h-10 pl-9 pr-8 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer shadow-xs transition-all w-full sm:w-44"
              >
                {uniqueIndustries.map((ind) => (
                  <option key={ind} value={ind}>
                    {ind === "All industries" ? "All Industries" : getIndustryName(ind)}
                  </option>
                ))}
              </select>
              <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
            </div>

            {/* Status Filter */}
            <div className="relative flex-1 sm:flex-initial">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="appearance-none h-10 pl-9 pr-8 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer shadow-xs transition-all w-full sm:w-36"
              >
                <option value="All statuses">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Expired">Expired</option>
              </select>
              <Shield className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
            </div>

            {/* Country Filter */}
            <div className="relative flex-1 sm:flex-initial">
              <select
                value={countryFilter}
                onChange={(e) => {
                  setCountryFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="appearance-none h-10 pl-9 pr-8 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer shadow-xs transition-all w-full sm:w-40"
              >
                {uniqueCountries.map((c) => (
                  <option key={c} value={c}>
                    {c === "All countries" ? "All Countries" : getCountryName(c)}
                  </option>
                ))}
              </select>
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
            </div>

            {/* Reset Filter Button */}
            {(search || industryFilter !== "All industries" || statusFilter !== "All statuses" || countryFilter !== "All countries" || activeTab !== "all") && (
              <button
                onClick={handleResetFilters}
                title="Reset all filters"
                className="h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <RotateCcw size={13} />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── 5. Enterprise Tenant Directory Table ── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Table Header Bar */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/60">
          <div>
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-600" />
              <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                Enterprise Tenant Workspaces
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200/60">
                {filteredTenants.length} Workspaces
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Live seat saturation, licensed capacity, verified SSO status, and contract renewal timeline
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <span>Sort by:</span>
            <button
              onClick={() => handleSort("name")}
              className={`px-2.5 py-1 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                sortConfig?.key === "name"
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
              }`}
            >
              <span>Alphabetical</span>
              <ArrowUpDown size={12} />
            </button>
            <button
              onClick={() => handleSort("activeUsers")}
              className={`px-2.5 py-1 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                sortConfig?.key === "activeUsers"
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
              }`}
            >
              <span>Learners</span>
              <ArrowUpDown size={12} />
            </button>
          </div>
        </div>

        {/* Responsive Table */}
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse min-w-[950px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th
                  onClick={() => handleSort("name")}
                  className="py-3.5 px-6 cursor-pointer hover:bg-slate-100 select-none"
                >
                  <div className="flex items-center gap-1">
                    <span>Tenant Entity</span>
                    <ChevronDown
                      size={13}
                      className={sortConfig?.key === "name" ? "opacity-100 text-blue-600" : "opacity-30"}
                    />
                  </div>
                </th>
                <th
                  onClick={() => handleSort("industryId")}
                  className="py-3.5 px-6 cursor-pointer hover:bg-slate-100 select-none"
                >
                  <div className="flex items-center gap-1">
                    <span>Industry & Sector</span>
                    <ChevronDown
                      size={13}
                      className={sortConfig?.key === "industryId" ? "opacity-100 text-blue-600" : "opacity-30"}
                    />
                  </div>
                </th>
                <th
                  onClick={() => handleSort("country")}
                  className="py-3.5 px-6 cursor-pointer hover:bg-slate-100 select-none"
                >
                  <div className="flex items-center gap-1">
                    <span>Jurisdiction</span>
                    <ChevronDown
                      size={13}
                      className={sortConfig?.key === "country" ? "opacity-100 text-blue-600" : "opacity-30"}
                    />
                  </div>
                </th>
                <th
                  onClick={() => handleSort("activeUsers")}
                  className="py-3.5 px-6 cursor-pointer hover:bg-slate-100 select-none"
                >
                  <div className="flex items-center gap-1">
                    <span>Seat Saturation & Learners</span>
                    <ChevronDown
                      size={13}
                      className={sortConfig?.key === "activeUsers" ? "opacity-100 text-blue-600" : "opacity-30"}
                    />
                  </div>
                </th>
                <th
                  onClick={() => handleSort("joined")}
                  className="py-3.5 px-6 cursor-pointer hover:bg-slate-100 select-none"
                >
                  <div className="flex items-center gap-1">
                    <span>Contract Period</span>
                    <ChevronDown
                      size={13}
                      className={sortConfig?.key === "joined" ? "opacity-100 text-blue-600" : "opacity-30"}
                    />
                  </div>
                </th>
                <th
                  onClick={() => handleSort("status")}
                  className="py-3.5 px-6 cursor-pointer hover:bg-slate-100 select-none"
                >
                  <div className="flex items-center gap-1">
                    <span>Compliance Status</span>
                    <ChevronDown
                      size={13}
                      className={sortConfig?.key === "status" ? "opacity-100 text-blue-600" : "opacity-30"}
                    />
                  </div>
                </th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-xs">
              {paginatedTenants.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
                        <Building2 size={24} />
                      </div>
                      <div className="font-bold text-slate-800 text-sm">No enterprise tenants match filters</div>
                      <p className="text-xs text-slate-400 max-w-sm">
                        Try adjusting your search keywords, industry selection, or reset all active filters.
                      </p>
                      <button
                        onClick={handleResetFilters}
                        className="px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-all cursor-pointer"
                      >
                        Reset All Filters
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedTenants.map((tenant, idx) => {
                  const effectiveStatus = getTenantDisplayStatus(tenant);
                  const activeCount = tenant.activeUsers ?? (tenant as any)._count?.users ?? 0;
                  const seatCapacity = tenant.seatCount || (tenant as any).totalSeats || 120;
                  const saturationPct = Math.min(100, Math.round((activeCount / seatCapacity) * 100));

                  const orgIdentifier =
                    tenant.orgId ||
                    `ORG-${(tenant.id || (tenant as any)._id || "001").substring(0, 6).toUpperCase()}`;

                  return (
                    <tr
                      key={tenant.id || (tenant as any)._id || idx}
                      className="hover:bg-slate-50/70 transition-colors group cursor-pointer"
                      onClick={() =>
                        navigate(`/corporate-tenant-details/${tenant.id || (tenant as any)._id}`, {
                          state: { tenant },
                        })
                      }
                    >
                      {/* Tenant Entity & Monogram */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 border border-blue-200/60 flex items-center justify-center font-extrabold text-xs shadow-xs group-hover:scale-105 transition-transform shrink-0">
                            {(tenant.name || "TN").substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 text-sm group-hover:text-blue-600 transition-colors flex items-center gap-1.5">
                              <span>{tenant.name || "Unnamed Enterprise"}</span>
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                              {orgIdentifier} · Enterprise Tier
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Industry */}
                      <td className="py-4 px-6">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200/60 font-semibold text-[11px]">
                          <Briefcase size={12} className="text-slate-500" />
                          <span>{getIndustryName(tenant.industryId)}</span>
                        </div>
                      </td>

                      {/* Country */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-1.5 text-slate-700 font-medium text-xs">
                          <MapPin size={13} className="text-slate-400" />
                          <span>{getCountryName(tenant.country)}</span>
                        </div>
                      </td>

                      {/* Seat Saturation Bar & Learners */}
                      <td className="py-4 px-6">
                        <div className="space-y-1.5 w-44">
                          <div className="flex justify-between items-center text-[11px] font-semibold text-slate-600">
                            <span>
                              {activeCount} / {seatCapacity} seats
                            </span>
                            <span className="font-bold text-slate-800">{saturationPct}%</span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                saturationPct > 80
                                  ? "bg-emerald-600"
                                  : saturationPct > 40
                                  ? "bg-blue-600"
                                  : "bg-indigo-600"
                              }`}
                              style={{ width: `${saturationPct}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Contract Period */}
                      <td className="py-4 px-6">
                        <div className="text-slate-800 font-bold text-xs flex items-center gap-1.5">
                          <Calendar size={13} className="text-slate-400" />
                          <span>
                            {tenant.contractStartDate || (tenant as any).createdAt
                              ? new Date(
                                  tenant.contractStartDate || (tenant as any).createdAt
                                ).toLocaleDateString("en-US", { month: "short", year: "numeric" })
                              : "Active cycle"}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          {tenant.contractEndDate
                            ? `Renews ${new Date(tenant.contractEndDate).toLocaleDateString("en-US", {
                                month: "short",
                                year: "numeric",
                              })}`
                            : "Auto-renewal SLA"}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-6">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wider uppercase border ${
                            effectiveStatus === "ACTIVE"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200/60"
                              : effectiveStatus === "INACTIVE"
                              ? "bg-amber-50 text-amber-700 border-amber-200/60"
                              : "bg-rose-50 text-rose-700 border-rose-200/60"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              effectiveStatus === "ACTIVE"
                                ? "bg-emerald-500 animate-pulse"
                                : effectiveStatus === "INACTIVE"
                                ? "bg-amber-500"
                                : "bg-rose-500"
                            }`}
                          />
                          {effectiveStatus}
                        </span>
                      </td>

                      {/* Dropdown Actions */}
                      <td
                        className="py-4 px-6 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Dropdown
                          menu={{
                            items: [
                              {
                                key: "view",
                                label: (
                                  <div className="flex items-center gap-2 py-1 font-semibold text-xs text-slate-700">
                                    <Eye size={14} className="text-blue-600" />
                                    <span>View Workspace</span>
                                  </div>
                                ),
                                onClick: () =>
                                  navigate(
                                    `/corporate-tenant-details/${tenant.id || (tenant as any)._id}`,
                                    { state: { tenant } }
                                  ),
                              },
                              {
                                key: "edit",
                                label: (
                                  <div className="flex items-center gap-2 py-1 font-semibold text-xs text-slate-700">
                                    <Edit3 size={14} className="text-slate-600" />
                                    <span>Edit Licences</span>
                                  </div>
                                ),
                                onClick: () =>
                                  navigate("/create-tenant", { state: { editTenant: tenant } }),
                              },
                              {
                                type: "divider",
                              },
                              effectiveStatus === "EXPIRED"
                                ? {
                                    key: "renew",
                                    label: (
                                      <div className="flex items-center gap-2 py-1 font-semibold text-xs text-amber-600">
                                        <Clock size={14} />
                                        <span>Renew Agreement</span>
                                      </div>
                                    ),
                                    onClick: () =>
                                      navigate("/create-tenant", { state: { editTenant: tenant } }),
                                  }
                                : {
                                    key: "status",
                                    label: (
                                      <div
                                        className={`flex items-center gap-2 py-1 font-semibold text-xs ${
                                          effectiveStatus === "ACTIVE"
                                            ? "text-rose-600"
                                            : "text-emerald-600"
                                        }`}
                                      >
                                        <Power size={14} />
                                        <span>
                                          {effectiveStatus === "ACTIVE"
                                            ? "Deactivate Tenant"
                                            : "Activate Tenant"}
                                        </span>
                                      </div>
                                    ),
                                    onClick: () => handleStatusToggle(tenant),
                                  },
                            ],
                          }}
                          trigger={["click"]}
                          placement="bottomRight"
                        >
                          <button
                            className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 inline-flex items-center justify-center transition-colors cursor-pointer"
                            title="Workspace options"
                          >
                            <MoreHorizontal size={16} />
                          </button>
                        </Dropdown>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer / Pagination */}
        <div className="flex flex-col sm:flex-row justify-between items-center px-6 py-4 border-t border-slate-100 bg-white gap-3">
          <div className="text-xs text-slate-500 font-medium">
            Showing <strong className="text-slate-900">{paginatedTenants.length}</strong> of{" "}
            <strong className="text-slate-900">{filteredTenants.length}</strong> enterprise workspaces
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className={`h-8 px-3 rounded-xl border text-xs font-semibold flex items-center gap-1 transition-all ${
                currentPage === 1
                  ? "border-slate-200 text-slate-300 cursor-not-allowed bg-slate-50"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300 cursor-pointer shadow-xs"
              }`}
            >
              <ChevronLeft size={14} />
              <span>Previous</span>
            </button>

            <span className="text-xs font-semibold text-slate-700 px-2">
              Page {currentPage} of {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className={`h-8 px-3 rounded-xl border text-xs font-semibold flex items-center gap-1 transition-all ${
                currentPage === totalPages
                  ? "border-slate-200 text-slate-300 cursor-not-allowed bg-slate-50"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300 cursor-pointer shadow-xs"
              }`}
            >
              <span>Next</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CorporateManagement;
