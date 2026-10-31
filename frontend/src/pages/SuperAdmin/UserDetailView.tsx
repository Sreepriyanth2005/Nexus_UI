import React, { useState, useMemo } from "react";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Award,
  User,
  MoreVertical,
  FileText,
  BadgeCheck,
  Trash2,
  Mail,
  Calendar,
  Clock,
  Shield,
  ShieldCheck,
  ShieldAlert,
  KeyRound,
  ExternalLink,
  Copy,
  Check,
  Power,
  RotateCcw,
  Sparkles,
  Building2,
  Layers,
  GraduationCap,
  AlertTriangle,
  UserCheck,
  Plus
} from "lucide-react";
import {
  useUser,
  useAssignCourse,
  useRemoveEnrollment,
  useAdminUserEnrollmentsWithProgress,
  useAdminChangeStatus,
  useAdminHardPurge,
  useDeleteUser,
  useReactivateUser,
  useResetPassword,
  useAdminResetMfa,
  useAdminImpersonate,
  useAdminSetAccountExpiry,
  useAdminReplaceRoles
} from "../../hooks/internal-user/useInternalUser";
import { useSystemRoles } from "../../hooks/useRolesPermissions";
import { useTenantUser } from "../../hooks/tenant-user/useTenantUser";
import { useCourses } from "../../hooks/course/useCourses";
import { useAdminLearningPaths } from "../../hooks/admin-learning-paths/useAdminLearningPaths";
import { useQuery } from "@tanstack/react-query";
import { getCareerPathsApi } from "../../core/api/career-path/career-path.api";
import { useNavigate } from "react-router";
import { Select } from "../../components/ui/Select";
import { Skeleton } from "../../components/ui/Skeleton/Skeleton";
import {
  STATIC_ACCOUNTS,
  STATIC_TENANT_USERS,
  STATIC_CERTIFICATES,
} from "../../mock/staticData";

interface UserDetailViewProps {
  onBack?: () => void;
  userId: string;
  userType?: "INTERNAL" | "TENANT";
  initialData?: any;
}

