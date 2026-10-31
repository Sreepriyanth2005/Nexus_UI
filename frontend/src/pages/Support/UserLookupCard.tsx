import React, { useState } from "react";
import { Search } from "lucide-react";

export const UserLookupCard: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <div className="bg-white border border-[var(--line)] rounded-2xl p-5 shadow-xs mb-6 font-sans">
      <h2 className="text-[10px] font-bold text-[var(--ink-mute)] uppercase tracking-wider mb-2.5">
        USER LOOKUP
      </h2>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-[var(--ink-mute)]" />
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by email, name, or user ID"
          className="block w-full pl-10 pr-4 py-2.5 bg-white border border-[var(--line-strong)] rounded-full text-xs text-[var(--ink)] placeholder-[var(--ink-faint)] focus:outline-none focus:border-[var(--ink)] transition duration-150"
        />
      </div>
    </div>
  );
};
