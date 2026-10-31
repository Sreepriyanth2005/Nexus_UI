import { Skeleton } from "../../components/ui/Skeleton";
import React, { useState, useMemo } from "react";
import SupportUsersRow, { SupportUserRecord } from "./SupportUsersRow";
import { ChevronUp, ChevronDown, ChevronsUpDown } from "../../assets/icons";

interface SupportUsersTableProps {
  users: SupportUserRecord[];
  totalCount: number;
  page?: number;
  totalPages?: number;
  onNextPage?: () => void;
  onPrevPage?: () => void;
  isLoading?: boolean;
  onView?: (user: SupportUserRecord) => void;
  onToggleStatus?: (user: SupportUserRecord) => void;
  onReissueCert?: (user: SupportUserRecord) => void;
  isUpdatingStatus?: boolean;
  isReissuingCert?: boolean;
}

export const SupportUsersTable: React.FC<SupportUsersTableProps> = ({
  users,
  totalCount,
  page = 1,
  totalPages = 1,
  onNextPage,
  onPrevPage,
  isLoading = false,
  onView,
  onToggleStatus,
  onReissueCert,
  isUpdatingStatus = false,
  isReissuingCert = false,
}) => {
  const [sortField, setSortField] = useState<keyof SupportUserRecord>("name");
  const [sortAsc, setSortAsc] = useState(true);

  const sortedUsers = useMemo(() => {
    const list = [...users];
    list.sort((a, b) => {
      const aVal = String(a[sortField] || "").toLowerCase();
      const bVal = String(b[sortField] || "").toLowerCase();
      return sortAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    });
    return list;
  }, [users, sortField, sortAsc]);

  const handleSort = (field: keyof SupportUserRecord) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  return (
    <div className="flex flex-col gap-3.5 select-none font-sans">
      {/* Sub-bar above table */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2 px-1">
        <h2 className="text-[var(--fs-label)] font-bold text-[var(--ink-mute)] tracking-[0.8px]" style={{ fontFamily: 'var(--font-serif)' }}>
          RESULTS{" "}
          <span className="supu-results-count font-normal text-[#3A3A3A] ml-1 text-base" style={{ fontFamily: 'var(--font-sans)', textTransform: 'none' }}>
            ({totalCount} users)
          </span>
        </h2>
        <span className="text-[15px] md:text-[15px] text-gray-500 font-normal">
          Support can assist accounts but cannot change roles or delete users (Super Admin only).
        </span>
      </div>

      {/* Main Table Card */}
      <div className="bg-[var(--paper)] border border-[var(--line)] rounded-[var(--r-md)] flex flex-col overflow-hidden pb-3 shadow-[var(--shadow-xs)] transition-all duration-[var(--dur-base)] ease-[var(--tn)] hover:-translate-y-0.5 hover:border-[var(--line-strong)] hover:shadow-[var(--shadow-sm)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b border-[var(--line-strong)] text-[11px] font-bold uppercase tracking-[0.05em] text-[var(--ink-mute)] bg-transparent select-none">
                <th
                  onClick={() => handleSort("name")}
                  className="py-[12px] px-[14px] cursor-pointer hover:text-[var(--ink)] transition-colors w-48 text-left bg-transparent"
                >
                  <div className="flex items-center gap-1.5">
                    NAME
                    {sortField === "name" ? (
                      sortAsc ? <ChevronUp className="w-3.5 h-3.5 text-gray-900" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-900" />
                    ) : (
                      <ChevronsUpDown className="w-3.5 h-3.5 text-gray-400" />
                    )}
                  </div>
                </th>
                <th
                  onClick={() => handleSort("email")}
                  className="py-[12px] px-[14px] cursor-pointer hover:text-[var(--ink)] transition-colors w-64 text-left bg-transparent"
                >
                  <div className="flex items-center gap-1.5">
                    EMAIL
                    {sortField === "email" ? (
                      sortAsc ? <ChevronUp className="w-3.5 h-3.5 text-gray-900" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-900" />
                    ) : (
                      <ChevronsUpDown className="w-3.5 h-3.5 text-gray-400" />
                    )}
                  </div>
                </th>
                <th
                  onClick={() => handleSort("role")}
                  className="py-[12px] px-[14px] cursor-pointer hover:text-[var(--ink)] transition-colors w-36 text-left bg-transparent"
                >
                  <div className="flex items-center gap-1.5">
                    ROLE
                    {sortField === "role" ? (
                      sortAsc ? <ChevronUp className="w-3.5 h-3.5 text-gray-900" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-900" />
                    ) : (
                      <ChevronsUpDown className="w-3.5 h-3.5 text-gray-400" />
                    )}
                  </div>
                </th>
                <th
                  onClick={() => handleSort("accountStatus")}
                  className="py-[12px] px-[14px] cursor-pointer hover:text-[var(--ink)] transition-colors w-44 text-left bg-transparent"
                >
                  <div className="flex items-center gap-1.5">
                    ACCOUNT STATUS
                    {sortField === "accountStatus" ? (
                      sortAsc ? <ChevronUp className="w-3.5 h-3.5 text-gray-900" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-900" />
                    ) : (
                      <ChevronsUpDown className="w-3.5 h-3.5 text-gray-400" />
                    )}
                  </div>
                </th>
                <th
                  onClick={() => handleSort("lastLoginAt")}
                  className="py-[12px] px-[14px] cursor-pointer hover:text-[var(--ink)] transition-colors w-44 text-left bg-transparent"
                >
                  <div className="flex items-center gap-1.5">
                    LAST LOGIN
                    {sortField === "lastLoginAt" ? (
                      sortAsc ? <ChevronUp className="w-3.5 h-3.5 text-gray-900" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-900" />
                    ) : (
                      <ChevronsUpDown className="w-3.5 h-3.5 text-gray-400" />
                    )}
                  </div>
                </th>
                <th className="py-[12px] px-[14px] text-left w-64 bg-transparent">
                  ACTIONS
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-50 last:border-0">
                    <td className="py-4 px-5"><Skeleton className="h-10 w-48" /></td>
                    <td className="py-4 px-5"><Skeleton className="h-4 w-24" /></td>
                    <td className="py-4 px-5"><Skeleton className="h-4 w-24" /></td>
                    <td className="py-4 px-5"><Skeleton className="h-6 w-16 rounded-full" /></td>
                    <td className="py-4 px-5"><Skeleton className="h-4 w-32" /></td>
                    <td className="py-4 px-5 text-right"><Skeleton className="h-8 w-8 rounded-md ml-auto" /></td>
                  </tr>
                ))
              ) : sortedUsers.length > 0 ? (
                sortedUsers.map((user, idx) => (
                  <SupportUsersRow
                    key={user.id || idx}
                    user={user}
                    onView={onView}
                    onToggleStatus={onToggleStatus}
                    onReissueCert={onReissueCert}
                    isUpdatingStatus={isUpdatingStatus}
                    isReissuingCert={isReissuingCert}
                  />
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-400 font-medium text-[15px]">
                    No users found matching filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Pagination Bar */}
        {totalCount > 0 && (
          <div className="py-4 px-6 flex items-center justify-between">
            <div className="text-[15px] text-[var(--ink-mute)] font-normal">
              {totalPages <= 1
                ? `${totalCount} of ${totalCount} users shown`
                : `Showing ${(page - 1) * 10 + 1}-${Math.min(page * 10, totalCount)} of ${totalCount} users`}
            </div>
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onPrevPage}
                  disabled={page <= 1}
                  className="px-4 py-1.5 rounded-full border border-gray-200 text-[15px] font-semibold text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:bg-gray-50/50 disabled:cursor-not-allowed cursor-pointer transition-all shadow-2xs"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={onNextPage}
                  disabled={page >= totalPages}
                  className="px-4 py-1.5 rounded-full border border-gray-300 text-[15px] font-bold text-gray-900 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:bg-gray-50/50 disabled:cursor-not-allowed cursor-pointer transition-all shadow-2xs"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SupportUsersTable;
