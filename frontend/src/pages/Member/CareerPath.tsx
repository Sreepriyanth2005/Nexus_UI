import React, { useState } from "react";
import { useNavigate } from "react-router";
import { useProfile } from "../../hooks/profile/useProfile";
import { useMemberLearningCourses } from "../../hooks/member-learning/memberLearning";
import { CheckSquare, ArrowRight, ChevronLeft, ChevronRight, Award, List, Check, Lock, Play, BookOpen, Clock, ShieldCheck, Sparkles } from "lucide-react";
import { Skeleton } from "../../components/ui/Skeleton/Skeleton";
import { useQuery } from "@tanstack/react-query";
import { getCareerPathApi } from "../../core/api/career-path/career-path.api";
import { useEnrolledCourses } from "../../hooks/course-details/courseDetails";

const formatDuration = (mins: number): string => {
  if (!mins || mins <= 0) return "0 mins";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) {
    return `${m} min${m === 1 ? "" : "s"}`;
  }
  if (m === 0) {
    return `${h} hr${h === 1 ? "" : "s"}`;
  }
  return `${h} hr${h === 1 ? "" : "s"} ${m} min${m === 1 ? "" : "s"}`;
};

const parseLearningOutcomes = (val: any): string[] => {
  if (!val) return [];
  if (Array.isArray(val)) {
    const list: string[] = [];
    val.forEach((item) => {
      if (typeof item === "string") {
        const trimmed = item.trim();
        if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
          try {
            const innerParsed = JSON.parse(trimmed);
            if (Array.isArray(innerParsed)) {
              list.push(...parseLearningOutcomes(innerParsed));
              return;
            }
          } catch {}
        }
        const clean = trimmed.replace(/<[^>]*>/g, "").replace(/^[-*•\d.]+\s*/, "").trim();
        if (clean) list.push(clean);
      } else if (item && typeof item === "object") {
        const raw = item.title || item.description || item.outcome || item.name || item.text || item.value || "";
        if (raw && typeof raw === "string") {
          const clean = raw.replace(/<[^>]*>/g, "").replace(/^[-*•\d.]+\s*/, "").trim();
          if (clean) list.push(clean);
        }
      }
    });
    return list.filter(Boolean);
  }
  if (typeof val === "string") {
    const trimmed = val.trim();
    if (!trimmed) return [];
    if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
      try {
        const parsed = JSON.parse(trimmed);
        return parseLearningOutcomes(parsed);
      } catch {}
    }
    const noHtml = trimmed.replace(/<[^>]*>/g, "");
    return noHtml
      .split(/\r?\n/)
      .map((s) => s.trim().replace(/^[-*•\d.]+\s*/, ""))
      .filter(Boolean);
  }
  if (typeof val === "object") {
    if (val.learningOutcomes || val.learning_outcomes || val.outcomes) {
      return parseLearningOutcomes(val.learningOutcomes || val.learning_outcomes || val.outcomes);
    }
    const raw = val.title || val.description || val.outcome || val.name || val.text || val.value || "";
    if (raw && typeof raw === "string") {
      const clean = raw.replace(/<[^>]*>/g, "").replace(/^[-*•\d.]+\s*/, "").trim();
      return clean ? [clean] : [];
    }
  }
  return [];
};

const parseWhatIsIncluded = (val: any): string[] => {
  if (!val) return [];
  if (Array.isArray(val)) {
    const list: string[] = [];
    val.forEach((item) => {
      if (typeof item === "string") {
        const trimmed = item.trim();
        if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
          try {
            const innerParsed = JSON.parse(trimmed);
            if (Array.isArray(innerParsed)) {
              list.push(...parseWhatIsIncluded(innerParsed));
              return;
            }
          } catch {}
        }
        const clean = trimmed.replace(/<[^>]*>/g, "").replace(/^[-*•\d.]+\s*/, "").trim();
        if (clean) list.push(clean);
      } else if (item && typeof item === "object") {
        const raw = item.title || item.description || item.name || item.text || item.value || item.feature || item.label || "";
        if (raw && typeof raw === "string") {
          const clean = raw.replace(/<[^>]*>/g, "").replace(/^[-*•\d.]+\s*/, "").trim();
          if (clean) list.push(clean);
        }
      }
    });
    return list.filter(Boolean);
  }
  if (typeof val === "string") {
    const trimmed = val.trim();
    if (!trimmed) return [];
    if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
      try {
        const parsed = JSON.parse(trimmed);
        return parseWhatIsIncluded(parsed);
      } catch {}
    }
    const noHtml = trimmed.replace(/<[^>]*>/g, "");
    return noHtml
      .split(/\r?\n/)
      .map((s) => s.trim().replace(/^[-*•\d.]+\s*/, ""))
      .filter(Boolean);
  }
  if (typeof val === "object") {
    if (val.whatIsIncluded || val.what_is_included || val.included) {
      return parseWhatIsIncluded(val.whatIsIncluded || val.what_is_included || val.included);
    }
    const raw = val.title || val.description || val.name || val.text || val.value || val.feature || val.label || "";
    if (raw && typeof raw === "string") {
      const clean = raw.replace(/<[^>]*>/g, "").replace(/^[-*•\d.]+\s*/, "").trim();
      return clean ? [clean] : [];
    }
  }
  return [];
};

