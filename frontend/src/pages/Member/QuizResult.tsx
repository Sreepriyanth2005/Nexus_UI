import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { getQuizResultApi } from "../../core/api/assessment.api";
import { getCareerPathApi } from "../../core/api/career-path/career-path.api";
import { courseDetailsApi } from "../../core/api/course-details/courseDetails.api";
import { memberLearningApi } from "../../core/api/member-learning/memberLearningApi";
// Icons from lucide-react
import { Award, CheckSquare, ChevronRight, Play, Star, ArrowRight, MessageSquare, CheckCircle2, RotateCcw, Download, QrCode, ShieldCheck } from "lucide-react";
import { AlertTriangle, FileText, RefreshCw } from "lucide-react";
import { useUserStore } from "../../store/user.store";
import CertificateNameChangeModal from "./CertificateNameChangeModal";
import { Skeleton } from "../../components/ui/Skeleton/Skeleton";
import { useUserCertificates } from "../../hooks/course-completed/courseCompleted";

const QuizResultSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen space-y-6">
      {/* Hero Banner Skeleton */}
      <div className="rounded-[20px] bg-[var(--paper)] border border-[var(--line)] px-8 py-12 text-center flex flex-col items-center gap-4">
        <Skeleton className="w-24 h-16 rounded-xl" />
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96 max-w-full" />
        <div className="flex flex-wrap justify-center gap-4 pt-2">
          <Skeleton className="h-12 w-56 rounded-full" />
          <Skeleton className="h-12 w-48 rounded-full" />
        </div>
      </div>

      {/* Two Column Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-[16px] border border-[var(--line)] p-7 space-y-6">
          <Skeleton className="h-4 w-28" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-start gap-4">
                <Skeleton className="w-10 h-10 rounded-[10px] shrink-0" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-[16px] border border-[var(--line)] p-7 space-y-6">
          <Skeleton className="h-4 w-44" />
          <div className="space-y-4">
            <Skeleton className="w-full h-36 rounded-xl" />
            <Skeleton className="h-6 w-3/4" />
            <div className="flex gap-3">
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
            <Skeleton className="h-11 w-full rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Confetti pieces for dropping animation ────────────────────────────────────
const CONFETTI_PIECES = [
  { left: "5%",  color: "#e74c3c", w: 10, h: 6,  del: 0.0, dur: 3.2, rot: 1 },
  { left: "12%", color: "#3498db", w: 8,  h: 5,  del: 1.5, dur: 4.1, rot: -1 },
  { left: "18%", color: "#2ecc71", w: 12, h: 5,  del: 0.5, dur: 3.5, rot: 1 },
  { left: "22%", color: "#f39c12", w: 7,  h: 7,  del: 2.2, dur: 4.8, rot: -1 },
  { left: "30%", color: "#9b59b6", w: 10, h: 4,  del: 1.1, dur: 3.9, rot: 1 },
  { left: "38%", color: "#1abc9c", w: 8,  h: 6,  del: 3.0, dur: 4.5, rot: -1 },
  { left: "50%", color: "#e67e22", w: 9,  h: 5,  del: 0.2, dur: 3.1, rot: 1 },
  { left: "58%", color: "#e74c3c", w: 11, h: 4,  del: 2.5, dur: 4.2, rot: -1 },
  { left: "65%", color: "#3498db", w: 7,  h: 7,  del: 0.8, dur: 3.6, rot: 1 },
  { left: "72%", color: "#2ecc71", w: 10, h: 5,  del: 1.9, dur: 4.7, rot: -1 },
  { left: "80%", color: "#f39c12", w: 8,  h: 6,  del: 0.4, dur: 3.3, rot: 1 },
  { left: "87%", color: "#9b59b6", w: 9,  h: 4,  del: 2.8, dur: 4.4, rot: -1 },
  { left: "93%", color: "#1abc9c", w: 7,  h: 7,  del: 1.3, dur: 3.8, rot: 1 },
  { left: "96%", color: "#e67e22", w: 11, h: 5,  del: 0.7, dur: 3.4, rot: -1 },
  { left: "42%", color: "#e74c3c", w: 6,  h: 6,  del: 1.7, dur: 4.0, rot: 1 },
  { left: "75%", color: "#3498db", w: 9,  h: 4,  del: 2.1, dur: 4.3, rot: -1 },
];

const QuizResult: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const courseId = searchParams.get("courseId") || "";
  const careerPathId = searchParams.get("careerPathId") || "";
  const lessonId = searchParams.get("lessonId") || "";

  let rawAttemptId = location.state?.attemptId || searchParams.get("attemptId");
  if (rawAttemptId === "undefined" || rawAttemptId === "null") rawAttemptId = null;
  const attemptId = rawAttemptId;

  const user = useUserStore((state) => state.user);

  const [showNameModal, setShowNameModal] = useState(false);

  const { data: resultRes, isLoading } = useQuery({
    queryKey: ["quizResult", attemptId],
    queryFn: () => getQuizResultApi(attemptId!),
    enabled: !!attemptId,
  });

  const { data: courseRes } = useQuery({
    queryKey: ["courseDetails", courseId],
    queryFn: () => courseDetailsApi.getCourseDetails(courseId!),
    enabled: !!courseId,
  });

  const { data: careerPathRes } = useQuery({
    queryKey: ["careerPath", careerPathId],
    queryFn: () => getCareerPathApi(careerPathId!),
    enabled: !!careerPathId && !lessonId,
  });

  // Fetch user's overall learning progress data
  const { data: learningData } = useQuery({
    queryKey: ["learningData", user?.id],
    queryFn: () => memberLearningApi.getRawLearningData(user!.id),
    enabled: !!user?.id,
  });

  const resultData = resultRes?.data;

  const effectiveCareerPathId = careerPathId || resultData?.quiz?.careerPathId || "";
  const effectiveCourseId = courseId || resultData?.quiz?.courseId || "";

  const isCareerPathExam = Boolean(
    (!effectiveCourseId && effectiveCareerPathId) ||
    (resultData?.quiz && !resultData?.quiz?.courseId && resultData?.quiz?.careerPathId)
  );

  const { data: certsRes } = useUserCertificates(user?.id || "", undefined, !!user?.id);
  const userCertificates: any[] = Array.isArray(certsRes?.data)
    ? certsRes.data
    : Array.isArray(certsRes)
    ? certsRes
    : [];

  const existingCert = userCertificates.find((c: any) =>
    (effectiveCareerPathId && (c.careerPathId === effectiveCareerPathId || c.career_path_id === effectiveCareerPathId || c.careerPath?.id === effectiveCareerPathId)) ||
    (effectiveCourseId && (c.courseId === effectiveCourseId || c.course?.id === effectiveCourseId))
  );

  // Compute next course in career path if applicable
  const rawCourses = careerPathRes?.data?.courses || (careerPathRes?.data as any)?.careerPathCourses;
  const cpCourseList = rawCourses
    ?.sort((a: any, b: any) => a.sequenceOrder - b.sequenceOrder)
    ?.map((cpc: any) => cpc.course) || [];

  const currentCourseIdxInCP = cpCourseList.findIndex((c: any) => c.id === effectiveCourseId);
  const isLastCourseInCP = currentCourseIdxInCP !== -1 && currentCourseIdxInCP === cpCourseList.length - 1;
  const nextCourseInCP = !isLastCourseInCP && currentCourseIdxInCP !== -1 ? cpCourseList[currentCourseIdxInCP + 1] : null;

  // Find next enrolled item from learning data (exclude current course/careerpath and completed ones)
  const nextEnrolledItem = React.useMemo(() => {
    if (!learningData || learningData.length === 0) return null;
    const others = learningData.filter((item) => {
      const isCurrent = item.id === courseId || item.id === careerPathId;
      const isCompleted = item.statusText === "Completed" || item.progress === 100;
      return item.isEnrolled && !isCurrent && !isCompleted;
    });
    if (others.length === 0) return null;
    
    // Sort by last accessed time
    others.sort((a, b) => {
      const dateA = a.lastAccessedAt ? new Date(a.lastAccessedAt).getTime() : 0;
      const dateB = b.lastAccessedAt ? new Date(b.lastAccessedAt).getTime() : 0;
      return dateB - dateA;
    });
    return others[0];
  }, [learningData, courseId, careerPathId]);

  // Build display info for the Up Next card
  const upNextItem = React.useMemo(() => {
    // Priority 1: next course in the same career path
    if (nextCourseInCP) {
      const thumb = nextCourseInCP.thumbnailSignedUrl || nextCourseInCP.thumbnailUrl
        || nextCourseInCP.thumbnailAsset?.signedUrl || nextCourseInCP.thumbnailAsset?.fileUrl
        || nextCourseInCP.thumbnailAsset?.url || null;
      return {
        id: nextCourseInCP.id,
        title: nextCourseInCP.language?.title || nextCourseInCP.defaultContent?.title || nextCourseInCP.title || "Next Course",
        lessonsCount: nextCourseInCP.courseLessons?.length || nextCourseInCP.lessonsCount || 0,
        duration: nextCourseInCP.totalDurationMins ? `${Math.floor(nextCourseInCP.totalDurationMins / 60)}h ${nextCourseInCP.totalDurationMins % 60}m` : null,
        level: nextCourseInCP.level || nextCourseInCP.difficulty || "Practitioner",
        thumbnail: thumb,
        type: "course" as const,
        careerPathId: careerPathId,
        courseId: nextCourseInCP.id,
        firstLessonId: (nextCourseInCP.courseLessons?.[0]?.lesson || nextCourseInCP.courseLessons?.[0])?.id || "",
      };
    }
    
    // Priority 2: another active enrolled item from user's learning data
    if (nextEnrolledItem) {
      return {
        id: nextEnrolledItem.id,
        title: nextEnrolledItem.title || (nextEnrolledItem.type === "career-path" ? "Career Path" : "Course"),
        lessonsCount: nextEnrolledItem.lessonsCount || 0,
        duration: nextEnrolledItem.totalDurationMins ? `${Math.floor(nextEnrolledItem.totalDurationMins / 60)}h ${nextEnrolledItem.totalDurationMins % 60}m` : (nextEnrolledItem.type === "career-path" ? "Multiple courses" : null),
        level: nextEnrolledItem.level,
        thumbnail: nextEnrolledItem.thumbnailUrl || null,
        type: nextEnrolledItem.type as "course" | "career-path",
        careerPathId: nextEnrolledItem.type === "career-path" ? nextEnrolledItem.id : "",
        courseId: nextEnrolledItem.type === "course" ? nextEnrolledItem.id : "",
        firstLessonId: "",
      };
    }
    return null;
  }, [nextCourseInCP, nextEnrolledItem, careerPathId]);

  const score = resultData?.percentage ?? (location.state?.score || 0);
  const passMark = resultData?.quiz?.passingScore || 70;
  const isPassed = resultData?.passFailStatus === "PASS" || score >= passMark;

  const totalQuestions = resultData?.totalQuestions || 10;
  const correctAnswers = resultData?.correctAnswers || Math.round((score / 100) * totalQuestions);
  const incorrectAnswers = totalQuestions - correctAnswers;

  const buildUrl = (path: string, params: Record<string, string>) => {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v) q.append(k, v);
    });
    const qs = q.toString();
    return qs ? `${path}?${qs}` : path;
  };

  const handleViewCertificate = () => {
    if (lessonId) {
      try {
        const key = `completed_lessons_${effectiveCourseId || effectiveCareerPathId || 'default'}`;
        const saved = localStorage.getItem(key);
        const list: any[] = saved ? JSON.parse(saved) : [];
        if (!list.includes(lessonId)) list.push(lessonId);
        if (!list.includes(Number(lessonId))) list.push(Number(lessonId));
        localStorage.setItem(key, JSON.stringify(list));
      } catch (e) {
        console.error("Failed to save lesson completion", e);
      }
      navigate(buildUrl('/course-player', { careerPathId: effectiveCareerPathId, courseId: effectiveCourseId, completedLessonId: lessonId }));
      return;
    }

    if (effectiveCareerPathId && effectiveCourseId && nextCourseInCP) {
      const nextCourseFirstLesson = nextCourseInCP.courseLessons?.[0]?.lesson || nextCourseInCP.courseLessons?.[0];
      if (nextCourseFirstLesson?.id) {
        navigate(buildUrl('/course-player', { careerPathId: effectiveCareerPathId, courseId: nextCourseInCP.id, lessonId: nextCourseFirstLesson.id }));
        return;
      }
    }

    if (effectiveCareerPathId && effectiveCourseId && !nextCourseInCP) {
      // Course in career path finished, and it was the last course in path -> proceed to Career Path assessment
      navigate(`/quiz-start-warning?careerPathId=${effectiveCareerPathId}`);
      return;
    }

    // Career Path Assessment OR Standalone Course Assessment
    if (existingCert) {
      const targetUrl = effectiveCareerPathId
        ? `/certificate-detail?careerPathId=${effectiveCareerPathId}`
        : `/certificate-detail?courseId=${effectiveCourseId}`;
      navigate(targetUrl);
      return;
    }

    setShowNameModal(true);
  };

  const handleRewatchLessons = () => {
    navigate(buildUrl('/course-player', { careerPathId, courseId, lessonId }));
  };

  const handleRetakeAssessment = () => {
    if (lessonId) {
      navigate(buildUrl('/quiz', { careerPathId, courseId, lessonId }));
    } else {
      navigate(buildUrl('/quiz-start-warning', { careerPathId, courseId, retake: 'true' }));
    }
  };

  // Dynamic next course/career path data
  const nextCourseTitle = nextCourseInCP?.language?.title || nextCourseInCP?.defaultContent?.title || nextCourseInCP?.title || "Next Course";
  const nextCourseLessons = nextCourseInCP?.courseLessons?.length || nextCourseInCP?.lessonsCount || 0;
  const nextCourseDuration = nextCourseInCP?.totalDurationMins ? `${Math.floor(nextCourseInCP.totalDurationMins / 60)}h ${nextCourseInCP.totalDurationMins % 60}m` : null;
  const nextCourseLevel = nextCourseInCP?.level || "Practitioner";
  const nextCourseThumbnail = nextCourseInCP?.thumbnailSignedUrl || nextCourseInCP?.thumbnailUrl || null;

  const handleStartNextCourse = () => {
    if (nextCourseInCP) {
      const firstLesson = nextCourseInCP.courseLessons?.[0]?.lesson || nextCourseInCP.courseLessons?.[0];
      navigate(buildUrl('/course-player', {
        careerPathId,
        courseId: nextCourseInCP.id,
        lessonId: firstLesson?.id || ""
      }));
    } else if (careerPathId) {
      navigate(`/career-path-details?id=${careerPathId}`);
    }
  };

  // Assessment label
  const quizTitle = resultData?.quiz?.title || (lessonId ? "Lesson Assessment" : "CDMP Practitioner · Final Assessment");

  // Dynamic course or career path title for display
  const entityTitle =
    courseRes?.title ||
    careerPathRes?.data?.title ||
    (careerPathRes as any)?.title ||
    resultData?.quiz?.course?.title ||
    resultData?.quiz?.careerPath?.title ||
    learningData?.find((item: any) => item.id === courseId || item.id === careerPathId)?.title ||
    resultData?.quiz?.title?.replace(/\s*[-·•]\s*(final\s*)?assessment/i, "") ||
    "CDMP PRACTITIONER";
  const displayEntityTitle = entityTitle.toUpperCase();

  if (isLoading) {
    return <QuizResultSkeleton />;
  }

  if (isPassed) {
    return (
      <div className="min-h-screen 0">
        <div className=" mx-auto space-y-6">

          {/* ── PASS HERO BANNER ──────────────────────────────────────────── */}
          <div className="relative overflow-hidden rounded-[20px] bg-[#dce5d3] px-8 py-12 text-center">
            
            {/* Confetti Animation Styles */}
            <style>{`
              @keyframes confetti-drop-cw {
                0% { top: -10%; transform: rotate(0deg); opacity: 0; }
                10% { opacity: 1; }
                80% { opacity: 1; }
                100% { top: 110%; transform: rotate(360deg); opacity: 0; }
              }
              @keyframes confetti-drop-ccw {
                0% { top: -10%; transform: rotate(0deg); opacity: 0; }
                10% { opacity: 1; }
                80% { opacity: 1; }
                100% { top: 110%; transform: rotate(-360deg); opacity: 0; }
              }
            `}</style>

            {/* Confetti */}
            {CONFETTI_PIECES.map((p, i) => (
              <div
                key={i}
                className="absolute pointer-events-none"
                style={{
                  left: p.left,
                  width: p.w, height: p.h,
                  backgroundColor: p.color,
                  borderRadius: 2,
                  animationName: p.rot > 0 ? 'confetti-drop-cw' : 'confetti-drop-ccw',
                  animationDuration: `${p.dur}s`,
                  animationDelay: `${p.del}s`,
                  animationIterationCount: 'infinite',
                  animationTimingFunction: 'linear',
                  animationFillMode: 'both'
                }}
              />
            ))}

            {/* Stars */}
            <div className="flex justify-center mb-1.5">
              <svg width="230" height="106" viewBox="0 0 230 106" className="block mx-auto" style={{ filter: 'drop-shadow(0 6px 14px #78540047)' }}>
                <defs>
                  <linearGradient id="starGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f7d457" />
                    <stop offset="100%" stopColor="#d59a10" />
                  </linearGradient>
                </defs>
                <g fill="url(#starGrad)" stroke="#bd830a" strokeWidth="0.8" strokeLinejoin="round">
                  <path transform="translate(18.4,34.4) scale(2.3)" d="M12 2l2.9 6.9 7.1.6-5.4 4.7 1.7 7-6.3-3.8-6.3 3.8 1.7-7-5.4-4.7 7.1-.6z"></path>
                  <path transform="translate(126.4,34.4) scale(2.3)" d="M12 2l2.9 6.9 7.1.6-5.4 4.7 1.7 7-6.3-3.8-6.3 3.8 1.7-7-5.4-4.7 7.1-.6z"></path>
                  <path transform="translate(56.8,8.8) scale(3.6)" d="M12 2l2.9 6.9 7.1.6-5.4 4.7 1.7 7-6.3-3.8-6.3 3.8 1.7-7-5.4-4.7 7.1-.6z"></path>
                </g>
              </svg>
            </div>
            <p className="text-[12px] font-bold text-(--c-sage-text) uppercase tracking-[0.2em] mb-3">
              {quizTitle}
            </p>
            <h1 className="text-[36px] md:text-[24px] font-bold tracking-tight text-(--ink) mb-3">
              You passed
            </h1>
            <p className="text-[16px] text-[var(--ink-soft)] max-w-md mx-auto mb-6.5 leading-relaxed">
              Well done. You've met the requirement for this {isCareerPathExam ? "career path" : "course"} and your learning credential is ready.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap justify-center gap-4">
              <button
                onClick={handleViewCertificate}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-7 py-3 rounded-full text-[15px] font-bold shadow-md transition-all cursor-pointer"
              >
                <Award className="w-4 h-4" />
                <span>10. View & Download Certificate</span>
              </button>
              <button
                onClick={() => navigate(`/issue-reporting?courseId=${effectiveCourseId}`)}
                className="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-800 px-7 py-3 rounded-full text-[15px] font-bold border border-slate-300 shadow-sm transition-all cursor-pointer"
              >
                <MessageSquare className="w-4 h-4 text-indigo-600" />
                <span>11. Submit Training Feedback</span>
              </button>
              <button
                onClick={() => navigate('/my-learning')}
                className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-6 py-3 rounded-full text-[15px] font-semibold transition-all cursor-pointer"
              >
                <span>12. My Progress</span>
              </button>
            </div>
          </div>

          {/* ── BOTTOM TWO-COLUMN SECTION ─────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* WHAT'S NEXT */}
            <div className="bg-white rounded-[16px] border border-[var(--line)] p-7 ">
              <p className="text-[12px] font-bold text-(--ink-mute) uppercase tracking-widest mb-2">
                WHAT'S NEXT
              </p>

              <div className="divide-y divide-[#eaeaeb]">
                {/* Step 1: Credential */}
                <div 
                  onClick={handleViewCertificate}
                  className="flex items-start gap-4 pb-5 cursor-pointer hover:opacity-85 transition-opacity"
                >
                  <div className="w-10 h-10 rounded-[10px] bg-[#dce5d3] flex items-center justify-center shrink-0">
                    <Award strokeWidth={1.75} className="w-4.5 h-4.5 text-[#446038]" />
                  </div>
                  <div>
                    <p className="text-[16px] font-bold text-(--ink) leading-snug flex items-center gap-1.5">
                      Your learning credential is ready
                      <ArrowRight className="w-3.5 h-3.5 text-[#446038]" />
                    </p>
                    <p className="text-[14px] text-(--ink-mute) mt-0.5">
                      View and share your proof of completion for this {isCareerPathExam ? "career path" : "course"}.
                    </p>
                  </div>
                </div>

                {/* Step 2: Course marked complete */}
                <div className="flex items-start gap-4 py-5">
                  <div className="w-10 h-10 rounded-[10px] bg-[#dce5d3] flex items-center justify-center shrink-0">
                    <CheckSquare strokeWidth={1.75} className="w-4.5 h-4.5 text-[#446038]" />
                  </div>
                  <div>
                    <p className="text-[16px] font-bold text-(--ink)  leading-snug">
                      {isCareerPathExam ? "Career path marked complete" : "Course marked complete"}
                    </p>
                    <p className="text-[14px] text-(--ink-mute) mt-0.5">
                      {isCareerPathExam
                        ? `${careerPathRes?.data?.title || (careerPathRes?.data as any)?.language?.title || "This career path"} now sits in your Completed list.`
                        : `${resultData?.quiz?.course?.language?.title || resultData?.quiz?.course?.title || "This course"} now sits in your Completed list.`}
                    </p>
                  </div>
                </div>

                {/* Step 3: Continue path (if career path exists) */}
                {effectiveCareerPathId && nextCourseInCP && (
                  <div className="flex items-start gap-4 pt-5">
                    <div className="w-10 h-10 rounded-[10px] bg-[#efebe3] flex items-center justify-center shrink-0">
                      <ArrowRight strokeWidth={1.75} className="w-5 h-5 text-[#404040]" />
                    </div>
                    <div>
                      <p className="text-[15px] font-bold text-[#202020] leading-snug">Continue your path</p>
                      <p className="text-[13px] text-[#6b6b6b] mt-0.5">
                        The next course in {(careerPathRes?.data as any)?.language?.title || careerPathRes?.data?.title || "your path"} is ready when you are.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 pt-5 border-t border-[#eaeaeb] flex items-center gap-2 text-[12px] text-[#6b6b6b]">
                <svg className="w-4 h-4 shrink-0 text-[#6b6b6b]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <circle cx="12" cy="12" r="9.5" strokeWidth="1.5"/>
                  <path strokeLinecap="round" strokeWidth="1.5" d="M12 8v4.5m0 3.5h.01"/>
                </svg>
                Your learning credential and course progress are saved to your account.
              </div>
            </div>

            {/* UP NEXT IN YOUR PATH */}
            <div className="bg-white rounded-[16px] border border-[var(--line)] p-7 ">
              <p className="text-[12px] font-bold text-(--ink-mute) uppercase tracking-widest mb-5">
                UP NEXT IN YOUR PATH
              </p>

              {upNextItem ? (
                <>
                  {/* Thumbnail — image only, no play overlay */}
                  <div className="w-full h-[180px] rounded-[12px] overflow-hidden bg-gray-100 mb-5">
                    {upNextItem.thumbnail ? (
                      <img
                        src={upNextItem.thumbnail}
                        alt={upNextItem.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[var(--c-sage-wash)] to-[var(--c-sage)] flex items-center justify-center">
                        <Play className="w-10 h-10 text-white opacity-60 fill-white" />
                      </div>
                    )}
                  </div>

                  {/* Course info */}
                  <h3 className="text-[16px] font-bold text-(--ink) mb-2 leading-snug">{upNextItem.title}</h3>
                  <div className="flex items-center gap-2 text-[12px] text-(--ink-mute) mb-6">
                    {upNextItem.lessonsCount > 0 && <span>{upNextItem.lessonsCount} {upNextItem.type === 'career-path' ? 'courses' : 'lessons'}</span>}
                    {upNextItem.duration && <><span>·</span><span>{upNextItem.duration}</span></>}
                    {upNextItem.level && <><span>·</span><span>{upNextItem.level}</span></>}
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        if (upNextItem.type === 'career-path') {
                          navigate(`/career-path-details?id=${upNextItem.careerPathId || upNextItem.id}`);
                        } else {
                          navigate(buildUrl('/course-player', {
                            careerPathId: upNextItem.careerPathId,
                            courseId: upNextItem.courseId || upNextItem.id,
                            lessonId: upNextItem.firstLessonId,
                          }));
                        }
                      }}
                      className="flex items-center gap-2 bg-(--hero-bg) hover:bg-(--btn-hover) text-(--ink) px-6 py-2.5 rounded-full text-[13px] font-bold transition-colors border border-[#c99b2e73] shadow-sm"
                    >
                      {upNextItem.type === 'career-path' ? 'View path' : 'Start course'} <ArrowRight className="w-4 h-4" />
                    </button>
                    {upNextItem.careerPathId && (
                      <button
                        onClick={() => navigate(`/career-path-details?id=${upNextItem.careerPathId}`)}
                        className="px-6 py-2.5 rounded-full text-[16px] font-bold text-(--ink) bg-(--paper) border border-(--line-strong) hover:bg-(--bg-alt) transition-colors"
                      >
                        View my path
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-44 text-center gap-3">
                  <ChevronRight className="w-10 h-10 text-[var(--ink-faint)]" />
                  <p className="text-[14px] font-medium text-[var(--ink-mute)]">
                    {user?.firstName 
                      ? `${user.firstName}, you're not enrolled in any more courses or paths.` 
                      : "You're not enrolled in any more courses or paths."}
                  </p>
                  <button
                    onClick={() => navigate('/member-learning')}
                    className="mt-2 px-5 py-2 rounded-full text-[16px] font-bold bg-(--hero-bg) hover:bg-(--btn-hover) text-(--ink) border border-[#c99b2e73] transition-colors"
                  >
                    Browse courses
                  </button>
                </div>
              )}
            </div>
          </div>

        </div>
        
        <CertificateNameChangeModal 
          isOpen={showNameModal} 
          onClose={() => setShowNameModal(false)} 
          courseId={courseId} 
          careerPathId={careerPathId} 
        />
      </div>
    );
  }

  // ── FAILED STATE ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-white px-4 py-16 font-[var(--font-sans)]">
      <div className="max-w-[700px] mx-auto flex flex-col items-center">
        
        {/* Warning Icon */}
        <div className="w-[80px] h-[80px] bg-[#f7d9d4] rounded-full flex items-center justify-center mb-5.5">
          <AlertTriangle className="w-9.5 h-9.5 text-[#c12a1c]" strokeWidth={2} />
        </div>

        {/* Title & Subtitle */}
        <p className="text-[12px] font-bold uppercase tracking-widest text-(--ink-mute) mb-2.5">
          {displayEntityTitle}
        </p>
        <h1 className="text-[33px] font-bold tracking-tight text-(--ink) mb-2.5">
          You failed
        </h1>
        <p className="text-[16px] text-(--ink-soft) text-center max-w-[500px] mb-10 leading-relaxed">
          You didn't pass this attempt, but you're close. Here's a simple path to get ready for the next one. You have 2 of 3 attempts remaining.
        </p>

        {/* Path to Passing Card */}
        <div className="w-full bg-white rounded-[16px] border border-gray-200 shadow-sm overflow-hidden mb-8">
          <div className="h-1 bg-[#c12a1c] w-full"></div>
          <div className="p-6 md:p-8">
            <p className="text-[12px] font-bold text-(--ink-mute) uppercase tracking-widest mb-4 mx-1">YOUR PATH TO PASSING</p>
            
            <div className="flex flex-col gap-1.5">
              {/* Step 1 */}
              <button 
                onClick={() => {
                  let url = '/course-player?';
                  if (courseId) url += `courseId=${courseId}&`;
                  if (careerPathId) url += `careerPathId=${careerPathId}&`;
                  navigate(url.replace(/&$/, ''));
                }}
                className="flex items-center gap-4 p-4 md:p-5 text-left rounded-[14px] hover:bg-[#faeae7] transition-all duration-200 bg-white w-full group cursor-pointer"
              >
                <div className="w-8.5 h-8.5 rounded-full bg-[#f7d9d4] text-[#9e2014] font-bold text-[14px] flex items-center justify-center shrink-0">1</div>
                <div className="flex-1">
                  <h3 className="text-[16px] font-bold text-(--ink) mb-1">Re-watch the key lessons</h3>
                  <p className="text-[14px] text-(--ink-mute) leading-relaxed pr-8">
                    {resultData?.suggestedSteps?.length > 0
                      ? `Refresh ${resultData.suggestedSteps.map((s: any) => s.topic).join(" and ")}, the topics this assessment focuses on.`
                      : "Refresh the core concepts and topics this assessment focuses on."}
                  </p>
                </div>
                <div className="shrink-0 flex items-center pr-2">
                  <Play className="w-4.5 h-4.5 text-(--ink-mute) fill-current group-hover:text-[#9e2014] transition-colors" />
                </div>
              </button>

              {/* Step 2 */}
              <button 
                onClick={() => {
                  if (courseId) {
                    navigate(`/course-details?id=${courseId}`);
                  } else if (careerPathId) {
                    navigate(`/career-path-details?id=${careerPathId}`);
                  }
                }}
                className="flex items-center gap-4 p-4 md:p-5 text-left rounded-[14px] hover:bg-[#faeae7] transition-all duration-200 bg-white w-full group cursor-pointer"
              >
                <div className="w-8.5 h-8.5 rounded-full bg-[#f7d9d4] text-[#9e2014] font-bold text-[14px] flex items-center justify-center shrink-0">2</div>
                <div className="flex-1">
                  <h3 className="text-[16px] font-bold text-(--ink) mb-1">Skim the course glossary</h3>
                  <p className="text-[14px] text-(--ink-mute) leading-relaxed">
                    A quick refresher on the terms used throughout the assessment.
                  </p>
                </div>
                <div className="shrink-0 flex items-center pr-2">
                  <FileText className="w-4.5 h-4.5 text-(--ink-mute) group-hover:text-[#9e2014] transition-colors" />
                </div>
              </button>

              {/* Step 3 */}
              <button 
                onClick={() => navigate(`/quiz?${searchParams.toString()}`)}
                className="flex items-center gap-4 p-4 md:p-5 text-left rounded-[14px] hover:bg-[#faeae7] transition-all duration-200 bg-white w-full group cursor-pointer"
              >
                <div className="w-8.5 h-8.5 rounded-full bg-[#f7d9d4] text-[#9e2014] font-bold text-[14px] flex items-center justify-center shrink-0">3</div>
                <div className="flex-1">
                  <h3 className="text-[16px] font-bold text-(--ink) mb-1">Retake the assessment</h3>
                  <p className="text-[14px] text-(--ink-mute) leading-relaxed">
                    When you feel ready, take it again. Your progress is saved either way.
                  </p>
                </div>
                <div className="shrink-0 flex items-center pr-2">
                  <RefreshCw className="w-4.5 h-4.5 text-(--ink-mute) group-hover:text-[#9e2014] transition-colors" />
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <button
            onClick={handleRewatchLessons}
            className="flex items-center justify-center gap-2 px-8 py-3.5 bg-(--btn) hover:bg-(--btn-hover) text-(--ink) border border-[#c99b2e8c] rounded-full font-bold text-[16px] transition-colors"
          >
            <Play className="w-4 h-4 fill-gray-900" />
            Start with lesson review
          </button>
          <button
            onClick={handleRetakeAssessment}
            className="flex items-center justify-center px-8 py-3.5 bg-white border border-(--line-strong) hover:bg-gray-50 text-(--ink) rounded-full font-bold text-[16px] transition-colors"
          >
            Retake assessment now
          </button>
        </div>

        <p className="text-[12px] text-[#5c5c5c] text-center">
          Your lesson progress is saved. A learning credential is issued once you pass.
        </p>

      </div>
      
      <CertificateNameChangeModal 
        isOpen={showNameModal} 
        onClose={() => setShowNameModal(false)} 
        courseId={effectiveCourseId} 
        careerPathId={effectiveCareerPathId} 
      />
    </div>
  );
};

export default QuizResult;
