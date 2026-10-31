import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  Check,
  Heart,
  Share2,
  Video,
  FileText,
  Lock,
  Play,
  X,
  Copy,
} from "lucide-react";
import { toast } from "sonner";
import {
  coursePreviewApi,
  DEFAULT_PREVIEW_VIEW_MODEL,
} from "../../core/api/content-developer-workspace/coursePreview.api";
import { courseOverviewApi } from "../../core/api/content-developer-workspace/courseOverview.api";
import { courseApi } from "../../core/api/course/course.api";
import { enrollCareerPathApi } from "../../core/api/career-path/career-path.api";
import { VideoPlayer } from "../../components/VideoPlayer/VideoPlayer";
import { showProfileIncompleteModal } from "../../utils/profileAlert";

type EntityType = "course" | "career-path" | "lesson";

export const ContentDeveloperCoursePreview: React.FC = () => {
  const { entityType = "course", id = "" } = useParams<{
    entityType: EntityType;
    id: string;
  }>();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as any;
  const effectiveEntityType: EntityType = (entityType || state?.entityType || "course") as EntityType;
  const effectiveId = id && id !== "draft" && id !== "draft-preview" ? id : (state?.entityId && state?.entityId !== "draft" && state?.entityId !== "draft-preview" ? state.entityId : "");
  const [learningMode, setLearningMode] = useState<"video" | "text">("video");
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isWishlistLoading, setIsWishlistLoading] = useState(false);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);
  const [previewLessonModal, setPreviewLessonModal] = useState<any>(null);

  const handleSelectLearningMode = (mode: "video" | "text") => {
    if (learningMode === mode) return;
    setLearningMode(mode);
    if (mode === "text") {
      toast.success("Text Mode Selected");
    } else {
      toast.success("Video Mode Selected");
    }
  };

  const { data: entityData, isLoading: entityLoading } = useQuery({
    queryKey: ["previewEntity", effectiveEntityType, effectiveId],
    queryFn: () => {
      if (!effectiveId) return Promise.resolve(null);
      if (effectiveEntityType === "career-path") return courseOverviewApi.getCareerPathOverview(effectiveId);
      if (effectiveEntityType === "lesson") return courseOverviewApi.getLessonOverview(effectiveId);
      return coursePreviewApi.getCoursePreview(effectiveId);
    },
    enabled: !!effectiveId,
  });

  const { data: lessons = [], isLoading: lessonsLoading } = useQuery({
    queryKey: ["previewLessons", effectiveEntityType, effectiveId],
    queryFn: async () => {
      if (!effectiveId) return [];
      if (effectiveEntityType === "course") return coursePreviewApi.getCourseLessons(effectiveId);
      if (effectiveEntityType === "career-path") return coursePreviewApi.getCareerPathCourses(effectiveId);
      return [];
    },
    enabled: !!effectiveId,
  });

  const isLoading = entityLoading || lessonsLoading;

  // ---------------------------------------------------------------------------
  // BRD §27.3 / US Story 3 AC#5 — Audit log: "Log: Course preview views"
  // Fires once when real entity data loads from the backend.
  // Guards: effectiveId ensures we only log for real DB entities (not fallback).
  // Fire-and-forget: UI never breaks if this fails.
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!effectiveId || !entityData) return;
    coursePreviewApi.logPreviewView(effectiveEntityType, effectiveId);
  }, [effectiveId, effectiveEntityType, entityData]);

  // ---------------------------------------------------------------------------
  // BRD §7.3 ENR-06 / Story 3 AC#4 — Wishlist Persistence
  // Loads current wishlist state from PostgreSQL on mount.
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!effectiveId) return;
    let isMounted = true;
    coursePreviewApi.checkIsWishlisted(effectiveId).then((wishlisted) => {
      if (isMounted) setIsWishlisted(wishlisted);
    }).catch(() => {});
    return () => {
      isMounted = false;
    };
  }, [effectiveId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAF9F7] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-[#5C5C5C] font-medium" style={{ fontFamily: "Manrope, system-ui, sans-serif" }}>
            Loading preview...
          </p>
        </div>
      </div>
    );
  }

  const effectiveLessons = effectiveEntityType === "lesson" && entityData ? [entityData] : lessons;
  const mappedData =
    coursePreviewApi.mapCoursePreviewViewModel(
      entityData || state?.course,
      effectiveLessons
    ) || DEFAULT_PREVIEW_VIEW_MODEL;

  const { previewCourse, instructor, objectives, curriculum, assessment } = mappedData;

  const handleExitPreview = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else if (effectiveId && effectiveEntityType) {
      navigate(`/content-developer/course-overview/${effectiveEntityType}/${effectiveId}`);
    } else {
      navigate("/studio");
    }
  };

  // ---------------------------------------------------------------------------
  // BRD §7.3 ENR-01 - ENR-04 / Story 4 — Enrollment Handling
  // Connects to real Course / Career Path enrollment API.
  // Respects BRD Row #154 / ENR-04: unpublished courses cannot be enrolled.
  // ---------------------------------------------------------------------------
  const handleEnrol = async () => {
    if (!effectiveId) {
      toast.info("Preview Mode: This is how learners will experience course enrolment.");
      return;
    }

    const currentStatus = String(entityData?.status || previewCourse.status || "DRAFT").toUpperCase();

    if (effectiveEntityType === "course") {
      if (currentStatus !== "PUBLISHED") {
        toast.info(`Preview Mode: Course is in ${currentStatus} status. Enrolment is enabled once published.`);
        return;
      }
      setIsEnrolling(true);
      try {
        await courseApi.enroll(effectiveId);
        toast.success("Successfully enrolled in course!");
      } catch (err: any) {
        const msg = err?.response?.data?.message || err?.message || "";
        const isProfileError = err?.response?.data?.profileCompletionRequired || msg.includes("80%");
        if (isProfileError) {
          showProfileIncompleteModal(navigate, msg, err?.response?.data?.profileCompleteness);
          return;
        }
        if (msg.toLowerCase().includes("already enrolled")) {
          toast.info("You are already enrolled in this course.");
        } else {
          toast.error(msg || "Enrolment failed");
        }
      } finally {
        setIsEnrolling(false);
      }
    } else if (effectiveEntityType === "career-path") {
      if (currentStatus !== "PUBLISHED") {
        toast.info(`Preview Mode: Career path is in ${currentStatus} status. Enrolment is enabled once published.`);
        return;
      }
      setIsEnrolling(true);
      try {
        await enrollCareerPathApi(effectiveId);
        toast.success("Successfully enrolled in career path!");
      } catch (err: any) {
        const msg = err?.response?.data?.message || err?.message || "";
        const isProfileError = err?.response?.data?.profileCompletionRequired || msg.includes("80%");
        if (isProfileError) {
          showProfileIncompleteModal(navigate, msg, err?.response?.data?.profileCompleteness);
          return;
        }
        if (msg.toLowerCase().includes("already enrolled")) {
          toast.info("You are already enrolled in this career path.");
        } else {
          toast.error(msg || "Enrolment failed");
        }
      } finally {
        setIsEnrolling(false);
      }
    } else {
      toast.info("Preview Mode: Standalone lessons are directly accessible without course enrolment.");
    }
  };

  // ---------------------------------------------------------------------------
  // BRD §7.3 ENR-06 / Story 3 AC#4 — Add / Remove from Wishlist
  // Persists to PostgreSQL via /wishlists endpoint.
  // ---------------------------------------------------------------------------
  const handleWishlist = async () => {
    if (!effectiveId) {
      toast.error("Entity ID missing.");
      return;
    }
    setIsWishlistLoading(true);
    try {
      if (isWishlisted) {
        await coursePreviewApi.removeFromWishlist(effectiveId, effectiveEntityType);
        setIsWishlisted(false);
        toast.success("Removed from your wishlist.");
      } else {
        await coursePreviewApi.addToWishlist(effectiveId, effectiveEntityType);
        setIsWishlisted(true);
        toast.success("Added to your wishlist!");
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || "Failed to update wishlist");
    } finally {
      setIsWishlistLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Real Share Link Generation — fetches or regenerates share token
  // ---------------------------------------------------------------------------
  const handleOpenShareModal = async () => {
    let url = `${window.location.origin}/content-developer/course-preview/${effectiveEntityType}/${effectiveId || previewCourse.id}`;
    if (effectiveEntityType === "course" && effectiveId) {
      if (entityData?.shareToken) {
        url = `${window.location.origin}/courses/share/${entityData.shareToken}`;
      } else {
        try {
          const tokenRes = await courseApi.regenerateShareToken(effectiveId);
          const token =
            (tokenRes as any)?.data?.data?.shareToken ||
            (tokenRes as any)?.data?.shareToken ||
            (tokenRes as any)?.shareToken;
          if (token) {
            url = `${window.location.origin}/courses/share/${token}`;
          }
        } catch {
          // Fallback to standard preview url
        }
      }
    }
    setShareUrl(url);
    setShowShareModal(true);
  };

  const handleCopyShareLink = async () => {
    const targetUrl = shareUrl || `${window.location.origin}/content-developer/course-preview/${effectiveEntityType}/${effectiveId || previewCourse.id}`;
    navigator.clipboard.writeText(targetUrl).then(() => {
      setCopiedLink(true);
      toast.success("Share link copied to clipboard!");
      setTimeout(() => {
        setCopiedLink(false);
        setShowShareModal(false);
      }, 1000);
    }).catch(() => {
      toast.success("Share link copied to clipboard!");
      setShowShareModal(false);
    });
  };

  return (
    <div
      className="w-full min-w-0 space-y-6 pb-12 font-sans"
      style={{ fontFamily: "Manrope, system-ui, -apple-system, sans-serif" }}
    >
      <div
        className="bg-[#141414] text-white rounded-[12px] px-6 py-3.5 flex items-center justify-between shadow-xs transition-all"
        style={{ minHeight: "48px" }}
      >
        <div className="flex items-center gap-3 text-xs">
          <span className="cdp-banner-tag font-extrabold uppercase tracking-widest text-[#FFFFFF]" style={{ fontSize: "12px" }}>
            PREVIEW MODE
          </span>
          <span className="text-[#5C5C5C] font-bold">|</span>
          <span className="cdp-banner-copy text-[#FFFFFF] font-normal" style={{ fontSize: "16px" }}>
            You are viewing <span className="font-semibold text-white">{previewCourse.title || "Course"}</span> as a learner would see it.
          </span>
        </div>
        <button
          onClick={handleExitPreview}
          className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-white hover:text-gray-300 transition-colors cursor-pointer shrink-0 ml-4"
          style={{ fontSize: "12px" }}
        >
          EXIT PREVIEW
          <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_310px] gap-8 items-start">
        <div className="space-y-8 min-w-0">
          <div className="space-y-3">
            {previewCourse.category ? (
              <div className="eyebrow font-bold uppercase tracking-[0.14em] text-[#5C5C5C]" style={{ fontSize: "12px", marginBottom: "6px" }}>
                {previewCourse.category}
              </div>
            ) : null}
            <h1 className="cdp-title font-extrabold text-[#141414] leading-tight" style={{ fontSize: "24px", marginBottom: "12px" }}>
              {previewCourse.title || "Course Preview"}
            </h1>
            {previewCourse.description ? (
              <p className="cdp-sub font-normal leading-relaxed text-[#3A3A3A]" style={{ fontSize: "14px", marginBottom: "20px" }}>
                {previewCourse.description}
              </p>
            ) : null}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="chip inline-flex items-center justify-center font-medium bg-white text-[#3A3A3A] border border-[#E5E5E5] rounded-full" style={{ fontSize: "12px", padding: "0px 10px", height: "22px" }}>
                {previewCourse.lessonsCount ?? 0} {previewCourse.lessonsCount === 1 ? "lesson" : "lessons"}
              </span>
              <span className="chip inline-flex items-center justify-center font-medium bg-white text-[#3A3A3A] border border-[#E5E5E5] rounded-full" style={{ fontSize: "12px", padding: "0px 10px", height: "22px" }}>
                {previewCourse.durationHours ? `${previewCourse.durationHours} ${previewCourse.durationHours === 1 ? "hour" : "hours"}` : "Self-paced"}
              </span>
              <span className="chip inline-flex items-center justify-center font-medium bg-white text-[#3A3A3A] border border-[#E5E5E5] rounded-full" style={{ fontSize: "12px", padding: "0px 10px", height: "22px" }}>
                {previewCourse.level || "All Levels"}
              </span>
              <span className="chip inline-flex items-center justify-center font-medium rounded-full" style={{ fontSize: "12px", padding: "0px 10px", height: "22px", backgroundColor: "#F6E8C4", color: "#755A12", border: "1px solid #EFD38B" }}>
                {previewCourse.certificateName || "Certificate of Completion"}
              </span>
              <span className="chip inline-flex items-center justify-center font-medium rounded-full" style={{ fontSize: "12px", padding: "0px 10px", height: "22px", backgroundColor: "#DCE5D3", color: "#446038", border: "1px solid #CADBBF" }}>
                {previewCourse.enrolledCount ?? 0} enrolled
              </span>
            </div>
            <div className="flex items-center gap-3 pt-3">
              <span className="cdp-mode-label font-bold uppercase tracking-wider text-[#5C5C5C]" style={{ fontSize: "12px" }}>LEARNING MODE</span>
              <div className="flex items-center bg-[#F6F6F4] p-[3px] rounded-full border border-[#EAEAEA]">
                <button
                  type="button"
                  id="cdp-btn-mode-video"
                  onClick={() => handleSelectLearningMode("video")}
                  className={`cdp-mode-btn flex items-center gap-1.5 rounded-full transition-all cursor-pointer ${learningMode === "video" ? "is-active bg-white text-[#141414] font-semibold border border-[#E5E5E5]" : "text-[#5C5C5C] font-medium hover:text-[#141414]"}`}
                  style={{ fontSize: "16px", padding: "6px 16px" }}
                >
                  <Video className="w-4 h-4" /> Video
                </button>
                <button
                  type="button"
                  id="cdp-btn-mode-text"
                  onClick={() => handleSelectLearningMode("text")}
                  className={`cdp-mode-btn flex items-center gap-1.5 rounded-full transition-all cursor-pointer ${learningMode === "text" ? "is-active bg-white text-[#141414] font-semibold border border-[#E5E5E5]" : "text-[#5C5C5C] font-medium hover:text-[#141414]"}`}
                  style={{ fontSize: "16px", padding: "6px 16px" }}
                >
                  <FileText className="w-4 h-4" /> Text
                </button>
              </div>
            </div>
          </div>

          {/* Instructor Card — div.cdp-avatar, div.cdp-inst-name, div.cdp-inst-role */}
          {instructor && instructor.name && (
            <div className="bg-white border border-[#EAEAEA] rounded-[16px] p-4 flex items-center gap-3.5">
              <div
                className="cdp-avatar rounded-full flex items-center justify-center font-bold shrink-0"
                style={{
                  width: "42px",
                  height: "42px",
                  backgroundColor: "#F6E8C4",
                  color: "#755A12",
                  fontSize: "14px",
                }}
              >
                {instructor.avatarInitials || (instructor.name ? instructor.name.slice(0, 2).toUpperCase() : "IN")}
              </div>
              <div className="min-w-0">
                <div
                  className="cdp-inst-name font-bold text-[#141414]"
                  style={{ fontSize: "16px" }}
                >
                  {instructor.name}
                </div>
              </div>
            </div>
          )}

          {/* What you'll learn — h2.cdp-section-title & 16px text */}
          {objectives && objectives.length > 0 && (
            <div className="space-y-4 pt-1">
              <h2
                className="cdp-section-title font-bold text-[#141414]"
                style={{ fontSize: "16px", margin: "0px 0px 14px" }}
              >
                What you'll learn
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3.5">
                {objectives.map((obj: string, idx: number) => (
                  <div key={idx} className="flex items-start gap-2.5">
                    <Check
                      className="w-4 h-4 shrink-0 mt-1"
                      style={{ color: "#2E9F5B" }}
                      strokeWidth={2.5}
                    />
                    <span
                      className="font-normal leading-snug text-[#3A3A3A]"
                      style={{ fontSize: "16px" }}
                    >
                      {obj}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Curriculum Section — h2.cdp-section-title & span.cdp-section-sub */}
          <div className="pt-2">
            <div className="flex items-baseline gap-1" style={{ marginBottom: "14px" }}>
              <h2
                className="cdp-section-title font-bold text-[#141414]"
                style={{ fontSize: "16px" }}
              >
                Curriculum
              </h2>
              <span
                className="cdp-section-sub font-normal text-[#5C5C5C]"
                style={{ fontSize: "16px" }}
              >
                · {curriculum?.length || 0} {curriculum?.length === 1 ? "lesson" : "lessons"}
              </span>
            </div>

            {/* Curriculum Lessons Card */}
            <div className="bg-white border border-[#EAEAEA] rounded-[16px] overflow-hidden divide-y divide-[#F0F0F0]">
              {curriculum?.map((lesson: any, idx: number) => {
                const isFirst = idx === 0;
                const isFree = lesson.isFree || isFirst;

                return (
                  <div
                    key={lesson.id || idx}
                    onClick={() => isFree && setPreviewLessonModal(lesson)}
                    className={`flex items-center justify-between px-5 py-4 transition-all duration-150 ${isFree ? "cursor-pointer hover:bg-[#FAF9F7]/90" : "hover:bg-[#FAF9F7]/70"
                      }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      {isFree ? (
                        <div
                          className="rounded-full flex items-center justify-center shrink-0"
                          style={{
                            width: "28px",
                            height: "28px",
                            backgroundColor: "#DCE5D3",
                            color: "#446038",
                          }}
                        >
                          <Play className="w-3 h-3 fill-current ml-0.5" />
                        </div>
                      ) : (
                        <div
                          className="rounded-full flex items-center justify-center shrink-0"
                          style={{
                            width: "28px",
                            height: "28px",
                            backgroundColor: "#F6F6F4",
                            color: "#8C8C8C",
                          }}
                        >
                          <Lock className="w-3 h-3" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <div
                          className="cdp-lesson-title font-semibold truncate"
                          style={{ fontSize: "16px", color: "#141414" }}
                        >
                          {lesson.title.match(/^\d+\./) ? lesson.title : `${idx + 1}. ${lesson.title}`}
                        </div>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span
                            className="cdp-lesson-dur font-normal text-[#5C5C5C]"
                            style={{ fontSize: "14px" }}
                          >
                            {lesson.duration}
                          </span>
                          {lesson.modes?.map((mode: string, mIdx: number) => {
                            const isModeActive =
                              (mode.toLowerCase() === "video" && learningMode === "video") ||
                              (mode.toLowerCase() === "text" && learningMode === "text");

                            return (
                              <span
                                key={mIdx}
                                className={`cdp-fmt inline-flex items-center gap-1 rounded-full font-medium ${isModeActive ? "cdp-fmt-text" : ""
                                  }`}
                                style={{
                                  fontSize: "12px",
                                  padding: "2px 9px",
                                  backgroundColor: isModeActive ? "#DCE5D3" : "#F6F6F4",
                                  color: isModeActive ? "#446038" : "#5C5C5C",
                                }}
                              >
                                {mode === "Video" && <Video className="w-3 h-3" />}
                                {mode === "PDF" && <FileText className="w-3 h-3" />}
                                {mode === "Text" && <FileText className="w-3 h-3" />}
                                {mode}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 ml-4">
                      {isFree ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewLessonModal(lesson);
                          }}
                          className="chip cdp-chip-sage inline-flex items-center justify-center font-medium rounded-full cursor-pointer hover:opacity-85 transition-opacity border-none"
                          style={{
                            fontSize: "12px",
                            padding: "0px 10px",
                            height: "20px",
                            backgroundColor: "#DCE5D3",
                            color: "#446038",
                          }}
                        >
                          Free preview
                        </button>
                      ) : (
                        <span
                          className="chip inline-flex items-center justify-center font-medium rounded-full bg-white border border-[#E0E0E0] text-[#3A3A3A]"
                          style={{
                            fontSize: "12px",
                            padding: "0px 10px",
                            height: "20px",
                          }}
                        >
                          Locked
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Final Assessment Row inside Curriculum Card */}
              {assessment && assessment.questions > 0 && (
                <div className="flex items-center justify-between px-5 py-4 hover:bg-[#FAF9F7]/70 transition-all duration-150">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className="rounded-full flex items-center justify-center shrink-0"
                      style={{
                        width: "28px",
                        height: "28px",
                        backgroundColor: "#F6E8C4",
                        color: "#755A12",
                      }}
                    >
                      <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
                    </div>
                    <div className="min-w-0">
                      <div
                        className="cdp-lesson-title font-semibold text-[#5C5C5C]"
                        style={{ fontSize: "16px" }}
                      >
                        Final assessment
                      </div>
                      <div
                        className="font-normal text-[#8C8C8C] mt-0.5"
                        style={{ fontSize: "14px" }}
                      >
                        {assessment.questions} {assessment.questions === 1 ? "question" : "questions"} · pass mark {assessment.passMark}%
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 ml-4">
                    <span
                      className="chip inline-flex items-center justify-center font-medium rounded-full bg-white border border-[#E0E0E0] text-[#3A3A3A]"
                      style={{
                        fontSize: "12px",
                        padding: "0px 10px",
                        height: "20px",
                      }}
                    >
                      After all lessons
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Enrollment & Meta Card */}
        <div className="bg-white border border-[#EAEAEA] rounded-[20px] p-5 shadow-xs flex flex-col gap-4 lg:sticky lg:top-6 min-w-0">
          <div className="w-full h-44 relative bg-gray-900 rounded-[14px] overflow-hidden">
            <img
              src={(previewCourse as any)?.coverImage || "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&q=80"}
              alt={previewCourse.title || "Course"}
              className="w-full h-full object-cover opacity-85"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent flex flex-col justify-end p-4">
              <span className="font-bold text-white/90 uppercase tracking-widest text-[10px]">
                {previewCourse.category || previewCourse.domain || "COURSE"}
              </span>
              <span className="font-extrabold text-white tracking-wide text-[15px] line-clamp-2">
                {previewCourse.title}
              </span>
            </div>
          </div>
          <div>
            <div className="cdp-price font-extrabold text-[#141414]" style={{ fontSize: "24px" }}>Free</div>
            <p className="cdp-price-sub font-normal text-[#5C5C5C] mt-0.5" style={{ fontSize: "16px" }}>Included in Nexus membership</p>
          </div>
          <button
            type="button"
            onClick={handleEnrol}
            disabled={isEnrolling}
            className="nexus-btn block w-full text-center font-bold text-[#141414] bg-[#FCF7AE] hover:bg-[#F5EB8A] rounded-full transition-colors cursor-pointer border-none shadow-none active:scale-98 disabled:opacity-50"
            style={{ fontSize: "16px", padding: "11px 18px" }}
          >
            {isEnrolling ? "Enrolling..." : "Enrol now →"}
          </button>
          <button
            type="button"
            onClick={handleWishlist}
            disabled={isWishlistLoading}
            className={`w-full border rounded-full transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-none active:scale-98 disabled:opacity-50 ${isWishlisted ? "bg-red-50 text-red-600 border-red-200 font-semibold" : "bg-white border-[#E0E0E0] text-[#141414] font-semibold hover:bg-[#F6F6F4]"}`}
            style={{ fontSize: "14px", padding: "10px 18px" }}
          >
            <Heart className={`w-4 h-4 ${isWishlisted ? "fill-red-500 text-red-500" : ""}`} /> {isWishlisted ? "Added to Wishlist" : "Add to Wishlist"}
          </button>
          <button
            type="button"
            onClick={handleOpenShareModal}
            className="w-full bg-white border border-[#E0E0E0] text-[#141414] font-semibold rounded-full hover:bg-[#F6F6F4] transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-none active:scale-98"
            style={{ fontSize: "14px", padding: "10px 18px" }}
          >
            <Share2 className="w-4 h-4" /> Share course
          </button>
          <div className="border-t border-[#F0F0F0] pt-4 mt-1 space-y-3">
            <div className="cdp-earn-label font-bold uppercase tracking-wider text-[#5C5C5C]" style={{ fontSize: "12px" }}>EARN ON COMPLETION</div>
            <div className="flex items-center gap-3">
              <div className="cdp-seal rounded-full flex flex-col items-center justify-center font-extrabold shrink-0 text-center uppercase leading-tight" style={{ width: "52px", height: "52px", backgroundColor: "#DCE5D3", color: "#446038", fontSize: "12px" }}>
                <span>Nexus Academy</span>
                <span style={{ fontSize: "10px" }}>SEAL</span>
              </div>
              <div className="min-w-0">
                <div className="cdp-earn-name font-bold text-[#141414]" style={{ fontSize: "16px" }}>{previewCourse.certificateName || "Certificate of Completion"}</div>
                <div className="cdp-earn-meta font-normal text-[#5C5C5C]" style={{ fontSize: "14px", marginTop: "3px" }}>Verifiable at nexusacademy.org/verify/</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-[20px] p-6 max-w-md w-full shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <button type="button" onClick={() => setShowShareModal(false)} className="absolute right-4 top-4 w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-900 flex items-center justify-center transition-colors cursor-pointer border-none" aria-label="Close"><X className="w-4 h-4" /></button>
            <h3 className="text-lg font-bold text-[#141414] mb-1">Share this course</h3>
            <p className="text-sm text-[#5C5C5C] mb-4">Copy the link below to share {previewCourse.title || "this course"} with others.</p>
            <div className="mb-5">
              <input type="text" readOnly value={shareUrl || `${window.location.origin}/content-developer/course-preview/${effectiveEntityType}/${effectiveId || previewCourse.id}`} className="w-full bg-white border border-[#E0E0E0] rounded-xl px-3.5 py-2.5 text-sm text-[#3A3A3A] font-medium outline-none focus:border-black select-all" />
            </div>
            <div className="flex items-center gap-3">
              <button type="button" onClick={handleCopyShareLink} className="flex-1 flex items-center justify-center gap-2 bg-[#FCF7AE] hover:bg-[#F5EB8A] text-[#141414] font-bold text-sm py-2.5 px-4 rounded-full transition-colors cursor-pointer border-none shadow-none">
                {copiedLink ? <Check className="w-4 h-4 text-emerald-700" /> : <Copy className="w-4 h-4" />} {copiedLink ? "Copied!" : "Copy link"}
              </button>
              <button type="button" onClick={() => setShowShareModal(false)} className="flex-1 bg-white hover:bg-gray-50 text-[#141414] border border-[#E0E0E0] font-semibold text-sm py-2.5 px-4 rounded-full transition-colors cursor-pointer">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {previewLessonModal && (() => {
        const modalVideoUrl =
          previewLessonModal.videoUrl ||
          previewLessonModal.assets_storage_lessons_content_asset_idToassets_storage?.externalUrl ||
          previewLessonModal.assets_storage_lessons_content_asset_idToassets_storage?.signedUrl ||
          previewLessonModal.assets_storage_lessons_content_asset_idToassets_storage?.fileUrl ||
          previewLessonModal.assets_storage_lessons_content_asset_idToassets_storage?.url ||
          previewLessonModal.contentAsset?.externalUrl ||
          previewLessonModal.contentAsset?.signedUrl ||
          previewLessonModal.contentAsset?.fileUrl ||
          previewLessonModal.contentAsset?.url ||
          previewLessonModal.previewAsset?.externalUrl ||
          previewLessonModal.previewAsset?.signedUrl ||
          previewLessonModal.previewAsset?.fileUrl ||
          previewLessonModal.previewAsset?.url ||
          previewLessonModal.signedUrl ||
          previewLessonModal.fileUrl;

        const modalSubtitleUrl =
          previewLessonModal.subtitleUrl ||
          previewLessonModal.transcriptAsset?.signedUrl ||
          previewLessonModal.transcriptAsset?.fileUrl;

        const isPdf =
          previewLessonModal.type === "PDF" ||
          previewLessonModal.modes?.includes("PDF") ||
          (modalVideoUrl && modalVideoUrl.endsWith(".pdf"));

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="bg-white rounded-[20px] max-w-3xl w-full shadow-2xl overflow-hidden relative animate-in fade-in zoom-in-95 duration-200">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#DCE5D3] text-[#446038]">
                    {previewLessonModal.status || "Free Preview"}
                  </span>
                  <h3 className="text-base font-bold text-[#141414] truncate max-w-md">
                    {previewLessonModal.title}
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center bg-[#F6F6F4] p-[2px] rounded-full border border-[#EAEAEA]">
                    <button
                      type="button"
                      onClick={() => handleSelectLearningMode("video")}
                      className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full transition-all cursor-pointer ${learningMode === "video" ? "bg-white text-[#141414] shadow-xs" : "text-[#5C5C5C] hover:text-[#141414]"}`}
                    >
                      <Video className="w-3 h-3" /> Video
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectLearningMode("text")}
                      className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full transition-all cursor-pointer ${learningMode === "text" ? "bg-white text-[#141414] shadow-xs" : "text-[#5C5C5C] hover:text-[#141414]"}`}
                    >
                      <FileText className="w-3 h-3" /> Text
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPreviewLessonModal(null)}
                    className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-900 flex items-center justify-center transition-colors cursor-pointer border-none ml-2"
                    aria-label="Close"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {learningMode === "video" ? (
                modalVideoUrl && !modalVideoUrl.endsWith(".pdf") ? (
                  <div className="bg-black w-full aspect-video flex items-center justify-center relative overflow-hidden">
                    <VideoPlayer
                      key={modalVideoUrl}
                      src={modalVideoUrl}
                      title={previewLessonModal.title}
                      tracks={
                        modalSubtitleUrl
                          ? [
                            {
                              kind: "captions",
                              src: modalSubtitleUrl,
                              label: "English",
                              language: "en",
                              default: true,
                            },
                          ]
                          : []
                      }
                      blockFastForward={false}
                      className="w-full h-full"
                    />
                  </div>
                ) : (
                  <div className="bg-gray-950 aspect-video w-full flex flex-col items-center justify-center p-6 text-center text-white">
                    <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center mb-3">
                      <Video className="w-7 h-7 text-gray-300" />
                    </div>
                    <p className="text-sm font-bold text-gray-200 mb-1">
                      No video source attached yet
                    </p>
                    <p className="text-xs text-gray-400 max-w-sm">
                      Upload or link a video in the lesson editor to preview it here.
                    </p>
                  </div>
                )
              ) : isPdf && modalVideoUrl ? (
                <div className="w-full h-[450px] bg-gray-100">
                  <iframe
                    src={modalVideoUrl}
                    title={previewLessonModal.title}
                    className="w-full h-full border-0"
                  />
                </div>
              ) : (previewLessonModal.lessonContents && previewLessonModal.lessonContents.length > 0) || previewLessonModal.description ? (
                <div className="p-8 max-h-[450px] overflow-y-auto space-y-4">
                  <h4 className="text-base font-bold text-gray-900">
                    {previewLessonModal.title}
                  </h4>
                  {previewLessonModal.description && (
                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {previewLessonModal.description}
                    </p>
                  )}
                  {previewLessonModal.lessonContents && (
                    <div className="space-y-3 pt-2">
                      {previewLessonModal.lessonContents.map((content: any) => (
                        <div key={content.id} className="space-y-2">
                          <h5 className="font-semibold text-gray-800 text-sm">
                            {content.title}
                          </h5>
                          {content.blocks?.map((block: any) => (
                            <div key={block.id} className="text-sm text-gray-600">
                              {block.textContent || block.content}
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-gray-50 h-[300px] w-full flex flex-col items-center justify-center p-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center mb-3 text-gray-500">
                    <FileText className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-bold text-gray-700 mb-1">
                    No text content available for this lesson
                  </p>
                  <p className="text-xs text-gray-500 max-w-sm">
                    Add lesson descriptions or rich text blocks in the editor to preview text content.
                  </p>
                </div>
              )}

              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                <span className="text-xs text-gray-500 font-medium">
                  Lesson duration: {previewLessonModal.duration}
                </span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      const lessonId = previewLessonModal.id;
                      setPreviewLessonModal(null);
                      navigate(`/content-developer/course-preview/lesson/${lessonId}`);
                    }}
                    className="px-3.5 py-2 text-xs font-bold text-gray-700 bg-white border border-gray-300 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    Open lesson preview ↗
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewLessonModal(null)}
                    className="px-4 py-2 text-xs font-bold text-gray-700 bg-white border border-gray-300 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPreviewLessonModal(null);
                      handleEnrol();
                    }}
                    className="px-5 py-2 text-xs font-bold text-[#141414] bg-[#FCF7AE] hover:bg-[#F5EB8A] rounded-full transition-colors cursor-pointer border-none"
                  >
                    Enrol in full course →
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default ContentDeveloperCoursePreview;