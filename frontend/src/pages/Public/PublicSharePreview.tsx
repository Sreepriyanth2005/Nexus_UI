import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router";
import { courseApi } from "../../core/api/course/course.api";
import { getLessonByShareTokenApi } from "../../core/api/lesson/lesson.api";
import { getCareerPathByShareTokenApi } from "../../core/api/career-path/career-path.api";
import { useAuthStore } from "../../core/auth/auth.store";
import { 
  BookOpen, 
  Clock, 
  Sparkles, 
  Share2, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  Lock, 
  GraduationCap,
  Layers,
  Globe
} from "lucide-react";
import { toast } from "sonner";

interface PublicSharePreviewProps {
  type?: "course" | "lesson" | "career-path";
}

export const PublicSharePreview: React.FC<PublicSharePreviewProps> = ({ type: propType }) => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { status: isAuthenticated } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [item, setItem] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Derive resolved type
  const path = window.location.pathname;
  const detectedType: "course" | "lesson" | "career-path" =
    propType ||
    (path.includes("/lessons/")
      ? "lesson"
      : path.includes("/career-paths/")
      ? "career-path"
      : "course");

  useEffect(() => {
    if (!token) {
      setErrorMsg("No share token provided");
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setErrorMsg(null);

    const fetchContent = async () => {
      try {
        let res: any;
        if (detectedType === "lesson") {
          res = await getLessonByShareTokenApi(token);
        } else if (detectedType === "career-path") {
          res = await getCareerPathByShareTokenApi(token);
        } else {
          res = await courseApi.getByShareToken(token);
        }

        if (!isMounted) return;

        const payload = res?.data?.data || res?.data || res;
        if (!payload || (!payload.id && !payload.title)) {
          throw new Error("Content not found");
        }
        setItem(payload);
      } catch (err: any) {
        if (!isMounted) return;
        setErrorMsg(
          err?.response?.data?.message ||
          err?.message ||
          "This shared link is invalid, expired, or has been revoked."
        );
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchContent();

    return () => {
      isMounted = false;
    };
  }, [token, detectedType]);

  const handleAction = () => {
    if (!isAuthenticated) {
      navigate(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
    } else {
      if (detectedType === "course") {
        navigate(`/course-details?id=${item?.id}`);
      } else if (detectedType === "career-path") {
        navigate(`/career-path`);
      } else {
        navigate(`/member-learning`);
      }
    }
  };

  const handleCopyShareLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Public share link copied to clipboard!");
  };

  const formatDuration = (mins?: number) => {
    if (!mins || mins <= 0) return "Self-paced";
    const hours = Math.floor(mins / 60);
    const m = mins % 60;
    if (hours === 0) return `${m} mins`;
    if (m === 0) return `${hours} hrs`;
    return `${hours}h ${m}m`;
  };

  const typeLabel =
    detectedType === "lesson"
      ? "Lesson"
      : detectedType === "career-path"
      ? "Career Path"
      : "Course";

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFCFB] flex items-center justify-center p-6" style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
        <div className="w-full max-w-xl bg-white border border-stone-200/80 rounded-3xl p-12 text-center shadow-xl shadow-stone-150/50 animate-pulse">
          <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-stone-100 flex items-center justify-center text-stone-400">
            <Sparkles className="w-8 h-8 animate-spin" />
          </div>
          <h2 className="text-xl font-bold text-stone-800 mb-2">Loading Shared Content...</h2>
          <p className="text-sm font-medium text-stone-500">Connecting to Nexus Learning Portal</p>
        </div>
      </div>
    );
  }

  if (errorMsg || !item) {
    return (
      <div className="min-h-screen bg-[#FDFCFB] flex items-center justify-center p-6" style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
        <div className="w-full max-w-lg bg-white border border-red-100 rounded-3xl p-10 text-center shadow-xl shadow-red-50">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-rose-50 border border-rose-150 flex items-center justify-center text-rose-500">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-stone-900 mb-2">Link Expired or Invalid</h2>
          <p className="text-sm font-medium text-stone-500 leading-relaxed mb-8">
            {errorMsg || "The shared preview link is unavailable. Please check the URL or request an updated link from the author."}
          </p>
          <Link
            to="/login"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-stone-900 hover:bg-stone-800 text-white text-sm font-semibold transition-all shadow-md active:scale-95"
          >
            Go to Nexus Portal
          </Link>
        </div>
      </div>
    );
  }

  const title = item.title || "Untitled";
  const subtitle = item.subtitle || item.tagline;
  const description =
    item.fullDescription ||
    item.description ||
    item.shortDescription ||
    "Join the Nexus Academy community to access comprehensive learning paths, hands-on labs, and recognized certifications.";
  const image =
    item.coverImageUrl ||
    item.thumbnailUrl ||
    item.coverImageAsset?.fileUrl ||
    item.thumbnailAsset?.fileUrl ||
    "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=1200";

  const difficulty = item.difficulty || "All Levels";
  const duration = formatDuration(item.duration || item.estimatedDuration);
  const instructor =
    item.authorName ||
    item.instructor ||
    (item.createdBy?.profile
      ? `${item.createdBy.profile.firstName || ""} ${item.createdBy.profile.lastName || ""}`.trim()
      : null) ||
    "Nexus Faculty";

  const tags: string[] = Array.isArray(item.tags)
    ? item.tags.map((t: any) => (typeof t === "string" ? t : t?.name || t?.tag?.name)).filter(Boolean)
    : [];

  return (
    <div
      className="min-h-screen bg-[#FAFAF8] text-stone-900 flex flex-col justify-between"
      style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
    >
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-stone-200/70 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-stone-900 flex items-center justify-center text-[#FCF7AE] font-black text-base shadow-xs">
              NX
            </div>
            <div>
              <span className="text-xs font-black tracking-wider uppercase text-stone-400 block">
                Nexus Academy
              </span>
              <span className="text-sm font-bold text-stone-800">
                Shared Preview
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleCopyShareLink}
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-stone-200 text-xs font-semibold text-stone-600 hover:text-stone-900 hover:bg-stone-50 transition-all cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              Copy Link
            </button>
            <button
              onClick={handleAction}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-stone-900 hover:bg-stone-800 text-[#FCF7AE] text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
            >
              {isAuthenticated ? "Open Content" : "Sign In to Enroll"}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-10 md:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          
          {/* Left Column: Details */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FCF7AE]/60 border border-[#e8df76] text-xs font-bold text-stone-900">
              <Sparkles className="w-3.5 h-3.5 text-stone-800" />
              Public {typeLabel} Preview
            </div>

            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-stone-950 leading-[1.2]">
              {title}
            </h1>

            {subtitle && (
              <p className="text-base font-medium text-stone-600 leading-relaxed">
                {subtitle}
              </p>
            )}

            {/* Metadata Badges */}
            <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-stone-600 pt-1">
              <div className="flex items-center gap-1.5 bg-stone-100 px-3 py-1.5 rounded-lg border border-stone-200">
                <Clock className="w-4 h-4 text-stone-500" />
                {duration}
              </div>
              <div className="flex items-center gap-1.5 bg-stone-100 px-3 py-1.5 rounded-lg border border-stone-200">
                <Layers className="w-4 h-4 text-stone-500" />
                {difficulty}
              </div>
              <div className="flex items-center gap-1.5 bg-stone-100 px-3 py-1.5 rounded-lg border border-stone-200">
                <Globe className="w-4 h-4 text-stone-500" />
                {item.language || "English"}
              </div>
            </div>

            {/* Author / Instructor Card */}
            <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-white border border-stone-200 shadow-2xs">
              <div className="w-11 h-11 rounded-full bg-stone-900 flex items-center justify-center text-[#FCF7AE] font-bold text-sm shrink-0">
                {instructor.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-stone-400">Created by</p>
                <p className="text-sm font-bold text-stone-900">{instructor}</p>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-3 pt-2">
              <h3 className="text-sm font-bold uppercase tracking-wider text-stone-400">About this {typeLabel}</h3>
              <div
                className="text-stone-700 text-sm leading-relaxed prose prose-stone max-w-none break-words"
                dangerouslySetInnerHTML={{ __html: description }}
              />
            </div>

            {/* Tags */}
            {tags.length > 0 && (
              <div className="pt-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-stone-400 mb-2.5">Topics Covered</p>
                <div className="flex flex-wrap gap-2">
                  {tags.map((t, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-md text-xs font-semibold bg-stone-100 text-stone-700 border border-stone-200"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Floating Preview Card */}
          <div className="lg:col-span-5 lg:sticky lg:top-24">
            <div className="bg-white rounded-3xl border border-stone-200/90 shadow-xl overflow-hidden">
              <div className="relative aspect-video w-full overflow-hidden bg-stone-900">
                <img
                  src={image}
                  alt={title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white">
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-xs border border-white/20">
                    {typeLabel}
                  </span>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-xs border border-white/20">
                    {duration}
                  </span>
                </div>
              </div>

              <div className="p-6 space-y-5">
                <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 flex items-start gap-3">
                  <Lock className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                  <div className="text-xs text-amber-900 leading-relaxed font-medium">
                    <strong className="font-bold block mb-0.5">Content Gated</strong>
                    Full interactive lessons, assessments, and verifiable certificates require active enrollment.
                  </div>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={handleAction}
                    className="w-full py-3.5 px-6 rounded-2xl bg-stone-900 hover:bg-stone-800 text-[#FCF7AE] font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer"
                  >
                    <GraduationCap className="w-4 h-4" />
                    {isAuthenticated ? "Go to Learning Workspace" : "Get Started / Log In"}
                  </button>

                  <button
                    onClick={handleCopyShareLink}
                    className="w-full py-2.5 px-4 rounded-2xl border border-stone-200 text-stone-700 hover:bg-stone-50 font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    Share with Colleague
                  </button>
                </div>

                <ul className="space-y-2.5 pt-4 border-t border-stone-100 text-xs font-semibold text-stone-600">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    Industry-aligned curriculum
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    Comprehensive knowledge checks
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    Verifiable cryptographic certificate
                  </li>
                </ul>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-stone-200 bg-white py-8 px-6 text-center text-xs font-semibold text-stone-400">
        <p>© {new Date().getFullYear()} Nexus Academy. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default PublicSharePreview;
