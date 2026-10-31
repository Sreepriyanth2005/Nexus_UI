import React from "react";
import { useNavigate } from "react-router";
import { Button } from "../ui/Button/Button";
import shareIcon from "../../assets/icons/share-2.svg";
import arrowLeftIcon from "../../assets/icons/arrow-left.svg";

interface CertificateHeaderProps {
  courseName: string;
  completionDate: string;
  onShare?: () => void;
  proofId?: string;
  showDownload?: boolean; // kept for backwards compatibility if needed
  isDownloading?: boolean; // kept for backwards compatibility if needed
  onDownload?: () => void; // kept for backwards compatibility if needed
}

const CertificateHeader: React.FC<CertificateHeaderProps> = ({
  courseName,
  completionDate,
  onShare,
  proofId = "NX-CDMP-P-2026-04821"
}) => {
  const navigate = useNavigate();
  return (
    <div className="mb-8">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-[12px] font-semibold text-(--ink-mute) uppercase tracking-widest mb-6 hover:text-(--ink) transition-colors cursor-pointer"
      >
        <img src={arrowLeftIcon} alt="Back" className="w-3.5 h-3.5" /> COMPLETED
      </button>

      <div className="flex items-start justify-between">
        <div>
          <p className="text-[12px] uppercase tracking-widest font-bold text-(--ink-mute) mb-2">
            COURSE COMPLETED
          </p>
          <h1 className="text-[32px] font-bold text-(--ink) mb-2 tracking-tight leading-none">
            {courseName}
          </h1>
          <p className="text-[16px] text-(--ink-mute) mt-2">
            Issued {completionDate} &middot; Proof ID {proofId} &middot; Verifiable
          </p>
        </div>

        <div>
          <button
            onClick={onShare}
            className="inline-flex text-[14px] items-center justify-center gap-2 font-bold leading-none whitespace-nowrap cursor-pointer transition-all duration-[180ms] ease-nexus h-[40px] px-5 py-2.5 rounded-full bg-(--paper) border border-(--line) text-(--ink)  hover:shadow-hover  hover:border-(--ink-mute) hover:bg-(--surface-3)"
          >
            <img src={shareIcon} alt="Share" className="w-4 h-4" />
            Share
          </button>
        </div>
      </div>
    </div>
  );
};

export default CertificateHeader;
