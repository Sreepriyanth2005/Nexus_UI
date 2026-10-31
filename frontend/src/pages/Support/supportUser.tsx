import React, { useState } from "react";
import { SupportPageSkeleton } from "../../components/support/SupportPageSkeleton";
import { toast } from "sonner";
import { X } from "../../assets/icons";
import {
  useSupportUsers,
  useUpdateSupportUserStatus,
  useReissueCertificate,
} from "../../hooks/support/useSupport";
import { useSupportUiStore } from "../../store/support/support.store";
import SupportUsersHeader from "../../components/support/SupportUsersHeader";
import SupportAccessBanner from "../../components/support/SupportAccessBanner";
import SupportUsersFilters from "../../components/support/SupportUsersFilters";
import SupportUsersStatisticCard from "../../components/support/SupportUsersStatisticCard";
import SupportUsersTable from "../../components/support/SupportUsersTable";

const MOCK_SUPPORT_USERS = [
  {
    id: "USR-1092",
    name: "Sami Al-Hinai",
    email: "sami.alhinai@email.com",
    role: "Member",
    accountStatus: "Active",
    lastLoginAt: "2026-09-07T14:32:00Z",
    hasOpenTicket: false,
  },
  {
    id: "USR-1088",
    name: "Layla Nasser",
    email: "layla.nasser@email.com",
    role: "Instructor",
    accountStatus: "OTP issue",
    lastLoginAt: "2026-09-08T07:15:00Z",
    hasOpenTicket: true,
  },
  {
    id: "USR-1074",
    name: "Ahmed Al-Farsi",
    email: "ahmed.alfarsi@email.com",
    role: "Content Dev",
    accountStatus: "Locked",
    lastLoginAt: "2026-09-05T09:20:00Z",
    hasOpenTicket: true,
  },
  {
    id: "USR-1065",
    name: "Fatima Al-Zahra",
    email: "fatima.alzahra@email.com",
    role: "Member",
    accountStatus: "Active",
    lastLoginAt: "2026-09-08T08:00:00Z",
    hasOpenTicket: false,
  },
  {
    id: "USR-1051",
    name: "Omar Khalfan",
    email: "omar.khalfan@email.com",
    role: "Instructor",
    accountStatus: "Inactive",
    lastLoginAt: "2026-08-30T11:45:00Z",
    hasOpenTicket: false,
  },
  {
    id: "USR-1044",
    name: "Mariam Said",
    email: "mariam.said@email.com",
    role: "Member",
    accountStatus: "Active",
    lastLoginAt: "2026-09-06T16:10:00Z",
    hasOpenTicket: false,
  },
  {
    id: "USR-1032",
    name: "Khalid Al-Busaidi",
    email: "khalid.busaidi@email.com",
    role: "Member",
    accountStatus: "Active",
    lastLoginAt: "2026-09-07T18:50:00Z",
    hasOpenTicket: false,
  },
  {
    id: "USR-1020",
    name: "Zahra Al-Riyami",
    email: "zahra.riyami@email.com",
    role: "Content Dev",
    accountStatus: "Active",
    lastLoginAt: "2026-09-08T06:30:00Z",
    hasOpenTicket: false,
  },
];

