import React from "react";
import { Search } from "lucide-react";

export const SupportUserSearchPanel: React.FC = () => {
  return (
    <div className="bg-paper border border-line-strong rounded-md p-5 shadow-[var(--shadow-sm)] mb-6 space-y-4">
      {/* Row 1: Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-ink-faint" />
        </div>
        <input
          type="text"
          placeholder="Find a user by email, name, or user ID"
          className="block w-full pl-10 pr-4 py-3 bg-[#faf9f6] border border-line-strong rounded-sm text-body text-ink placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300 focus:border-gray-300 transition duration-150"
        />
      </div>

      {/* Row 2: Filters & Actions */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[140px]">
          <select className="w-full bg-[#faf9f6] border border-line-strong rounded-sm text-label font-semibold text-ink py-2.5 pl-3 pr-8 appearance-none focus:outline-none focus:ring-1 focus:ring-gray-300 cursor-pointer">
            <option>All statuses</option>
            <option>Active</option>
            <option>Locked</option>
            <option>OTP Issue</option>
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center pr-3.5 pointer-events-none">
            <svg
              className="h-3 w-3 text-ink stroke-[3]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        <div className="relative min-w-[140px]">
          <select className="w-full bg-[#faf9f6] border border-line-strong rounded-sm text-label font-semibold text-ink py-2.5 pl-3 pr-8 appearance-none focus:outline-none focus:ring-1 focus:ring-gray-300 cursor-pointer">
            <option>All roles</option>
            <option>Member</option>
            <option>Instructor</option>
            <option>Content Dev</option>
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center pr-3.5 pointer-events-none">
            <svg
              className="h-3 w-3 text-ink stroke-[3]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        <button className="bg-paper border border-gray-950 text-gray-950 text-label font-bold py-2.5 px-4 rounded-sm hover:bg-paper-2 transition duration-150 cursor-pointer shadow-2xs">
          Clear filters
        </button>
      </div>
    </div>
  );
};
