import React from "react";
import { useNavigate } from "react-router";
import { Lock, Heart, Zap, BookOpen, Clock, ShieldCheck, Award, ArrowRight } from "lucide-react";

interface Course {
  id: string;
  category: string;
  title: string;
  instructor: string;
  level: string;
  lessons: string;
  duration: string;
  color: string;
}

const orientationCourses: Course[] = [
  {
    id: "records-mgmt",
    category: "Compliance",
    title: "Workplace Health & Regulatory Safety Overview",
    instructor: "Nexus L&D Academy",
    level: "Mandatory",
    lessons: "4 modules",
    duration: "45 mins",
    color: "bg-indigo-50 text-indigo-700",
  },
  {
    id: "dmbok-tour",
    category: "Operations",
    title: "Standard Operating Procedures (SOP) Quick Orientation",
    instructor: "Facility Safety Board",
    level: "Beginner",
    lessons: "3 modules",
    duration: "30 mins",
    color: "bg-sky-50 text-sky-700",
  },
  {
    id: "iso-30401",
    category: "Safety Audit",
    title: "Hazard Identification & Stop Work Authority Guide",
    instructor: "Occupational Safety Council",
    level: "Core Compliance",
    lessons: "5 modules",
    duration: "1h 15m",
    color: "bg-emerald-50 text-emerald-700",
  },
];

const licensedCourses: Course[] = [
  {
    id: "cdmp-prep",
    category: "Specialized",
    title: "CDMP Practitioner Advanced Certification Course",
    instructor: "Lead Safety Auditor",
    level: "Advanced",
    lessons: "20 modules",
    duration: "12 hrs",
    color: "bg-amber-50 text-amber-700",
  },
  {
    id: "retention",
    category: "Governance",
    title: "Facility Data Retention & Statutory Audit Protocol",
    instructor: "Legal & Regulatory Compliance",
    level: "Intermediate",
    lessons: "8 modules",
    duration: "4 hrs",
    color: "bg-violet-50 text-violet-700",
  },
];

export const UnpaidCatalog: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        
        {/* Banner */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
              <span>Corporate Training Catalog</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Curriculum Catalog & Open Modules
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
              Open training units are immediately available for review. For advanced licensing or certified tracks, access is assigned automatically by your site supervisor or HR administrator.
            </p>
          </div>

          <button
            onClick={() => navigate("/member-dashboard")}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all whitespace-nowrap self-start md:self-auto"
          >
            My Assigned Dashboard →
          </button>
        </div>

        {/* OPEN ORIENTATION CONTENT */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="h-5 w-1 bg-indigo-600 rounded-full" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700">
              Open Orientation Modules (Available Immediately)
            </h2>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {orientationCourses.map((course) => (
              <div
                key={course.id}
                onClick={() => navigate(`/course-details?id=${course.id}`)}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all p-5 flex flex-col justify-between cursor-pointer space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${course.color}`}>
                      {course.category}
                    </span>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                      Open Access
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 leading-snug">
                    {course.title}
                  </h3>
                  <p className="text-xs text-slate-400">{course.instructor}</p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {course.duration}
                  </span>
                  <span className="font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                    Start <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* LICENSED ADVANCED CURRICULA */}
        <section className="space-y-4 pt-4">
          <div className="flex items-center gap-2">
            <div className="h-5 w-1 bg-slate-400 rounded-full" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700">
              Advanced Role Qualifications (Requires Assignment)
            </h2>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {licensedCourses.map((course) => (
              <div
                key={course.id}
                onClick={() => navigate(`/upgrade-prompt?id=${course.id}`)}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md p-5 flex flex-col justify-between cursor-pointer space-y-4 opacity-90 hover:opacity-100 transition-all"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${course.color}`}>
                      {course.category}
                    </span>
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Lock className="w-3 h-3" /> Assigned Only
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 leading-snug">
                    {course.title}
                  </h3>
                  <p className="text-xs text-slate-400">{course.instructor}</p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {course.duration}
                  </span>
                  <span className="font-semibold text-slate-600 flex items-center gap-1">
                    Request Access <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default UnpaidCatalog;