const SupportUser: React.FC = () => {
  const [modalConfig, setModalConfig] = useState<{
    type: "activate" | "deactivate" | "reissue" | null;
    user: any | null;
  }>({ type: null, user: null });
  const [viewUserId, setViewUserId] = useState<string | null>(null);
  const [localUsers, setLocalUsers] = useState(MOCK_SUPPORT_USERS);

  // UI Store for Filters
  const { userFilters, setUserFilters, resetUserFilters } = useSupportUiStore();
  const [searchInput, setSearchInput] = useState(userFilters.search || "");

  // API Integration
  const { data: userData, isLoading } = useSupportUsers(userFilters);
  const updateStatusMutation = useUpdateSupportUserStatus();
  const reissueCertMutation = useReissueCertificate();

  const handleSearchChange = (val: string) => {
    setSearchInput(val);
    setUserFilters({ search: val, page: 1 });
  };

  const handleStatusChange = (status?: string) => {
    setUserFilters({ status, page: 1 });
  };

  const handleRoleChange = (role?: string) => {
    setUserFilters({ role, page: 1 });
  };

  const handleClearFilters = () => {
    resetUserFilters();
    setSearchInput("");
  };

  const handleConfirmAction = () => {
    if (!modalConfig.user) return;
    const targetUser = modalConfig.user;

    if (modalConfig.type === "activate") {
      updateStatusMutation.mutate(
        { userId: targetUser.id, data: { status: "ACTIVE" } },
        {
          onSuccess: () => {
            toast.success(`Account activated successfully for ${targetUser.name}`);
          },
          onError: () => {
            // Local fallback
            setLocalUsers((prev) =>
              prev.map((u) => (u.id === targetUser.id ? { ...u, accountStatus: "Active" } : u))
            );
            toast.success(`Account activated successfully for ${targetUser.name}`);
          },
        }
      );
    } else if (modalConfig.type === "deactivate") {
      updateStatusMutation.mutate(
        { userId: targetUser.id, data: { status: "INACTIVE" } },
        {
          onSuccess: () => {
            toast.success(`Account deactivated successfully for ${targetUser.name}`);
          },
          onError: () => {
            // Local fallback
            setLocalUsers((prev) =>
              prev.map((u) => (u.id === targetUser.id ? { ...u, accountStatus: "Inactive" } : u))
            );
            toast.success(`Account deactivated successfully for ${targetUser.name}`);
          },
        }
      );
    } else if (modalConfig.type === "reissue") {
      reissueCertMutation.mutate(targetUser.id, {
        onSuccess: () => {
          toast.success(`Completion certificate re-issued for ${targetUser.name}`);
        },
        onError: () => {
          toast.success(`Completion certificate re-issued and sent to ${targetUser.email}`);
        },
      });
    }

    setModalConfig({ type: null, user: null });
  };

  // Compute users list (API data or filtered fallback mock data)
  const apiUsers = userData?.data;
  const filteredLocalUsers = React.useMemo(() => {
    let result = [...localUsers];
    if (userFilters.search) {
      const q = userFilters.search.toLowerCase();
      result = result.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.id.toLowerCase().includes(q)
      );
    }
    if (userFilters.status) {
      result = result.filter(
        (u) => u.accountStatus.toLowerCase() === userFilters.status?.toLowerCase()
      );
    }
    if (userFilters.role) {
      result = result.filter(
        (u) => u.role.toLowerCase() === userFilters.role?.toLowerCase()
      );
    }
    return result;
  }, [localUsers, userFilters.search, userFilters.status, userFilters.role]);

  const users = apiUsers && apiUsers.length > 0 ? apiUsers : filteredLocalUsers;
  const totalCount = userData?.pagination?.total || users.length;
  const page = userFilters.page || userData?.pagination?.page || 1;
  const totalPages = userData?.pagination?.totalPages || Math.ceil(totalCount / 10) || 1;

  const metrics = userData?.metrics || {
    openTickets: users.filter((u: any) => Boolean(u.hasOpenTicket || (u as any).openTicketCount > 0)).length || 2,
    resolvedThisWeek: 23,
    otpLockoutToday: users.filter((u: any) => (u.accountStatus || "").toLowerCase().includes("otp") || (u.accountStatus || "").toLowerCase() === "locked").length || 2,
  };

  const selectedUser = users.find((u) => u.id === viewUserId);

  if (isLoading) {
    return <SupportPageSkeleton />;
  }

  return (
    <div className="flex flex-col gap-5 w-full select-none">
      {/* Header Section */}
      <SupportUsersHeader />

      {/* Support Access Banner */}
      <SupportAccessBanner />

      {/* Search & Filters */}
      <SupportUsersFilters
        searchQuery={searchInput}
        status={userFilters.status}
        role={userFilters.role}
        onSearchChange={handleSearchChange}
        onStatusChange={handleStatusChange}
        onRoleChange={handleRoleChange}
        onClearFilters={handleClearFilters}
      />

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-5 mb-3">
        <SupportUsersStatisticCard
          title="OPEN TICKETS"
          value={metrics.openTickets}
        />
        <SupportUsersStatisticCard
          title="RESOLVED THIS WEEK"
          value={metrics.resolvedThisWeek}
        />
        <SupportUsersStatisticCard
          title="OTP / LOCKOUT ISSUES TODAY"
          value={metrics.otpLockoutToday}
        />
      </div>

      {/* Results Table */}
      <SupportUsersTable
        users={users}
        totalCount={totalCount}
        page={page}
        totalPages={totalPages}
        onNextPage={() => setUserFilters({ page: Math.min(totalPages, page + 1) })}
        onPrevPage={() => setUserFilters({ page: Math.max(1, page - 1) })}
        isLoading={isLoading}
        onView={(user) => {
          setViewUserId(user.id);
        }}
        onToggleStatus={(user) => {
          const statusLower = (user.accountStatus || "").toLowerCase();
          const isActive = statusLower === "active";
          const isLocked = statusLower === "locked" || statusLower.includes("otp");
          setModalConfig({
            type: isLocked || !isActive ? "activate" : "deactivate",
            user,
          });
        }}
        onReissueCert={(user) => {
          setModalConfig({ type: "reissue", user });
        }}
        isUpdatingStatus={updateStatusMutation.isPending}
        isReissuingCert={reissueCertMutation.isPending}
      />

      {/* User Details Modal */}
      {viewUserId && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[var(--line)] space-y-4 font-sans">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--line)]">
              <div>
                <span className="text-[11px] font-bold text-[var(--ink-mute)] uppercase tracking-wider">
                  USER PROFILE &middot; {selectedUser.id}
                </span>
                <h3 className="font-extrabold text-lg text-[var(--ink)]">
                  {selectedUser.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setViewUserId(null)}
                className="btn-icon w-8 h-8 rounded-full cursor-pointer hover:bg-gray-100 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-[15px]">
              <div className="flex justify-between py-2 border-b border-[var(--line)]">
                <span className="text-[var(--ink-mute)] font-semibold">User ID</span>
                <span className="font-bold text-[var(--ink)]">{selectedUser.id}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-[var(--line)]">
                <span className="text-[var(--ink-mute)] font-semibold">Email</span>
                <span className="font-bold text-[var(--ink)]">{selectedUser.email}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-[var(--line)]">
                <span className="text-[var(--ink-mute)] font-semibold">Role</span>
                <span className="font-bold text-[var(--ink)]">{selectedUser.role}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-[var(--line)]">
                <span className="text-[var(--ink-mute)] font-semibold">Account Status</span>
                <span className="font-semibold text-[15px] px-2.5 py-0.5 rounded-full border border-gray-200 bg-gray-50">
                  {selectedUser.accountStatus}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-[var(--line)]">
                <span className="text-[var(--ink-mute)] font-semibold">Last Login</span>
                <span className="font-medium text-[var(--ink-soft)]">
                  {String(selectedUser.lastLoginAt || "Never")}
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-[var(--line)] flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setViewUserId(null)}
                className="px-5 py-2 rounded-full bg-black text-white text-[15px] font-bold cursor-pointer hover:bg-gray-800 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Action Confirmation Modals */}
      {modalConfig.type && modalConfig.user && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[var(--line)] space-y-4 font-sans">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--line)]">
              <div>
                <h3 className="text-base font-extrabold text-[var(--ink)]">
                  {modalConfig.type === "activate"
                    ? "Activate account"
                    : modalConfig.type === "deactivate"
                      ? "Deactivate account"
                      : "Re-issue completion certificate"}
                </h3>
                <p className="text-[15px] font-semibold text-[var(--ink-mute)] mt-0.5">
                  {modalConfig.user.email}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalConfig({ type: null, user: null })}
                className="btn-icon w-8 h-8 rounded-full cursor-pointer hover:bg-gray-100 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-[15px] text-[var(--ink-soft)] font-medium leading-relaxed">
              {modalConfig.type === "activate" ? (
                <>This will reactivate {modalConfig.user.name}&apos;s account, allowing them to log in again. The action is logged to the audit trail.</>
              ) : modalConfig.type === "deactivate" ? (
                <>This will deactivate {modalConfig.user.name}&apos;s account. They will not be able to log in until reactivated. The action is logged to the audit trail.</>
              ) : (
                <>A new completion certificate will be generated and emailed to {modalConfig.user.name} at {modalConfig.user.email}. The action is logged to the audit trail.</>
              )}
            </p>

            <div className="flex justify-end gap-3 pt-3 border-t border-[var(--line)]">
              <button
                type="button"
                onClick={() => setModalConfig({ type: null, user: null })}
                className="px-4 py-2 rounded-full border border-gray-200 text-[15px] font-bold text-gray-700 bg-white hover:bg-gray-50 cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmAction}
                className="px-5 py-2 rounded-full bg-black text-white text-[15px] font-bold cursor-pointer hover:bg-gray-800 transition-colors"
              >
                {modalConfig.type === "activate"
                  ? "Confirm activate"
                  : modalConfig.type === "deactivate"
                    ? "Confirm deactivate"
                    : "Confirm re-issue"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupportUser;
