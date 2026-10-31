import React, { useState } from "react";
import ReplyEditor from "./ReplyEditor";

export interface ReplyThread {
  author: string;
  comment: string;
  postedAgo: string;
}

interface FeedbackCardProps {
  id: string;
  type: "Required" | "Suggestion" | "Resolved";
  lessonRef: string;
  metadata?: string;
  quote: string;
  author: string;
  postedAgo: string;
  isOptional?: boolean;
  replies: ReplyThread[];
  onReplySubmit?: (cardId: string, replyText: string) => void;
  onResolve?: (cardId: string) => void;
}

export const FeedbackCard: React.FC<FeedbackCardProps> = ({
  id,
  type,
  lessonRef,
  metadata,
  quote,
  author,
  postedAgo,
  isOptional,
  replies,
  onReplySubmit,
  onResolve,
}) => {
  const [replyText, setReplyText] = useState("");
  const isResolved = type === "Resolved";

  const handleReplySubmit = () => {
    if (!replyText.trim()) return;
    onReplySubmit?.(id, replyText);
    setReplyText("");
  };

  // Color config mapping
  const badgeColors = {
    Required: "bg-red-100 text-red-800 border-red-200",
    Suggestion: "bg-slate-100 text-slate-700 border-slate-200",
    Resolved: "bg-emerald-100 text-emerald-800 border-emerald-200",
  };

  const leftBorderColors = {
    Required: "border-l-4 border-l-red-500",
    Suggestion: "border-l border-l-slate-200",
    Resolved: "border-l border-l-slate-200 opacity-70",
  };

  return (
    <div
      className={`bg-white border border-slate-200 rounded-3xl p-5 md:p-6 shadow-sm transition space-y-4 ${leftBorderColors[type] || "border-l-slate-200"}`}
    >
      {/* Top row: badge metadata */}
      <div className="flex items-center gap-2 text-xs">
        <span
          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${
            badgeColors[type] || "bg-slate-100 text-slate-700"
          }`}
        >
          {type}
        </span>
        {lessonRef && (
          <span className="inline-flex items-center px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-200 text-xs font-medium">
            {lessonRef}
          </span>
        )}
        {metadata && (
          <span className="text-slate-500 font-medium">
            {metadata}
          </span>
        )}
      </div>

      {/* Main comment text */}
      <div className="space-y-1">
        <p className="text-base font-medium text-slate-800 leading-relaxed">
          {quote}
        </p>
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium pt-1">
            <span>{author}</span>
            <span>·</span>
            <span>{postedAgo}</span>
          </div>
          {isOptional && (
            <div className="text-xs text-slate-500">
              Optional: does not block resubmission.
            </div>
          )}
        </div>
      </div>

      {/* Reply thread list */}
      {replies.length > 0 && (
        <div className="space-y-3 pl-3 border-l-2 border-slate-100 py-1">
          {replies.map((reply, index) => (
            <div key={index} className="space-y-0.5">
              <p className="text-xs font-medium text-slate-700">
                {reply.comment}
              </p>
              <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium">
                <span className="font-bold text-slate-500">{reply.author}</span>
                <span>·</span>
                <span>{reply.postedAgo}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reply editor and action button row */}
      {!isResolved && (
        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => {
              // Toggle reply editor logic if we had one, 
              // for now just simple button
            }}
            className="h-9 px-5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-full transition"
          >
            Reply
          </button>
          <button
            type="button"
            onClick={() => onResolve?.(id)}
            className={`h-9 px-5 text-sm font-medium rounded-full transition ${
              type === "Required"
                ? "bg-[#FEF08A] hover:bg-[#FDE047] text-amber-900"
                : "bg-white border border-slate-300 hover:bg-slate-50 text-slate-700"
            }`}
          >
            Mark as addressed
          </button>
        </div>
      )}
    </div>
  );
};
export default FeedbackCard;
