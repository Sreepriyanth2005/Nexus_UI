import React from "react";
interface ContentTypeBadgeProps { type: "Course" | "Lesson" | "Career Path" | string; tag?: string; }
export const ContentTypeBadge: React.FC<ContentTypeBadgeProps> = ({ type, tag }) => <span className="inline-flex select-none items-center rounded-[var(--r-pill)] border border-[var(--line)] bg-[var(--paper-2)] px-2.5 py-1 text-[10px] font-[var(--fw-semibold)] uppercase tracking-[0.04em] text-[var(--ink-soft)] transition-colors duration-[var(--dur-fast)] hover:border-[var(--line-strong)] hover:bg-[var(--paper)]">{tag || type || "-"}</span>;
export default ContentTypeBadge;
