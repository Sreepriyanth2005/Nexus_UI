import React, { useState, useEffect } from "react";
import { useLocation, useParams, useNavigate } from "react-router";
import { toast } from "sonner";
import {
  useCourseFeedback,
  useFeedbackHeaderDetails,
  useFeedbackSummary,
  useLatestReviewableEntity,
  useCompletenessEngine,
  useLearnerQA,
  useReplyToFeedback,
  useResolveFeedback,
  useResubmitCourse,
  useEntityReview,
} from "../../hooks/content-developer-workspace/useFeedbackResolution";
import { feedbackResolutionApi } from "../../core/api/content-developer-workspace/feedbackResolution.api";
import { useFeedbackResolutionStore } from "../../store/content-developer-workspace/feedbackResolution.store";
import { useUserStore } from "../../store/user.store";
import { useAuthStore } from "../../core/auth/auth.store";
import { useWorkspaceDashboard } from "../../hooks/content-developer-workspace/useContentDeveloperDashboard";
import { Skeleton } from "../../components/ui/Skeleton";
import { formatRelativeTime } from "../../core/api/content-developer-workspace/contentDeveloperDashboard.api";
import {
  Loader2,
  ChevronDown,
  ArrowLeft,
  Search,
  CheckCircle,
  AlertTriangle,
  Clock,
  ExternalLink,
  BookOpen,
} from "lucide-react";

// ---------- Types & Data Interfaces ----------

type FeedbackType = "Required" | "Suggestion" | "Resolved";

interface FeedbackCardProps {
  id: string;
  type: FeedbackType;
  lessonRef?: string;
  metadata?: string;
  quote: string;
  author: string;
  postedAgo: string;
  isOptional?: boolean;
  onResolve: (id: string, replyText: string) => void;
}

export interface LearnerQuestionItem {
  id: string;
  status: "Answered" | "Unanswered";
  lessonRef?: string;
  postedAgo: string;
  question: string;
  author: string;
  upvotes: number;
  reply?: string;
  subject?: string;
}

interface LearnerQACardProps {
  item: LearnerQuestionItem;
  onReplySubmit: (id: string, replyText: string) => void;
}

// ---------- Default Reference Data (Strict Real Data Mode) ----------

const DEFAULT_SME_CARDS: FeedbackCardProps[] = [];

const DEFAULT_LEARNER_QA: LearnerQuestionItem[] = [];

// ---------- Sub-components ----------

