import React, { useState, useRef, useEffect } from "react";
import { Search, ChevronDown, X } from "lucide-react";

interface SupportUsersFiltersProps {
  searchQuery: string;
  status?: string;
  role?: string;
  onSearchChange: (q: string) => void;
  onStatusChange: (status?: string) => void;
  onRoleChange: (role?: string) => void;
  onClearFilters: () => void;
}

export const SupportUsersFilters: React.FC<SupportUsersFiltersProps> = ({
  searchQuery,
  status,
  role,
  onSearchChange,
  onStatusChange,
  onRoleChange,
  onClearFilters,
}) => {

  const hasFilters = Boolean(searchQuery || status || role);
  const [statusOpen, setStatusOpen] = useState(false);
  const [roleOpen, setRoleOpen] = useState(false);
  
  const statusRef = useRef<HTMLDivElement>(null);
  const roleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (statusRef.current && !statusRef.current.contains(e.target as Node)) {
        setStatusOpen(false);
      }
      if (roleRef.current && !roleRef.current.contains(e.target as Node)) {
        setRoleOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);


  return (
    <div className="card shadow-sm stat-tile group transition-all duration-300 hover:-translate-y-1 hover:shadow-lg bg-white border border-gray-200 rounded-[20px] p-4 flex flex-col md:flex-row items-center gap-3 w-full select-none font-sans">
      {/* Search Input */}
      <div className="relative flex-1 w-full">
        <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Find a user by email, name, or user ID"
          className="h-[42px] w-full bg-white rounded-full border border-gray-200 pl-11 pr-5 text-sm text-[var(--ink)] placeholder-gray-400 outline-none focus:border-[var(--ink)] focus:ring-2 focus:ring-black/5 transition font-sans"
        />
      </div>

      {/* Selectors & Clear Button */}
      <div className="flex items-center gap-3 w-full md:w-auto flex-wrap sm:flex-nowrap">
{/* Status Dropdown */}
        <div className="relative inline-flex flex-1 sm:flex-initial" ref={statusRef}>
          <button
            type="button"
            onClick={() => { setStatusOpen(!statusOpen); setRoleOpen(false); }}
            className="inline-flex h-10 min-w-[150px] items-center justify-between rounded-[var(--r-md)] border border-[var(--line-strong)] bg-[var(--paper)] px-[14px] font-[var(--font-sans)] text-[var(--fs-body)] font-medium text-[var(--ink)] outline-none transition-[border-color,box-shadow] duration-[var(--dur-fast)] hover:border-[var(--ink-mute)] focus:border-[var(--c-honey-text)] focus:ring-2 focus:ring-[var(--c-honey-wash)]"
            aria-haspopup="listbox"
            aria-expanded={statusOpen}
          >
            <span>{status ? status : "All statuses"}</span>
            <ChevronDown
              className={`ml-3 h-[14px] w-[14px] shrink-0 text-[var(--ink-mute)] transition-transform duration-[var(--dur-fast)] ${statusOpen ? "rotate-180" : ""}`}
            />
          </button>
          {statusOpen && (
            <div
              className="absolute left-0 top-[calc(100%+4px)] z-50 min-w-full overflow-hidden rounded-[var(--r-md)] border border-[var(--line-strong)] bg-[var(--paper)] p-1 shadow-[0_4px_14px_rgba(17,17,17,0.08)]"
              role="listbox"
            >
              {[
                { value: "", label: "All statuses" },
                { value: "Active", label: "Active" },
                { value: "Inactive", label: "Inactive" },
                { value: "Locked", label: "Locked" },
                { value: "OTP issue", label: "OTP issue" }
              ].map((option) => {
                const isActive = (status || "") === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    role="option"
                    aria-selected={isActive}
                    onClick={() => {
                      onStatusChange(option.value || undefined);
                      setStatusOpen(false);
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

{/* Role Dropdown */}
        <div className="relative inline-flex flex-1 sm:flex-initial" ref={roleRef}>
          <button
            type="button"
            onClick={() => { setRoleOpen(!roleOpen); setStatusOpen(false); }}
            className="inline-flex h-10 min-w-[150px] items-center justify-between rounded-[var(--r-md)] border border-[var(--line-strong)] bg-[var(--paper)] px-[14px] font-[var(--font-sans)] text-[var(--fs-body)] font-medium text-[var(--ink)] outline-none transition-[border-color,box-shadow] duration-[var(--dur-fast)] hover:border-[var(--ink-mute)] focus:border-[var(--c-honey-text)] focus:ring-2 focus:ring-[var(--c-honey-wash)]"
            aria-haspopup="listbox"
            aria-expanded={roleOpen}
          >
            <span>{role ? role : "All roles"}</span>
            <ChevronDown
              className={`ml-3 h-[14px] w-[14px] shrink-0 text-[var(--ink-mute)] transition-transform duration-[var(--dur-fast)] ${roleOpen ? "rotate-180" : ""}`}
            />
          </button>
          {roleOpen && (
            <div
              className="absolute left-0 top-[calc(100%+4px)] z-50 min-w-full overflow-hidden rounded-[var(--r-md)] border border-[var(--line-strong)] bg-[var(--paper)] p-1 shadow-[0_4px_14px_rgba(17,17,17,0.08)]"
              role="listbox"
            >
              {[
                { value: "", label: "All roles" },
                { value: "Member", label: "Member" },
                { value: "Instructor", label: "Instructor" },
                { value: "Content Dev", label: "Content Dev" }
              ].map((option) => {
                const isActive = (role || "") === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    role="option"
                    aria-selected={isActive}
                    onClick={() => {
                      onRoleChange(option.value || undefined);
                      setRoleOpen(false);
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

        {/* Clear Button */}
        {hasFilters && (
          <button
            type="button"
            onClick={onClearFilters}
            className="h-[42px] px-4 rounded-full border border-gray-200 bg-white hover:bg-gray-50 text-gray-900 text-sm font-semibold shadow-2xs transition-all duration-200 cursor-pointer font-sans shrink-0 flex items-center gap-1.5"
          >
            <X className="w-4 h-4 text-gray-500" />
            <span>Clear filters</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default SupportUsersFilters;
