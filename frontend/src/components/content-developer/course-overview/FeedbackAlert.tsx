import React from "react";
import { AlertTriangle } from "lucide-react";

interface FeedbackAlertProps {
  onResolve?: () => void;
  count?: number;
  reviewerName?: string;
}

export const FeedbackAlert: React.FC<FeedbackAlertProps> = ({
  onResolve,
  count = 1,
  reviewerName = "SME Reviewer",
}) => {
  return (
    <div className="bg-[#fcf3e0] border border-[#f5d996] rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#5c3e0a] select-none">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-[#f6e8c4] border border-[#c99b2e]/40 text-[#755a12] flex items-center justify-center shrink-0">
          <AlertTriangle className="w-4 h-4" />
        </div>
        <p className="font-semibold text-[#3a221a] leading-relaxed">
          <span className="font-bold">{count} required change</span> from {reviewerName} must be resolved before this course can be resubmitted for review.
        </p>
      </div>
      <button
        onClick={onResolve}
        className="font-extrabold text-[#141414] hover:underline cursor-pointer bg-transparent border-none p-0 flex items-center gap-1 shrink-0 self-end sm:self-auto text-xs"
      >
        Resolve feedback &rarr;
      </button>
    </div>
  );
};

export default FeedbackAlert;
