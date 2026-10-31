import React, { useState, useEffect } from "react";
import { useParams, useSearchParams } from "react-router";
import { useCertificateVerification } from "../../hooks/certificate/useCertificates";
import {
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Calendar,
  User,
  BookOpen,
  Award,
} from "lucide-react";

export const CertificateVerification: React.FC = () => {
  const { serialNumber: urlSerial } = useParams<{ serialNumber?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const querySerial = searchParams.get("serial") || "";

  const [inputSerial, setInputSerial] = useState(urlSerial || querySerial);
  const [activeSerial, setActiveSerial] = useState(urlSerial || querySerial);

  const { data, isLoading, isError, error } = useCertificateVerification(
    activeSerial,
    !!activeSerial
  );

  // Sync if URL or Query param changes
  useEffect(() => {
    const currentSerial = urlSerial || querySerial;
    if (currentSerial) {
      setInputSerial(currentSerial);
      setActiveSerial(currentSerial);
    }
  }, [urlSerial, querySerial]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputSerial.trim()) {
      setActiveSerial(inputSerial.trim());
      setSearchParams({ serial: inputSerial.trim() });
    }
  };

  const renderResult = () => {
    if (!activeSerial) {
      return (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-400 select-none shadow-sm">
          <Search size={32} className="mx-auto text-slate-350 mb-3" />
          <p className="text-sm font-semibold">Enter a Certificate ID to verify credentials.</p>
        </div>
      );
    }

    if (isLoading) {
      return (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500 shadow-sm animate-pulse select-none">
          <p className="text-sm font-bold">Verifying Certificate ID...</p>
        </div>
      );
    }

    // Handle 404 / Error (Invalid Certificate)
    const isNotFound = isError && ((error as any)?.response?.status === 404 || (error as any)?.message?.includes("not found"));
    if (isNotFound) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-8 flex flex-col items-center text-center shadow-sm select-none">
          <XCircle size={40} className="text-red-500 mb-3" />
          <h3 className="text-sm font-bold text-red-800">Certificate not found.</h3>
          <p className="text-xs font-semibold text-red-600 mt-1">
            The Certificate ID you provided does not match any credentials in our registry.
          </p>
        </div>
      );
    }

    if (isError) {
      return (
        <div className="bg-amber-50 border border-amber-205 rounded-2xl p-8 flex flex-col items-center text-center shadow-sm select-none">
          <AlertTriangle size={40} className="text-amber-500 mb-3" />
          <h3 className="text-sm font-bold text-amber-800">Verification check failed.</h3>
          <p className="text-xs font-semibold text-amber-600 mt-1">
            {(error as any)?.response?.data?.message || (error as any)?.message || "Network error. Please try again."}
          </p>
        </div>
      );
    }

    if (!data?.data) return null;

    const cert = data.data;

    // Check Revocation
    if (cert.isRevoked) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-8 flex flex-col items-center text-center shadow-sm select-none">
          <XCircle size={40} className="text-red-500 mb-3" />
          <h3 className="text-sm font-bold text-red-800">Certificate revoked.</h3>
          {cert.revokedAt && (
            <p className="text-xs font-semibold text-red-600 mt-1">
              This credential was revoked on {new Date(cert.revokedAt).toLocaleDateString()}.
            </p>
          )}
        </div>
      );
    }

    // Check Expiration (Prisma tracks it via policies, we can check if template/issuer says so, but standard is Valid if not revoked)
    // UI displays validation detail box:
    return (
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm select-none">
        {/* Verification Status Header */}
        <div className="bg-emerald-50 border-b border-emerald-100 px-6 py-4 flex items-center gap-2.5">
          <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
          <span className="text-xs font-bold text-emerald-800">
            Verification Status: Valid
          </span>
        </div>

        {/* Certificate Details */}
        <div className="p-6 space-y-4 text-xs font-semibold text-slate-600">
          {/* Recipient */}
          <div className="flex items-center gap-3 py-1.5 border-b border-slate-100">
            <User size={15} className="text-slate-400 shrink-0" />
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Certificate Holder
              </span>
              <span className="text-slate-800 font-bold">{cert.recipientName}</span>
            </div>
          </div>

          {/* Course */}
          <div className="flex items-center gap-3 py-1.5 border-b border-slate-100">
            <BookOpen size={15} className="text-slate-400 shrink-0" />
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Course
              </span>
              <span className="text-slate-800 font-bold">{cert.courseTitle}</span>
            </div>
          </div>

          {/* ID */}
          <div className="flex items-center gap-3 py-1.5 border-b border-slate-100">
            <Award size={15} className="text-slate-400 shrink-0" />
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Certificate Number
              </span>
              <span className="text-slate-800 font-bold">{cert.serialNumber}</span>
            </div>
          </div>

          {/* Date */}
          <div className="flex items-center gap-3 py-1.5 border-b border-slate-100">
            <Calendar size={15} className="text-slate-400 shrink-0" />
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Issue Date
              </span>
              <span className="text-slate-800 font-bold">
                {new Date(cert.issuedAt).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>

          {/* Issuer */}
          <div className="flex items-center gap-3 py-1.5">
            <Award size={15} className="text-slate-400 shrink-0" />
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Issuer
              </span>
              <span className="text-slate-800 font-bold">{cert.issuer}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-md space-y-6">
        {/* Top Logo / Title */}
        <div className="text-center space-y-2 select-none">
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Verify Certificate
          </h1>
          <p className="text-xs font-semibold text-slate-400">
            Validate credentials issued by Nexus Academy.
          </p>
        </div>

        {/* Search Input Box */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <input
            type="text"
            value={inputSerial}
            onChange={(e) => setInputSerial(e.target.value)}
            placeholder="Enter Certificate ID (e.g. NX-CCP-...)"
            className="flex-1 border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs text-slate-800 bg-white focus:outline-none focus:border-slate-350 shadow-sm"
          />
          <button
            type="submit"
            className="bg-slate-900 text-white hover:bg-slate-800 transition-colors text-xs font-bold px-4 py-2.5 rounded-lg shadow-sm cursor-pointer border border-transparent outline-none shrink-0"
          >
            Verify
          </button>
        </form>

        {/* Verification Result Display */}
        {renderResult()}
      </div>
    </div>
  );
};

export default CertificateVerification;
