import React from "react";

interface FeedbackActionBarProps {
  requiredOpenCount: number;
  onSaveProgress?: () => void;
  onResubmit?: () => void;
}

export const FeedbackActionBar: React.FC<FeedbackActionBarProps> = ({
  requiredOpenCount,
  onSaveProgress,
  onResubmit,
}) => {
  const canResubmit = requiredOpenCount === 0;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-6 border-t border-slate-200 gap-4">
      {/* Required remaining status label */}
      <span className="text-xs sm:text-sm font-semibold text-slate-500">
        {requiredOpenCount > 0 ? (
          <span className="text-amber-600">
            {requiredOpenCount} required change{requiredOpenCount !== 1 ? "s" : ""} still open
          </span>
        ) : (
          <span className="text-emerald-600">All required changes resolved</span>
        )}
      </span>

      {/* Buttons */}
      <div className="flex items-center gap-3 w-full sm:w-auto">
        <button
          type="button"
          onClick={onSaveProgress}
          className="flex-1 sm:flex-none h-10 px-5 border border-slate-300 rounded-xl text-xs font-bold hover:bg-slate-50 transition text-slate-800"
        >
          Save progress
        </button>

        <button
          type="button"
          onClick={onResubmit}
          disabled={!canResubmit}
          className="flex-1 sm:flex-none h-10 px-5 bg-slate-900 hover:bg-black disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold transition"
        >
          Resubmit for review
        </button>
      </div>
    </div>
  );
};
export default FeedbackActionBar;
