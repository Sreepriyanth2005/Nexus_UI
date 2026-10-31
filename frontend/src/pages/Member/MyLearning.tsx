import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuthStore } from "../../core/auth/auth.store";
import { useUserStore } from "../../store/user.store";
import { useMemberLearningCourses } from "../../hooks/member-learning/memberLearning";
import { useProfileStore } from "../../store/profile.store";
import { memberLearningApi } from "../../core/api/member-learning/memberLearningApi";
import { getAssignedContentApi } from "../../core/api/corporate-learning.api";
import { useUserCertificates } from "../../hooks/course-completed/courseCompleted";
import {
  BookOpen,
  Play,
  CheckCircle2,
  AlertTriangle,
  Award,
  Clock,
  Search,
  Grid,
  List,
  Calendar,
  Filter,
  ArrowRight,
  Sparkles,
  RotateCcw,
  Download,
  Wifi,
  WifiOff,
  ChevronRight,
  Shield,
  MessageSquare,
  FileText
} from "lucide-react";
import { Skeleton } from "../../components/ui/Skeleton/Skeleton";
import { toast } from "sonner";

const getRelativeTime = (dateString?: string) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  if (diffMs < 0) return "Just now";
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 60) return `${Math.max(1, diffMins)}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
};

const MyLearning: React.FC = () => {
  const navigate = useNavigate();
  const { profile } = useProfileStore();
  const { role } = useAuthStore();

  const [activeTab, setActiveTab] = useState<"All" | "In progress" | "Not started" | "Completed" | "Expiring">("All");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  type SortOption = "Due date" | "Recently accessed" | "Completion %" | "Title A-Z";
  const [sortBy, setSortBy] = useState<SortOption>("Due date");
  const [searchQuery, setSearchQuery] = useState("");
  const [dueDatesMap, setDueDatesMap] = useState<Record<string, string>>({});
  const [offlineOnly, setOfflineOnly] = useState(false);

  useEffect(() => {
    if (profile?.tenantId && profile?.id) {
      getAssignedContentApi(profile.tenantId, profile.id)
        .then((res: any) => {
          const newMap: Record<string, string> = {};
          res?.courses?.forEach((c: any) => {
            const id = c.course?.id || c.content?.id || c.id;
            if (id && c.dueDate) newMap[id] = c.dueDate;
          });
          setDueDatesMap(newMap);
        })
        .catch(console.error);
    }
  }, [profile?.tenantId, profile?.id]);

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

  const { data: certsRes } = useUserCertificates(profile?.id || "", { limit: 100 }, !!profile?.id);
  const certificates = certsRes?.data || [];
  const certIdSet = useMemo(() => new Set(certificates.map((c: any) => c.courseId).filter(Boolean)), [certificates]);

  // Enrolled / Assigned items (strictly Courses only - no Career Paths or standalone Lessons)
  const enrolledTrainings = useMemo(() => {
    const list = (allLearnings || []).filter((c: any) => c.isEnrolled && (c.type === "course" || !c.type));
    return list.map((item: any) => {
      const dueDateStr = dueDatesMap[item.id] || item.dueDate;
      const dueDate = dueDateStr ? new Date(dueDateStr) : null;
      const now = new Date();
      const isOverdue = dueDate ? dueDate < now && (item.progress || 0) < 100 : false;
      const isDueSoon = dueDate ? Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) <= 7 && (item.progress || 0) < 100 : false;
      const isCertified = certIdSet.has(item.id) || (item.progress || 0) === 100 || item.statusText === "Completed";

      return {
        ...item,
        type: "course",
        resolvedDueDate: dueDateStr,
        isOverdue,
        isDueSoon,
        isCertified,
      };
    });
  }, [allLearnings, dueDatesMap, certIdSet]);

  const completedTrainings = enrolledTrainings.filter((c: any) => c.isCertified);
  const inProgressTrainings = enrolledTrainings.filter(
    (c: any) => !c.isCertified && ((c.progress || 0) > 0 || c.statusText === "In progress")
  );
  const notStartedTrainings = enrolledTrainings.filter(
    (c: any) => !c.isCertified && !(c.progress || 0) && c.statusText !== "In progress"
  );
  const expiringTrainings = enrolledTrainings.filter((c: any) => c.isCertified);

  // Overall calculations
  const totalProgress = enrolledTrainings.reduce((acc: number, c: any) => acc + (c.progress || 0), 0);
  const overallProgress = enrolledTrainings.length > 0 ? Math.round(totalProgress / enrolledTrainings.length) : 0;

  const localState = memberLearningApi.getLocalState();
  const totalTimeSpentSecs = localState.totalTimeSpentSecs || 0;
  const totalTimeSpentMins = Math.round(totalTimeSpentSecs / 60);
  const learnedDisplay = totalTimeSpentMins >= 60 ? `${Math.round(totalTimeSpentMins / 60)} hrs` : `${totalTimeSpentMins} mins`;

  // Filtered & Sorted
  const displayedTrainings = useMemo(() => {
    let list = enrolledTrainings;
    if (activeTab === "In progress") list = inProgressTrainings;
    else if (activeTab === "Not started") list = notStartedTrainings;
    else if (activeTab === "Completed") list = completedTrainings;
    else if (activeTab === "Expiring") list = expiringTrainings;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((t: any) =>
        t.title?.toLowerCase().includes(q) ||
        t.category?.toLowerCase().includes(q) ||
        t.type?.toLowerCase().includes(q)
      );
    }

    return [...list].sort((a: any, b: any) => {
      if (sortBy === "Completion %") return (b.progress || 0) - (a.progress || 0);
      if (sortBy === "Title A-Z") return (a.title || "").localeCompare(b.title || "");
      if (sortBy === "Due date") {
        if (!a.resolvedDueDate) return 1;
        if (!b.resolvedDueDate) return -1;
        return new Date(a.resolvedDueDate).getTime() - new Date(b.resolvedDueDate).getTime();
      }
      return 0;
    });
  }, [enrolledTrainings, activeTab, inProgressTrainings, notStartedTrainings, completedTrainings, expiringTrainings, searchQuery, sortBy]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
        
        {/* ── HEADER BANNER ── */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 md:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
              <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
              <span>Assigned Employee Curricula</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              My Assigned Trainings & Progress
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 max-w-xl leading-relaxed">
              Track mandatory compliance deadlines, resume interactive learning modules, verify completion requirements, and manage valid credentials.
            </p>
          </div>

          {/* Quick Progress Cards */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-center min-w-[110px]">
              <div className="text-2xl font-black text-indigo-600">{overallProgress}%</div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Overall Progress</div>
            </div>
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-center min-w-[110px]">
              <div className="text-2xl font-black text-emerald-600">{completedTrainings.length}</div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Certified</div>
            </div>
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-center min-w-[110px]">
              <div className="text-2xl font-black text-slate-800">{learnedDisplay}</div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Hours Studied</div>
            </div>
          </div>
        </div>

        {/* ── CONTROLS & FILTER TABS BAR ── */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          {/* Tab Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: "All", label: "All Assigned", count: enrolledTrainings.length },
              { id: "In progress", label: "In Progress", count: inProgressTrainings.length },
              { id: "Not started", label: "Pending / Start", count: notStartedTrainings.length },
              { id: "Completed", label: "Completed", count: completedTrainings.length },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === tab.id
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-100"
                    : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/60"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    activeTab === tab.id ? "bg-white/20 text-white" : "bg-slate-200 text-slate-600"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search, Sort, View Toggle */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Search input */}
            <div className="relative flex-1 sm:w-56">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search my trainings..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
              />
            </div>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="Due date">Sort by: Due Date</option>
              <option value="Completion %">Sort by: Progress %</option>
              <option value="Title A-Z">Sort by: Title A-Z</option>
            </select>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === "grid" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-800"
                }`}
                title="Grid view"
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === "list" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-800"
                }`}
                title="List view"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* ── TRAINING LIST / GRID VIEW ── */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 animate-pulse">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-64 bg-slate-200 rounded-2xl" />
            ))}
          </div>
        ) : displayedTrainings.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200/80 p-16 text-center space-y-4 shadow-sm">
            <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto">
              <BookOpen className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-800">No trainings in this section</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              You are all caught up! Browse the training catalog to explore more professional learning paths and safety certifications.
            </p>
            <button
              onClick={() => navigate("/member-learning")}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all"
            >
              Explore Training Catalog
            </button>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {displayedTrainings.map((item: any) => {
              const thumbUrl = item.thumbnailAsset?.signedUrl || item.thumbnailAsset?.url || item.thumbnailAsset?.fileUrl || item.thumbnailUrl || item.coverImageUrl;
              const progress = Math.round(item.progress || 0);
              const isDone = item.isCertified;

              return (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-xl hover:border-indigo-300 transition-all duration-300 flex flex-col overflow-hidden group"
                >
                  <div className="relative h-44 bg-slate-100 overflow-hidden">
                    {thumbUrl ? (
                      <img
                        src={thumbUrl}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-indigo-50/50 text-indigo-400">
                        <BookOpen className="w-10 h-10 mb-1" />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Learning Unit</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-transparent to-transparent" />

                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/90 backdrop-blur-md text-slate-800 shadow-sm">
                        {item.category || item.type || "Training"}
                      </span>
                      {item.isOverdue && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-600 text-white shadow-sm flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Overdue
                        </span>
                      )}
                    </div>

                    {item.resolvedDueDate && (
                      <div className="absolute bottom-2.5 left-3 flex items-center gap-1.5 text-xs text-white font-medium">
                        <Calendar className="w-3.5 h-3.5 text-indigo-300" />
                        <span>Due: {new Date(item.resolvedDueDate).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {item.duration || "40 mins"}
                        </span>
                        <span>{item.lessonsCount || 4} Modules</span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 line-clamp-2 leading-snug group-hover:text-indigo-600 transition-colors">
                        {item.title}
                      </h4>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1.5 pt-2 border-t border-slate-100">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className={isDone ? "text-emerald-600" : progress > 0 ? "text-indigo-600" : "text-slate-400"}>
                          {isDone ? "Completed" : progress > 0 ? `${progress}% In Progress` : "Not Started"}
                        </span>
                        {item.isCertified && (
                          <span className="inline-flex items-center gap-1 text-[11px] text-amber-600 font-bold">
                            <Award className="w-3 h-3" /> Certified
                          </span>
                        )}
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isDone ? "bg-emerald-500" : progress > 0 ? "bg-indigo-600" : "bg-slate-200"
                          }`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    {/* Button Action */}
                    <div className="flex items-center gap-2 pt-1">
                      {isDone ? (
                        <>
                          <button
                            onClick={() => navigate(`/certificate-detail?courseId=${item.id}`)}
                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
                          >
                            <Award className="w-3.5 h-3.5" />
                            <span>Certificate</span>
                          </button>
                          <button
                            onClick={() => navigate(`/course-details?id=${item.id}&type=${item.type || "course"}`)}
                            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors"
                          >
                            Review
                          </button>
                        </>
                      ) : progress > 0 ? (
                        <>
                          <button
                            onClick={() => navigate(`/course-player?id=${item.id}&type=${item.type || "course"}`)}
                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all"
                          >
                            <Play className="w-3.5 h-3.5 fill-current" />
                            <span>Resume</span>
                          </button>
                          <button
                            onClick={() => navigate(`/quiz-start-warning?courseId=${item.id}`)}
                            className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs rounded-xl transition-colors"
                          >
                            Assessment
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => navigate(`/course-player?id=${item.id}&type=${item.type || "course"}`)}
                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-indigo-600 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
                          >
                            <Play className="w-3.5 h-3.5 fill-current" />
                            <span>Start Training</span>
                          </button>
                          <button
                            onClick={() => navigate(`/course-details?id=${item.id}&type=${item.type || "course"}`)}
                            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors"
                          >
                            Details
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* List View */
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm divide-y divide-slate-100 overflow-hidden">
            {displayedTrainings.map((item: any) => {
              const progress = Math.round(item.progress || 0);
              const isDone = item.isCertified;

              return (
                <div
                  key={item.id}
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                      <BookOpen className="w-6 h-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                          {item.category || "Training"}
                        </span>
                        {item.resolvedDueDate && (
                          <span className={`text-[11px] font-semibold ${item.isOverdue ? "text-rose-600" : "text-slate-400"}`}>
                            Due: {new Date(item.resolvedDueDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 truncate mt-1">
                        {item.title}
                      </h4>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 shrink-0">
                    <div className="w-32 hidden md:block">
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span className="text-slate-400">Progress</span>
                        <span className="text-slate-700">{progress}%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${isDone ? "bg-emerald-500" : "bg-indigo-600"}`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isDone ? (
                        <button
                          onClick={() => navigate(`/certificate-detail?courseId=${item.id}`)}
                          className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5"
                        >
                          <Award className="w-3.5 h-3.5" />
                          <span>Certificate</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => navigate(`/course-player?id=${item.id}&type=${item.type || "course"}`)}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>{progress > 0 ? "Resume" : "Start"}</span>
                        </button>
                      )}
                      <button
                        onClick={() => navigate(`/course-details?id=${item.id}&type=${item.type || "course"}`)}
                        className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors"
                      >
                        Details
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyLearning;
