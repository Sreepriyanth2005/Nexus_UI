import React from "react";
import { Award } from "lucide-react";

export const CertificateCard: React.FC = () => {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3 select-none">
      {/* Title */}
      <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
        Earn on completion
      </h3>

      {/* Certificate Box */}
      <div className="flex items-center gap-3.5 pt-1">
        {/* Certificate Logo Circle */}
        <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-250 flex items-center justify-center shrink-0">
          <Award size={18} className="text-slate-700" />
        </div>

        {/* Info */}
        <div className="space-y-0.5">
          <h4 className="text-xs font-bold text-slate-800 leading-tight">
            KMP Foundation certificate
          </h4>
          <p className="text-[9px] font-semibold text-slate-450 leading-relaxed">
            Verifiable at nexusacademy.org/verify/
          </p>
        </div>
      </div>
    </div>
  );
};

export default CertificateCard;
