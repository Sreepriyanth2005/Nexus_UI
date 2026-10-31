import React from "react";
import { ChevronDown, Check } from "lucide-react";
import ThemeToggleSwitch from "../common/ThemeToggleSwitch";

export interface PlaylistItem {
  id: string | number;
  lessonNumber: string | number;
  title: string;
  durationText?: string;
  state: "completed" | "in-progress" | "locked";
  lessonType?: string;
}

export interface DocumentLessonViewProps {
  title?: string;
  content?: string | string[];
  readingTime?: number;
  pageCount?: number;
  currentPage?: number;
  lessonOrder?: number | string;
  totalLessons?: number;
  playlist?: PlaylistItem[];
  activeLessonId?: string | number;
  onNextLesson?: () => void;
  onSelectLesson?: (id: string | number) => void;
  playerMode?: "video" | "document";
  onToggleMode?: (mode: "video" | "document") => void;
}

const defaultParagraphs = [
  "There is a useful distinction at the centre of knowledge management between two kinds of knowledge: tacit and explicit. Explicit knowledge can be written down, codified, and shared as a document, the rules in this policy, the diagram on this page.",
  "Tacit knowledge, by contrast, is the knowledge that lives in a practitioner's head. The way a senior records officer instinctively knows which file belongs in which retention class. The judgment that an experienced auditor brings to a quality review.",
  "The challenge of knowledge mapping is to translate as much tacit knowledge as possible into explicit form, without losing the nuance that makes the tacit version useful in the first place.",
  "When building an organizational knowledge taxonomy, explicit structures must reflect actual operational workflows. Over-engineering classification systems without practitioner input creates friction and reduces adoption.",
  "Continuous review cycles ensure that documentation remains aligned with evolving business practices, preventing knowledge degradation over time."
];

export const DocumentLessonView: React.FC<DocumentLessonViewProps> = ({
  title = "Tacit vs explicit knowledge",
  content = defaultParagraphs,
  readingTime = 5,
  pageCount = 4,
  currentPage = 1,
  lessonOrder = 2,
  totalLessons = 9,
  playlist = [],
  activeLessonId,
  onNextLesson,
  onSelectLesson,
  playerMode = "document",
  onToggleMode,
}) => {
  const paragraphs = Array.isArray(content) ? content : [content];

  return (
    <div className="flex-1 flex flex-col lg:flex-row items-stretch w-full overflow-hidden bg-[#F4F4F4]">
      {/* ================= MAIN DOCUMENT READER CONTAINER ================= */}
      <main className="flex-1 p-6 lg:p-10 flex items-center justify-center overflow-y-auto">
        <div className="w-full max-w-2xl bg-white border border-gray-200 rounded-2xl p-8 sm:p-12 shadow-sm relative flex flex-col justify-between min-h-[520px]">
          
          {/* Document Header & Scrollable Text Body */}
          <div className="space-y-6 max-h-[420px] overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-gray-300">
            {onToggleMode && (
              <div className="flex justify-end pb-2">
                <ThemeToggleSwitch
                  value={playerMode}
                  onChange={onToggleMode}
                />
              </div>
            )}
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-gray-900 leading-tight">
              {lessonOrder}. {title}
            </h1>

            <div className="space-y-5 text-sm sm:text-base font-serif text-gray-700 leading-relaxed">
              {paragraphs.map((p, idx) => (
                <p key={idx}>{p}</p>
              ))}
            </div>
          </div>

          {/* Document Footer Metadata (Page Indicator & Reading Time) */}
          <div className="pt-6 mt-6 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400 font-sans">
            <span>
              Page {currentPage} of {pageCount} · Reading time: ~{readingTime} min
            </span>

            <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
              <ChevronDown size={14} />
            </div>
          </div>
        </div>
      </main>

      {/* ================= RIGHT LESSON NAVIGATION PANEL ================= */}
      <aside className="w-full lg:w-80 shrink-0 bg-white border-t lg:border-t-0 lg:border-l border-gray-200 p-6 flex flex-col justify-between overflow-y-auto">
        <div className="space-y-5">
          {/* Header & Progress Indicator */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold tracking-widest uppercase text-gray-400 font-mono">
              <span>Lessons</span>
              <span className="text-gray-900 font-sans text-xs">
                {lessonOrder} of {totalLessons || playlist.length || 9}
              </span>
            </div>

            <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-black h-1.5 rounded-full transition-all duration-300"
                style={{
                  width: `${(Number(lessonOrder) / (totalLessons || playlist.length || 9)) * 100}%`
                }}
              />
            </div>
          </div>

          {/* Lesson Playlist List */}
          <div className="space-y-2 pt-2">
            {playlist.length > 0 ? (
              playlist.map((item) => {
                const isActive = item.id === activeLessonId || String(item.lessonNumber) === String(lessonOrder);
                const isCompleted = item.state === "completed";

                return (
                  <div
                    key={item.id}
                    onClick={() => onSelectLesson && onSelectLesson(item.id)}
                    className={`rounded-xl border p-3 flex items-center gap-3 text-xs font-semibold cursor-pointer transition-all ${
                      isActive
                        ? "border-black bg-gray-50 text-gray-900 shadow-xs"
                        : isCompleted
                        ? "border-gray-200 bg-white text-gray-700"
                        : "border-transparent text-gray-400 hover:text-gray-600"
                    }`}
                  >
                    {isCompleted ? (
                      <span className="text-emerald-600 flex items-center text-[11px]">
                        <Check size={14} className="stroke-[3]" />
                      </span>
                    ) : isActive ? (
                      <span className="text-black text-[10px]">►</span>
                    ) : (
                      <span className="w-3.5" />
                    )}

                    <span className="truncate">
                      {item.lessonNumber}. {item.title}
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="text-xs text-gray-400 italic">No playlist available</div>
            )}
          </div>
        </div>

        {/* Completion UI & Next Lesson Action */}
        <div className="pt-6 border-t border-gray-100 space-y-3 text-center">
          <p className="text-[11px] font-medium text-gray-400">
            Auto-completed on scroll to bottom
          </p>

          <button
            onClick={onNextLesson}
            className="w-full bg-black hover:bg-gray-800 text-white font-bold text-xs py-3.5 px-4 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Continue to next lesson</span>
            <span>→</span>
          </button>

          <p className="text-[10px] text-gray-400 font-sans">
            Document download allowed per business policy
          </p>
        </div>
      </aside>
    </div>
  );
};

export default DocumentLessonView;
