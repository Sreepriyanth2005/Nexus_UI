import React, { useState } from "react";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Check,
  X,
  Filter,
  Download,
  MoreVertical,
  Users,
  Lock,
  Shield,
  ChevronDown
} from "../../assets/icons";
import { useNavigate } from "react-router";
import { Button } from "../../components/ui/Button/Button";
import { useInternalUserUiStore } from "../../store/internal-user/internalUser.store";
import {
  useUsers,
  useDeleteUser,
  useUpdateUserStatus,
  useAdminChangeStatus,
  useUserFilters,
} from "../../hooks/internal-user/useInternalUser";
import { useSystemRoles } from "../../hooks/useRolesPermissions";
import type { InternalUser } from "../../core/api/internal-user/internalUser.api";
import { Skeleton } from "../../components/ui/Skeleton/Skeleton";



const EmptyState = ({ onReset }: { onReset: () => void }) => (
  <div className="flex flex-col items-center justify-center py-16 px-4 bg-[var(--paper)] rounded-2xl border border-dashed border-[var(--line-strong)]">
    <div className="w-12 h-12 rounded-full bg-[var(--paper-2)] flex items-center justify-center mb-4">
      <Search className="text-[var(--ink-mute)]" width={22} height={22} strokeWidth={2} />
    </div>
    <h3 className="text-[length:var(--fs-body)] font-[var(--fw-semibold)] text-[var(--ink)] [font-family:var(--font-sans)]">No users found</h3>
    <p className="text-[length:var(--fs-meta)] text-[var(--ink-mute)] max-w-sm mx-auto mt-1 [font-family:var(--font-sans)]">
      We couldn't find any admin users matching your current filters or search
      query.
    </p>
    <button
      onClick={onReset}
      className="mt-4 px-4 py-2 bg-[var(--btn)] text-[var(--ink)] text-[length:var(--fs-label)] font-[var(--fw-medium)] rounded-xl transition [font-family:var(--font-sans)] border border-[var(--line)] shadow-[var(--shadow-xs)] hover:shadow-[var(--shadow-sm)] hover:-translate-y-0.5"
    >
      Clear Filters
    </button>
  </div>
);

const ErrorState = ({ onRetry }: { onRetry: () => void }) => (
  <div className="flex flex-col items-center justify-center py-16 px-4 bg-[var(--c-danger-wash)] rounded-2xl border border-dashed border-[var(--c-danger)]">
    <div className="w-12 h-12 rounded-full bg-[var(--paper)] flex items-center justify-center mb-4 border border-[var(--c-danger)]">
      <span className="text-[var(--c-danger)] font-[var(--fw-bold)] text-[length:var(--fs-h3)] [font-family:var(--font-sans)]">!</span>
    </div>
    <h3 className="text-[length:var(--fs-body)] font-[var(--fw-semibold)] text-[var(--c-danger)] [font-family:var(--font-sans)]">
      Failed to load users
    </h3>
    <p className="text-[length:var(--fs-meta)] text-[var(--ink-mute)] max-w-sm mx-auto mt-1 [font-family:var(--font-sans)]">
      An error occurred while fetching the admin users list. Please check your
      connection.
    </p>
    <button
      onClick={onRetry}
      className="mt-4 px-4 py-2 bg-[var(--c-danger)] text-white text-[length:var(--fs-label)] font-[var(--fw-medium)] rounded-xl hover:opacity-90 transition [font-family:var(--font-sans)]"
    >
      Retry Request
    </button>
  </div>
);

