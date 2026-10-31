import React from "react";
import { Search } from "lucide-react";

export const SupportUserSearchPanel: React.FC = () => {
  return (
    <div className="bg-white border border-[var(--line)] rounded-2xl p-5 shadow-xs mb-6 space-y-4 font-sans">
      {/* Row 1: Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-[var(--ink-mute)]" />
        </div>
        <input
          type="text"
          placeholder="Find a user by email, name, or user ID"
          className="block w-full pl-10 pr-4 py-2.5 bg-white border border-[var(--line-strong)] rounded-full text-xs text-[var(--ink)] placeholder-[var(--ink-faint)] focus:outline-none focus:border-[var(--ink)] transition duration-150"
        />
      </div>

      {/* Row 2: Filters & Actions */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[140px]">
          <select className="w-full bg-white border border-[var(--line-strong)] rounded-full text-xs font-semibold text-[var(--ink)] py-2 pl-3.5 pr-8 appearance-none focus:outline-none focus:border-[var(--ink)] cursor-pointer">
            <option>All statuses</option>
            <option>Active</option>
            <option>Locked</option>
            <option>OTP Issue</option>
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center pr-3.5 pointer-events-none">
            <svg
              className="h-3 w-3 text-[var(--ink-mute)] stroke-[3]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        <div className="relative min-w-[140px]">
          <select className="w-full bg-white border border-[var(--line-strong)] rounded-full text-xs font-semibold text-[var(--ink)] py-2 pl-3.5 pr-8 appearance-none focus:outline-none focus:border-[var(--ink)] cursor-pointer">
            <option>All roles</option>
            <option>Member</option>
            <option>Instructor</option>
            <option>Content Dev</option>
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center pr-3.5 pointer-events-none">
            <svg
              className="h-3 w-3 text-[var(--ink-mute)] stroke-[3]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        <button className="btn-ghost text-xs font-bold py-2 px-4 rounded-full transition duration-150 cursor-pointer">
          Clear filters
        </button>
      </div>
    </div>
  );
};
