import React, { useEffect } from "react";
import { useNavigate } from "react-router";
import { useProfileStore } from "../../store/profile.store";
import { useUserStore } from "../../store/user.store";
import { useAuthStore } from "../../core/auth/auth.store";
import { useMemberLearningStore } from "../../store/member-learning/memberLearning.store";
import {
  useMemberLearningCourses,
  useLearningStatistics,
  useWishlist,
  useEnrollCourse,
} from "../../hooks/member-learning/memberLearning";
import { useCategories } from "../../hooks/category/useCategories";
import { useSubjects } from "../../hooks/useSubjects";
import { useSkills } from "../../hooks/useMaster";
import {
  isLearningContentVisible,
  isPublishedLearningContent,
  memberLearningApi,
} from "../../core/api/member-learning/memberLearningApi";
import { useProfile } from "../../hooks/profile/useProfile";
import { useQuery } from "@tanstack/react-query";
import {
  getTenantConfigurationByTenantApi,
  getTenantConfigurationsApi,
} from "../../core/api/TenantConfiguration.api";

import { Input } from "@/components/ui/Input";
import { Skeleton } from "../../components/ui/Skeleton/Skeleton";
import { ChevronDown, ChevronRight, X, Bookmark, Play, Play as Play2, BookOpen as Book, Grid, AlignLeft, Search, Award, Clock, Filter, Wifi, ShieldCheck, CheckCircle2 } from "lucide-react";
import { notification } from "antd";
import { showProfileIncompleteModal } from "../../utils/profileAlert";
import { formatMinutesToDisplay } from "../../utils/mediaDuration";

// Flexible structural interfaces to allow seamless multi-variant card mapping
interface CourseCardProps {
  variant?: "course" | "career-path";
  category?: string;
  title: string;
  level?: string;
  instructor?: string;
  durationText?: string;
  price?: string;
  thumbnailUrl?: string;
  isEnrolled?: boolean;
  progress?: number;
  statusText?: string;
  isWishlisted?: boolean;
  isWishlistLoading?: boolean;
  onWishlistToggle?: (e: React.MouseEvent) => void;
  onClick?: () => void;
  type?: string;
  isListView?: boolean;
  lessonsCount?: number;
  role?: string;
  isAllocated?: boolean;
  isEnrolLoading?: boolean;
  onEnrol?: (e: React.MouseEvent) => void;
  isCorporateAdmin?: boolean;
  onAssign?: (e: React.MouseEvent) => void;
}

const CourseSkeleton = () => (
  <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col justify-between h-[300px] animate-pulse">
    <div className="bg-gray-200 h-32 w-full" />
    <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
      <div className="space-y-2">
        <div className="h-3 bg-gray-200 rounded w-1/4" />
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-4 bg-gray-200 rounded w-5/6" />
      </div>
      <div className="h-3 bg-gray-200 rounded w-1/3 pt-2" />
    </div>
  </div>
);

