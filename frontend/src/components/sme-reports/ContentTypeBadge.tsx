import React from "react";

export type ContentType = "Course" | "Lesson" | "Career Path";

interface ContentTypeBadgeProps { type: ContentType; }

export const ContentTypeBadge: React.FC<ContentTypeBadgeProps> = ({ type }) => (
  <span className="inline-flex items-center whitespace-nowrap rounded-[var(--r-pill)] border border-[var(--line)] bg-[var(--paper-2)] px-2 py-1 text-[10px] font-semibold leading-none text-[var(--ink-soft)] select-none">
    {type}
  </span>
);

export default ContentTypeBadge;
