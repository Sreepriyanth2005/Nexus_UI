import React from "react";

interface FeedbackSummaryProps {
  requiredCount: number;
  suggestionsCount: number;
  resolvedCount: number;
  reviewerName?: string;
  reviewedTimeAgo?: string;
  activeFilter: "all" | "required" | "suggestions" | "resolved";
  onFilterChange: (filter: "all" | "required" | "suggestions" | "resolved") => void;
}

export const FeedbackSummary: React.FC<FeedbackSummaryProps> = ({
  requiredCount,
  suggestionsCount,
  resolvedCount,
  reviewerName = "SME Reviewer",
  reviewedTimeAgo = "Recently",
  activeFilter,
  onFilterChange,
}) => {
  return (
    <div className="space-y-4">
      {/* Top status block */}
      <div className="flex items-center gap-3 text-xs sm:text-sm font-medium text-slate-500">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-250 border-amber-200">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
          Changes requested
        </span>
        <span>
          Reviewed by <strong className="text-slate-900">{reviewerName}</strong> · {reviewedTimeAgo}
        </span>
      </div>

      {/* Count filter tabs */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => onFilterChange("all")}
          className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition ${
            activeFilter === "all"
              ? "bg-slate-900 text-white border-slate-900"
              : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
          }`}
        >
          All ({requiredCount + suggestionsCount + resolvedCount})
        </button>

        <button
          type="button"
          onClick={() => onFilterChange("required")}
          className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition flex items-center gap-1.5 ${
            activeFilter === "required"
              ? "bg-red-900 text-white border-red-900"
              : "bg-red-50 text-red-750 border-red-200 hover:bg-red-100 text-red-700"
          }`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
          {requiredCount} Required change{requiredCount !== 1 ? "s" : ""} (must resolve)
        </button>

        <button
          type="button"
          onClick={() => onFilterChange("suggestions")}
          className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition flex items-center gap-1.5 ${
            activeFilter === "suggestions"
              ? "bg-blue-900 text-white border-blue-900"
              : "bg-blue-50 text-blue-750 border-blue-200 hover:bg-blue-100 text-blue-700"
          }`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
          {suggestionsCount} Suggestion{suggestionsCount !== 1 ? "s" : ""} (optional)
        </button>

        <button
          type="button"
          onClick={() => onFilterChange("resolved")}
          className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition flex items-center gap-1.5 ${
            activeFilter === "resolved"
              ? "bg-emerald-900 text-white border-emerald-900"
              : "bg-emerald-50 text-emerald-750 border-emerald-250 hover:bg-emerald-100 text-emerald-700"
          }`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          {resolvedCount} Resolved
        </button>
      </div>
    </div>
  );
};
export default FeedbackSummary;
