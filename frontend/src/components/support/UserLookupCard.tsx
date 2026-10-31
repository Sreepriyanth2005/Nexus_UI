import React, { useState } from "react";
import { Search } from "lucide-react";

export const UserLookupCard: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <div className="bg-paper border border-line-strong rounded-md p-5 shadow-[var(--shadow-sm)] mb-6">
      <h2 className="text-[11px] font-bold text-ink-faint uppercase tracking-wider mb-2.5">
        USER LOOKUP
      </h2>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-ink-faint" />
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by email, name, or user ID"
          className="block w-full pl-10 pr-4 py-3 bg-[#faf9f6] border border-line-strong rounded-sm text-body text-ink placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300 focus:border-gray-300 transition duration-150"
        />
      </div>
    </div>
  );
};
