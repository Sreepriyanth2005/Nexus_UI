import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { courseApi } from "../../core/api/course/course.api";
import {
  BookOpen,
  Clock,
  Play,
  Award,
  ShieldCheck,
  CheckCircle2,
  FileText,
  Calendar,
  Wifi,
  Users,
  Star,
  ChevronRight,
  ArrowLeft,
  Share2,
  Sparkles
} from "lucide-react";
import { Skeleton } from "../../components/ui/Skeleton/Skeleton";
import ShareModal from "./ShareModal";

export const CoursePreview: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const courseId = searchParams.get("id") || searchParams.get("courseId") || "";
  const type = searchParams.get("type") || "course";

  const [shareOpen, setShareOpen] = useState(false);

  const { data: courseRes, isLoading } = useQuery({
    queryKey: ["member-course-preview", courseId],
    queryFn: async () => {
      if (!courseId) return null;
      const res = await courseApi.getById(courseId);
      return res.data?.data || res.data || res;
    },
    enabled: !!courseId,
  });

  const course: any = courseRes || {};
  const title = course.title || "Facility Safety & Compliance Training";
  const description = course.description || "Master operational health, workplace safety regulations, procedural SOPs, and emergency protocols.";
  const duration = course.duration || "45 mins";
  const lessons = course.lessons || course.courseLessons || [];
  const thumbnail = course.thumbnailUrl || course.coverImageUrl || course.thumbnailAsset?.signedUrl || "";

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] p-8 space-y-6 animate-pulse">
        <Skeleton className="h-10 w-48 rounded-xl" />
        <Skeleton className="h-64 w-full rounded-3xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-96 lg:col-span-2 rounded-3xl" />
          <Skeleton className="h-96 rounded-3xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 pb-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
        
        {/* Back Link */}
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Assigned Trainings</span>
        </button>

        {/* Hero Banner */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col lg:flex-row gap-8 items-start">
          <div className="flex-1 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 uppercase tracking-wider">
                {course.category || "Safety & Compliance"}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center gap-1">
                <Wifi className="w-3.5 h-3.5" /> Offline Access Ready
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
              {title}
            </h1>
            <p className="text-sm text-slate-600 leading-relaxed max-w-2xl">
              {description}
            </p>

            <div className="flex flex-wrap items-center gap-5 pt-2 text-xs font-semibold text-slate-500">
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-slate-400" />
                {duration}
              </span>
              <span className="flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-slate-400" />
                {lessons.length || 5} Learning Modules & SOPs
              </span>
              <span className="flex items-center gap-1.5">
                <Award className="w-4 h-4 text-amber-500" />
                Digital Certification Eligible
              </span>
            </div>
          </div>

          {/* Thumbnail preview card */}
          <div className="w-full lg:w-80 shrink-0 bg-slate-50 border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm">
            <div className="h-44 bg-slate-200 relative">
              {thumbnail ? (
                <img src={thumbnail} alt={title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-indigo-50 text-indigo-400">
                  <BookOpen className="w-12 h-12 mb-2" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Preview</span>
                </div>
              )}
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                <button
                  onClick={() => navigate(`/course-player?id=${courseId}&type=${type}`)}
                  className="w-14 h-14 rounded-full bg-white text-indigo-600 shadow-xl flex items-center justify-center hover:scale-110 transition-transform cursor-pointer"
                >
                  <Play className="w-6 h-6 fill-current ml-0.5" />
                </button>
              </div>
            </div>

            <div className="p-4 space-y-3">
              <button
                onClick={() => navigate(`/course-player?id=${courseId}&type=${type}`)}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Start Training Now</span>
              </button>
              <button
                onClick={() => setShareOpen(true)}
                className="w-full py-2.5 bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs rounded-xl border border-slate-200 transition-colors flex items-center justify-center gap-2"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Share Details</span>
              </button>
            </div>
          </div>
        </div>

        {/* 2-Column Grid: Syllabus & Completion Requirements */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main: Curriculum & Modules */}
          <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-600" />
                Training Modules & Learning Content
              </h3>
              <span className="text-xs font-semibold text-slate-400">
                {lessons.length || 5} Lessons
              </span>
            </div>

            <div className="space-y-3">
              {(lessons.length > 0 ? lessons : [
                { id: "1", title: "1. Operational Safety Guidelines & Toolbox Briefing", duration: "10 mins", type: "Video" },
                { id: "2", title: "2. Standard Operating Procedures (SOPs) Walkthrough", duration: "15 mins", type: "PDF Document" },
                { id: "3", title: "3. Hazard Identification & Prevention Protocols", duration: "12 mins", type: "Interactive" },
                { id: "4", title: "4. Emergency Response & Incident Reporting", duration: "8 mins", type: "Video" },
                { id: "5", title: "5. Post-Training Knowledge Assessment", duration: "15 mins", type: "Quiz" },
              ]).map((item: any, idx: number) => (
                <div
                  key={item.id || idx}
                  className="flex items-center justify-between p-4 bg-slate-50 hover:bg-indigo-50/50 border border-slate-200/60 rounded-2xl transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-700">
                      {idx + 1}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{item.title}</h4>
                      <p className="text-[11px] text-slate-500">{item.type || "Learning Unit"} · {item.duration || "10 mins"}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
              ))}
            </div>
          </div>

          {/* Sidebar: Completion & Certification Requirements */}
          <div className="space-y-6">
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <ShieldCheck className="w-5 h-5 text-indigo-600" />
                <span>Certification Criteria</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                To successfully obtain your digital certificate and record completion in your employee training file:
              </p>
              <ul className="space-y-3 text-xs text-slate-700">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Review all learning modules and SOP documentation (100% completion)</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Pass the post-training knowledge assessment with at least 70% score</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Submit the post-training evaluation feedback form</span>
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-tr from-amber-50 to-orange-50 border border-amber-200/70 rounded-3xl p-6 shadow-sm space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-800">
                <Award className="w-4 h-4 text-amber-600" />
                <span>Verifiable Digital Credential</span>
              </div>
              <p className="text-xs text-amber-900/80 leading-relaxed">
                Upon meeting completion criteria, your digital certificate will be generated automatically with a tamper-proof QR code and unique ID.
              </p>
            </div>
          </div>
        </div>
      </div>

      {shareOpen && (
        <ShareModal
          isOpen={shareOpen}
          onClose={() => setShareOpen(false)}
          title={title}
          content={{ id: courseId, title, type: "course" }}
        />
      )}
    </div>
  );
};

export default CoursePreview;
