import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";
import {
  Award,
  Download,
  Share2,
  Eye,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ExternalLink,
  QrCode,
  Pencil,
  X,
  Check,
  ChevronRight,
  ArrowLeft,
  FileText,
  ShieldCheck,
  Copy,
  Printer,
  Maximize2,
  Building2,
  BookOpen,
  GraduationCap,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import { useProfile } from "../../hooks/profile/useProfile";
import { useUserStore } from "../../store/user.store";
import {
  useUserCertificates,
  useDownloadCertificate,
} from "../../hooks/course-completed/courseCompleted";
import { useConfirmAndGenerate } from "../../hooks/certificate-name-editor/certificateNameEditor";
import { useCourseDetails } from "../../hooks/course-details/courseDetails";
import { useCareerPathTitle } from "../../hooks/career-path/useCareerPathTitle";

import { CertificatePreview } from "../../components/certificates";
import CertificateNameEditer from "./CertificateNameEditer";
import ShareModal from "./ShareModal";
import { Skeleton } from "../../components/ui/Skeleton/Skeleton";

const CertificatesSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header Skeleton */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-32 rounded-xl" />
          <Skeleton className="h-9 w-28 rounded-xl" />
        </div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2 flex-1">
            <Skeleton className="h-8 w-2/3 max-w-md" />
            <Skeleton className="h-4 w-1/2 max-w-sm" />
          </div>
          <div className="flex gap-3">
            <Skeleton className="h-11 w-32 rounded-xl" />
            <Skeleton className="h-11 w-28 rounded-xl" />
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Certificate Preview Frame Skeleton */}
        <div className="flex-1 space-y-4">
          <div className="bg-slate-100 border border-slate-200 p-8 shadow-inner rounded-2xl aspect-[1.414/1] flex flex-col items-center justify-center gap-6">
            <Skeleton className="w-16 h-16 rounded-full" />
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-80" />
            <div className="w-full max-w-sm h-px bg-slate-200 my-2" />
            <Skeleton className="h-10 w-72" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white border border-slate-200 p-4 rounded-xl space-y-2">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-5 w-24" />
              </div>
            ))}
          </div>
        </div>

        {/* Right Sidebar Skeleton */}
        <div className="w-full lg:w-[320px] shrink-0 space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-3">
            <Skeleton className="h-4 w-28 mb-3" />
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-11 w-full rounded-xl" />
            <Skeleton className="h-11 w-full rounded-xl" />
            <Skeleton className="h-11 w-full rounded-xl" />
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-3">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-16 w-full rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
};