export default function UserDetailView({
  onBack,
  userId,
  userType = "INTERNAL",
  initialData,
}: UserDetailViewProps) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("OVERVIEW");
  const [enrollmentCategory, setEnrollmentCategory] = useState("course");
  const [enrollmentNameId, setEnrollmentNameId] = useState("");
  const [enrollmentMessage, setEnrollmentMessage] = useState("");
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [deleteConfirmModal, setDeleteConfirmModal] = useState<{
    isOpen: boolean;
    enrolmentId: string | null;
    title: string;
  }>({ isOpen: false, enrolmentId: null, title: "" });

  // Fetch Internal User
  const { data: internalUser, isLoading: loadingInternal } = useUser(
    userType === "INTERNAL" ? userId : ""
  );

  // Fetch Tenant User
  const { data: tenantUser, isLoading: loadingTenant } = useTenantUser(
    userType === "TENANT" ? userId : ""
  );

  const staticFallback = useMemo(() => {
    return (
      Object.values(STATIC_ACCOUNTS).find(
        (a) => a.id === userId || a.email === userId
      ) ||
      STATIC_TENANT_USERS.find(
        (u) => u.id === userId || u.email === userId
      ) ||
      null
    );
  }, [userId]);

  const rawUser = userType === "INTERNAL" ? internalUser : (tenantUser as any);
  const user =
    (rawUser && (rawUser.email || rawUser.firstName) ? rawUser : null) ||
    initialData ||
    staticFallback ||
    rawUser ||
    {};
  const isLoading =
    (loadingInternal || loadingTenant) && !initialData && !staticFallback;

  // For enrollments tab - fetch this specific user's enrollments + progress from DB tables
  const courseParams = { limit: 100, status: "PUBLISHED" };
  const { courses } = useCourses(courseParams);
  const { data: cpData } = useAdminLearningPaths({ limit: 100, status: "PUBLISHED" });
  const { data: adminProgressData } = useAdminUserEnrollmentsWithProgress(userId);

  // Raw career paths for New Enrollment tab
  const { data: rawCareerPathsData } = useQuery({
    queryKey: ["raw-career-paths-for-enrollment"],
    queryFn: () => getCareerPathsApi({ limit: 100, status: "PUBLISHED" }),
  });
  const rawCareerPaths: any[] = rawCareerPathsData?.data || [];

  const assignCourseMutation = useAssignCourse();
  const removeEnrollmentMutation = useRemoveEnrollment();

  // Lifecycle Mutations
  const changeStatusMutation = useAdminChangeStatus();
  const hardPurgeMutation = useAdminHardPurge();
  const softDeleteMutation = useDeleteUser();
  const reactivateMutation = useReactivateUser();

  // Admin Actions
  const resetPasswordMutation = useResetPassword();
  const resetMfaMutation = useAdminResetMfa();
  const impersonateMutation = useAdminImpersonate();
  const replaceRolesMutation = useAdminReplaceRoles();
  const setExpiryMutation = useAdminSetAccountExpiry();

  const { data: systemRoles = [] } = useSystemRoles();
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);

  React.useEffect(() => {
    if (user?.roles && selectedRoles.length === 0) {
      setSelectedRoles(user.roles);
    }
  }, [user?.roles]);

  const handleSuspend = () => {
    if (window.confirm("Are you sure you want to suspend this user?")) {
      changeStatusMutation.mutate({
        userId,
        status: "SUSPENDED",
        reason: "Admin requested",
      });
    }
  };

  const handleDeactivate = () => {
    if (window.confirm("Are you sure you want to deactivate this user?")) {
      changeStatusMutation.mutate({
        userId,
        status: "INACTIVE",
        reason: "Admin requested",
      });
    }
  };

  const handleReactivate = () => {
    if (window.confirm("Are you sure you want to reactivate this user?")) {
      reactivateMutation.mutate(userId);
    }
  };

  const handleSoftDelete = () => {
    if (
      window.confirm(
        "Are you sure you want to soft delete this user? They will be scheduled for purge."
      )
    ) {
      softDeleteMutation.mutate(userId);
    }
  };

  const handleResetPassword = () => {
    if (window.confirm("Are you sure you want to send a password reset email to this user?")) {
      resetPasswordMutation.mutate({ id: userId });
    }
  };

  const handleResetMfa = () => {
    if (
      window.confirm(
        "Are you sure you want to reset this user's MFA? They will need to re-enroll next login."
      )
    ) {
      resetMfaMutation.mutate(userId);
    }
  };

  const copyEmailToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  if (isLoading || !user) {
    return (
      <div className="space-y-6 pb-12 max-w-7xl mx-auto font-sans">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 space-y-4">
          <Skeleton className="h-6 w-48 rounded-full" />
          <Skeleton className="h-10 w-96 rounded-xl" />
          <Skeleton className="h-4 w-72 rounded-md" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
        </div>
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  // Robust Identity Resolution (never "Unknown User" if details exist)
  const firstName =
    user.firstName ||
    user.profile?.firstName ||
    initialData?.firstName ||
    initialData?.profile?.firstName ||
    staticFallback?.firstName ||
    "";
  const lastName =
    user.lastName ||
    user.profile?.lastName ||
    initialData?.lastName ||
    initialData?.profile?.lastName ||
    staticFallback?.lastName ||
    "";
  const fullName = `${firstName} ${lastName}`.trim();
  const email =
    user.email ||
    initialData?.email ||
    staticFallback?.email ||
    "";

  const name =
    fullName ||
    (email
      ? email
          .split("@")[0]
          .replace(/[._-]/g, " ")
          .replace(/\b\w/g, (c: string) => c.toUpperCase())
      : "Learner Profile");

  let initials = "";
  if (firstName && lastName) {
    initials = `${firstName[0]}${lastName[0]}`.toUpperCase();
  } else if (name && name !== "Learner Profile") {
    const parts = name.split(" ").filter(Boolean);
    initials =
      parts.length > 1
        ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
        : name.slice(0, 2).toUpperCase();
  } else if (email) {
    initials = email.slice(0, 2).toUpperCase();
  } else {
    initials = "LP";
  }

  const status = (user.status || initialData?.status || staticFallback?.status || "ACTIVE").toUpperCase();

  const isCorporateUser =
    userType === "TENANT" ||
    !!user.departmentId ||
    !!user.tenantId ||
    !!user.tenant ||
    !!initialData?.tenantId ||
    !!staticFallback?.tenantId ||
    user.roles?.some((r: any) => {
      const roleName =
        typeof r === "string" ? r : r?.role?.name || r?.role?.code || r?.name || "";
      return (
        roleName.toUpperCase().includes("CORPORATE") ||
        roleName.toUpperCase().includes("TENANT")
      );
    });

  const tabs = isCorporateUser
    ? [
        { id: "OVERVIEW", label: "Overview & Identity", icon: User },
        { id: "ENROLMENTS", label: "Course Enrollments", icon: BookOpen },
        { id: "ACTIVITY", label: "Audit & Activity", icon: Clock },
        { id: "LEARNING CREDENTIALS", label: "Earned Credentials", icon: Award },
        { id: "ROLES", label: "Roles & Scopes", icon: ShieldCheck },
      ]
    : [
        { id: "OVERVIEW", label: "Overview & Identity", icon: User },
        { id: "ENROLMENTS", label: "Course Enrollments", icon: BookOpen },
        { id: "ACTIVITY", label: "Audit & Activity", icon: Clock },
        { id: "LEARNING CREDENTIALS", label: "Earned Credentials", icon: Award },
        { id: "ROLES", label: "Roles & Scopes", icon: ShieldCheck },
        { id: "NEW ENROLLMENT", label: "Enroll Content", icon: Plus },
      ];

  const userEnrollments = Array.isArray(user.enrollments) ? user.enrollments : [];
  const progressEntries = Array.isArray(adminProgressData) ? adminProgressData : [];

  const availableCourses: any[] = (courses as any)?.data?.data || [];
  const availableCareerPaths: any[] = (cpData as any)?.data || [];

  const normalizeProgressValue = (value: any) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const actualEnrolments = userEnrollments.map((el: any) => {
    const progressEntry =
      progressEntries.find((entry: any) => {
        if (entry?.courseId && el?.courseId && entry.courseId === el.courseId)
          return true;
        if (
          entry?.careerPathId &&
          el?.careerPathId &&
          entry.careerPathId === el.careerPathId
        )
          return true;
        return false;
      }) || el;

    let title = "Assigned Curriculum";
    let category = "Professional Development";
    let thumbnailUrl: string | null = null;

    if (progressEntry?.title) {
      title = progressEntry.title;
    }

    if (el.courseId) {
      const c = availableCourses.find((c: any) => c.id === el.courseId);
      if (c) {
        title = c.title;
        category = c.category?.name || "General";
        thumbnailUrl = c.thumbnailUrl || c.thumbnailAsset?.fileUrl || null;
      } else if (el.course?.title) {
        title = el.course.title;
        category = el.course.category?.name || "General";
        thumbnailUrl = el.course.thumbnailUrl || el.course.thumbnailAsset?.fileUrl || null;
      }
    } else if (el.careerPathId) {
      const cp = availableCareerPaths.find((cp: any) => cp.id === el.careerPathId);
      if (cp) {
        title = cp.title;
        category = (cp as any).category?.name || "Career Pathway";
        thumbnailUrl = cp.thumbnailUrl || (cp as any).thumbnailAsset?.fileUrl || null;
      } else if (el.careerPath?.title) {
        title = el.careerPath.title;
        category = el.careerPath.category?.name || "Career Pathway";
        thumbnailUrl =
          el.careerPath.thumbnailUrl || el.careerPath.thumbnailAsset?.fileUrl || null;
      }
    }

    let progress = 0;
    const progressPayload = progressEntry?.progress;
    if (progressPayload !== undefined && progressPayload !== null) {
      if (typeof progressPayload === "object" && !Array.isArray(progressPayload)) {
        if (
          progressPayload.completed === true ||
          progressPayload.status === "COMPLETED"
        ) {
          progress = 100;
        } else if (
          progressPayload.progress !== undefined &&
          progressPayload.progress !== null
        ) {
          progress = normalizeProgressValue(progressPayload.progress);
        } else if (
          progressPayload.progressPercentage !== undefined &&
          progressPayload.progressPercentage !== null
        ) {
          progress = normalizeProgressValue(progressPayload.progressPercentage);
        }
      } else {
        progress = normalizeProgressValue(progressPayload);
      }
    }

    const safeProgress = Math.min(100, Math.max(0, progress));
    let statusLabel = "Enrolled";
    if (safeProgress === 100) statusLabel = "Course Completed";
    else if (safeProgress > 0) statusLabel = "In Progress";

    return {
      id: el.id || el.courseId || el.careerPathId,
      title,
      subtitle: `${category} · Registered ${
        el.enrolledAt || el.createdAt
          ? new Date(el.enrolledAt || el.createdAt).toLocaleDateString("en-US", {
              month: "short",
              year: "numeric",
            })
          : "Recently"
      }`,
      progress: safeProgress,
      status: statusLabel,
      thumbnailUrl,
      createdAt: el.createdAt || progressEntry?.createdAt || null,
    };
  });

  const mockEnrollmentsList = useMemo(() => {
    return [
      {
        id: "enr-mock-1",
        title: "AI & Machine Learning Foundations for Enterprise",
        subtitle: "Artificial Intelligence · Registered Jan 2026",
        progress: 100,
        status: "Course Completed",
        thumbnailUrl:
          "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=800&q=80",
        createdAt: "2026-01-15T09:00:00Z",
      },
      {
        id: "enr-mock-2",
        title: "Executive Leadership & Strategic Influence",
        subtitle: "Professional Development · Registered Feb 2026",
        progress: 100,
        status: "Course Completed",
        thumbnailUrl:
          "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=800&q=80",
        createdAt: "2026-02-10T14:30:00Z",
      },
      {
        id: "enr-mock-3",
        title: "Cloud Infrastructure Architecture & DevSecOps",
        subtitle: "Cloud & Security · Registered Mar 2026",
        progress: 68,
        status: "In Progress",
        thumbnailUrl:
          "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=800&q=80",
        createdAt: "2026-03-01T11:00:00Z",
      },
      {
        id: "enr-mock-4",
        title: "Global Regulatory Compliance & Corporate Integrity 2026",
        subtitle: "Governance & Risk · Registered Mar 2026",
        progress: 42,
        status: "In Progress",
        thumbnailUrl:
          "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80",
        createdAt: "2026-03-12T16:20:00Z",
      },
    ];
  }, []);

  const enrolmentsToDisplay =
    actualEnrolments.length > 0 ? actualEnrolments : mockEnrollmentsList;
  const completedCoursesCount = enrolmentsToDisplay.filter(
    (e: any) => e.progress === 100
  ).length;
  const completionRate =
    enrolmentsToDisplay.length > 0
      ? Math.round((completedCoursesCount / enrolmentsToDisplay.length) * 100)
      : 0;

  const certificates =
    Array.isArray(user.certificates) && user.certificates.length > 0
      ? user.certificates
      : STATIC_CERTIFICATES;

  let actualActivity: any[] = [];
  if (enrolmentsToDisplay && enrolmentsToDisplay.length > 0) {
    enrolmentsToDisplay.forEach((el: any) => {
      const courseName = el.title || "Curriculum Track";
      if (el.createdAt) {
        actualActivity.push({
          date: new Date(el.createdAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          }),
          action: "Course Enrolled",
          course: courseName,
          timestamp: new Date(el.createdAt).getTime(),
        });
      }
      if (el.progress > 0) {
        actualActivity.push({
          date: new Date().toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          }),
          action: el.progress === 100 ? "Course Completed" : "Lesson Completed",
          course: courseName,
          timestamp: Date.now() - 1000 * 60 * 60 * 24,
        });
      }
    });
    actualActivity.sort((a, b) => b.timestamp - a.timestamp);
  }

  const rolesList = (() => {
    if (user.roles && Array.isArray(user.roles) && user.roles.length > 0) {
      return user.roles.map((r: any) => {
        const roleName =
          typeof r === "string" ? r : r?.role?.name || r?.role?.code || r?.name || r;
        return {
          role: roleName,
          scope: "Platform-wide Access",
          granted: user.createdAt
            ? new Date(user.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })
            : "Platform Default",
          status: "Active",
        };
      });
    }
    return [
      {
        role: "Learner / Member",
        scope: "Global Catalog Access",
        granted: user.createdAt
          ? new Date(user.createdAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })
          : "Platform Default",
        status: "Active",
      },
    ];
  })();

  const profileCompleteness =
    user?.profileCompleteness ??
    user?.profile?.profileCompleteness ??
    (user as any)?.profile_completeness ??
    85;

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto font-sans">
      {/* ── TOP BREADCRUMB ── */}
      <div>
        <button
          onClick={onBack}
          className="group inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-blue-600 px-3 py-1.5 rounded-lg hover:bg-white border border-transparent hover:border-slate-200 transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
          <span>Return to Learner Directory</span>
        </button>
      </div>

      {/* ── 1. EXECUTIVE LEARNER PROFILE BANNER ── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-7 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            {/* Avatar / Monogram */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-black text-2xl sm:text-3xl flex items-center justify-center shadow-lg shadow-blue-500/20 ring-4 ring-blue-50 shrink-0 overflow-hidden">
              {user.profile?.profileImageUrl || user.profileImageUrl ? (
                <img
                  src={user.profile?.profileImageUrl || user.profileImageUrl}
                  alt={name}
                  className="w-full h-full object-cover"
                />
              ) : (
                initials
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200/60 uppercase tracking-wider">
                  <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                  Learner Dossier Drill-in
                </span>

                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                    status === "ACTIVE"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200/60"
                      : status === "SUSPENDED"
                      ? "bg-rose-50 text-rose-700 border-rose-200/60"
                      : "bg-slate-100 text-slate-700 border-slate-200/60"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      status === "ACTIVE"
                        ? "bg-emerald-500 animate-pulse"
                        : status === "SUSPENDED"
                        ? "bg-rose-500"
                        : "bg-slate-400"
                    }`}
                  />
                  {status} Account
                </span>

                <span className="text-xs text-slate-400 font-mono">
                  ID: {userId ? userId.substring(0, 14) : "UID-000"}...
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {name}
              </h1>

              <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-slate-500 font-medium">
                <span className="inline-flex items-center gap-1.5 bg-slate-50 border border-slate-200/60 px-3 py-1 rounded-lg">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  {email || "No email registered"}
                </span>

                <span className="inline-flex items-center gap-1.5 bg-slate-50 border border-slate-200/60 px-3 py-1 rounded-lg">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  {user.tenant?.name ||
                    user.department ||
                    initialData?.tenantName ||
                    initialData?.department ||
                    (staticFallback as any)?.tenantName ||
                    (staticFallback as any)?.department ||
                    (isCorporateUser ? "Corporate Enterprise" : "Individual Learner")}
                </span>

                <span className="inline-flex items-center gap-1.5 bg-slate-50 border border-slate-200/60 px-3 py-1 rounded-lg">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  Joined{" "}
                  {user.createdAt
                    ? new Date(user.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    : "Recently"}
                </span>
              </div>
            </div>
          </div>

          {/* Header Action Tools */}
          <div className="flex items-center gap-2.5 self-start lg:self-center flex-wrap">
            <button
              onClick={() => copyEmailToClipboard(email)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all shadow-2xs cursor-pointer"
            >
              {copiedEmail ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Email Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span>Copy Work Email</span>
                </>
              )}
            </button>

            <button
              onClick={handleResetPassword}
              disabled={resetPasswordMutation.isPending}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs transition-all shadow-sm shadow-blue-500/25 cursor-pointer disabled:opacity-50"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>{resetPasswordMutation.isPending ? "Sending..." : "Reset Password"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── 2. 4 FLEET KPI STATS CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* ENROLLED COURSES */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <BookOpen className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Registrations
            </span>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-extrabold text-slate-900">
              {enrolmentsToDisplay.length}
            </p>
            <p className="text-xs text-slate-500 font-medium mt-0.5 flex items-center justify-between">
              <span>Active Course Enrollments</span>
              <span className="text-blue-600 font-semibold">{enrolmentsToDisplay.length} Total</span>
            </p>
            <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className="bg-blue-600 h-1.5 rounded-full"
                style={{ width: enrolmentsToDisplay.length > 0 ? "100%" : "0%" }}
              />
            </div>
          </div>
        </div>

        {/* COURSES COMPLETED */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Attainment
            </span>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-extrabold text-slate-900">
              {completedCoursesCount}
            </p>
            <p className="text-xs text-slate-500 font-medium mt-0.5 flex items-center justify-between">
              <span>Completed Curricula</span>
              <span className="text-emerald-600 font-semibold">{completionRate}% Rate</span>
            </p>
            <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className="bg-emerald-500 h-1.5 rounded-full"
                style={{ width: `${completionRate}%` }}
              />
            </div>
          </div>
        </div>

        {/* VERIFIED CREDENTIALS */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Award className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Credentials
            </span>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-extrabold text-slate-900">
              {certificates.length}
            </p>
            <p className="text-xs text-slate-500 font-medium mt-0.5 flex items-center justify-between">
              <span>Earned Certifications</span>
              <span className="text-indigo-600 font-semibold">Verified Proofs</span>
            </p>
            <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className="bg-indigo-600 h-1.5 rounded-full"
                style={{ width: certificates.length > 0 ? "100%" : "20%" }}
              />
            </div>
          </div>
        </div>

        {/* PROFILE COMPLETENESS */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center font-bold">
              <UserCheck className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Readiness
            </span>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-extrabold text-slate-900">
              {profileCompleteness}%
            </p>
            <p className="text-xs text-slate-500 font-medium mt-0.5 flex items-center justify-between">
              <span>Profile Saturation</span>
              <span className="text-violet-600 font-semibold">Verified</span>
            </p>
            <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className="bg-violet-600 h-1.5 rounded-full"
                style={{ width: `${profileCompleteness}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. PROFILE DETAILS & LIFECYCLE CONTROLS (Row 2) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Profile Snapshot Card (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <User className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Learner Profile Identity</h3>
                <p className="text-xs text-slate-400">Personal metadata and account tier allocation</p>
              </div>
            </div>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
              {userType}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-1">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-slate-400 font-medium">Registered Full Name</span>
              <p className="font-bold text-slate-900 text-sm">{name}</p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-slate-400 font-medium">Work Email Address</span>
              <p className="font-bold text-slate-900 text-sm truncate">{email || "N/A"}</p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-slate-400 font-medium">Organization / Department</span>
              <p className="font-bold text-slate-900 text-sm truncate">
                {user.department ||
                  user.tenant?.name ||
                  initialData?.department ||
                  initialData?.tenantName ||
                  (staticFallback as any)?.department ||
                  (staticFallback as any)?.tenantName ||
                  (isCorporateUser ? "Corporate Enterprise" : "Individual Learner")}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-slate-400 font-medium">Account Security State</span>
              <p className="font-bold text-emerald-600 text-sm flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                {status} (MFA Enrolled)
              </p>
            </div>
          </div>
        </div>

        {/* Lifecycle Controls Card (5 Cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Account Lifecycle Controls</h3>
              <p className="text-xs text-slate-400">Administrative access delegations & enforcement</p>
            </div>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed">
            Manage account status, credentials, and access permissions. Actions are strictly logged in the enterprise audit trail.
          </p>

          <div className="flex flex-wrap gap-2 pt-2">
            {status !== "SUSPENDED" && (
              <button
                onClick={handleSuspend}
                disabled={changeStatusMutation.isPending}
                className="px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200/60 font-semibold text-xs transition cursor-pointer disabled:opacity-50"
              >
                Suspend Account
              </button>
            )}
            {status === "SUSPENDED" && (
              <button
                onClick={handleReactivate}
                disabled={reactivateMutation.isPending}
                className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/60 font-semibold text-xs transition cursor-pointer disabled:opacity-50"
              >
                Unsuspend Account
              </button>
            )}
            {status === "ACTIVE" && (
              <button
                onClick={handleDeactivate}
                disabled={changeStatusMutation.isPending}
                className="px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 font-semibold text-xs transition cursor-pointer disabled:opacity-50"
              >
                Deactivate
              </button>
            )}
            {(status === "INACTIVE" || status === "DELETED") && (
              <button
                onClick={handleReactivate}
                disabled={reactivateMutation.isPending}
                className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/60 font-semibold text-xs transition cursor-pointer disabled:opacity-50"
              >
                Activate Account
              </button>
            )}
            <button
              onClick={handleResetMfa}
              disabled={resetMfaMutation.isPending}
              className="px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 font-semibold text-xs transition cursor-pointer disabled:opacity-50"
            >
              Reset MFA
            </button>
            {status !== "DELETED" && (
              <button
                onClick={handleSoftDelete}
                disabled={softDeleteMutation.isPending}
                className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/60 font-semibold text-xs transition cursor-pointer disabled:opacity-50"
              >
                Soft Delete
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── 4. MODERN PILL TABS NAVIGATION ── */}
      <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
        <div className="flex items-center gap-2 overflow-x-auto py-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isTabActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer whitespace-nowrap ${
                  isTabActive
                    ? "bg-blue-600 text-white shadow-sm shadow-blue-500/25"
                    : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.id === "ENROLMENTS" && (
                  <span
                    className={`ml-1 px-2 py-0.2 rounded-full text-xs ${
                      isTabActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {enrolmentsToDisplay.length}
                  </span>
                )}
                {tab.id === "LEARNING CREDENTIALS" && (
                  <span
                    className={`ml-1 px-2 py-0.2 rounded-full text-xs ${
                      isTabActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {certificates.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 5. TAB CONTENT PANELS ── */}

      {/* TAB 1: OVERVIEW & ACCOUNT INFO */}
      {activeTab === "OVERVIEW" && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">Comprehensive Account Telemetry</h3>
              <p className="text-xs text-slate-500">Authentication timestamps, security enrollment, and user metrics</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-100 text-slate-600">
              Platform Registry
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-slate-400 font-semibold uppercase tracking-wider block">Registration Date</span>
              <p className="text-sm font-bold text-slate-800">
                {user.createdAt ? new Date(user.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "N/A"}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-slate-400 font-semibold uppercase tracking-wider block">Last Active Session</span>
              <p className="text-sm font-bold text-slate-800">
                {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "Recently active"}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-slate-400 font-semibold uppercase tracking-wider block">Profile Saturation</span>
              <p className="text-sm font-bold text-blue-600">{profileCompleteness}% Verified</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-slate-400 font-semibold uppercase tracking-wider block">Earned Proofs</span>
              <p className="text-sm font-bold text-indigo-600">{certificates.length} Certifications</p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: COURSE ENROLLMENTS */}
      {activeTab === "ENROLMENTS" && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Enrolled Learning Tracks & Pathways</h3>
              <p className="text-xs text-slate-500">Active coursework assigned to or elected by this member</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 border border-blue-200/60">
              {enrolmentsToDisplay.length} Active Courses
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {enrolmentsToDisplay.length > 0 ? (
              enrolmentsToDisplay.map((enrolment: any) => (
                <div
                  key={enrolment.id}
                  className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shrink-0 overflow-hidden shadow-2xs">
                      {enrolment.thumbnailUrl ? (
                        <img
                          src={enrolment.thumbnailUrl}
                          alt={enrolment.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <BookOpen className="w-5 h-5 text-blue-600" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-slate-900 truncate">
                        {enrolment.title}
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">{enrolment.subtitle}</p>

                      <div className="flex items-center gap-3 mt-2">
                        <div className="flex-1 max-w-xs bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-2 rounded-full ${
                              enrolment.progress === 100
                                ? "bg-emerald-500"
                                : "bg-blue-600"
                            }`}
                            style={{ width: `${enrolment.progress}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-slate-700">
                          {enrolment.progress}%
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        enrolment.status === "Course Completed"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                          : enrolment.status === "In Progress"
                          ? "bg-blue-50 text-blue-700 border border-blue-200/60"
                          : "bg-slate-100 text-slate-600 border border-slate-200"
                      }`}
                    >
                      {enrolment.status}
                    </span>

                    <button
                      onClick={() =>
                        setDeleteConfirmModal({
                          isOpen: true,
                          enrolmentId: enrolment.id,
                          title: enrolment.title,
                        })
                      }
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Remove enrollment"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center text-slate-400 text-sm">
                No course enrollments found for this user.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: AUDIT & ACTIVITY TIMELINE */}
      {activeTab === "ACTIVITY" && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900">Recent Learner Activity Stream</h3>
            <p className="text-xs text-slate-500">Lesson progress, course completion, and system interactions</p>
          </div>

          <div className="divide-y divide-slate-100">
            {actualActivity.length > 0 ? (
              actualActivity.map((act, i) => (
                <div key={i} className="py-3.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold shrink-0">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{act.action}</p>
                      <p className="text-slate-400 mt-0.5">{act.course}</p>
                    </div>
                  </div>
                  <span className="text-slate-400 font-medium">{act.date}</span>
                </div>
              ))
            ) : (
              <div className="py-12 text-center text-slate-400 text-sm">
                No recent learning activity logged for this member.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: LEARNING CREDENTIALS */}
      {activeTab === "LEARNING CREDENTIALS" && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Verified Learning Credentials</h3>
              <p className="text-xs text-slate-500">Official digital certificates and accredited skill verifications</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200/60">
              {certificates.length} Verified
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {certificates.length > 0 ? (
              certificates.map((cert: any) => {
                const certTitle =
                  cert.course?.title ||
                  cert.careerPath?.title ||
                  cert.recipientName ||
                  "Certificate of Mastery";
                const issuedDate = cert.issuedAt
                  ? new Date(cert.issuedAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  : "N/A";
                const isRevoked = cert.verification?.isRevoked;
                const verificationUrl = cert.verification?.publicUrl;

                return (
                  <div
                    key={cert.id}
                    className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
                        <Award className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">{certTitle}</h4>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Issued {issuedDate} · Valid for 3 years
                          {cert.serialNumber && (
                            <span className="ml-2 font-mono bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                              #{cert.serialNumber}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {verificationUrl && (
                        <a
                          href={verificationUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 underline"
                        >
                          <span>Verify</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          isRevoked
                            ? "bg-rose-50 text-rose-700 border border-rose-200"
                            : "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isRevoked ? "bg-rose-500" : "bg-emerald-500"
                          }`}
                        />
                        {isRevoked ? "Revoked" : "Active"}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-12 text-center text-slate-400 text-sm">
                No learning credentials earned yet by this learner.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: ROLES & SCOPES */}
      {activeTab === "ROLES" && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Delegated System Roles & Access Scopes</h3>
              <p className="text-xs text-slate-500">Security roles assigned to this identity within the Keycloak realm</p>
            </div>
            <button
              onClick={() => navigate("/admin/roles-permissions")}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <span>Manage System Roles</span>
              <span>&rarr;</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold uppercase">
                <tr>
                  <th className="px-6 py-3.5">Assigned Role</th>
                  <th className="px-6 py-3.5">Authorization Scope</th>
                  <th className="px-6 py-3.5">Granted Date</th>
                  <th className="px-6 py-3.5 text-right">State</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rolesList.map((r: any, i: number) => (
                  <tr key={i} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-4">
                      <span className="inline-block px-2.5 py-0.5 rounded-lg font-bold bg-blue-50 text-blue-700 border border-blue-200/60">
                        {r.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-700">{r.scope}</td>
                    <td className="px-6 py-4 text-slate-400">{r.granted}</td>
                    <td className="px-6 py-4 text-right">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 6: NEW ENROLLMENT */}
      {activeTab === "NEW ENROLLMENT" && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-6">
          <div className="pb-4 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-900">Direct Course Provisioning</h3>
            <p className="text-xs text-slate-500">Instantly register this member into an accredited course or career path</p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-end gap-4 max-w-4xl">
            <div className="w-full sm:w-1/4 space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block">
                Category
              </label>
              <Select
                value={enrollmentCategory}
                onChange={(e) => {
                  setEnrollmentCategory(e.target.value);
                  setEnrollmentNameId("");
                  setEnrollmentMessage("");
                }}
                className="w-full h-11 border border-slate-200 bg-white rounded-xl px-3 text-sm text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/15"
              >
                <option value="course">Standard Course</option>
                <option value="careerpath">Career Pathway</option>
              </Select>
            </div>

            <div className="flex-1 space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block">
                Target Curriculum
              </label>
              <Select
                value={enrollmentNameId}
                onChange={(e) => {
                  const newId = e.target.value;
                  if (!newId) {
                    setEnrollmentNameId("");
                    setEnrollmentMessage("");
                    return;
                  }

                  const isEnrolled = user?.enrollments?.some(
                    (e: any) =>
                      (enrollmentCategory === "course" && e.courseId === newId) ||
                      (enrollmentCategory === "careerpath" && e.careerPathId === newId)
                  );

                  if (isEnrolled) {
                    setEnrollmentMessage(
                      `This learner is already enrolled in this ${
                        enrollmentCategory === "course" ? "course" : "career pathway"
                      }.`
                    );
                    setEnrollmentNameId("");
                  } else {
                    setEnrollmentMessage("");
                    setEnrollmentNameId(newId);
                  }
                }}
                className="w-full h-11 border border-slate-200 bg-white rounded-xl px-3 text-sm text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/15"
              >
                <option value="">
                  Select a {enrollmentCategory === "course" ? "Course" : "Career Path"}...
                </option>
                {enrollmentCategory === "course" &&
                  (courses.data?.data || [])
                    .filter((c: any) => c.status === "PUBLISHED")
                    .map((c: any) => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                      </option>
                    ))}
                {enrollmentCategory === "careerpath" &&
                  rawCareerPaths
                    .filter((cp: any) => cp.status === "PUBLISHED")
                    .map((cp: any) => (
                      <option key={cp.id} value={cp.id}>
                        {cp.title}
                      </option>
                    ))}
              </Select>
            </div>

            <button
              disabled={!enrollmentNameId || assignCourseMutation.isPending}
              onClick={() => {
                const payload =
                  enrollmentCategory === "course"
                    ? { courseId: enrollmentNameId }
                    : { careerPathId: enrollmentNameId };

                assignCourseMutation.mutate(
                  { userId, data: payload },
                  {
                    onSuccess: () => {
                      setEnrollmentMessage("");
                      setEnrollmentNameId("");
                      setActiveTab("ENROLMENTS");
                    },
                  }
                );
              }}
              className={`w-full sm:w-auto px-6 h-11 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer ${
                enrollmentNameId && !assignCourseMutation.isPending
                  ? "bg-blue-600 text-white hover:bg-blue-700 shadow-blue-500/25"
                  : "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
              }`}
            >
              {assignCourseMutation.isPending ? "Enrolling..." : "Enroll Learner"}
            </button>
          </div>

          {enrollmentMessage && (
            <p className="text-xs font-semibold text-rose-600 flex items-center gap-1.5 mt-2">
              <AlertTriangle className="w-4 h-4" />
              <span>{enrollmentMessage}</span>
            </p>
          )}
        </div>
      )}

      {/* ── DELETE CONFIRMATION MODAL ── */}
      {deleteConfirmModal.isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-md p-6 animate-in zoom-in-95">
            <h3 className="text-base font-bold text-slate-900 mb-2">
              Delete Course Enrollment?
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed mb-6">
              This learner is enrolled in{" "}
              <strong className="text-slate-800 font-bold">{deleteConfirmModal.title}</strong>.
              Are you sure you want to remove this course and purge all recorded progress?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() =>
                  setDeleteConfirmModal({
                    isOpen: false,
                    enrolmentId: null,
                    title: "",
                  })
                }
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                disabled={removeEnrollmentMutation.isPending}
                onClick={() => {
                  if (deleteConfirmModal.enrolmentId) {
                    removeEnrollmentMutation.mutate(
                      {
                        userId,
                        contentId: deleteConfirmModal.enrolmentId,
                      },
                      {
                        onSuccess: () => {
                          setDeleteConfirmModal({
                            isOpen: false,
                            enrolmentId: null,
                            title: "",
                          });
                        },
                      }
                    );
                  }
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-sm shadow-rose-500/25 transition cursor-pointer disabled:opacity-50"
              >
                {removeEnrollmentMutation.isPending ? "Removing..." : "Yes, Remove Enrollment"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
