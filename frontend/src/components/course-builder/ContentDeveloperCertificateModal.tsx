import React, { useEffect, useRef } from "react";
import { X, Printer, Award, CheckCircle2 } from "lucide-react";
import { useCertificateDesign } from "../../hooks/certificate/certificate";

interface ContentDeveloperCertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityTitle: string;
  publishType: "career-path" | "standalone-course" | "standalone-lesson";
  entityId?: string | null;
  authorName?: string | null;
}

const ACCENT_COLORS = [
  { id: "gold", hex: "#C99B2E", label: "Gold" },
  { id: "blue", hex: "#2C5E92", label: "Blue" },
  { id: "green", hex: "#5F7D52", label: "Green" },
  { id: "terracotta", hex: "#8A4B3B", label: "Terracotta" },
  { id: "darkgrey", hex: "#3A3A3A", label: "Dark Grey" },
];

export const ContentDeveloperCertificateModal: React.FC<ContentDeveloperCertificateModalProps> = ({
  isOpen,
  onClose,
  entityTitle,
  publishType,
  authorName,
}) => {
  const { data: designRes, isLoading: isDesignLoading } = useCertificateDesign();
  const [logoError, setLogoError] = React.useState(false);
  const certRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const design = (designRes as any)?.data || null;

  const templateStyle: "Classic" | "Modern" | "Minimal" =
    design?.templateStyle === "Modern" || design?.templateStyle === "Minimal"
      ? design.templateStyle
      : "Classic";

  const orientation: "Landscape" | "Portrait" =
    design?.orientation === "Portrait" ? "Portrait" : "Landscape";

  const rawColor = design?.accentColor || "#C99B2E";
  const matchedColor = ACCENT_COLORS.find(c => c.hex === rawColor || c.id === rawColor);
  const accentColor = matchedColor ? matchedColor.hex : (rawColor.startsWith("#") ? rawColor : "#C99B2E");

  const logoUrl = design?.logoUrl || null;
  const signatoryName = design?.signatoryName || "";

  // Entity label
  const typeLabel =
    publishType === "standalone-lesson"
      ? "Lesson Certificate"
      : publishType === "career-path"
        ? "Career Path Certificate"
        : "Course Certificate";

  // Dynamic Course/Lesson title from creation/edit flow
  const displayTitle =
    entityTitle?.trim() ||
    (publishType === "standalone-lesson"
      ? "Untitled Lesson"
      : publishType === "career-path"
        ? "Untitled Career Path"
        : "Untitled Course");

  // Professional static placeholder for preview
  const recipientDisplayName = "Learner’s Name";

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-[2px] animate-in fade-in duration-200 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative bg-[var(--paper,#ffffff)] rounded-2xl shadow-2xl border border-[var(--line,#e5e7eb)] w-full max-w-4xl max-h-[94vh] flex flex-col overflow-hidden my-auto">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 bg-[var(--paper,#ffffff)] border-b border-[var(--line,#e5e7eb)]">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${accentColor}18`, color: accentColor }}
            >
              <Award className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-[var(--fw-bold,700)] text-[var(--ink,#141414)] tracking-tight font-[family-name:var(--font-sans)]">
                  Certificate Preview
                </h3>
                <span
                  className="px-2.5 py-0.5 text-[11px] font-[var(--fw-semibold,600)] rounded-full border"
                  style={{
                    backgroundColor: `${accentColor}12`,
                    borderColor: `${accentColor}30`,
                    color: accentColor,
                  }}
                >
                  {typeLabel}
                </span>
              </div>
              <p className="text-xs text-[var(--ink-mute,#5c5c5c)] font-[family-name:var(--font-sans)]">
                Rendered using the approved Super Admin template design with current {publishType === "standalone-lesson" ? "lesson" : "course"} data
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-[var(--line,#e5e7eb)] bg-[var(--paper,#ffffff)] text-xs font-[var(--fw-bold,700)] text-[var(--ink,#141414)] hover:bg-[var(--paper-2,#f6f6f4)] transition-colors cursor-pointer shadow-xs font-[family-name:var(--font-sans)]"
            >
              <Printer className="w-3.5 h-3.5" />
              Print / Save PDF
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--ink-mute,#5c5c5c)] hover:text-[var(--ink,#141414)] hover:bg-[var(--paper-2,#f6f6f4)] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Certificate Display Area */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 flex items-center justify-center bg-[var(--paper-2,#f6f6f4)]">
          {isDesignLoading ? (
            <div className="py-24 text-center">
              <div
                className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-3"
                style={{ borderColor: accentColor, borderTopColor: "transparent" }}
              />
              <p className="text-sm text-[var(--ink-mute,#5c5c5c)] font-[var(--fw-medium,500)]">
                Loading certificate design...
              </p>
            </div>
          ) : (
            /* ── Outer Card matching Super Admin CertificateDesign.tsx exactly ── */
            <div
              ref={certRef}
              id="certificate-print-area"
              className="relative w-full max-w-[760px] bg-[var(--paper,#ffffff)] shadow-lg overflow-hidden transition-all duration-300"
              style={{
                aspectRatio: orientation === "Landscape" ? "1.414/1" : "1/1.414",
                borderRadius: "14px",
                border:
                  templateStyle === "Modern"
                    ? `2px solid ${accentColor}`
                    : "1px solid var(--line-strong, rgba(17,17,17,0.16))",
              }}
            >
              {/* Top Accent Bar based on template */}
              {templateStyle === "Classic" && (
                <div style={{ height: "10px", width: "100%", backgroundColor: accentColor }} />
              )}
              {templateStyle === "Modern" && (
                <div style={{ height: "8px", width: "100%", backgroundColor: accentColor }} />
              )}
              {templateStyle === "Minimal" && (
                <div style={{ height: "3px", width: "100%", backgroundColor: accentColor }} />
              )}

              {/* ── Inner Content matching Super Admin CertificateContent exactly ── */}
              <div className="acs-cert acs-cert-modern acs-cert-landscape absolute inset-0 flex flex-col items-center justify-between pt-5 sm:pt-[30px] md:pt-[40px] px-5 sm:px-[34px] md:px-[44px] pb-4 sm:pb-[24px] md:pb-[30px] text-center overflow-y-auto">
                {/* Logo */}
                {logoUrl && !logoError ? (
                  <img
                    src={logoUrl}
                    alt="Institute logo"
                    className="w-8 h-8 sm:w-10 sm:h-10 md:w-11 md:h-11 object-contain rounded-[var(--r-md,8px)] shrink-0"
                    onError={() => setLogoError(true)}
                  />
                ) : (
                  <div
                    className="w-8 h-8 sm:w-10 sm:h-10 md:w-11 md:h-11 rounded-[var(--r-md,8px)] flex items-center justify-center text-white font-[var(--fw-bold,700)] text-[10px] sm:text-[length:var(--fs-meta,12px)] shrink-0 font-[family-name:var(--font-sans)]"
                    style={{ backgroundColor: accentColor }}
                  >
                    NX
                  </div>
                )}

                {/* Body Content */}
                <div className="flex-1 flex flex-col justify-center my-2 sm:my-0 max-w-xl">
                  <p
                    className="text-[8px] sm:text-[9px] md:text-[length:var(--fs-micro,10px)] font-[var(--fw-bold,700)] tracking-[var(--ls-label,0.1em)] uppercase mb-2 sm:mb-4 font-[family-name:var(--font-sans)]"
                    style={{ color: accentColor }}
                  >
                    Certificate of Completion
                  </p>

                  <p className="text-[var(--ink-mute,#5c5c5c)] text-[10px] sm:text-[11px] md:text-[length:var(--fs-meta,12px)] mb-1 sm:mb-1.5 font-[family-name:var(--font-sans)]">
                    This certifies that
                  </p>

                  {/* Neutral professional placeholder */}
                  <h1 className="text-[18px] sm:text-[length:var(--fs-h1,26px)] md:text-[30px] font-[var(--fw-bold,700)] text-[var(--ink,#141414)] mb-1.5 sm:mb-2.5 leading-tight tracking-tight font-[family-name:var(--font-serif)]">
                    {recipientDisplayName}
                  </h1>

                  <p className="text-[var(--ink-mute,#5c5c5c)] text-[10px] sm:text-[11px] md:text-[length:var(--fs-meta,12px)] mb-1 sm:mb-1.5 font-[family-name:var(--font-sans)]">
                    has successfully completed
                  </p>

                  {/* Dynamic Entity (Lesson or Course) Title */}
                  <p
                    className="text-[length:var(--fs-label,13px)] sm:text-[length:var(--fs-meta,14px)] md:text-[length:var(--fs-body,16px)] font-[var(--fw-semibold,600)] mb-2 sm:mb-3 font-[family-name:var(--font-sans)] px-4"
                    style={{ color: accentColor }}
                  >
                    {displayTitle}
                  </p>

                  {/* Example completion date */}
                  <p className="mb-2 sm:mb-3 text-[var(--ink-mute,#5c5c5c)] text-[9px] sm:text-[11px] md:text-[length:var(--fs-meta,12px)] font-[family-name:var(--font-sans)]">
                    Completed on "14 May 2026"
                  </p>
                </div>

                {/* Author / Signatory Footer - Under the Author Name, do not display a designation (Requirement 2) */}
                <div className="flex flex-col items-center w-full shrink-0">
                  <p className="text-[var(--ink,#141414)] text-[length:var(--fs-label,12px)] sm:text-[length:var(--fs-meta,13px)] md:text-[length:var(--fs-body,14px)] font-[var(--fw-medium,500)] font-[family-name:var(--font-serif)]">
                    {authorName || signatoryName || "Nexus Academy"}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer info banner */}
        <div className="bg-[var(--paper,#ffffff)] border-t border-[var(--line,#e5e7eb)] px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[var(--ink-mute,#5c5c5c)]">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>
              Dynamic binding: Showing current <strong>{displayTitle}</strong>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-[var(--ink-faint,#8c8c8c)]">
              Template: {templateStyle} · {orientation}
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-full bg-[var(--ink,#141414)] text-white font-[var(--fw-semibold,600)] text-xs hover:opacity-90 transition-opacity cursor-pointer font-[family-name:var(--font-sans)]"
            >
              Done Previewing
            </button>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #certificate-print-area, #certificate-print-area * {
            visibility: visible;
          }
          #certificate-print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100vw !important;
            max-width: 100vw !important;
            margin: 0 !important;
            box-shadow: none !important;
            border-radius: 0 !important;
          }
        }
      `}</style>
    </div>
  );
};

export default ContentDeveloperCertificateModal;
