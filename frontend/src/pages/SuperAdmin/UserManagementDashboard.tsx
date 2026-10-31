import * as React from "react";
import { useState, useMemo, useRef, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  Users,
  UserCheck,
  UserX,
  Mail,
  Shield,
  ShieldCheck,
  ShieldAlert,
  GraduationCap,
  Clock,
  Search,
  Filter,
  Download,
  FileSpreadsheet,
  FileText,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Eye,
  Lock,
  Power,
  Trash2,
  RefreshCw,
  SlidersHorizontal,
  RotateCcw,
  CheckCircle2,
  Check,
  ArrowUpDown,
  Building2,
  Briefcase
} from "lucide-react";
import { Dropdown } from "antd";
import * as XLSX from "xlsx";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTenantUserFilters } from "../../hooks/tenant-user/useTenantUser";
import {
  getInternalUsers,
  activateInternalUser,
  deactivateInternalUser,
  suspendInternalUser,
  deleteInternalUser,
} from "../../core/api/internal-user/internalUser.api";
import { toast } from "sonner";
import { useTenantUserUiStore } from "../../store/tenantUserUi.store";
import UserDetailView from "./UserDetailView";
import SuspensionPage from "./suspension";
import { UserLifecycleAPI } from "../../core/api/user-lifecycle.api";
import { Skeleton } from "../../components/ui/Skeleton/Skeleton";

export enum UserStatus {
  INVITED = "INVITED",
  PENDING = "PENDING",
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  SUSPENDED = "SUSPENDED",
  DELETED = "DELETED",
  PURGED = "PURGED",
}

// ---------------------------------------------------------
// Helper: Get user personas
// ---------------------------------------------------------
export function getUserPersonas(user: any): string[] {
  const roles: string[] = [];
  const upperRoles = user.roles?.map((r: string) => r.toUpperCase()) || [];

  if (upperRoles.includes("SUPER_ADMIN") || upperRoles.includes("SUPER ADMIN")) {
    roles.push("Super Admin");
  }

  if (upperRoles.includes("SME")) {
    roles.push("SME");
  }

  if (
    upperRoles.includes("CONTENT_DEVELOPER") ||
    upperRoles.includes("CONTENT DEVELOPER")
  ) {
    roles.push("Content Developer");
  }

  if (
    roles.length === 0 ||
    upperRoles.includes("MEMBER") ||
    upperRoles.includes("LEARNER") ||
    upperRoles.includes("CORPORATE_USER") ||
    upperRoles.includes("CORPORATE USER")
  ) {
    roles.push("Member");
  }

  return roles;
}

