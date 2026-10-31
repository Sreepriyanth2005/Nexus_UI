import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import {
  BookOpen,
  Search,
  ChevronLeft,
  Clock,
  Award,
} from "lucide-react";
import { memberLearningApi } from "../../core/api/member-learning/memberLearningApi";
import { useProfileStore } from "../../store/profile.store";

// ─── Skeleton Card ────────────────────────────────────────────────────────────
const SkeletonCard = () => (
  <div className="bg-white border border-slate-200 rounded-xl overflow-hidden animate-pulse shadow-sm">
    <div className="bg-slate-200 h-40 w-full" />
    <div className="p-4 space-y-3">
      <div className="h-3 bg-slate-200 rounded w-1/4" />
      <div className="h-4 bg-slate-200 rounded w-3/4" />
      <div className="h-3 bg-slate-200 rounded w-1/2" />
    </div>
  </div>
);

// ─── Type badge helper ────────────────────────────────────────────────────────
const TypeBadge = () => (
  <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700">
    <BookOpen size={10} />
    Course
  </span>
);

// ─── Content Card ─────────────────────────────────────────────────────────────
const ContentCard = ({
  item,
  onClick,
}: {
  item: any;
  onClick: () => void;
}) => (
  <div
    onClick={onClick}
    className="bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer group shadow-sm"
  >
    {/* Thumbnail */}
    <div className="bg-gradient-to-br from-slate-100 to-slate-200 h-40 w-full flex items-center justify-center shrink-0 relative overflow-hidden">
      {item.thumbnailUrl ? (
        <img
          src={item.thumbnailUrl}
          alt={item.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      ) : (
        <div className="flex flex-col items-center gap-2 text-slate-400">
          <BookOpen size={28} strokeWidth={1.5} />
          <span className="text-xs font-medium tracking-wide">Course</span>
        </div>
      )}
      {item.isEnrolled && (
        <span className="absolute top-2 left-2 inline-flex items-center gap-1 bg-emerald-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-md">
          <span className="w-1.5 h-1.5 rounded-full bg-white" />
          Enrolled
        </span>
      )}
    </div>

    {/* Body */}
    <div className="p-4 flex flex-col flex-1 justify-between space-y-2">
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5 flex-wrap">
          <TypeBadge />
          {item.level && (
            <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md uppercase">
              {item.level}
            </span>
          )}
          {item.category && (
            <span className="text-[9px] font-medium text-slate-400 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-md truncate max-w-[100px]">
              {item.category}
            </span>
          )}
        </div>
        <h3 className="text-sm font-bold text-slate-900 leading-snug group-hover:text-indigo-600 transition-colors line-clamp-2">
          {item.title}
        </h3>
        {item.instructor && (
          <p className="text-[10px] text-slate-400 truncate">{item.instructor}</p>
        )}
      </div>

      <div className="flex justify-between items-center pt-2 border-t border-slate-100 mt-auto">
        <span className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
          <Clock size={10} />
          {item.durationText || item.duration || "45 mins"}
        </span>
        <span className="text-xs font-extrabold text-slate-900">{item.price || "Assigned"}</span>
      </div>
    </div>
  </div>
);

// ─── Main Page ────────────────────────────────────────────────────────────────
const StandaloneLibrary = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const categoryParam = searchParams.get("category") || "";

  const userId = useProfileStore((state) => state.profile?.id) || "";

  const [allItems, setAllItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    setLoading(true);
    memberLearningApi
      .getRawLearningData(userId)
      .then((data: any) => {
        // Strictly Courses only
        const courses = (data || []).filter((item: any) => item.type === "course" || !item.type);
        setAllItems(courses);
      })
      .catch(() => setAllItems([]))
      .finally(() => setLoading(false));
  }, [userId]);

  // ── Client-side filter ──────────────────────────────────────────────────────
  const displayItems = allItems.filter((item) => {
    const matchesSearch =
      !searchQuery ||
      item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const handleItemClick = (item: any) => {
    navigate(`/course-details?id=${item.id}&type=course`);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ── Page Header ── */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-screen-xl mx-auto px-6 py-5">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900 mb-4 transition-colors"
          >
            <ChevronLeft size={16} />
            Back
          </button>

          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center">
              <BookOpen size={18} className="text-white" />
            </div>
            <div>
              {categoryParam && (
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  {categoryParam}
                </p>
              )}
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                Course Training Library
              </h1>
            </div>
          </div>

          {!loading && (
            <p className="mt-1 text-sm text-slate-500 ml-12">
              {allItems.length} training course{allItems.length !== 1 ? "s" : ""} available in your curriculum
            </p>
          )}
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-6 py-8">
        {/* ── Search Bar ── */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search training courses…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-900 placeholder-slate-400 shadow-sm"
            />
          </div>
        </div>

        {/* ── Content ── */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : displayItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[320px] text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center">
              <BookOpen size={28} className="text-slate-300" />
            </div>
            <div>
              <p className="text-slate-700 font-bold text-base">No courses found</p>
              <p className="text-slate-400 text-sm mt-1">
                {searchQuery
                  ? `No results for "${searchQuery}". Try a different search.`
                  : "There are no published training courses at the moment."}
              </p>
            </div>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="text-indigo-600 font-semibold text-sm hover:underline"
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          <>
            <p className="text-sm text-slate-500 mb-4">
              Showing <span className="font-semibold text-slate-900">{displayItems.length}</span> training course{displayItems.length !== 1 ? "s" : ""}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {displayItems.map((item) => (
                <ContentCard
                  key={`course-${item.id}`}
                  item={item}
                  onClick={() => handleItemClick(item)}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default StandaloneLibrary;
