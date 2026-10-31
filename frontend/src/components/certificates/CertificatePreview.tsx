import React, { useState, useEffect } from "react";
import { useCertificateDesign } from "../../hooks/certificate/certificate";

export const ACCENT_COLORS = [
  { id: "gold", hex: "#C99B2E", label: "Gold" },
  { id: "blue", hex: "#2C5E92", label: "Blue" },
  { id: "green", hex: "#5F7D52", label: "Green" },
  { id: "terracotta", hex: "#8A4B3B", label: "Terracotta" },
  { id: "darkgrey", hex: "#3A3A3A", label: "Dark Grey" },
];

export interface CertificateContentProps {
  accentColor: string;
  logoPreview: string | null;
  signatoryName: string;
  signatoryTitle?: string;
  footerLine?: string;
  recipientText: string;
  learningText: string;
  dateText: string;
  idText: string;
}

export const CertificateContent: React.FC<CertificateContentProps> = ({
  accentColor,
  logoPreview,
  signatoryName,
  signatoryTitle,
  footerLine,
  recipientText,
  learningText,
  dateText,
  idText,
}) => {
  const [logoError, setLogoError] = useState(false);

  useEffect(() => {
    setLogoError(false);
  }, [logoPreview]);

  return (
    <div className="acs-cert acs-cert-modern acs-cert-landscape absolute inset-0 flex flex-col items-center justify-between pt-5 sm:pt-[30px] md:pt-[40px] px-5 sm:px-[34px] md:px-[44px] pb-4 sm:pb-[24px] md:pb-[30px] text-center overflow-y-auto">
      {/* Logo */}
      {logoPreview && !logoError ? (
        <img
          src={logoPreview}
          alt="Institute logo"
          className="w-8 h-8 sm:w-10 sm:h-10 md:w-11 md:h-11 object-contain rounded-[var(--r-md)] shrink-0"
          onError={() => setLogoError(true)}
        />
      ) : (
        <div
          className="w-8 h-8 sm:w-10 sm:h-10 md:w-11 md:h-11 rounded-[var(--r-md)] flex items-center justify-center text-white font-[var(--fw-bold)] text-[10px] sm:text-[length:var(--fs-meta)] shrink-0"
          style={{ fontFamily: "var(--font-sans)", backgroundColor: accentColor }}
        >
          NX
        </div>
      )}

      <div className="flex-1 flex flex-col justify-center my-2 sm:my-0">
        <p
          className="text-[8px] sm:text-[9px] md:text-[length:var(--fs-micro)] font-[var(--fw-bold)] tracking-[var(--ls-label)] uppercase mb-2 sm:mb-4"
          style={{ fontFamily: "var(--font-sans)", color: accentColor }}
        >
          Certificate of Completion
        </p>

        <p
          className="text-[var(--ink-mute)] text-[10px] sm:text-[11px] md:text-[length:var(--fs-meta)] mb-1 sm:mb-1.5"
          style={{ fontFamily: "var(--font-sans)" }}
        >
          This certifies that
        </p>

        <h1
          className="text-[18px] sm:text-[24px] md:text-[30px] font-[var(--fw-bold)] text-[var(--ink)] mb-1.5 sm:mb-2.5 leading-tight tracking-tight"
          style={{ fontFamily: "var(--font-serif)" }}
        >
          {recipientText}
        </h1>

        <p
          className="text-[var(--ink-mute)] text-[10px] sm:text-[11px] md:text-[length:var(--fs-meta)] mb-1 sm:mb-1.5"
          style={{ fontFamily: "var(--font-sans)" }}
        >
          has successfully completed
        </p>

        <p
          className="text-[12px] sm:text-[13px] md:text-[length:var(--fs-body)] font-[var(--fw-semibold)] mb-2 sm:mb-3"
          style={{ fontFamily: "var(--font-sans)", color: accentColor }}
        >
          {learningText}
        </p>

        <p
          className="mb-2 sm:mb-3 text-[var(--ink-mute)] text-[9px] sm:text-[11px] md:text-[14px]"
          style={{ fontFamily: "var(--font-sans)" }}
        >
          Completed {dateText} &middot; Credential #{idText}
        </p>
      </div>

      {/* Signatory Footer */}
      <div className="flex flex-col items-center w-full shrink-0">
        <div className="w-[80px] sm:w-[110px] md:w-[140px] border-t border-[var(--ink-mute)] mb-1.5 shrink-0" />
        <p
          className="text-[var(--ink)] text-[12px] sm:text-[14px] md:text-[16px] font-[var(--fw-medium)]"
          style={{ fontFamily: "var(--font-serif)" }}
        >
          {signatoryName}
        </p>
        {signatoryTitle && (
          <p
            className="text-[var(--ink-mute)] text-[9px] sm:text-[10px] md:text-[11px] font-[var(--fw-regular)] mt-0.5"
            style={{ fontFamily: "var(--font-sans)" }}
          >
            {signatoryTitle}
          </p>
        )}
        {footerLine && (
          <p
            className="text-[var(--ink-faint)] text-[8px] sm:text-[9px] md:text-[10px] font-[var(--fw-regular)] mt-1.5 sm:mt-2"
            style={{ fontFamily: "var(--font-sans)" }}
          >
            {footerLine}
          </p>
        )}
      </div>
    </div>
  );
};

