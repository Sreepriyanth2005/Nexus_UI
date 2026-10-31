import React, { useState } from "react";
import {
  ChevronDown,
  Check,
  Download,
  BookOpen,
  FileText,
  Clock,
  ArrowRight,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  ShieldCheck,
  CheckCircle2,
  Wifi,
  Bookmark
} from "lucide-react";
import { toast } from "sonner";

interface LessonItem {
  id: string | number;
  number: number;
  title: string;
  status: "completed" | "active" | "upcoming";
}

interface DocumentLessonViewProps {
  courseTitle?: string;
  lessonNumber?: number;
  totalLessons?: number;
  lessonTitle?: string;
  pageCount?: number;
  readingTimeMin?: number;
  paragraphs?: string[];
  lessonsList?: LessonItem[];
  onNextLesson?: () => void;
  onSelectLesson?: (id: string | number) => void;
  documentUrl?: string;
  onDownload?: () => void;
}

const defaultParagraphs = [
  "Standard Operating Procedures (SOPs) form the operational baseline of all workplace safety and regulatory compliance across facilities. Explicit procedures codified within this guide must be strictly adhered to by all personnel.",
  "Operational risks must be assessed prior to commencing high-risk tasks. Employees are empowered with Stop Work Authority whenever an unmitigated hazard or deviation from approved safety parameters is identified.",
  "Toolbox talks and shift handover logs must be recorded accurately in accordance with corporate audit protocols and statutory occupational safety requirements.",
  "Continuous training validation and periodic recertification cycles ensure that procedural execution remains aligned with evolving statutory standards and equipment manufacturer guidelines.",
  "Report all near-misses, procedural variances, and equipment deficiencies immediately through the designated Issue Reporting portal."
];

const defaultLessons: LessonItem[] = [
  { id: 1, number: 1, title: "Facility Safety Orientation & Core Principles", status: "completed" },
  { id: 2, number: 2, title: "Standard Operating Procedures (SOP) Walkthrough", status: "active" },
  { id: 3, number: 3, title: "Hazard Identification & Control Hierarchy", status: "upcoming" },
  { id: 4, number: 4, title: "Emergency Protocols & Incident Reporting", status: "upcoming" },
  { id: 5, number: 5, title: "Post-Training Knowledge Assessment", status: "upcoming" },
];

