import React from "react";
type ReviewItem = any;
import LearnerReviewCard from "./LearnerReviewCard";

interface LearnerReviewsSectionProps {
  reviews: ReviewItem[];
}

export const LearnerReviewsSection: React.FC<LearnerReviewsSectionProps> = ({ reviews }) => {
  return (
    <div className="space-y-4">
      {/* Title */}
      <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 select-none">
        Learner reviews
      </h2>

      {/* List */}
      <div className="space-y-3">
        {reviews.map((review) => (
          <LearnerReviewCard key={review.id} review={review} />
        ))}
      </div>
    </div>
  );
};

export default LearnerReviewsSection;
