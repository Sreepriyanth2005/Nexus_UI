import React from "react";
import { useNavigate, useParams } from "react-router";
import { Lock, Phone, ShieldCheck, CheckCircle2, ArrowRight, HelpCircle } from "lucide-react";

export const UpgradePrompt: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const handlePreviewCourse = () => {
    navigate(id ? `/course-details?id=${id}` : "/course-details");
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4 sm:p-6 font-sans text-slate-900">
      <div className="w-full max-w-2xl rounded-3xl border border-slate-200/80 bg-white p-8 sm:p-12 shadow-xl space-y-8">
        
        {/* Lock Icon */}
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-3xl bg-amber-50 border border-amber-100 flex items-center justify-center shadow-inner">
            <Lock className="w-10 h-10 text-amber-500" />
          </div>
        </div>

        {/* Heading */}
        <div className="text-center space-y-2">
          <span className="text-[11px] font-bold text-amber-700 uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200">
            Corporate License Required
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Training Assignment Required
          </h1>
          <p className="mx-auto max-w-lg text-sm text-slate-500 leading-relaxed">
            This module requires an active corporate training license. Please contact your{" "}
            <span className="font-bold text-slate-800">Training Administrator or Site Supervisor</span>{" "}
            to assign this course to your profile.
          </p>
        </div>

        {/* Next Steps Guidance Card */}
        <div className="rounded-2xl border border-amber-200/70 bg-gradient-to-tr from-amber-50/50 to-orange-50/30 p-6 space-y-3">
          <p className="text-xs font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-amber-600" />
            Recommended Next Steps
          </p>
          <ul className="space-y-2 text-xs text-slate-700">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Contact your Site Safety Officer or HR L&D department</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Provide your Employee ID and the module title</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Once assigned, the training will appear automatically in your My Training list</span>
            </li>
          </ul>
        </div>

        {/* Actions */}
        <div className="space-y-3 pt-2">
          <button
            onClick={() => navigate("/my-learning")}
            className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 font-bold text-xs text-white transition-all shadow-md shadow-indigo-100 flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>View My Assigned Training</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={handlePreviewCourse}
            className="w-full py-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 font-bold text-xs text-slate-700 transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Preview Training Syllabus</span>
          </button>
        </div>

        {/* Footer */}
        <div className="text-center pt-2 border-t border-slate-100">
          <button
            onClick={() => navigate("/help")}
            className="text-xs text-slate-400 hover:text-indigo-600 font-semibold inline-flex items-center gap-1 transition-colors"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Need assistance? Open Help Center</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpgradePrompt;
