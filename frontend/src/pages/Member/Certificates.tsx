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
} from "lucide-react";
import { useProfile } from "../../hooks/profile/useProfile";
import { useUserStore } from "../../store/user.store";
import { useUserCertificates, useDownloadCertificate } from "../../hooks/course-completed/courseCompleted";
import { useConfirmAndGenerate } from "../../hooks/certificate-name-editor/certificateNameEditor";
import { useCourseDetails } from "../../hooks/course-details/courseDetails";
import { useCareerPathTitle } from "../../hooks/career-path/useCareerPathTitle";
import { courseCompletedApi } from "../../core/api/course-completed/courseCompletedApi";

import {
  CertificateHeader,
  CertificatePreview,
  VerificationSection,
  NextLearningSection,
  EligibilityInformation,
} from "../../components/certificates";
import CertificateNameEditer from "./CertificateNameEditer";
import ShareModal from "./ShareModal";
import { Skeleton } from "../../components/ui/Skeleton/Skeleton";

const CertificatesSkeleton: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-3 flex-1">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-8 w-2/3 max-w-md" />
            <div className="flex gap-4">
              <Skeleton className="h-5 w-28 rounded-full" />
              <Skeleton className="h-5 w-36 rounded-full" />
            </div>
          </div>
          <Skeleton className="h-10 w-28 rounded-lg shrink-0" />
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-10">
        {/* Certificate Preview Frame Skeleton */}
        <div className="flex-1">
          <div className="bg-white border border-slate-200 p-6 shadow-sm rounded-xl aspect-[842/595] flex flex-col items-center justify-center gap-6">
            <Skeleton className="w-16 h-16 rounded-full" />
            <Skeleton className="h-7 w-64" />
            <Skeleton className="h-4 w-80" />
            <div className="w-full max-w-sm h-px bg-slate-200 my-2" />
            <Skeleton className="h-9 w-72" />
            <div className="flex justify-between w-full max-w-md pt-6">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-6 w-24" />
            </div>
          </div>
        </div>

        {/* Right Sidebar Skeleton */}
        <div className="w-full lg:w-[320px] shrink-0 space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
            <Skeleton className="h-3 w-40 mb-2" />
            <Skeleton className="h-11 w-full rounded-full" />
            <Skeleton className="h-11 w-full rounded-full" />
            <Skeleton className="h-11 w-full rounded-full" />
            <Skeleton className="h-11 w-full rounded-full" />
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-2">
            <Skeleton className="h-4 w-44" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-3/4" />
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
  const courseId = urlCourseId || urlCareerPathId || "default-course-id"; // fallback courseId if not provided

  const [isEditNameOpen, setIsEditNameOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [customPreviewName, setCustomPreviewName] = useState<string>("");

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
      a.download = `certificate-${certId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
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
      refetchCerts();
    } catch (err) {
      console.error("Failed to confirm and generate:", err);
    }
  };

  const allCertificates: any[] = useMemo(() => {
    const raw = certsResponse?.data || (certsResponse as any)?.certificates || (certsResponse as any)?.items;
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
          c.career_paths?.id === courseId
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
  const effectiveCourseId = activeCert?.courseId || (activeCert as any)?.course?.id || urlCourseId || "";
  const effectiveCareerPathId = activeCert?.career_path_id || activeCert?.careerPathId || urlCareerPathId || undefined;
  const { data: courseDetails } = useCourseDetails(effectiveCourseId, !!effectiveCourseId);
  const { data: careerPathDetails } = useCareerPathTitle(effectiveCareerPathId);

  // Profile completion percentage
  const progressPercentage = profileData?.profileCompleteness ?? 100;

  if (isProfileLoading || isCertsLoading) {
    return <CertificatesSkeleton />;
  }

  const isProfileError = !!profileError;
  if (isProfileError || isCertsError) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center flex-col gap-4">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 text-center max-w-sm">
          <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-6 h-6 text-rose-600" />
          </div>
          <p className="text-slate-900 font-semibold mb-1">Failed to load certificates</p>
          <p className="text-slate-500 text-sm mb-4">There was a problem connecting to the backend.</p>
          <button
            onClick={() => { refetchCerts(); }}
            className="bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const isPreviewMode = searchParams.get("preview") === "true" || !!urlCourseId || !!urlCareerPathId;

  if (!activeCert && !isPreviewMode) {
    return (
      <div className="bg-slate-50 min-h-[60vh] flex items-center justify-center">
        <div className="py-20 px-8 text-center bg-white rounded-xl border border-dashed border-slate-300 max-w-md mx-auto">
          <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center mx-auto mb-4">
            <Award className="w-8 h-8 text-indigo-400" />
          </div>
          <h3 className="text-slate-900 font-semibold text-lg mb-2">No certificate yet</h3>
          <p className="text-slate-500 text-sm mb-6">You haven't completed this course or the certificate is not available yet.</p>
          <button
            onClick={() => navigate("/member-learning")}
            className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors"
          >
            Start Learning
          </button>
        </div>
      </div>
    );
  }

  const completionDateFormatted = activeCert?.issuedAt
    ? new Date(activeCert.issuedAt).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).toUpperCase()
    : new Date().toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).toUpperCase();

  const actualCourseName = activeCert?.course?.title || (activeCert as any)?.careerPath?.title || (activeCert as any)?.career_paths?.title || courseDetails?.title || careerPathDetails?.title || "Knowledge Mapping for Working Professionals";
  const proofId = activeCert?.serialNumber || (activeCert?.id ? `NX-CDMP-P-${activeCert.id.slice(0, 8).toUpperCase()}` : "NX-CDMP-P-2026-04821");
  const displayName = activeCert?.recipientName || activeCert?.user?.profile?.certificateName || profileName || "Salman Ali";

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

      {/* Top Header Bar */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 -mx-6 -mt-6 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/certificate")}
            className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
            title="Back to Completed Courses"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
            <Award className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-slate-900 font-bold text-lg leading-tight">Verified Credential</h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[11px] font-bold">
                <CheckCircle2 className="w-3 h-3" /> Valid
              </span>
            </div>
            <p className="text-slate-500 text-xs mt-0.5">{actualCourseName}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate("/member-learning")}
            className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold cursor-pointer transition-all shadow-2xs"
          >
            Browse Catalog
          </button>
          <button
            onClick={() => navigate("/certificate")}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold cursor-pointer transition-all shadow-xs"
          >
            All Certificates
          </button>
        </div>
      </div>

      {/* Interactive Certificate Switcher Carousel */}
      {allCertificates.length > 1 && (
        <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-3 sm:p-4 mb-6 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-500" />
              Your Earned Credentials ({allCertificates.length})
            </span>
            <span className="text-[11px] text-slate-400 font-medium">Select to preview</span>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
            {allCertificates.map((cert: any) => {
              const isSelected = activeCert?.id === cert.id || activeCert?.courseId === cert.courseId;
              const title = cert.courseTitle || cert.course?.title || cert.career_paths?.title || "Credential";
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
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 border flex items-center gap-2 ${
                    isSelected
                      ? "bg-amber-400 text-slate-950 border-amber-500 shadow-xs ring-2 ring-amber-300/40"
                      : "bg-white text-slate-700 hover:bg-slate-100 border-slate-200 shadow-2xs"
                  }`}
                >
                  <Award className={`w-3.5 h-3.5 ${isSelected ? "text-slate-950" : "text-amber-500"}`} />
                  <span>{title}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-slate-950" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <CertificateHeader
        courseName={actualCourseName}
        completionDate={completionDateFormatted}
        onShare={() => setIsShareModalOpen(true)}
        proofId={proofId}
      />

      <div className="flex flex-col lg:flex-row gap-8 mt-6">
        {/* Main Left Area: Certificate Preview */}
        <div className="flex-1" id="printable-certificate">
          <div className="border-4 border-amber-400 rounded-xl overflow-hidden shadow-lg">
            <CertificatePreview
              userName={activeCert?.recipientName || activeCert?.user?.profile?.certificateName || profileName || "Learner"}
              courseName={actualCourseName}
              completionDate={completionDateFormatted}
              certificateId={proofId}
            />
          </div>

          {/* Certificate Meta Details */}
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Issued</span>
              </div>
              <p className="text-slate-900 font-bold text-sm">{completionDateFormatted}</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
              <div className="flex items-center gap-2 mb-1">
                <FileText className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Certificate ID</span>
              </div>
              <p className="text-slate-900 font-bold text-sm font-mono truncate">{proofId}</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
              <div className="flex items-center gap-2 mb-1">
                <QrCode className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Verify</span>
              </div>
              <p className="text-slate-900 font-bold text-sm truncate">nexusacademy.org/verify</p>
            </div>
          </div>
        </div>

        {/* Right Sidebar Area: Actions */}
        <div className="w-full lg:w-[300px] shrink-0 space-y-4">
          {/* Action Buttons Card */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">
              Actions
            </h3>
            <div className="flex flex-col gap-2.5">
              <button
                onClick={() => {
                  if (activeCert?.id) {
                    handleDownload(activeCert.id);
                  } else {
                    window.print();
                  }
                }}
                disabled={downloadMutation.isPending}
                className="inline-flex w-full justify-center items-center gap-2.5 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                <Download className="w-4 h-4" />
                {downloadMutation.isPending ? "Downloading..." : "Download PDF"}
              </button>

              <button
                onClick={() => window.print()}
                className="inline-flex w-full justify-center items-center gap-2.5 px-4 py-3 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm rounded-xl border border-slate-200 transition-all duration-150 cursor-pointer"
              >
                <FileText className="w-4 h-4 text-slate-500" />
                Print Certificate
              </button>

              <button
                onClick={() => {
                  const targetCourseId = (activeCert as any)?.courseId || (activeCert as any)?.course?.id || urlCourseId || "";
                  const targetCpId = (activeCert as any)?.careerPathId || (activeCert as any)?.career_path_id || urlCareerPathId || "";
                  navigate(`/course-player?courseId=${targetCourseId}${targetCpId ? `&careerPathId=${targetCpId}` : ''}`);
                }}
                className="inline-flex w-full justify-center items-center gap-2.5 px-4 py-3 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm rounded-xl border border-slate-200 transition-all duration-150 cursor-pointer"
              >
                <Eye className="w-4 h-4 text-slate-500" />
                Rewatch Course SOP
              </button>

              <button
                onClick={() => setIsShareModalOpen(true)}
                className="inline-flex w-full justify-center items-center gap-2.5 px-4 py-3 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm rounded-xl border border-slate-200 transition-all duration-150 cursor-pointer"
              >
                <Share2 className="w-4 h-4 text-slate-500" />
                Share Credential
              </button>

              <button
                onClick={() => setIsEditNameOpen(true)}
                className="inline-flex w-full justify-center items-center gap-2.5 px-4 py-3 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm rounded-xl border border-slate-200 transition-all duration-150 cursor-pointer"
              >
                <Pencil className="w-4 h-4 text-slate-500" />
                Edit Name on Certificate
              </button>

              <button
                onClick={() => navigate(`/issue-reporting`)}
                className="inline-flex w-full justify-center items-center gap-2.5 px-4 py-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-sm rounded-xl border border-indigo-200 transition-all duration-150 cursor-pointer"
              >
                <FileText className="w-4 h-4 text-indigo-600" />
                Submit Training Feedback
              </button>

              <button
                onClick={() => navigate(`/verify/${proofId}`)}
                className="inline-flex w-full justify-center items-center gap-2.5 px-4 py-3 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm rounded-xl border border-slate-200 transition-all duration-150 cursor-pointer"
              >
                <ExternalLink className="w-4 h-4 text-slate-500" />
                Verify Credential Registry
              </button>
            </div>
          </div>

          {/* Verification Badge */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h4 className="text-slate-900 font-bold text-sm mb-1 leading-tight">Anyone can verify this proof</h4>
              <p className="text-slate-600 text-xs leading-snug">
                Verify at <span className="font-bold text-slate-800">nexusacademy.org/verify/{proofId}</span> without signing in.
              </p>
            </div>
          </div>
        </div>
      </div>

      {isEditNameOpen && (
        <CertificateNameEditer
          initialName={displayName}
          onClose={() => setIsEditNameOpen(false)}
          onSubmit={(newName) => {
            if (activeCert) {
              handleConfirmAndGenerate(newName);
            } else {
              toast.success("Certificate recipient name updated!");
            }
            setIsEditNameOpen(false);
          }}
        />
      )}

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
