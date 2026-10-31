import React from "react";
import { Info } from "lucide-react";
export const ReviewScopeBanner: React.FC = () => (
  <div className="flex min-h-[50px] items-center gap-4 rounded-lg bg-[var(--c-honey-wash)] px-4 py-3 text-[11px] font-medium leading-relaxed text-[var(--ink)] mb-2.5">
    <Info className="size-4 shrink-0 text-[var(--c-honey-text)]" />
    <p className="m-0 text-base">
      <strong className="font-bold text-[var(--ink)]">Scope rule:</strong> SME view shows only content assigned to Dr. Faris Al-Maamari. Super Admin view shows all queue items across all SMEs. Items grouped by Career Path so you can review related content together.
    </p>
  </div>
);
export default ReviewScopeBanner;
