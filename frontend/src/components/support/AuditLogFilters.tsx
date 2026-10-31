import React from "react";
import { Search, ChevronDown, X } from "lucide-react";

interface AuditLogFiltersProps {
  startDate?: string;
  endDate?: string;
  actionType?: string;
  searchEmail?: string;
  onStartDateChange?: (date?: string) => void;
  onEndDateChange?: (date?: string) => void;
  onActionTypeChange?: (actionType?: string) => void;
  onSearchChange?: (q: string) => void;
  onClearFilters?: () => void;
}

export const AuditLogFilters: React.FC<AuditLogFiltersProps> = ({
  startDate = "",
  endDate = "",
  actionType = "",
  searchEmail = "",
  onStartDateChange,
  onEndDateChange,
  onActionTypeChange,
  onSearchChange,
  onClearFilters,
}) => {
  return (
    <div className="flex flex-wrap items-center gap-3 w-full" style={{ fontFamily: 'var(--font-sans)' }}>
      {/* Date Range Container */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Start Date */}
        <div className="relative min-w-[155px]">
          <input
            type="date"
            value={startDate}
            onChange={(e) => onStartDateChange?.(e.target.value)}
            className="input"
            style={{
              height: 40,
              borderRadius: 'var(--r-pill)',
              padding: '0 16px',
              fontSize: 'var(--fs-meta)',
              color: 'var(--ink)',
              background: 'var(--paper)',
              borderColor: 'var(--line-strong)',
              cursor: 'pointer'
            }}
          />
        </div>

        {/* End Date */}
        <div className="relative min-w-[155px]">
          <input
            type="date"
            value={endDate}
            onChange={(e) => onEndDateChange?.(e.target.value)}
            className="input"
            style={{
              height: 40,
              borderRadius: 'var(--r-pill)',
              padding: '0 16px',
              fontSize: 'var(--fs-meta)',
              color: 'var(--ink)',
              background: 'var(--paper)',
              borderColor: 'var(--line-strong)',
              cursor: 'pointer'
            }}
          />
        </div>
      </div>

      {/* Action Type Selector */}
      <div className="relative min-w-[200px]">
        <select
          value={actionType}
          onChange={(e) => onActionTypeChange?.(e.target.value || undefined)}
          className="select"
          style={{
            height: 40,
            borderRadius: 'var(--r-pill)',
            padding: '0 36px 0 16px',
            fontSize: 'var(--fs-meta)',
            color: 'var(--ink)',
            background: 'var(--paper)',
            borderColor: 'var(--line-strong)',
            cursor: 'pointer'
          }}
        >
          <option value="">All action types</option>
          <option value="OTP resent">OTP resent</option>
          <option value="Account unlocked">Account unlocked</option>
          <option value="Impersonation started">Impersonation started</option>
          <option value="Impersonation ended">Impersonation ended</option>
          <option value="Learning credential reissued">Learning credential reissued</option>
          <option value="Profile re-verify">Profile re-verify</option>
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center pr-3.5 pointer-events-none" style={{ color: 'var(--ink-faint)' }}>
          <ChevronDown style={{ width: 16, height: 16 }} />
        </div>
      </div>

      {/* Search by user email */}
      <div className="relative flex-1 min-w-[240px]">
        <Search style={{ width: 16, height: 16, color: 'var(--ink-faint)', position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)' }} />
        <input
          type="text"
          value={searchEmail}
          onChange={(e) => onSearchChange?.(e.target.value)}
          placeholder="Search by user email"
          className="input"
          style={{
            height: 40,
            borderRadius: 'var(--r-pill)',
            paddingLeft: 42,
            paddingRight: 16,
            width: '100%',
            fontSize: 'var(--fs-meta)',
            color: 'var(--ink)',
            background: 'var(--paper)',
            borderColor: 'var(--line-strong)'
          }}
        />
      </div>

      {/* Clear Filters Button */}
      {(startDate || endDate || actionType || searchEmail) && (
        <button
          type="button"
          onClick={onClearFilters}
          className="btn-ghost"
          style={{ height: 40, padding: '0 16px', gap: 6, flexShrink: 0 }}
        >
          <X style={{ width: 14, height: 14, color: 'var(--ink-mute)' }} />
          <span style={{ fontSize: 'var(--fs-meta)' }}>Clear</span>
        </button>
      )}
    </div>
  );
};

export default AuditLogFilters;