const AdminUserManagement: React.FC = () => {
  const navigate = useNavigate();
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [selectedCard, setSelectedCard] = useState<string | null>(null);

  const {
    search,
    roleFilters,
    statusFilters,
    tenantFilter,
    dateJoinedFilter,
    lastActiveFilter,
    page,
    pageSize,
    selectedUsers,
    filterPanelOpen,
    sortOrder,
    setSearch,
    toggleRole,
    toggleStatus,
    setStatusFilter,
    setTenant,
    setDateJoined,
    toggleLastActive,
    toggleFilterPanel,
    setSort,
    setPage,
    toggleSelection,
    toggleAllSelection,
    clearSelection,
    reset,
  } = useInternalUserUiStore();

  const { data: rawUsers = [], isLoading, isError, refetch } = useUsers({ limit: 1000 });
  const { data: systemRoles = [] } = useSystemRoles();

  const adminUsers = React.useMemo(() => {
    return rawUsers.filter((u) => {
      if (!u.roles || u.roles.length === 0) return false;

      const upperRoles = u.roles.map((r) => r.toUpperCase());
      const adminRoles =
        systemRoles.length > 0
          ? systemRoles.map((r) =>
            typeof r === "string"
              ? r.toUpperCase()
              : (r as any).code?.toUpperCase() || "",
          )
          : [
            "ADMIN",
            "CORPORATE_ADMIN",
            "SME",
            "CONTENT_DEVELOPER",
            "CONTENT DEVELOPER",
            "SUPPORT",
            "SYSTEM_SUPPORT_ENGINEER",
            "SUPER_ADMIN",
          ];

      return upperRoles.some((r) => adminRoles.includes(r));
    });
  }, [rawUsers, systemRoles]);

  const activeAdminsCount = adminUsers.filter(
    (u) => (u.status || "ACTIVE").toUpperCase() === "ACTIVE",
  ).length;
  const suspendedAdminsCount = adminUsers.filter(
    (u) => (u.status || "").toUpperCase() === "SUSPENDED",
  ).length;
  const rolesInUseCount = React.useMemo(() => {
    const uniqueRoles = new Set<string>();
    adminUsers.forEach((u) => {
      u.roles?.forEach((r) => uniqueRoles.add(r));
    });
    return uniqueRoles.size;
  }, [adminUsers]);

  const { filteredUsers, paginatedUsers, totalItems, totalPages } =
    useUserFilters(adminUsers);

  const deleteMutation = useDeleteUser();
  const statusMutation = useUpdateUserStatus();
  const adminChangeStatusMutation = useAdminChangeStatus();

  // Bulk action handlers
  const handleBulkActivate = () => {
    if (selectedUsers.length === 0) return;
    let completed = 0;
    selectedUsers.forEach((userId) => {
      statusMutation.mutate(
        { id: userId, status: "ACTIVE" },
        {
          onSettled: () => {
            completed++;
            if (completed === selectedUsers.length) {
              clearSelection();
              refetch();
            }
          },
        },
      );
    });
  };

  const handleBulkDeactivate = () => {
    if (selectedUsers.length === 0) return;
    let completed = 0;
    selectedUsers.forEach((userId) => {
      statusMutation.mutate(
        { id: userId, status: "INACTIVE" },
        {
          onSettled: () => {
            completed++;
            if (completed === selectedUsers.length) {
              clearSelection();
              refetch();
            }
          },
        },
      );
    });
  };

  const handleBulkSuspend = () => {
    if (selectedUsers.length === 0) return;
    if (
      !confirm(
        `Are you sure you want to suspend the ${selectedUsers.length} selected user(s)?`,
      )
    )
      return;
    let completed = 0;
    selectedUsers.forEach((userId) => {
      adminChangeStatusMutation.mutate(
        { userId: userId, status: "SUSPENDED", reason: "Admin action via UI" },
        {
          onSettled: () => {
            completed++;
            if (completed === selectedUsers.length) {
              clearSelection();
              refetch();
            }
          },
        },
      );
    });
  };

  const handleBulkDelete = () => {
    if (selectedUsers.length === 0) return;
    if (
      !confirm(
        `Are you sure you want to delete the ${selectedUsers.length} selected user(s)?`,
      )
    )
      return;
    let completed = 0;
    selectedUsers.forEach((userId) => {
      deleteMutation.mutate(userId, {
        onSettled: () => {
          completed++;
          if (completed === selectedUsers.length) {
            clearSelection();
            refetch();
          }
        },
      });
    });
  };

  const handleExportCSV = () => {
    // If rows are selected, export only those; otherwise export all filtered users
    const usersToExport =
      selectedUsers.length > 0
        ? filteredUsers.filter((u) => selectedUsers.includes(u.id))
        : filteredUsers;

    if (usersToExport.length === 0) return;

    const headers = [
      "ID",
      "First Name",
      "Last Name",
      "Email",
      "Roles",
      "Status",
      "Country",
      "Last Login",
      "Created Date",
    ];
    const rows = usersToExport.map((u) => [
      u.id,
      u.firstName,
      u.lastName,
      u.email,
      u.roles.join("; "),
      u.status || "ACTIVE",
      u.country || "",
      u.lastLogin ? new Date(u.lastLogin).toLocaleString() : "Never",
      u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "N/A",
    ]);

    const csvContent = [headers, ...rows]
      .map((row) =>
        row.map((val) => `"${String(val ?? "").replace(/"/g, '""')}"`).join(","),
      )
      .join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const dateStr = new Date().toISOString().split("T")[0];
    const label = selectedUsers.length > 0 ? `selected-${selectedUsers.length}` : "all";
    link.setAttribute("href", url);
    link.setAttribute("download", `admin-users_${label}_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();
  };

  const renderStatusBadge = (status: string) => {
    const uppercase = (status || "ACTIVE").toUpperCase();
    let dotColor = "bg-[var(--c-sage-text)]";
    let textColor = "text-[var(--c-sage-text)]";
    let text = "Active";

    if (
      uppercase === "INACTIVE" ||
      uppercase === "DEACTIVATE" ||
      uppercase === "DEACTIVATED"
    ) {
      dotColor = "bg-[var(--ink-faint)]";
      textColor = "text-[var(--ink-mute)]";
      text = "Deactivated";
    } else if (uppercase === "SUSPENDED") {
      dotColor = "bg-[var(--c-danger)]";
      textColor = "text-[var(--c-danger)]";
      text = "Suspended";
    } else if (uppercase === "LOCKED") {
      dotColor = "bg-[var(--c-danger)]";
      textColor = "text-[var(--c-danger)]";
      text = "Locked";
    } else if (uppercase === "PENDING" || uppercase === "INVITED") {
      dotColor = "bg-[var(--ink)]";
      textColor = "text-[var(--ink)]";
      text = "Invited";
    }

    return (
      <div className={`flex items-center gap-2 ${textColor}`}>
        <div className={`h-1.5 w-1.5 shrink-0 rounded-full ${dotColor}`} />
        <span className="text-[length:var(--fs-meta)] font-[var(--fw-bold)] leading-none [font-family:var(--font-sans)]">{text}</span>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6 w-full min-h-screen bg-[var(--surface)]">
        <div className="space-y-2 mb-8">
          <Skeleton className="h-8 w-1/4 rounded-[var(--r-sm)]" />
          <Skeleton className="h-4 w-1/3 rounded-[var(--r-sm)]" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Skeleton className="h-[100px] rounded-[var(--r-lg)]" />
          <Skeleton className="h-[100px] rounded-[var(--r-lg)]" />
          <Skeleton className="h-[100px] rounded-[var(--r-lg)]" />
          <Skeleton className="h-[100px] rounded-[var(--r-lg)]" />
        </div>
        <Skeleton className="h-[400px] w-full rounded-xl" />
      </div>
    );
  }

  return (
    <>
      <div>
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <span className="mb-1.5 block text-[length:var(--fs-label)] font-[var(--fw-bold)] uppercase tracking-[var(--ls-label)] text-[var(--ink-mute)] [font-family:var(--font-serif)]">
              USER MANAGEMENT
            </span>
            <h1 className="mb-1.5 flex items-baseline gap-3 text-[length:var(--fs-h1)] font-[var(--fw-bold)] tracking-tight text-[var(--ink)] [font-family:var(--font-sans)]">
              Admin users{" "}
              <span className="text-[length:var(--fs-h1)] font-[var(--fw-medium)] text-[var(--ink-mute)] [font-family:var(--font-sans)]">
                {adminUsers.length}
              </span>
            </h1>
            <p className="max-w-3xl text-[length:var(--fs-body)] leading-relaxed text-[var(--ink-soft)] [font-family:var(--font-sans)]">
              Internal admin-role users: SME, Content Developer, Support Engineer, Super Admin.
            </p>
          </div>
          <div className="flex w-full sm:w-auto shrink-0 flex-col sm:flex-row items-stretch sm:items-center gap-3 self-start sm:self-auto">
            <button
              type="button"
              onClick={handleExportCSV}
              className="flex w-full sm:w-auto justify-center h-[40px] items-center gap-2 rounded-[var(--r-pill)] border border-[var(--c-honey-soft)] bg-[var(--hero-bg)] px-4 text-[length:var(--fs-meta)] font-[var(--fw-bold)] text-[var(--btn-ink)] transition-all hover:-translate-y-1 hover:shadow-[var(--shadow-sm)] [font-family:var(--font-sans)]"
            >
              <Download width={14} height={14} strokeWidth={2} />
              {selectedUsers.length > 0
                ? `Export ${selectedUsers.length} selected`
                : "Export CSV"}
            </button>
            <button
              type="button"
              onClick={() => navigate("/admin-create")}
              className="flex w-full sm:w-auto justify-center h-[40px] items-center gap-2 rounded-[var(--r-pill)] border border-[var(--c-honey-soft)] bg-[var(--hero-bg)] px-4 text-[length:var(--fs-meta)] font-[var(--fw-bold)] text-[var(--btn-ink)] transition-all hover:-translate-y-1 hover:shadow-[var(--shadow-sm)] [font-family:var(--font-sans)]"
            >
              + Create admin user
            </button>
          </div>
        </div>

        {/* Info Cards */}
        <div className="mb-8 grid shrink-0 grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
          <div
            className={`flex min-h-[146px] flex-col justify-between rounded-[var(--r-lg)] bg-[var(--paper)] py-[20px] px-[22px] cursor-pointer hover:-translate-y-1 transition-all ${
              selectedCard === "TOTAL"
                ? "border border-[var(--c-honey)] shadow-[var(--shadow-md)] hover:border hover:border-[var(--line-strong)] hover:shadow-[var(--shadow-sm)]"
                : "border border-[var(--line-strong)] hover:shadow-[var(--shadow-sm)]"
            }`}
            onClick={() => {
              setStatusFilter(null);
              setSelectedCard("TOTAL");
            }}
          >
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-[var(--r-md)] bg-[var(--c-honey-wash)]">
              <Users
                className="h-5 w-5 text-[var(--c-honey-text)] opacity-70 drop-shadow-sm"
              />
            </div>
            <div>
              <p className="mb-2 text-[length:var(--fs-label)] font-[var(--fw-bold)] uppercase tracking-[var(--ls-label)] text-[var(--ink-mute)] [font-family:var(--font-serif)]">
                TOTAL ADMINS
              </p>
              <p className="text-[length:var(--fs-h1)] font-[var(--fw-bold)] leading-none text-[var(--ink)] [font-family:var(--font-sans)]">
                {totalItems}
              </p>
            </div>
          </div>

          <div
            className={`flex min-h-[146px] flex-col justify-between rounded-[var(--r-lg)] bg-[var(--paper)] py-[20px] px-[22px] cursor-pointer hover:-translate-y-1 transition-all ${
              selectedCard === "ACTIVE"
                ? "border border-[var(--c-honey)] shadow-[var(--shadow-md)] hover:border hover:border-[var(--line-strong)] hover:shadow-[var(--shadow-sm)]"
                : "border border-[var(--line-strong)] hover:shadow-[var(--shadow-sm)]"
            }`}
            onClick={() => {
              setStatusFilter("ACTIVE");
              setSelectedCard("ACTIVE");
            }}
          >
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-[var(--r-md)] bg-[var(--c-sage-wash)]">
              <Check
                className="h-5 w-5 text-[var(--c-sage-text)] drop-shadow-sm"
              />
            </div>
            <div>
              <p className="mb-2 text-[length:var(--fs-label)] font-[var(--fw-bold)] uppercase tracking-[var(--ls-label)] text-[var(--ink-mute)] [font-family:var(--font-serif)]">
                ACTIVE
              </p>
              <p className="text-[length:var(--fs-h1)] font-[var(--fw-bold)] leading-none text-[var(--ink)] [font-family:var(--font-sans)]">
                {activeAdminsCount}
              </p>
            </div>
          </div>

          <div
            className={`flex min-h-[146px] flex-col justify-between rounded-[var(--r-lg)] bg-[var(--paper)] py-[20px] px-[22px] cursor-pointer hover:-translate-y-1 transition-all ${
              selectedCard === "SUSPENDED"
                ? "border border-[var(--c-honey)] shadow-[var(--shadow-md)] hover:border hover:border-[var(--line-strong)] hover:shadow-[var(--shadow-sm)]"
                : "border border-[var(--line-strong)] hover:shadow-[var(--shadow-sm)]"
            }`}
            onClick={() => {
              setStatusFilter("SUSPENDED");
              setSelectedCard("SUSPENDED");
            }}
          >
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-[var(--r-md)] bg-[var(--c-danger-wash)]">
              <Lock
                className="h-5 w-5 text-[var(--c-danger)] drop-shadow-sm"
              />
            </div>
            <div>
              <p className="mb-2 text-[length:var(--fs-label)] font-[var(--fw-bold)] uppercase tracking-[var(--ls-label)] text-[var(--ink-mute)] [font-family:var(--font-serif)]">
                SUSPENDED
              </p>
              <p className="text-[length:var(--fs-h1)] font-[var(--fw-bold)] leading-none text-[var(--ink)] [font-family:var(--font-sans)]">
                {suspendedAdminsCount}
              </p>
            </div>
          </div>

          <div
            className={`flex min-h-[146px] flex-col justify-between rounded-[var(--r-lg)] bg-[var(--paper)] py-[20px] px-[22px] cursor-pointer hover:-translate-y-1 transition-all ${
              selectedCard === "ROLES"
                ? "border border-[var(--c-honey)] shadow-[var(--shadow-md)] hover:border hover:border-[var(--line-strong)] hover:shadow-[var(--shadow-sm)]"
                : "border border-[var(--line-strong)] hover:shadow-[var(--shadow-sm)]"
            }`}
            onClick={() => setSelectedCard("ROLES")}
          >
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-[var(--r-md)] bg-[var(--c-honey-wash)]">
              <Shield
                className="h-5 w-5 text-[var(--c-honey-text)] opacity-70 drop-shadow-sm"
              />
            </div>
            <div>
              <p className="mb-2 text-[length:var(--fs-label)] font-[var(--fw-bold)] uppercase tracking-[var(--ls-label)] text-[var(--ink-mute)] [font-family:var(--font-serif)]">
                ROLES IN USE
              </p>
              <p className="text-[length:var(--fs-h1)] font-[var(--fw-bold)] leading-none text-[var(--ink)] [font-family:var(--font-sans)]">
                {rolesInUseCount}
              </p>
            </div>
          </div>
        </div>

        {/* Filter controls */}
        <div className="mb-6 flex flex-col items-center gap-3 sm:flex-row">
          <div className="relative w-full flex-1 max-w-2xl">
            <Search
              width={16} height={16}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--ink-faint)]"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name / email / ID"
              className="h-[40px] w-full rounded-[var(--r-md)] border border-[var(--line-strong)] bg-[var(--paper)] pl-[38px] pr-[14px] py-0 text-[length:var(--fs-meta)] text-[var(--ink)] placeholder:text-[var(--ink-faint)] focus:border-[var(--c-honey)] focus:outline-none focus:ring-0"
            />
          </div>
          <div className="relative flex w-full shrink-0 items-center sm:w-auto">
            <select
              value={statusFilters.length === 1 ? statusFilters[0] : "All statuses"}
              onChange={(e) => {
                statusFilters.forEach((status) => {
                  if (status !== e.target.value) toggleStatus(status);
                });
                if (e.target.value !== "All statuses" && !statusFilters.includes(e.target.value)) {
                  toggleStatus(e.target.value);
                }
              }}
              className="h-[40px] min-w-[164px] cursor-pointer appearance-none rounded-[var(--r-md)] border border-[var(--line-strong)] bg-[var(--paper)] pl-[14px] pr-[36px] py-0 text-[length:var(--fs-body)] text-[var(--ink)] focus:outline-none focus:border-[var(--c-honey)] focus:ring-0 transition-colors [font-family:var(--font-sans)]"
            >
              <option value="All statuses">All statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="DEACTIVATED">Deactivated</option>
              <option value="LOCKED">Locked</option>
              <option value="INVITED">Invited</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-[14px] top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--ink-mute)]" />
          </div>
        </div>

        {/* Table View */}
        <div className="flex flex-col overflow-hidden rounded-[var(--r-lg)] border border-[var(--line-strong)] bg-[var(--paper)]">
          <div className="flex items-center justify-between border-b border-[var(--line-strong)] bg-[var(--paper)] px-5 py-4">
            <div className="flex items-center gap-3">
              <h2 className="text-[length:var(--fs-body)] font-[var(--fw-bold)] text-[var(--ink)] [font-family:var(--font-sans)]">
                All admin users
              </h2>
              <span className="rounded-[var(--r-pill)] border border-[var(--line-strong)] bg-[var(--paper-2)] px-2.5 py-0.5 text-[length:var(--fs-meta)] font-[var(--fw-semibold)] text-[var(--ink-mute)] [font-family:var(--font-serif)]">
                {totalItems} total
              </span>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={handleBulkSuspend}
                disabled={selectedUsers.length === 0}
                className={`h-8 rounded-[var(--r-pill)] border border-[var(--line-strong)] bg-[var(--paper-2)] px-4 text-[length:var(--fs-meta)] font-[var(--fw-semibold)] transition-colors ${
                  selectedUsers.length > 0
                    ? "text-[var(--ink)] hover:bg-[var(--surface-3)] cursor-pointer"
                    : "text-[var(--ink-mute)] cursor-not-allowed opacity-70"
                } [font-family:var(--font-sans)]`}>
                Bulk: suspend
              </button>

            </div>
          </div>
          <div className="w-full flex-1 overflow-x-auto">
            {isError ? (
              <div className="p-8">
                <ErrorState onRetry={refetch} />
              </div>
            ) : paginatedUsers.length === 0 ? (
              <div className="p-8">
                <EmptyState onReset={reset} />
              </div>
            ) : (
              <table className="w-full min-w-[1100px] table-fixed text-left">
                <thead>
                  <tr className="border-b border-[var(--line-strong)] bg-[var(--paper)]">
                    <th className="w-12 px-[14px] py-[10px] text-center [font-family:var(--font-sans)]">
                      <input
                        type="checkbox"
                        checked={
                          paginatedUsers.length > 0 &&
                          paginatedUsers.every((u) => selectedUsers.includes(u.id))
                        }
                        ref={(input) => {
                          if (input) {
                            const selectedCount = paginatedUsers.filter((u) => selectedUsers.includes(u.id)).length;
                            input.indeterminate = selectedCount > 0 && selectedCount < paginatedUsers.length;
                          }
                        }}
                        onChange={() => toggleAllSelection(paginatedUsers.map((u) => u.id))}
                        className="h-4 w-4 cursor-pointer rounded border-[var(--line-strong)] accent-[var(--c-check)]"
                      />
                    </th>
                    <th className="w-[25%] px-[14px] py-[10px] [font-family:var(--font-sans)]">
                      <button
                        onClick={() =>
                          setSort(
                            sortOrder === "asc" ? "desc" : sortOrder === "desc" ? "" : "asc"
                          )
                        }
                        className="flex items-center gap-1.5 text-[length:var(--fs-label)] font-[var(--fw-bold)] uppercase tracking-widest text-[var(--ink-mute)] transition-colors hover:text-[var(--ink)]"
                      >
                        NAME
                        <img
                          src="/assets/icons/chevrons-up-down.svg"
                          className="h-3.5 w-3.5 opacity-60"
                        />
                      </button>
                    </th>
                    <th className="w-[25%] px-[14px] py-[10px] text-[length:var(--fs-label)] font-[var(--fw-bold)] uppercase tracking-widest text-[var(--ink-mute)] [font-family:var(--font-sans)]">
                      <div className="flex items-center gap-1.5">
                        EMAIL
                        <img
                          src="/assets/icons/chevrons-up-down.svg"
                          className="h-3.5 w-3.5 opacity-60"
                        />
                      </div>
                    </th>
                    <th className="w-[20%] px-[14px] py-[10px] text-[length:var(--fs-label)] font-[var(--fw-bold)] uppercase tracking-widest text-[var(--ink-mute)] [font-family:var(--font-sans)]">
                      <div className="flex items-center gap-1.5">
                        STATUS
                        <img
                          src="/assets/icons/chevrons-up-down.svg"
                          className="h-3.5 w-3.5 opacity-60"
                        />
                      </div>
                    </th>
                    <th className="w-[20%] px-[14px] py-[10px] text-[length:var(--fs-label)] font-[var(--fw-bold)] uppercase tracking-widest text-[var(--ink-mute)] [font-family:var(--font-sans)]">
                      <div className="flex items-center gap-1.5">
                        LAST LOGIN
                        <img
                          src="/assets/icons/chevrons-up-down.svg"
                          className="h-3.5 w-3.5 opacity-60"
                        />
                      </div>
                    </th>
                    <th className="w-[10%] px-[14px] py-[10px] [font-family:var(--font-sans)]"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--line-strong)]">
                  {paginatedUsers.map((user, index) => (
                    <tr
                      key={user.id}
                      className={`transition-colors hover:bg-[var(--paper-2)] ${selectedUsers.includes(user.id) ? "bg-[var(--c-sage-wash)] hover:bg-[var(--c-sage-wash)]" : ""
                        }`}
                    >
                      <td className="px-[14px] py-[12px] text-center [font-family:var(--font-sans)]">
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(user.id)}
                          onChange={() => toggleSelection(user.id)}
                          className="h-4 w-4 cursor-pointer rounded border-[var(--line-strong)] accent-[var(--c-check)]"
                        />
                      </td>
                      <td className="px-[14px] py-[12px] [font-family:var(--font-sans)]">
                        <button
                          onClick={() => navigate(`/admin-user-details/${user.id}`)}
                          className="text-[length:var(--fs-body)] font-[var(--fw-semibold)] text-[var(--ink)] transition-colors hover:text-[var(--ink-deep)]"
                        >
                          {user.firstName} {user.lastName}
                        </button>
                      </td>
                      <td className="px-[14px] py-[12px] text-[length:var(--fs-meta)] font-[var(--fw-regular)] text-[var(--ink-mute)] [font-family:var(--font-sans)]">
                        {user.email}
                      </td>
                      <td className="px-[14px] py-[12px] [font-family:var(--font-sans)]">
                        {renderStatusBadge(user.status || "ACTIVE")}
                      </td>
                      <td className="px-[14px] py-[12px] text-[length:var(--fs-meta)] font-[var(--fw-regular)] text-[var(--ink-mute)] [font-family:var(--font-sans)]">
                        {user.lastLogin
                          ? (() => {
                            const date = new Date(user.lastLogin);
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
                          : "Never"}
                      </td>
                      <td className="px-[14px] py-[12px] pr-6 [font-family:var(--font-sans)]">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            className="shrink-0 h-9 rounded-[var(--r-pill)] border border-[var(--line-strong)] px-5 text-[length:var(--fs-meta)] font-[var(--fw-medium)] text-[var(--ink)] transition-colors hover:bg-[var(--paper-2)]"
                            onClick={() => navigate(`/admin-user-details/${user.id}`)}
                          >
                            View
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          {/* Pagination control */}
          {!isLoading && !isError && paginatedUsers.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-[14px] px-[18px] border-t border-[var(--line-strong)] bg-[var(--paper)]">
              <p className="text-[length:var(--fs-meta)] text-[var(--ink-mute)] [font-family:var(--font-serif)]">
                Showing {Math.min(page * pageSize, totalItems)} of {totalItems}
              </p>
              <div className="ausers-pager flex items-center gap-2 h-[30px]">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="w-[30px] h-[30px] rounded-full flex items-center justify-center transition disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--paper-2)]"
                >
                  <ChevronLeft width={16} height={16} className="text-[var(--ink-soft)]" />
                </button>
                <span className="[font-family:var(--font-serif)]">
                  {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="w-[30px] h-[30px] rounded-full flex items-center justify-center transition disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--paper-2)]"
                >
                  <ChevronRight width={16} height={16} className="text-[var(--ink-soft)]" />
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </>
  );
};

export default AdminUserManagement;
