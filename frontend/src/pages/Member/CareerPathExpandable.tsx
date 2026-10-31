import React, { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Check,
  Play,
  Award,
  BookOpen,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Lock,
  ArrowRight
} from "lucide-react";
import { useNavigate } from "react-router";

interface Course {
  id: number;
  title: string;
  status: "completed" | "in-progress" | "locked";
  duration?: string;
}

interface CareerPath {
  id: number;
  title: string;
  subtitle: string;
  progress: number;
  expanded: boolean;
  courses: Course[];
}

const initialPaths: CareerPath[] = [
  {
    id: 1,
    title: "CDMP Practitioner Certification Path",
    subtitle: "5 compliance courses · ~32 hrs · Intermediate → Advanced · Digital Certification",
    progress: 40,
    expanded: true,
    courses: [
      { id: 1, title: "1. Data Management & Workplace Safety Foundations", status: "completed", duration: "6 hrs" },
      { id: 2, title: "2. Procedural Data Quality & SOP Enforcement", status: "in-progress", duration: "8 hrs" },
      { id: 3, title: "3. Compliance Metadata & Record Governance", status: "locked", duration: "6 hrs" },
      { id: 4, title: "4. Information Governance & Security Review", status: "locked", duration: "7 hrs" },
      { id: 5, title: "5. CDMP Practitioner Capstone Assessment", status: "locked", duration: "5 hrs" },
    ],
  },
  {
    id: 2,
    title: "Records & Asset Management Professional",
    subtitle: "4 compliance courses · ~24 hrs · Mandatory Operational Qualification",
    progress: 0,
    expanded: false,
    courses: [
      { id: 6, title: "1. Facility Records Lifecycle & Retention SOPs", status: "locked", duration: "6 hrs" },
      { id: 7, title: "2. ISO 15489 Compliance Implementation", status: "locked", duration: "6 hrs" },
      { id: 8, title: "3. Risk Assessment & Secure Disposal Protocols", status: "locked", duration: "6 hrs" },
      { id: 9, title: "4. Final Compliance Evaluation Exam", status: "locked", duration: "6 hrs" },
    ],
  },
  {
    id: 3,
    title: "Operations & Facility Knowledge Lead",
    subtitle: "6 courses · ~38 hrs · Supervisory & Mentorship Qualification",
    progress: 0,
    expanded: false,
    courses: [],
  },
  {
    id: 4,
    title: "Information Governance Professional (IGP)",
    subtitle: "5 courses · ~28 hrs · Advanced Governance & Audit Preparedness",
    progress: 0,
    expanded: false,
    courses: [],
  },
];

export const CareerPathExpandable: React.FC = () => {
  const navigate = useNavigate();

  React.useEffect(() => {
    // Strictly Course-only Member Flow; redirect to Assigned Courses
    navigate("/my-learning", { replace: true });
  }, [navigate]);
  const [paths, setPaths] = useState<CareerPath[]>(initialPaths);

  const toggleExpand = (id: number) => {
    setPaths((prev) =>
      prev.map((path) =>
        path.id === id ? { ...path, expanded: !path.expanded } : path
      )
    );
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 pb-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
        
        {/* Header */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
              <Award className="w-3.5 h-3.5 text-indigo-600" />
              <span>Career Qualification Paths</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Structured Learning Paths
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 max-w-xl leading-relaxed">
              Explore step-by-step training sequences aligned to role qualifications, mandatory compliance milestones, and professional credentials.
            </p>
          </div>
        </div>

        {/* Paths List */}
        <div className="space-y-4">
          {paths.map((path) => (
            <div
              key={path.id}
              className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden transition-all duration-200"
            >
              {/* Path Header */}
              <div
                onClick={() => toggleExpand(path.id)}
                className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/80 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 leading-snug">
                      {path.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">{path.subtitle}</p>
                  </div>
                </div>

                <div className="flex items-center gap-5 self-end sm:self-center">
                  {path.progress > 0 ? (
                    <div className="flex items-center gap-3">
                      <div className="w-24 h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full bg-indigo-600 rounded-full transition-all"
                          style={{ width: `${path.progress}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-slate-800">{path.progress}%</span>
                    </div>
                  ) : (
                    <span className="text-xs font-semibold text-slate-400">Not started</span>
                  )}

                  <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                    {path.expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </div>
                </div>
              </div>

              {/* Expanded Courses Chain */}
              {path.expanded && (
                <div className="border-t border-slate-100 p-5 sm:p-6 bg-slate-50/50 space-y-3">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Curriculum Sequence ({path.courses.length} Modules)
                  </div>

                  {path.courses.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">Curriculum modules are being scheduled by your Training Administrator.</p>
                  ) : (
                    path.courses.map((course) => (
                      <div
                        key={course.id}
                        onClick={() => {
                          if (course.status !== "locked") {
                            navigate("/course-player");
                          }
                        }}
                        className={`flex items-center justify-between p-3.5 bg-white border rounded-xl transition-all ${
                          course.status === "completed"
                            ? "border-emerald-200 text-slate-700"
                            : course.status === "in-progress"
                            ? "border-indigo-300 shadow-sm cursor-pointer hover:border-indigo-500"
                            : "border-slate-200 opacity-60 cursor-not-allowed"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                              course.status === "completed"
                                ? "bg-emerald-50 text-emerald-600"
                                : course.status === "in-progress"
                                ? "bg-indigo-50 text-indigo-600"
                                : "bg-slate-100 text-slate-400"
                            }`}
                          >
                            {course.status === "completed" ? (
                              <Check className="w-4 h-4 stroke-[3]" />
                            ) : course.status === "in-progress" ? (
                              <Play className="w-3.5 h-3.5 fill-current" />
                            ) : (
                              <Lock className="w-3.5 h-3.5" />
                            )}
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-slate-900">{course.title}</h4>
                            <span className="text-[10px] text-slate-400">{course.duration || "4 hrs"}</span>
                          </div>
                        </div>

                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            course.status === "completed"
                              ? "bg-emerald-50 text-emerald-700"
                              : course.status === "in-progress"
                              ? "bg-indigo-50 text-indigo-700"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {course.status === "completed" ? "Completed" : course.status === "in-progress" ? "Resume" : "Locked"}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CareerPathExpandable;
