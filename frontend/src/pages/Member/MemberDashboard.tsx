import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router";
import { useProfile } from "../../hooks/profile/useProfile";
import { getAssignedContentApi, getAvailableCoursesApi } from "../../core/api/corporate-learning.api";
import {
  memberLearningApi,
  isLearningContentVisible,
  isPublishedLearningContent,
  isStandaloneCourse,
} from "../../core/api/member-learning/memberLearningApi";
import { useEnrolledCourses } from "../../hooks/course-details/courseDetails";
import { useUserCertificates } from "../../hooks/course-completed/courseCompleted";
import { useMemberLearningCourses, useProgressDashboard } from "../../hooks/member-learning/memberLearning";
import { useQuery } from "@tanstack/react-query";
import { getRecommendations } from "../../core/api/recommendation.api";
import {
  BookOpen,
  Play,
  CheckCircle2,
  AlertTriangle,
  Award,
  HelpCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  Bookmark,
  Shield,
  User,
  Star,
  ArrowRight,
  Globe,
  FileText,
  Download,
  MessageSquare,
  Sparkles,
  Wifi,
  WifiOff,
  Filter,
  Search,
  Check,
  Calendar,
  AlertCircle,
  RotateCcw,
  GraduationCap
} from "lucide-react";
import { useAuthStore } from "../../core/auth/auth.store";
import { useWishlist } from "../../hooks/member-learning/memberLearning";
import { Skeleton } from "../../components/ui/Skeleton/Skeleton";
import { toast } from "sonner";

const LANGUAGES = [
  { code: "en", name: "English (US)", flag: "🇺🇸" },
  { code: "es", name: "Español", flag: "🇪🇸" },
  { code: "fr", name: "Français", flag: "🇫🇷" },
  { code: "de", name: "Deutsch", flag: "🇩🇪" },
  { code: "ar", name: "العربية", flag: "🇸🇦" },
  { code: "hi", name: "हिन्दी", flag: "🇮🇳" },
];

