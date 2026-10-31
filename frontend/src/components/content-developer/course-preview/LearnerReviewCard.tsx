import React from "react";
type ReviewItem = any;

interface LearnerReviewCardProps {
  review: ReviewItem;
}

export const LearnerReviewCard: React.FC<LearnerReviewCardProps> = ({ review }) => {
  return (
    <div className="border border-slate-200 bg-white rounded-xl p-4 shadow-sm flex items-start gap-3 select-none">
      {/* Bullet Dot */}
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-1.5" />

      {/* Info Block */}
      <div className="flex-1 space-y-1">
        {/* Name & Date Row */}
        <div className="flex items-center justify-between gap-4 text-xs font-bold text-slate-800 leading-none">
          <span>{review.reviewer}</span>
          <span className="text-[10px] font-semibold text-slate-400">{review.date}</span>
        </div>

        {/* Comment Text */}
        <p className="text-xs font-medium text-slate-500 leading-relaxed pt-1">
          {review.review}
        </p>
      </div>
    </div>
  );
};

export default LearnerReviewCard;
