import React, { useState } from "react";
import { useNavigate } from "react-router";
import { useUserStore } from "../../store/user.store";
import { useUserCertificates } from "../../hooks/certificate/useCertificates";
import { useDownloadCertificate } from "../../hooks/course-completed/courseCompleted";
import { Search as SearchIcon, ArrowLeft, Download, Eye, Share2, AlertTriangle, RefreshCw } from "lucide-react";

export const ContentDeveloperMyCertificate: React.FC = () => {
  const navigate = useNavigate();
  const user = useUserStore((state) => state.user);
  const userId = user?.id || "";

  // Pagination & Search local states
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ACTIVE" | "REVOKED" | "ALL">("ALL");
  const [page, setPage] = useState(1);
  const limit = 6;

  // React Query Fetch List
  const { data, isLoading, isError, refetch } = useUserCertificates(
    userId,
    {
      page,
      limit,
      search: searchTerm || undefined,
    },
    !!userId
  );

  // Download PDF mutation hook
  const downloadMutation = useDownloadCertificate();

  const handleDownload = async (certId: string) => {
    try {
      const blob = await downloadMutation.mutateAsync({ certificateId: certId, userId });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `certificate-${certId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Failed to download certificate. Please try again.");
    }
  };

  const handleShare = (certId: string) => {
    navigate("/share-modal", { state: { certificateId: certId } });
  };

  const handlePreview = (token?: string, serial?: string) => {
    if (token) {
      navigate(`/certificate/public/${token}`);
    } else if (serial) {
      navigate(`/verify/${serial}`);
    } else {
      alert("Verification record is pending generation. Please confirm your name to generate.");
    }
  };

  const certificatesList = data?.data?.data || [];
  const totalRecords = data?.data?.total || 0;
  const totalPages = data?.data?.totalPages || 1;

  // Filter local state if statusFilter != "ALL" (in addition to backend)
  const displayedCertificates = certificatesList.filter((c) => {
    if (statusFilter === "ACTIVE") return !c.verification?.isRevoked;
    if (statusFilter === "REVOKED") return c.verification?.isRevoked;
    return true;
  });

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-white rounded-xl border p-6 space-y-4 animate-pulse select-none">
              <div className="h-4 bg-slate-100 rounded w-16" />
              <div className="h-6 bg-slate-100 rounded w-3/4" />
              <div className="space-y-2">
                <div className="h-3 bg-slate-100 rounded w-1/2" />
                <div className="h-3 bg-slate-100 rounded w-1/3" />
              </div>
              <div className="flex gap-3 pt-2">
                <div className="h-8 bg-slate-100 rounded flex-1" />
                <div className="h-8 bg-slate-100 rounded flex-1" />
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (isError) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-xl p-12 text-center text-red-800 max-w-xl mx-auto shadow-sm select-none">
          <AlertTriangle size={32} className="text-red-500 mx-auto mb-3" />
          <h3 className="text-sm font-bold">Failed to load certificates.</h3>
          <p className="text-xs text-red-600 mt-1 mb-4">
            An error occurred while loading your earned certificates. Please verify your connection and try again.
          </p>
          <button
            onClick={() => refetch()}
            className="inline-flex items-center gap-1.5 bg-red-650 hover:bg-red-700 text-white text-xs font-bold px-4 py-2 rounded-lg cursor-pointer transition-colors"
          >
            <RefreshCw size={12} />
            Retry
          </button>
        </div>
      );
    }

    if (displayedCertificates.length === 0) {
      return (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-450 select-none shadow-sm">
          <p className="text-sm font-semibold">No certificates found.</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Certificates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {displayedCertificates.map((cert) => {
            const isRevoked = cert.verification?.isRevoked ?? false;
            const serialNo = cert.serialNumber || cert.id.substring(0, 8).toUpperCase();
            const issuedDate = new Date(cert.issuedAt).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
            });

            return (
              <div
                key={cert.id}
                className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div className="space-y-4">
                  {/* Status Badge */}
                  <div className="flex justify-between items-start">
                    <span
                      className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full select-none border ${isRevoked
                          ? "bg-red-50 text-red-700 border-red-200"
                          : "bg-emerald-50 text-emerald-700 border-emerald-200"
                        }`}
                    >
                      {isRevoked ? "Revoked" : "Active"}
                    </span>
                  </div>

                  {/* Course Title */}
                  <h3 className="font-bold text-slate-800 text-base leading-snug">
                    {cert.course?.title}
                  </h3>

                  {/* Details */}
                  <div className="space-y-1.5 text-xs text-slate-500 font-semibold select-none">
                    <p>
                      <strong>Certificate ID:</strong> {serialNo}
                    </p>
                    <p>
                      <strong>Issued On:</strong> {issuedDate}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2 mt-6 pt-2 border-t border-slate-100">
                  {/* Preview Button */}
                  <button
                    onClick={() => handlePreview(cert.verification?.verificationToken || undefined, cert.serialNumber || undefined)}
                    className="flex-1 inline-flex items-center justify-center gap-1 border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors text-xs font-bold py-2 rounded-lg cursor-pointer"
                  >
                    <Eye size={12} />
                    View
                  </button>

                  {/* Download Button */}
                  <button
                    onClick={() => handleDownload(cert.id)}
                    className="flex-1 inline-flex items-center justify-center gap-1 border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors text-xs font-bold py-2 rounded-lg cursor-pointer"
                  >
                    <Download size={12} />
                    Download
                  </button>

                  {/* Share Button */}
                  {!isRevoked && (
                    <button
                      onClick={() => handleShare(cert.id)}
                      className="inline-flex items-center justify-center border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors p-2 rounded-lg cursor-pointer"
                      title="Share certificate"
                    >
                      <Share2 size={13} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-200 pt-4 select-none">
            <span className="text-xs font-semibold text-slate-400">
              Showing {(page - 1) * limit + 1}–{Math.min(page * limit, totalRecords)} of {totalRecords}
            </span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="border border-slate-200 bg-white hover:bg-slate-50 transition-colors text-xs font-bold px-3 py-1.5 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                Previous
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="border border-slate-200 bg-white hover:bg-slate-50 transition-colors text-xs font-bold px-3 py-1.5 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                Next &rarr;
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full min-w-0 space-y-6 pb-12">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1.5">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 leading-tight">
              My Certificates
            </h1>
            <p className="text-xs font-semibold text-slate-400 select-none">
              View, share and download your earned certificates.
            </p>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          {/* Search Box */}
          <div className="relative w-full sm:max-w-xs">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              placeholder="Search by course..."
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs bg-white text-slate-800 focus:outline-none focus:border-slate-350 shadow-sm"
            />
          </div>

          {/* Status Filter Dropdown */}
          <div className="flex items-center gap-2 select-none w-full sm:w-auto justify-end">
            <span className="text-xs font-bold text-slate-400">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as any);
                setPage(1);
              }}
              className="border border-slate-250 bg-white rounded-lg text-xs font-bold text-slate-700 px-3 py-2 outline-none shadow-sm cursor-pointer"
            >
              <option value="ALL">All Credentials</option>
              <option value="ACTIVE">Active</option>
              <option value="REVOKED">Revoked</option>
            </select>
          </div>
        </div>

        {/* Summary Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm max-w-xs select-none">
          <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Certificates Earned
          </h2>
          <p className="text-4xl font-extrabold mt-2 text-slate-850 tracking-tight">
            {isLoading ? "..." : totalRecords}
          </p>
        </div>

        {/* Content list */}
        {renderContent()}
      </div>
  );
};

export default ContentDeveloperMyCertificate;