const MemberDashboard: React.FC = () => {
  const navigate = useNavigate();
  const role = useAuthStore((state) => state.role);
  const wishlistMutation = useWishlist();

  const [selectedLanguage, setSelectedLanguage] = useState(() => {
    return localStorage.getItem("member_preferred_language") || "en";
  });
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const [offlineMode, setOfflineMode] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "in-progress" | "due-soon" | "completed" | "expiring">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const handleLanguageChange = (langCode: string) => {
    setSelectedLanguage(langCode);
    localStorage.setItem("member_preferred_language", langCode);
    setIsLangDropdownOpen(false);
    toast.success(`Language set to ${LANGUAGES.find(l => l.code === langCode)?.name || langCode}`);
  };

  const handleWishlistToggle = async (courseId: string, entityType: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await wishlistMutation.mutateAsync({ entityId: courseId, entityType });
  };

  const {
    profile,
    loading: isProfileLoading,
    getProfile,
  } = useProfile();

  const effUserId = profile?.id || "";
  const effTenantId = profile?.tenantId || "";
  const effectiveRole = role || (effTenantId ? "CORPORATE_USER" : "MEMBER");

  const [allocatedCourses, setAllocatedCourses] = useState<any[]>([]);
  const [dueDatesMap, setDueDatesMap] = useState<Record<string, string>>({});
  const [allPublishedCourses, setAllPublishedCourses] = useState<any[]>([]);
  const [loadingAllocated, setLoadingAllocated] = useState(false);

  const { data: enrolledCourses, isLoading: isLoadingEnrolledCourses } = useEnrolledCourses(!!effUserId);

  const { rawData: allLearnings, isLoading: isLoadingLearnings } = useMemberLearningCourses(
    effUserId,
    "RAW_DATA_V2",
    {},
    "",
    "",
    1,
    9999,
    !!effUserId,
    effectiveRole,
    effTenantId
  );

  const { data: dashboardData, isLoading: isLoadingDashboard } = useProgressDashboard(effUserId, !!effUserId);

  const { data: userCertificatesRes } = useUserCertificates(effUserId, { limit: 100 }, !!effUserId);
  const userCertificates = userCertificatesRes?.data || [];
  const certifiedCourseIds = useMemo(() => {
    return new Set(userCertificates.map((c: any) => c.courseId).filter(Boolean));
  }, [userCertificates]);

  useEffect(() => {
    getProfile();
  }, [getProfile]);

  useEffect(() => {
    if (!effUserId) return;

    setLoadingAllocated(true);
    if (effTenantId) {
      getAssignedContentApi(effTenantId, effUserId)
        .then((res: any) => {
          const courses = res?.courses || [];
          setAllocatedCourses(courses);

          const dMap: Record<string, string> = {};
          courses.forEach((item: any) => {
            const cid = item.course?.id || item.courseId || item.id;
            if (cid && item.dueDate) dMap[cid] = item.dueDate;
          });
          setDueDatesMap(dMap);
        })
        .catch(console.error)
        .finally(() => setLoadingAllocated(false));
    } else {
      setLoadingAllocated(false);
    }
  }, [effUserId, effTenantId]);

  // Combined assigned trainings (strictly Courses only - no Career Paths or standalone Lessons)
  const assignedTrainings = useMemo(() => {
    const list = (allLearnings || []).filter((item: any) => {
      if (!isLearningContentVisible(item, effectiveRole)) return false;
      // Member flow restriction: only Courses
      if (item.type && item.type !== "course") return false;
      return true;
    });

    return list.map((item: any) => {
      const dueDateStr = dueDatesMap[item.id] || item.dueDate;
      const dueDate = dueDateStr ? new Date(dueDateStr) : null;
      const now = new Date();
      const isOverdue = dueDate ? dueDate < now && (item.progress || 0) < 100 : false;
      const isDueSoon = dueDate ? Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) <= 7 && (item.progress || 0) < 100 : false;
      const isCertified = certifiedCourseIds.has(item.id);

      return {
        ...item,
        type: "course",
        resolvedDueDate: dueDateStr,
        isOverdue,
        isDueSoon,
        isCertified,
      };
    });
  }, [allLearnings, dueDatesMap, effectiveRole, certifiedCourseIds]);

  // Metrics computation
  const totalAssigned = assignedTrainings.length;
  const inProgressList = assignedTrainings.filter((t: any) => (t.progress || 0) > 0 && (t.progress || 0) < 100);
  const completedList = assignedTrainings.filter((t: any) => (t.progress || 0) >= 100 || t.statusText === "Completed" || t.isCertified);
  const overdueList = assignedTrainings.filter((t: any) => t.isOverdue);
  const dueSoonList = assignedTrainings.filter((t: any) => t.isDueSoon);

  // Expiring certifications (mock/real expiry within 30 days)
  const expiringCertifications = useMemo(() => {
    return userCertificates.filter((cert: any) => {
      if (!cert.expiryDate) return false;
      const expiry = new Date(cert.expiryDate);
      const diffDays = Math.ceil((expiry.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      return diffDays <= 30 && diffDays > 0;
    });
  }, [userCertificates]);

  // Most recent in-progress training for "Quick Resume"
  const recentResumeTraining = inProgressList[0] || (assignedTrainings.length > 0 ? assignedTrainings[0] : null);

  // Filtered list based on active tab and search
  const filteredTrainings = useMemo(() => {
    let result = assignedTrainings;
    if (activeTab === "in-progress") {
      result = inProgressList;
    } else if (activeTab === "due-soon") {
      result = assignedTrainings.filter((t: any) => t.isDueSoon || t.isOverdue);
    } else if (activeTab === "completed") {
      result = completedList;
    } else if (activeTab === "expiring") {
      result = assignedTrainings.filter((t: any) => t.isCertified);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((t: any) =>
        t.title?.toLowerCase().includes(q) ||
        t.category?.toLowerCase().includes(q) ||
        t.type?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [assignedTrainings, inProgressList, completedList, activeTab, searchQuery]);

  // Member Identity
  const firstName = profile?.profile?.firstName || (profile as any)?.firstName || "Learner";
  const lastName = profile?.profile?.lastName || (profile as any)?.lastName || "";
  const employeeId = (profile as any)?.employeeId || (profile as any)?.empId || (profile?.id ? `EMP-${profile.id.substring(0, 6).toUpperCase()}` : "EMP-04821");
  const department = (profile as any)?.department || (profile as any)?.site || "Operations & Safety";

  if (isProfileLoading || loadingAllocated || isLoadingLearnings) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 md:p-10 space-y-8 animate-pulse">
        <Skeleton className="h-44 w-full rounded-3xl" />
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-3xl" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 pb-16">
      {/* ── EXPIRING CERTIFICATION WARNING ALERT ── */}
      {expiringCertifications.length > 0 && (
        <div className="bg-amber-500 text-white px-4 py-2.5 shadow-sm text-sm font-medium flex items-center justify-between">
          <div className="flex items-center gap-2 max-w-5xl mx-auto w-full">
            <AlertTriangle className="w-5 h-5 shrink-0 animate-bounce" />
            <span>
              <strong>Certification Expiry Notice:</strong> You have {expiringCertifications.length} certification(s) expiring within 30 days. Please complete recertification modules.
            </span>
            <button
              onClick={() => setActiveTab("expiring")}
              className="ml-auto underline font-bold hover:text-amber-100 whitespace-nowrap text-xs uppercase tracking-wider"
            >
              Review Now
            </button>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* ── TOP UTILITY BAR (Member Info, Language Switcher, Offline Indicator) ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
          {/* Member Identity & Role */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-indigo-100">
              {firstName.charAt(0)}{lastName ? lastName.charAt(0) : ""}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">{firstName} {lastName}</h2>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                  {employeeId}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                {(profile as any)?.role || "Learner"} · {department}
              </p>
            </div>
          </div>

          {/* Right Controls: Language Selector & Offline Mode Toggle */}
          <div className="flex items-center gap-3">
            {/* Preferred Language Selector */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
                className="flex items-center gap-2 px-3.5 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 transition-colors shadow-sm"
              >
                <Globe className="w-3.5 h-3.5 text-indigo-600" />
                <span>{LANGUAGES.find((l) => l.code === selectedLanguage)?.flag}</span>
                <span>{LANGUAGES.find((l) => l.code === selectedLanguage)?.name}</span>
              </button>

              {isLangDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-1.5 animate-in fade-in slide-in-from-top-2">
                  <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Preferred Language
                  </div>
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => handleLanguageChange(lang.code)}
                      className="w-full flex items-center justify-between px-3 py-2 text-xs text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <span>{lang.flag}</span>
                        <span className={selectedLanguage === lang.code ? "font-bold text-indigo-600" : ""}>
                          {lang.name}
                        </span>
                      </span>
                      {selectedLanguage === lang.code && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Offline Storage / Status Toggle */}
            <button
              onClick={() => {
                setOfflineMode(!offlineMode);
                toast.info(offlineMode ? "Online training mode active" : "Offline mode active: Accessing downloaded content");
              }}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                offlineMode
                  ? "bg-emerald-500 text-white border-emerald-600 shadow-sm"
                  : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
              }`}
              title="Toggle offline downloaded content mode"
            >
              {offlineMode ? <WifiOff className="w-3.5 h-3.5" /> : <Wifi className="w-3.5 h-3.5 text-slate-400" />}
              <span>{offlineMode ? "Offline Ready" : "Online"}</span>
            </button>
          </div>
        </div>

        {/* ── MEMBER HERO WORKFLOW BANNER ── */}
        <div className="relative overflow-hidden rounded-3xl bg-[#0B1120] text-white p-6 md:p-8 shadow-xl border border-slate-800">
          <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-950/80 text-indigo-300 border border-indigo-800/60">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>Employee Learning & Development Portal</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                Welcome back, {firstName}!
              </h1>
              <p className="text-sm text-slate-300 leading-relaxed">
                Review your mandatory compliance trainings, resume interactive learning modules, complete post-training assessments, and access your verified digital certificates.
              </p>
            </div>

            {/* Quick Resume CTA card */}
            {recentResumeTraining && (
              <div className="w-full lg:w-96 bg-[#131C31] rounded-2xl p-5 border border-slate-700/80 shadow-2xl shrink-0">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-bold uppercase tracking-wider text-[11px] text-indigo-400 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-indigo-400" />
                    Resume Last Position
                  </span>
                  <span className="font-black text-indigo-300 bg-indigo-950/80 px-2 py-0.5 rounded-md border border-indigo-800/50">
                    {recentResumeTraining.progress || 0}%
                  </span>
                </div>
                <h4 className="text-sm font-bold text-white truncate mb-2.5">
                  {recentResumeTraining.title}
                </h4>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mb-4 border border-slate-700/60">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-indigo-400 rounded-full transition-all duration-500"
                    style={{ width: `${recentResumeTraining.progress || 0}%` }}
                  />
                </div>
                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => navigate(`/course-player?id=${recentResumeTraining.id}&type=${recentResumeTraining.type || "course"}`)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Resume Module</span>
                  </button>
                  <button
                    onClick={() => navigate(`/course-details?id=${recentResumeTraining.id}&type=${recentResumeTraining.type || "course"}`)}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-xs rounded-xl border border-slate-700 transition-colors cursor-pointer"
                  >
                    Details
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Member 13-Step Flow Ribbon (Quick Links) */}
          <div className="mt-6 pt-5 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
            <span className="font-bold text-slate-300">Your Learner Flow:</span>
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-slate-800/90 border border-slate-700 text-slate-200 font-mono text-[11px] font-semibold">1. Login ✓</span>
              <span className="text-slate-500 font-bold">→</span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-800/90 border border-slate-700 text-slate-200 font-mono text-[11px] font-semibold">2. Language ✓</span>
              <span className="text-slate-500 font-bold">→</span>
              <span className="px-2.5 py-1 rounded-lg bg-indigo-600 border border-indigo-500 text-white font-bold font-mono text-[11px] shadow-sm">3. Dashboard</span>
              <span className="text-slate-500 font-bold">→</span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-800/90 border border-slate-700 text-slate-200 font-mono text-[11px] font-semibold">4. Assigned Modules</span>
              <span className="text-slate-500 font-bold">→</span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-800/90 border border-slate-700 text-slate-200 font-mono text-[11px] font-semibold">8. Assessment</span>
              <span className="text-slate-500 font-bold">→</span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-800/90 border border-slate-700 text-slate-200 font-mono text-[11px] font-semibold">10. Certificate</span>
              <span className="text-slate-500 font-bold">→</span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-800/90 border border-slate-700 text-slate-200 font-mono text-[11px] font-semibold">11. Feedback</span>
            </div>
          </div>
        </div>

        {/* ── METRICS OVERVIEW (Assigned, In-Progress, Completed, Overdue, Expiry) ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          {/* Total Assigned */}
          <div
            onClick={() => setActiveTab("all")}
            className={`bg-white rounded-2xl p-4 border transition-all cursor-pointer shadow-sm hover:shadow-md ${
              activeTab === "all" ? "border-indigo-500 ring-2 ring-indigo-500/20" : "border-slate-200/80"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Total Assigned</span>
              <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                <BookOpen className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-extrabold text-slate-900">{totalAssigned}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Active curriculum</div>
          </div>

          {/* In Progress */}
          <div
            onClick={() => setActiveTab("in-progress")}
            className={`bg-white rounded-2xl p-4 border transition-all cursor-pointer shadow-sm hover:shadow-md ${
              activeTab === "in-progress" ? "border-sky-500 ring-2 ring-sky-500/20" : "border-slate-200/80"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">In Progress</span>
              <div className="w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center text-sky-600">
                <Play className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-extrabold text-sky-700">{inProgressList.length}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Resumable modules</div>
          </div>

          {/* Completed */}
          <div
            onClick={() => setActiveTab("completed")}
            className={`bg-white rounded-2xl p-4 border transition-all cursor-pointer shadow-sm hover:shadow-md ${
              activeTab === "completed" ? "border-emerald-500 ring-2 ring-emerald-500/20" : "border-slate-200/80"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Completed</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-extrabold text-emerald-700">{completedList.length}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">100% criteria met</div>
          </div>

          {/* Overdue / Due Soon */}
          <div
            onClick={() => setActiveTab("due-soon")}
            className={`bg-white rounded-2xl p-4 border transition-all cursor-pointer shadow-sm hover:shadow-md ${
              activeTab === "due-soon" ? "border-rose-500 ring-2 ring-rose-500/20" : "border-slate-200/80"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Overdue / Soon</span>
              <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-extrabold text-rose-600">{overdueList.length + dueSoonList.length}</div>
            <div className="text-[11px] text-rose-600/80 mt-0.5">{overdueList.length} overdue training(s)</div>
          </div>

          {/* Certificates & Expiry */}
          <div
            onClick={() => setActiveTab("expiring")}
            className={`bg-white rounded-2xl p-4 border transition-all cursor-pointer shadow-sm hover:shadow-md ${
              activeTab === "expiring" ? "border-amber-500 ring-2 ring-amber-500/20" : "border-slate-200/80"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Certifications</span>
              <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
                <Award className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-extrabold text-amber-700">{userCertificates.length}</div>
            <div className="text-[11px] text-amber-600 mt-0.5">
              {expiringCertifications.length > 0 ? `${expiringCertifications.length} expiring soon` : "All valid"}
            </div>
          </div>
        </div>

        {/* ── MAIN CONTENT TABS & TRAINING GRID ── */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-6">
          {/* Header & Controls */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                {activeTab === "all" && "All Assigned Trainings"}
                {activeTab === "in-progress" && "In-Progress Learning Modules"}
                {activeTab === "due-soon" && "Urgent Due Dates & Overdue"}
                {activeTab === "completed" && "Completed & Certified Courses"}
                {activeTab === "expiring" && "Certifications & Expiry Status"}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Showing {filteredTrainings.length} training program(s)
              </p>
            </div>

            {/* Search Input & Action Shortcuts */}
            <div className="flex items-center gap-3">
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search trainings or SOPs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                />
              </div>

              <button
                onClick={() => navigate("/my-learning")}
                className="px-3.5 py-2 text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-xl border border-indigo-200 transition-colors whitespace-nowrap"
              >
                View Full Progress →
              </button>
            </div>
          </div>

          {/* Cards Grid */}
          {filteredTrainings.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto text-slate-400">
                <BookOpen className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-700">No training modules found</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                No trainings match the selected filter. Switch tabs or clear your search query to see your assigned programs.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredTrainings.map((item: any) => {
                const thumbUrl = item.thumbnailAsset?.signedUrl || item.thumbnailAsset?.url || item.thumbnailAsset?.fileUrl || item.thumbnailUrl || item.coverImageUrl;
                const progress = Math.round(item.progress || 0);
                const isComplete = progress === 100 || item.statusText === "Completed" || item.isCertified;

                return (
                  <div
                    key={item.id}
                    className="group bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-xl hover:border-indigo-300 transition-all duration-300 flex flex-col overflow-hidden"
                  >
                    {/* Thumbnail & Badges */}
                    <div className="relative h-44 bg-slate-100 overflow-hidden">
                      {thumbUrl ? (
                        <img
                          src={thumbUrl}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-tr from-indigo-50 to-slate-100 text-indigo-400">
                          <BookOpen className="w-10 h-10 mb-1" />
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Learning Module</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-transparent to-transparent" />

                      {/* Top Badges */}
                      <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/90 backdrop-blur-md text-slate-800 shadow-sm">
                          {item.category || item.type || "Training"}
                        </span>
                        {item.isMandatory && (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-600 text-white shadow-sm">
                            Mandatory
                          </span>
                        )}
                      </div>

                      {/* Bottom Due Date Alert on Thumbnail */}
                      {item.resolvedDueDate && (
                        <div className="absolute bottom-2.5 left-3 flex items-center gap-1.5 text-xs text-white drop-shadow font-medium">
                          <Calendar className="w-3.5 h-3.5 text-indigo-300" />
                          <span>Due: {new Date(item.resolvedDueDate).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>

                    {/* Card Body */}
                    <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                      <div>
                        <div className="flex items-center justify-between text-xs text-slate-400 font-medium mb-1.5">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {item.duration || "45 mins"}
                          </span>
                          <span>
                            {item.lessonsCount ? `${item.lessonsCount} Modules` : "SOP & Assessment"}
                          </span>
                        </div>

                        <h4 className="text-sm font-bold text-slate-900 line-clamp-2 group-hover:text-indigo-600 transition-colors leading-snug">
                          {item.title}
                        </h4>
                        <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                          {item.description || "Comprehensive procedural guidance, safety compliance and knowledge checks."}
                        </p>
                      </div>

                      {/* Progress Bar & Status */}
                      <div className="space-y-1.5 pt-2 border-t border-slate-100">
                        <div className="flex items-center justify-between text-xs font-semibold">
                          <span className={isComplete ? "text-emerald-600" : progress > 0 ? "text-indigo-600" : "text-slate-400"}>
                            {isComplete ? "Completed" : progress > 0 ? `${progress}% In Progress` : "Not Started"}
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
                              isComplete ? "bg-emerald-500" : progress > 0 ? "bg-indigo-600" : "bg-slate-200"
                            }`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>

                      {/* Action Button Row */}
                      <div className="flex items-center gap-2 pt-1">
                        {isComplete ? (
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
                              title="Take Post-Training Assessment"
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
          )}
        </div>

        {/* ── FOOTER QUICK ACCESS / SUPPORT SHORTCUTS ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div
            onClick={() => navigate("/course-resources")}
            className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center gap-4"
          >
            <div className="w-12 h-12 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center shrink-0">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">SOPs & Toolbox Talks</h4>
              <p className="text-xs text-slate-500 mt-0.5">Reference documents, safety manuals & checklists</p>
            </div>
          </div>

          <div
            onClick={() => navigate("/issue-reporting")}
            className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center gap-4"
          >
            <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">Training Feedback & Issues</h4>
              <p className="text-xs text-slate-500 mt-0.5">Submit feedback or report issues with modules</p>
            </div>
          </div>

          <div
            onClick={() => navigate("/help")}
            className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center gap-4"
          >
            <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
              <HelpCircle className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">Member Help Center</h4>
              <p className="text-xs text-slate-500 mt-0.5">Guides on assessments, certificates & offline playback</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MemberDashboard;
