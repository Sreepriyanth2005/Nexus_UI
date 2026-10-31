import React from "react";

export const SupportHeader: React.FC = () => {
  return (
    <div className="flex items-center justify-between border-b border-line-strong pb-5 mb-6">
      <div>
        <h1 className="text-hero font-bold text-ink leading-tight">Support console</h1>
        <p className="text-body text-ink-mute mt-1 font-medium">
          Support Engineer <span className="text-gray-300 mx-1.5">•</span> Maria Lopez
        </p>
      </div>
      <div className="flex items-center gap-3">
        {/* Right side avatar */}
        <div className="w-10 h-10 rounded-full bg-line-strong flex items-center justify-center font-bold text-ink-soft text-body select-none border border-gray-300">
          ML
        </div>
      </div>
    </div>
  );
};