// ---------------------------------------------------------
// Persona Pill Badges (Exact Slate/Sapphire System)
// ---------------------------------------------------------
function PersonaPills({ personas }: { personas: string[] }) {
  return (
    <div className="flex flex-row flex-wrap items-center gap-1.5">
      {personas.map((persona) => {
        if (persona === "Learner / Member") {
          return (
            <span
              key={persona}
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200/60"
            >
              <Users size={11} className="text-slate-500" />
              <span>{persona}</span>
            </span>
          );
        }

        if (persona.includes("Corporate Admin")) {
          return (
            <span
              key={persona}
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/60"
            >
              <ShieldCheck size={11} className="text-indigo-600" />
              <span>{persona}</span>
            </span>
          );
        }

        if (persona.includes("Corporate User")) {
          return (
            <span
              key={persona}
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/60"
            >
              <Building2 size={11} className="text-blue-600" />
              <span>{persona}</span>
            </span>
          );
        }

        if (persona.includes("SME") || persona.includes("Content Developer")) {
          return (
            <span
              key={persona}
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-semibold bg-violet-50 text-violet-700 border border-violet-200/60"
            >
              <Briefcase size={11} className="text-violet-600" />
              <span>{persona}</span>
            </span>
          );
        }

        return (
          <span
            key={persona}
            className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200/60"
          >
            {persona}
          </span>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------
// User Management Dashboard Component
// ---------------------------------------------------------
export default function UserManagementDashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [suspendUserId, setSuspendUserId] = useState<string | null>(null);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
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

  // -------------------------------------------------------
  // Fetch users
  // -------------------------------------------------------
  const { data: rawUsers = [], isLoading, refetch } = useQuery({
    queryKey: ["internal-users-all"],
    queryFn: () =>
      getInternalUsers({
        limit: 200,
      }),
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setTimeout(() => {
      setIsRefreshing(false);
      setLastRefreshed("Just now");
    }, 600);
  };

  // -------------------------------------------------------
  // Prepare users (Exclude pure admin users)
  // -------------------------------------------------------
  const allUsers = useMemo(() => {
    return rawUsers
      .filter((user) => {
        if (!user.roles || user.roles.length === 0) {
          return true;
        }

        const upperRoles = user.roles.map((role: string) => role.toUpperCase());

        // Exclude system super admin users
        if (
          upperRoles.includes("ADMIN") ||
          upperRoles.includes("CORPORATE_ADMIN") ||
          upperRoles.includes("SME") ||
          upperRoles.includes("CONTENT_DEVELOPER") ||
          upperRoles.includes("CONTENT DEVELOPER")
        ) {
          return false;
        }

        return upperRoles.some(
          (role: string) =>
            role === "MEMBER" ||
            role === "CORPORATE_USER" ||
            role === "CORPORATE USER"
        );
      })
      .map((user) => ({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        status: user.status,
        roles: user.roles || [],
        department: (user as any).department,
        lastLogin: user.lastLogin,
        courseCompleted: (user as any).courseCompleted ?? 0,
      }));
  }, [rawUsers]);

  // -------------------------------------------------------
  // Pagination / Store Filters
  // -------------------------------------------------------
  const {
    paginatedUsers: users,
    totalItems,
    totalPages,
  } = useTenantUserFilters(allUsers as any);

  const {
    search,
    personaFilters,
    statusFilters,
    page,
    pageSize,
    setSearch,
    togglePersona,
    toggleStatus,
    setStatusFilter,
    sortBy,
    sortOrder,
    setSort,
    setPage,
  } = useTenantUserUiStore();

  const handleSort = (column: string) => {
    if (sortBy === column) {
      if (sortOrder === "asc") setSort(column, "desc");
      else if (sortOrder === "desc") setSort("", "");
      else setSort(column, "asc");
    } else {
      setSort(column, "asc");
    }
  };

  // -------------------------------------------------------
  // Status Mutation
  // -------------------------------------------------------
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      if (status === "ACTIVE") {
        return activateInternalUser(id);
      }
      if (status === "INACTIVE" || status === "DEACTIVATED") {
        return deactivateInternalUser(id);
      }
      if (status === "SUSPENDED") {
        return suspendInternalUser(id);
      }
      if (status === "DELETED") {
        return deleteInternalUser(id);
      }
      throw new Error(`Status update to ${status} is not supported directly.`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["internal-users-all"],
      });
      toast.success("User status updated successfully");
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || "Failed to update user status"
      );
    },
  });

  const handleStatusChange = (userId: string, newStatus: string) => {
    updateStatusMutation.mutate({
      id: userId,
      status: newStatus,
    });
  };

  // -------------------------------------------------------
  // Dashboard Counts
  // -------------------------------------------------------
  const counts = useMemo(() => {
    let active = 0;
    let suspended = 0;
    let invited = 0;

    allUsers.forEach((user) => {
      const status = (user.status || "ACTIVE").toUpperCase();
      if (status === "ACTIVE") active++;
      else if (status === "SUSPENDED") suspended++;
      else if (status === "INVITED" || status === "PENDING") invited++;
    });

    return {
      total: allUsers.length,
      active,
      suspended,
      invited,
    };
  }, [allUsers]);

  // -------------------------------------------------------
  // Export Suite (CSV & XLSX)
  // -------------------------------------------------------
  const handleExportCSV = () => {
    const usersToExport =
      selectedRows.length > 0
        ? allUsers.filter((u) => selectedRows.includes(u.id as string))
        : allUsers;

    if (usersToExport.length === 0) return;

    const exportRows = usersToExport.map((u) => ({
      ID: u.id,
      "First Name": u.firstName,
      "Last Name": u.lastName,
      Email: u.email,
      Roles: (u.roles || []).join("; "),
      Status: u.status || "ACTIVE",
      Department: (u as any).department || "General",
      "Courses Completed": (u as any).courseCompleted || 0,
      "Last Active": u.lastLogin ? new Date(u.lastLogin).toLocaleString() : "Never",
    }));

    const ws = XLSX.utils.json_to_sheet(exportRows);
    const csv = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const dateStr = new Date().toISOString().split("T")[0];
    const label = selectedRows.length > 0 ? `selected_${selectedRows.length}` : "all";
    link.href = URL.createObjectURL(blob);
    link.download = `registered_learners_${label}_${dateStr}.csv`;
    link.click();
    setShowExportMenu(false);
  };

  const handleExportExcel = () => {
    const usersToExport =
      selectedRows.length > 0
        ? allUsers.filter((u) => selectedRows.includes(u.id as string))
        : allUsers;

    if (usersToExport.length === 0) return;

    const exportRows = usersToExport.map((u) => ({
      ID: u.id,
      "First Name": u.firstName,
      "Last Name": u.lastName,
      Email: u.email,
      Roles: (u.roles || []).join("; "),
      Status: u.status || "ACTIVE",
      Department: (u as any).department || "General",
      "Courses Completed": (u as any).courseCompleted || 0,
      "Last Active": u.lastLogin ? new Date(u.lastLogin).toLocaleString() : "Never",
    }));

    const summaryRows = [
      { Metric: "Total Registered Learners", Value: counts.total },
      { Metric: "Active Verified Learners", Value: counts.active },
      { Metric: "Pending / Invited", Value: counts.invited },
      { Metric: "Suspended / Restricted", Value: counts.suspended },
    ];

    const wb = XLSX.utils.book_new();
    const wsUsers = XLSX.utils.json_to_sheet(exportRows);
    const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
    XLSX.utils.book_append_sheet(wb, wsUsers, "Learner Directory");
    XLSX.utils.book_append_sheet(wb, wsSummary, "Cohort Summary");
    const dateStr = new Date().toISOString().split("T")[0];
    XLSX.writeFile(wb, `registered_learners_${dateStr}.xlsx`);
    setShowExportMenu(false);
  };

  // Reset filters
  const handleResetFilters = () => {
    setSearch("");
    setStatusFilter(null);
    personaFilters.forEach((p) => togglePersona(p));
    setPage(1);
  };

  // -------------------------------------------------------
  // Render sub-views (UserDetailView & SuspensionPage)
  // -------------------------------------------------------
  if (selectedUserId) {
    const selectedUserRecord = allUsers.find((u) => u.id === selectedUserId);
    return (
      <UserDetailView
        onBack={() => setSelectedUserId(null)}
        userId={selectedUserId}
        userType="INTERNAL"
        initialData={selectedUserRecord}
      />
    );
  }

  if (suspendUserId) {
    return (
      <SuspensionPage
        onBack={() => setSuspendUserId(null)}
        userId={suspendUserId}
      />
    );
  }

  // Loading skeleton
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

      {/* ── 1. Top Executive Operations Bar (Dashboard Slate & Sapphire Theme) ── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          {/* Identity & Scope */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200/60 uppercase tracking-wider">
                <Users className="w-3.5 h-3.5 text-blue-600" />
                Global Identity & Directory
              </span>

              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                {counts.active} Verified Learners Active
              </span>

              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium text-slate-400">
                <ShieldCheck className="w-3 h-3 text-slate-400" />
                IdP Synchronized • Refreshed {lastRefreshed}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              Registered Learners & User Directory
            </h1>

            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Enterprise cohort learners, direct members, and corporate account holders.{" "}
              <span className="text-slate-800 font-semibold">
                Centralized credential tracking and identity governance.
              </span>
            </p>
          </div>

          {/* Action Deck */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={handleRefresh}
              title="Refresh learner telemetry"
              className="h-10 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 text-slate-500 ${isRefreshing ? "animate-spin text-blue-600" : ""}`}
              />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            {/* Export Suite */}
            <div className="relative" ref={exportRef}>
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="h-10 px-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Download className="w-4 h-4 text-slate-600" />
                <span>{selectedRows.length > 0 ? `Export (${selectedRows.length})` : "Export Suite"}</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-400 transition-transform ${showExportMenu ? "rotate-180" : ""}`}
                />
              </button>

              {showExportMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white text-slate-800 rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-3.5 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50 border-b border-slate-100">
                    Export Format
                  </div>
                  <button
                    onClick={handleExportCSV}
                    className="w-full flex items-center gap-2.5 px-4 py-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer text-left"
                  >
                    <FileText className="w-4 h-4 text-blue-600" />
                    <div>
                      <div>Comma Separated (.CSV)</div>
                      <span className="text-[10px] text-slate-400 font-normal">
                        Raw tabular learner export
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
                        Multi-tab formatted report
                      </span>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* Quick Access to Deletion Queue */}
            <button
              onClick={() => navigate("/super-admin/deletion-queue")}
              className="h-10 px-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-500" />
              <span>Deletion Queue</span>
            </button>
          </div>
        </div>

        {/* ── Status Tabs (Segmented Quick Filters) ── */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between gap-3 overflow-x-auto">
          <div className="flex items-center gap-1.5 min-w-max">
            {[
              { id: "all", label: "All Users", count: counts.total, filterValue: null },
              { id: "active", label: "Active Learners", count: counts.active, filterValue: "ACTIVE" },
              { id: "invited", label: "Invited / Pending", count: counts.invited, filterValue: "INVITED" },
              { id: "suspended", label: "Suspended / Restricted", count: counts.suspended, filterValue: "SUSPENDED" },
            ].map((tab) => {
              const isSelected =
                (tab.filterValue === null && statusFilters.length === 0) ||
                (tab.filterValue !== null && statusFilters.includes(tab.filterValue));

              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setStatusFilter(tab.filterValue);
                    setPage(1);
                  }}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                    isSelected
                      ? "bg-slate-900 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      isSelected
                        ? "bg-slate-800 text-blue-300"
                        : "bg-slate-200/70 text-slate-600"
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="hidden md:flex items-center gap-2 text-xs text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>IAM Security Service: Healthy</span>
          </div>
        </div>
      </div>

      {/* ── 2. Top Executive Fleet Metrics (4 Cards) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Users */}
        <div
          onClick={() => {
            setStatusFilter(null);
            setPage(1);
          }}
          className={`bg-white rounded-2xl border p-5 shadow-xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between ${
            statusFilters.length === 0 ? "border-blue-600 ring-1 ring-blue-600/30" : "border-slate-200/80"
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center border transition-transform group-hover:scale-105 bg-blue-50 border-blue-100 text-blue-600">
                <Users className="w-5 h-5" strokeWidth={2} />
              </div>
              <span className="inline-flex items-center gap-0.5 text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/60">
                100% Provisioned
              </span>
            </div>

            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Total Registered Users
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-1">
              {counts.total}
            </div>
            <p className="text-xs text-slate-500 line-clamp-1">
              Active across all corporate and direct learning cohorts
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium mb-1.5">
              <span>Directory Provisioning</span>
              <span className="text-slate-700 font-bold">100%</span>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div className="h-full bg-blue-600 rounded-full transition-all duration-700 w-full" />
            </div>
          </div>
        </div>

        {/* Metric 2: Active Learners */}
        <div
          onClick={() => {
            setStatusFilter("ACTIVE");
            setPage(1);
          }}
          className={`bg-white rounded-2xl border p-5 shadow-xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between ${
            statusFilters.includes("ACTIVE") ? "border-emerald-600 ring-1 ring-emerald-600/30" : "border-slate-200/80"
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center border transition-transform group-hover:scale-105 bg-emerald-50 border-emerald-100 text-emerald-600">
                <UserCheck className="w-5 h-5" strokeWidth={2} />
              </div>
              <span className="inline-flex items-center gap-0.5 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                <Check className="w-3 h-3 text-emerald-600" />
                {counts.total > 0 ? Math.round((counts.active / counts.total) * 100) : 100}% Active
              </span>
            </div>

            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Active Concurrent Learners
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-1">
              {counts.active}
            </div>
            <p className="text-xs text-slate-500 line-clamp-1">
              Learners actively progressing in curriculum
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium mb-1.5">
              <span>Account Verification Rate</span>
              <span className="text-slate-700 font-bold">
                {counts.total > 0 ? Math.round((counts.active / counts.total) * 100) : 100}%
              </span>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-600 rounded-full transition-all duration-700"
                style={{
                  width: `${counts.total > 0 ? (counts.active / counts.total) * 100 : 100}%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Metric 3: Invited / Pending */}
        <div
          onClick={() => {
            setStatusFilter("INVITED");
            setPage(1);
          }}
          className={`bg-white rounded-2xl border p-5 shadow-xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between ${
            statusFilters.includes("INVITED") ? "border-amber-600 ring-1 ring-amber-600/30" : "border-slate-200/80"
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center border transition-transform group-hover:scale-105 bg-amber-50 border-amber-100 text-amber-600">
                <Mail className="w-5 h-5" strokeWidth={2} />
              </div>
              <span className="inline-flex items-center gap-0.5 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200/60">
                Pending Onboard
              </span>
            </div>

            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Invited (Pending Activation)
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-1">
              {counts.invited}
            </div>
            <p className="text-xs text-slate-500 line-clamp-1">
              Invitations awaiting first SSO authentication
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium mb-1.5">
              <span>Onboarding SLA</span>
              <span className="text-slate-700 font-bold">Standard</span>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full transition-all duration-700"
                style={{
                  width: `${counts.total > 0 ? (counts.invited / counts.total) * 100 : 0}%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Metric 4: Suspended / Restricted */}
        <div
          onClick={() => {
            setStatusFilter("SUSPENDED");
            setPage(1);
          }}
          className={`bg-white rounded-2xl border p-5 shadow-xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between ${
            statusFilters.includes("SUSPENDED") ? "border-rose-600 ring-1 ring-rose-600/30" : "border-slate-200/80"
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center border transition-transform group-hover:scale-105 bg-rose-50 border-rose-100 text-rose-600">
                <ShieldAlert className="w-5 h-5" strokeWidth={2} />
              </div>
              <span
                className={`inline-flex items-center gap-0.5 text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                  counts.suspended > 0
                    ? "bg-rose-50 text-rose-700 border-rose-200/60"
                    : "bg-emerald-50 text-emerald-700 border-emerald-200/60"
                }`}
              >
                {counts.suspended > 0 ? "Review Access" : "Zero Restricted"}
              </span>
            </div>

            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Suspended & Restricted
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-1">
              {counts.suspended}
            </div>
            <p className="text-xs text-slate-500 line-clamp-1">
              Accounts under disciplinary or compliance lock
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium mb-1.5">
              <span>Security Governance</span>
              <span className="text-slate-700 font-bold">Compliant</span>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  counts.suspended > 0 ? "bg-rose-500 w-[20%]" : "bg-emerald-500 w-[100%]"
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
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Identity Protocol
            </div>
            <div className="text-lg font-extrabold text-slate-900">SAML / Keycloak</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="p-2.5 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Credential Vault
            </div>
            <div className="text-lg font-extrabold text-slate-900">Digital Badges</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Lifecycle Policy
            </div>
            <div className="text-lg font-extrabold text-slate-900">6-Mo Inactivity</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="p-2.5 rounded-lg bg-amber-50 text-amber-600 border border-amber-100">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Privacy Standards
            </div>
            <div className="text-lg font-extrabold text-slate-900">GDPR Compliant</div>
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
              placeholder="Search by learner name, email, department, or ID..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full h-10 pl-10 pr-4 text-xs font-medium rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent shadow-xs transition-all"
            />
          </div>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5">
            {/* Persona / Role Filter */}
            <div className="relative flex-1 sm:flex-initial">
              <select
                value={personaFilters.length === 1 ? personaFilters[0] : ""}
                onChange={(e) => {
                  personaFilters.forEach((p) => {
                    if (p !== e.target.value) togglePersona(p);
                  });
                  if (e.target.value !== "" && !personaFilters.includes(e.target.value)) {
                    togglePersona(e.target.value);
                  }
                  setPage(1);
                }}
                className="appearance-none h-10 pl-9 pr-8 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer shadow-xs transition-all w-full sm:w-48"
              >
                <option value="">All Member Roles</option>
                <option value="Learner / Member">Learner / Member</option>
                <option value="Corporate User">Corporate User</option>
                <option value="Corporate Admin">Corporate Admin</option>
                <option value="SME">SME</option>
                <option value="Content Developer (Moderator)">Content Developer</option>
              </select>
              <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
            </div>

            {/* Status Filter */}
            <div className="relative flex-1 sm:flex-initial">
              <select
                value={statusFilters.length === 1 ? statusFilters[0] : ""}
                onChange={(e) => {
                  statusFilters.forEach((s) => {
                    if (s !== e.target.value) toggleStatus(s);
                  });
                  if (e.target.value !== "" && !statusFilters.includes(e.target.value)) {
                    toggleStatus(e.target.value);
                  }
                  setPage(1);
                }}
                className="appearance-none h-10 pl-9 pr-8 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer shadow-xs transition-all w-full sm:w-36"
              >
                <option value="">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="DEACTIVATED">Deactivated</option>
                <option value="SUSPENDED">Suspended</option>
                <option value="INVITED">Invited</option>
              </select>
              <Shield className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
            </div>

            {/* Reset Filter Button */}
            {(search || personaFilters.length > 0 || statusFilters.length > 0) && (
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

        {/* Bulk Action Bar (when rows selected) */}
        {selectedRows.length > 0 && (
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs bg-blue-50/60 p-2.5 rounded-xl border border-blue-200/60">
            <div className="flex items-center gap-2 text-blue-800 font-bold">
              <span className="w-2 h-2 rounded-full bg-blue-600" />
              <span>{selectedRows.length} users selected</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleExportCSV}
                className="px-3 py-1 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-700 flex items-center gap-1 cursor-pointer"
              >
                <Download size={13} />
                <span>Export Selected</span>
              </button>
              <button
                onClick={() => setSelectedRows([])}
                className="px-2.5 py-1 text-slate-500 hover:text-slate-800 font-semibold cursor-pointer"
              >
                Deselect All
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── 5. Registered Learners Directory Table ── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Table Header Bar */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/60">
          <div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                Registered Learner Profiles
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200/60">
                {totalItems} Profiles
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Multi-tenant learner directory, department allocations, curriculum progress, and account authentication
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <span>Sort by:</span>
            <button
              onClick={() => handleSort("NAME")}
              className={`px-2.5 py-1 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                sortBy === "NAME"
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
              }`}
            >
              <span>Name</span>
              <ArrowUpDown size={12} />
            </button>
            <button
              onClick={() => handleSort("COURSE_COMPLETED")}
              className={`px-2.5 py-1 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                sortBy === "COURSE_COMPLETED"
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
              }`}
            >
              <span>Completions</span>
              <ArrowUpDown size={12} />
            </button>
          </div>
        </div>

        {/* Responsive Table */}
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse min-w-[950px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-4 w-12 text-center">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    checked={users.length > 0 && selectedRows.length === users.length}
                    ref={(input) => {
                      if (input) {
                        input.indeterminate =
                          selectedRows.length > 0 && selectedRows.length < users.length;
                      }
                    }}
                    onChange={() => {
                      if (users.length > 0 && selectedRows.length === users.length) {
                        setSelectedRows([]);
                      } else {
                        setSelectedRows(users.map((u) => u.id as string));
                      }
                    }}
                  />
                </th>

                <th
                  onClick={() => handleSort("NAME")}
                  className="py-3.5 px-6 cursor-pointer hover:bg-slate-100 select-none"
                >
                  <div className="flex items-center gap-1">
                    <span>Learner Entity</span>
                    <ChevronDown
                      size={13}
                      className={sortBy === "NAME" ? "opacity-100 text-blue-600" : "opacity-30"}
                    />
                  </div>
                </th>

                <th
                  onClick={() => handleSort("EMAIL")}
                  className="py-3.5 px-6 cursor-pointer hover:bg-slate-100 select-none"
                >
                  <div className="flex items-center gap-1">
                    <span>Email & ID</span>
                    <ChevronDown
                      size={13}
                      className={sortBy === "EMAIL" ? "opacity-100 text-blue-600" : "opacity-30"}
                    />
                  </div>
                </th>

                <th className="py-3.5 px-6">Member Role / Persona</th>

                <th
                  onClick={() => handleSort("STATUS")}
                  className="py-3.5 px-6 cursor-pointer hover:bg-slate-100 select-none"
                >
                  <div className="flex items-center gap-1">
                    <span>Account Status</span>
                    <ChevronDown
                      size={13}
                      className={sortBy === "STATUS" ? "opacity-100 text-blue-600" : "opacity-30"}
                    />
                  </div>
                </th>

                <th
                  onClick={() => handleSort("COURSE_COMPLETED")}
                  className="py-3.5 px-6 cursor-pointer hover:bg-slate-100 select-none"
                >
                  <div className="flex items-center gap-1">
                    <span>Completed</span>
                    <ChevronDown
                      size={13}
                      className={sortBy === "COURSE_COMPLETED" ? "opacity-100 text-blue-600" : "opacity-30"}
                    />
                  </div>
                </th>

                <th
                  onClick={() => handleSort("LAST_LOGIN")}
                  className="py-3.5 px-6 cursor-pointer hover:bg-slate-100 select-none"
                >
                  <div className="flex items-center gap-1">
                    <span>Last Active</span>
                    <ChevronDown
                      size={13}
                      className={sortBy === "LAST_LOGIN" ? "opacity-100 text-blue-600" : "opacity-30"}
                    />
                  </div>
                </th>

                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-xs">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
                        <Users size={24} />
                      </div>
                      <div className="font-bold text-slate-800 text-sm">No registered users found</div>
                      <p className="text-xs text-slate-400 max-w-sm">
                        No user profiles match the current filter criteria or search keyword.
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
                users.map((user) => {
                  const status = (user.status || "ACTIVE").toUpperCase();
                  const initials = `${(user.firstName?.[0] || "").toUpperCase()}${(
                    user.lastName?.[0] || ""
                  ).toUpperCase()}` || "U";

                  const isChecked = selectedRows.includes(user.id as string);

                  return (
                    <tr
                      key={user.id}
                      className="hover:bg-slate-50/70 transition-colors group cursor-pointer"
                      onClick={() => setSelectedUserId(user.id || null)}
                    >
                      {/* Checkbox */}
                      <td
                        className="py-4 px-4 text-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                          checked={isChecked}
                          onChange={() => {
                            if (isChecked) {
                              setSelectedRows(selectedRows.filter((id) => id !== user.id));
                            } else {
                              setSelectedRows([...selectedRows, user.id as string]);
                            }
                          }}
                        />
                      </td>

                      {/* Learner Entity & Monogram */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 border border-blue-200/60 flex items-center justify-center font-extrabold text-xs shadow-xs group-hover:scale-105 transition-transform shrink-0">
                            {initials}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 text-sm group-hover:text-blue-600 transition-colors">
                              {user.firstName} {user.lastName}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                              ID: {user.id ? user.id.substring(0, 10) : "UID-000"}...
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="py-4 px-6 font-medium text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <Mail size={13} className="text-slate-400 shrink-0" />
                          <span className="truncate max-w-[200px]">{user.email}</span>
                        </div>
                      </td>

                      {/* Member Role / Persona */}
                      <td className="py-4 px-6">
                        <PersonaPills personas={getUserPersonas(user)} />
                      </td>

                      {/* Status */}
                      <td className="py-4 px-6">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wider uppercase border ${
                            status === "ACTIVE"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200/60"
                              : status === "SUSPENDED" || status === "LOCKED"
                              ? "bg-rose-50 text-rose-700 border-rose-200/60"
                              : status === "INVITED" || status === "PENDING"
                              ? "bg-slate-100 text-slate-700 border-slate-200/60"
                              : "bg-amber-50 text-amber-700 border-amber-200/60"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              status === "ACTIVE"
                                ? "bg-emerald-500 animate-pulse"
                                : status === "SUSPENDED" || status === "LOCKED"
                                ? "bg-rose-500"
                                : status === "INVITED" || status === "PENDING"
                                ? "bg-slate-400"
                                : "bg-amber-500"
                            }`}
                          />
                          {status === "DEACTIVATE" || status === "DEACTIVATED"
                            ? "Deactivated"
                            : status}
                        </span>
                      </td>

                      {/* Course Completed */}
                      <td className="py-4 px-6">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 font-extrabold text-xs">
                          <GraduationCap size={13} className="text-blue-600" />
                          <span>{(user as any).courseCompleted || 0}</span>
                        </div>
                      </td>

                      {/* Last Active */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-1.5 text-slate-600 text-xs">
                          <Clock size={12} className="text-slate-400" />
                          <span>
                            {(user as any).lastLogin
                              ? (() => {
                                  const date = new Date((user as any).lastLogin);
                                  const now = new Date();
                                  const diffMs = now.getTime() - date.getTime();
                                  const diffMins = Math.floor(diffMs / 60000);
                                  if (diffMins < 60) return `${diffMins}m ago`;
                                  const diffHours = Math.floor(diffMins / 60);
                                  if (diffHours < 24) return `${diffHours}h ago`;
                                  const diffDays = Math.floor(diffHours / 24);
                                  if (diffDays < 7) return `${diffDays}d ago`;
                                  const diffWeeks = Math.floor(diffDays / 7);
                                  return `${diffWeeks}w ago`;
                                })()
                              : "Never logged in"}
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td
                        className="py-4 px-6 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedUserId(user.id || null)}
                            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-all shadow-xs cursor-pointer"
                          >
                            View
                          </button>

                          <Dropdown
                            menu={{
                              items: [
                                {
                                  key: "view",
                                  label: (
                                    <div className="flex items-center gap-2 py-1 font-semibold text-xs text-slate-700">
                                      <Eye size={14} className="text-blue-600" />
                                      <span>View Dossier</span>
                                    </div>
                                  ),
                                  onClick: () => setSelectedUserId(user.id || null),
                                },
                                {
                                  key: "suspend",
                                  label: (
                                    <div className="flex items-center gap-2 py-1 font-semibold text-xs text-amber-600">
                                      <Lock size={14} />
                                      <span>Suspend Account</span>
                                    </div>
                                  ),
                                  onClick: () => {
                                    if (user.id) setSuspendUserId(user.id);
                                  },
                                },
                                {
                                  type: "divider",
                                },
                                {
                                  key: "delete",
                                  label: (
                                    <div className="flex items-center gap-2 py-1 font-semibold text-xs text-rose-600">
                                      <Trash2 size={14} />
                                      <span>Soft Delete</span>
                                    </div>
                                  ),
                                  onClick: () => {
                                    if (user.id) {
                                      if (
                                        window.confirm(
                                          "Are you sure you want to move this user to the deletion queue?"
                                        )
                                      ) {
                                        handleStatusChange(user.id, "DELETED");
                                      }
                                    }
                                  },
                                },
                              ],
                            }}
                            trigger={["click"]}
                            placement="bottomRight"
                          >
                            <button
                              className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 inline-flex items-center justify-center transition-colors cursor-pointer"
                              title="Learner options"
                            >
                              <MoreHorizontal size={16} />
                            </button>
                          </Dropdown>
                        </div>
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
            Showing <strong className="text-slate-900">{(page - 1) * pageSize + (users.length > 0 ? 1 : 0)}</strong> to{" "}
            <strong className="text-slate-900">{Math.min(page * pageSize, totalItems)}</strong> of{" "}
            <strong className="text-slate-900">{totalItems}</strong> registered users
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page <= 1}
              className={`h-8 px-3 rounded-xl border text-xs font-semibold flex items-center gap-1 transition-all ${
                page <= 1
                  ? "border-slate-200 text-slate-300 cursor-not-allowed bg-slate-50"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300 cursor-pointer shadow-xs"
              }`}
            >
              <ChevronLeft size={14} />
              <span>Previous</span>
            </button>

            <span className="text-xs font-semibold text-slate-700 px-2">
              Page {page} of {Math.max(1, Math.ceil(totalItems / pageSize))}
            </span>

            <button
              onClick={() => setPage(page + 1)}
              disabled={page >= Math.ceil(totalItems / pageSize)}
              className={`h-8 px-3 rounded-xl border text-xs font-semibold flex items-center gap-1 transition-all ${
                page >= Math.ceil(totalItems / pageSize)
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
}
