import React from "react";
import { useNavigate } from "react-router";
import { BookOpen, Play, Award, Clock, ArrowRight, ShieldCheck, Sparkles, LogIn } from "lucide-react";

interface FreeVideo {
  id: string;
  title: string;
  duration: string;
  views: string;
}

interface PremiumCourse {
  id: string;
  category: string;
  title: string;
  instructor: string;
  level: string;
  lessons: string;
  duration: string;
  bannerColor?: string;
}

export const VisitorCatalog: React.FC = () => {
  const navigate = useNavigate();

  const freeVideos: FreeVideo[] = [
    {
      id: "records-management",
      title: "Workplace Health & Regulatory Safety Overview",
      duration: "5 min",
      views: "14,200",
    },
    {
      id: "dmbok-3",
      title: "Standard Operating Procedures (SOPs) in 5 Minutes",
      duration: "5 min",
      views: "18,400",
    },
    {
      id: "knowledge-audits",
      title: "Hazard Identification & Stop Work Authority Explained",
      duration: "4 min",
      views: "9,600",
    },
    {
      id: "iso-30401",
      title: "Why Safety Compliance Matters for Operations",
      duration: "6 min",
      views: "12,100",
    },
  ];

  const premiumCourses: PremiumCourse[] = [
    {
      id: "cdmp-prep",
      category: "Certification",
      title: "CDMP Practitioner Qualification Course",
      instructor: "Layla Al-Hashimi",
      level: "Advanced",
      lessons: "20 modules",
      duration: "12h",
      bannerColor: "bg-indigo-50 text-indigo-700",
    },
    {
      id: "knowledge-mapping",
      category: "Operations",
      title: "Facility Knowledge Mapping & SOP Integration",
      instructor: "Dr. Faris",
      level: "Mandatory",
      lessons: "6 modules",
      duration: "3h",
      bannerColor: "bg-emerald-50 text-emerald-700",
    },
    {
      id: "retention-schedules",
      category: "Audit & Safety",
      title: "Statutory Data Retention & Safety Audit Protocols",
      instructor: "Dr. Sara Lin",
      level: "Intermediate",
      lessons: "8 modules",
      duration: "4h",
      bannerColor: "bg-amber-50 text-amber-700",
    },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 pb-16">
      {/* Top Navbar */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-20">
        <div className="max-w-7xl mx-auto h-16 px-4 sm:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-black text-xs">
              L&D
            </div>
            <span className="text-sm font-bold tracking-tight text-slate-900">
              Enterprise Learning & Development
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/login")}
              className="px-4 py-2 text-xs font-bold text-slate-700 hover:text-indigo-600 transition-colors"
            >
              Sign In
            </button>
            <button
              onClick={() => navigate("/login")}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Employee Portal</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-10 space-y-12">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-indigo-900 text-white rounded-3xl p-8 sm:p-12 shadow-xl relative overflow-hidden">
          <div className="relative z-10 space-y-4 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/10 text-indigo-300 border border-white/10">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Facility & Workforce Training Catalog</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">
              Operational Excellence Through Continuous Learning
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Explore safety SOPs, toolbox talks, compliance assessments, and certified professional curricula designed for enterprise facilities.
            </p>
            <div className="pt-2 flex items-center gap-3">
              <button
                onClick={() => navigate("/login")}
                className="px-5 py-3 bg-white text-slate-900 font-bold text-xs rounded-xl hover:bg-slate-100 transition-colors shadow-md"
              >
                Log In With Employee ID
              </button>
            </div>
          </div>
        </div>

        {/* Short Explainer Videos */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-5 w-1 bg-indigo-600 rounded-full" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700">
                Toolbox Talks & Quick Explainers
              </h2>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {freeVideos.map((video) => (
              <div
                key={video.id}
                onClick={() => navigate("/login")}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer flex flex-col justify-between space-y-4 group"
              >
                <div className="space-y-2">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Play className="w-4 h-4 fill-current" />
                  </div>
                  <h3 className="text-xs font-bold text-slate-900 leading-snug">
                    {video.title}
                  </h3>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {video.duration}
                  </span>
                  <span>{video.views} views</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Structured Qualifications */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-5 w-1 bg-amber-500 rounded-full" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700">
                Certified Compliance Curricula
              </h2>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {premiumCourses.map((course) => (
              <div
                key={course.id}
                onClick={() => navigate("/login")}
                className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer flex flex-col justify-between space-y-5"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${course.bannerColor}`}>
                      {course.category}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                      {course.level}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 leading-snug">
                    {course.title}
                  </h3>
                  <p className="text-xs text-slate-400">{course.instructor}</p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>{course.lessons} · {course.duration}</span>
                  <span className="font-bold text-indigo-600 flex items-center gap-1">
                    Sign in to Enrol <ArrowRight className="w-3.5 h-3.5" />
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

export default VisitorCatalog;
