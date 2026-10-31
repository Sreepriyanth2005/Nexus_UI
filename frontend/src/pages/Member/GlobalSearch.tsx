import React, { useState } from "react";
import { useNavigate } from "react-router";
import {
  Search,
  BookOpen,
  FileText,
  Clock,
  ArrowRight,
  ShieldCheck,
  X
} from "lucide-react";

const allResults = {
  courses: [
    {
      id: "course-1",
      title: "Data Retention Schedules & SOP Implementation",
      meta: "Facility Compliance · 8 modules · 4h · Mandatory",
      type: "course",
    },
    {
      id: "course-2",
      title: "Occupational Safety & Hazardous Material Protocols",
      meta: "Operations · 12 modules · 6h · Certification Ready",
      type: "course",
    },
    {
      id: "course-3",
      title: "Emergency Response & Stop Work Authority Procedures",
      meta: "Safety Protocols · 4 modules · 1.5h · Mandatory",
      type: "course",
    },
  ],

  modules: [
    {
      id: "module-1",
      title: "Workplace Hazard Identification Toolbox Talk",
      meta: "SOP Document · 10 min · Quick Study",
      type: "module",
    },
    {
      id: "module-2",
      title: "ISO 15489 Compliance & Record Lifecycle Guidelines",
      meta: "Interactive Explainer · 15 min · Mandatory",
      type: "module",
    },
  ],
};

type Tab = "all" | "courses" | "modules";

export const GlobalSearch: React.FC = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("safety protocols");
  const [activeTab, setActiveTab] = useState<Tab>("all");

  const totalCount = allResults.courses.length + allResults.modules.length;

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "all", label: "All Content", count: totalCount },
    { key: "courses", label: "Training Courses", count: allResults.courses.length },
    { key: "modules", label: "SOPs & Modules", count: allResults.modules.length },
  ];

  const filteredCourses =
    activeTab === "all" || activeTab === "courses" ? allResults.courses : [];
  const filteredModules =
    activeTab === "all" || activeTab === "modules" ? allResults.modules : [];

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
        
        {/* Header */}
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
            <span>Enterprise Learning Search</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Curriculum & Document Search
          </h1>
          <p className="text-xs text-slate-500">
            Search across assigned mandatory compliance trainings, SOP manuals, and verification checklists.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search training courses, safety guidelines, SOPs..."
            className="w-full pl-12 pr-10 py-3.5 bg-white border border-slate-200/90 rounded-2xl text-sm font-medium text-slate-900 placeholder:text-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === tab.key
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              <span>{tab.label}</span>
              <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] ${
                activeTab === tab.key ? "bg-indigo-800 text-indigo-200" : "bg-slate-100 text-slate-500"
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Results */}
        <div className="space-y-6">
          {/* Courses */}
          {filteredCourses.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                <span>Training Courses</span>
              </h2>
              <div className="bg-white border border-slate-200/80 rounded-2xl divide-y divide-slate-100 overflow-hidden shadow-sm">
                {filteredCourses.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => navigate(`/course-details?id=${c.id}&type=course`)}
                    className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between gap-4 cursor-pointer group"
                  >
                    <div className="space-y-1">
                      <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                        {c.title}
                      </h3>
                      <p className="text-xs text-slate-500 font-mono">{c.meta}</p>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 shrink-0">
                      <span>View Course</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SOPs & Modules */}
          {filteredModules.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-emerald-600" />
                <span>SOPs & Learning Modules</span>
              </h2>
              <div className="bg-white border border-slate-200/80 rounded-2xl divide-y divide-slate-100 overflow-hidden shadow-sm">
                {filteredModules.map((m) => (
                  <div
                    key={m.id}
                    onClick={() => navigate(`/document-lesson?id=${m.id}`)}
                    className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between gap-4 cursor-pointer group"
                  >
                    <div className="space-y-1">
                      <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
                        {m.title}
                      </h3>
                      <p className="text-xs text-slate-500 font-mono">{m.meta}</p>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 shrink-0">
                      <span>Read SOP</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
