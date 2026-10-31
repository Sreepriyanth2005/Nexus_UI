import React, { useState } from "react";
import { useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { useAdminCourses, useAdminCourseStats, useAdminCourseById } from "../../hooks/admin-courses/useAdminCourses";
import { useAdminCoursesStore } from "../../store/admin-courses/adminCourses.store";
import { adminCoursesApi, mapCourseToViewModel } from "../../core/api/admin-courses/adminCoursesApi";
import type { AdminCourseQueryParams } from "../../core/api/admin-courses/adminCoursesApi.types";
import { useLessons } from "../../hooks/lesson/useLessons";
import { useAuthorContentStats } from "../../hooks/review/useReviewDashboard";
import MyCourseVersion from "./MyCourseVersion";
import { useUserStore } from "../../store/user.store";
import { useAuthStore } from "../../core/auth/auth.store";
import { api } from "../../config/axios";
import { Download, Plus, X, Eye, Search, ChevronDown, ChevronsUpDown, Info } from "../../assets/icons";
import { Check, Shield, SquarePen, Archive, Clock, Inbox } from "lucide-react";
import { Button } from "../../components/ui/Button/Button";
import { Input } from "../../components/ui/Input/Input";
import { Select } from "../../components/ui/Select/Select";
import { Chip } from "../../components/ui/Chip/Chip";
import { Skeleton } from "../../components/ui/Skeleton/Skeleton";

const MyCourse = () => {
    const navigate = useNavigate();
    const [contentType, setContentType] = useState<"ALL" | "COURSE" | "STANDALONE_COURSE" | "LESSON" | "STANDALONE_LESSON">("ALL");
    const [viewStack, setViewStack] = useState<any[]>([]);

    const user = useUserStore((state: any) => state.user);
    const isSuperAdmin = user?.roles?.some((r: string) => r.toUpperCase().includes("SUPERADMIN") || r.toUpperCase().includes("SUPER_ADMIN"));
    const permissions = useAuthStore((state: any) => state.permissions || []);
    const canEdit = isSuperAdmin || permissions.includes("COURSE.UPDATE") || permissions.includes("CAREER_PATH.UPDATE") || permissions.includes("LESSON.UPDATE");
    const isSME = user?.roles?.some((r: any) => {
        const roleStr = typeof r === 'string' ? r : (r?.role?.name || r?.name || "");
        return roleStr.toUpperCase().includes("SME") || roleStr.toUpperCase().includes("SUBJECT_MATTER_EXPERT");
    });

    // Review Stats for SME
    const { data: authorStats } = useAuthorContentStats();

    // Edit Published Modal State
    const [editConfirmModal, setEditConfirmModal] = useState<{ isOpen: boolean; item: any | null }>({
        isOpen: false,
        item: null
    });
    const [isReverting, setIsReverting] = useState(false);
    // ── Zustand store ──────────────────────────────────────────────────
    const {
        search,
        filters,
        page,
        limit,
        sortBy,
        sortOrder,
        setSearch,
        setFilter,
        setPage,
        setLimit,
        resetFilters,
    } = useAdminCoursesStore();

    // ── Build query params from store state ────────────────────────────
    const queryParams: AdminCourseQueryParams = {
        page,
        limit,
        sortBy,
        sortOrder,
        ...(search ? { search } : {}),
        ...(filters.status ? { status: filters.status } : {}),
        ...(filters.difficulty ? { difficulty: filters.difficulty } : {}),
        ...(filters.visibility ? { visibility: filters.visibility } : {}),
        ...(filters.categoryId ? { categoryId: filters.categoryId } : {}),
        ...(!isSuperAdmin && user?.id ? { ownerId: user.id } : {}),
    };

    // ── TanStack Query hooks ───────────────────────────────────────────
    const { data: courseData, isLoading: isCoursesLoading, isError: isCoursesError, refetch: refetchCourses } = useAdminCourses(queryParams);

    // Fetch ALL courses for the "ALL" view so we can paginate everything on the client side
    // Always fetch ALL courses (regardless of filter view) so stats cards always show correct totals
    const { data: allCoursesResponse, isLoading: isAllCoursesLoading, isError: isAllCoursesError } = useQuery({
        queryKey: ["adminCourses", "allCourses", "list-view", isSuperAdmin ? "all" : user?.id],
        queryFn: async () => {
            const res = await adminCoursesApi.getAll();
            if (!isSuperAdmin && user?.id) {
                return { ...res, data: res.data.filter((c: any) => c.ownerId === user.id) };
            }
            return res;
        },
    });

    const { data: stats } = useAdminCourseStats();

    const lessonsParams = !isSuperAdmin && user?.id ? { ownerId: user.id } : {};
    const { data: lessonsResponse, isLoading: isLessonsLoading, isError: isLessonsError } = useLessons(lessonsParams);

    const isLoading = isAllCoursesLoading || isLessonsLoading;
    const isError = isAllCoursesError || isLessonsError;

    // ── Data Mapping ───────────────────────────────────────────────────
    // We rely on allCoursesResponse to correctly paginate client-side for all views.
    // This allows us to properly filter by "Path course" vs "Standalone course"
    // since the backend paginated endpoint does not support `isStandalone` filtering.
    const rawAll = allCoursesResponse?.data ?? [];
    const mappedCourses = rawAll.map(mapCourseToViewModel).map((c: any) => ({
        ...c,
        courseType: c.courseType === "Standalone" ? "Course" : "Path course",
        _originalType: "COURSE"
    }));

    const rawLessons = Array.isArray(lessonsResponse?.data) ? lessonsResponse.data : (lessonsResponse?.data?.data || (Array.isArray(lessonsResponse) ? lessonsResponse : []));
    const mappedLessons = rawLessons.map((l: any) => ({
        id: l.id || l._id,
        title: l.title,
        authorName: l.authorName || "Nexus Academy",
        authorRole: l.owner?.roles?.[0]?.role?.name || "Content Publisher",
        authorId: l.authorId || l.owner?.id || l.ownerId || "-",
        courseType: l.isStandalone ? "Lesson" : "Path lesson",
        domain: l.domain || "-",
        visibility: l.visibility || "-",
        enrollmentCount: l.enrollments || l.enrollmentCount || 0,
        status: l.status || "DRAFT",
        updatedAt: l.updatedAt || "-",
        _originalType: "LESSON"
    }));

    const allItems = [...mappedCourses, ...mappedLessons];

    const filteredItems = allItems.filter(item => {
        // Role check
        if (!isSuperAdmin && user?.id) {
            if (item.authorId !== user.id) {
                return false;
            }
        }

        if (contentType !== "ALL") {
            // For specific filter options
            if (contentType === "COURSE" && (item._originalType !== "COURSE" || item.courseType === "Course")) return false;
            if (contentType === "STANDALONE_COURSE" && (item._originalType !== "COURSE" || item.courseType !== "Course")) return false;
            if (contentType === "LESSON" && (item._originalType !== "LESSON" || item.courseType === "Lesson")) return false;
            if (contentType === "STANDALONE_LESSON" && (item._originalType !== "LESSON" || item.courseType !== "Lesson")) return false;
        }

        // Search filter
        if (search) {
            // In ALL view, all courses are fetched in memory without backend filtering, so we must client-side filter them.
            // In specific COURSE view, backend handles course filtering, so we skip client-side filtering for courses to avoid pagination issues.
            if (contentType === "ALL" || item._originalType !== "COURSE") {
                if (!item.title.toLowerCase().includes(search.toLowerCase())) {
                    return false;
                }
            }
        }

        // Status filter for paths and lessons (and courses in ALL view if needed, though they might not be fully supported by backend for ALL view? We will apply it just in case)
        if (filters.status) {
            if (contentType === "ALL" || item._originalType !== "COURSE") {
                if (item.status.toUpperCase() !== filters.status.toUpperCase()) return false;
            }
        }

        return true;
    });

    // ── Stats: always across ALL user content (not filtered by current view) ──
    // Build a complete unfiltered set of all the user's content for accurate card counts.
    const allCoursesForStats = (allCoursesResponse?.data ?? []).map(mapCourseToViewModel).map((c: any) => ({
        ...c,
        status: c.status || "DRAFT",
        authorId: c.authorId || c.ownerId || "-",
        _originalType: "COURSE"
    }));
    const allUserItems = [...allCoursesForStats, ...mappedLessons].filter(item => {
        if (!isSuperAdmin && user?.id) {
            const itemAuthorId = item.authorId || item.ownerId || "-";
            return itemAuthorId === user.id;
        }
        return true;
    });

    // Use backend author stats if available, otherwise compute globally
    const globalStats = authorStats ? authorStats : {
        published: allUserItems.filter(i => i.status === "PUBLISHED" || i.status === "ACTIVE").length,
        approved: allUserItems.filter(i => i.status === "PUBLISHED" || i.status === "ACTIVE").length,
        inReview: allUserItems.filter(i => i.status === "UNDER_REVIEW").length,
        submitted: allUserItems.filter(i => i.status === "PUBLISHED" || i.status === "ACTIVE").length + allUserItems.filter(i => i.status === "REJECTED").length,
        draft: allUserItems.filter(i => i.status === "DRAFT").length,
        rejected: allUserItems.filter(i => i.status === "REJECTED").length,
        archived: allUserItems.filter(i => i.status === "ARCHIVED").length,
    };

    // localStats is still kept for any pagination-related fallback
    const localStats = {
        published: filteredItems.filter(i => i.status === "PUBLISHED" || i.status === "ACTIVE").length,
        approved: filteredItems.filter(i => i.status === "PUBLISHED" || i.status === "ACTIVE").length,
        inReview: filteredItems.filter(i => i.status === "UNDER_REVIEW").length,
        submitted: filteredItems.filter(i => i.status === "PUBLISHED" || i.status === "ACTIVE").length + filteredItems.filter(i => i.status === "REJECTED").length,
        draft: filteredItems.filter(i => i.status === "DRAFT").length,
        rejected: filteredItems.filter(i => i.status === "REJECTED").length,
        archived: filteredItems.filter(i => i.status === "ARCHIVED").length,
    };

    // For SuperAdmin viewing paginated course list: use backend stats (covers all courses across pages).
    // For all other cases: use globalStats computed from fully-loaded allUserItems or authorStats API.
    const displayStats = isSME ? {
        published: authorStats?.published ?? 0,
        approved: authorStats?.approved ?? 0,
        inReview: authorStats?.inReview ?? 0,
        // Set submitted = approved + rejected as requested
        submitted: (authorStats?.approved ?? 0) + ((authorStats?.rejected ?? 0) + (authorStats?.reviewRejected ?? 0)),
        draft: authorStats?.draft ?? 0,
        rejected: (authorStats?.rejected ?? 0) + (authorStats?.reviewRejected ?? 0),
        archived: authorStats?.archived ?? 0,
    } : (isSuperAdmin && (contentType === "COURSE" || contentType === "STANDALONE_COURSE"))
        ? { ...(stats || globalStats), submitted: ((stats || globalStats)?.approved ?? 0) + ((stats || globalStats)?.rejected ?? 0) }
        : { ...globalStats, submitted: (globalStats?.approved ?? 0) + (globalStats?.rejected ?? 0) };

    // Determine the total count correctly based on client-side filtered items
    const total = filteredItems.length;

    // We apply client-side pagination for all views
    const displayItems = filteredItems.slice((page - 1) * limit, page * limit);

    const totalPages = Math.max(1, Math.ceil(filteredItems.length / limit));

    // ── Helpers ────────────────────────────────────────────────────────
    const getStatusDotColor = (status: string) => {
        switch (status?.toUpperCase()) {
            case "PUBLISHED":
            case "ACTIVE":
                return "bg-[var(--c-check)]";
            case "DRAFT":
                return "bg-[var(--ink-faint)]";
            case "ARCHIVED":
                return "bg-[var(--c-danger)]";
            default:
                return "bg-[var(--ink-faint)]";
        }
    };

    const formatDate = (dateString: string) => {
        if (!dateString || dateString === "-") return "-";
        if (!dateString.includes("T")) return dateString;
        const date = new Date(dateString);
        const diffDays = Math.floor((new Date().getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays === 0) return "Today";
        if (diffDays < 7) return `${diffDays}d ago`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
        return date.toLocaleDateString();
    };

    const formatStatus = (status: string) => {
        if (!status) return "-";
        switch (status.toUpperCase()) {
            case "PUBLISHED":
            case "ACTIVE": return "Published";
            case "DRAFT": return "Draft";
            case "ARCHIVED": return "Archived";
            case "UNDER_REVIEW":
            case "IN_REVIEW": return "In review";
            default: return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase().replace(/_/g, ' ');
        }
    };

    const startIndex = (page - 1) * limit + 1;
    const endIndex = Math.min(page * limit, total);

    const pushView = (item: any) => {
        setViewStack([...viewStack, item]);
        const searchParams = new URLSearchParams(window.location.search);
        searchParams.set("view", "true");
        navigate({ search: searchParams.toString() }, { replace: true });
    };

    const popView = () => {
        const newStack = viewStack.slice(0, -1);
        setViewStack(newStack);
        const searchParams = new URLSearchParams(window.location.search);
        if (newStack.length === 0) {
            searchParams.delete("view");
        }
        navigate({ search: searchParams.toString() }, { replace: true });
    };

    React.useEffect(() => {
        if (viewStack.length === 0) {
            const searchParams = new URLSearchParams(window.location.search);
            if (searchParams.has("view")) {
                searchParams.delete("view");
                navigate({ search: searchParams.toString() }, { replace: true });
            }
        }
    }, [viewStack.length, navigate]);

    if (viewStack.length > 0) {
        const currentItem = viewStack[viewStack.length - 1];

        // Always render Version History on view click
        return <MyCourseVersion item={currentItem} onBack={popView} />;
    }

    const handleEditClick = (e: React.MouseEvent, item: any) => {
        e.stopPropagation();
        if (item.status === "PUBLISHED" && isSuperAdmin) {
            setEditConfirmModal({ isOpen: true, item });
        } else {
            navigateToEdit(item);
        }
    };

    const navigateToEdit = (item: any) => {
        if (item._originalType === "COURSE") {
            navigate(`/admin/courses/${item.id}/edit`);
        } else if (item._originalType === "CAREER_PATH") {
            navigate(`/admin/career-paths/${item.id}/edit`);
        } else if (item._originalType === "LESSON") {
            navigate(`/standalone-lesson/${item.id}`);
        }
    };

    const handleConfirmEditPublished = async () => {
        const item = editConfirmModal.item;
        if (!item || !user?.id) return;

        try {
            setIsReverting(true);

            // 1. Create a new version of the published content to save in course_versions/career_path_versions and content_reviews
            const endpointPrefix = item._originalType === "CAREER_PATH" ? "career-paths" : item._originalType.toLowerCase() + "s";
            try {
                await api.post(`/${endpointPrefix}/${item.id}/versions`, {
                    userId: user.id,
                    comment: "Auto-saving published version before edit"
                });
            } catch (err) {
                console.warn("Failed to create version snapshot, continuing with revert:", err);
            }

            // 2. Use this publish endpoint to revert it to draft/under review for superadmin edits
            await api.post(`/reviews/${item._originalType.toLowerCase()}/${item.id}/publish`, {
                publishedById: user.id,
                comment: "SuperAdmin overriding published content to edit"
            });

            setEditConfirmModal({ isOpen: false, item: null });
            navigateToEdit(item);
        } catch (error) {
            console.error("Failed to revert published content", error);
            alert("Failed to initiate edit. Please try again.");
        } finally {
            setIsReverting(false);
        }
    };

    const handleExport = () => {
        if (!filteredItems || filteredItems.length === 0) return;

        const headers = [
            "Learning",
            "Author",
            "Role",
            "Type",
            "Domain",
            "Visibility",
            "Enrolments",
            "Status",
            "Updated"
        ];

        const escapeCsv = (str: any) => {
            if (str === null || str === undefined) return '""';
            const s = String(str);
            return `"${s.replace(/"/g, '""')}"`;
        };

        const rows = filteredItems.map((item: any) => {
            return [
                escapeCsv(item.title),
                escapeCsv(item.authorName),
                escapeCsv(item.authorRole ? item.authorRole.replace('_', ' ') : ''),
                escapeCsv(item.courseType),
                escapeCsv(item.domain),
                escapeCsv(item.visibility === "TENANT_ONLY" ? "Tenant: " + (item.tenantName || "Unknown") : "Public"),
                item.enrollmentCount || 0,
                escapeCsv(formatStatus(item.status)),
                escapeCsv(formatDate(item.updatedAt))
            ].join(",");
        });

        const csvContent = [headers.join(","), ...rows].join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `all_learnings_export_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };
    if (isLoading) {
        return (
            <div className="p-6 space-y-6 w-full">
                <div className="space-y-2 mb-8">
                    <Skeleton className="h-8 w-1/4 rounded-[var(--r-sm)]" />
                    <Skeleton className="h-4 w-1/3 rounded-[var(--r-sm)]" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <Skeleton className="h-[100px] rounded-[var(--r-lg)]" />
                    <Skeleton className="h-[100px] rounded-[var(--r-lg)]" />
                    <Skeleton className="h-[100px] rounded-[var(--r-lg)]" />
                    <Skeleton className="h-[100px] rounded-[var(--r-lg)]" />
                </div>
                <Skeleton className="h-[400px] w-full rounded-xl" />
            </div>
        );
    }

    return (
        <div className="w-full min-w-0 pb-12">
            <div>
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-[var(--space-8)] mb-[var(--space-10)] mt-[var(--space-8)]">
                    <div className="group cursor-default">
                        <div className="text-[length:var(--fs-label)] font-[var(--fw-bold)] tracking-[var(--ls-label)] text-[var(--ink-mute)] uppercase mb-1">
                            CATALOGUE MANAGEMENT
                        </div>
                        <h1 className="acourses-title text-[length:var(--fs-h1)] font-[var(--fw-extrabold)] text-[var(--ink)] tracking-tight mb-1">
                            All Learnings
                        </h1>
                        <p className="text-[length:var(--fs-meta)] text-[var(--ink-mute)] font-[var(--fw-regular)]">
                            Every course on the platform across all authors and tenants.
                        </p>
                    </div>

                    <div className="flex flex-wrap sm:flex-nowrap w-full sm:w-auto gap-[var(--space-4)] mt-[var(--space-8)] sm:mt-0">
                        <button
                            className="flex-1 sm:flex-none justify-center h-[40px] px-[14px] py-[8px] bg-[var(--btn)] border border-[var(--c-honey)] text-[var(--ink)] rounded-[var(--r-pill)] text-[length:var(--fs-meta)] font-[var(--fw-semibold)] hover:shadow-[var(--shadow-sm)] hover:-translate-y-0.5 transition-all duration-[var(--dur-fast)] flex items-center gap-[var(--space-2)] shadow-sm active:scale-95 cursor-pointer disabled:opacity-50"
                            onClick={handleExport}
                            disabled={filteredItems.length === 0}
                        >
                            <Download width={14} height={14} className="stroke-[2]" />
                            Export data
                        </button>
                        <button
                            className="flex-1 sm:flex-none justify-center h-[40px] px-[14px] py-[8px] bg-[var(--btn)] border border-[var(--c-honey)] text-[var(--ink)] rounded-[var(--r-pill)] text-[length:var(--fs-meta)] font-[var(--fw-semibold)] hover:shadow-[var(--shadow-sm)] hover:-translate-y-0.5 transition-all duration-[var(--dur-fast)] flex items-center gap-[var(--space-2)] shadow-sm active:scale-95 cursor-pointer"
                            onClick={() => navigate("/create-course", { replace: true })}
                        >
                            <span className="text-[length:var(--fs-meta)] leading-none font-[var(--fw-semibold)]" aria-hidden="true">+</span> New course
                        </button>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-[var(--space-6)] mb-[var(--space-12)]">
                    {[
                        { count: displayStats?.published ?? 0, label: "Published", icon: Check, color: "var(--c-sage-text)", bg: "var(--c-sage-wash)" },
                        { count: displayStats?.approved ?? 0, label: "Approved", icon: Shield, color: "var(--c-sage-text)", bg: "var(--c-sage-wash)" },
                        { count: displayStats?.inReview ?? 0, label: "In review", icon: Eye, color: "var(--c-honey-text)", bg: "var(--c-honey-wash)" },
                        { count: displayStats?.submitted ?? 0, label: "Submitted", icon: Inbox, color: "var(--c-clay-text)", bg: "var(--c-clay-wash)" },
                        { count: displayStats?.draft ?? 0, label: "Draft", icon: SquarePen, color: "var(--ink-mute)", bg: "var(--paper-2)" },
                        { count: displayStats?.rejected ?? 0, label: "Rejected", icon: X, color: "var(--c-danger)", bg: "var(--c-danger-wash)" },
                        { count: displayStats?.archived ?? 0, label: "Archived", icon: Clock, color: "var(--ink-mute)", bg: "var(--paper-2)" },
                    ].map((item) => (
                        <button
                            key={item.label}
                            className="acourses-stat bg-[var(--paper)] border border-[var(--line)] rounded-[var(--r-lg)] p-[14px] flex items-start gap-[var(--space-4)] w-full transition-shadow duration-[var(--dur-base)] hover:shadow-[var(--shadow-hover)] cursor-pointer text-left focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] font-[family-name:var(--font-sans)]"
                        >
                            <div
                                className="w-[34px] h-[34px] rounded-[var(--r-md)] flex items-center justify-center shrink-0"
                                style={{ backgroundColor: item.bg, color: item.color }}
                            >
                                <item.icon size={18} strokeWidth={1.5} />
                            </div>
                            <div className="flex flex-col justify-center min-w-0">
                                <span className="text-[length:var(--fs-h1)] font-[var(--fw-bold)] text-[var(--ink)] leading-none mb-1 font-[family-name:var(--font-sans)]">
                                    {item.count}
                                </span>
                                <span className="text-[length:var(--fs-meta)] font-[var(--fw-semibold)] text-[var(--ink-mute)] leading-none font-[family-name:var(--font-sans)]">
                                    {item.label}
                                </span>
                            </div>
                        </button>
                    ))}
                </div>

                {/* Filters and Table Container */}
                <div className="border border-[var(--line)] rounded-[var(--r-lg)] overflow-hidden mb-[var(--space-12)] shadow-[var(--shadow-sm)] bg-[var(--paper)]">
                    {/* Filters Toolbar */}
                    <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center justify-between gap-[var(--space-6)] py-[14px] px-[16px] bg-[var(--paper-2)] border-b border-[var(--line)]">
                        <div className="relative w-full sm:max-w-[320px] lg:max-w-[525px] flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--ink-faint)]" width={16} height={16} />
                            <Input
                                type="text"
                                placeholder="Search courses, authors..."
                                className="w-full border-none bg-[var(--paper)] rounded-[var(--r-pill)] py-0 pr-[14px] pl-[34px] focus:outline-none focus:ring-1 focus:ring-[var(--c-honey)]"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>

                        <div className="flex flex-wrap items-center gap-[var(--space-4)] w-full sm:w-auto">
                            <div>
                                <Select
                                    className="appearance-none h-[40px] pl-[14px] pr-[36px] py-0 border border-[var(--line-strong)] hover:border-[var(--ink)] focus:border-[var(--c-honey)] cursor-pointer transition-colors duration-150 bg-[var(--paper)] w-auto rounded-[var(--r-md)] focus:outline-none focus:ring-1 focus:ring-[var(--c-honey)] font-[var(--fw-medium)] text-[var(--ink-soft)]"
                                    iconClassName="text-[var(--c-clay-text)]"
                                    value={filters.status ?? ""}
                                    onChange={(e) =>
                                        setFilter(
                                            "status",
                                            e.target.value ? (e.target.value as AdminCourseQueryParams["status"]) : undefined
                                        )
                                    }
                                >
                                    <option value="">Status: All</option>
                                    <option value="PUBLISHED">Published</option>
                                    <option value="DRAFT">Draft</option>
                                    <option value="ARCHIVED">Archived</option>
                                </Select>
                            </div>

                            <div>
                                <Select
                                    className="appearance-none h-[40px] pl-[14px] pr-[36px] py-0 border border-[var(--line-strong)] hover:border-[var(--ink)] focus:border-[var(--c-honey)] cursor-pointer transition-colors duration-150 bg-[var(--paper)] w-auto rounded-[var(--r-md)] focus:outline-none focus:ring-1 focus:ring-[var(--c-honey)] font-[var(--fw-medium)] text-[var(--ink-soft)]"
                                    iconClassName="text-[var(--c-clay-text)]"
                                    value={contentType}
                                    onChange={(e) => {
                                        setContentType(e.target.value as any);
                                        setPage(1); // Reset page on type change
                                    }}
                                >
                                    <option value="ALL">Type: All</option>
                                    <option value="COURSE">Path course</option>
                                    <option value="STANDALONE_COURSE">Course</option>
                                    <option value="LESSON">Path lesson</option>
                                    <option value="STANDALONE_LESSON">Lesson</option>
                                </Select>
                            </div>

                            <div>
                                <Select
                                    className="appearance-none h-[40px] pl-[14px] pr-[36px] py-0 border border-[var(--line-strong)] hover:border-[var(--ink)] focus:border-[var(--c-honey)] cursor-pointer transition-colors duration-150 bg-[var(--paper)] w-auto rounded-[var(--r-md)] focus:outline-none focus:ring-1 focus:ring-[var(--c-honey)] font-[var(--fw-medium)] text-[var(--ink-soft)]"
                                    iconClassName="text-[var(--c-clay-text)]"
                                    value={filters.visibility ?? ""}
                                    onChange={(e) =>
                                        setFilter(
                                            "visibility",
                                            e.target.value ? (e.target.value as AdminCourseQueryParams["visibility"]) : undefined
                                        )
                                    }
                                >
                                    <option value="">Visibility: All</option>
                                    <option value="PUBLIC_CATALOG">Public</option>
                                    <option value="TENANT_ONLY">Tenant Only</option>
                                </Select>
                            </div>

                            {/* Dummy Domain Filter to match screenshot */}
                            <div>
                                <Select
                                    className="appearance-none h-[40px] pl-[14px] pr-[36px] py-0 border border-[var(--line-strong)] hover:border-[var(--ink)] focus:border-[var(--c-honey)] cursor-pointer transition-colors duration-150 bg-[var(--paper)] w-auto rounded-[var(--r-md)] focus:outline-none focus:ring-1 focus:ring-[var(--c-honey)] font-[var(--fw-medium)] text-[var(--ink-soft)]"
                                    iconClassName="text-[var(--c-clay-text)]"
                                >
                                    <option value="">Domain: All</option>
                                </Select>
                            </div>
                        </div>
                    </div>

                    {/* Error state */}
                    {isError && !isLoading && (
                        <div className="bg-[var(--paper)] border-b border-[var(--line)] p-[var(--space-14)] text-center">
                            <p className="text-[length:var(--fs-body)] text-[var(--c-danger)] mb-3">
                                Failed to load content. Please try again.
                            </p>
                            <button
                                onClick={() => refetchCourses()}
                                className="px-[var(--space-8)] py-[var(--space-3)] bg-[var(--ink)] text-[var(--paper)] rounded-[var(--r-md)] text-[length:var(--fs-meta)]"
                            >
                                Retry
                            </button>
                        </div>
                    )}

                    {/* Empty state */}
                    {!isLoading && !isError && displayItems.length === 0 && (
                        <div className="bg-[var(--paper)] border-b border-[var(--line)] p-[var(--space-14)] text-center">
                            <p className="text-[length:var(--fs-body)] text-[var(--ink-mute)]">
                                No content found matching your criteria.
                            </p>
                        </div>
                    )}

                    {/* Table */}
                    {!isLoading && !isError && displayItems.length > 0 && (
                        <div className="bg-[var(--paper)] overflow-hidden flex-1">
                            <div className="overflow-x-auto overflow-y-auto max-h-[60vh] custom-scrollbar w-full">
                                <table className="w-full min-w-full border-collapse">
                                    <thead className="sticky top-0 z-20 bg-[var(--paper)] shadow-[0_1px_0_var(--line)]">
                                        <tr>
                                            <th className="w-[154px] pt-[11px] pr-[10px] pb-[11px] pl-[16px] text-left text-[length:var(--fs-meta)] font-[var(--fw-semibold)] text-[var(--ink-mute)]">
                                                <div className="flex items-center gap-1.5 cursor-pointer select-none hover:text-[var(--ink)] transition-colors">
                                                    Learning
                                                    <ChevronsUpDown width={12} height={12} className="text-[var(--ink-faint)]" strokeWidth={3} />
                                                </div>
                                            </th>
                                            <th className="w-[120px] px-[10px] py-[11px] text-left text-[length:var(--fs-meta)] font-[var(--fw-semibold)] text-[var(--ink-mute)]">
                                                <div className="flex items-center gap-1.5 cursor-pointer select-none hover:text-[var(--ink)] transition-colors">
                                                    Author
                                                    <ChevronsUpDown width={12} height={12} className="text-[var(--ink-faint)]" strokeWidth={3} />
                                                </div>
                                            </th>
                                            <th className="w-[140px] px-[10px] py-[11px] text-left text-[length:var(--fs-meta)] font-[var(--fw-semibold)] text-[var(--ink-mute)]">
                                                <div className="flex items-center gap-1.5 cursor-pointer select-none hover:text-[var(--ink)] transition-colors">
                                                    Role
                                                    <ChevronsUpDown width={12} height={12} className="text-[var(--ink-faint)]" strokeWidth={3} />
                                                </div>
                                            </th>
                                            <th className="w-[120px] px-[10px] py-[11px] text-left text-[length:var(--fs-meta)] font-[var(--fw-semibold)] text-[var(--ink-mute)]">
                                                <div className="flex items-center gap-1.5 cursor-pointer select-none hover:text-[var(--ink)] transition-colors">
                                                    Type
                                                    <ChevronsUpDown width={12} height={12} className="text-[var(--ink-faint)]" strokeWidth={3} />
                                                </div>
                                            </th>
                                            <th className="w-[120px] px-[10px] py-[11px] text-left text-[length:var(--fs-meta)] font-[var(--fw-semibold)] text-[var(--ink-mute)]">
                                                <div className="flex items-center gap-1.5 cursor-pointer select-none hover:text-[var(--ink)] transition-colors">
                                                    Subject
                                                    <ChevronsUpDown width={12} height={12} className="text-[var(--ink-faint)]" strokeWidth={3} />
                                                </div>
                                            </th>
                                            <th className="w-[180px] px-[10px] py-[11px] text-left text-[length:var(--fs-meta)] font-[var(--fw-semibold)] text-[var(--ink-mute)]">
                                                <div className="flex items-center gap-1.5 cursor-pointer select-none hover:text-[var(--ink)] transition-colors">
                                                    Visibility
                                                    <ChevronsUpDown width={12} height={12} className="text-[var(--ink-faint)]" strokeWidth={3} />
                                                </div>
                                            </th>
                                            <th className="w-[90px] px-[10px] py-[11px] text-left text-[length:var(--fs-meta)] font-[var(--fw-semibold)] text-[var(--ink-mute)]">
                                                Enrolments
                                            </th>
                                            <th className="w-[120px] px-[10px] py-[11px] text-left text-[length:var(--fs-meta)] font-[var(--fw-semibold)] text-[var(--ink-mute)]">
                                                <div className="flex items-center gap-1.5 cursor-pointer select-none hover:text-[var(--ink)] transition-colors">
                                                    Status
                                                    <ChevronsUpDown width={12} height={12} className="text-[var(--ink-faint)]" strokeWidth={3} />
                                                </div>
                                            </th>
                                            <th className="w-[90px] px-[10px] py-[11px] text-left text-[length:var(--fs-meta)] font-[var(--fw-semibold)] text-[var(--ink-mute)]">
                                                <div className="flex items-center gap-1.5 cursor-pointer select-none hover:text-[var(--ink)] transition-colors">
                                                    Updated
                                                    <ChevronsUpDown width={12} height={12} className="text-[var(--ink-faint)]" strokeWidth={3} />
                                                </div>
                                            </th>
                                            <th className="w-[100px] px-[10px] py-[11px] text-left text-[length:var(--fs-meta)] font-[var(--fw-semibold)] text-[var(--ink-mute)]">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {displayItems.map((item: any, index: number) => {
                                            const isPublished = item.status === "PUBLISHED" || item.status === "ACTIVE";
                                            const statusColor = isPublished ? "text-[var(--c-sage-text)]" : "text-[var(--c-honey-text)]";

                                            return (
                                                <React.Fragment key={item.id + item._originalType}>
                                                    <tr
                                                        className="border-b border-[var(--line)] bg-[var(--paper)] hover:bg-[var(--paper-2)] transition-colors duration-[var(--dur-base)] group cursor-pointer"
                                                        onClick={(e) => { pushView(item); }}
                                                    >
                                                        {/* COURSE/ITEM */}
                                                        <td className="acourses-td-name py-[16px] pr-[10px] pl-[16px] align-top">
                                                            <div className="flex items-start gap-2 max-w-[220px]">
                                                                <div>
                                                                    <p className="text-[length:var(--fs-meta)] font-[var(--fw-semibold)] leading-5 text-[var(--ink)] group-hover:text-[var(--ink-deep)] transition-colors font-[family-name:var(--font-sans)]">
                                                                        {item.title}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </td>

                                                        {/* AUTHOR */}
                                                        <td className="py-[16px] px-[10px] align-top">
                                                            <p className="text-[length:var(--fs-meta)] text-[var(--ink-mute)] leading-5">
                                                                {item.authorName}
                                                            </p>
                                                        </td>

                                                        {/* ROLE */}
                                                        <td className="py-[16px] px-[10px] align-top">
                                                            <div className="flex items-start">
                                                                <Chip className="inline-flex items-center justify-center leading-tight px-3 py-1 text-[length:var(--fs-label)] font-[var(--fw-medium)] text-[var(--ink-mute)] bg-[var(--paper-2)] rounded-full border border-[var(--line)] max-w-[140px] text-center">
                                                                    {item.authorRole.replace('_', ' ')}
                                                                </Chip>
                                                            </div>
                                                        </td>

                                                        {/* TYPE */}
                                                        <td className="py-[16px] px-[10px] align-top">
                                                            <div className="flex items-start">
                                                                <Chip className={`inline-flex items-center justify-center font-serif leading-tight px-3 py-1 text-[length:var(--fs-micro)] font-[var(--fw-bold)] rounded-full ${item._originalType === "CAREER_PATH"
                                                                    ? "bg-[var(--c-sage-wash)] text-[var(--c-sage-text)] border border-[var(--c-sage-soft)]"
                                                                    : "bg-[var(--c-honey-wash)] text-[var(--c-honey-text)] border border-[var(--c-honey-soft)]"
                                                                    }`}>
                                                                    {item.courseType}
                                                                </Chip>
                                                            </div>
                                                        </td>

                                                        {/* DOMAIN */}
                                                        <td className="py-[16px] px-[10px] align-top">
                                                            <span className="text-[length:var(--fs-meta)] text-[var(--ink-mute)]">
                                                                {item.domain}
                                                            </span>
                                                        </td>

                                                        {/* VISIBILITY */}
                                                        <td className="py-[16px] px-[10px] align-top">
                                                            <span className="text-[length:var(--fs-meta)] leading-5 text-[var(--ink-mute)]">
                                                                {item.visibility === "TENANT_ONLY" ? "Tenant: " + (item.tenantName || "Unknown") : "Public"}
                                                            </span>
                                                        </td>

                                                        {/* ENROLMENTS */}
                                                        <td className="py-[16px] px-[10px] align-top">
                                                            <span className="text-[length:var(--fs-meta)] font-[var(--fw-bold)] text-[var(--ink)]">
                                                                {item.enrollmentCount === 0 ? '-' : item.enrollmentCount.toLocaleString()}
                                                            </span>
                                                        </td>

                                                        {/* STATUS */}
                                                        <td className="py-[16px] px-[10px] align-top">
                                                            <div className="flex items-center gap-2">
                                                                <span
                                                                    className={`w-1.5 h-1.5 rounded-full ${isPublished ? "bg-[var(--c-check)]" : "bg-[var(--c-honey)]"}`}
                                                                />
                                                                <span className={`text-[length:var(--fs-meta)] font-[var(--fw-bold)] ${statusColor}`}>
                                                                    {formatStatus(item.status)}
                                                                </span>
                                                            </div>
                                                        </td>

                                                        {/* UPDATED */}
                                                        <td className="py-[16px] px-[10px] align-top">
                                                            <span className="text-[length:var(--fs-meta)] text-[var(--ink-mute)]">
                                                                {formatDate(item.updatedAt)}
                                                            </span>
                                                        </td>

                                                        {/* ACTIONS */}
                                                        <td className="py-[16px] px-[10px] align-top">
                                                            <div className="flex items-center gap-3">
                                                                <button
                                                                    className="text-[length:var(--fs-meta)] font-[var(--fw-bold)] text-[var(--ink)] hover:text-[var(--ink-mute)] transition-colors"
                                                                    onClick={(e) => { e.stopPropagation(); pushView(item); }}
                                                                >
                                                                    View
                                                                </button>
                                                                {canEdit && (
                                                                    <button
                                                                        className="text-[length:var(--fs-meta)] font-[var(--fw-bold)] text-[var(--ink)] hover:text-[var(--ink-mute)] transition-colors"
                                                                        onClick={(e) => handleEditClick(e, item)}
                                                                    >
                                                                        Edit
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                </React.Fragment>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {/* FOOTER */}
                            <div className=" mt-5 flex flex-col sm:flex-row items-center justify-between gap-[var(--space-8)] px-[var(--space-6)] py-[var(--space-4)] bg-[var(--paper)] border-t border-[var(--line)]">
                                <p className="text-[length:var(--fs-meta)] text-[var(--ink-mute)]">
                                    {total > 0
                                        ? `Showing ${startIndex}-${endIndex} of ${total} courses`
                                        : "No courses"}
                                </p>

                                <div className="flex flex-wrap justify-center sm:justify-end items-center gap-[var(--space-6)] w-full sm:w-auto">
                                    <div className="flex items-center gap-[var(--space-2)]">
                                        <span className="text-[length:var(--fs-meta)] text-[var(--ink-mute)]">Rows per page</span>
                                        <div className="relative">
                                            <select
                                                className="appearance-none bg-[var(--paper)] border border-[var(--line)] text-[var(--ink)] text-[length:var(--fs-meta)] font-[var(--fw-medium)] rounded-[var(--r-pill)] px-[var(--space-3)] py-1.5 pr-8 focus:outline-none focus:ring-1 focus:ring-[var(--c-honey)]"
                                                value={limit}
                                                onChange={(e) => setLimit(Number(e.target.value))}
                                            >
                                                <option value={10}>10</option>
                                                <option value={20}>20</option>
                                                <option value={50}>50</option>
                                                <option value={100}>100</option>
                                            </select>
                                            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--ink-mute)] pointer-events-none" width={14} height={14} />
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-[var(--space-2)]">
                                        <button
                                            className="flex items-center px-[var(--space-8)] py-[6px] bg-[var(--paper)] text-[var(--ink-mute)] border border-[var(--line)] rounded-[var(--r-pill)] font-[var(--fw-medium)] text-[length:var(--fs-meta)] transition-all duration-[var(--dur-fast)] hover:bg-[var(--paper-2)] disabled:opacity-50 disabled:cursor-not-allowed"
                                            disabled={page <= 1}
                                            onClick={() => setPage(page - 1)}
                                        >
                                            ← Prev
                                        </button>

                                        <button
                                            className="flex items-center px-[var(--space-8)] py-[6px] bg-[var(--btn)] text-[var(--btn-ink)] border border-[var(--c-honey)] rounded-[var(--r-pill)] font-[var(--fw-bold)] text-[length:var(--fs-meta)] transition-all duration-[var(--dur-fast)] hover:bg-[var(--btn-hover)] disabled:opacity-50 disabled:cursor-not-allowed"
                                            disabled={page >= totalPages}
                                            onClick={() => setPage(page + 1)}
                                        >
                                            Next →
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

            </div>

            {/* Edit Published Confirmation Modal */}
            {editConfirmModal.isOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[var(--ink)] bg-opacity-50">
                    <div className="bg-[var(--paper)] rounded-[var(--r-lg)] p-[var(--space-10)] max-w-md w-full mx-4 shadow-[var(--shadow-lg)]">
                        <h3 className="text-[length:var(--fs-h2)] font-[var(--fw-bold)] text-[var(--ink)] mb-2 font-[family-name:var(--font-sans)]">Edit Published Content</h3>
                        <p className="text-[length:var(--fs-body)] text-[var(--ink-soft)] mb-6 font-[family-name:var(--font-sans)]">
                            This {editConfirmModal.item?.courseType?.toLowerCase() || 'item'} is already published.
                            Are you sure you want to edit? It will be saved as a draft and placed under review.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setEditConfirmModal({ isOpen: false, item: null })}
                                className="px-4 py-2 text-[length:var(--fs-meta)] font-[var(--fw-medium)] text-[var(--ink-mute)] bg-[var(--paper)] border border-[var(--line)] rounded-[var(--r-md)] hover:bg-[var(--paper-2)] focus:outline-none"
                                disabled={isReverting}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmEditPublished}
                                disabled={isReverting}
                                className="px-4 py-2 text-[length:var(--fs-meta)] font-[var(--fw-medium)] text-[var(--btn-ink)] bg-[var(--c-honey)] rounded-[var(--r-md)] hover:brightness-95 focus:outline-none flex items-center gap-2"
                            >
                                {isReverting ? (
                                    <>
                                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Processing...
                                    </>
                                ) : (
                                    "Yes, Edit"
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyCourse;