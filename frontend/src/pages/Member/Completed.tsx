import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { useProfileStore } from "../../store/profile.store";
import { useProfile } from "../../hooks/profile/useProfile";
import { useUserCertificates, useDownloadCertificate } from "../../hooks/course-completed/courseCompleted";
import { useMemberLearningCourses, useProgressDashboard } from "../../hooks/member-learning/memberLearning";
import { useCourseCompletedStore } from "../../store/course-completed/courseCompleted.store";

import ShareModal from "./ShareModal";
import { Skeleton } from "../../components/ui/Skeleton/Skeleton";

// Lucide icons
import {
    Award,
    BookOpen,
    Clock,
    Eye,
    Share2,
    Download,
    List,
    Grid,
    CheckCircle2,
    Sparkles,
    Calendar,
    ShieldCheck,
    Search,
    X,
    Play,
    Compass,
    ArrowUpRight,
    GraduationCap,
    SlidersHorizontal,
    ChevronRight,
    Loader2
} from "lucide-react";

const Completed: React.FC = () => {
    const navigate = useNavigate();
    const { getProfile } = useProfile();
    const userId = useProfileStore((state) => state.profile?.id) || "";

    useEffect(() => {
        if (!userId) {
            getProfile();
        }
    }, [userId, getProfile]);

    const [viewMode, setViewMode] = useState<"list" | "grid">("list");
    const [sortOrder, setSortOrder] = useState<"recent" | "oldest" | "name">("recent");
    const [searchQuery, setSearchQuery] = useState("");
    const [filterCategory, setFilterCategory] = useState<"all" | "credential" | "course" | "path">("all");
    const [downloadingCertId, setDownloadingCertId] = useState<string | null>(null);

    const { setSelectedCertificateId } = useCourseCompletedStore();
    const [localShareModalOpen, setLocalShareModalOpen] = useState(false);
    const [shareItem, setShareItem] = useState<{
        id: string;
        title: string;
        thumbnailUrl?: string;
        type?: string;
        shareToken?: string;
        proofId?: string;
    } | null>(null);

    // Fetch user certificates
    const { data: certsResponse, isLoading: isLoadingCerts } = useUserCertificates(userId, undefined, !!userId);

    // Fetch member learning courses
    const { data: coursesData, isLoading: isLoadingCourses } = useMemberLearningCourses(
        userId,
        "My Learning",
        {},
        "",
        "recent",
        1,
        1000,
        !!userId
    );

    // Fetch dashboard learning time metrics
    const { data: progressDashboard, isLoading: isLoadingDashboard } = useProgressDashboard(userId, !!userId);

    const isLoading = isLoadingCerts || isLoadingCourses || isLoadingDashboard;
    const downloadMutation = useDownloadCertificate();

    const handleDownload = async (certId: string, title?: string) => {
        if (!certId) return;
        try {
            setDownloadingCertId(certId);
            toast.loading(`Preparing verified diploma for ${title || "Course"}...`, { id: `download-${certId}` });
            const blob = await downloadMutation.mutateAsync({ certificateId: certId, userId });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `nexus-certificate-${certId}.pdf`;
            a.click();
            URL.revokeObjectURL(url);
            toast.success("Diploma downloaded successfully!", { id: `download-${certId}` });
        } catch (err) {
            console.error("Failed to download PDF:", err);
            toast.error("Could not download certificate PDF. Please try again.", { id: `download-${certId}` });
        } finally {
            setDownloadingCertId(null);
        }
    };

    const handleShare = (cert: any) => {
        const certId = cert.originalId || cert.id;
        setSelectedCertificateId(certId);
        setShareItem({
            id: certId,
            title: cert.course?.title || cert.title || "Course Certificate",
            thumbnailUrl: cert.course?.thumbnailAsset?.fileUrl || cert.thumbnail,
            type: "certificate",
            proofId: cert.serialNumber || cert.proofId,
            shareToken: cert.verification?.verificationToken,
        });
        setLocalShareModalOpen(true);
    };

    // Calculate all items across courses and certificates
    const allCertificatesList: any[] = useMemo(() => {
        let combined: any[] = [];
        const certMap = new Map<string, string>();
        const dateMap = new Map<string, Date>();
        const serialMap = new Map<string, string>();

        // 1. Build a map of completed certificates
        if (certsResponse?.data) {
            certsResponse.data.forEach((cert: any) => {
                const certId = cert.id;
                const date = new Date(cert.issuedAt || cert.createdAt || Date.now());

                if (cert.courseId) {
                    certMap.set(cert.courseId, certId);
                    dateMap.set(cert.courseId, date);
                    if (cert.serialNumber) serialMap.set(cert.courseId, cert.serialNumber);
                }
                if (cert.course?.id) {
                    certMap.set(cert.course?.id, certId);
                    dateMap.set(cert.course?.id, date);
                    if (cert.serialNumber) serialMap.set(cert.course?.id, cert.serialNumber);
                }
                if (cert.career_path_id) {
                    certMap.set(cert.career_path_id, certId);
                    dateMap.set(cert.career_path_id, date);
                    if (cert.serialNumber) serialMap.set(cert.career_path_id, cert.serialNumber);
                }
                if (cert.career_paths?.id) {
                    certMap.set(cert.career_paths.id, certId);
                    dateMap.set(cert.career_paths.id, date);
                    if (cert.serialNumber) serialMap.set(cert.career_paths.id, cert.serialNumber);
                }

                // Fallback for the certificate itself
                certMap.set(certId, certId);
                dateMap.set(certId, date);
                if (cert.serialNumber) serialMap.set(certId, cert.serialNumber);
            });
        }

        // 2. Iterate through the courses from MemberLearning API
        const seenIds = new Set<string>();
        if (coursesData?.data) {
            coursesData.data.forEach((course: any) => {
                const progress = course.progress ?? 0;
                const isCompleted = course.statusText === "Completed" || progress === 100;
                const isInProgress = progress >= 5 && progress < 100;

                let durationMins = course.totalDurationMins ?? 0;

                if (isCompleted || isInProgress) {
                    seenIds.add(course.id);
                    combined.push({
                        id: course.id,
                        courseId: course.id,
                        status: isCompleted ? "completed" : "inprogress",
                        progressPercentage: isCompleted ? 100 : progress,
                        sortDate: dateMap.get(course.id)?.getTime() || new Date().getTime(),
                        originalId: certMap.get(course.id),
                        serialNumber: serialMap.get(course.id),
                        course: {
                            title: course.title,
                            category: { name: course.category },
                            thumbnailAsset: { fileUrl: course.thumbnailUrl },
                            duration: durationMins,
                            isCredential: true,
                            subjectName: course.subjectName
                        },
                        careerPathId: null
                    });
                }
            });
        }

        // 3. Include any earned certificates that weren't in coursesData (e.g. Career Paths or extra credentials)
        if (certsResponse?.data) {
            certsResponse.data.forEach((cert: any) => {
                const targetCourseId = cert.courseId || cert.course?.id;
                const targetPathId = cert.careerPathId || cert.career_path_id || cert.career_paths?.id;
                const targetId = targetCourseId || targetPathId || cert.id;

                if (!seenIds.has(targetId) && !seenIds.has(cert.id)) {
                    seenIds.add(targetId);
                    seenIds.add(cert.id);
                    const isPath = !!targetPathId;
                    combined.push({
                        id: cert.id,
                        courseId: isPath ? null : targetId,
                        careerPathId: isPath ? targetPathId : null,
                        status: "completed",
                        progressPercentage: 100,
                        sortDate: new Date(cert.issuedAt || cert.createdAt || Date.now()).getTime(),
                        originalId: cert.id,
                        serialNumber: cert.serialNumber,
                        grade: cert.grade,
                        course: {
                            title: cert.courseTitle || cert.course?.title || cert.career_paths?.title || "Accredited Credential",
                            category: { name: cert.course?.category?.name || (isPath ? "Career Path" : "SOP Certification") },
                            thumbnailAsset: { fileUrl: cert.course?.thumbnailAsset?.fileUrl || cert.course?.thumbnailUrl || cert.thumbnail },
                            duration: cert.course?.duration || 60,
                            isCredential: true,
                            subjectName: cert.course?.subjectName || (isPath ? "PATH" : "SOP")
                        }
                    });
                }
            });
        }

        return combined;
    }, [certsResponse, coursesData]);

    // Compute stats
    const stats = useMemo(() => {
        const total = allCertificatesList.length;
        const completed = allCertificatesList.filter((c) => c.status === "completed").length;
        const credentials = allCertificatesList.filter((c) => c.course?.isCredential && c.status === "completed").length;
        const courses = allCertificatesList.filter((c) => !c.careerPathId).length;
        const paths = allCertificatesList.filter((c) => !!c.careerPathId).length;

        return { total, completed, credentials, courses, paths };
    }, [allCertificatesList]);

    // Filter and sort certificates for display
    const filteredCertificates = useMemo(() => {
        let list = [...allCertificatesList];

        // Filter by category tab
        if (filterCategory === "credential") {
            list = list.filter((item) => item.course?.isCredential && item.status === "completed");
        } else if (filterCategory === "course") {
            list = list.filter((item) => !item.careerPathId);
        } else if (filterCategory === "path") {
            list = list.filter((item) => !!item.careerPathId);
        }

        // Filter by search query
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase().trim();
            list = list.filter((item) =>
                (item.course?.title && item.course.title.toLowerCase().includes(q)) ||
                (item.course?.category?.name && item.course.category.name.toLowerCase().includes(q)) ||
                (item.course?.subjectName && item.course.subjectName.toLowerCase().includes(q)) ||
                (item.serialNumber && item.serialNumber.toLowerCase().includes(q))
            );
        }

        // Sort
        if (sortOrder === "recent") {
            list.sort((a, b) => b.sortDate - a.sortDate);
        } else if (sortOrder === "oldest") {
            list.sort((a, b) => a.sortDate - b.sortDate);
        } else if (sortOrder === "name") {
            list.sort((a, b) => {
                const titleA = a.course?.title?.toLowerCase() || "";
                const titleB = b.course?.title?.toLowerCase() || "";
                return titleA.localeCompare(titleB);
            });
        }

        return list;
    }, [allCertificatesList, filterCategory, searchQuery, sortOrder]);

    // Format total learning time
    const totalSeconds = progressDashboard?.totalLearningTime || 0;
    const totalMinutes = Math.floor(totalSeconds / 60);
    const hrs = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;

    let learningTimeStr = "";
    if (hrs > 0) {
        learningTimeStr += `${hrs} hr${hrs !== 1 ? "s" : ""} `;
    }
    if (mins > 0 || hrs === 0) {
        learningTimeStr += `${mins} min${mins !== 1 ? "s" : ""}`;
    }
    learningTimeStr = learningTimeStr.trim();

    if (isLoading) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8 animate-pulse">
                {/* Header Skeleton */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
                    <div className="space-y-2.5">
                        <Skeleton className="h-6 w-36 rounded-full" />
                        <Skeleton className="h-8 w-72" />
                        <Skeleton className="h-4 w-96 max-w-full" />
                    </div>
                    <div className="flex gap-3">
                        <Skeleton className="h-11 w-36 rounded-xl" />
                        <Skeleton className="h-11 w-40 rounded-xl" />
                    </div>
                </div>

                {/* Metrics Stats Row Skeleton */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
                            <div className="flex justify-between items-center">
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="h-10 w-10 rounded-xl" />
                            </div>
                            <Skeleton className="h-9 w-24" />
                            <Skeleton className="h-3 w-44" />
                        </div>
                    ))}
                </div>

                {/* Filter Toolbar Skeleton */}
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                    <Skeleton className="h-10 w-72 rounded-xl" />
                    <div className="flex gap-3">
                        <Skeleton className="h-10 w-32 rounded-xl" />
                        <Skeleton className="h-10 w-24 rounded-xl" />
                    </div>
                </div>

                {/* Table / List Rows Skeleton */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm divide-y divide-slate-100 dark:divide-slate-800">
                    {[1, 2, 3, 4].map((k) => (
                        <div key={k} className="p-5 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-4 flex-1">
                                <Skeleton className="w-14 h-14 rounded-xl shrink-0" />
                                <div className="space-y-2 flex-1">
                                    <Skeleton className="h-5 w-3/4 max-w-md" />
                                    <Skeleton className="h-3.5 w-1/3 max-w-xs" />
                                </div>
                            </div>
                            <div className="hidden sm:flex items-center gap-3">
                                <Skeleton className="h-8 w-20 rounded-full" />
                                <Skeleton className="h-8 w-24 rounded-full" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8 min-h-screen">
            {/* Page Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-200 dark:border-slate-800">
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200/60 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60">
                            <ShieldCheck className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                            Official Learning Record
                        </span>
                        <span className="text-xs text-slate-400 font-medium hidden sm:inline">&bull;</span>
                        <span className="text-xs text-slate-500 font-medium hidden sm:inline">
                            Verified Nexus Academy Diplomas
                        </span>
                    </div>

                    <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                        Completed Courses & Credentials
                    </h1>

                    <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
                        Review your verified credentials, download official PDF diplomas, or rewatch training SOPs at any time.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <button
                        onClick={() => navigate("/certificate-detail")}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-amber-200 bg-amber-50/80 hover:bg-amber-100 text-amber-900 font-bold text-sm shadow-sm transition-all duration-200 dark:bg-amber-950/30 dark:border-amber-800/80 dark:text-amber-300 dark:hover:bg-amber-950/50"
                    >
                        <Award className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                        <span>Certificates Studio</span>
                    </button>

                    <button
                        onClick={() => navigate("/member-learning")}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-sm shadow-sm hover:shadow transition-all duration-200"
                    >
                        <Compass className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        <span>Browse Catalog</span>
                    </button>
                </div>
            </div>

            {/* Metrics Stats Row (3 Cards) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                {/* Card 1: Verified Credentials */}
                <div className="relative overflow-hidden bg-gradient-to-br from-amber-50/70 via-white to-amber-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-amber-950/20 border border-amber-200/80 dark:border-amber-800/40 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300">
                    <div className="flex items-start justify-between">
                        <div>
                            <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                                Verified Diplomas
                            </span>
                            <div className="mt-2 text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                                {stats.credentials}
                            </div>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/40 border border-amber-200 dark:border-amber-800/60 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-inner shrink-0">
                            <Award className="w-6 h-6" />
                        </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-amber-200/60 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1.5 font-medium">
                            <ShieldCheck className="w-4 h-4 text-amber-600" />
                            Nexus Accredited
                        </span>
                        <span className="font-semibold text-amber-700 dark:text-amber-400">100% Verified</span>
                    </div>
                </div>

                {/* Card 2: Completed Courses */}
                <div className="relative overflow-hidden bg-gradient-to-br from-emerald-50/70 via-white to-emerald-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-emerald-950/20 border border-emerald-200/80 dark:border-emerald-800/40 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300">
                    <div className="flex items-start justify-between">
                        <div>
                            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                                Modules Mastered
                            </span>
                            <div className="mt-2 text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                                {stats.completed}
                            </div>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-inner shrink-0">
                            <CheckCircle2 className="w-6 h-6" />
                        </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-emerald-200/60 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1.5 font-medium">
                            <GraduationCap className="w-4 h-4 text-emerald-600" />
                            Curriculum Completed
                        </span>
                        <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                            {stats.courses} Courses &bull; {stats.paths} Paths
                        </span>
                    </div>
                </div>

                {/* Card 3: Learning Time Investment */}
                <div className="relative overflow-hidden bg-gradient-to-br from-indigo-50/70 via-white to-indigo-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950/20 border border-indigo-200/80 dark:border-indigo-800/40 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300">
                    <div className="flex items-start justify-between">
                        <div>
                            <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
                                Learning Investment
                            </span>
                            <div className="mt-2 text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                                {learningTimeStr || "0 mins"}
                            </div>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 border border-indigo-200 dark:border-indigo-800/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-inner shrink-0">
                            <Clock className="w-6 h-6" />
                        </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-indigo-200/60 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1.5 font-medium">
                            <Sparkles className="w-4 h-4 text-indigo-600" />
                            Active SOP Training
                        </span>
                        <span className="font-semibold text-indigo-700 dark:text-indigo-400">Dedicated Study</span>
                    </div>
                </div>
            </div>

            {/* Filter & Search Controls */}
            <div className="space-y-4">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Search Bar */}
                    <div className="relative flex-1 max-w-md">
                        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search completed courses, topics, or certificates..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-9 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery("")}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    {/* Filter Pills & View Toggles */}
                    <div className="flex flex-wrap items-center gap-3">
                        {/* Category filter pills */}
                        <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold">
                            <button
                                onClick={() => setFilterCategory("all")}
                                className={`px-3 py-1.5 rounded-lg transition-all ${
                                    filterCategory === "all"
                                        ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm"
                                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                                }`}
                            >
                                All ({stats.total})
                            </button>
                            <button
                                onClick={() => setFilterCategory("credential")}
                                className={`px-3 py-1.5 rounded-lg transition-all ${
                                    filterCategory === "credential"
                                        ? "bg-white dark:bg-slate-900 text-amber-700 dark:text-amber-400 shadow-sm"
                                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                                }`}
                            >
                                Diplomas ({stats.credentials})
                            </button>
                            <button
                                onClick={() => setFilterCategory("course")}
                                className={`px-3 py-1.5 rounded-lg transition-all ${
                                    filterCategory === "course"
                                        ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm"
                                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                                }`}
                            >
                                Courses ({stats.courses})
                            </button>
                            <button
                                onClick={() => setFilterCategory("path")}
                                className={`px-3 py-1.5 rounded-lg transition-all ${
                                    filterCategory === "path"
                                        ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm"
                                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                                }`}
                            >
                                Paths ({stats.paths})
                            </button>
                        </div>

                        {/* Sort Selector */}
                        <div className="relative">
                            <select
                                value={sortOrder}
                                onChange={(e) => setSortOrder(e.target.value as "recent" | "oldest" | "name")}
                                className="appearance-none pl-3.5 pr-8 py-2 text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 cursor-pointer shadow-sm hover:border-slate-300"
                            >
                                <option value="recent">Newest first</option>
                                <option value="oldest">Oldest first</option>
                                <option value="name">Title (A-Z)</option>
                            </select>
                            <SlidersHorizontal className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        </div>

                        {/* View Mode Toggle */}
                        <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                            <button
                                onClick={() => setViewMode("list")}
                                title="List view"
                                className={`p-1.5 rounded-lg transition-all ${
                                    viewMode === "list"
                                        ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm"
                                        : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                }`}
                            >
                                <List className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setViewMode("grid")}
                                title="Grid view"
                                className={`p-1.5 rounded-lg transition-all ${
                                    viewMode === "grid"
                                        ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm"
                                        : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                }`}
                            >
                                <Grid className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Results count text */}
                <div className="flex items-center justify-between text-xs text-slate-500 font-medium px-1">
                    <span>
                        Showing <strong className="text-slate-900 dark:text-white">{filteredCertificates.length}</strong> items
                        {searchQuery && ` matching "${searchQuery}"`}
                    </span>
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery("")}
                            className="text-amber-700 dark:text-amber-400 hover:underline font-semibold"
                        >
                            Clear search
                        </button>
                    )}
                </div>
            </div>

            {/* Main Content: List or Grid */}
            {filteredCertificates.length === 0 ? (
                <div className="py-20 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-900/30 p-8 space-y-4">
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-100/60 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-center justify-center text-amber-600 dark:text-amber-400">
                        <Award className="w-8 h-8" />
                    </div>
                    <div className="space-y-1">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                            {searchQuery ? "No matching courses found" : "No completed courses yet"}
                        </h3>
                        <p className="text-sm text-slate-500 max-w-md mx-auto">
                            {searchQuery
                                ? `No completed courses or certificates match your search query "${searchQuery}". Try different keywords.`
                                : "Once you finish your training modules and pass the post-quiz, your verified certificates and completions will appear here."}
                        </p>
                    </div>
                    <div>
                        {searchQuery ? (
                            <button
                                onClick={() => setSearchQuery("")}
                                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-sm transition-all"
                            >
                                Reset Search
                            </button>
                        ) : (
                            <button
                                onClick={() => navigate("/member-learning")}
                                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-sm transition-all"
                            >
                                Explore Learning Catalog
                            </button>
                        )}
                    </div>
                </div>
            ) : viewMode === "list" ? (
                /* Premium List View */
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                    <th className="py-3.5 px-6">Course / Credential</th>
                                    <th className="py-3.5 px-6 text-center">Type & Category</th>
                                    <th className="py-3.5 px-6">Completion</th>
                                    <th className="py-3.5 px-6 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                                {filteredCertificates.map((cert) => {
                                    const targetId = cert.courseId || cert.course?.id || cert.careerPathId;
                                    const isPath = !!cert.careerPathId;
                                    const isDone = cert.status === "completed";
                                    const isDownloading = downloadingCertId === cert.originalId;

                                    return (
                                        <tr
                                            key={cert.id}
                                            className="group hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                                        >
                                            {/* Column 1: Thumbnail & Course Info */}
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-4">
                                                    <div
                                                        onClick={() => {
                                                            if (isDone) {
                                                                navigate(`/certificate-detail?${isPath ? "careerPathId=" + targetId : "courseId=" + targetId}`);
                                                            } else {
                                                                navigate(`/course-player?courseId=${targetId}`);
                                                            }
                                                        }}
                                                        className="w-14 h-14 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0 overflow-hidden relative cursor-pointer group/thumb shadow-sm"
                                                    >
                                                        {cert.course?.thumbnailAsset?.fileUrl ? (
                                                            <img
                                                                src={cert.course.thumbnailAsset.fileUrl}
                                                                alt=""
                                                                className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform duration-300"
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center bg-indigo-50/60 dark:bg-indigo-950/30 text-indigo-500">
                                                                <BookOpen className="w-6 h-6" />
                                                            </div>
                                                        )}
                                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center">
                                                            <Eye className="w-5 h-5 text-white" />
                                                        </div>
                                                    </div>

                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-2">
                                                            <h4
                                                                onClick={() => {
                                                                    if (isDone) {
                                                                        navigate(`/certificate-detail?${isPath ? "careerPathId=" + targetId : "courseId=" + targetId}`);
                                                                    } else {
                                                                        navigate(`/course-player?courseId=${targetId}`);
                                                                    }
                                                                }}
                                                                className="font-bold text-sm sm:text-base text-slate-900 dark:text-white hover:text-amber-600 dark:hover:text-amber-400 cursor-pointer transition-colors leading-snug"
                                                            >
                                                                {cert.course?.title || "Unknown Course"}
                                                            </h4>
                                                        </div>

                                                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                                                            <span>{cert.course?.category?.name || "Operations Training"}</span>
                                                            {cert.serialNumber && (
                                                                <>
                                                                    <span>&bull;</span>
                                                                    <span className="font-mono text-[11px] text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-200/60 dark:border-amber-800/40">
                                                                        {cert.serialNumber}
                                                                    </span>
                                                                </>
                                                            )}
                                                            {cert.grade && (
                                                                <>
                                                                    <span>&bull;</span>
                                                                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                                                        Score: {cert.grade}
                                                                    </span>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Column 2: Category & Badges */}
                                            <td className="py-4 px-6 text-center">
                                                <div className="inline-flex flex-col items-center gap-1.5">
                                                    <span
                                                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase ${
                                                            isPath
                                                                ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60"
                                                                : "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60"
                                                        }`}
                                                    >
                                                        {isPath ? "Career Path" : "Course SOP"}
                                                    </span>

                                                    {isDone && (
                                                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                                                            <ShieldCheck className="w-3 h-3" />
                                                            Verified
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Column 3: Completion Date */}
                                            <td className="py-4 px-6">
                                                {isDone ? (
                                                    <div className="space-y-0.5">
                                                        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200">
                                                            <Calendar className="w-3.5 h-3.5 text-amber-600" />
                                                            <span>
                                                                {new Date(cert.sortDate).toLocaleDateString("en-GB", {
                                                                    day: "numeric",
                                                                    month: "short",
                                                                    year: "numeric",
                                                                })}
                                                            </span>
                                                        </div>
                                                        <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                                                            100% Completed
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-1">
                                                        <div className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                                                            In Progress ({cert.progressPercentage}%)
                                                        </div>
                                                        <div className="w-24 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full bg-amber-500 rounded-full"
                                                                style={{ width: `${cert.progressPercentage}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </td>

                                            {/* Column 4: Quick Actions */}
                                            <td className="py-4 px-6 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {/* View Certificate */}
                                                    <button
                                                        title="View Certificate"
                                                        onClick={() => {
                                                            if (isDone) {
                                                                navigate(
                                                                    `/certificate-detail?${
                                                                        isPath ? "careerPathId=" + targetId : "courseId=" + targetId
                                                                    }`
                                                                );
                                                            } else {
                                                                navigate(`/course-player?courseId=${targetId}`);
                                                            }
                                                        }}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-200 dark:border-amber-800/80 bg-amber-50/70 dark:bg-amber-950/40 hover:bg-amber-100 text-amber-900 dark:text-amber-300 text-xs font-bold transition-all shadow-2xs"
                                                    >
                                                        <Eye className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                                                        <span className="hidden sm:inline">Diploma</span>
                                                    </button>

                                                    {/* Rewatch SOP in Course Player */}
                                                    {!isPath && (
                                                        <button
                                                            title="Rewatch Training SOP"
                                                            onClick={() => navigate(`/course-player?courseId=${targetId}`)}
                                                            className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors shadow-2xs"
                                                        >
                                                            <Play className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 fill-indigo-600 dark:fill-indigo-400" />
                                                        </button>
                                                    )}

                                                    {/* Download PDF */}
                                                    {isDone && (
                                                        <button
                                                            title="Download Official Diploma PDF"
                                                            disabled={isDownloading}
                                                            onClick={() => {
                                                                if (cert.originalId) {
                                                                    handleDownload(cert.originalId, cert.course?.title);
                                                                } else {
                                                                    navigate(
                                                                        `/certificate-detail?${
                                                                            isPath ? "careerPathId=" + targetId : "courseId=" + targetId
                                                                        }`
                                                                    );
                                                                }
                                                            }}
                                                            className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors shadow-2xs disabled:opacity-50"
                                                        >
                                                            {isDownloading ? (
                                                                <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600" />
                                                            ) : (
                                                                <Download className="w-3.5 h-3.5" />
                                                            )}
                                                        </button>
                                                    )}

                                                    {/* Share Certificate */}
                                                    {isDone && (
                                                        <button
                                                            title="Share Credential"
                                                            onClick={() => handleShare(cert)}
                                                            className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors shadow-2xs"
                                                        >
                                                            <Share2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                /* Premium Grid View */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredCertificates.map((cert) => {
                        const targetId = cert.courseId || cert.course?.id || cert.careerPathId;
                        const isPath = !!cert.careerPathId;
                        const isDone = cert.status === "completed";
                        const isDownloading = downloadingCertId === cert.originalId;

                        return (
                            <div
                                key={cert.id}
                                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col group"
                            >
                                {/* Thumbnail Cover */}
                                <div className="h-48 relative overflow-hidden bg-slate-100 dark:bg-slate-800">
                                    {cert.course?.thumbnailAsset?.fileUrl ? (
                                        <img
                                            src={cert.course.thumbnailAsset.fileUrl}
                                            alt=""
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center bg-indigo-50/60 dark:bg-indigo-950/30 text-indigo-400">
                                            <BookOpen className="w-10 h-10 mb-2" />
                                            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                                Training Module
                                            </span>
                                        </div>
                                    )}

                                    {/* Gradient overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                                    {/* Top badges */}
                                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                                        <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-white/90 dark:bg-slate-900/90 backdrop-blur-md text-slate-800 dark:text-slate-200 shadow-sm border border-white/20">
                                            {cert.course?.subjectName || (isPath ? "PATH" : "SOP")}
                                        </span>

                                        <span
                                            className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider backdrop-blur-md shadow-sm border border-white/20 ${
                                                isPath
                                                    ? "bg-amber-500/90 text-white"
                                                    : "bg-emerald-600/90 text-white"
                                            }`}
                                        >
                                            {isPath ? "Career Path" : "Accredited"}
                                        </span>
                                    </div>

                                    {/* Bottom cover bar */}
                                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-white/90 font-medium">
                                        <span className="flex items-center gap-1">
                                            <Calendar className="w-3.5 h-3.5 text-amber-300" />
                                            {new Date(cert.sortDate).toLocaleDateString("en-GB", {
                                                day: "numeric",
                                                month: "short",
                                                year: "numeric",
                                            })}
                                        </span>

                                        {cert.grade && (
                                            <span className="bg-white/20 backdrop-blur-xs px-2 py-0.5 rounded-full text-[11px] font-bold text-white">
                                                Score: {cert.grade}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Card Body */}
                                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
                                            <span>{cert.course?.category?.name || "Professional Development"}</span>
                                            {cert.serialNumber && (
                                                <span className="font-mono text-[10px] text-amber-700 dark:text-amber-400">
                                                    {cert.serialNumber}
                                                </span>
                                            )}
                                        </div>

                                        <h3
                                            onClick={() => {
                                                if (isDone) {
                                                    navigate(
                                                        `/certificate-detail?${
                                                            isPath ? "careerPathId=" + targetId : "courseId=" + targetId
                                                        }`
                                                    );
                                                } else {
                                                    navigate(`/course-player?courseId=${targetId}`);
                                                }
                                            }}
                                            className="font-bold text-base text-slate-900 dark:text-white line-clamp-2 leading-snug group-hover:text-amber-600 dark:group-hover:text-amber-400 cursor-pointer transition-colors"
                                        >
                                            {cert.course?.title || "Unknown Course"}
                                        </h3>
                                    </div>

                                    {/* Progress / Status Indicator */}
                                    <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                                <ShieldCheck className="w-3.5 h-3.5" />
                                                {isDone ? "Diploma Issued" : "In Progress"}
                                            </span>
                                            <span className="text-slate-400 font-medium">
                                                {isDone ? "100%" : `${cert.progressPercentage}%`}
                                            </span>
                                        </div>
                                        <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full ${
                                                    isDone ? "bg-emerald-500" : "bg-amber-500"
                                                }`}
                                                style={{ width: `${cert.progressPercentage || 100}%` }}
                                            />
                                        </div>
                                    </div>

                                    {/* Card Action Buttons */}
                                    <div className="flex items-center gap-2 pt-1">
                                        <button
                                            onClick={() => {
                                                if (isDone) {
                                                    navigate(
                                                        `/certificate-detail?${
                                                            isPath ? "careerPathId=" + targetId : "courseId=" + targetId
                                                        }`
                                                    );
                                                } else {
                                                    navigate(`/course-player?courseId=${targetId}`);
                                                }
                                            }}
                                            className="flex-1 py-2 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-950/60 border border-amber-200/80 dark:border-amber-800/60 text-amber-900 dark:text-amber-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-2xs"
                                        >
                                            <Award className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                                            <span>View Diploma</span>
                                        </button>

                                        {!isPath && (
                                            <button
                                                title="Rewatch SOP in Course Player"
                                                onClick={() => navigate(`/course-player?courseId=${targetId}`)}
                                                className="w-8 h-8 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-300 transition-colors shadow-2xs shrink-0"
                                            >
                                                <Play className="w-3.5 h-3.5 text-indigo-600 fill-indigo-600" />
                                            </button>
                                        )}

                                        {isDone && (
                                            <>
                                                <button
                                                    title="Download Official Diploma PDF"
                                                    disabled={isDownloading}
                                                    onClick={() => {
                                                        if (cert.originalId) {
                                                            handleDownload(cert.originalId, cert.course?.title);
                                                        } else {
                                                            navigate(
                                                                `/certificate-detail?${
                                                                    isPath ? "careerPathId=" + targetId : "courseId=" + targetId
                                                                }`
                                                            );
                                                        }
                                                    }}
                                                    className="w-8 h-8 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-300 transition-colors shadow-2xs shrink-0 disabled:opacity-50"
                                                >
                                                    {isDownloading ? (
                                                        <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600" />
                                                    ) : (
                                                        <Download className="w-3.5 h-3.5" />
                                                    )}
                                                </button>

                                                <button
                                                    title="Share Credential"
                                                    onClick={() => handleShare(cert)}
                                                    className="w-8 h-8 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-300 transition-colors shadow-2xs shrink-0"
                                                >
                                                    <Share2 className="w-3.5 h-3.5" />
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

            {/* Share Modal */}
            {localShareModalOpen && shareItem && (
                <ShareModal
                    isOpen={localShareModalOpen}
                    onClose={() => {
                        setLocalShareModalOpen(false);
                        setShareItem(null);
                    }}
                    content={shareItem}
                />
            )}
        </div>
    );
};

export default Completed;