const getAssetImageUrl = (ast: any): string | null => {
  if (!ast) return null;
  if (typeof ast === "string") {
    const trimmed = ast.trim();
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.startsWith("/") || trimmed.startsWith("data:image")) {
      return trimmed;
    }
    return null;
  }
  if (typeof ast === "object") {
    if (ast.signedUrl && typeof ast.signedUrl === "string") return ast.signedUrl;
    if (ast.fileUrl && typeof ast.fileUrl === "string") return ast.fileUrl;
    if (ast.url && typeof ast.url === "string") return ast.url;
    if (ast.thumbnailUrl && typeof ast.thumbnailUrl === "string") return ast.thumbnailUrl;
    if (ast.coverImageUrl && typeof ast.coverImageUrl === "string") return ast.coverImageUrl;
    if (ast.gcsKey && ast.bucketName) return `https://storage.googleapis.com/${ast.bucketName}/${ast.gcsKey}`;
  }
  return null;
};

const CareerPath = () => {
  const navigate = useNavigate();

  React.useEffect(() => {
    // Member flow is strictly Course-driven; redirect to Assigned Courses
    navigate("/my-learning", { replace: true });
  }, [navigate]);
  const { profile } = useProfile();
  const [expandedPath, setExpandedPath] = useState<string | null>(null);
  const hasAutoSelected = React.useRef(false);
  const { rawData: allLearnings, isLoading } = useMemberLearningCourses(
    profile?.id || "",
    "RAW_DATA_V2",
    {},
    "",
    "",
    1,
    9999,
    !!profile?.id
  );

  // Fetch detailed data for expanded path to get nested courses
  const { data: expandedPathData } = useQuery({
    queryKey: ["career-path-detail", expandedPath],
    queryFn: () => getCareerPathApi(expandedPath!),
    enabled: !!expandedPath,
    staleTime: 0,
    refetchOnMount: "always",
  });

  // Fetch enrolled courses to accurately track progress & completion
  const { data: enrolledCoursesList } = useEnrolledCourses(!!profile?.id);

  // Filter and prepare career paths
  const allPaths: any[] = (allLearnings || []).filter((item: any) => item.type === "career-path");
  const enrolledPaths: any[] = allPaths.filter((p: any) => p.isEnrolled);
  const notEnrolledPaths: any[] = allPaths.filter((p: any) => !p.isEnrolled).slice(0, 3);

  React.useEffect(() => {
    if (enrolledPaths.length > 0 && !hasAutoSelected.current) {
      setExpandedPath(enrolledPaths[0].id);
      hasAutoSelected.current = true;
    }
  }, [enrolledPaths]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#fafafa] p-6 sm:p-8 space-y-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header Skeleton */}
          <div className="space-y-3">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-9 w-64" />
            <Skeleton className="h-4 w-96 max-w-full" />
          </div>

          {/* Enrolled Paths Section Skeleton */}
          <div className="space-y-4">
            <Skeleton className="h-5 w-40" />
            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="space-y-2">
                  <Skeleton className="h-6 w-56" />
                  <Skeleton className="h-4 w-40" />
                </div>
                <Skeleton className="h-10 w-32 rounded-full" />
              </div>
              <Skeleton className="h-2.5 w-full rounded-full" />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-gray-100">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-3 bg-gray-50/70 rounded-xl space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Explore Other Paths Grid Skeleton */}
          <div className="space-y-4">
            <Skeleton className="h-5 w-44" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((k) => (
                <div key={k} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-4">
                  <Skeleton className="h-40 w-full rounded-xl" />
                  <Skeleton className="h-5 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                  <div className="pt-3 border-t border-gray-100 flex justify-between items-center">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-8 w-24 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Helper function to render a course in the course chain table
  const renderCourseRow = (course: any, idx: number, totalCourses: number, isUnlocked: boolean = false) => {
    // Determine status based on progress
    const cProgress = Number(course.progress) || 0;
    const isCompleted = Boolean(course.isCompleted || cProgress >= 100 || course.status === "COMPLETED");
    const canAccess = isCompleted || cProgress > 0 || course.status === "IN_PROGRESS" || idx === 0 || isUnlocked;

    const targetCourseId = course.id || course.courseId;
    const firstLesson = course.courseLessons?.[0]?.lesson || course.courseLessons?.[0] || course.lessons?.[0];
    const lessonParam = firstLesson?.id ? `&lessonId=${firstLesson.id}` : "";

    const handleStartCourse = () => {
      if (!targetCourseId || !canAccess) return;
      navigate(`/course-player?careerPathId=${expandedPath}&courseId=${targetCourseId}${lessonParam}`);
    };

    let actionBtn = (
      <button className="text-[11px] font-bold px-5 py-2 rounded-full border border-gray-200 text-gray-400 bg-gray-50 cursor-not-allowed" disabled>
        Locked
      </button>
    );

    if (isCompleted) {
      actionBtn = (
        <button 
          onClick={(e) => { e.stopPropagation(); handleStartCourse(); }}
          className="text-[11px] font-bold px-5 py-2 rounded-full border border-gray-300 text-gray-900 bg-white hover:bg-gray-50 transition-all cursor-pointer shadow-xs active:scale-95"
        >
          Review
        </button>
      );
    } else if (canAccess) {
      actionBtn = (
        <button 
          onClick={(e) => { e.stopPropagation(); handleStartCourse(); }}
          className="text-[11px] font-bold px-5 py-2 rounded-full border border-[#ffe88b] text-gray-900 bg-[#fff7d6] hover:bg-[#ffe88b] transition-all cursor-pointer shadow-xs active:scale-95"
        >
          {cProgress > 0 ? "Resume" : "Start"}
        </button>
      );
    }

    const courseMins = Number(course.duration) || Number(course.totalDurationMins) || Number(course.estimatedDuration) || 0;
    const durationText = formatDuration(courseMins);

    // Dynamic lesson count
    const lessonCount = 
      (Array.isArray(course.courseLessons) ? course.courseLessons.length : undefined) ??
      (Array.isArray(course.lessons) ? course.lessons.length : undefined) ??
      course.lessonsCount ??
      course.totalLessons ??
      course._count?.courseLessons ??
      0;
    const materialCount = `${lessonCount} lesson${lessonCount === 1 ? "" : "s"}`;

    const thumbUrl = 
      getAssetImageUrl(course.thumbnailUrl) ||
      getAssetImageUrl(course.thumbnailAsset) ||
      getAssetImageUrl(course.coverImageUrl) ||
      getAssetImageUrl(course.coverImageAsset) ||
      getAssetImageUrl(course.thumbnail) ||
      null;

    return (
      <div 
        key={course.id || idx} 
        onClick={() => { if (canAccess) handleStartCourse(); }}
        className={`flex items-center gap-4 py-4 border-b border-gray-100 last:border-0 px-4 -mx-4 transition-colors ${
          canAccess ? "cursor-pointer hover:bg-gray-50/70" : "opacity-60 cursor-not-allowed"
        }`}
      >
        {/* Step Badge / Circle */}
        <div className="w-8 flex justify-center shrink-0">
          {isCompleted ? (
            <div className="w-6 h-6 rounded-full bg-[#6cb356] text-white flex items-center justify-center shadow-xs">
              <Check className="w-3.5 h-3.5 stroke-[3]" />
            </div>
          ) : canAccess ? (
            <div className="w-6 h-6 rounded-full border-2 border-[#e6b13e] text-[#e6b13e] flex items-center justify-center text-[10px] font-bold bg-white shadow-2xs">
              {idx + 1}
            </div>
          ) : (
            <div className="w-6 h-6 rounded-full border-2 border-gray-200 text-gray-300 flex items-center justify-center bg-gray-50/50">
              <Lock className="w-2.5 h-2.5" />
            </div>
          )}
        </div>

        {/* Course Info */}
        <div className="flex items-center gap-3 w-1/3">
          <div className="w-12 h-8 bg-gray-100 rounded overflow-hidden shrink-0 border border-gray-200/60 flex items-center justify-center relative">
            {thumbUrl ? (
              <img 
                src={thumbUrl} 
                className="w-full h-full object-cover" 
                alt="" 
                onError={(e) => { 
                  (e.target as HTMLElement).style.display = 'none';
                  const fallback = (e.target as HTMLElement).parentElement?.querySelector('.course-fallback-box');
                  if (fallback) (fallback as HTMLElement).classList.remove('hidden');
                }} 
              />
            ) : null}
            <span className={`course-fallback-box text-[10px] font-bold text-gray-400 ${thumbUrl ? "hidden" : "flex"} items-center justify-center`}>
              {(course.title || "C").slice(0, 2).toUpperCase()}
            </span>
          </div>
          <span className={`text-xs font-bold leading-tight ${canAccess ? "text-gray-900" : "text-gray-500"}`}>
            {course.title || "Course " + (idx + 1)}
          </span>
        </div>

        {/* Content Details */}
        <div className="w-1/4 text-[11px] font-medium text-gray-500">
          {materialCount} - {durationText}
        </div>

        {/* Status Pill */}
        <div className="w-1/4">
          {isCompleted ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-[#eef6ec] text-[#6cb356] border border-[#d4edda]">
              <Check className="w-3 h-3 stroke-[2.5]" /> Completed
            </span>
          ) : cProgress > 0 ? (
            <div className="flex flex-col gap-1.5 w-24">
              <span className="text-[10px] font-bold text-gray-700">{Math.round(cProgress)}%</span>
              <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                <div className="bg-[#e0b04a] h-1.5 rounded-full" style={{ width: `${cProgress}%` }} />
              </div>
            </div>
          ) : canAccess ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold border border-gray-900 text-gray-900 bg-white shadow-2xs">
              <Lock className="w-2.5 h-2.5 text-gray-900" /> Start
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-gray-100 text-gray-400">
              <Lock className="w-2.5 h-2.5" /> Locked
            </span>
          )}
        </div>

        {/* Action Button */}
        <div className="flex-1 text-right">
          {actionBtn}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen  font-sans text-gray-900 pb-20">

      {/* HEADER SECTION */}
      <div className="bg-[#ffffff] ">
        <div className=" mx-auto  mb-4.5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-[24px] font-bold tracking-tight text-(--ink)">Career paths</h1>
            <p className="mt-2 text-sm text-(--ink-soft) max-w-xl">
              Stack courses into a recognised, Nexus-governed career path. Track progress and pick up exactly where you left off.
            </p>
          </div>
          <button
            onClick={() => navigate('/member-learning')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full  border border-(--line-strong) bg-(--card) hover:bg-(--card-2) hover:border-(--line-weak) text-[16px] font-semibold text-(--ink) "
          >
            <List className="w-[15px] h-[15px]" />
            Browse all paths
          </button>
        </div>
      </div>

      <div>

        {/* YOUR PATHS */}
        <div className="bg-(--card-2) border border-(--line) rounded-(--r-lg) shadow-(--shadow-xs) mt-[10px] mb-[28px] pt-[20px] px-[22px] pb-[24px]">
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-[16px] font-semibold text-[#141414]">Your paths</h2>
            <span className="w-6 h-6 rounded-full bg-(--card-2) border border-(--line) text-xs font-bold text-(--muted) flex items-center justify-center">
              {enrolledPaths.length}
            </span>
          </div>
          <p className="text-[12px] text-[#5c5c5c] mb-8">Your active tracks. Pick one to see its course chain and continue where you left off.</p>

          {enrolledPaths.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {enrolledPaths.map((path: any) => {
                const isExpanded = expandedPath === path.id;
                const pathProgress = path.progress || 0;

                return (
                  <div key={path.id} className="flex flex-col">
                    <div
                      onClick={() => setExpandedPath(isExpanded ? null : path.id)}
                      className={`bg-white rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 flex flex-col h-full hover:-translate-y-1 hover:shadow-md hover:ring-2 hover:ring-[#c69a31] hover:border-transparent ${isExpanded ? 'ring-2 ring-[#c69a31] shadow-md border-transparent' : 'border border-gray-200 shadow-sm'
                        }`}
                    >
                      <div className="h-[140px] bg-gray-100 relative overflow-hidden">
                        {(() => {
                          const thumbUrl = path.thumbnailAsset?.signedUrl || path.thumbnailAsset?.url || path.thumbnailAsset?.fileUrl || path.thumbnailUrl || path.coverImageUrl;
                          return thumbUrl ? (
                            <img src={thumbUrl} className="w-full h-full object-cover" alt="" />
                          ) : null;
                        })()}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                        <div className="absolute top-4 left-4">
                          <span className="bg-gray-600/80 backdrop-blur-md text-white text-[9px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 uppercase tracking-wider">
                            <Award className="w-3 h-3 text-white" /> PATH
                          </span>
                        </div>
                        {pathProgress === 100 && (
                          <div className="absolute top-4 right-4">
                            <span className="bg-[#6b9d79] text-white text-[9px] font-bold px-2 py-1 rounded flex items-center gap-1 uppercase tracking-wider shadow-sm">
                              <CheckSquare className="w-3 h-3" /> COMPLETE
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="p-5 flex flex-col flex-1">
                        <span className="text-[9px] font-bold text-[#b88c3a] uppercase tracking-wider mb-2 line-clamp-1">{(path.category && path.category !== "Uncategorized") ? path.category : "Career Path"}</span>
                        <h3 className="text-[15px] font-bold text-gray-900 leading-tight mb-2 line-clamp-2 flex-1">{path.title}</h3>
                        <p className="text-[11px] text-gray-500 font-medium mb-5">
                          {path.lessonsCount || path.coursesCount || 0} courses · {formatDuration(Number(path.totalDurationMins) || Number(path.duration) || Number(path.estimatedDuration) || 0)}
                        </p>

                        <div className="flex items-center gap-3">
                          <span className="text-[12px] font-extrabold text-gray-900 min-w-[32px]">{Math.round(pathProgress)}%</span>
                          <div className="flex-1 bg-gray-200 h-1.5 rounded-full overflow-hidden">
                            <div className={pathProgress === 100 ? "bg-[#6b9d79] h-1.5 rounded-full" : "bg-[#c69a31] h-1.5 rounded-full"} style={{ width: `${pathProgress}%` }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-sm text-[#5c5c5c] py-10 text-center bg-white rounded-2xl border border-gray-100 shadow-sm">
              You haven't enrolled in any paths yet.
            </div>
          )}
        </div>

        {/* EXPANDED VIEW */}
        {expandedPath && enrolledPaths.find((p: any) => p.id === expandedPath) && (() => {
          const selectedPath = enrolledPaths.find((p: any) => p.id === expandedPath);
          const pathDetail = expandedPathData?.data as any;
          const rawCourses: any[] = pathDetail?.courses || (pathDetail as any)?.careerPathCourses || selectedPath?.careerPathCourses || selectedPath?.courses || [];

          // Calculate total duration in minutes by summing present courses in this career path
          const calculatedDurationMins = rawCourses.reduce((sum: number, c: any) => {
            const courseId = c.courseId || c.course?.id || c.id;
            const mapped = allLearnings?.find((item: any) => item.id === courseId);
            const courseObj = mapped || c.course || c;
            const mins = Number(courseObj?.duration) || Number(courseObj?.totalDurationMins) || Number(courseObj?.estimatedDuration) || 0;
            return sum + mins;
          }, 0);

          const finalDurationMins = calculatedDurationMins > 0
            ? calculatedDurationMins
            : (Number(pathDetail?.estimatedDuration) || Number(pathDetail?.duration) || Number(selectedPath?.totalDurationMins) || Number(selectedPath?.duration) || Number(selectedPath?.estimatedDuration) || 0);

          const selectedPathDuration = formatDuration(finalDurationMins);
          const coursesCount = rawCourses.length > 0 ? rawCourses.length : (selectedPath?.lessonsCount || selectedPath?.coursesCount || 0);

          // Resolve display category cleanly without "Uncategorized"
          const rawCategory = 
            pathDetail?.category?.name ||
            (typeof pathDetail?.category === "string" ? pathDetail.category : undefined) ||
            pathDetail?.subject?.name ||
            (selectedPath?.category && selectedPath.category !== "Uncategorized" ? selectedPath.category : undefined) ||
            selectedPath?.category?.name ||
            selectedPath?.subjectNames?.[0];

          const pathCategory = (rawCategory && rawCategory !== "Uncategorized") ? rawCategory : "Career Path";

          // Find first uncompleted or active course to resume
          const firstIncomplete = rawCourses.find((c: any) => {
            const courseObj = c.course || c;
            const cid = c.courseId || courseObj?.id || c.id;
            const mapped = allLearnings?.find((item: any) => 
              item.id === cid || 
              item.courseId === cid ||
              (item.title && courseObj?.title && item.title.trim().toLowerCase() === courseObj.title.trim().toLowerCase())
            );
            const enrolledMatch = (enrolledCoursesList as any[])?.find((ec: any) => 
              ec.courseId === cid || 
              ec.id === cid || 
              ec.course?.id === cid ||
              (ec.title && courseObj?.title && ec.title.trim().toLowerCase() === courseObj.title.trim().toLowerCase())
            );
            const prog = Number(
              courseObj?.progress ?? 
              c.progress ?? 
              mapped?.progress ?? 
              enrolledMatch?.progress?.progress ?? 
              0
            );
            const isComp = Boolean(
              courseObj?.isCompleted ||
              c.isCompleted ||
              courseObj?.status === "COMPLETED" ||
              c.status === "COMPLETED" ||
              enrolledMatch?.progress?.status === "COMPLETED" ||
              enrolledMatch?.hasCertificate ||
              mapped?.statusText === "Completed" ||
              (mapped as any)?.isCompleted ||
              prog >= 100
            );
            return !isComp;
          });
          const activeResumeCourse = firstIncomplete || rawCourses[0];
          const activeResumeCourseId = activeResumeCourse?.courseId || activeResumeCourse?.course?.id || activeResumeCourse?.id;

          // Get learning outcomes strictly from the selected career path only (not from mapped courses or lessons)
          const displayOutcomes = parseLearningOutcomes(
            pathDetail?.learningOutcomes ||
            pathDetail?.learning_outcomes ||
            pathDetail?.outcomes ||
            selectedPath?.learningOutcomes ||
            (selectedPath as any)?.learning_outcomes
          );

          // Get what is included strictly from the selected career path only
          const displayIncluded = parseWhatIsIncluded(
            pathDetail?.whatIsIncluded ||
            pathDetail?.what_is_included ||
            selectedPath?.whatIsIncluded ||
            (selectedPath as any)?.what_is_included
          );

          const thumbUrl = 
            getAssetImageUrl(pathDetail?.coverImageAsset) ||
            getAssetImageUrl(pathDetail?.thumbnailAsset) ||
            getAssetImageUrl(selectedPath?.coverImageAsset) ||
            getAssetImageUrl(selectedPath?.thumbnailAsset) ||
            getAssetImageUrl(selectedPath?.thumbnailUrl) ||
            getAssetImageUrl(selectedPath?.coverImageUrl) ||
            getAssetImageUrl(pathDetail?.coverImageUrl) ||
            getAssetImageUrl(pathDetail?.thumbnailUrl) ||
            null;
          const fullDesc = pathDetail?.fullDescription || pathDetail?.description || selectedPath?.description || "Complete the courses in order to master the domain.";
          
          // Calculate overall career path progress accurately based on completed courses
          const completedCoursesCount = rawCourses.filter((c: any) => {
            const courseObj = c.course || c;
            const cid = c.courseId || courseObj?.id || c.id;
            const mapped = allLearnings?.find((item: any) => item.id === cid || item.courseId === cid);
            const enrolledMatch = (enrolledCoursesList as any[])?.find((ec: any) => ec.courseId === cid || ec.id === cid || ec.course?.id === cid);
            const prog = Number(courseObj?.progress ?? c.progress ?? mapped?.progress ?? enrolledMatch?.progress?.progress ?? 0);
            return Boolean(
              courseObj?.isCompleted ||
              c.isCompleted ||
              courseObj?.status === "COMPLETED" ||
              c.status === "COMPLETED" ||
              enrolledMatch?.progress?.status === "COMPLETED" ||
              enrolledMatch?.hasCertificate ||
              mapped?.statusText === "Completed" ||
              (mapped as any)?.isCompleted ||
              prog >= 100
            );
          }).length;
          const dynamicPathProgress = rawCourses.length > 0 ? Math.round((completedCoursesCount / rawCourses.length) * 100) : 0;
          const pathProgress = Math.max(
            Number(pathDetail?.progress || 0),
            Number(selectedPath?.progress || 0),
            dynamicPathProgress
          );

          return (
            <div className="flex flex-col lg:flex-row gap-6 animate-in slide-in-from-top-4 fade-in duration-300">

              {/* Left Side: Overview & Course Chain */}
              <div className="flex-1 flex flex-col gap-6">

                {/* OVERVIEW SECTION */}
                <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-sm">
                  <span className="text-[10px] font-bold text-[#b88c3a] uppercase tracking-wider mb-2 block">
                    {pathCategory}
                  </span>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{selectedPath?.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed mb-6">{fullDesc}</p>

                  <div className="text-[11px] font-medium text-gray-500 flex items-center gap-2 pb-6 border-b border-gray-100">
                    <span>{coursesCount} course{coursesCount === 1 ? "" : "s"}</span>
                    <span>·</span>
                    <span>{selectedPathDuration}</span>
                    <span>·</span>
                    <span>Practitioner to Expert</span>
                  </div>

                  <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* What you'll gain */}
                    <div>
                      <h4 className="text-[15px] font-bold text-gray-900 mb-4">What you'll gain</h4>
                      {displayOutcomes.length > 0 ? (
                        <ul className="space-y-3">
                          {displayOutcomes.map((outcomeText: string, idx: number) => (
                            <li key={idx} className="flex items-start gap-3">
                              <div className="w-4 h-4 rounded-full bg-[#eef6ec] text-[#6cb356] flex items-center justify-center shrink-0 mt-0.5">
                                <CheckSquare className="w-2.5 h-2.5" />
                              </div>
                              <span className="text-xs text-gray-600 leading-relaxed">{outcomeText}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-xs text-gray-400 italic">No specific learning outcomes listed for this career path yet.</p>
                      )}
                    </div>

                    {/* What is included */}
                    <div>
                      <h4 className="text-[15px] font-bold text-gray-900 mb-4">What is included</h4>
                      {displayIncluded.length > 0 ? (
                        <ul className="space-y-3">
                          {displayIncluded.map((itemText: string, idx: number) => (
                            <li key={idx} className="flex items-start gap-3">
                              <div className="w-4 h-4 rounded-full bg-[#fdf5d3] text-[#b88c3a] flex items-center justify-center shrink-0 mt-0.5">
                                <Award className="w-2.5 h-2.5" />
                              </div>
                              <span className="text-xs text-gray-600 leading-relaxed">{itemText}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-xs text-gray-400 italic">No specific inclusions listed for this career path yet.</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* COURSE CHAIN SECTION */}
                <div>
                  <div className="flex items-center justify-between mb-4 px-2">
                    <h4 className="text-sm font-bold text-gray-900">{pathCategory} · Course chain</h4>
                    <span className="text-[10px] text-gray-400 hidden sm:block">Complete courses in order to unlock the next</span>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300">
                    <div className="overflow-x-auto">
                      <div className="min-w-[700px]">
                        <div className="flex text-[9px] font-bold text-gray-400 uppercase tracking-wider px-6 py-4 border-b border-gray-100">
                          <div className="w-8"></div>
                          <div className="w-1/3 min-w-[200px]">COURSE</div>
                          <div className="w-1/4 min-w-[120px]">CONTENT</div>
                          <div className="w-1/4 min-w-[150px]">STATUS</div>
                          <div className="flex-1 text-right">ACTION</div>
                        </div>

                        <div className="px-6 pb-2">
                          {rawCourses.length === 0 ? (
                            <div className="text-sm text-gray-500 py-6 text-center">No courses mapped to this path yet.</div>
                          ) : (() => {
                            let previousCourseCompleted = true; // First course unlocked by default
                            return rawCourses.map((c: any, i: number, arr: any[]) => {
                              const courseObj = c.course || c;
                              const courseId = c.courseId || courseObj?.id || c.id;
                              const mappedCourse: any = allLearnings?.find((item: any) => 
                                item.id === courseId || 
                                item.courseId === courseId ||
                                (item.title && courseObj?.title && item.title.trim().toLowerCase() === courseObj.title.trim().toLowerCase())
                              );
                              const enrolledMatch: any = (enrolledCoursesList as any[])?.find((ec: any) => 
                                ec.courseId === courseId || 
                                ec.id === courseId || 
                                ec.course?.id === courseId ||
                                (ec.title && courseObj?.title && ec.title.trim().toLowerCase() === courseObj.title.trim().toLowerCase())
                              );

                              // Resolve lessons list & count
                              const courseLessons = courseObj?.courseLessons || c.courseLessons || mappedCourse?.courseLessons || [];
                              const lessonsCount = (Array.isArray(courseLessons) && courseLessons.length > 0)
                                ? courseLessons.length
                                : (mappedCourse?.lessonsCount || courseObj?.lessonsCount || courseObj?.totalLessons || 0);

                              // Resolve thumbnail URL safely without undefined overwrite
                              const thumb = 
                                getAssetImageUrl(courseObj?.thumbnailUrl) ||
                                getAssetImageUrl(courseObj?.thumbnailAsset) ||
                                getAssetImageUrl(mappedCourse?.thumbnailUrl) ||
                                getAssetImageUrl(mappedCourse?.thumbnailAsset) ||
                                getAssetImageUrl(courseObj?.coverImageUrl) ||
                                getAssetImageUrl(courseObj?.coverImageAsset) ||
                                getAssetImageUrl(c.thumbnailUrl) ||
                                getAssetImageUrl(c.thumbnailAsset) ||
                                getAssetImageUrl(c.coverImageUrl) ||
                                getAssetImageUrl(courseObj?.thumbnail) ||
                                getAssetImageUrl(c.thumbnail) ||
                                null;

                              // Check localStorage for completed lessons
                              let isLocalStorageCompleted = false;
                              try {
                                const keys = [
                                  `completed_lessons_${profile?.id || 'anon'}_${courseId}`,
                                  `completed_lessons_${courseId}`,
                                  `completed_lessons_${profile?.id || 'anon'}_${expandedPath}`,
                                  `completed_lessons_${expandedPath}`,
                                ];
                                for (const k of keys) {
                                  const saved = localStorage.getItem(k);
                                  if (saved) {
                                    const parsed = JSON.parse(saved);
                                    if (Array.isArray(parsed) && lessonsCount > 0 && parsed.length >= lessonsCount) {
                                      isLocalStorageCompleted = true;
                                      break;
                                    }
                                  }
                                }
                              } catch {}

                              // Calculate progress and completion
                              const cProgress = Number(
                                courseObj?.progress ?? 
                                c.progress ?? 
                                mappedCourse?.progress ?? 
                                enrolledMatch?.progress?.progress ?? 
                                0
                              );
                              const isCompleted = Boolean(
                                courseObj?.isCompleted ||
                                c.isCompleted ||
                                courseObj?.status === "COMPLETED" ||
                                c.status === "COMPLETED" ||
                                enrolledMatch?.progress?.status === "COMPLETED" ||
                                enrolledMatch?.hasCertificate ||
                                mappedCourse?.statusText === "Completed" ||
                                mappedCourse?.isCompleted ||
                                cProgress >= 100 ||
                                isLocalStorageCompleted
                              );

                              const isUnlocked = i === 0 || previousCourseCompleted || cProgress > 0 || isCompleted;
                              previousCourseCompleted = isCompleted;

                              const displayCourse = {
                                ...courseObj,
                                ...(mappedCourse || {}),
                                id: courseId,
                                title: mappedCourse?.title || courseObj?.title || c.title,
                                progress: cProgress,
                                isCompleted,
                                status: isCompleted ? "COMPLETED" : (cProgress > 0 ? "IN_PROGRESS" : "NOT_STARTED"),
                                thumbnailUrl: thumb,
                                thumbnailAsset: courseObj?.thumbnailAsset || mappedCourse?.thumbnailAsset,
                                courseLessons: courseLessons,
                                lessonsCount: lessonsCount,
                                duration: Number(courseObj?.duration) || Number(mappedCourse?.totalDurationMins) || Number(courseObj?.estimatedDuration) || Number(mappedCourse?.duration) || 0,
                              };

                              return renderCourseRow(displayCourse, i, arr.length, isUnlocked);
                            });
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Side: Floating Resume Card */}
              <div className="w-full lg:w-[300px] shrink-0">
                <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 sticky top-8">
                  <div className="h-[140px] bg-gray-100 relative">
                    {thumbUrl ? (
                      <img src={thumbUrl} className="w-full h-full object-cover" alt="" />
                    ) : null}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  </div>
                  <div className="p-6">
                    <span className="text-[10px] font-bold text-[#b88c3a] uppercase tracking-wider mb-1.5 block">
                      {pathCategory}
                    </span>
                    <h4 className="text-[15px] font-bold text-gray-900 leading-tight mb-3">
                      {selectedPath?.title}
                    </h4>
                    <p className="text-[11px] text-gray-500 font-medium mb-5 pb-5 border-b border-gray-100">
                      {coursesCount} courses · {selectedPathDuration} · Practitioner to Expert
                    </p>

                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-2xl font-bold text-gray-900 leading-none">{pathProgress}%</span>
                      <span className="text-xs font-medium text-gray-500">complete</span>
                    </div>

                    <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden mb-6">
                      <div className="bg-[#e0b04a] h-1.5 rounded-full" style={{ width: `${pathProgress}%` }} />
                    </div>

                    <button
                      onClick={() => {
                        const targetCourseId = activeResumeCourseId || rawCourses[0]?.courseId || rawCourses[0]?.course?.id || rawCourses[0]?.id;
                        navigate(targetCourseId ? `/course-player?careerPathId=${expandedPath}&courseId=${targetCourseId}` : `/course-details?id=${expandedPath}&type=career-path`);
                      }}
                      className="w-full bg-[#fff7d6] hover:bg-[#ffe88b] border border-[#ffe88b] text-gray-900 text-[13px] font-bold py-3 rounded-xl transition-all flex justify-center items-center gap-2 cursor-pointer shadow-xs active:scale-95"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M5 3v18l15-9L5 3z" /></svg>
                      Continue path
                    </button>
                  </div>
                </div>
              </div>

            </div>
          );
        })()}


        {/* EXPLORE MORE PATHS */}
        <div className="space-y-6 pt-4">
          <div className="flex justify-between items-end px-1">
            <h2 className="text-xl font-bold text-gray-900">Explore more paths</h2>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 hidden md:flex">
                <button className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 text-gray-500 transition-colors">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 text-gray-500 transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <button
                onClick={() => navigate('/member-learning')}
                className="text-[11px] font-bold text-[#c75e47] hover:text-[#9e4a38] uppercase tracking-wider flex items-center gap-1 transition-colors"
              >
                VIEW ALL <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {notEnrolledPaths.length > 0 ? (
              notEnrolledPaths.map((path: any) => (
                <div key={path.id} className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-1 hover:ring-2 hover:ring-[#c69a31] hover:border-transparent transition-all duration-300 flex flex-col cursor-pointer" onClick={() => navigate(`/course-details?id=${path.id}&type=career-path`)}>
                  <div className="h-[160px] bg-gray-100 relative">
                    {(() => {
                      const thumbUrl = getAssetImageUrl(path.thumbnailAsset) || getAssetImageUrl(path.coverImageAsset) || getAssetImageUrl(path.thumbnailUrl) || getAssetImageUrl(path.coverImageUrl) || null;
                      return thumbUrl ? (
                        <img src={thumbUrl} className="w-full h-full object-cover" alt="" />
                      ) : null;
                    })()}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-80" />
                    <div className="absolute bottom-4 left-4">
                      <span className="bg-black/50 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-1 rounded-md flex items-center gap-1.5 shadow-sm border border-white/10">
                        Career path
                      </span>
                    </div>
                  </div>

                  <div className="p-5 flex flex-col flex-1">
                    <span className="text-[10px] font-bold text-[#b88c3a] uppercase tracking-wider mb-2 line-clamp-1">{(path.category && path.category !== "Uncategorized") ? path.category : "Career Path"}</span>
                    <h3 className="text-[15px] font-bold text-gray-900 leading-tight mb-3 flex-1 line-clamp-2">{path.title}</h3>

                    <div className="text-[11px] font-medium text-gray-500 mb-5">
                      {path.lessonsCount || path.coursesCount || 0} courses · {formatDuration(Number(path.totalDurationMins) || Number(path.duration) || Number(path.estimatedDuration) || 0)}
                    </div>

                    <div className="flex items-center gap-2 mt-auto">
                      <span className="px-2.5 py-1 rounded-md bg-[#fdf5d3] text-[#b88c3a] text-[10px] font-bold">{(path.category && path.category !== "Uncategorized") ? path.category : "Career Path"}</span>
                      <span className="px-2.5 py-1 rounded-md bg-[#eef6ec] text-[#6cb356] text-[10px] font-bold">Practitioner</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-sm text-gray-500 py-10 w-full text-center col-span-full border border-gray-100 rounded-2xl bg-white shadow-sm">No other paths available right now.</div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default CareerPath;