const MemberLearning: React.FC = () => {
  const navigate = useNavigate();

  // 1. Get userId from profile store — also fetch profile if not yet loaded
  const { getProfile } = useProfile();
  const userId = useProfileStore((state) => state.profile?.id) || "";
  const profile = useProfileStore((state) => state.profile);
  const isProfileLoading = useProfileStore((state) => state.loading);
  const user = useUserStore((state) => state.user);
  const authRole = useAuthStore((state) => state.role);
  const role = authRole;
  const systemRoles = useAuthStore((state) => state.systemRoles) || [];

  const getTenantIdFromStorage = (): string => {
    try {
      const storedUser = localStorage.getItem("keycloak_session_user");
      if (!storedUser) return "";
      const parsed = JSON.parse(storedUser);
      const u = parsed?.user || parsed;
      return u?.tenantId || u?.tenant?.id || u?.organizationId || "";
    } catch {
      return "";
    }
  };

  const tenantId = profile?.tenantId || user?.tenantId || getTenantIdFromStorage();
  const currentUserId = profile?.id || userId || user?.id || "";

  const normalizedRole = (authRole || user?.roles?.[0] || "").toUpperCase().replace(/[\s-]+/g, "_");
  const isCorporateAdmin =
    normalizedRole === "CORPORATE_ADMIN" ||
    normalizedRole === "CORPORATEADMIN" ||
    normalizedRole === "ADMIN" ||
    systemRoles.some((r: any) => typeof r === "string" && (r.toUpperCase().replace(/[\s-]+/g, "_") === "CORPORATE_ADMIN" || r.toUpperCase() === "ADMIN")) ||
    (user?.roles || []).some((r: any) => typeof r === "string" && (r.toUpperCase().replace(/[\s-]+/g, "_") === "CORPORATE_ADMIN" || r.toUpperCase() === "ADMIN"));

  const effectiveRole = isCorporateAdmin ? "CORPORATE_ADMIN" : (authRole || (tenantId ? "CORPORATE_USER" : undefined));

  // Fetch tenant configuration for feature flags like showTrending
  const { data: tenantConfig } = useQuery({
    queryKey: ["tenant-configuration", tenantId],
    queryFn: async () => {
      try {
        if (tenantId) {
          const cfg = await getTenantConfigurationByTenantApi(tenantId);
          if (cfg) return cfg;
        }
        const allConfigs = await getTenantConfigurationsApi();
        return Array.isArray(allConfigs) && allConfigs.length > 0 ? allConfigs[0] : null;
      } catch (err) {
        console.warn("Could not fetch tenant configuration, defaulting showTrending to true", err);
        return null;
      }
    },
    staleTime: 5 * 60 * 1000,
  });

  const showTrending = tenantConfig?.showTrending !== undefined ? Boolean(tenantConfig.showTrending) : true;

  const { subjects } = useSubjects();
  const subjectNames = subjects ? subjects.map((s: any) => s.name) : [];

  const { categories } = useCategories();
  const categoryNames = categories ? categories.map((c: any) => c.name) : [];

  const { data: skills = [] } = useSkills();
  const skillNames = skills.map((s: any) => s.name);

  const [searchInput, setSearchInput] = React.useState("");

  const [selectedCatalogTab, setSelectedCatalogTab] = React.useState("All Content");
  const [viewMode, setViewMode] = React.useState<"grid" | "list">("grid");
  const [openFilter, setOpenFilter] = React.useState<string | null>(null);
  const [selectedFilters, setSelectedFilters] = React.useState<Record<string, string[]>>({});

  useEffect(() => {
    if (!showTrending && selectedCatalogTab === "Trending") {
      setSelectedCatalogTab("All Content");
    }
  }, [showTrending, selectedCatalogTab]);

  const toggleLocalFilter = (category: string, option: string) => {
    setSelectedFilters(prev => {
      const current = prev[category] || [];
      if (current.includes(option)) {
        return { ...prev, [category]: current.filter(o => o !== option) };
      }
      return { ...prev, [category]: [...current, option] };
    });
  };

  const removeLocalFilter = (category: string, option: string) => {
    setSelectedFilters(prev => {
      const current = prev[category] || [];
      return { ...prev, [category]: current.filter(o => o !== option) };
    });
  };

  const clearAllLocalFilters = () => setSelectedFilters({});

  const filterDropdownOptions: Record<string, string[]> = {
    Domain: subjectNames.length > 0 ? subjectNames : [],
    Category: categoryNames.length > 0 ? categoryNames : [],
    Subject: subjectNames.length > 0 ? subjectNames : [],
    Duration: ["Under 2h", "2-5h", "5h+"],
    "Learning type": ["Course", "Explainer video"],
    "Skill level": skillNames.length > 0 ? skillNames : ["Foundation", "Practitioner", "Expert"],
    "Completion status": ["Not started", "In progress", "Course completed"],
    Language: []
  };

  const catalogTabs = [
    "All Content",
    ...(showTrending ? ["Trending"] : []),
    ...categoryNames,
  ];

  const filterPillLabels = [
    "Domain",
    ...(selectedCatalogTab === "All Content" || selectedCatalogTab === "All" || selectedCatalogTab === "Trending" ? ["Category"] : []),
    "Subject",
    "Duration",
    "Skill level",
    "Completion status",
    "Language",
  ];

  // Fetch profile on mount if not already in store (e.g. navigating directly to this page)
  useEffect(() => {
    if (!profile) {
      getProfile();
    }
  }, []);

  const handleCourseClick = (id: string, type: string = "course") => {
    navigate(`/course-details?id=${id}&type=${type || "course"}`);
  };

  // 2. Get UI state from Zustand store
  const {
    activeTab,
    search,
    sortBy,
    page,
    limit,
    filters,
    setActiveTab,
    setSearch,
    setSortBy,
    setPage,
    setLimit,
    toggleFilter,
    clearFilters,
    resetStore,
  } = useMemberLearningStore();

  const isProfileReady = !!userId;

  const {
    data: stats,
    refetch: refetchStats,
  } = useLearningStatistics(userId, isProfileReady);

  const {
    data: coursesData,
    isLoading: isLoadingCourses,
    isError: isErrorCourses,
    refetch: refetchCourses,
    rawData,
  } = useMemberLearningCourses(
    userId,
    activeTab,
    filters,
    search,
    sortBy,
    1,
    99999, // Fetch all data to perform client-side filtering correctly
    isProfileReady,
    effectiveRole,
    tenantId ?? undefined
  );

  // Reset store on mount and show up to 12 courses by default
  useEffect(() => {
    resetStore();
    setLimit(12);
  }, [resetStore, setLimit]);

  // Sync local search input with global search state when it gets cleared
  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  // Wishlist toggle mutation
  const wishlistMutation = useWishlist();

  const handleWishlistToggle = async (
    courseId: string,
    entityType: string,
    e: React.MouseEvent,
    isCurrentlyWishlisted?: boolean
  ) => {
    e.stopPropagation();
    try {
      await wishlistMutation.mutateAsync({ entityId: courseId, entityType });
      await Promise.all([refetchStats(), refetchCourses()]);
      if (isCurrentlyWishlisted) {
        notification.info({
          message: "Removed from Wishlist",
          description: "Course removed from your saved list.",
          duration: 2.5,
        });
      } else {
        notification.success({
          message: "Saved to Wishlist",
          description: "Course added to your wishlist.",
          duration: 2.5,
        });
      }
    } catch (err) {
      console.error("Failed to toggle wishlist", err);
    }
  };

  const enrollMutation = useEnrollCourse();

  const handleEnrol = async (courseId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await enrollMutation.mutateAsync(courseId);
      notification.success({
        title: "Enrolled Successfully",
        description: "You have enrolled in the course.",
      });
      refetchStats();
      refetchCourses();
    } catch (err: any) {
      console.error("Failed to enrol", err);
      const data = err?.response?.data;
      const msg = data?.message || err?.message || "Failed to enrol";
      if (data?.profileCompletionRequired || msg.includes("not 80%") || msg.includes("80%")) {
        showProfileIncompleteModal(navigate, msg, data?.profileCompleteness);
      } else {
        notification.error({
          title: "Enrollment Failed",
          description: msg,
        });
      }
    }
  };

  // Determine if filters are active
  const isFiltersActive =
    filters.careerPath.length > 0 ||
    filters.difficulty.length > 0 ||
    filters.duration.length > 0 ||
    filters.price.length > 0;

  // Active filter chips list
  const activeChips: {
    type: "careerPath" | "difficulty" | "duration" | "price";
    label: string;
    value: string;
  }[] = [];
  filters.careerPath.forEach((val) =>
    activeChips.push({ type: "careerPath", label: `Category: ${val}`, value: val })
  );
  filters.difficulty.forEach((val) =>
    activeChips.push({ type: "difficulty", label: `Difficulty: ${val}`, value: val })
  );
  filters.duration.forEach((val) =>
    activeChips.push({ type: "duration", label: `Duration: ${val}`, value: val })
  );
  filters.price.forEach((val) =>
    activeChips.push({ type: "price", label: `Price: ${val}`, value: val })
  );

  // Grouped / Dashboard view: Active only when on "All courses" and no search / filters applied
  const isDashboardView = activeTab === "All courses" && !search && !isFiltersActive;

  // Filter sections for Dashboard View
  const rawListData = coursesData?.data || [];

 const languageOptions = Array.from(
  new Map(
    rawListData
      .map((c: any) => c.language)
      .filter(Boolean)
      .map((language: string) => {
        const normalizedLanguage = language.trim().toLowerCase();
        return [normalizedLanguage, language.trim()];
      })
  ).values()
) as string[];
  const finalFilterDropdownOptions: Record<string, string[]> = {
    ...filterDropdownOptions,
    Language: languageOptions.length > 0 ? languageOptions : ["English", "Arabic"]
  };

  let listData = rawListData.filter((c: any) => {
    // Strictly courses only - no career-path or standalone lesson
    if (c.type && c.type !== "course") return false;

    const selectedLearningTypes = selectedFilters["Learning type"] || [];
    if (selectedLearningTypes.length > 0) {
      let isMatch = false;
      if (selectedLearningTypes.includes("Course") && c.publishType !== "EXPLAINER") isMatch = true;
      if (selectedLearningTypes.includes("Explainer video") && c.publishType === "EXPLAINER") isMatch = true;
      if (!isMatch) return false;
    }

    // Combine Domain and Subject filters to apply an OR logic between them
    const selectedDomains = selectedFilters["Domain"] || [];
    const selectedSubjects = selectedFilters["Subject"] || [];
    const combinedSubjects = [...selectedDomains, ...selectedSubjects];

    if (combinedSubjects.length > 0) {
      if (!c.subjectNames?.some((name: string) => combinedSubjects.includes(name))) return false;
    }

    if (selectedCatalogTab === "Trending") {
      const hasTrendingContent = rawListData.some(
        (item: any) => (Number(item.viewCount) || 0) > 0 || !!item.isTrending
      );
      if (hasTrendingContent) {
        const isTrendingItem = (Number(c.viewCount) || 0) > 0 || !!c.isTrending;
        if (!isTrendingItem) return false;
      }
    } else if (selectedCatalogTab !== "All Content" && selectedCatalogTab !== "All") {
      if (c.category !== selectedCatalogTab) return false;
    }

    const selectedCategories = selectedFilters["Category"] || [];
    if (selectedCategories.length > 0) {
      if (!selectedCategories.includes(c.category)) return false;
    }

    const selectedSkills = selectedFilters["Skill level"] || [];
    if (selectedSkills.length > 0) {
      if (!c.skillNames?.some((name: string) => selectedSkills.includes(name))) return false;
    }

    const selectedLanguages = selectedFilters["Language"] || [];
    if (selectedLanguages.length > 0) {
      if (!selectedLanguages.includes(c.language)) return false;
    }

    const selectedCompletionStatus = selectedFilters["Completion status"] || [];
    if (selectedCompletionStatus.length > 0) {
      // Require an actual enrollment record to match completion statuses
      if (!c.isEnrolled) return false;

      const mappedStatuses = selectedCompletionStatus.map((status: string) =>
        status === "Course completed" ? "Completed" : status
      );
      if (!mappedStatuses.includes(c.statusText)) return false;
    }

    const selectedDurations = selectedFilters["Duration"] || [];
    if (selectedDurations.length > 0) {
      const mins = c.totalDurationMins || 0;
      let durationMatch = false;

      if (selectedDurations.includes("Under 2h") && mins < 120) durationMatch = true;
      if (selectedDurations.includes("2-5h") && mins >= 120 && mins <= 300) durationMatch = true;
      if (selectedDurations.includes("5h+") && mins > 300) durationMatch = true;

      if (!durationMatch) return false;
    }

    return true;
  });

  // When Trending tab is selected, display courses based on view_count descending (highest viewCount first)
  if (selectedCatalogTab === "Trending") {
    listData = [...listData].sort((a: any, b: any) => {
      const countA = Number(a.viewCount) || 0;
      const countB = Number(b.viewCount) || 0;
      if (countB !== countA) return countB - countA;
      if (b.isTrending !== a.isTrending) return (b.isTrending ? 1 : 0) - (a.isTrending ? 1 : 0);
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      if (dateB !== dateA) return dateB - dateA;
      return (a.title || "").localeCompare(b.title || "");
    });
  }

  const totalCourses = listData.length;
  const totalPages = Math.ceil(totalCourses / limit) || 1;
  const paginatedListData = listData.slice((page - 1) * limit, page * limit);

  // Show skeleton while profile is loading OR courses are loading
  if (isProfileLoading || (!isProfileReady && !profile) || isLoadingCourses) {
    return (
      <div className="w-full bg-white font-sans text-gray-900 space-y-6 pb-12">
        {/* Header & Search Skeleton */}
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <Skeleton className="h-11 w-full sm:w-80 rounded-xl" />
            <div className="flex gap-2 w-full sm:w-auto overflow-x-auto">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-9 w-24 rounded-full shrink-0" />
              ))}
            </div>
          </div>
        </div>

        {/* Featured Hero Banner Skeleton */}
        <Skeleton className="w-full h-44 sm:h-56 rounded-2xl" />

        {/* Course Cards Grid Skeleton */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((k) => (
              <div key={k} className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm space-y-3 p-3">
                <Skeleton className="h-40 w-full rounded-xl" />
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-16 rounded-md" />
                  <Skeleton className="h-4 w-20 rounded-md" />
                </div>
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <div className="pt-3 border-t border-gray-100 flex justify-between items-center">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-8 w-24 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-white font-sans text-gray-900">
      <div className="mx-auto space-y-6">
        {/* --- PAGE HEADER (Matching Vercel /catalog) --- */}
        <div>
          <p className="text-[12px] font-bold uppercase tracking-widest text-[#5c5c5c] mb-2">LEARNING HUB</p>
          <h1 className="text-[24px] font-bold tracking-tight text-[#141414] leading-tight mb-2">Course catalog</h1>
          <p className="text-[16px] text-[#5c5c5c] font-normal">
            Explore courses, master classes, explainers, talks and more.
          </p>
        </div>

        {/* Horizontal Catalog Tabs */}
        <div className="border-b border-gray-200 mt-6">
          <div className="flex flex-wrap gap-8 text-[16px]">
            {catalogTabs.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => {
                  setSelectedCatalogTab(tab);
                  if (tab === "Trending") {
                    setSortBy("Most Popular");
                  }
                  if (tab !== "All Content" && tab !== "Trending") {
                    setSelectedFilters(prev => {
                      if (!prev["Category"] || prev["Category"].length === 0) return prev;
                      const copy = { ...prev };
                      delete copy["Category"];
                      return copy;
                    });
                  }
                }}
                className={`pb-3 relative transition-colors cursor-pointer ${selectedCatalogTab === tab
                  ? "text-[#141414] font-semibold border-b-[3px] border-[#c99b2e]"
                  : "text-[#5c5c5c] font-medium hover:text-gray-700"
                  }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Toolbar: Search input + View Mode Toggle + Sort Dropdown */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-8">
          <div className="relative w-full max-w-[400px]">
            <Input
              type="text"
              placeholder="Search within this catalog"
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
                setSearch(e.target.value);
              }}
              className="w-full border border-[#1111111a] rounded-full bg-white pl-11 pr-4 py-2 text-[14px] focus:outline-none focus:border-[#c99b2e] focus:ring-1 focus:ring-[#c99b2e] text-gray-700 placeholder-gray-500 transition-colors"
            />
            <Search className="absolute left-4 top-[10px] w-[18px] h-[18px] text-[#5c5c5c]" />
          </div>

          <div className="flex items-center gap-4 w-full sm:w-auto justify-end">
            <div className="flex items-center bg-(--paper) rounded-full border border-(--line) overflow-hidden h-9.5">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                 className={`w-11.5 h-full flex items-center justify-center transition-colors ${
                viewMode === "grid" ? "bg-(--ink) text-(--paper)" : "text-(--ink-mute) hover:bg-(--surface-1)"
              }`}
              >
                <Grid width={15} height={15} strokeWidth={2} />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={`w-11.5 h-full flex items-center justify-center transition-colors ${
                viewMode === "list" ? "bg-(--ink) text-(--paper)" : "text-(--ink-mute) hover:bg-(--surface-1)"
              }`}
              >
                <AlignLeft width={15} height={15} strokeWidth={2} />
              </button>
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="border border-gray-200 bg-white rounded-[10px] px-5 py-2 text-[14px] font-medium text-gray-700 focus:outline-none focus:border-gray-400 transition-colors cursor-pointer pr-10 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2216%22%20height%3D%2216%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%236b7280%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22M6%209l6%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:calc(100%-1rem)_center]"
            >
              <option value="Newest">Sort: Newest</option>
              <option value="Most Popular">Sort: Most Popular</option>
              <option value="A-Z">Sort: A-Z</option>
              <option value="Shortest">Sort: Shortest</option>
            </select>
          </div>
        </div>

        {/* Horizontal Filters Pill Strip */}
        <div className="flex flex-col gap-5">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="text-[12px] font-bold uppercase tracking-widest text-[#5c5c5c] mr-1.5">FILTERS</span>
            {filterPillLabels.map((filter) => {
              const isOpen = openFilter === filter;
              const options = finalFilterDropdownOptions[filter] || [];
              const selectedCount = selectedFilters[filter]?.length || 0;
              const hasSelection = selectedCount > 0;

              return (
                <div key={filter} className="relative">
                  <button
                    type="button"
                    onClick={() => setOpenFilter(isOpen ? null : filter)}
                    className={`border text-[14px] px-[14px] h-[38px] rounded-full flex items-center gap-1.5 transition-colors cursor-pointer ${hasSelection
                      ? 'bg-[#f6e8c4] border-[#c99b2e] text-[#141414] font-medium'
                      : isOpen ? 'bg-white border-[#141414] text-[#141414] shadow-sm font-normal' : 'bg-white border-[#1111111a] hover:border-gray-300 text-[#5c5c5c] font-normal'
                      }`}
                  >
                    {filter}
                    {hasSelection && (
                      <span className="bg-[#c99b2e] text-white text-[10px] font-bold w-[18px] h-[18px] flex items-center justify-center rounded-full ml-0.5">
                        {selectedCount}
                      </span>
                    )}
                    {isOpen ? (
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform ${hasSelection ? 'text-[#c99b2e]' : 'text-[#5c5c5c]'}`} />
                    ) : (
                      <ChevronRight className={`w-3.5 h-3.5 transition-transform ${hasSelection ? 'text-[#c99b2e]' : 'text-[#5c5c5c]'}`} />
                    )}
                  </button>

                  {/* Dropdown panel */}
                  {isOpen && options.length > 0 && (
                    <div className="absolute top-full mt-2 left-0 min-w-[240px] max-w-[320px] bg-white border border-gray-100 rounded-xl shadow-xl p-2 z-50">
                      <div className="flex flex-col gap-1 max-h-[260px] overflow-y-auto pr-1">
                        {options.map((opt: string) => {
                          const isChecked = selectedFilters[filter]?.includes(opt);
                          const isDisabled =
                            (filter === "Subject" && selectedFilters["Domain"]?.includes(opt)) ||
                            (filter === "Domain" && selectedFilters["Subject"]?.includes(opt));

                          return (
                            <label key={opt} className={`flex items-center gap-3 px-3 py-2 rounded-lg ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50 cursor-pointer'}`}>
                              <input
                                type="checkbox"
                                checked={isChecked || false}
                                disabled={isDisabled}
                                onChange={() => toggleLocalFilter(filter, opt)}
                                className={`w-4 h-4 rounded border-gray-300 accent-[#c99b2e] ${isDisabled ? 'cursor-not-allowed' : 'cursor-pointer'} ${isChecked ? 'text-[#c99b2e] focus:ring-[#c99b2e]' : 'text-gray-900 focus:ring-gray-900'}`}
                              />
                              <span className="text-[14px] text-gray-700">{opt}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Reset Button next to pills */}
            {Object.values(selectedFilters).flat().length > 0 && (
              <button
                onClick={clearAllLocalFilters}
                className="text-[12px] font-bold text-[#b8523e] uppercase tracking-wider ml-1 hover:underline cursor-pointer"
              >
                RESET
              </button>
            )}
          </div>

          {/* Active Filters Row */}
          {Object.values(selectedFilters).flat().length > 0 && (
            <div className="flex items-center gap-3 mb-2">
              <span className="text-[12px] font-bold uppercase tracking-widest text-[#5c5c5c]">ACTIVE FILTERS:</span>
              <div className="flex flex-wrap items-center gap-2">
                {Object.entries(selectedFilters).map(([category, opts]) =>
                  opts.map(opt => (
                    <div key={`${category}-${opt}`} className="flex items-center gap-1.5 px-[10px] h-[22px] rounded-full border border-[#1111111a] bg-white text-[12px] text-[#3a3a3a]">
                      {opt}
                      <button onClick={() => removeLocalFilter(category, opt)} className="text-[#3a3a3a] hover:text-black cursor-pointer flex items-center justify-center">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))
                )}
                <button
                  onClick={clearAllLocalFilters}
                  className="flex items-center justify-center h-[22px] px-[10px] rounded-full border border-[#b8523e66] text-[#b8523e] text-[12px] font-bold uppercase tracking-wider hover:bg-[#fff7ed] transition-colors cursor-pointer"
                >
                  CLEAR ALL
                </button>
              </div>
            </div>
          )}
        </div>

        {/* --- MAIN FULL-WIDTH CONTENT AREA --- */}
        <div className="w-full space-y-8">
          {/* Error state */}
          {isErrorCourses && (
            <div className="flex flex-col items-center justify-center min-h-[300px] text-center space-y-4">
              <p className="text-red-500 font-semibold">
                Failed to load courses. Please try again.
              </p>
              <button
                onClick={() => {
                  refetchCourses();
                  refetchStats();
                }}
                className="bg-gray-900 text-white font-bold px-4 py-2 rounded-lg text-xs hover:bg-black transition-all cursor-pointer"
              >
                Retry
              </button>
            </div>
          )}

          {/* Loading state skeletons */}
          {isLoadingCourses && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {Array.from({ length: 6 }).map((_, idx) => (
                <CourseSkeleton key={idx} />
              ))}
            </div>
          )}

          {/* Course Display: Category Sections vs Grid */}
          {/* Course Display: Unified grid list */}
          {!isLoadingCourses && !isErrorCourses && (
            <div className="space-y-6 pt-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-[18px] font-bold text-[#141414] tracking-tight">All Courses</h2>
                <div className="flex items-center gap-4 text-[14px] text-[#5c5c5c] font-medium">
                  <div className="flex items-center gap-2">
                    <span>Show</span>
                    <div className="relative">
                      <select
                        value={limit}
                        onChange={(e) => {
                          setLimit(Number(e.target.value));
                          setPage(1); // Reset to page 1 on limit change
                        }}
                        className="appearance-none border border-gray-200 rounded-md py-1 pl-3 pr-8 bg-white focus:outline-none focus:ring-1 focus:ring-yellow-500 cursor-pointer text-gray-700"
                      >
                        <option value="4">4</option>
                        <option value="8">8</option>
                        <option value="12">12</option>
                        <option value="20">20</option>
                        <option value="50">50</option>
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
                    </div>
                    <span>per page</span>
                  </div>
                  <span>{listData.length > 0 ? listData.length : 0 } items</span>
                  <button onClick={() => setLimit(99999)} className="text-[12px] font-bold text-[#3a3a3a] uppercase tracking-widest hover:text-(b8654e) cursor-pointer">
                    SHOW ALL
                  </button>
                </div>
              </div>

              <div className={`grid ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-5' : 'grid-cols-1 gap-4'}`}>
                {paginatedListData.map((course: any) => (
                  <CourseCard
                    key={course.id}
                    variant="course"
                    category={course.category}
                    title={course.title}
                    level={course.level}
                    instructor={course.instructor}
                    durationText={course.durationText}
                    price={course.price}
                    thumbnailUrl={course.thumbnailUrl}
                    isEnrolled={course.isEnrolled}
                    progress={course.progress}
                    statusText={course.statusText}
                    isWishlisted={course.isWishlisted}
                    isWishlistLoading={wishlistMutation.isPending && wishlistMutation.variables?.entityId === course.id}
                    onWishlistToggle={(e) => handleWishlistToggle(course.id, 'course', e, course.isWishlisted)}
                    onEnrol={(e) => handleEnrol(course.id, e)}
                    isEnrolLoading={enrollMutation.isPending && enrollMutation.variables === course.id}
                    onClick={() => handleCourseClick(course.id, 'course')}
                    type="course"
                    isListView={viewMode === 'list'}
                    lessonsCount={course.lessonsCount ?? (course as any).totalLessons ?? (course as any).lessons?.length ?? 0}
                    role={role || undefined}
                    isCorporateAdmin={isCorporateAdmin}
                    onAssign={(e) => {
                      e.stopPropagation();
                      navigate(`/course-assignment?contentId=${course.id}&type=COURSE&title=${encodeURIComponent(course.title)}`, {
                        state: { contentId: course.id, contentType: 'COURSE', title: course.title }
                      });
                    }}
                  />
                ))}
              </div>

              {/* Pagination Footer */}
              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 border-t border-gray-100 font-mono">
                  <span className="text-xs text-gray-400 font-medium font-sans">
                    Showing {((page - 1) * limit) + 1}-{Math.min(page * limit, totalCourses)} of{" "}
                    {totalCourses} courses
                  </span>
                  <div className="flex items-center gap-1.5 text-xs font-bold font-sans">
                    <button
                      disabled={page === 1}
                      onClick={() => setPage(page - 1)}
                      className="border border-gray-300 rounded-lg px-3 py-1.5 hover:bg-gray-50 text-gray-700 flex items-center gap-1.5 mr-2 disabled:opacity-40"
                    >
                      <Play2 width={12} height={12} className="text-gray-500" /> Prev
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center ${p === page
                          ? "bg-gray-900 text-white font-semibold"
                          : "hover:bg-gray-50 text-gray-700 font-normal"
                          }`}
                      >
                        {p}
                      </button>
                    ))}
                    <button
                      disabled={page === totalPages}
                      onClick={() => setPage(page + 1)}
                      className="border border-gray-300 rounded-lg px-3 py-1.5 hover:bg-gray-50 text-gray-700 flex items-center gap-1.5 ml-2 disabled:opacity-40"
                    >
                      Next <Play width={12} height={12} className="text-gray-500" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Reusable CourseCard Sub-component handling all variants systematically
const CourseCard: React.FC<CourseCardProps> = ({
  variant = "course",
  category,
  title,
  level,
  instructor,
  durationText,
  price,
  thumbnailUrl,
  isEnrolled = false,
  progress,
  statusText,
  isWishlisted = false,
  isWishlistLoading = false,
  onWishlistToggle,
  onClick,
  type,
  isListView = false,
  lessonsCount = 0,
  role,
  isAllocated = false,
  isEnrolLoading = false,
  onEnrol,
  isCorporateAdmin = false,
  onAssign,
}) => {
  // Variant: Career Path Card
  if (variant === "career-path") {
    return (
      <div
        onClick={onClick}
        className={`bg-white border border-gray-200 rounded-xl p-5 flex flex-col justify-between shadow-sm relative group hover:border-gray-400 transition-all select-none cursor-pointer ${isListView ? "h-auto min-h-[100px] flex-row items-center gap-6" : "h-36 min-h-36 flex-col"
          }`}
      >
        {!isCorporateAdmin && (
          <button
            onClick={onWishlistToggle}
            disabled={isWishlistLoading}
            title={isWishlisted ? "Remove from wishlist" : "Save to wishlist"}
            className={`absolute top-3.5 right-3.5 w-7 h-7 sm:w-8 sm:h-8 border rounded-lg flex items-center justify-center transition-all disabled:opacity-50 ${
              isWishlisted
                ? "bg-[#fdf5ba] border-[#c99b2e] text-[#c99b2e] hover:bg-[#faee92]"
                : "bg-white border-gray-200 text-gray-400 hover:text-gray-900 hover:border-gray-300 hover:bg-gray-50"
            }`}
          >
            {isWishlistLoading ? (
              <svg className="animate-spin w-3.5 h-3.5 text-[#c99b2e]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <Bookmark className={`w-3.5 h-3.5 ${isWishlisted ? "fill-[#c99b2e] text-[#c99b2e]" : ""}`} />
            )}
          </button>
        )}

        <div className={`space-y-1 pr-6 ${isListView ? "flex-1" : ""}`}>
          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block">
            {category}
          </span>
          <h3 className="text-sm font-bold text-gray-900 cursor-pointer tracking-tight">
            {title}
          </h3>
          <p className="text-[11px] text-gray-400 font-medium">
            {durationText} {level ? `• ${level}` : ""}
          </p>
        </div>

        <div className={isListView ? "w-48 shrink-0 flex items-center justify-end pr-10" : "w-full"}>
          {progress !== undefined ? (
            <div className="space-y-1.5">
              <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                <div className="bg-gray-900 h-1.5 rounded-full" style={{ width: `${progress}%` }} />
              </div>
              <span className="text-[10px] font-bold text-gray-400 block text-right">{progress}%</span>
            </div>
          ) : (
            <div>
              <span className="bg-gray-100 text-gray-500 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                {statusText || "Not started"}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Variant: Standard Image Card (Courses / Short Videos)
  return (
    <div
      onClick={onClick}
      className={`bg-white border border-gray-200 overflow-hidden flex relative group hover:shadow-md transition-all select-none cursor-pointer ${isListView ? "flex-col md:flex-row md:h-[120px] p-0 md:items-stretch rounded-[16px]" : "flex-col h-full p-0 rounded-[16px]"
        }`}
    >
      <div className={`bg-[#eeeeee] relative shrink-0 overflow-hidden ${isListView ? "w-full md:w-[240px] h-[160px] md:h-full rounded-t-[16px] md:rounded-tr-none md:rounded-l-[16px]" : "h-[160px] w-full"
        }`}>
        {/* Placeholder or Thumbnail */}
        {thumbnailUrl ? (
          <img src={thumbnailUrl} alt={title} className="w-full h-full object-cover z-0" />
        ) : (
          <div className="w-full h-full bg-gray-100 flex items-center justify-center">
            <span className="text-gray-400 text-xs font-medium">No Image</span>
          </div>
        )}

        {/* Top Left Badge */}
        {level && (
          <div className="absolute top-2.5 left-2.5 z-10 bg-white/95 backdrop-blur-sm text-[#436496] px-2.5 py-1 rounded-full flex items-center gap-1.5 text-[10px] font-bold shadow-sm">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path></svg>
            {level}
          </div>
        )}

        {/* Bottom Left Duration Badge */}
        {durationText && (
          <div className="absolute bottom-2.5 left-2.5 z-10 bg-black/80 backdrop-blur-sm text-white px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center justify-center tracking-wide gap-1">
            {durationText}
          </div>
        )}
      </div>

      <div className={`flex-1 flex bg-white w-full ${isListView ? "flex-col p-4 md:justify-center md:py-3 md:px-5" : "flex-col p-4"}`}>
        <div className="flex-1">
          <div className="flex items-center gap-1.5 mb-1.5">
            {isListView ? (
              <>
                <Book className="w-[14px] h-[14px] text-[#5c5c5c] stroke-[2.5] md:hidden" />
                <Book className="w-3.5 h-3.5 text-[#5c5c5c] hidden md:block" />
              </>
            ) : (
              <Book className="w-[14px] h-[14px] text-[#5c5c5c] stroke-[2.5]" />
            )}
            <span className="text-[11px] font-bold text-[#5c5c5c] uppercase tracking-wider leading-none flex items-center">
              {(type || "COURSE").toUpperCase()}
              {category ? ` · ${category.toUpperCase()}` : ""}
              {lessonsCount !== undefined && lessonsCount > 0 ? ` · ${lessonsCount} ${lessonsCount === 1 ? 'LESSON' : 'LESSONS'}` : ""}
            </span>
            {price && (
              <span className={`text-[10px] font-bold normal-case tracking-normal px-2 py-0.5 rounded-full ${
                price.toLowerCase() === "free"
                  ? "bg-[#dcebd5] text-[#55714a]"
                  : "bg-gray-100 text-[#5c5c5c]"
              }`}>
                {price}
              </span>
            )}
          </div>
          <h4 className={`font-bold text-[#141414] leading-snug tracking-tight cursor-pointer line-clamp-2 mt-1 ${isListView ? "text-[16px] md:text-[20px]" : "text-[16px]"}`}>
            {title}
          </h4>
        </div>

        <div className={`flex justify-between items-center w-full border-t border-gray-100 mt-auto pt-3 ${isListView ? "md:border-none md:mt-2 md:pt-0" : ""}`}>
          <div className="flex items-center gap-1.5 overflow-hidden">
            <div className="w-6 h-6 rounded-full bg-[#f6e8c4] text-[#755a12] text-[12px] flex items-center justify-center font-bold shrink-0">
              {instructor ? instructor.charAt(instructor.startsWith("Dr.") ? 4 : 0).toUpperCase() : "I"}
            </div>
            <span className="text-[14px] text-[#5c5c5c] font-medium truncate whitespace-nowrap overflow-hidden">
              By: <span className="font-bold text-[#141414]">{instructor || "Nexus Academy"}</span>
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {!isCorporateAdmin && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (onWishlistToggle) onWishlistToggle(e);
                }}
                disabled={isWishlistLoading}
                title={isWishlisted ? "Remove from wishlist" : "Save to wishlist"}
                className={`w-7 h-7 sm:w-8 sm:h-8 border rounded-lg flex items-center justify-center transition-all disabled:opacity-50 ${
                  isWishlisted
                    ? "bg-[#fdf5ba] border-[#c99b2e] text-[#c99b2e] hover:bg-[#faee92]"
                    : "bg-white border-gray-200 text-gray-400 hover:text-gray-900 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                {isWishlistLoading ? (
                  <svg className="animate-spin w-3.5 h-3.5 text-[#c99b2e]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <Bookmark className={`w-3.5 h-3.5 ${isWishlisted ? "fill-[#c99b2e] text-[#c99b2e]" : ""}`} />
                )}
              </button>
            )}
            {isCorporateAdmin ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (onAssign) onAssign(e);
                }}
                className="px-4 h-7 rounded-full text-[12px] font-bold transition-colors whitespace-nowrap shadow-sm bg-[#c99b2e] text-white hover:bg-[#b08523] cursor-pointer"
              >
                Assign
              </button>
            ) : (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isEnrolled && onEnrol) onEnrol(e);
                }}
                disabled={isEnrolled || isEnrolLoading}
                className={`px-4 h-7 rounded-full text-[12px] font-bold transition-colors whitespace-nowrap ${
                  isEnrolled
                    ? "bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed"
                    : isEnrolLoading
                    ? "bg-gray-200 text-[#5c5c5c] cursor-not-allowed" 
                    : "bg-[#7e9b6f] text-[#ffffff] hover:bg-[#67855e] cursor-pointer"
                }`}
              >
                {isEnrolLoading 
                  ? "..." 
                  : isEnrolled 
                  ? "Enrolled" 
                  : "Enrol"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MemberLearning;