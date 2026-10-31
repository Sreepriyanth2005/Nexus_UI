import { Skeleton } from "../ui/Skeleton";
import React, { useState, useMemo } from "react";
import { ChevronsUpDown, ChevronUp, ChevronDown } from "../../assets/icons";
import SupportUsersRow, { SupportUserRecord } from "./SupportUsersRow";

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
  const [sortField, setSortField] = useState<keyof SupportUserRecord | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleSort = (field: keyof SupportUserRecord) => {
    if (sortField === field) {
      if (sortDirection === 'asc') setSortDirection('desc');
      else {
        setSortField(null);
        setSortDirection('asc');
      }
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedUsers = useMemo(() => {
    if (!sortField) return users;
    return [...users].sort((a, b) => {
      const aVal = String(a[sortField] || '').toLowerCase();
      const bVal = String(b[sortField] || '').toLowerCase();
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [users, sortField, sortDirection]);

  const renderSortIcon = (field: keyof SupportUserRecord) => {
    if (sortField !== field) return <ChevronsUpDown className="w-3.5 h-3.5 text-gray-400 ml-1.5" />;
    return sortDirection === 'asc' 
      ? <ChevronUp className="w-3.5 h-3.5 text-[var(--ink)] ml-1.5" />
      : <ChevronDown className="w-3.5 h-3.5 text-[var(--ink)] ml-1.5" />;
  };

  const Th = ({ field, label, width }: { field: keyof SupportUserRecord, label: string, width?: string }) => (
    <th 
      onClick={() => handleSort(field)}
      className="py-[12px] px-[14px] cursor-pointer hover:text-[var(--ink)] transition-colors text-left bg-transparent"
      style={{ width }}
    >
      <div className="flex items-center">
        {label}
        {renderSortIcon(field)}
      </div>
    </th>
  );

  return (
    <div className="flex flex-col gap-3.5 select-none font-sans">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2 px-1">
        <h2 className="text-[14px] font-bold text-[var(--ink-mute)] tracking-[0.8px] uppercase">
          RESULTS <span className="font-normal text-[#3A3A3A] ml-1 text-base normal-case">({totalCount} users)</span>
        </h2>
        <span className="text-[14px] text-[var(--ink-mute)] font-medium">
          Support can assist accounts but cannot change roles or delete users (Super Admin only).
        </span>
      </div>

      <div className="bg-[var(--paper)] border border-[var(--line-strong)] rounded-[var(--r-md)] flex flex-col overflow-hidden shadow-[var(--shadow-xs)] transition-all duration-[var(--dur-base)] ease-[var(--tn)] hover:-translate-y-0.5 hover:shadow-[var(--shadow-sm)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b border-[var(--line-strong)] text-[11px] font-bold uppercase tracking-[0.05em] text-[var(--ink-mute)] bg-transparent select-none">
                <Th field="name" label="NAME" width="20%" />
                <Th field="email" label="EMAIL" width="22%" />
                <Th field="role" label="ROLE" width="12%" />
                <Th field="accountStatus" label="ACCOUNT STATUS" width="15%" />
                <Th field="lastLoginAt" label="LAST LOGIN" width="15%" />
                <th className="py-[12px] px-[14px] text-left bg-transparent" style={{ width: '16%' }}>
                  ACTIONS
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line)]">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-[var(--line)]">
                    <td className="py-4 px-5"><Skeleton className="h-10 w-48" /></td>
                    <td className="py-4 px-5"><Skeleton className="h-4 w-24" /></td>
                    <td className="py-4 px-5"><Skeleton className="h-4 w-24" /></td>
                    <td className="py-4 px-5"><Skeleton className="h-6 w-16 rounded-full" /></td>
                    <td className="py-4 px-5"><Skeleton className="h-4 w-32" /></td>
                    <td className="py-4 px-5 text-right"><Skeleton className="h-8 w-8 rounded-md ml-auto" /></td>
                  </tr>
                ))
              ) : users.length > 0 ? (
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
                  <td colSpan={6} className="py-8 text-center text-[var(--ink-mute)]">
                    No users found matching filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {users.length > 0 && (
          <div className="py-[14px] px-[24px] flex justify-between items-center bg-[var(--paper)]">
            <div className="text-[13px] text-[var(--ink-faint)]">
              Showing {(page - 1) * 10 + 1}-{Math.min(page * 10, totalCount)} of {totalCount} users
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={onPrevPage}
                className="px-[12px] py-[6px] text-[13px] font-semibold bg-white border border-[var(--line)] rounded-[var(--r-md)] cursor-pointer disabled:opacity-50 hover:bg-gray-50 transition-colors"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={onNextPage}
                className="px-[12px] py-[6px] text-[13px] font-semibold bg-white border border-[var(--line)] rounded-[var(--r-md)] cursor-pointer disabled:opacity-50 hover:bg-gray-50 transition-colors"
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

export default SupportUsersTable;