const Certificates: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const urlCourseId = searchParams.get("courseId");
  const urlCareerPathId = searchParams.get("careerPathId");
  const courseId = urlCourseId || urlCareerPathId || "default-course-id";

  const [isEditNameOpen, setIsEditNameOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isZoomModalOpen, setIsZoomModalOpen] = useState(false);
  const [customPreviewName, setCustomPreviewName] = useState<string>("");
  const [isCopied, setIsCopied] = useState(false);

  const user = useUserStore((state) => state.user);
  const userId = user?.id || "";

  // Fetch profile
  const {
    profile: profileData,
    loading: isProfileLoading,
    error: profileError,
    getProfile,
  } = useProfile();

  useEffect(() => {
    if (userId) {
      getProfile();
    }
  }, [userId, getProfile]);

  // Fetch certificates
  const {
    data: certsResponse,
    isLoading: isCertsLoading,
    isError: isCertsError,
    refetch: refetchCerts,
  } = useUserCertificates(userId, undefined, !!userId);

  // Download mutation
  const downloadMutation = useDownloadCertificate();

  // Confirm/Generate mutation
  const confirmGenerateMutation = useConfirmAndGenerate();

  const handleDownload = async (certId: string) => {
    try {
      const blob = await downloadMutation.mutateAsync({ certificateId: certId, userId });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `nexus-certificate-${certId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Certificate downloaded successfully!");
    } catch (err: any) {
      console.error("Failed to download PDF:", err);
      toast.error("Failed to generate PDF: " + (err.message || "Unknown error"));
    }
  };

  const handleConfirmAndGenerate = async (confirmedName: string) => {
    if (!userId || !courseId) return;
    try {
      await confirmGenerateMutation.mutateAsync({
        userId,
        courseId,
        confirmedName,
      });
      setCustomPreviewName(confirmedName);
      refetchCerts();
      toast.success("Recipient name updated on certificate!");
    } catch (err) {
      console.error("Failed to confirm and generate:", err);
    }
  };

  const allCertificates: any[] = useMemo(() => {
    const raw =
      certsResponse?.data ||
      (certsResponse as any)?.certificates ||
      (certsResponse as any)?.items;
    if (Array.isArray(raw)) return raw;
    return [];
  }, [certsResponse]);

  const activeCert = useMemo(() => {
    if (allCertificates.length === 0) return null;
    if (courseId && courseId !== "default-course-id") {
      const found = allCertificates.find(
        (c: any) =>
          c.courseId === courseId ||
          c.careerPathId === courseId ||
          c.career_path_id === courseId ||
          c.course?.id === courseId ||
          c.id === courseId ||
          c.originalId === courseId ||
          c.careerPath?.id === courseId ||
          c.career_paths?.id === courseId ||
          c.serialNumber === courseId
      );
      if (found) return found;
    }
    return allCertificates[0];
  }, [allCertificates, courseId]);

  const profileName = useMemo(() => {
    if (!profileData) return "";

    return (
      profileData.profile?.certificateName ||
      `${profileData.profile?.firstName ?? ""} ${profileData.profile?.lastName ?? ""}`.trim()
    );
  }, [profileData]);

  // Fetch course details as a fallback if the certificate is not fully generated yet
  const effectiveCourseId =
    activeCert?.courseId || (activeCert as any)?.course?.id || urlCourseId || "";
  const effectiveCareerPathId =
    activeCert?.career_path_id || activeCert?.careerPathId || urlCareerPathId || undefined;
  const { data: courseDetails } = useCourseDetails(effectiveCourseId, !!effectiveCourseId);
  const { data: careerPathDetails } = useCareerPathTitle(effectiveCareerPathId);

  if (isProfileLoading || isCertsLoading) {
    return <CertificatesSkeleton />;
  }

  const isProfileError = !!profileError;
  if (isProfileError || isCertsError) {
    return (
      <div className="min-h-[70vh] bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-8 text-center max-w-md w-full">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center mx-auto mb-4 text-rose-600 shadow-inner">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <h3 className="text-slate-900 font-bold text-lg mb-1">Failed to load certificates</h3>
          <p className="text-slate-500 text-sm mb-6 leading-relaxed">
            There was a problem communicating with the credential registry. Please try again.
          </p>
          <button
            onClick={() => {
              refetchCerts();
            }}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-4 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Retry Connection</span>
          </button>
        </div>
      </div>
    );
  }

  const isPreviewMode =
    searchParams.get("preview") === "true" || !!urlCourseId || !!urlCareerPathId;

  if (!activeCert && !isPreviewMode) {
    return (
      <div className="bg-slate-50 min-h-[70vh] flex items-center justify-center p-6">
        <div className="py-16 px-8 text-center bg-white rounded-2xl border border-dashed border-slate-300 max-w-lg mx-auto shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto mb-4 text-amber-600 shadow-inner">
            <Award className="w-8 h-8" />
          </div>
          <h3 className="text-slate-900 font-bold text-xl mb-2">No certificates issued yet</h3>
          <p className="text-slate-500 text-sm mb-6 max-w-sm mx-auto leading-relaxed">
            Complete a course module and pass the final certification assessment with 70% or higher to unlock your official verified diploma.
          </p>
          <button
            onClick={() => navigate("/member-learning")}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 mx-auto cursor-pointer"
          >
            <BookOpen className="w-4 h-4" />
            <span>Explore Course Catalog</span>
          </button>
        </div>
      </div>
    );
  }

  const completionDateFormatted = activeCert?.issuedAt
    ? new Date(activeCert.issuedAt)
        .toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
        .toUpperCase()
    : new Date()
        .toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
        .toUpperCase();

  const actualCourseName =
    activeCert?.course?.title ||
    (activeCert as any)?.courseTitle ||
    (activeCert as any)?.careerPath?.title ||
    (activeCert as any)?.career_paths?.title ||
    courseDetails?.title ||
    careerPathDetails?.title ||
    "Professional Operations Standards";

  const proofId =
    activeCert?.serialNumber ||
    (activeCert?.id
      ? `NX-CDMP-P-${activeCert.id.slice(0, 8).toUpperCase()}`
      : "NX-2026-CLN-883419");

  const displayName =
    customPreviewName ||
    activeCert?.recipientName ||
    activeCert?.user?.profile?.certificateName ||
    profileName ||
    "Alex Johnson";

  const grade = activeCert?.grade || "98% (Mastery)";
  const issuer = activeCert?.issuer || "Nexus Operational Standards Institute";
  const verificationUrl = `${window.location.origin}/verify/${proofId}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(verificationUrl);
    setIsCopied(true);
    toast.success("Verification link copied to clipboard!");
    setTimeout(() => setIsCopied(false), 2500);
  };

  return (
    <>
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-certificate, #printable-certificate * {
            visibility: visible !important;
          }
          #printable-certificate {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            box-shadow: none !important;
            background: white !important;
          }
        }
      `}</style>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* --- Top Navigation & Breadcrumbs Bar --- */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/certificate")}
              className="px-3.5 py-2 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-2xs"
              title="Return to Completed Courses List"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Completed</span>
            </button>
            <div className="h-5 w-px bg-slate-200 hidden sm:block" />
            <nav className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
              <span
                onClick={() => navigate("/member-learning")}
                className="hover:text-slate-700 cursor-pointer transition-colors"
              >
                Learning Hub
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
              <span
                onClick={() => navigate("/certificate")}
                className="hover:text-slate-700 cursor-pointer transition-colors"
              >
                Completed Courses
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
              <span className="text-slate-900 font-bold">Verified Credential</span>
            </nav>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => navigate("/member-learning")}
              className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all cursor-pointer shadow-2xs flex items-center gap-1.5"
            >
              <BookOpen className="w-3.5 h-3.5 text-slate-500" />
              <span>Catalog</span>
            </button>
            <button
              onClick={() => navigate("/certificate")}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
            >
              <GraduationCap className="w-3.5 h-3.5 text-amber-400" />
              <span>All Certificates ({allCertificates.length})</span>
            </button>
          </div>
        </div>

        {/* --- Hero Credential Header --- */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden border border-slate-700/60">
          {/* Subtle Ambient Radial Glows */}
          <div className="absolute -right-16 -top-16 w-80 h-80 rounded-full bg-amber-400/10 blur-3xl pointer-events-none" />
          <div className="absolute right-40 -bottom-20 w-72 h-72 rounded-full bg-indigo-500/10 blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-start gap-4 sm:gap-5">
              <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-amber-400/20 border border-amber-400/30 backdrop-blur-md flex items-center justify-center shrink-0 shadow-inner text-amber-300">
                <Award className="w-9 h-9 sm:w-10 sm:h-10" />
              </div>
              <div className="space-y-2 max-w-3xl">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 backdrop-blur-xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Verified & Active Credential
                  </span>
                  <span className="text-xs text-slate-300 font-mono">
                    ID: {proofId}
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight">
                  {actualCourseName}
                </h1>
                <p className="text-xs sm:text-sm text-slate-300/90 leading-relaxed">
                  Issued to <strong className="text-white underline underline-offset-4 decoration-amber-400/80">{displayName}</strong> on{" "}
                  {completionDateFormatted} &bull; Accredited by {issuer} &bull; Final Grade:{" "}
                  <span className="text-amber-300 font-bold">{grade}</span>
                </p>
              </div>
            </div>

            {/* Quick Action Buttons in Hero */}
            <div className="flex flex-wrap lg:flex-col items-stretch sm:items-center lg:items-end gap-2.5 pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-700/60 shrink-0">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => {
                    if (activeCert?.id) {
                      handleDownload(activeCert.id);
                    } else {
                      window.print();
                    }
                  }}
                  disabled={downloadMutation.isPending}
                  className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs transition-all shadow-md shadow-amber-400/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Download className="w-4 h-4 text-slate-950" />
                  <span>{downloadMutation.isPending ? "Generating..." : "Download PDF"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white border border-white/15 font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer backdrop-blur-xs"
                  title="Print Certificate"
                >
                  <Printer className="w-4 h-4" />
                  <span className="hidden sm:inline">Print</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsShareModalOpen(true)}
                  className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white border border-white/15 font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer backdrop-blur-xs"
                  title="Share Credential"
                >
                  <Share2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Share</span>
                </button>
              </div>

              <div className="text-xs text-slate-400 flex items-center gap-1.5 self-center lg:self-end pt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>100% Tamper-Proof Cryptographic ID</span>
              </div>
            </div>
          </div>
        </div>

        {/* --- Interactive Certificate Switcher Carousel (When multiple certs exist) --- */}
        {allCertificates.length > 1 && (
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
                  Switch Credential ({allCertificates.length})
                </span>
              </div>
              <span className="text-[11px] text-slate-400">Click to switch diploma preview</span>
            </div>
            <div className="flex items-center gap-2.5 overflow-x-auto pb-1.5 custom-scrollbar">
              {allCertificates.map((cert: any) => {
                const isSelected =
                  activeCert?.id === cert.id ||
                  activeCert?.courseId === cert.courseId ||
                  (cert.courseId && activeCert?.courseId === cert.courseId);
                const title =
                  cert.courseTitle ||
                  cert.course?.title ||
                  cert.career_paths?.title ||
                  "Professional Credential";
                const cId = cert.courseId || cert.course?.id;
                const cpId = cert.careerPathId || cert.career_path_id;
                return (
                  <button
                    key={cert.id}
                    type="button"
                    onClick={() => {
                      if (cId) {
                        navigate(`/certificate-detail?courseId=${cId}`);
                      } else if (cpId) {
                        navigate(`/certificate-detail?careerPathId=${cpId}`);
                      }
                    }}
                    className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 border flex items-center gap-2.5 ${
                      isSelected
                        ? "bg-amber-400 text-slate-950 border-amber-500 shadow-sm ring-2 ring-amber-300/50"
                        : "bg-slate-50 text-slate-700 hover:bg-slate-100 hover:text-slate-900 border-slate-200/80 shadow-2xs"
                    }`}
                  >
                    <Award
                      className={`w-4 h-4 ${
                        isSelected ? "text-slate-950" : "text-amber-500"
                      }`}
                    />
                    <span className="max-w-[240px] truncate">{title}</span>
                    {isSelected && <Check className="w-4 h-4 text-slate-950 stroke-[3]" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* --- Main Two-Column Stage Layout --- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* LEFT COLUMN: Diploma Stage & Registry Metadata (8 of 12 cols) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Gallery Matting Certificate Stage */}
            <div className="bg-slate-100/90 border border-slate-200/90 rounded-3xl p-4 sm:p-8 shadow-inner relative group">
              {/* Top Control Bar on Stage */}
              <div className="flex items-center justify-between gap-3 mb-4 text-xs">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-white border border-slate-200 text-slate-700 font-bold text-[11px] uppercase tracking-wider shadow-2xs">
                    Official Diploma Canvas &bull; Landscape
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setIsZoomModalOpen(true)}
                    className="p-2 rounded-lg bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 transition-colors shadow-2xs cursor-pointer"
                    title="Expand Fullscreen View"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="p-2 rounded-lg bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 transition-colors shadow-2xs cursor-pointer"
                    title="Print Document"
                  >
                    <Printer className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (activeCert?.id) handleDownload(activeCert.id);
                      else window.print();
                    }}
                    className="p-2 rounded-lg bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 transition-colors shadow-2xs cursor-pointer"
                    title="Download PDF Document"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* The Actual Diploma Document (Printable container) */}
              <div
                id="printable-certificate"
                className="w-full rounded-2xl overflow-hidden shadow-2xl transition-all duration-300"
              >
                <CertificatePreview
                  userName={displayName}
                  courseName={actualCourseName}
                  completionDate={completionDateFormatted}
                  certificateId={proofId}
                />
              </div>

              <div className="mt-4 text-center">
                <p className="text-xs text-slate-500 font-medium">
                  Verified Digital Credential securely signed with 256-bit hash &bull; Verifiable anywhere in the world
                </p>
              </div>
            </div>

            {/* --- 4-Card Security & Verification Metadata Grid --- */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {/* Card 1: Recipient */}
              <div className="bg-white rounded-2xl border border-slate-200/90 p-4.5 shadow-xs space-y-1 relative group">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Recipient Name
                  </span>
                  <button
                    onClick={() => setIsEditNameOpen(true)}
                    className="text-indigo-600 hover:text-indigo-800 p-1 hover:bg-indigo-50 rounded-md transition-colors cursor-pointer"
                    title="Change name on certificate"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                </div>
                <h4 className="text-sm font-bold text-slate-900 truncate">
                  {displayName}
                </h4>
                <p className="text-[11px] text-slate-500">Verified Member</p>
              </div>

              {/* Card 2: Credential Serial */}
              <div className="bg-white rounded-2xl border border-slate-200/90 p-4.5 shadow-xs space-y-1 relative">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Credential ID
                  </span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(proofId);
                      toast.success("Credential ID copied!");
                    }}
                    className="text-slate-500 hover:text-slate-800 p-1 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                    title="Copy ID"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
                <h4 className="text-sm font-mono font-bold text-slate-900 truncate">
                  {proofId}
                </h4>
                <p className="text-[11px] text-slate-500">Registry Unique Index</p>
              </div>

              {/* Card 3: Issue Date */}
              <div className="bg-white rounded-2xl border border-slate-200/90 p-4.5 shadow-xs space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                  Date of Issue
                </span>
                <h4 className="text-sm font-bold text-slate-900">
                  {completionDateFormatted}
                </h4>
                <p className="text-[11px] text-emerald-600 font-medium">Valid &bull; Never Expires</p>
              </div>

              {/* Card 4: Issuing Body */}
              <div className="bg-white rounded-2xl border border-slate-200/90 p-4.5 shadow-xs space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                  Accreditation
                </span>
                <h4 className="text-sm font-bold text-slate-900 truncate">
                  Nexus Institute
                </h4>
                <p className="text-[11px] text-indigo-600 font-medium">Official Seal Active</p>
              </div>
            </div>

            {/* --- Public Verification 1-Click Link Box --- */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-black uppercase tracking-wider text-slate-900">
                    Public Verification Link
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => navigate(`/verify/${proofId}`)}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <span>Open Registry Verification</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Employers, clients, and auditors can verify this diploma instantly without signing in by visiting this secure URL:
              </p>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <input
                  readOnly
                  value={verificationUrl}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 font-mono text-xs focus:outline-none select-all"
                />
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0 shadow-xs"
                >
                  {isCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Link</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Action Center, Security Seal & Continuing Ed (4 of 12 cols) */}
          <div className="lg:col-span-4 space-y-6">
            {/* Primary Action Center Card */}
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-md p-6 space-y-5">
              <div>
                <span className="text-[11px] font-black uppercase tracking-widest text-slate-400 block mb-1">
                  Credential Actions
                </span>
                <h3 className="text-base font-extrabold text-slate-900">
                  Manage & Share
                </h3>
              </div>

              <div className="space-y-2.5">
                {/* Download PDF Button (Hero Action) */}
                <button
                  type="button"
                  onClick={() => {
                    if (activeCert?.id) handleDownload(activeCert.id);
                    else window.print();
                  }}
                  disabled={downloadMutation.isPending}
                  className="w-full px-5 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm shadow-md shadow-indigo-600/20 hover:shadow-lg transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
                >
                  <Download className="w-4 h-4 text-white" />
                  <span>{downloadMutation.isPending ? "Generating PDF..." : "Download Official PDF"}</span>
                </button>

                {/* Print Diploma */}
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="w-full px-5 py-3 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
                >
                  <Printer className="w-4 h-4 text-slate-500" />
                  <span>Print Certificate</span>
                </button>

                {/* Share Credential Modal */}
                <button
                  type="button"
                  onClick={() => setIsShareModalOpen(true)}
                  className="w-full px-5 py-3 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
                >
                  <Share2 className="w-4 h-4 text-slate-500" />
                  <span>Share to LinkedIn / Social</span>
                </button>

                {/* Rewatch SOP Video */}
                <button
                  type="button"
                  onClick={() => {
                    const targetCourseId =
                      (activeCert as any)?.courseId ||
                      (activeCert as any)?.course?.id ||
                      urlCourseId ||
                      "";
                    const targetCpId =
                      (activeCert as any)?.careerPathId ||
                      (activeCert as any)?.career_path_id ||
                      urlCareerPathId ||
                      "";
                    navigate(
                      `/course-player?courseId=${targetCourseId}${
                        targetCpId ? `&careerPathId=${targetCpId}` : ""
                      }`
                    );
                  }}
                  className="w-full px-5 py-3 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
                >
                  <Eye className="w-4 h-4 text-slate-500" />
                  <span>Rewatch Training SOP Lessons</span>
                </button>

                {/* Edit Name on Certificate */}
                <button
                  type="button"
                  onClick={() => setIsEditNameOpen(true)}
                  className="w-full px-5 py-3 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
                >
                  <Pencil className="w-4 h-4 text-slate-500" />
                  <span>Edit Name on Certificate</span>
                </button>

                {/* Feedback / Issue */}
                <button
                  type="button"
                  onClick={() => navigate("/issue-reporting")}
                  className="w-full px-5 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  <span>Submit Training Feedback</span>
                </button>
              </div>
            </div>

            {/* Public Registry Seal Card */}
            <div className="bg-emerald-50/70 border border-emerald-200/90 rounded-3xl p-6 shadow-xs space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700 shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-emerald-950 leading-tight">
                    Universal Registry Verification
                  </h4>
                  <p className="text-[11px] text-emerald-700">Official Authenticity Guarantee</p>
                </div>
              </div>
              <p className="text-xs text-emerald-900/90 leading-relaxed">
                This credential is permanently indexed in the global Nexus Academy registry. Any third-party organization can verify authenticity and completion marks at:
              </p>
              <button
                type="button"
                onClick={() => navigate(`/verify/${proofId}`)}
                className="w-full px-4 py-2.5 rounded-xl bg-white text-emerald-800 border border-emerald-300 hover:bg-emerald-100 font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <span>Verify at /verify/{proofId}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Continuing Education / What's Next Card */}
            <div className="bg-gradient-to-br from-amber-500/10 via-amber-400/5 to-transparent border border-amber-300/60 rounded-3xl p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span className="text-xs font-black uppercase tracking-wider text-amber-900">
                  Continuing Education
                </span>
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-slate-900 mb-1">
                  Keep Advancing Your Credentials
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Earn multi-skill certifications to qualify for supervisory and lead compliance roles across facilities.
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate("/member-learning")}
                className="w-full px-4 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <span>Browse Recommended Next Modules</span>
                <ChevronRight className="w-4 h-4 text-amber-400" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* --- Fullscreen Zoom Certificate Modal --- */}
      {isZoomModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-8 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full p-6 sm:p-8 space-y-5 relative max-h-[95vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    {actualCourseName}
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">
                    Credential ID: {proofId} &bull; Recipient: {displayName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsZoomModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-2 sm:p-4 bg-slate-100 rounded-2xl flex items-center justify-center shadow-inner">
              <div className="w-full max-w-4xl shadow-xl rounded-xl overflow-hidden">
                <CertificatePreview
                  userName={displayName}
                  courseName={actualCourseName}
                  completionDate={completionDateFormatted}
                  certificateId={proofId}
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <span className="text-xs text-slate-500">
                Official Diploma Preview &bull; Nexus Operational Standards Institute
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (activeCert?.id) handleDownload(activeCert.id);
                    else window.print();
                  }}
                  disabled={downloadMutation.isPending}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Download className="w-4 h-4" />
                  <span>{downloadMutation.isPending ? "Generating..." : "Download PDF"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- Edit Name on Certificate Modal --- */}
      {isEditNameOpen && (
        <CertificateNameEditer
          initialName={displayName}
          onClose={() => setIsEditNameOpen(false)}
          onSubmit={(newName) => {
            if (activeCert) {
              handleConfirmAndGenerate(newName);
            } else {
              setCustomPreviewName(newName);
              toast.success("Certificate recipient name updated!");
            }
            setIsEditNameOpen(false);
          }}
        />
      )}

      {/* --- Social Share Modal --- */}
      {isShareModalOpen && activeCert && (
        <ShareModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          content={{
            id: activeCert.id,
            title: actualCourseName,
            thumbnailUrl:
              (activeCert as any)?.course?.thumbnailAsset ||
              (activeCert as any)?.course?.thumbnailUrl ||
              (activeCert as any)?.course?.coverImageUrl ||
              (activeCert as any)?.career_paths?.thumbnailAsset ||
              (activeCert as any)?.career_paths?.thumbnailUrl ||
              (activeCert as any)?.career_paths?.coverImageUrl ||
              (courseDetails as any)?.thumbnailAsset ||
              (courseDetails as any)?.thumbnailUrl ||
              (courseDetails as any)?.coverImageUrl ||
              (careerPathDetails as any)?.thumbnailAsset ||
              (careerPathDetails as any)?.thumbnailUrl ||
              (careerPathDetails as any)?.coverImageUrl ||
              undefined,
            type: "certificate",
            shareToken: activeCert.verification?.verificationToken,
            proofId: proofId,
          }}
        />
      )}
    </>
  );
};

export default Certificates;