export const DocumentLessonView: React.FC<DocumentLessonViewProps> = ({
  courseTitle = "Facility Safety & Compliance Training",
  lessonNumber = 2,
  totalLessons = 5,
  lessonTitle = "Standard Operating Procedures (SOP) Walkthrough",
  pageCount = 4,
  readingTimeMin = 8,
  paragraphs = defaultParagraphs,
  lessonsList = defaultLessons,
  onNextLesson,
  onSelectLesson,
  documentUrl,
  onDownload,
}) => {
  const [activeLessonId, setActiveLessonId] = useState<string | number>(2);
  const [fontSize, setFontSize] = useState<"sm" | "base" | "lg">("base");
  const [isBookmarked, setIsBookmarked] = useState(false);

  const handleDownloadOffline = () => {
    if (onDownload) {
      onDownload();
    } else {
      toast.success("Document downloaded for offline access.");
    }
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row items-stretch w-full overflow-hidden bg-[#F8FAFC] font-sans text-slate-900">
      
      {/* ================= MAIN DOCUMENT READER (LEFT/CENTER) ================= */}
      <main className="flex-1 p-4 sm:p-8 lg:p-10 flex flex-col items-center justify-start overflow-y-auto">
        <div className="w-full max-w-3xl bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-10 shadow-sm flex flex-col justify-between min-h-[580px]">
          
          {/* Top Document Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-6 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-100">
                SOP Document Reader
              </span>
              <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                ~{readingTimeMin} min read
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Font Sizer */}
              <div className="flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200">
                <button
                  onClick={() => setFontSize("sm")}
                  className={`px-2 py-1 text-xs font-bold rounded-lg transition-colors ${
                    fontSize === "sm" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500"
                  }`}
                  title="Smaller text"
                >
                  A-
                </button>
                <button
                  onClick={() => setFontSize("base")}
                  className={`px-2 py-1 text-xs font-bold rounded-lg transition-colors ${
                    fontSize === "base" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500"
                  }`}
                  title="Default text"
                >
                  A
                </button>
                <button
                  onClick={() => setFontSize("lg")}
                  className={`px-2 py-1 text-xs font-bold rounded-lg transition-colors ${
                    fontSize === "lg" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500"
                  }`}
                  title="Larger text"
                >
                  A+
                </button>
              </div>

              {/* Bookmark */}
              <button
                onClick={() => {
                  setIsBookmarked(!isBookmarked);
                  toast.success(isBookmarked ? "Bookmark removed" : "Module bookmarked");
                }}
                className={`p-2 rounded-xl border transition-colors ${
                  isBookmarked
                    ? "bg-amber-50 border-amber-200 text-amber-600"
                    : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100"
                }`}
                title="Bookmark for review"
              >
                <Bookmark className="w-4 h-4 fill-current" />
              </button>

              {/* Offline Download */}
              <button
                onClick={handleDownloadOffline}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 transition-colors"
                title="Download for offline study"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Offline Copy</span>
              </button>
            </div>
          </div>

          {/* Document Content Area */}
          <div className="my-8 space-y-6">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-tight">
              Module {lessonNumber}: {lessonTitle}
            </h1>

            <div
              className={`space-y-5 text-slate-700 leading-relaxed font-sans ${
                fontSize === "sm" ? "text-xs" : fontSize === "lg" ? "text-lg" : "text-sm sm:text-base"
              }`}
            >
              {paragraphs.map((p, idx) => (
                <p key={idx} className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                  {p}
                </p>
              ))}
            </div>
          </div>

          {/* Document Footer: Page Indicator & Action */}
          <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <span className="font-semibold">
              Document Page 1 of {pageCount} · Mandatory Module Review
            </span>

            <button
              onClick={onNextLesson}
              className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Mark as Read & Next</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </main>

      {/* ================= LESSON NAVIGATION PANEL (RIGHT) ================= */}
      <aside className="w-full lg:w-80 shrink-0 bg-white border-t lg:border-t-0 lg:border-l border-slate-200/80 p-6 flex flex-col justify-between overflow-y-auto">
        <div className="space-y-5">
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px] font-bold tracking-wider uppercase text-slate-400">
              <span>Syllabus Progress</span>
              <span className="text-slate-900 font-bold">
                {lessonNumber} of {totalLessons}
              </span>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-600 rounded-full transition-all"
                style={{ width: `${Math.round((lessonNumber / totalLessons) * 100)}%` }}
              />
            </div>
          </div>

          {/* Module List */}
          <div className="space-y-2">
            {lessonsList.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  setActiveLessonId(item.id);
                  if (onSelectLesson) onSelectLesson(item.id);
                }}
                className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                  item.id === activeLessonId
                    ? "bg-indigo-50/80 border-indigo-200 text-indigo-900 shadow-xs"
                    : item.status === "completed"
                    ? "bg-slate-50 border-slate-200 text-slate-600"
                    : "bg-white border-slate-100 text-slate-400 hover:border-slate-200"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                  <div
                    className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                      item.status === "completed"
                        ? "bg-emerald-500 text-white"
                        : item.id === activeLessonId
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {item.status === "completed" ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : item.number}
                  </div>
                  <span className="text-xs font-bold truncate">{item.title}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Help Note */}
        <div className="pt-6 border-t border-slate-100 text-xs text-slate-400 space-y-1">
          <p className="font-semibold text-slate-700">Need clarification?</p>
          <p>Consult with your site trainer or raise an issue in the Help Center.</p>
        </div>
      </aside>
    </div>
  );
};

export default DocumentLessonView;
