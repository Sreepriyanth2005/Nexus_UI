import React from 'react';
import { ArrowRight } from 'lucide-react';

export const SponsoredBanner: React.FC = () => {
  return (
    <div className="w-full bg-[#fce8e6] border-b border-[#fad2cf] px-4 py-2 flex items-center justify-between text-xs select-none">
      <div className="flex items-center gap-3">
        <span className="font-bold text-[12px] tracking-wider uppercase bg-white border border-[#fad2cf] text-[#d93025] px-1.5 py-0.5 rounded">
          Sponsored
        </span>
        <span className="text-[#3c4043] font-medium text-[14px] flex items-center gap-2">
          <span className="font-bold shrink-0">Ad placeholder</span>
          <span className="shrink-0">-</span>
          <span className="truncate text-[#3a3a3a]">Featured course, partner promo, or new program launch</span>
        </span>
      </div>
      <button className="flex items-center gap-1 text-[#1967d2] font-bold uppercase tracking-wider text-[12px] hover:underline cursor-pointer bg-transparent border-none">
        <span>Learn More</span>
        <ArrowRight className="w-3 h-3" />
      </button>
    </div>
  );
};

export default SponsoredBanner;
