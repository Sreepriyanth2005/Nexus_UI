import React from "react";
import { useNavigate, useSearchParams } from "react-router";
import { Play, Download, Printer, ArrowLeft, Award, ShieldCheck, CheckCircle2, MessageSquare, QrCode } from "lucide-react";
import CertificatePreview from "../../components/certificates/CertificatePreview";
import { useUserStore } from "../../store/user.store";
import { useProfileStore } from "../../store/profile.store";
import { toast } from "sonner";

export const CourseCompletedProofDetail: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const user = useUserStore((state) => state.user);
  const profile = useProfileStore((state) => state.profile);

  const certificate = {
    learnerName: "Salman Ali",
    courseName: "Knowledge Mapping for Working Professionals",
    issueDate: "12 Mar 2026",
    proofId: "NX-COMPLIANCE-2026-04821",
    score: "85%",
    category: "Safety & Operational Compliance",
    skills: ["Standard Operating Procedures", "Safety Compliance", "Field Verification"],
  };

  const learnerName =
    profile?.profile?.certificateName ||
    [profile?.profile?.firstName, profile?.profile?.lastName].filter(Boolean).join(" ") ||
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    certificate.learnerName;

  const courseName = searchParams.get("courseName") || searchParams.get("title") || certificate.courseName;
  const issueDate = searchParams.get("date") || certificate.issueDate;
  const proofId = searchParams.get("proofId") || searchParams.get("id") || certificate.proofId;

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 pb-16">
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-certificate, #printable-certificate * {
            visibility: visible;
          }
          #printable-certificate {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 0;
          }
        }
      `}</style>
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
        {/* Back Link */}
        <button
          onClick={() => navigate("/course-completed")}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Completed Records</span>
        </button>

        {/* Header Banner */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Training Completed & Certified</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {courseName}
            </h1>
            <p className="text-xs text-slate-500 font-mono">
              Issued: {issueDate} · Proof ID: {proofId} · Verified Authenticity
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => window.print()}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download PDF</span>
            </button>
            <button
              onClick={() => navigate("/issue-reporting")}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors flex items-center gap-2"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Feedback</span>
            </button>
          </div>
        </div>

        {/* Certificate Frame */}
        <div id="printable-certificate" className="bg-white p-4 sm:p-6 border border-slate-200/80 rounded-3xl shadow-lg">
          <div className="border-4 border-amber-400/80 rounded-2xl overflow-hidden">
            <CertificatePreview
              userName={learnerName}
              courseName={courseName}
              completionDate={issueDate}
              certificateId={proofId}
            />
          </div>
        </div>

        {/* Meta Stats & Verification Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Verification Status</span>
            </div>
            <p className="text-sm font-bold text-slate-800">Tamper-Proof & Valid</p>
            <p className="text-xs text-slate-400">Recorded in employee training history</p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
              <QrCode className="w-4 h-4 text-indigo-600" />
              <span>Public Verification</span>
            </div>
            <p className="text-sm font-bold text-slate-800 font-mono truncate">{proofId}</p>
            <p className="text-xs text-slate-400">Accessible at verify portal</p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
              <Award className="w-4 h-4 text-amber-500" />
              <span>Recertification Notice</span>
            </div>
            <p className="text-sm font-bold text-slate-800">Valid for 1 Year</p>
            <p className="text-xs text-slate-400">Renewal reminder sent 30 days prior</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseCompletedProofDetail;
