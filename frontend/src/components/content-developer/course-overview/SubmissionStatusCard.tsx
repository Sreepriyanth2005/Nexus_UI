import React from "react";

export interface SubmissionHistoryItem {
  version: string;
  statusText?: string;
  bulletColor?: string;
}

export interface SubmissionStatusCardProps {
  history?: SubmissionHistoryItem[];
  entityStatus?: string;
  currentVersion?: number;
  openFeedbackCount?: number;
  reviews?: any[];
  versionSnapshots?: any[];
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

function formatDayMonth(dateInput?: string | Date | null): string {
  if (!dateInput) return "";
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export const SubmissionStatusCard: React.FC<SubmissionStatusCardProps> = ({
  history,
  entityStatus = "DRAFT",
  currentVersion = 1,
  openFeedbackCount = 0,
  reviews = [],
  versionSnapshots = [],
  createdAt,
  updatedAt,
}) => {
  // If pre-computed history is provided and non-empty, use it
  let items: SubmissionHistoryItem[] = [];

  if (history && history.length > 0) {
    items = history;
  } else {
    // Dynamically derive timeline items from real review and version data
    const rawReviews = Array.isArray(reviews) ? [...reviews] : [];

    // Sort chronologically (oldest to newest)
    rawReviews.sort((a, b) => {
      const timeA = new Date(a.submittedAt || a.createdAt || 0).getTime();
      const timeB = new Date(b.submittedAt || b.createdAt || 0).getTime();
      return timeA - timeB;
    });

    const normalizedStatus = (entityStatus || "").toUpperCase();

    if (rawReviews.length > 0) {
      rawReviews.forEach((rev: any, idx: number) => {
        const revVer = rev.version || (idx + 1);
        const subDate = formatDayMonth(rev.submittedAt || rev.createdAt);
        const versionLabel = subDate ? `v${revVer} submitted ${subDate}` : `v${revVer} submitted`;

        const revStatus = (rev.status || "").toUpperCase();
        let statusText = "";
        let bulletColor = "bg-[#2e9f5b]"; // green for past/approved/completed

        if (revStatus === "APPROVED" || revStatus === "PUBLISHED") {
          statusText = "Approved";
          bulletColor = "bg-[#2e9f5b]";
        } else if (revStatus === "REJECTED") {
          const rejDate = formatDayMonth(rev.reviewedAt || rev.updatedAt);
          statusText = rejDate ? `Rejected ${rejDate}` : "Changes requested";
          bulletColor = "bg-[#2e9f5b]"; // green dot on past completed review cycle as shown in design
        } else if (revStatus === "UNDER_REVIEW" || revStatus === "PENDING" || revStatus === "SUBMITTED") {
          statusText = "Under review";
          bulletColor = "bg-[#c99b2e]"; // amber for in-progress
        }

        items.push({
          version: versionLabel,
          statusText,
          bulletColor,
        });
      });

      // If the latest review was rejected, or content is currently in draft/editing a new version cycle:
      const lastReview = rawReviews[rawReviews.length - 1];
      const lastRevStatus = (lastReview?.status || "").toUpperCase();

      if (
        lastRevStatus === "REJECTED" ||
        normalizedStatus === "DRAFT" ||
        normalizedStatus === "REJECTED" ||
        (normalizedStatus === "PUBLISHED" && currentVersion > rawReviews.length) ||
        (lastRevStatus === "APPROVED" && normalizedStatus !== "PUBLISHED")
      ) {
        const activeVerNum = Math.max(currentVersion, rawReviews.length + (lastRevStatus === "APPROVED" ? 1 : 0));
        let inProgressSubtitle = "Draft in progress";

        if (openFeedbackCount > 0) {
          inProgressSubtitle = `${openFeedbackCount} required change${openFeedbackCount > 1 ? "s" : ""} open`;
        } else if (normalizedStatus === "UNDER_REVIEW" || normalizedStatus === "SUBMITTED") {
          inProgressSubtitle = "Under review";
        } else if (normalizedStatus === "REJECTED") {
          inProgressSubtitle = "Changes requested";
        }

        items.push({
          version: `v${activeVerNum} in progress (current)`,
          statusText: inProgressSubtitle,
          bulletColor: "bg-[#c99b2e]", // amber for active/current
        });
      }
    } else {
      // No review history yet: dynamically reflect current entity state
      const isPublished = normalizedStatus === "PUBLISHED";
      const isUnderReview = normalizedStatus === "UNDER_REVIEW" || normalizedStatus === "SUBMITTED";

      if (isPublished) {
        const pubDate = formatDayMonth(createdAt || updatedAt);
        items.push({
          version: pubDate ? `v${currentVersion} published ${pubDate}` : `v${currentVersion} published`,
          statusText: "Approved",
          bulletColor: "bg-[#2e9f5b]",
        });
      } else if (isUnderReview) {
        const subDate = formatDayMonth(updatedAt || createdAt);
        items.push({
          version: subDate ? `v${currentVersion} submitted ${subDate}` : `v${currentVersion} submitted`,
          statusText: "Under review",
          bulletColor: "bg-[#c99b2e]",
        });
      } else {
        items.push({
          version: `v${currentVersion} in progress (current)`,
          statusText: openFeedbackCount > 0
            ? `${openFeedbackCount} required change${openFeedbackCount > 1 ? "s" : ""} open`
            : "Draft in progress",
          bulletColor: "bg-[#c99b2e]",
        });
      }
    }
  }

  return (
    <div className="bg-white border border-[#1111111a] rounded-xl p-5 shadow-xs space-y-4 select-none">
      <h3 className="text-[11px] font-bold text-[#5c5c5c] uppercase tracking-wider">
        SUBMISSION STATUS
      </h3>

      <div className="relative pl-5 space-y-4">
        {/* Connecting line */}
        <div className="absolute left-[7px] top-2 bottom-2 w-px bg-[#1111111a]" />

        {items.map((event: SubmissionHistoryItem, idx: number) => {
          const bulletColor = event.bulletColor || (idx === items.length - 1 ? "bg-[#c99b2e]" : "bg-[#2e9f5b]");

          return (
            <div key={idx} className="relative flex flex-col items-start gap-0.5">
              <div
                className={`absolute -left-[21px] top-[5px] w-[10px] h-[10px] rounded-full border-2 border-white shadow-2xs ${bulletColor}`}
              />
              <div className="text-xs font-bold text-[#141414]">
                {event.version}
              </div>
              {event.statusText && (
                <span className="text-[11px] font-medium text-[#5c5c5c]">
                  {event.statusText}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SubmissionStatusCard;