export interface CertificatePreviewProps {
  userName?: string;
  courseName?: string;
  completionDate?: string;
  certificateId?: string;
  template?: "Classic" | "Modern" | "Minimal";
  orientation?: "Landscape" | "Portrait";
  accentColor?: string;
  signatoryName?: string;
  signatoryTitle?: string;
  footerLine?: string;
  logoPreview?: string | null;
  className?: string;
}

export const CertificatePreview: React.FC<CertificatePreviewProps> = ({
  userName = "Learner",
  courseName = "Course",
  completionDate = "14 May 2026",
  certificateId = "NX-2026-08814",
  template: propTemplate,
  orientation: propOrientation,
  accentColor: propAccentColor,
  signatoryName: propSignatoryName,
  signatoryTitle: propSignatoryTitle,
  footerLine: propFooterLine,
  logoPreview: propLogoPreview,
  className = "",
}) => {
  const { data: designResponse } = useCertificateDesign();
  const d = (designResponse?.data as any) || {};

  const template = propTemplate || d.templateStyle || "Classic";
  const orientation = propOrientation || d.orientation || "Landscape";

  const rawColor = propAccentColor || d.accentColor || "gold";
  const matchedColor = ACCENT_COLORS.find(
    (c) => c.hex?.toLowerCase() === rawColor?.toLowerCase() || c.id?.toLowerCase() === rawColor?.toLowerCase()
  );
  const currentColorHex = matchedColor?.hex || (rawColor?.startsWith("#") ? rawColor : "#C99B2E");

  const signatoryName = propSignatoryName || d.signatoryName || "Dr. Aisha Al-Balushi";
  const signatoryTitle = propSignatoryTitle !== undefined ? propSignatoryTitle : (d.signatoryTitle ?? "Director, Academic Affairs, Nexus Academy");
  const footerLine = propFooterLine !== undefined ? propFooterLine : (d.footerLine ?? "Verify this credential at nexusacademy.org/verify");
  const logoPreview = propLogoPreview !== undefined ? propLogoPreview : (d.logoUrl || null);

  const sharedContent = (
    <CertificateContent
      accentColor={currentColorHex}
      logoPreview={logoPreview}
      signatoryName={signatoryName}
      signatoryTitle={signatoryTitle}
      footerLine={footerLine}
      recipientText={userName}
      learningText={courseName}
      dateText={completionDate}
      idText={certificateId}
    />
  );

  return (
    <div className={`w-full ${className}`}>
      {/* ── CLASSIC: thick top accent bar, plain white card ── */}
      {template === "Classic" && (
        <div
          className="relative w-full bg-white shadow-lg overflow-hidden"
          style={{
            aspectRatio: orientation === "Landscape" ? "1.414/1" : "1/1.414",
            borderRadius: "14px",
            border: "1px solid var(--line-strong)",
          }}
        >
          {/* Thick accent bar */}
          <div style={{ height: "10px", width: "100%", backgroundColor: currentColorHex }} />
          {sharedContent}
        </div>
      )}

      {/* ── MODERN: accent border + top accent bar ── */}
      {template === "Modern" && (
        <div
          className="relative w-full bg-white shadow-lg overflow-hidden"
          style={{
            aspectRatio: orientation === "Landscape" ? "1.414/1" : "1/1.414",
            borderRadius: "14px",
            border: `2px solid ${currentColorHex}`,
          }}
        >
          {/* Top accent bar */}
          <div style={{ height: "8px", width: "100%", backgroundColor: currentColorHex }} />
          {sharedContent}
        </div>
      )}

      {/* ── MINIMAL: thin 3px top line ── */}
      {template === "Minimal" && (
        <div
          className="relative w-full bg-white shadow-lg overflow-hidden"
          style={{
            aspectRatio: orientation === "Landscape" ? "1.414/1" : "1/1.414",
            borderRadius: "14px",
            border: "1px solid var(--line-strong)",
          }}
        >
          {/* Thin accent line */}
          <div style={{ height: "3px", width: "100%", backgroundColor: currentColorHex }} />
          {sharedContent}
        </div>
      )}

      {/* Fallback */}
      {template !== "Classic" && template !== "Modern" && template !== "Minimal" && (
        <div
          className="relative w-full bg-white shadow-lg overflow-hidden"
          style={{
            aspectRatio: orientation === "Landscape" ? "1.414/1" : "1/1.414",
            borderRadius: "14px",
            border: "1px solid var(--line-strong)",
          }}
        >
          <div style={{ height: "10px", width: "100%", backgroundColor: currentColorHex }} />
          {sharedContent}
        </div>
      )}
    </div>
  );
};

export default CertificatePreview;
