import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router";
import { useProfileStore } from "../../store/profile.store";
import { useUserStore } from "../../store/user.store";
import { useAuthStore } from "../../core/auth/auth.store";
import {
  useMemberLearningCourses,
  useWishlist,
  useEnrollCourse,
} from "../../hooks/member-learning/memberLearning";
import {
  Share2,
  Trash2,
  Search,
  Medal,
  PlayCircle,
  Plus,
  Star,
  ChevronRight,
  Bookmark,
  BookOpen,
  Grid,
  AlignLeft,
  GraduationCap,
  Sparkles,
  Clock,
  CheckCircle2,
  ArrowRight,
  Layers,
} from "lucide-react";

import { notification, Modal } from "antd";
import { showProfileIncompleteModal } from "../../utils/profileAlert";
import { Skeleton } from "../../components/ui/Skeleton/Skeleton";
import { Input } from "@/components/ui/Input";

const WishlistSkeleton: React.FC<{ viewMode: "list" | "grid" }> = ({ viewMode }) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-12" />
      </div>
      {viewMode === "list" ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="flex flex-col sm:flex-row sm:items-center justify-between bg-white border border-gray-100 rounded-2xl p-4 shadow-sm gap-4"
            >
              <div className="flex items-center gap-4 flex-1">
                <Skeleton className="w-16 h-16 rounded-xl shrink-0" />
                <div className="space-y-2 flex-1 max-w-md">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-3.5 w-1/2" />
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <Skeleton className="h-9 w-24 rounded-full" />
                <Skeleton className="h-9 w-9 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div
              key={i}
              className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm space-y-4"
            >
              <Skeleton className="w-full aspect-[16/9] rounded-xl" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-4/5" />
                <Skeleton className="h-3.5 w-1/2" />
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                <Skeleton className="h-8 w-20 rounded-full" />
                <Skeleton className="h-8 w-8 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const Wishlist: React.FC = () => {
  const navigate = useNavigate();
  const userId = useProfileStore((state) => state.profile?.id) || "";
  const isProfileReady = !!userId;

  const user = useUserStore((state) => state.user);
  const tenantId = useUserStore((state) => state.tenantId) || (user as any)?.tenantId || undefined;
  const userRoles = (user?.roles || []).map((r: any) => (typeof r === "string" ? r : r.name || ""));
  const authRole =
    useAuthStore((state) => state.user?.role) || (userRoles.length > 0 ? userRoles[0] : undefined);
  const systemRoles = (user as any)?.systemRoles || [];
  const isCorporateAdmin =
    systemRoles.some(
      (r: any) =>
        typeof r === "string" &&
        (r.toUpperCase().replace(/[\s-]+/g, "_") === "CORPORATE_ADMIN" ||
          r.toUpperCase() === "ADMIN")
    ) ||
    (user?.roles || []).some(
      (r: any) =>
        typeof r === "string" &&
        (r.toUpperCase().replace(/[\s-]+/g, "_") === "CORPORATE_ADMIN" ||
          r.toUpperCase() === "ADMIN")
    );

  const effectiveRole = isCorporateAdmin
    ? "CORPORATE_ADMIN"
    : authRole || (tenantId ? "CORPORATE_USER" : undefined);

  // Synchronized fetch with MemberLearning query key pattern
  const { data: coursesData, isLoading, refetch } = useMemberLearningCourses(
    userId,
    "Wishlist",
    { careerPath: [], difficulty: [], duration: [], price: [] },
    "",
    "Newest",
    1,
    99999,
    isProfileReady,
    effectiveRole,
    tenantId ?? undefined
  );

  const wishlistMutation = useWishlist();
  const enrollMutation = useEnrollCourse();

  const [removingId, setRemovingId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "grid">("grid");
  const [sortParam, setSortParam] = useState("recently-saved");
  const [activeFilterTab, setActiveFilterTab] = useState<"all" | "courses" | "paths" | "lessons">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const wishlistedItems = useMemo(() => coursesData?.data || [], [coursesData]);

  // Handle Remove / Un-bookmark
  const handleRemove = async (id: string, type: string = "course", title?: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setRemovingId(id);
    try {
      await wishlistMutation.mutateAsync({ entityId: id, entityType: type });
      await refetch();
      notification.info({
        message: "Removed from Wishlist",
        description: title ? `"${title}" has been removed from your wishlist.` : "Item removed from wishlist.",
        duration: 2.5,
      });
    } catch (err) {
      console.error("Failed to remove item from wishlist", err);
    } finally {
      setRemovingId(null);
    }
  };

  // Handle Clear All Wishlist
  const handleClearAll = () => {
    if (wishlistedItems.length === 0) return;
    Modal.confirm({
      title: "Clear all saved items?",
      content: "Are you sure you want to remove all saved courses and learning paths from your wishlist?",
      okText: "Clear All",
      okType: "danger",
      cancelText: "Cancel",
      onOk: async () => {
        try {
          for (const item of wishlistedItems) {
            await wishlistMutation.mutateAsync({ entityId: item.id, entityType: item.type || "course" });
          }
          await refetch();
          notification.success({
            message: "Wishlist Cleared",
            description: "All saved items have been cleared.",
            duration: 2.5,
          });
        } catch (err) {
          console.error("Failed to clear wishlist", err);
        }
      },
    });
  };

  // Handle Enrollment
  const handleEnroll = async (itemId: string, itemTitle?: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await enrollMutation.mutateAsync(itemId);
      notification.success({
        message: "Enrolled Successfully",
        description: `You have successfully enrolled in ${itemTitle || "the course"}.`,
        duration: 3,
      });
      await refetch();
    } catch (err: any) {
      console.error("Failed to enroll", err);
      const data = err?.response?.data;
      const msg = data?.message || err?.message || "Failed to enrol";
      if (data?.profileCompletionRequired || msg.includes("not 80%") || msg.includes("80%")) {
        showProfileIncompleteModal(navigate, msg, data?.profileCompleteness);
      } else {
        notification.error({
          message: "Enrollment Failed",
          description: msg,
          duration: 3,
        });
      }
    }
  };

  // Filtering by search & active tab
  const filteredItems = useMemo(() => {
    let items = [...wishlistedItems];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      items = items.filter(
        (item) =>
          item.title?.toLowerCase().includes(q) ||
          item.category?.toLowerCase().includes(q) ||
          item.instructor?.toLowerCase().includes(q)
      );
    }

    if (activeFilterTab === "courses") {
      items = items.filter((i) => !i.type || i.type === "course");
    } else if (activeFilterTab === "paths") {
      items = items.filter((i) => i.type === "career-path");
    } else if (activeFilterTab === "lessons") {
      items = items.filter((i) => i.type === "lesson");
    }

    // Sort
    if (sortParam === "alphabetical") {
      items.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
    } else if (sortParam === "recently-saved") {
      items.sort((a, b) => {
        const timeA = new Date(a.wishlistedAt || a.createdAt || 0).getTime();
        const timeB = new Date(b.wishlistedAt || b.createdAt || 0).getTime();
        return timeB - timeA;
      });
    } else if (sortParam === "shortest") {
      items.sort((a, b) => {
        const durA = Number(a.totalDurationHours || (a.totalDurationMins ? a.totalDurationMins / 60 : 0) || 0);
        const durB = Number(b.totalDurationHours || (b.totalDurationMins ? b.totalDurationMins / 60 : 0) || 0);
        return durA - durB;
      });
    } else if (sortParam === "longest") {
      items.sort((a, b) => {
        const durA = Number(a.totalDurationHours || (a.totalDurationMins ? a.totalDurationMins / 60 : 0) || 0);
        const durB = Number(b.totalDurationHours || (b.totalDurationMins ? b.totalDurationMins / 60 : 0) || 0);
        return durB - durA;
      });
    }

    return items;
  }, [wishlistedItems, searchQuery, activeFilterTab, sortParam]);

  const coursesCount = useMemo(
    () => wishlistedItems.filter((i) => !i.type || i.type === "course").length,
    [wishlistedItems]
  );
  const pathsCount = useMemo(
    () => wishlistedItems.filter((i) => i.type === "career-path").length,
    [wishlistedItems]
  );
  const lessonsCount = useMemo(
    () => wishlistedItems.filter((i) => i.type === "lesson").length,
    [wishlistedItems]
  );

  const getThumbnail = (item: any) => {
    const imageUrl = item.thumbnailUrl || item.coverImage;
    if (imageUrl) {
      return <img src={imageUrl} alt={item.title} className="w-full h-full object-cover" />;
    }
    if (item.type === "career-path") {
      return (
        <div className="w-full h-full bg-[#fdf5ba]/60 flex items-center justify-center text-[#c99b2e]">
          <Medal size={28} strokeWidth={1.5} />
        </div>
      );
    }
    if (item.type === "lesson") {
      return (
        <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-500">
          <PlayCircle size={28} strokeWidth={1.5} />
        </div>
      );
    }
    return (
      <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-gray-400">
        <BookOpen size={28} strokeWidth={1.5} />
      </div>
    );
  };

  const getTimeAgo = (dateString?: string) => {
    if (!dateString) return "Saved recently";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return diffMins <= 1 ? "Just now" : `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  };

  const handleItemClick = (item: any) => {
    navigate(`/course-details?id=${item.id}&type=${item.type || "course"}`);
  };

  return (
    <div className="w-full min-h-screen bg-white font-sans text-gray-900 pb-16">
      <div className="mx-auto space-y-6">
        {/* --- HEADER SECTION --- */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-gray-100 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-widest text-[#c99b2e] bg-[#fdf5ba] px-2.5 py-0.5 rounded-full">
                Saved for later
              </span>
              <span className="text-gray-300">·</span>
              <span className="text-[12px] text-gray-500 font-medium">
                {wishlistedItems.length} {wishlistedItems.length === 1 ? "item" : "items"}
              </span>
            </div>
            <h1 className="text-[28px] sm:text-[32px] font-bold text-[#141414] tracking-tight leading-tight">
              Your Wishlist
            </h1>
            <p className="text-[15px] text-[#5c5c5c] mt-1 max-w-2xl">
              Courses, career tracks, and quick lessons you have bookmarked. Items added or removed here automatically sync with your learning catalog.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {wishlistedItems.length > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-full border border-gray-200 text-gray-600 hover:text-red-600 hover:border-red-200 hover:bg-red-50 text-[13px] font-semibold transition-all cursor-pointer"
              >
                <Trash2 size={15} />
                Clear Wishlist
              </button>
            )}
            <button
              type="button"
              onClick={() => navigate("/member-learning")}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-[#fdf5ba] hover:bg-[#f6eb95] text-[#141414] font-bold px-5 py-2.5 rounded-full transition-colors text-[13px] border border-[#c99b2e]/30 shadow-xs cursor-pointer"
            >
              <Search size={15} />
              Browse Catalog
            </button>
          </div>
        </div>

        {/* --- FILTER TABS + TOOLBAR --- */}
        <div className="space-y-4">
          {/* Category Tabs */}
          <div className="flex flex-wrap items-center gap-2 border-b border-gray-100 pb-3">
            <button
              type="button"
              onClick={() => setActiveFilterTab("all")}
              className={`px-4 py-1.5 rounded-full text-[13px] font-semibold transition-all cursor-pointer ${
                activeFilterTab === "all"
                  ? "bg-[#141414] text-white shadow-xs"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              All Items ({wishlistedItems.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilterTab("courses")}
              className={`px-4 py-1.5 rounded-full text-[13px] font-semibold transition-all cursor-pointer ${
                activeFilterTab === "courses"
                  ? "bg-[#141414] text-white shadow-xs"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Courses ({coursesCount})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilterTab("paths")}
              className={`px-4 py-1.5 rounded-full text-[13px] font-semibold transition-all cursor-pointer ${
                activeFilterTab === "paths"
                  ? "bg-[#141414] text-white shadow-xs"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Career Paths ({pathsCount})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilterTab("lessons")}
              className={`px-4 py-1.5 rounded-full text-[13px] font-semibold transition-all cursor-pointer ${
                activeFilterTab === "lessons"
                  ? "bg-[#141414] text-white shadow-xs"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Short Lessons ({lessonsCount})
            </button>
          </div>

          {/* Controls: Search, View Mode, Sort */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="relative w-full max-w-[360px]">
              <Input
                type="text"
                placeholder="Search saved items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full border border-gray-200 rounded-full bg-white pl-10 pr-4 py-2 text-[13px] focus:outline-none focus:border-[#c99b2e] focus:ring-1 focus:ring-[#c99b2e] text-gray-700 placeholder-gray-400"
              />
              <Search className="absolute left-3.5 top-[10px] w-4 h-4 text-gray-400" />
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <div className="flex items-center bg-gray-100 rounded-full border border-gray-200 overflow-hidden h-9">
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  title="Grid View"
                  className={`w-10 h-full flex items-center justify-center transition-colors cursor-pointer ${
                    viewMode === "grid" ? "bg-[#141414] text-white" : "text-gray-500 hover:bg-gray-200"
                  }`}
                >
                  <Grid width={15} height={15} strokeWidth={2} />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  title="List View"
                  className={`w-10 h-full flex items-center justify-center transition-colors cursor-pointer ${
                    viewMode === "list" ? "bg-[#141414] text-white" : "text-gray-500 hover:bg-gray-200"
                  }`}
                >
                  <AlignLeft width={15} height={15} strokeWidth={2} />
                </button>
              </div>

              <div className="relative h-9 min-w-[170px]">
                <select
                  value={sortParam}
                  onChange={(e) => setSortParam(e.target.value)}
                  className="appearance-none bg-white border border-gray-200 hover:border-[#c99b2e] rounded-xl pl-3.5 pr-8 h-full w-full text-[13px] font-medium text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#c99b2e] focus:border-[#c99b2e] transition-colors cursor-pointer bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2214%22%20height%3D%2214%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%238c734b%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22M6%209l6%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:calc(100%-10px)_center]"
                >
                  <option value="recently-saved">Recently Saved</option>
                  <option value="alphabetical">Alphabetical (A-Z)</option>
                  <option value="shortest">Shortest Duration</option>
                  <option value="longest">Longest Duration</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* --- CONTENT AREA --- */}
        {isLoading ? (
          <WishlistSkeleton viewMode={viewMode} />
        ) : filteredItems.length === 0 ? (
          /* Empty State */
          <div className="border border-dashed border-gray-200 bg-gray-50/60 rounded-2xl p-12 text-center flex flex-col items-center justify-center space-y-4 my-8">
            <div className="w-14 h-14 rounded-2xl bg-[#fdf5ba] text-[#c99b2e] flex items-center justify-center shadow-xs">
              <Bookmark className="w-7 h-7 fill-[#c99b2e]" />
            </div>
            <div className="max-w-md space-y-1">
              <h3 className="text-[18px] font-bold text-[#141414]">
                {searchQuery ? "No matching saved items" : "Your wishlist is empty"}
              </h3>
              <p className="text-[14px] text-[#5c5c5c]">
                {searchQuery
                  ? `No bookmark results found for "${searchQuery}". Try a different keyword or reset search.`
                  : "Explore our rich catalog of courses and career tracks. Click the bookmark icon on any course card to save it here."}
              </p>
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  if (searchQuery) setSearchQuery("");
                  else navigate("/member-learning");
                }}
                className="inline-flex items-center gap-2 bg-[#141414] hover:bg-black text-white text-[13px] font-bold px-5 py-2.5 rounded-full transition-all cursor-pointer shadow-xs"
              >
                {searchQuery ? "Reset Search" : "Explore Courses"}
                <ArrowRight size={15} />
              </button>
            </div>
          </div>
        ) : viewMode === "list" ? (
          /* List View */
          <div className="space-y-3">
            {filteredItems.map((item) => {
              const isRemoving = removingId === item.id;
              const isEnrolling = enrollMutation.isPending && enrollMutation.variables === item.id;

              return (
                <div
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className="group flex flex-col sm:flex-row sm:items-center justify-between bg-white border border-gray-200 hover:border-gray-400 rounded-2xl p-4 shadow-xs transition-all cursor-pointer gap-4"
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-gray-100 shrink-0 overflow-hidden border border-gray-100 relative">
                      {getThumbnail(item)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#c99b2e] bg-[#fdf5ba] px-2 py-0.5 rounded">
                          {item.type === "career-path"
                            ? "Career Path"
                            : item.type === "lesson"
                            ? "Short Lesson"
                            : "Course"}
                        </span>
                        {item.level && (
                          <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                            {item.level}
                          </span>
                        )}
                        <span className="text-[11px] text-gray-400">· {getTimeAgo(item.wishlistedAt)}</span>
                      </div>
                      <h4 className="font-bold text-[15px] sm:text-[16px] text-[#141414] leading-snug group-hover:text-[#c99b2e] transition-colors truncate">
                        {item.title}
                      </h4>
                      <p className="text-[13px] text-gray-500 mt-0.5 flex items-center gap-2">
                        {item.instructor && <span>By {item.instructor}</span>}
                        {item.durationText && <span>· {item.durationText}</span>}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                    {/* Synchronized Bookmark Button matching the attached UI design */}
                    <button
                      type="button"
                      onClick={(e) => handleRemove(item.id, item.type || "course", item.title, e)}
                      disabled={isRemoving}
                      title="Remove from wishlist"
                      className="w-9 h-9 rounded-xl border border-[#c99b2e] bg-[#fdf5ba]/40 text-[#c99b2e] hover:bg-[#faee92] flex items-center justify-center transition-all cursor-pointer disabled:opacity-50"
                    >
                      {isRemoving ? (
                        <svg
                          className="animate-spin w-4 h-4 text-[#c99b2e]"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                      ) : (
                        <Bookmark className="w-4 h-4 fill-[#c99b2e] text-[#c99b2e]" strokeWidth={1.75} />
                      )}
                    </button>

                    {/* Enrol / Continue Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (item.isEnrolled) {
                          handleItemClick(item);
                        } else {
                          handleEnroll(item.id, item.title, e);
                        }
                      }}
                      disabled={isEnrolling}
                      className={`h-9 px-4 rounded-full text-[13px] font-bold transition-all whitespace-nowrap cursor-pointer ${
                        item.isEnrolled
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                          : "bg-[#141414] hover:bg-black text-white shadow-xs"
                      }`}
                    >
                      {isEnrolling ? (
                        "..."
                      ) : item.isEnrolled ? (
                        <span className="flex items-center gap-1.5">
                          <CheckCircle2 size={14} className="text-emerald-600" /> Continue
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5">
                          <Plus size={14} /> Enrol
                        </span>
                      )}
                    </button>

                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-900 group-hover:translate-x-0.5 transition-all ml-1 hidden sm:block" />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Grid View */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredItems.map((item) => {
              const isRemoving = removingId === item.id;
              const isEnrolling = enrollMutation.isPending && enrollMutation.variables === item.id;

              return (
                <div
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className="group flex flex-col bg-white border border-gray-200 hover:border-gray-400 rounded-2xl shadow-xs hover:shadow-md transition-all cursor-pointer overflow-hidden select-none"
                >
                  {/* Thumbnail Banner */}
                  <div className="h-44 relative bg-gray-100 overflow-hidden border-b border-gray-100">
                    {getThumbnail(item)}

                    {/* Type badge */}
                    <div className="absolute top-3 left-3 bg-[#fdf5ba] text-[#755a12] border border-[#c99b2e]/30 px-2.5 py-0.5 rounded-full text-[11px] font-bold flex items-center gap-1 shadow-xs">
                      {item.type === "career-path" ? (
                        <Medal size={12} strokeWidth={2.5} />
                      ) : item.type === "lesson" ? (
                        <PlayCircle size={12} strokeWidth={2.5} />
                      ) : (
                        <BookOpen size={12} strokeWidth={2.5} />
                      )}
                      <span>
                        {item.type === "career-path"
                          ? "Career Path"
                          : item.type === "lesson"
                          ? "Lesson"
                          : "Course"}
                      </span>
                    </div>

                    {/* Duration badge */}
                    {item.durationText && (
                      <div className="absolute bottom-3 left-3 bg-black/75 backdrop-blur-xs text-white px-2 py-0.5 rounded-md text-[11px] font-medium flex items-center gap-1 shadow-xs">
                        <Clock size={11} />
                        <span>{item.durationText}</span>
                      </div>
                    )}

                    {/* Bookmark Icon in card top right */}
                    <button
                      type="button"
                      onClick={(e) => handleRemove(item.id, item.type || "course", item.title, e)}
                      disabled={isRemoving}
                      title="Remove from wishlist"
                      className="absolute top-3 right-3 w-8 h-8 rounded-xl bg-white/95 backdrop-blur-xs border border-[#c99b2e] text-[#c99b2e] hover:bg-[#fdf5ba] shadow-xs flex items-center justify-center transition-all cursor-pointer disabled:opacity-50"
                    >
                      {isRemoving ? (
                        <svg
                          className="animate-spin w-3.5 h-3.5 text-[#c99b2e]"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                      ) : (
                        <Bookmark className="w-4 h-4 fill-[#c99b2e] text-[#c99b2e]" strokeWidth={1.75} />
                      )}
                    </button>
                  </div>

                  {/* Body Content */}
                  <div className="p-4 flex flex-col flex-1">
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 truncate">
                      {item.category || "General"}
                    </p>

                    <h4 className="font-bold text-[15px] text-[#141414] leading-snug group-hover:text-[#c99b2e] transition-colors line-clamp-2 mb-3">
                      {item.title}
                    </h4>

                    {/* Footer Info & Actions */}
                    <div className="mt-auto pt-3 border-t border-gray-100 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 overflow-hidden pr-2">
                        <div className="w-6 h-6 rounded-full bg-[#f6e8c4] text-[#755a12] text-[11px] font-bold flex items-center justify-center shrink-0">
                          {item.instructor
                            ? item.instructor.charAt(item.instructor.startsWith("Dr.") ? 4 : 0).toUpperCase()
                            : "N"}
                        </div>
                        <span className="text-[12px] text-gray-500 truncate">
                          {item.instructor || "Nexus Academy"}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (item.isEnrolled) {
                            handleItemClick(item);
                          } else {
                            handleEnroll(item.id, item.title, e);
                          }
                        }}
                        disabled={isEnrolling}
                        className={`px-3 py-1.5 rounded-full text-[12px] font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                          item.isEnrolled
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                            : "bg-[#141414] hover:bg-black text-white shadow-xs"
                        }`}
                      >
                        {isEnrolling ? (
                          "..."
                        ) : item.isEnrolled ? (
                          "Continue"
                        ) : (
                          "Enrol"
                        )}
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

export default Wishlist;
