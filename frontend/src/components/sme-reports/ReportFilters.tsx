import React, { useEffect, useState, useRef } from "react";
import { Calendar } from "lucide-react";

interface ReportFiltersProps {
  fromDate?: string;
  toDate?: string;
  timeRange?: string;
  onFromDateChange?: (val: string) => void;
  onToDateChange?: (val: string) => void;
  onTimeRangeChange?: (val: string) => void;
}

export const ReportFilters: React.FC<ReportFiltersProps> = ({
  fromDate = "",
  toDate = "",
  timeRange = "All time",
  onFromDateChange,
  onToDateChange,
  onTimeRangeChange,
}) => {
  const [localFrom, setLocalFrom] = useState(fromDate);
  const [localTo, setLocalTo] = useState(toDate);

  const fromInputRef = useRef<HTMLInputElement>(null);
  const toInputRef = useRef<HTMLInputElement>(null);


  useEffect(() => setLocalFrom(fromDate), [fromDate]);
  useEffect(() => setLocalTo(toDate), [toDate]);

  return (
    <div
      className="flex flex-wrap items-center gap-2.5"
      style={{ fontFamily: "var(--font-sans)" }}
    >
       <div className="inline-flex h-9 items-center rounded-full border border-[var(--line-strong)] bg-white px-4 transition-all duration-[var(--dur-fast)] hover:border-[var(--ink-mute)] focus-within:border-[var(--c-honey-text)] focus-within:ring-2 focus-within:ring-[var(--c-honey-wash)]">
        <div className="relative flex items-center">
          <Calendar className="pointer-events-none absolute left-0 z-10 h-4 w-4 text-[var(--ink-mute)]" />
          <input
            type="date"
            aria-label="From date"
            value={localFrom}
            onChange={(e) => {
              setLocalFrom(e.target.value);
              onFromDateChange?.(e.target.value);
            }}
            className="relative z-20 w-[130px] cursor-pointer bg-transparent pl-6 text-[14px] font-bold text-[var(--ink)] outline-none placeholder:text-[var(--ink-faint)] [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0"
          />
        </div>
        <span className="px-3 text-[12px] font-medium text-[var(--ink-mute)]">
          to
        </span>
        <div className="relative flex items-center">
          <Calendar className="pointer-events-none absolute left-0 z-10 h-4 w-4 text-[var(--ink-mute)]" />
          <input
            type="date"
            aria-label="To date"
            value={localTo}
            onChange={(e) => {
              setLocalTo(e.target.value);
              onToDateChange?.(e.target.value);
            }}
            className="relative z-20 w-[130px] cursor-pointer bg-transparent pl-6 text-[14px] font-bold text-[var(--ink)] outline-none placeholder:text-[var(--ink-faint)] [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0"
          />
        </div>
      </div>

      <button
        type="button"
        onClick={() => onTimeRangeChange?.("All time")}
        aria-pressed={timeRange === "All time"}
        className={`inline-flex h-9 items-center justify-center rounded-full border px-5 PY-2 text-[14px] font-bold transition-all duration-[var(--dur-fast)] ease-[var(--tn)] active:scale-[0.98]  hover:border-[var(--ink-mute)] ${
          timeRange === "All time"
            ? "border-[var(--line-strong)] text-[var(--ink)]"
            : "border-[var(--line)] bg-white text-[var(--ink-soft)] hover:border-[var(--line-strong)] hover:bg-[var(--paper-2)] hover:text-[var(--ink)] shadow-sm"
        }`}
      >
        All time
      </button>
    </div>
  );
};

export default ReportFilters;