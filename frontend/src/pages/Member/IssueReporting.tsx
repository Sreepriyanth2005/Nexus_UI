import React, { useState } from "react";
import { ArrowLeft, Check, Upload, Clock, Info, CheckCircle2, MessageSquare, Star, AlertTriangle, ShieldCheck, FileText } from "lucide-react";
import { useNavigate } from "react-router";
import { useCreateTicket, useMyTickets, useUploadTicketAttachment } from "../../hooks/support/useSupport";
import { useHelpCenterStore } from "../../store/helpCenter.store";
import { toast } from "sonner";

export const IssueReporting: React.FC = () => {
  const navigate = useNavigate();

  // Zustand UI State
  const {
    issueTypeDraft,
    affectedPageDraft,
    issueDescribeDraft,
    includeDiagnosticsDraft,
    setIssueTypeDraft,
    setAffectedPageDraft,
    setIssueDescribeDraft,
    setIncludeDiagnosticsDraft,
    resetIssueFormDraft,
  } = useHelpCenterStore();

  const [activeTab, setActiveTab] = useState<"feedback" | "report" | "tickets">("feedback");
  const [file, setFile] = useState<File | null>(null);

  // Feedback State (Step 11 of Member Flow)
  const [trainerRating, setTrainerRating] = useState<number>(5);
  const [contentRating, setContentRating] = useState<number>(5);
  const [relevanceRating, setRelevanceRating] = useState<number>(5);
  const [feedbackCourse, setFeedbackCourse] = useState<string>("Facility Safety & Compliance Training");
  const [feedbackText, setFeedbackText] = useState<string>("");
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState<boolean>(false);

  // React Query Hooks
  const { data: myReportsResponse } = useMyTickets({ limit: 50 });
  const myReports = myReportsResponse?.data || myReportsResponse || [];
  const submitReportMutation = useCreateTicket();
  const uploadAttachmentMutation = useUploadTicketAttachment();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmitIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || submitReportMutation.isPending) return;

    try {
      const ticket = await submitReportMutation.mutateAsync({
        subject: issueTypeDraft,
        description: issueDescribeDraft,
        priority: "MEDIUM" as any,
      });

      if (file && ticket?.id) {
        await uploadAttachmentMutation.mutateAsync({
          id: ticket.id,
          data: { file },
        });
      }

      resetIssueFormDraft();
      setFile(null);
      setActiveTab("tickets");
      toast.success("Support ticket submitted successfully.");
    } catch (err: any) {
      console.error("Submit Issue Mutation Error:", err);
      toast.error(err?.response?.data?.message || err?.message || "Failed to submit issue report. Please try again.");
    }
  };

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingFeedback(true);
    try {
      await submitReportMutation.mutateAsync({
        subject: `[Training Feedback] ${feedbackCourse}`,
        description: `Trainer Rating: ${trainerRating}/5\nContent Quality: ${contentRating}/5\nJob Relevance: ${relevanceRating}/5\nFeedback: ${feedbackText}`,
        priority: "LOW" as any,
      });
      toast.success("Thank you! Your training feedback has been recorded.");
      setFeedbackText("");
      setActiveTab("tickets");
    } catch (err) {
      toast.error("Failed to submit feedback. Please try again.");
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  const canSubmit = issueTypeDraft.trim() !== "" && issueDescribeDraft.trim() !== "";

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
        
        {/* Back Link */}
        <button
          onClick={() => navigate("/help")}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Help Center</span>
        </button>

        {/* Header */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-sm space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
            <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />
            <span>Step 11: Training Feedback & Support</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Training Feedback & Issue Reporting
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-xl leading-relaxed">
            Submit your evaluations regarding course trainers, training relevance, and materials, or report technical difficulties.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
          <button
            onClick={() => setActiveTab("feedback")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "feedback"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-100"
                : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200/80"
            }`}
          >
            Post-Training Feedback
          </button>
          <button
            onClick={() => setActiveTab("report")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "report"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-100"
                : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200/80"
            }`}
          >
            Report Technical Issue
          </button>
          <button
            onClick={() => setActiveTab("tickets")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === "tickets"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-100"
                : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200/80"
            }`}
          >
            <span>My Submitted Records</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${activeTab === "tickets" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"}`}>
              {myReports.length}
            </span>
          </button>
        </div>

        {/* TAB 1: POST-TRAINING FEEDBACK (Step 11) */}
        {activeTab === "feedback" && (
          <form onSubmit={handleFeedbackSubmit} className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">Training & Trainer Evaluation</h3>
              <p className="text-xs text-slate-500">Provide direct feedback regarding the trainer effectiveness, content clarity, and role relevance.</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Training Program
                </label>
                <input
                  type="text"
                  value={feedbackCourse}
                  onChange={(e) => setFeedbackCourse(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  required
                />
              </div>

              {/* Rating 1: Trainer */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Trainer Delivery & Communication</h4>
                  <p className="text-[11px] text-slate-400">Did the instructor communicate clearly and address questions?</p>
                </div>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setTrainerRating(star)}
                      className="p-1 text-slate-300 hover:text-amber-400 transition-colors"
                    >
                      <Star className={`w-5 h-5 ${trainerRating >= star ? "fill-amber-400 text-amber-400" : ""}`} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Rating 2: Content Quality */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Training Content & Materials Quality</h4>
                  <p className="text-[11px] text-slate-400">Were the SOPs, videos, and presentations well-structured?</p>
                </div>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setContentRating(star)}
                      className="p-1 text-slate-300 hover:text-amber-400 transition-colors"
                    >
                      <Star className={`w-5 h-5 ${contentRating >= star ? "fill-amber-400 text-amber-400" : ""}`} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Rating 3: Relevance */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Practical Relevance to Job Role</h4>
                  <p className="text-[11px] text-slate-400">Is this training applicable to your day-to-day operations?</p>
                </div>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setRelevanceRating(star)}
                      className="p-1 text-slate-300 hover:text-amber-400 transition-colors"
                    >
                      <Star className={`w-5 h-5 ${relevanceRating >= star ? "fill-amber-400 text-amber-400" : ""}`} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Comments */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Detailed Comments or Recommendations
                </label>
                <textarea
                  rows={4}
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="Share any highlights or suggestions to improve future training sessions..."
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white resize-none"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmittingFeedback || !feedbackText.trim()}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
            >
              {isSubmittingFeedback ? "Submitting..." : "Submit Training Feedback"}
            </button>
          </form>
        )}

        {/* TAB 2: TECHNICAL ISSUE REPORTING */}
        {activeTab === "report" && (
          <form onSubmit={handleSubmitIssue} className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">Submit a Technical Issue</h3>
              <p className="text-xs text-slate-500">Report problems with video playback, assessment questions, or certificate generation.</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Issue Category *
                </label>
                <select
                  value={issueTypeDraft}
                  onChange={(e) => setIssueTypeDraft(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select category...</option>
                  <option value="Video / playback not working">Video / playback not working</option>
                  <option value="Post-training assessment bug">Post-training assessment bug</option>
                  <option value="Certificate not generated / wrong name">Certificate not generated / wrong name</option>
                  <option value="Offline access error">Offline access error</option>
                  <option value="Training assignment due date issue">Training assignment due date issue</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Description of Problem *
                </label>
                <textarea
                  rows={4}
                  value={issueDescribeDraft}
                  onChange={(e) => setIssueDescribeDraft(e.target.value)}
                  placeholder="Describe what occurred, any error messages shown, and steps to reproduce..."
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white resize-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Attachment / Screenshot (Optional)
                </label>
                <input
                  type="file"
                  onChange={handleFileChange}
                  className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={!canSubmit || submitReportMutation.isPending}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
            >
              {submitReportMutation.isPending ? "Submitting..." : "Submit Technical Ticket"}
            </button>
          </form>
        )}

        {/* TAB 3: TICKETS & FEEDBACK STATUS */}
        {activeTab === "tickets" && (
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900">Your Submitted Tickets & Feedback</h3>
            {myReports.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                No tickets or feedback submitted yet.
              </div>
            ) : (
              <div className="space-y-3">
                {myReports.map((t: any) => (
                  <div key={t.id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{t.subject}</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{t.description}</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {t.status || "Open"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default IssueReporting;
