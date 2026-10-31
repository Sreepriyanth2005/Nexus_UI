import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router";
import { useProfileStore } from "../../store/profile.store";
import { useMemberLearningCourses, useWishlist, useEnrollCourse } from "../../hooks/member-learning/memberLearning";
import { Share2, Trash2, Search, Medal, PlayCircle, Plus, Star, ChevronDown, ChevronRight, Bookmark, BookOpen as Book, Grid, AlignLeft } from "lucide-react";

import { notification } from "antd";
import { showProfileIncompleteModal } from "../../utils/profileAlert";
import { Skeleton } from "../../components/ui/Skeleton/Skeleton";

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
              className="flex flex-col sm:flex-row sm:items-center justify-between bg-[var(--paper)] border border-[var(--line)] rounded-xl p-4 shadow-sm gap-4"
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="bg-[var(--paper)] border border-[var(--line)] rounded-2xl p-4 shadow-sm space-y-4"
            >
              <Skeleton className="w-full aspect-[16/9] rounded-xl" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-4/5" />
                <Skeleton className="h-3.5 w-1/2" />
              </div>
              <div className="flex justify-between items-center pt-2">
                <Skeleton className="h-9 w-24 rounded-full" />
                <Skeleton className="h-8 w-8 rounded-full" />
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

  // We fetch raw data
  const { data: coursesData, isLoading, refetch } = useMemberLearningCourses(
    userId,
    "Wishlist", // Only get wishlisted items
    { careerPath: [], difficulty: [], duration: [], price: [] },
    "",
    "Newest",
    1,
    9999,
    isProfileReady
  );

  const wishlistMutation = useWishlist();
  const enrollMutation = useEnrollCourse();
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [sortParam, setSortParam] = useState("recently-saved");

  const handleRemove = async (id: string, type: string) => {
    setRemovingId(id);
    try {
      await wishlistMutation.mutateAsync({ entityId: id, entityType: type });
      refetch(); // refresh the list
    } finally {
      setRemovingId(null);
    }
  };

  const handleEnroll = async (itemId: string, itemTitle?: string) => {
    try {
      await enrollMutation.mutateAsync(itemId);
      notification.success({
        title: "Enrolled Successfully",
        description: `You have enrolled in ${itemTitle || "the course"}.`,
      });
      refetch();
    } catch (err: any) {
      console.error("Failed to enroll", err);
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

  const wishlistedItems = coursesData?.data || [];

  const sortedItems = useMemo(() => {
    let items = [...wishlistedItems];
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
  }, [wishlistedItems, sortParam]);

  // Group items by type
  const courses = sortedItems.filter((item) => !item.type || item.type === "course");
  const careerPaths = sortedItems.filter((item) => item.type === "career-path");
  const shortVideos = sortedItems.filter((item) => item.type === "lesson");

  const renderEmptyState = (type: string) => (
    <div className="border border-(--line) border-dashed rounded-xl p-6 text-center bg-(--surface-1)">
      <p className="text-[14px] text-(--ink-mute)">
        No {type} saved yet.{" "}
        <button
          onClick={() => navigate("/learning")}
          className="text-(--c-honey) font-bold hover:underline ml-1"
        >
          Browse {type} →
        </button>
      </p>
    </div>
  );

  const getThumbnail = (item: any) => {
    const imageUrl = item.thumbnailUrl || item.coverImage;
    if (imageUrl) {
      return <img src={imageUrl} alt={item.title} className="w-full h-full object-cover" />;
    }
    if (item.type === "career-path") {
      return (
        <div className="w-full h-full bg-(--c-honey-wash) flex items-center justify-center text-(--c-honey)">
          <Medal size={24} strokeWidth={1.5} />
        </div>
      );
    }
    if (item.type === "lesson") {
      return (
        <div className="w-full h-full bg-(--surface-2) flex items-center justify-center text-(--ink-soft)">
          <PlayCircle size={24} strokeWidth={1.5} />
        </div>
      );
    }
    return <div className="w-full h-full bg-(--surface-1)"></div>;
  };

  const formatSubtitle = (item: any) => {
    const parts = [];
    parts.push(item.type === "career-path" ? "Career path" : item.type === "lesson" ? "Short video" : "Course");
    if (item.durationText) {
      parts.push(item.durationText);
    } else if (item.lessonsCount) {
      parts.push(`${item.lessonsCount} lessons`);
    }
    return parts.join(" · ");
  };

  const getTimeAgo = (dateString?: string) => {
    if (!dateString) return "Saved recently";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30);

    if (diffMins < 60) return diffMins <= 1 ? "Saved just now" : `Saved ${diffMins} minutes ago`;
    if (diffHours < 24) return diffHours === 1 ? "Saved 1 hour ago" : `Saved ${diffHours} hours ago`;
    if (diffDays < 7) return diffDays === 1 ? "Saved 1 day ago" : `Saved ${diffDays} days ago`;
    if (diffWeeks < 4) return diffWeeks === 1 ? "Saved 1 week ago" : `Saved ${diffWeeks} weeks ago`;
    if (diffMonths < 12) return diffMonths === 1 ? "Saved 1 month ago" : `Saved ${diffMonths} months ago`;
    return "Saved a long time ago";
  };

  return (
    <>
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end  border-(--line) pb-6 mb-2 gap-4">
        <div>
          <p className="text-[11px] font-bold text-(--ink-mute) uppercase tracking-widest mb-2">Saved for later</p>
          <h1 className="text-[32px] font-bold text-(--ink) mb-2 tracking-tight">Your wishlist</h1>
          <p className="text-[15px] text-(--ink-mute)">
            {wishlistedItems.length} saved · organised by type
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto mb-10">
          <button
            onClick={() => navigate("/member-learning")}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-[#fdf5ba] hover:bg-[#f6eb95] text-(--ink) font-bold px-5 py-2.5 rounded-full transition-colors text-[14px] border-none"
          >
            <Search size={16} />
            Browse to add
          </button>
          <button className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-(--paper) border border-(--line-strong) hover:bg-(--paper-2) text-(--ink) font-bold px-5 py-2.5 rounded-full transition-colors text-[14px]">
            <Share2 size={16} />
            Share list
          </button>
        </div>
      </div>

      {/* Filters/Sort Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-center pb-6 mb-8 gap-4 border-b border-(--line)">
        <p className="text-[15px] text-(--ink-mute) w-full sm:w-auto">
          {wishlistedItems.length} saved across 3 types
        </p>
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="flex items-center bg-(--paper) rounded-full border border-(--line) overflow-hidden h-9.5">
            <button
              onClick={() => setViewMode("grid")}
              className={`w-11.5 h-full flex items-center justify-center transition-colors ${
                viewMode === "grid" ? "bg-(--ink) text-(--paper)" : "text-(--ink-mute) hover:bg-(--surface-1)"
              }`}
            >
              <Grid width={16} height={16} />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`w-11.5 h-full flex items-center justify-center transition-colors ${
                viewMode === "list" ? "bg-(--ink) text-(--paper)" : "text-(--ink-mute) hover:bg-(--surface-1)"
              }`}
            >
              <AlignLeft width={16} height={16} />
            </button>
          </div>
          <div className="relative h-9.5 min-w-[175px]">
            <select 
              value={sortParam}
              onChange={(e) => setSortParam(e.target.value)}
              className="appearance-none bg-white border border-[#c99b2e8c] hover:border-[#c99b2e] rounded-xl pl-3.5 pr-8 h-full w-full text-[13px] sm:text-[14px] font-medium text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#c99b2e] focus:border-[#c99b2e] transition-colors cursor-pointer bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2214%22%20height%3D%2214%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%238c734b%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22M6%209l6%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:calc(100%-10px)_center]"
            >
              <option value="recently-saved">Sort: Recently saved</option>
              <option value="alphabetical">Alphabetical</option>
              <option value="shortest">Shortest first</option>
              <option value="longest">Longest first</option>
            </select>
          </div>
        </div>
      </div>

      {isLoading ? (
        <WishlistSkeleton viewMode={viewMode} />
      ) : (
        <div className="space-y-12">

          {/* Courses Section */}
          <section>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-[16px] font-bold text-(--ink)">
                Courses <span className="text-(--ink-mute) font-normal">({courses.length})</span>
              </h2>
              <button className="text-[12px] font-bold text-(--ink-mute) hover:text-(--ink) uppercase">Clear</button>
            </div>

            {courses.length === 0 ? (
              renderEmptyState("courses")
            ) : (
              <>
                {viewMode === "list" ? (
                  <div className="space-y-3">
                    {courses.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => navigate(`/course-details?id=${item.id}&type=${item.type || 'course'}`)}
                        className="group flex flex-col sm:flex-row sm:items-center justify-between bg-(--paper) border border-(--line) rounded-xl p-4 shadow-sm transition-all cursor-pointer gap-4"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 rounded-xl bg-(--surface-1) shrink-0 overflow-hidden border border-(--line)">
                            {getThumbnail(item)}
                          </div>
                          <div>
                            <h4 className="font-bold text-[15px] text-(--ink) leading-tight mb-1 ">
                              {item.title}
                            </h4>
                            <p className="text-[13px] text-(--ink-mute)">
                              {formatSubtitle(item)}
                            </p>
                          </div>
                        </div>
    
                        <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
                          <span className="text-[12px] text-(--ink-soft) whitespace-nowrap hidden sm:block">
                            {item.price === "Free" ? "Free access · " : ""}{getTimeAgo(item.wishlistedAt)}
                          </span>
    
                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => { e.stopPropagation(); }}
                              className="w-10 h-10 flex items-center justify-center rounded-full border border-(--line) text-(--ink-mute) hover:bg-(--surface-1) transition-colors"
                            >
                              <Share2 size={16} />
                            </button>
    
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!item.isEnrolled) {
                                  handleEnroll(item.id, item.title);
                                }
                              }}
                              disabled={item.isEnrolled || (enrollMutation.isPending && enrollMutation.variables === item.id)}
                              className={`h-10 px-4 flex items-center justify-center gap-1.5 rounded-full text-[13px] font-bold transition-colors whitespace-nowrap ${
                                item.isEnrolled
                                  ? "bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed"
                                  : (enrollMutation.isPending && enrollMutation.variables === item.id)
                                  ? "bg-gray-200 text-[#5c5c5c] cursor-not-allowed"
                                  : "border border-(--line) text-(--ink) hover:bg-(--surface-1) cursor-pointer"
                              }`}
                            >
                              {enrollMutation.isPending && enrollMutation.variables === item.id ? (
                                "..."
                              ) : item.isEnrolled ? (
                                "Enrolled"
                              ) : (
                                <>
                                  <Plus size={16} /> Enrol
                                </>
                              )}
                            </button>
    
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemove(item.id, item.type || 'course');
                              }}
                              disabled={removingId === item.id}
                              className="w-10 h-10 flex items-center justify-center rounded-full border border-(--line) text-(--ink-mute) hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors disabled:opacity-50"
                            >
                              {removingId === item.id ? (
                                <svg className="animate-spin h-4 w-4 text-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                              ) : (
                                <Trash2 size={16} />
                              )}
                            </button>
                            <button className="w-8 h-10 flex items-center justify-end text-(--ink-soft) group-hover:text-(--ink) transition-colors ml-1">
                              <ChevronRight width={20} height={20} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {courses.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => navigate(`/course-details?id=${item.id}&type=${item.type || 'course'}`)}
                        className="group flex flex-col bg-(--paper) border border-(--line) rounded-xl hover:border-(--ink-mute) hover:shadow-sm transition-all cursor-pointer overflow-hidden"
                      >
                        <div className="h-40 relative bg-(--surface-1) border-b border-(--line)">
                          {getThumbnail(item)}
                          <div className="absolute top-3 left-3 bg-[#e8f2ff] text-[#2563eb] px-2 py-0.5 rounded-full text-[11px] font-bold flex items-center gap-1 shadow-sm">
                            <Star size={11} strokeWidth={2.5} /> {item.level || "Practitioner"}
                          </div>
                          <div className="absolute bottom-3 left-3 bg-black/70 text-white px-2 py-0.5 rounded-md text-[11px] font-bold shadow-sm">
                            {item.durationText || "28 min"}
                          </div>
                        </div>
                        <div className="p-4 flex flex-col flex-1">
                          <p className="text-[11px] font-bold text-(--ink-mute) uppercase tracking-wider mb-2 flex items-center gap-1.5">
                            <Book width={13} height={13} /> COURSE · {item.lessonsCount || "20"} LESSONS
                            {item.price === "Free" && <span className="bg-[#e7f5e8] text-[#2e7d32] px-1.5 py-0.5 rounded ml-1 font-bold normal-case text-[10px]">Free</span>}
                          </p>
                          <h4 className="font-bold text-[16px] text-(--ink) leading-tight mb-4 group-hover:underline line-clamp-2">
                            {item.title}
                          </h4>
                          <div className="mt-auto flex items-center justify-between pt-4 border-t border-(--line) border-dashed">
                             <div className="flex items-center gap-2">
                               <div className="w-6 h-6 rounded-full bg-[#fdf5ba] text-[#d6b700] flex items-center justify-center text-[10px] font-bold">
                                 {item.instructor ? item.instructor.charAt(0).toUpperCase() : "I"}
                               </div>
                               <span className="text-[12px] text-(--ink-soft)">By: <span className="font-bold text-(--ink)">{item.instructor || "Nexus Academy"}</span></span>
                             </div>
                             <div className="flex items-center gap-2">
                               <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemove(item.id, item.type || 'course');
                                  }}
                                  disabled={removingId === item.id}
                                  className="w-[38px] h-[38px] flex items-center justify-center rounded-[10px] border border-(--line) text-(--ink) hover:bg-(--surface-1) transition-colors disabled:opacity-50"
                               >
                                 <Bookmark width={18} height={18} />
                               </button>
                               <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (!item.isEnrolled) {
                                      handleEnroll(item.id, item.title);
                                    }
                                  }}
                                  disabled={item.isEnrolled || (enrollMutation.isPending && enrollMutation.variables === item.id)}
                                  className={`h-8 px-4 rounded-full text-[13px] font-bold transition-colors whitespace-nowrap ${
                                    item.isEnrolled
                                      ? "bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed"
                                      : (enrollMutation.isPending && enrollMutation.variables === item.id)
                                      ? "bg-gray-200 text-[#5c5c5c] cursor-not-allowed"
                                      : "bg-[#789d6e] text-white hover:bg-[#66875d] cursor-pointer"
                                  }`}
                                >
                                  {enrollMutation.isPending && enrollMutation.variables === item.id 
                                    ? "..." 
                                    : item.isEnrolled 
                                    ? "Enrolled" 
                                    : "Enrol"}
                                </button>
                             </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </section>

          

        </div>
      )}


    </>
  );
};

export default Wishlist;
