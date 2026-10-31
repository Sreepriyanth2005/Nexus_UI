import React from "react";
import { useParams } from "react-router";
import { usePublicCertificate } from "../../hooks/certificate/useCertificates";
import { AlertTriangle, Printer, CheckCircle2 } from "lucide-react";
import CertificatePreview from "../../components/certificates/CertificatePreview";

export const PublicCertificatePreview: React.FC = () => {
  const { token } = useParams<{ token: string }>();

  const { data, isLoading, isError } = usePublicCertificate(
    token || "",
    !!token
  );

  const handlePrint = () => {
    window.print();
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="bg-white border border-(--line) rounded-2xl p-16 text-center text-(--ink-mute) shadow-sm max-w-2xl mx-auto animate-pulse select-none">
          <p className="text-sm font-semibold">Loading verified certificate...</p>
        </div>
      );
    }

    if (isError) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-10 text-center text-red-800 max-w-2xl mx-auto shadow-sm select-none">
          <AlertTriangle size={36} className="text-red-500 mx-auto mb-3" />
          <h3 className="text-base font-bold">Invalid or Expired Link</h3>
          <p className="text-xs font-semibold text-red-600 mt-2 leading-relaxed">
            The verification link you used is invalid, expired, or has been revoked.
          </p>
        </div>
      );
    }

    if (!data?.data) return null;

    const cert = data.data;

    if (cert.isRevoked) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-10 text-center text-red-800 max-w-2xl mx-auto shadow-sm select-none">
          <AlertTriangle size={36} className="text-red-500 mx-auto mb-3" />
          <h3 className="text-base font-bold">Certificate Revoked</h3>
          <p className="text-xs font-semibold text-red-600 mt-2 leading-relaxed">
            This credential has been revoked and is no longer valid.
          </p>
        </div>
      );
    }

    const completionDateFormatted = cert.issuedAt
      ? new Date(cert.issuedAt).toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
        }).toUpperCase()
      : "PENDING";

    const proofId = cert.serialNumber || cert.certificateId || "NX-CREDENTIAL";

    return (
      <div className="w-full max-w-4xl mx-auto space-y-6">
        {/* Certificate Display (Matches member certificate page exactly) */}
        <div id="printable-certificate" className="w-full">
          <CertificatePreview
            userName={cert.recipientName || "Learner"}
            courseName={cert.courseTitle || "Course"}
            completionDate={completionDateFormatted}
            certificateId={proofId}
          />
        </div>

        {/* Action / Print Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
          <div className="flex items-center gap-2 text-[13px] text-(--ink-mute)">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Verified credential issued by Nexus Academy</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-(--line) bg-white hover:bg-(--paper-2) text-(--ink) text-xs font-bold transition-all shadow-sm cursor-pointer hover:-translate-y-0.5 active:scale-95"
            >
              <Printer className="w-3.5 h-3.5" />
              Print Certificate
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-certificate, #printable-certificate * {
            visibility: visible;
          }
          #printable-certificate {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 0;
          }
        }
      `}</style>
      <div className="min-h-screen bg-[var(--paper-2)] py-10 px-4 sm:px-6 flex items-center justify-center">
        {renderContent()}
      </div>
    </>
  );
};

export default PublicCertificatePreview;
