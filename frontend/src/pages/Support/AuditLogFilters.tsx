import React, { useState, useRef, useEffect } from "react";
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
      <div className="relative inline-flex" ref={actionRef}>
        <button
          type="button"
          onClick={() => setActionOpen(!actionOpen)}
          className="inline-flex h-10 min-w-[200px] items-center justify-between rounded-[var(--r-md)] border border-[var(--line-strong)] bg-[var(--paper)] px-[14px] font-[var(--font-sans)] text-[var(--fs-body)] font-medium text-[var(--ink)] outline-none transition-[border-color,box-shadow] duration-[var(--dur-fast)] hover:border-[var(--ink-mute)] focus:border-[var(--c-honey-text)] focus:ring-2 focus:ring-[var(--c-honey-wash)]"
          aria-haspopup="listbox"
          aria-expanded={actionOpen}
        >
          <span>{actionType ? actionType : "All action types"}</span>
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
              const isActive = (actionType || "") === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={isActive}
                  onClick={() => {
                    if (onActionTypeChange) onActionTypeChange(option.value || undefined);
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
