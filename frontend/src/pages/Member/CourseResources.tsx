import React, { useState, useMemo } from "react";
import { useSearchParams, useNavigate, useLocation } from "react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  FileText,
  Link as LinkIcon,
  Download,
  ExternalLink,
  ArrowLeft,
  Filter,
  FolderOpen,
  X,
  BookOpen,
  Layers,
  Sparkles,
  SlidersHorizontal,
  ChevronDown,
} from "lucide-react";
import { courseApi } from "../../core/api/course/course.api";
import { getCareerPathApi, getEnrolledCareerPathsApi } from "../../core/api/career-path/career-path.api";

interface ResourceItem {
  id: string;
  type: "pdf" | "link";
  title: string;
  subtitle: string;
  url: string;
  fileName?: string;
  fileSize?: string;
  courseId?: string;
  courseTitle?: string;
  careerPathId?: string;
  careerPathTitle?: string;
  lessonTitle?: string;
}

function formatBytes(bytes?: number | string | bigint | null): string {
  if (!bytes) return "";
  const num = Number(bytes);
  if (isNaN(num) || num <= 0) return "";
  if (num < 1024) return `${num} B`;
  if (num < 1024 * 1024) return `${(num / 1024).toFixed(0)} KB`;
  return `${(num / (1024 * 1024)).toFixed(1)} MB`;
}