const FeedbackItemCard: React.FC<FeedbackCardProps> = ({
  id,
  type,
  lessonRef,
  metadata,
  quote,
  author,
  postedAgo,
  isOptional,
  onResolve,
}) => {
  const [replyText, setReplyText] = useState("");

  return (
    <div
      className={`cfb-thread bg-white border border-[#1111111a] rounded-[10px] py-[18px] px-[22px] max-md:py-[14px] max-md:px-[16px] transition-[border-color,box-shadow,opacity] duration-200 hover:border-[#11111129] hover:shadow-[0_1px_2px_#2a11080f] ${type === "Resolved" ? "cfb-thread-resolved opacity-[0.62]" : ""
        } ${type === "Required" ? "cfb-thread-required" : ""}`}
    >
      {/* Card top — badges row */}
      <div className="cfb-thread-head flex flex-wrap items-center gap-[8px] mb-[12px]">
        {type === "Required" && (
          <span className="cfb-chip cfb-chip-clay text-[12px] font-bold tracking-[0.04em] px-[10px] py-[3px] rounded-full bg-[#EFD3C7] text-[#8F3A20] border border-transparent">
            Required
          </span>
        )}
        {type === "Suggestion" && (
          <span className="cfb-chip text-[12px] font-bold tracking-[0.04em] px-[10px] py-[3px] rounded-full bg-[#F6F6F4] text-[#3A3A3A] border border-[#11111129]">
            Suggestion
          </span>
        )}
        {type === "Resolved" && (
          <span className="cfb-chip cfb-chip-sage text-[12px] font-bold tracking-[0.04em] px-[10px] py-[3px] rounded-full bg-[#DCE5D3] text-[#446038] border border-transparent">
            Resolved
          </span>
        )}

        {lessonRef && (
          <span className="cfb-chip cfb-chip-honey text-[12px] font-bold tracking-[0.04em] px-[10px] py-[3px] rounded-full bg-[#F6E8C4] text-[#755A12] border border-transparent">
            {lessonRef}
          </span>
        )}

        {metadata && (
          <span className="cfb-loc text-[12px] text-[#5C5C5C] font-semibold tracking-[0.06em]">
            {metadata}
          </span>
        )}
      </div>

      {/* Quote / Feedback Text */}
      <blockquote className="cfb-quote font-sans text-[16px] text-[#141414] font-medium leading-[1.6] mb-[8px] not-italic">
        {quote}
      </blockquote>

      {/* Author and byline */}
      <div className="cfb-byline text-[12px] text-[#5C5C5C] font-semibold tracking-[0.04em] mb-[8px]">
        {type === "Resolved" ? author : `${author} · ${postedAgo}`}
      </div>

      {/* Optional note — only for Suggestion type */}
      {(isOptional || type === "Suggestion") && (
        <p className="cfb-optional-note text-[14px] text-[#5C5C5C] font-normal leading-[1.45] mt-[6px] mb-0">
          Optional: does not block resubmission.
        </p>
      )}

      {/* Action buttons with Reply input */}
      {type !== "Resolved" && (
        <div className="cfb-thread-actions mt-[16px] flex flex-col gap-[12px]">
          <textarea
            className="w-full bg-[#F6F6F4] border border-[#11111129] rounded-[8px] p-[12px] text-[14px] text-[#141414] focus:outline-none focus:border-[#5C5C5C] resize-y min-h-[60px]"
            placeholder="Add a reply for the SME (optional)..."
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
          />
          <div className="flex flex-wrap items-center gap-[8px]">
            <button
              onClick={() => onResolve(id, replyText)}
              className={`nexus-btn sm text-[14px] font-bold px-[16px] py-[8px] rounded-full transition-all duration-150 hover:-translate-y-[1px] cursor-pointer ${type === "Required"
                  ? "bg-[#FCF7AE] hover:bg-[#F0EA8A] border-[1.5px] border-[#C99B2E8C] text-[#141414] shadow-[0_4px_16px_-4px_#2a11081f]"
                  : "nexus-btn ghost bg-white hover:bg-[#F6F6F4] border-[1.5px] border-[#11111129] hover:border-[#5C5C5C] text-[#141414]"
                }`}
            >
              Mark as Resolved
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const LearnerQACard: React.FC<LearnerQACardProps> = ({ item, onReplySubmit }) => {
  const [showReply, setShowReply] = useState(false);
  const [replyText, setReplyText] = useState("");

  const isAnswered = item.status === "Answered";

  return (
    <div className="cfb-qa-thread bg-white border border-[#1111111a] rounded-[10px] py-[18px] px-[22px] max-md:py-[14px] max-md:px-[16px] transition-[border-color,box-shadow] duration-200 hover:border-[#11111129] hover:shadow-[0_1px_2px_#2a11080f]">
      {/* Top row: badge + metadata */}
      <div className="cfb-thread-head flex flex-wrap items-center gap-[8px] mb-[12px]">
        <span
          className={`cfb-chip inline-flex items-center gap-[5px] text-[12px] font-bold tracking-[0.04em] px-[10px] py-[3px] rounded-full border ${isAnswered
              ? "cfb-chip-sage cfb-chip-dot bg-[#DCE5D3] text-[#446038] border-transparent"
              : "cfb-chip-clay cfb-chip-dot bg-[#EFD3C7] text-[#8F3A20] border-transparent"
            }`}
        >
          <span
            className="w-[6px] h-[6px] rounded-full bg-current opacity-75 shrink-0 inline-block"
          />
          {item.status}
        </span>

        {item.lessonRef && (
          <span className="cfb-loc text-[12px] text-[#5C5C5C] font-semibold tracking-[0.06em]">
            {item.lessonRef} · {item.postedAgo}
          </span>
        )}
        {!item.lessonRef && (
          <span className="cfb-loc text-[12px] text-[#5C5C5C] font-semibold tracking-[0.06em]">
            {item.postedAgo}
          </span>
        )}
      </div>

      {/* Question */}
      <p className="cfb-qa-question font-sans text-[16px] text-[#141414] font-bold leading-[1.45] mb-[8px]">
        {item.question}
      </p>

      {/* Answer box (if answered) */}
      {isAnswered && item.reply && (
        <div className="cfb-reply-display bg-[#F6F6F4] text-[#3A3A3A] rounded-[8px] px-[14px] py-[10px] text-[16px] leading-[1.55] mt-[12px]">
          <strong className="text-[#141414] font-bold">You replied: </strong>
          {item.reply}
        </div>
      )}

      {/* Reply input (if unanswered and opened) */}
      {!isAnswered && showReply && (
        <div className="cfb-reply-box bg-[#F6F6F4] border border-[#1111111a] rounded-[8px] mt-[12px] p-[10px_14px]">
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Type your response to the learner..."
            rows={3}
            autoFocus
            className="cfb-textarea w-full min-h-[68px] font-sans text-[16px] text-[#141414] bg-white border border-[#1111111a] rounded-[8px] mb-[10px] p-[8px_10px] leading-[1.5] transition-colors focus:border-[#5C5C5C] focus:outline-none focus:ring-4 focus:ring-[#1111110a] resize-y placeholder-[#5C5C5C]"
          />
          <div className="cfb-reply-actions flex items-center gap-[8px]">
            <button
              onClick={() => {
                if (replyText.trim()) {
                  onReplySubmit(item.id, replyText.trim());
                  setReplyText("");
                  setShowReply(false);
                }
              }}
              className="nexus-btn sm bg-[#FCF7AE] hover:bg-[#F0EA8A] text-[#141414] border-[1.5px] border-[#C99B2E8C] text-[14px] font-bold px-[14px] py-[8px] rounded-full transition-all duration-150 hover:-translate-y-[1px] shadow-[0_4px_16px_-4px_#2a11081f] cursor-pointer"
            >
              Submit reply
            </button>
            <button
              onClick={() => {
                setShowReply(false);
                setReplyText("");
              }}
              className="nexus-btn ghost sm bg-white hover:bg-[#F6F6F4] text-[#141414] border-[1.5px] border-[#11111129] hover:border-[#5C5C5C] text-[14px] font-bold px-[14px] py-[8px] rounded-full transition-all duration-150 hover:-translate-y-[1px] cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Reply button (if unanswered and closed) */}
      {!isAnswered && !showReply && (
        <div className="cfb-thread-actions flex flex-wrap items-center gap-[8px] mt-[12px]">
          <button
            onClick={() => setShowReply(true)}
            className="nexus-btn ghost sm bg-white hover:bg-[#F6F6F4] text-[#141414] border-[1.5px] border-[#11111129] hover:border-[#5C5C5C] text-[14px] font-bold px-[14px] py-[8px] rounded-full transition-all duration-150 hover:-translate-y-[1px] cursor-pointer"
          >
            Reply
          </button>
        </div>
      )}

      {/* Footer meta */}
      <div className="cfb-qa-meta text-[12px] text-[#5C5C5C] font-semibold tracking-[0.04em] mt-[8px]">
        Asked by {item.author} · {item.upvotes} upvotes
      </div>
    </div>
  );
};

// ---------- Main Page Component ----------

const ContentDeveloperFeedbackResolution: React.FC = () => {
  const { entityType = "course", id = "", courseId = "" } = useParams<{
    entityType?: "course" | "career-path" | "lesson";
    id?: string;
    courseId?: string;
  }>();

  const location = useLocation();
  const navigate = useNavigate();

  // URL tab synchronization — support /studio/feedback, /studio/qa and ?tab=learner
  const searchParams = new URLSearchParams(location.search);
  const tabParam = searchParams.get("tab");
  const isQaRoute = location.pathname === "/studio/qa";
  const [activeTab, setActiveTab] = useState<"sme" | "learner">(
    tabParam === "learner" || isQaRoute ? "learner" : "sme"
  );

  // Local state overrides for interactive state preservation
  const [localCardOverrides, setLocalCardOverrides] = useState<Record<string, any>>({});
  const [learnerQAOverrides, setLearnerQAOverrides] = useState<Record<string, any>>({});

  // Filter states
  const [smeSubjectFilter, setSmeSubjectFilter] = useState<string>("All subjects");
  const [smeStatusFilter, setSmeStatusFilter] = useState<string>("All statuses");
  const [smeReceivedDate, setSmeReceivedDate] = useState<string>("");
  const [smeRespondedDate, setSmeRespondedDate] = useState<string>("");

  const [qaStatusFilter, setQaStatusFilter] = useState<"all" | "answered" | "unanswered">("all");
  const [qaSubjectFilter, setQaSubjectFilter] = useState<string>("All subjects");
  const [qaReceivedDate, setQaReceivedDate] = useState<string>("");
  const [qaRespondedDate, setQaRespondedDate] = useState<string>("");

  useEffect(() => {
    if (tabParam === "learner" || isQaRoute) {
      setActiveTab("learner");
    } else if (tabParam === "sme") {
      setActiveTab("sme");
    }
  }, [tabParam, isQaRoute]);

  // Support navigation from dashboard with state
  const stateEntityId = location.state?.entityId || "";
  const stateEntityType = location.state?.entityType || "";

  // Check if we are in SME Feedback Inbox view (accessed via /studio/feedback without an entity ID)
  const isInboxView =
    !id &&
    !courseId &&
    !stateEntityId &&
    !location.state?.courseId &&
    !location.state?.pathId &&
    !location.state?.lessonId &&
    activeTab === "sme";

  // Inbox filters & search state
  const [inboxStatusFilter, setInboxStatusFilter] = useState<"all" | "changes" | "approved">("all");
  const [inboxSearch, setInboxSearch] = useState<string>("");

  // Load user workspace dashboard for all SME reviews
  const currentUserId = useUserStore((state) => state.user?.id);
  const { data: dashboardData, isLoading: dashboardLoading } = useWorkspaceDashboard(currentUserId);
  const rawInboxReviews: any[] = (dashboardData as any)?.feedbackInbox || [];

  // Auto-discover user's real course if none in URL and not in inbox view.
  const { data: latestEntity } = useLatestReviewableEntity(currentUserId);

  const effectiveId =
    id ||
    courseId ||
    stateEntityId ||
    location.state?.courseId ||
    location.state?.pathId ||
    location.state?.lessonId ||
    (!isInboxView ? latestEntity?.entityId : "") ||
    "";

  const effectiveEntityType = (
    entityType !== "course" ? entityType : stateEntityType || latestEntity?.entityType || "course"
  ) as "course" | "career-path" | "lesson";

  const { selectedFilter, setFilter } = useFeedbackResolutionStore();

  const { data: cardsData, isLoading: cardsLoading } = useCourseFeedback(
    effectiveEntityType as any,
    effectiveId
  );

  const { data: headerDetailsData, isLoading: headerLoading } =
    useFeedbackHeaderDetails(effectiveEntityType as any, effectiveId);

  const { data: summaryData, isLoading: summaryLoading } = useFeedbackSummary(
    effectiveEntityType as any,
    effectiveId
  );

  const { data: completenessData } = useCompletenessEngine(
    effectiveEntityType as any,
    effectiveId
  );

  const { data: realQAData } = useLearnerQA(
    effectiveEntityType as any,
    effectiveId
  );

  const { data: entityReview } = useEntityReview(
    effectiveEntityType as any,
    effectiveId
  );

  const replyMutation = useReplyToFeedback();
  const resolveMutation = useResolveFeedback();
  const resubmitMutation = useResubmitCourse();

  // Combine fetched cards with defaults when empty
  const rawCards = cardsData && cardsData.length > 0 ? cardsData : DEFAULT_SME_CARDS;

  const displayCards: any[] = rawCards.map((c: any) => {
    const override = localCardOverrides[c.id];
    if (override) {
      return { ...c, ...override };
    }
    return c;
  });

  const headerDetails = headerDetailsData || {
    courseName: location.state?.courseName || latestEntity?.title || "Course Feedback",
    statusLabel: "Draft",
    reviewerName: "Unassigned",
    lastReviewTimestamp: "Recently",
    thumbnailUrl: undefined,
  };

  const handleReplySubmit = (cardId: string, replyText: string) => {
    if (effectiveId && cardsData && cardsData.length > 0) {
      replyMutation.mutate(
        {
          entityType: effectiveEntityType as any,
          entityId: effectiveId,
          cardId,
          message: replyText,
        },
        {
          onSuccess: () => toast.success("Reply posted successfully!"),
          onError: () => toast.error("Failed to post reply. Please try again."),
        }
      );
    } else {
      setLocalCardOverrides((prev) => {
        const existingReplies =
          prev[cardId]?.replies ||
          displayCards.find((c) => c.id === cardId)?.replies ||
          [];
        return {
          ...prev,
          [cardId]: {
            ...prev[cardId],
            replies: [...existingReplies, { text: replyText, isAuthor: false }],
          },
        };
      });
      toast.success("Reply posted successfully!");
    }
  };

  const handleResolve = (cardId: string, replyText: string) => {
    setLocalCardOverrides((prev) => ({
      ...prev,
      [cardId]: {
        ...prev[cardId],
        type: "Resolved",
      },
    }));

    const navigateToEditor = () => {
      if (effectiveEntityType === "career-path") {
        navigate(`/studio/path-builder/${effectiveId}`);
      } else if (effectiveEntityType === "lesson") {
        navigate(`/studio/builder/1?type=lesson&lessonId=${effectiveId}`);
      } else {
        navigate(`/studio/builder/1?type=course&courseId=${effectiveId}`);
      }
    };

    if (effectiveId && cardsData && cardsData.length > 0) {
      resolveMutation.mutate(
        { entityType: effectiveEntityType as any, entityId: effectiveId, cardId, developerReply: replyText },
        {
          onSuccess: () => {
            toast.success("Feedback marked as resolved!");
            navigateToEditor();
          },
          onError: () => toast.error("Failed to resolve feedback. Please try again."),
        }
      );
    } else {
      toast.success("Feedback marked as resolved!");
      navigateToEditor();
    }
  };

  // Restore draft progress on mount
  useEffect(() => {
    try {
      const storageKey = `feedback_progress_draft_${effectiveEntityType}_${effectiveId || "default"}`;
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.cardOverrides && Object.keys(parsed.cardOverrides).length > 0) {
          setLocalCardOverrides((prev) => ({ ...parsed.cardOverrides, ...prev }));
        }
        if (parsed.qaOverrides && Object.keys(parsed.qaOverrides).length > 0) {
          setLearnerQAOverrides((prev) => ({ ...parsed.qaOverrides, ...prev }));
        }
      }
    } catch {
      // ignore
    }
  }, [effectiveEntityType, effectiveId]);

  const handleSaveProgress = () => {
    try {
      const storageKey = `feedback_progress_draft_${effectiveEntityType}_${effectiveId || "default"}`;
      const payload = {
        savedAt: new Date().toISOString(),
        cardOverrides: localCardOverrides,
        qaOverrides: learnerQAOverrides,
        selectedFilter,
        smeStatusFilter,
        smeSubjectFilter,
        smeReceivedDate,
        smeRespondedDate,
        qaStatusFilter,
        qaSubjectFilter,
        qaReceivedDate,
        qaRespondedDate,
      };
      localStorage.setItem(storageKey, JSON.stringify(payload));
      toast.success("Progress and resolution drafts saved successfully!");
    } catch {
      toast.success("Progress saved in current session!");
    }
  };

  const handleResubmit = () => {
    if (effectiveId) {
      const currentUser = useUserStore.getState().user;
      const submittedById = currentUser?.id || entityReview?.submittedById;
      const reviewerId = entityReview?.reviewerId;

      resubmitMutation.mutate(
        {
          entityType: effectiveEntityType as any,
          entityId: effectiveId,
          submittedById: submittedById || undefined,
          reviewerId: reviewerId || undefined,
          comment: "Feedback addressed and resubmitted for review.",
        },
        {
          onSuccess: () => {
            toast.success("Submitted to SME review queue!");
            navigate(
              `/studio/content/${effectiveEntityType}/${effectiveId}`
            );
          },
          onError: (err: any) => {
            const errorMsg =
              err?.response?.data?.message ||
              err?.message ||
              "Failed to submit for review.";
            toast.error(errorMsg);
          },
        }
      );
    } else {
      toast.success("Submitted to SME review queue!");
      navigate("/studio/content");
    }
  };

  // Combine real QA data with initial high-fidelity fallback items
  const baseQAItems = realQAData && realQAData.length > 0 ? realQAData : DEFAULT_LEARNER_QA;
  const learnerQAItems = baseQAItems.map((item: any) => {
    const override = learnerQAOverrides[item.id];
    if (override) {
      return { ...item, ...override };
    }
    return item;
  });

  const handleLearnerQAReply = (qaId: string, replyText: string) => {
    feedbackResolutionApi.replyToLearnerQA(qaId, replyText);
    setLearnerQAOverrides((prev) => ({
      ...prev,
      [qaId]: {
        ...prev[qaId],
        status: "Answered",
        reply: replyText,
      },
    }));
    toast.success("Reply submitted successfully!");
  };

  // Distinct subjects for filtering
  const smeSubjects = React.useMemo(() => {
    const set = new Set<string>();
    displayCards.forEach((c) => {
      if (c.lessonRef) set.add(c.lessonRef);
      if ((c as any).subject) set.add((c as any).subject);
    });
    return ["All subjects", ...Array.from(set)];
  }, [displayCards]);

  const qaSubjects = React.useMemo(() => {
    const set = new Set<string>();
    learnerQAItems.forEach((q) => {
      if (q.lessonRef) set.add(q.lessonRef);
      if (q.subject && q.subject !== "All subjects") set.add(q.subject);
    });
    if ((headerDetails as any)?.subject) {
      set.add((headerDetails as any).subject);
    }
    return ["All subjects", ...Array.from(set)];
  }, [learnerQAItems, headerDetails]);

  // Filter calculation
  const requiredCount = displayCards.filter((c) => c.type === "Required").length;
  const suggestionsCount = displayCards.filter((c) => c.type === "Suggestion").length;
  const resolvedCount = displayCards.filter((c) => c.type === "Resolved").length;

  const canResubmit = requiredCount === 0;
  const missingRequired = !canResubmit;

  const filteredCards = displayCards.filter((c) => {
    if (selectedFilter === "required" && c.type !== "Required") return false;
    if (selectedFilter === "suggestions" && c.type !== "Suggestion") return false;
    if (selectedFilter === "resolved" && c.type !== "Resolved") return false;
    if (smeStatusFilter === "Required" && c.type !== "Required") return false;
    if (smeStatusFilter === "Suggestion" && c.type !== "Suggestion") return false;
    if (smeStatusFilter === "Resolved" && c.type !== "Resolved") return false;

    // Subject Filter
    if (smeSubjectFilter && smeSubjectFilter !== "All subjects" && smeSubjectFilter !== "All") {
      const matchSubject = c.lessonRef === smeSubjectFilter || (c as any).subject === smeSubjectFilter;
      if (!matchSubject) return false;
    }

    // Received Date Filter (matches or after)
    if (smeReceivedDate) {
      const cardDate = (c as any).reviewedAt || (c as any).submittedAt || (c as any).createdAt;
      if (cardDate) {
        const d = new Date(cardDate).toISOString().slice(0, 10);
        if (d < smeReceivedDate) return false;
      }
    }

    // Responded Date Filter (matches or before)
    if (smeRespondedDate) {
      const cardDate = (c as any).resolvedAt || (c as any).updatedAt || (c as any).reviewedAt;
      if (cardDate) {
        const d = new Date(cardDate).toISOString().slice(0, 10);
        if (d > smeRespondedDate) return false;
      }
    }

    return true;
  });

  const filteredLearnerQA = learnerQAItems.filter((item: LearnerQuestionItem) => {
    if (qaStatusFilter === "answered" && item.status !== "Answered") return false;
    if (qaStatusFilter === "unanswered" && item.status !== "Unanswered") return false;

    // Subject Filter
    if (qaSubjectFilter && qaSubjectFilter !== "All subjects" && qaSubjectFilter !== "All") {
      const matchSubject = item.lessonRef === qaSubjectFilter || item.subject === qaSubjectFilter;
      if (!matchSubject) return false;
    }

    // Received Date Filter (matches or after)
    if (qaReceivedDate) {
      const itemDate = (item as any).createdAt || (item as any).submittedAt;
      if (itemDate) {
        const d = new Date(itemDate).toISOString().slice(0, 10);
        if (d < qaReceivedDate) return false;
      }
    }

    // Responded Date Filter (matches or before)
    if (qaRespondedDate) {
      const itemDate = (item as any).repliedAt || (item as any).updatedAt;
      if (itemDate) {
        const d = new Date(itemDate).toISOString().slice(0, 10);
        if (d > qaRespondedDate) return false;
      }
    }

    return true;
  });

  const totalQACount = learnerQAItems.length;
  const unansweredQACount = learnerQAItems.filter((q: LearnerQuestionItem) => q.status === "Unanswered").length;

  // Real-time completeness checklist
  const checklistItems = completenessData?.checklist || [];

  // SME Feedback Inbox filtering & metrics (strictly completed SME reviews)
  const filteredInboxReviews = React.useMemo(() => {
    return rawInboxReviews.filter((item) => {
      const statusUpper = String(item.status || "").toUpperCase();
      const isChanges = statusUpper === "CHANGES_REQUESTED" || statusUpper === "REJECTED";
      const isApproved = statusUpper === "APPROVED" || statusUpper === "PUBLISHED";

      if (inboxStatusFilter === "changes" && !isChanges) return false;
      if (inboxStatusFilter === "approved" && !isApproved) return false;

      if (inboxSearch.trim()) {
        const query = inboxSearch.toLowerCase();
        const nameMatch = (item.entityName || "").toLowerCase().includes(query);
        const commentMatch = (item.comment || "").toLowerCase().includes(query);
        const reviewerMatch =
          (item.reviewer?.name || "").toLowerCase().includes(query) ||
          (item.reviewer?.email || "").toLowerCase().includes(query);
        const idMatch =
          (item.id || "").toLowerCase().includes(query) ||
          (item.entityId || "").toLowerCase().includes(query);
        if (!nameMatch && !commentMatch && !reviewerMatch && !idMatch) return false;
      }

      return true;
    });
  }, [rawInboxReviews, inboxStatusFilter, inboxSearch]);

  const totalInboxCount = rawInboxReviews.length;
  const changesInboxCount = rawInboxReviews.filter((r) => {
    const s = String(r.status || "").toUpperCase();
    return s === "CHANGES_REQUESTED" || s === "REJECTED";
  }).length;
  const approvedInboxCount = rawInboxReviews.filter((r) => {
    const s = String(r.status || "").toUpperCase();
    return s === "APPROVED" || s === "PUBLISHED";
  }).length;

  if (isInboxView) {
    return (
      <div className="w-full min-w-0 pb-16 font-['Manrope',system-ui,-apple-system,sans-serif]">
        {/* Back to dashboard */}
        <button
          onClick={() => navigate("/studio")}
          className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#5c5c5c] hover:text-[#141414] transition-colors mb-6 bg-transparent border-none p-0 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>

        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="text-[12px] font-bold uppercase tracking-[0.12em] text-[#5c5c5c] mb-1.5">
              Content Developer Workspace
            </div>
            <h1 className="text-[20px] md:text-[24px] font-bold text-[#141414] tracking-tight leading-tight mb-2">
              SME Feedback Inbox
            </h1>
            <p className="text-[15px] text-[#5c5c5c] max-w-2xl font-normal leading-relaxed">
              All reviews and feedback from Subject Matter Experts on your authored content. Resolve requested changes or inspect review comments.
            </p>
          </div>

          {/* Search bar */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8c8c8c]" />
            <input
              type="text"
              placeholder="Search feedback..."
              value={inboxSearch}
              onChange={(e) => setInboxSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-[14px] bg-white border border-[rgba(17,17,17,0.16)] rounded-full focus:outline-none focus:border-[#141414] transition-colors shadow-2xs placeholder:text-[#8c8c8c]"
            />
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2.5 overflow-x-auto pb-2 mb-6 border-b border-[rgba(17,17,17,0.08)]">
          <button
            onClick={() => setInboxStatusFilter("all")}
            className={`px-4 py-1.5 rounded-full text-[13px] font-bold transition-all cursor-pointer whitespace-nowrap border ${inboxStatusFilter === "all"
                ? "bg-[#141414] text-white border-[#141414]"
                : "bg-white text-[#5c5c5c] border-[rgba(17,17,17,0.16)] hover:border-[rgba(17,17,17,0.3)] hover:text-[#141414]"
              }`}
          >
            All Feedback ({totalInboxCount})
          </button>
          <button
            onClick={() => setInboxStatusFilter("changes")}
            className={`px-4 py-1.5 rounded-full text-[13px] font-bold transition-all cursor-pointer whitespace-nowrap border ${inboxStatusFilter === "changes"
                ? "bg-[#efd3c7] text-[#8f3a20] border-[#ddb0a0]"
                : "bg-white text-[#5c5c5c] border-[rgba(17,17,17,0.16)] hover:border-[rgba(17,17,17,0.3)] hover:text-[#141414]"
              }`}
          >
            Changes Requested ({changesInboxCount})
          </button>
          <button
            onClick={() => setInboxStatusFilter("approved")}
            className={`px-4 py-1.5 rounded-full text-[13px] font-bold transition-all cursor-pointer whitespace-nowrap border ${inboxStatusFilter === "approved"
                ? "bg-[#dce5d3] text-[#446038] border-[#bfcfb4]"
                : "bg-white text-[#5c5c5c] border-[rgba(17,17,17,0.16)] hover:border-[rgba(17,17,17,0.3)] hover:text-[#141414]"
              }`}
          >
            Approved ({approvedInboxCount})
          </button>
        </div>

        {/* Loading State */}
        {dashboardLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-[16px] border border-[rgba(17,17,17,0.1)] p-5 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex gap-3 items-center">
                    <Skeleton className="h-7 w-24 rounded-full bg-gray-200" />
                    <Skeleton className="h-6 w-32 bg-gray-200" />
                  </div>
                  <Skeleton className="h-8 w-24 rounded-full bg-gray-200" />
                </div>
                <div className="space-y-2 mb-4">
                  <Skeleton className="h-5 w-3/4 bg-gray-200" />
                  <Skeleton className="h-4 w-1/2 bg-gray-200" />
                </div>
                <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-6 w-6 rounded-full bg-gray-200" />
                    <Skeleton className="h-4 w-24 bg-gray-200" />
                  </div>
                  <Skeleton className="h-4 w-32 bg-gray-200" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredInboxReviews.length === 0 ? (
          <div className="bg-white rounded-[16px] border border-[rgba(17,17,17,0.1)] p-12 text-center max-w-lg mx-auto shadow-2xs">
            <div className="w-12 h-12 rounded-full bg-[#f6f6f4] text-[#8c8c8c] flex items-center justify-center mx-auto mb-3">
              <BookOpen className="w-6 h-6" />
            </div>
            <h3 className="text-[16px] font-bold text-[#141414] mb-1">No feedback records found</h3>
            <p className="text-[13px] text-[#5c5c5c]">
              {inboxSearch || inboxStatusFilter !== "all"
                ? "No reviews match your active filter criteria."
                : "No SME reviews have been recorded yet for your submitted content."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredInboxReviews.map((review: any) => {
              const statusUpper = String(review.status || "").toUpperCase();
              const isChanges = statusUpper === "CHANGES_REQUESTED" || statusUpper === "REJECTED";
              const isApproved = statusUpper === "APPROVED" || statusUpper === "PUBLISHED";

              const normalizedType =
                String(review.entityType).toLowerCase().includes("career")
                  ? "career-path"
                  : String(review.entityType).toLowerCase().includes("lesson")
                    ? "lesson"
                    : "course";

              const typeBadgeLabel =
                normalizedType === "career-path"
                  ? "Career Path"
                  : normalizedType === "lesson"
                    ? "Lesson"
                    : "Course";

              const statusBadge = isChanges ? (
                <span className="inline-flex items-center gap-1 text-[12px] font-bold px-2.5 py-0.5 rounded-full bg-[#efd3c7] text-[#8f3a20] border border-[#ddb0a0]">
                  <AlertTriangle className="w-3 h-3" /> Changes Requested
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[12px] font-bold px-2.5 py-0.5 rounded-full bg-[#dce5d3] text-[#446038] border border-[#bfcfb4]">
                  <CheckCircle className="w-3 h-3" /> Approved
                </span>
              );

              return (
                <div
                  key={review.id}
                  className="bg-white border border-[rgba(17,17,17,0.1)] rounded-[14px] p-5 shadow-2xs hover:shadow-md hover:border-[rgba(17,17,17,0.2)] transition-all duration-200"
                >
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="min-w-0 flex-1 space-y-2">
                      {/* Badges Row */}
                      <div className="flex flex-wrap items-center gap-2">
                        {statusBadge}
                        <span className="text-[12px] font-semibold text-[#3a3a3a] bg-[#f6f6f4] px-2.5 py-0.5 rounded-full border border-[rgba(17,17,17,0.1)]">
                          {typeBadgeLabel}
                        </span>
                        <span className="text-[12px] text-[#8c8c8c] font-medium font-mono">
                          Review #{review.id.slice(0, 8)}
                        </span>
                        <span className="text-[12px] text-[#8c8c8c]">·</span>
                        <span className="text-[12px] text-[#8c8c8c]">
                          {formatRelativeTime(review.reviewedAt || review.submittedAt)}
                        </span>
                      </div>

                      {/* Content Title */}
                      <h2 className="text-[18px] font-bold text-[#141414] leading-snug">
                        {review.entityName || "Content Item"}
                      </h2>

                      {/* Reviewer line */}
                      <div className="text-[13px] text-[#5c5c5c] font-medium">
                        Reviewed by: <strong className="text-[#141414] font-semibold">{review.reviewer?.name || "SME Reviewer"}</strong>
                        {review.reviewer?.email && <span className="text-[#8c8c8c]"> ({review.reviewer.email})</span>}
                      </div>

                      {/* Comment Quote */}
                      {review.comment && (
                        <blockquote className="text-[14px] text-[#3a3a3a] bg-[#f6f6f4]/60 border-l-3 border-[#141414] pl-3 py-1.5 italic rounded-r-md">
                          "{review.comment}"
                        </blockquote>
                      )}
                    </div>

                    {/* Actions Row */}
                    <div className="flex items-center gap-2.5 shrink-0 pt-1">
                      {isChanges ? (
                        <>
                          <button
                            onClick={() =>
                              navigate(
                                `/studio/feedback/${normalizedType}/${review.entityId}`,
                                {
                                  state: {
                                    entityType: normalizedType,
                                    entityId: review.entityId,
                                    courseName: review.entityName,
                                  },
                                }
                              )
                            }
                            className="bg-[#141414] hover:bg-black text-white font-bold text-[13px] px-4 py-2 rounded-full transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
                          >
                            Resolve feedback &rarr;
                          </button>
                          <button
                            onClick={() =>
                              navigate(
                                `/content-developer/course-preview/${normalizedType}/${review.entityId}`,
                                {
                                  state: {
                                    entityType: normalizedType,
                                    entityId: review.entityId,
                                    courseName: review.entityName,
                                  },
                                }
                              )
                            }
                            className="border border-[rgba(17,17,17,0.16)] bg-white hover:bg-[#f6f6f4] text-[#141414] font-bold text-[13px] px-4 py-2 rounded-full transition-all cursor-pointer shadow-xs"
                          >
                            View preview
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() =>
                              navigate(
                                `/studio/content/${normalizedType}/${review.entityId}`,
                                {
                                  state: {
                                    entityType: normalizedType,
                                    entityId: review.entityId,
                                    courseName: review.entityName,
                                  },
                                }
                              )
                            }
                            className="bg-[#141414] hover:bg-black text-white font-bold text-[13px] px-4 py-2 rounded-full transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
                          >
                            View content &rarr;
                          </button>
                          <button
                            onClick={() =>
                              navigate(
                                `/content-developer/course-preview/${normalizedType}/${review.entityId}`,
                                {
                                  state: {
                                    entityType: normalizedType,
                                    entityId: review.entityId,
                                    courseName: review.entityName,
                                  },
                                }
                              )
                            }
                            className="border border-[rgba(17,17,17,0.16)] bg-white hover:bg-[#f6f6f4] text-[#141414] font-bold text-[13px] px-4 py-2 rounded-full transition-all cursor-pointer shadow-xs"
                          >
                            View preview
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  if ((cardsLoading || headerLoading || summaryLoading) && effectiveId && !displayCards.length) {
    return (
      <div className="min-h-[500px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-7 h-7 animate-spin text-[#C99B2E]" />
          <p className="text-[14px] text-[#5C5C5C] font-medium">Loading feedback...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-w-0 pb-12 font-['Manrope',system-ui,-apple-system,sans-serif]">
      {/* Back to Inbox */}
      <button
        onClick={() => navigate("/studio/feedback")}
        className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#5c5c5c] hover:text-[#141414] transition-colors mb-4 bg-transparent border-none p-0 cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" /> Back to SME Feedback Inbox
      </button>

      {/* Page Header */}
      <div className="cfb-page-head flex max-md:flex-col items-start gap-[16px] max-md:gap-[12px] mb-[24px]">
        {/* Thumbnail Image */}
        <div className="cfb-thumb w-[72px] h-[54px] max-md:w-[56px] max-md:h-[42px] rounded-[10px] bg-[#F6F6F4] border border-[#1111111a] overflow-hidden shrink-0 relative flex items-center justify-center">
          {headerDetails?.thumbnailUrl ? (
            <img
              src={headerDetails.thumbnailUrl}
              alt={headerDetails?.courseName || "Course"}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLElement).style.display = "none";
              }}
            />
          ) : (
            <div className="w-full h-full bg-[#F6F6F4] flex items-center justify-center text-[#5C5C5C]">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                <circle cx="9" cy="9" r="2" />
                <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
              </svg>
            </div>
          )}
        </div>
        <div className="cfb-head-body min-w-0">
          <div className="cfb-eyebrow text-[12px] font-semibold uppercase tracking-[0.12em] text-[#5C5C5C] mb-[6px]">
            Feedback · Author view
          </div>
          <h1 className="cfb-title text-[24px] font-extrabold text-[#141414] leading-[1.2] mb-[12px] tracking-normal">
            Feedback: {headerDetails?.courseName || "Knowledge Mapping Fundamentals"}
          </h1>
          <div className="cfb-head-meta flex flex-wrap items-center gap-[10px]">
            <span
              className={`cfb-chip text-[12px] font-bold tracking-[0.04em] px-[10px] py-[3px] rounded-full border border-transparent ${headerDetails?.statusLabel?.toLowerCase().includes("approv")
                  ? "cfb-chip-sage bg-[#DCE5D3] text-[#446038]"
                  : "cfb-chip-clay bg-[#EFD3C7] text-[#8F3A20]"
                }`}
            >
              {headerDetails?.statusLabel || "Rejected"}
            </span>
            <span className="cfb-loc text-[12px] text-[#5C5C5C] font-semibold tracking-[0.06em]">
              Reviewed by {headerDetails?.reviewerName || "Unassigned"} · {headerDetails?.lastReviewTimestamp || "Recently"}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="cfb-tabs flex border-b border-[#11111129] mb-[24px]" role="tablist" aria-label="Feedback sections">
        <button
          role="tab"
          aria-selected={true}
          className="cfb-tab text-[16px] font-semibold px-[20px] py-[10px] border-b-2 transition-[color,border-color] duration-[180ms] cursor-pointer -mb-[1px] cfb-tab-active border-[#141414] text-[#141414]"
        >
          SME Reviews
        </button>
      </div>

      {/* Tab 1: SME Reviews */}
      {activeTab === "sme" && (
        <>
          {/* Top Filter Chips */}
          <div className="cfb-summary flex flex-wrap items-center gap-[10px] mb-[24px]">
            <button
              onClick={() => setFilter(selectedFilter === "required" ? "all" : "required")}
              className={`cfb-chip cfb-chip-clay cfb-chip-dot inline-flex items-center gap-[5px] text-[12px] font-bold tracking-[0.04em] px-[10px] py-[3px] rounded-full border transition-all cursor-pointer ${selectedFilter === "required"
                  ? "bg-[#8F3A20] text-white border-transparent"
                  : "bg-[#EFD3C7] text-[#8F3A20] border-transparent hover:opacity-90"
                }`}
            >
              <span
                className="w-[6px] h-[6px] rounded-full bg-current opacity-75 shrink-0 inline-block"
              />
              {requiredCount} Required (must resolve)
            </button>
            <button
              onClick={() => setFilter(selectedFilter === "suggestions" ? "all" : "suggestions")}
              className={`cfb-chip cfb-chip-dot inline-flex items-center gap-[5px] text-[12px] font-bold tracking-[0.04em] px-[10px] py-[3px] rounded-full border transition-all cursor-pointer ${selectedFilter === "suggestions"
                  ? "bg-[#3A3A3A] text-white border-transparent"
                  : "bg-[#F6F6F4] text-[#3A3A3A] border-[#11111129] hover:border-[#5C5C5C]"
                }`}
            >
              <span
                className="w-[6px] h-[6px] rounded-full bg-current opacity-75 shrink-0 inline-block"
              />
              {suggestionsCount} Suggestions (optional)
            </button>
            <button
              onClick={() => setFilter(selectedFilter === "resolved" ? "all" : "resolved")}
              className={`cfb-chip cfb-chip-sage cfb-chip-dot inline-flex items-center gap-[5px] text-[12px] font-bold tracking-[0.04em] px-[10px] py-[3px] rounded-full border transition-all cursor-pointer ${selectedFilter === "resolved"
                  ? "bg-[#446038] text-white border-transparent"
                  : "bg-[#DCE5D3] text-[#446038] border-transparent hover:opacity-90"
                }`}
            >
              <span
                className="w-[6px] h-[6px] rounded-full bg-current opacity-75 shrink-0 inline-block"
              />
              {resolvedCount} Resolved
            </button>
          </div>

          {/* Filter Option Buttons & Date inputs */}
          <div className="cfb-filters flex flex-wrap items-center gap-[10px] mb-[20px]">
            {/* Subject dropdown */}
            <div className="ui-select cfb-filter-ctl relative inline-flex items-center">
              <select
                value={smeSubjectFilter}
                onChange={(e) => setSmeSubjectFilter(e.target.value)}
                className="appearance-none border border-[#11111129] rounded-full bg-white text-[12px] font-semibold text-[#3A3A3A] min-w-[158px] h-[36px] pl-[14px] pr-[36px] cursor-pointer hover:border-[#5C5C5C] focus:outline-none focus:border-[#C99B2E] transition-colors"
                aria-label="Filter by subject"
              >
                {smeSubjects.map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </select>
              <span className="ui-select-chev pointer-events-none absolute right-[12px] top-1/2 -translate-y-1/2 text-[#5C5C5C] inline-flex">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </span>
            </div>

            {/* Status dropdown */}
            <div className="ui-select cfb-filter-ctl relative inline-flex items-center">
              <select
                value={smeStatusFilter}
                onChange={(e) => setSmeStatusFilter(e.target.value)}
                className="appearance-none border border-[#11111129] rounded-full bg-white text-[12px] font-semibold text-[#3A3A3A] min-w-[158px] h-[36px] pl-[14px] pr-[36px] cursor-pointer hover:border-[#5C5C5C] focus:outline-none focus:border-[#C99B2E] transition-colors"
                aria-label="Filter by status"
              >
                <option>All statuses</option>
                <option>Required</option>
                <option>Suggestion</option>
                <option>Resolved</option>
              </select>
              <span className="ui-select-chev pointer-events-none absolute right-[12px] top-1/2 -translate-y-1/2 text-[#5C5C5C] inline-flex">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </span>
            </div>

            {/* Received date */}
            <label className="cfb-date-field inline-flex items-center gap-[8px]">
              <span className="text-[12px] font-semibold tracking-[0.04em] text-[#5C5C5C] whitespace-nowrap">
                Received
              </span>
              <input
                type="date"
                value={smeReceivedDate}
                onChange={(e) => setSmeReceivedDate(e.target.value)}
                className="border border-[#11111129] rounded-full bg-white h-[36px] text-[14px] text-[#141414] px-[14px] cursor-pointer focus:outline-none focus:border-[#C99B2E] focus:ring-3 focus:ring-[#C99B2E]/[0.14] transition-all"
                aria-label="Received from date"
              />
            </label>

            {/* Responded date */}
            <label className="cfb-date-field inline-flex items-center gap-[8px]">
              <span className="text-[12px] font-semibold tracking-[0.04em] text-[#5C5C5C] whitespace-nowrap">
                Responded
              </span>
              <input
                type="date"
                value={smeRespondedDate}
                onChange={(e) => setSmeRespondedDate(e.target.value)}
                className="border border-[#11111129] rounded-full bg-white h-[36px] text-[14px] text-[#141414] px-[14px] cursor-pointer focus:outline-none focus:border-[#C99B2E] focus:ring-3 focus:ring-[#C99B2E]/[0.14] transition-all"
                aria-label="Responded from date"
              />
            </label>
          </div>

          {/* Feedback Items List */}
          <div className="cfb-thread-list flex flex-col gap-[24px] w-full mb-[26px]">
            {filteredCards.length === 0 ? (
              <div className="cfb-empty text-center text-[#5C5C5C] text-[16px] bg-white border border-dashed border-[#11111129] rounded-[10px] py-[28px] px-[20px] font-medium">
                No feedback items matching this filter.
              </div>
            ) : (
              Object.entries(
                filteredCards.reduce((acc, card) => {
                  const group = card.lessonRef || "General";
                  if (!acc[group]) acc[group] = [];
                  acc[group].push(card);
                  return acc;
                }, {} as Record<string, any[]>)
              ).map(([groupName, cards]: [string, any]) => (
                <div key={groupName} className="space-y-4 bg-white/50 rounded-[12px] border border-[rgba(17,17,17,0.08)] p-4">
                  <h3 className="text-[15px] font-bold text-[#141414] px-1 flex items-center justify-between">
                    <span>{groupName}</span>
                    <span className="text-[12px] font-medium text-[#5c5c5c] bg-[#f6f6f4] px-2 py-0.5 rounded-full border border-[rgba(17,17,17,0.1)]">
                      {cards.length} issue{cards.length !== 1 ? 's' : ''}
                    </span>
                  </h3>
                  <div className="flex flex-col gap-[16px]">
                    {cards.map((card: any) => (
                      <FeedbackItemCard
                        key={card.id}
                        id={card.id}
                        type={card.type as FeedbackType}
                        lessonRef={card.lessonRef}
                        metadata={card.metadata}
                        quote={card.quote}
                        author={card.author}
                        postedAgo={card.postedAgo}
                        isOptional={card.isOptional}
                        onResolve={handleResolve}
                      />
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Resubmission Checklist */}
          <div className="card cfb-gate w-full bg-white border border-[#1111111a] rounded-[10px] py-[18px] px-[22px] mb-[36px]">
            <div className="cfb-gate-title font-sans text-[14px] font-bold uppercase tracking-[0.08em] text-[#141414] mb-[4px]">
              Resubmission checklist
            </div>
            <p className="cfb-gate-sub text-[16px] text-[#3A3A3A] font-normal leading-[1.5] mb-[14px]">
              All mandatory fields and assets must be complete before this course can be resubmitted for review.
            </p>
            {checklistItems.length > 0 ? (
              <ul className="cfb-gate-list flex flex-col gap-[9px] list-none p-0 m-0">
                {checklistItems.map((item: { label: string; complete: boolean }, idx: number) => (
                  <li
                    key={idx}
                    className={`cfb-gate-item flex items-center gap-[10px] text-[16px] text-[#141414] ${item.complete ? "cfb-gate-ok" : "cfb-gate-missing"
                      }`}
                  >
                    <span
                      className={`cfb-chip cfb-chip-dot inline-flex items-center gap-[5px] text-[12px] font-bold tracking-[0.04em] px-[10px] py-[3px] rounded-full border border-transparent ${item.complete
                          ? "cfb-chip-sage bg-[#DCE5D3] text-[#446038]"
                          : "cfb-chip-clay bg-[#EFD3C7] text-[#8F3A20]"
                        }`}
                    >
                      <span
                        className="w-[6px] h-[6px] rounded-full bg-current opacity-75 shrink-0 inline-block"
                      />
                      {item.complete ? "Complete" : "Missing"}
                    </span>
                    <span className={item.complete ? "font-normal" : "font-bold"}>
                      {item.label}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[14px] text-gray-500 italic">
                Completeness indicators will evaluate as structure, metadata, and assets are uploaded.
              </p>
            )}
          </div>
        </>
      )}

      {/* Footer Action Bar */}
      <div className="cfb-bar bg-white border-t-[1.5px] border-[#11111129] z-5 flex flex-wrap justify-between items-center gap-[14px] mt-[36px] -mx-4 md:-mx-8 lg:-mx-12 px-4 md:px-8 lg:px-12 py-[16px] sticky bottom-0">
        <span className="cfb-bar-note text-[14px] font-semibold tracking-[0.04em] text-[#3A3A3A]">
          {missingRequired
            ? `${requiredCount} mandatory item${requiredCount > 1 ? "s" : ""} still missing`
            : "All required items resolved — ready to resubmit"}
        </span>
        <div className="cfb-bar-actions flex items-center gap-[8px]">
          {/* Save progress */}
          <button
            onClick={handleSaveProgress}
            className="nexus-btn ghost sm bg-white hover:bg-[#F6F6F4] text-[#141414] border-[1.5px] border-[#11111129] hover:border-[#5C5C5C] text-[14px] font-bold px-[14px] py-[8px] rounded-full transition-all duration-150 hover:-translate-y-[1px] cursor-pointer"
          >
            Save progress
          </button>
          {/* Resubmit button */}
          <button
            onClick={handleResubmit}
            disabled={missingRequired || resubmitMutation.isPending}
            title={missingRequired ? "Complete all required items to resubmit" : undefined}
            className={`nexus-btn sm text-[14px] font-bold px-[14px] py-[8px] rounded-full transition-all duration-150 flex items-center gap-2 ${canResubmit && !resubmitMutation.isPending
                ? "bg-[#FCF7AE] hover:bg-[#F0EA8A] text-[#141414] border-[1.5px] border-[#C99B2E8C] shadow-[0_4px_16px_-4px_#2a11081f] hover:-translate-y-[1px] cursor-pointer"
                : "cfb-btn-disabled bg-[#FCF7AE] text-[#141414] border-[1.5px] border-[#C99B2E8C] opacity-[0.42] cursor-not-allowed shadow-none pointer-events-none transform-none"
              }`}
          >
            {resubmitMutation.isPending && (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            )}
            Resubmit for review
          </button>
        </div>
      </div>
    </div>
  );
};

export default ContentDeveloperFeedbackResolution;