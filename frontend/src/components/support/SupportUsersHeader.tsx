import React from "react";

export const SupportUsersHeader: React.FC = () => {
  return (
    <div className="flex flex-col mb-1 select-none">
      <p className="text-[12px] font-bold text-[var(--ink-mute)] uppercase tracking-[0.16em] mb-1.5">
        USER LOOKUP
      </p>

      <h1 className="text-[24px] font-sans font-bold text-[var(--ink)] tracking-tight mb-1.5">
        Find a user
      </h1>

      <p className="text-[16px] text-[#5C5C5C] leading-relaxed max-w-[620px]">
        Scoped user lookup for support engineers. Read access to user profile details and
        learning progress so issues can be reviewed and resolved.
      </p>
    </div>
  );
};

export default SupportUsersHeader;