const CourseResources = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

  const queryCourseId = searchParams.get("courseId") || (location.state as any)?.courseId || "";
  const queryCareerPathId = searchParams.get("careerPathId") || (location.state as any)?.careerPathId || "";

  const [selectedCourseId, setSelectedCourseId] = useState<string>(queryCourseId);
  const [selectedCareerPathId, setSelectedCareerPathId] = useState<string>(queryCareerPathId);
  const [activeTab, setActiveTab] = useState<"all" | "pdf" | "link">("all");
  const [search, setSearch] = useState("");

  // Sync state if URL query params change
  React.useEffect(() => {
    if (queryCareerPathId) {
      setSelectedCareerPathId(queryCareerPathId);
      setSelectedCourseId("");
    } else if (queryCourseId) {
      setSelectedCourseId(queryCourseId);
      setSelectedCareerPathId("");
    }
  }, [queryCourseId, queryCareerPathId]);

  // 1. Fetch user's enrolled courses & career paths
  const { data: enrolledCoursesData, isLoading: isLoadingEnrolledCourses } = useQuery({
    queryKey: ["enrolled-courses"],
    queryFn: async () => {
      const res = await courseApi.getEnrolledCourses();
      return res.data?.data || [];
    },
  });

  const { data: enrolledCareerPathsData, isLoading: isLoadingEnrolledCareerPaths } = useQuery({
    queryKey: ["enrolled-career-paths"],
    queryFn: async () => {
      const res = await getEnrolledCareerPathsApi();
      return res.data || [];
    },
  });

  // 2. Fetch specific course details if selectedCourseId is active
  const { data: singleCourseData, isLoading: isLoadingSingleCourse, isError: isErrorCourse } = useQuery({
    queryKey: ["course-resource-details", selectedCourseId],
    queryFn: async () => {
      if (!selectedCourseId) return null;
      const res = await courseApi.getById(selectedCourseId);
      return res.data?.data || (res.data as any) || null;
    },
    enabled: !!selectedCourseId,
  });

  // 3. Fetch specific career path details if selectedCareerPathId is active
  const { data: singleCareerPathData, isLoading: isLoadingSingleCareerPath, isError: isErrorCareerPath } = useQuery({
    queryKey: ["career-path-resource-details", selectedCareerPathId],
    queryFn: async () => {
      if (!selectedCareerPathId) return null;
      const res = await getCareerPathApi(selectedCareerPathId);
      return res.data || (res as any)?.data || null;
    },
    enabled: !!selectedCareerPathId,
  });

  // 4. Extract & normalize all resources from course(s) and career path(s)
  const allResources: ResourceItem[] = useMemo(() => {
    const items: ResourceItem[] = [];

    const processCourse = (courseObj: any, parentCareerPathTitle?: string) => {
      if (!courseObj) return;
      const cId = courseObj.id;
      const cTitle = courseObj.title || "Course Resource";
      const courseLessons = courseObj.courseLessons || [];

      courseLessons.forEach((cl: any) => {
        const lesson = cl.lesson || cl;
        const lessonTitle = lesson?.title || "Lesson";
        const attachments = lesson?.attachments || [];
        const lessonAssets = lesson?.lessonAssets?.map((a: any) => a.asset) || [];
        
        const allLessonAttachments = [...attachments, ...lessonAssets].filter(Boolean);

        allLessonAttachments.forEach((att: any, idx: number) => {
          const asset = att.asset || att;
          const fileName = asset?.originalFileName || asset?.fileName || `Attachment-${idx + 1}`;
          const fileSizeStr = formatBytes(asset?.fileSize);
          const mime = (asset?.mimeType || "").toLowerCase();
          const ext = (asset?.fileExtension || "").toLowerCase();

          const isPdf =
            mime.includes("pdf") ||
            mime.includes("document") ||
            mime.includes("word") ||
            mime.includes("sheet") ||
            ext === "pdf" ||
            ext === "doc" ||
            ext === "docx";

          const type: "pdf" | "link" = isPdf ? "pdf" : "link";
          const rawUrl = asset?.signedUrl || asset?.storagePath || asset?.fileUrl || "#";

          let subtitle = type === "pdf" ? `PDF` : `External link`;
          if (fileSizeStr) subtitle += ` · ${fileSizeStr}`;
          if (lessonTitle) subtitle += ` · ${lessonTitle}`;
          if (cTitle && (selectedCareerPathId || (!selectedCourseId && !selectedCareerPathId))) {
            subtitle += ` (${cTitle})`;
          }
          if (parentCareerPathTitle && !selectedCareerPathId) {
            subtitle += ` · ${parentCareerPathTitle}`;
          }

          items.push({
            id: att.id || asset?.id || `${cId}-${idx}`,
            type,
            title: fileName,
            subtitle,
            url: rawUrl,
            fileName,
            fileSize: fileSizeStr,
            courseId: cId,
            courseTitle: cTitle,
            careerPathTitle: parentCareerPathTitle,
            lessonTitle,
          });
        });
      });
    };

    const processCareerPath = (cpObj: any) => {
      if (!cpObj) return;
      const cpTitle = cpObj.title || "Career Path";
      const cpCourses = cpObj.courses || cpObj.careerPathCourses || [];
      cpCourses.forEach((cpc: any) => {
        const c = cpc.course || cpc;
        processCourse(c, cpTitle);
      });
    };

    if (selectedCareerPathId && singleCareerPathData) {
      processCareerPath(singleCareerPathData);
    } else if (selectedCourseId && singleCourseData) {
      processCourse(singleCourseData);
    } else {
      if (enrolledCoursesData && enrolledCoursesData.length > 0) {
        enrolledCoursesData.forEach((item: any) => {
          const c = item.course || item;
          processCourse(c);
        });
      }
      if (enrolledCareerPathsData && enrolledCareerPathsData.length > 0) {
        enrolledCareerPathsData.forEach((item: any) => {
          const cp = item.careerPath || item;
          processCareerPath(cp);
        });
      }
    }

    return items;
  }, [
    singleCourseData,
    singleCareerPathData,
    enrolledCoursesData,
    enrolledCareerPathsData,
    selectedCourseId,
    selectedCareerPathId,
  ]);

  // Filter resources by search and tab
  const filteredResources = useMemo(() => {
    return allResources.filter((resource) => {
      const tabMatch = activeTab === "all" || resource.type === activeTab;
      const searchLower = search.toLowerCase();
      const searchMatch =
        !search ||
        resource.title.toLowerCase().includes(searchLower) ||
        resource.subtitle.toLowerCase().includes(searchLower) ||
        (resource.lessonTitle && resource.lessonTitle.toLowerCase().includes(searchLower)) ||
        (resource.courseTitle && resource.courseTitle.toLowerCase().includes(searchLower)) ||
        (resource.careerPathTitle && resource.careerPathTitle.toLowerCase().includes(searchLower));

      return tabMatch && searchMatch;
    });
  }, [allResources, activeTab, search]);

  const pdfCount = useMemo(() => allResources.filter((r) => r.type === "pdf").length, [allResources]);
  const linkCount = useMemo(() => allResources.filter((r) => r.type === "link").length, [allResources]);

  const isLoading =
    (selectedCourseId && isLoadingSingleCourse) ||
    (selectedCareerPathId && isLoadingSingleCareerPath) ||
    isLoadingEnrolledCourses ||
    isLoadingEnrolledCareerPaths;

  const isError = isErrorCourse || isErrorCareerPath;

  const handleDownloadOrOpen = (resource: ResourceItem) => {
    if (!resource.url || resource.url === "#") {
      alert("Resource link unavailable.");
      return;
    }

    if (resource.type === "link") {
      window.open(resource.url, "_blank", "noopener,noreferrer");
    } else {
      const link = document.createElement("a");
      link.href = resource.url;
      link.target = "_blank";
      link.download = resource.fileName || resource.title;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const activeTitle = selectedCareerPathId
    ? singleCareerPathData?.title || (location.state as any)?.careerPathTitle || "Career Path Resources"
    : selectedCourseId
      ? singleCourseData?.title || (location.state as any)?.courseTitle || "Course Resources"
      : "Resource Library";

  const handleBack = () => {
    if (selectedCareerPathId) {
      navigate(`/course-details?itemType=career-path&careerPathId=${selectedCareerPathId}`);
    } else if (selectedCourseId) {
      navigate(`/course-details?courseId=${selectedCourseId}`);
    } else {
      navigate(-1);
    }
  };

  const handleFilterSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (!val) {
      setSelectedCourseId("");
      setSelectedCareerPathId("");
      navigate(`/course-resources`, { replace: true });
    } else if (val.startsWith("cp_")) {
      const cpId = val.replace("cp_", "");
      setSelectedCareerPathId(cpId);
      setSelectedCourseId("");
      navigate(`/course-resources?careerPathId=${cpId}`, { replace: true });
    } else if (val.startsWith("c_")) {
      const cId = val.replace("c_", "");
      setSelectedCourseId(cId);
      setSelectedCareerPathId("");
      navigate(`/course-resources?courseId=${cId}`, { replace: true });
    }
  };

  const activeFilterValue = selectedCareerPathId
    ? `cp_${selectedCareerPathId}`
    : selectedCourseId
      ? `c_${selectedCourseId}`
      : "";

  const clearAllFilters = () => {
    setSearch("");
    setActiveTab("all");
    setSelectedCourseId("");
    setSelectedCareerPathId("");
    navigate("/course-resources", { replace: true });
  };

  const hasActiveFilters = Boolean(search || activeTab !== "all" || selectedCourseId || selectedCareerPathId);

  return (
    <div className="min-h-screen bg-[#FAFAFA] font-sans">
      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8">

        {/* Navigation Top Bar */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={handleBack}
            className="inline-flex items-center gap-2 text-xs sm:text-sm text-gray-500 hover:text-black font-semibold transition-colors group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
            <span>
              {selectedCareerPathId
                ? `Back to Career Path`
                : selectedCourseId
                  ? `Back to Course`
                  : `Back`}
            </span>
          </button>
        </div>

        {/* Header Block */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 border border-gray-200 rounded-full text-[11px] font-bold text-gray-600 uppercase tracking-widest mb-3">
            <Sparkles size={12} className="text-gray-900" />
            <span>Resource Library</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
            {activeTitle}
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1 max-w-2xl">
            Access, download, and review supplementary study materials, worksheets, reading lists, and external references.
          </p>
        </div>

        {/* Enhanced Filter Control Panel */}
        <div className="bg-white border border-gray-200/80 shadow-sm rounded-2xl p-4 sm:p-5 mb-8 space-y-4">

          {/* Top Row: Search & Learning Material Selector */}
          <div className="flex flex-col md:flex-row gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search resources by title, lesson, or course..."
                className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-9 py-2.5 text-xs sm:text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-black/10 focus:border-black transition-all"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 p-0.5 rounded-full"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Learning Material Select Dropdown */}
            {((enrolledCoursesData && enrolledCoursesData.length > 0) ||
              (enrolledCareerPathsData && enrolledCareerPathsData.length > 0)) && (
                <div className="relative shrink-0 md:min-w-[260px]">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none flex items-center gap-1.5">
                    <SlidersHorizontal size={14} />
                  </div>
                  <select
                    value={activeFilterValue}
                    onChange={handleFilterSelectChange}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-8 py-2.5 text-xs sm:text-sm font-semibold text-gray-800 appearance-none focus:outline-none focus:bg-white focus:ring-2 focus:ring-black/10 focus:border-black transition-all cursor-pointer truncate"
                  >
                    <option value="">All Enrolled Learning</option>
                    {enrolledCareerPathsData && enrolledCareerPathsData.length > 0 && (
                      <optgroup label="Career Paths">
                        {enrolledCareerPathsData.map((item: any) => {
                          const cp = item.careerPath || item;
                          return (
                            <option key={cp.id || item.id} value={`cp_${cp.id}`}>
                              Path: {cp.title || "Career Path"}
                            </option>
                          );
                        })}
                      </optgroup>
                    )}
                    {enrolledCoursesData && enrolledCoursesData.length > 0 && (
                      <optgroup label="Courses">
                        {enrolledCoursesData.map((item: any) => {
                          const c = item.course || item;
                          return (
                            <option key={c.id || item.id} value={`c_${c.id}`}>
                              Course: {c.title || "Course"}
                            </option>
                          );
                        })}
                      </optgroup>
                    )}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              )}
          </div>

          {/* Bottom Row: Pill Segment Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-gray-100">
            {/* Type Segmented Buttons */}
            <div className="flex items-center bg-gray-100/80 p-1 rounded-xl gap-1">
              {[
                { key: "all", label: "All", count: allResources.length, icon: Layers },
                { key: "pdf", label: "PDFs & Files", count: pdfCount, icon: FileText },
                { key: "link", label: "Links", count: linkCount, icon: LinkIcon },
              ].map((tab) => {
                const IconComponent = tab.icon;
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as "all" | "pdf" | "link")}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${isActive
                        ? "bg-white text-gray-900 shadow-sm border border-gray-200/70"
                        : "text-gray-600 hover:text-gray-900 hover:bg-white/50"
                      }`}
                  >
                    <IconComponent size={13} className={isActive ? "text-gray-900" : "text-gray-500"} />
                    <span>{tab.label}</span>
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${isActive ? "bg-gray-100 text-gray-800" : "bg-gray-200/70 text-gray-600"
                        }`}
                    >
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Clear Filters Button if any filter active */}
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-red-600 transition-colors px-2 py-1"
              >
                <X size={13} />
                <span>Reset Filters</span>
              </button>
            )}
          </div>
        </div>

        {/* Active Filter Chips Indicator */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="text-[11px] font-bold uppercase text-gray-400 tracking-wider">Active:</span>
            {selectedCareerPathId && (
              <span className="inline-flex items-center gap-1.5 bg-gray-900 text-white text-xs px-2.5 py-1 rounded-full font-medium">
                <Layers size={11} />
                <span>{singleCareerPathData?.title || "Career Path"}</span>
                <button
                  onClick={() => {
                    setSelectedCareerPathId("");
                    navigate("/course-resources", { replace: true });
                  }}
                  className="hover:text-gray-300 ml-0.5"
                >
                  <X size={12} />
                </button>
              </span>
            )}
            {selectedCourseId && (
              <span className="inline-flex items-center gap-1.5 bg-gray-900 text-white text-xs px-2.5 py-1 rounded-full font-medium">
                <BookOpen size={11} />
                <span>{singleCourseData?.title || "Course"}</span>
                <button
                  onClick={() => {
                    setSelectedCourseId("");
                    navigate("/course-resources", { replace: true });
                  }}
                  className="hover:text-gray-300 ml-0.5"
                >
                  <X size={12} />
                </button>
              </span>
            )}
            {activeTab !== "all" && (
              <span className="inline-flex items-center gap-1.5 bg-gray-100 border border-gray-300 text-gray-800 text-xs px-2.5 py-1 rounded-full font-semibold">
                <span>{activeTab === "pdf" ? "PDFs & Files" : "Links"}</span>
                <button onClick={() => setActiveTab("all")} className="hover:text-black ml-0.5">
                  <X size={12} />
                </button>
              </span>
            )}
            {search && (
              <span className="inline-flex items-center gap-1.5 bg-gray-100 border border-gray-300 text-gray-800 text-xs px-2.5 py-1 rounded-full font-semibold">
                <span>"{search}"</span>
                <button onClick={() => setSearch("")} className="hover:text-black ml-0.5">
                  <X size={12} />
                </button>
              </span>
            )}
          </div>
        )}

        {/* Count & Status */}
        <div className="flex justify-between items-center mb-4">
          <p className="text-xs font-semibold text-gray-500">
            Showing {filteredResources.length} {filteredResources.length === 1 ? "resource" : "resources"}
          </p>
        </div>

        {/* Content Loading Skeleton */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white border border-gray-200 rounded-2xl p-5 flex items-center justify-between animate-pulse"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gray-100" />
                  <div className="space-y-2">
                    <div className="h-4 w-48 bg-gray-200 rounded" />
                    <div className="h-3 w-32 bg-gray-100 rounded" />
                  </div>
                </div>
                <div className="w-24 h-9 bg-gray-100 rounded-lg" />
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-6 text-center">
            <p className="text-xs sm:text-sm font-semibold">Failed to load resources for this learning path.</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-3 text-xs font-bold text-red-700 underline"
            >
              Try Again
            </button>
          </div>
        ) : filteredResources.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center mx-auto">
              <FolderOpen size={24} />
            </div>
            <h3 className="text-base font-bold text-gray-900">No resources found</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              {search
                ? `No resources match your search query "${search}". Try clearing the search filter.`
                : "There are no downloadable resources or links attached to this learning material yet."}
            </p>
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold bg-black text-white px-4 py-2 rounded-xl hover:bg-gray-800 transition"
              >
                <span>Reset Filters</span>
              </button>
            )}
          </div>
        ) : (
          /* Resource Cards */
          <div className="space-y-3">
            {filteredResources.map((resource) => (
              <div
                key={resource.id}
                className="bg-white border border-gray-200/80 rounded-2xl p-4 sm:p-5 flex items-center justify-between hover:shadow-md hover:border-gray-300 transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0 group-hover:bg-gray-100 transition-colors">
                    {resource.type === "pdf" ? (
                      <FileText size={20} className="text-gray-800" />
                    ) : (
                      <LinkIcon size={20} className="text-gray-800" />
                    )}
                  </div>

                  <div>
                    <h3 className="font-bold text-gray-900 text-xs sm:text-sm group-hover:text-black transition-colors">
                      {resource.title}
                    </h3>

                    <p className="text-[11px] sm:text-xs text-gray-500 mt-1 font-medium">
                      {resource.subtitle}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleDownloadOrOpen(resource)}
                  className="flex items-center gap-2 border border-gray-200 hover:border-black bg-white hover:bg-black hover:text-white rounded-xl px-3.5 sm:px-4 py-2 text-xs font-bold text-gray-800 transition-all shadow-sm shrink-0"
                >
                  {resource.type === "pdf" ? (
                    <>
                      <Download size={14} />
                      <span>Download</span>
                    </>
                  ) : (
                    <>
                      <ExternalLink size={14} />
                      <span>Open</span>
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseResources;