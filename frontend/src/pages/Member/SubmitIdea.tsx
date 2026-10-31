import React, { useState, useEffect } from "react";
import { Info, Users, FileText, ChevronDown, Check, Loader2 } from "lucide-react";
import { useSubmitIdea, useMyIdeas } from "../../hooks/useHelpCenter";
import { useHelpCenterStore } from "../../store/helpCenter.store";
import { getCategories, Category } from "../../core/api/category/category.api";
import { toast } from "sonner";


export const SubmitIdea: React.FC = () => {
  const {
    ideaTitleDraft,
    ideaDescDraft,
    selectedCategory,
    allowContactDraft,
    setIdeaTitleDraft,
    setIdeaDescDraft,
    setSelectedCategory,
    setAllowContactDraft,
    resetIdeaFormDraft,
  } = useHelpCenterStore();

  const [isSubmitting, setIsSubmitting] = useState(false);

  // React Query Hooks
  const { data: myIdeas = [] } = useMyIdeas();
  const submitIdeaMutation = useSubmitIdea();

  const isFormValid = Boolean(
    ideaTitleDraft.trim() &&
    selectedCategory &&
    ideaDescDraft.trim()
  );
  const isButtonDisabled = isSubmitting || !isFormValid;

  const IDEA_CATEGORIES = [
    "Course / content",
    "Feature",
    "UX",
    // BRD: L&D Facilities Management idea categories
    "New training content suggestion",
    "Training assignment improvement",
    "Assessment question suggestion",
    "Other",
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedTitle = ideaTitleDraft.trim();
    const trimmedDesc = ideaDescDraft.trim();

    if (!trimmedTitle) {
      toast.error("Please enter an idea title.");
      return;
    }

    if (!selectedCategory) {
      toast.error("Please select a category.");
      return;
    }

    if (!trimmedDesc) {
      toast.error("Please provide details for your idea.");
      return;
    }

    setIsSubmitting(true);
    try {
      await submitIdeaMutation.mutateAsync({
        ideaTitle: trimmedTitle,
        tellUsMore: trimmedDesc,
        categoryId: selectedCategory,
        contactMe: Boolean(allowContactDraft),
      });
      resetIdeaFormDraft();
      toast.success("Thank you! Your idea has been submitted successfully.");
    } catch (err: any) {
      console.error("Submit idea mutation error:", err);
      toast.error(err?.response?.data?.message || err?.response?.data?.error || "Failed to submit idea. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const s = status?.toLowerCase() || "";
    if (s.includes("planned") || s.includes("info")) {
      return "bg-[#edf4f8] text-[#2d627c] border border-[#b8d4e3]";
    }
    if (s.includes("review") || s.includes("progress")) {
      return "bg-[#fdf3d6] text-[#755a12] border border-[#edd79a]";
    }
    if (s.includes("shipped") || s.includes("done") || s.includes("success")) {
      return "bg-[#dce5d3] text-[#446038] border border-[#bfcfb4]";
    }
    return "bg-[#f6f6f4] text-[#5c5c5c] border border-[#1111111a]";
  };

  const displayIdeas = myIdeas || [];

  return (
    <div className="min-h-screen bg-white font-sans text-[#141414]">
      <div >

        {/* Page Header */}
        <div>
          <p
            className="font-bold text-[#5c5c5c] mb-1"
            style={{ fontSize: "11px", letterSpacing: "0.14em", textTransform: "uppercase" }}
          >
            Feedback &middot; Ideas
          </p>
          <h1
            className="font-bold text-[#141414] leading-tight"
            style={{ fontSize: "clamp(24px, 2.6vw, 30px)", letterSpacing: "-0.02em" }}
          >
            Submit an idea
          </h1>
          <p className="text-sm text-[#5c5c5c] font-medium mt-1">
            Share your ideas to help shape the learning experience. Every submission is reviewed by the Nexus team.
          </p>
        </div>

        {/* Main Grid: Form on left, Tips on right */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 items-start mt-5">

          {/* LEFT: Form Card */}
          <div className="bg-white border border-[#1111111a] rounded-[16px] p-6 shadow-[0_2px_8px_-2px_rgba(42,17,8,0.04)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_28px_-8px_rgba(42,17,8,0.12)]">
            <form onSubmit={handleSubmit} className="space-y-5 ">

              {/* Idea Title */}
              <div>
                <label
                  htmlFor="idea-title"
                  className="block font-bold text-[#5c5c5c] mb-1.5"
                  style={{ fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase" }}
                >
                  Idea title <span className="text-[#8f3a20]">*</span>
                </label>
                <input
                  id="idea-title"
                  type="text"
                  className="w-full bg-white text-sm font-medium text-[#141414] placeholder-[#8c8c8c] transition-colors"
                  style={{
                    height: "42px",
                    borderRadius: "8px",
                    border: "1px solid #11111129",
                    padding: "0 14px",
                    outline: "none",
                  }}
                  placeholder="Give your idea a short, clear title"
                  value={ideaTitleDraft}
                  onChange={(e) => setIdeaTitleDraft(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              {/* Category */}
              <div>
                <label
                  htmlFor="idea-cat"
                  className="block font-bold text-[#5c5c5c] mb-1.5"
                  style={{ fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase" }}
                >
                  Category <span className="text-[#8f3a20]">*</span>
                </label>
                <div className="relative">
                  <select
                    id="idea-cat"
                    className="w-full appearance-none bg-white text-sm font-medium text-[#141414] cursor-pointer transition-colors"
                    style={{
                      height: "42px",
                      borderRadius: "8px",
                      border: "1px solid #11111129",
                      padding: "0 36px 0 14px",
                      outline: "none",
                    }}
                    value={selectedCategory || ""}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    disabled={isSubmitting}
                  >
                    <option value="" disabled={Boolean(selectedCategory)}>
                      Select a category...
                    </option>
                    {IDEA_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5c5c5c]" />
                </div>

                {/* Category shortcut pills — always visible */}
                <div className="flex flex-wrap gap-2 mt-2.5">
                  {IDEA_CATEGORIES.map((cat) => {
                    const isActive = selectedCategory === cat;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setSelectedCategory(cat)}
                        className="cursor-pointer transition-all duration-150"
                        style={{
                          borderRadius: "100px",
                          padding: "4px 14px",
                          fontSize: "12px",
                          fontWeight: 600,
                          background: isActive ? "#141414" : "#fff",
                          color: isActive ? "#fff" : "#5c5c5c",
                          border: isActive ? "1px solid #141414" : "1px solid #1111111a",
                        }}
                        onMouseEnter={(e) => {
                          if (!isActive) {
                            (e.currentTarget as HTMLButtonElement).style.background = "#f6f6f4";
                            (e.currentTarget as HTMLButtonElement).style.color = "#141414";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isActive) {
                            (e.currentTarget as HTMLButtonElement).style.background = "#fff";
                            (e.currentTarget as HTMLButtonElement).style.color = "#5c5c5c";
                          }
                        }}
                      >
                        {cat}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Description */}
              <div>
                <label
                  htmlFor="idea-desc"
                  className="block font-bold text-[#5c5c5c] mb-1.5"
                  style={{ fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase" }}
                >
                  Description <span className="text-[#8f3a20]">*</span>
                </label>
                <textarea
                  id="idea-desc"
                  rows={5}
                  className="w-full bg-white text-sm font-medium text-[#141414] placeholder-[#8c8c8c] transition-colors resize-none"
                  style={{
                    borderRadius: "8px",
                    border: "1px solid #11111129",
                    padding: "12px 14px",
                    outline: "none",
                    minHeight: "140px",
                  }}
                  placeholder="Describe your idea. What problem does it solve? What would it look like?"
                  value={ideaDescDraft}
                  onChange={(e) => setIdeaDescDraft(e.target.value)}
                  maxLength={1000}
                  disabled={isSubmitting}
                />
                <div className="text-right text-[11px] text-[#8c8c8c] mt-1 font-medium">
                  {ideaDescDraft.length} / 1000
                </div>
              </div>

              <div style={{ height: "1px", background: "#1111111a", margin: "16px 0" }} />

              {/* Contact checkbox */}
              <label className="flex items-start gap-3 cursor-pointer select-none group">
                <input
                  type="checkbox"
                  checked={allowContactDraft}
                  onChange={(e) => setAllowContactDraft(e.target.checked)}
                  disabled={isSubmitting}
                  className="mt-0.5"
                  style={{
                    width: "16px",
                    height: "16px",
                    accentColor: "#141414",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                />
                <span className="text-sm font-medium text-[#141414] leading-tight">
                  It's okay to contact me about this idea if we need more details.
                </span>
              </label>

              {/* Legal disclaimer */}
              <p
                className="text-xs text-[#8c8c8c] leading-relaxed pt-1"
                style={{ fontSize: "11.5px", lineHeight: "1.45" }}
              >
                By submitting, you agree that Nexus Academy may use, adapt, or implement your idea and that you retain no ownership or claim over submitted ideas. Standout submissions may be rewarded at Nexus Academy's discretion.
              </p>

              {/* Submit button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isButtonDisabled}
                  className={`w-full flex items-center justify-center gap-2 transition-all duration-200 ${
                    isButtonDisabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"
                  }`}
                  style={{
                    height: "44px",
                    borderRadius: "100px",
                    background: isButtonDisabled ? "#f4f4f2" : "#fcf7ae",
                    color: isButtonDisabled ? "#8c8c8c" : "#141414",
                    fontSize: "14px",
                    fontWeight: 700,
                    border: isButtonDisabled ? "1px solid #1111111a" : "none",
                    boxShadow: isButtonDisabled ? "none" : "0 8px 24px -8px rgba(42,17,8,0.18)",
                  }}
                  onMouseEnter={(e) => {
                    if (!isButtonDisabled) {
                      (e.currentTarget as HTMLButtonElement).style.background = "#f0ea8a";
                      (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)";
                      (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 12px 28px -8px rgba(42,17,8,0.24)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isButtonDisabled) {
                      (e.currentTarget as HTMLButtonElement).style.background = "#fcf7ae";
                      (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
                      (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 8px 24px -8px rgba(42,17,8,0.18)";
                    }
                  }}
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {isSubmitting ? "Submitting..." : "Submit idea"}
                </button>
              </div>
            </form>
          </div>

          {/* RIGHT: Tips Card */}
          <div className="bg-white border border-[#1111111a] rounded-[16px] p-[22px] shadow-[0_2px_8px_-2px_rgba(42,17,8,0.04)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_28px_-8px_rgba(42,17,8,0.12)]">
            <h3
              className="font-bold text-[#5c5c5c] mb-5"
              style={{ fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase" }}
            >
              Tips for a great submission
            </h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: "#f6e8c4", color: "#c99b2e" }}
                >
                  <Info size={16} />
                </div>
                <p className="text-xs text-[#5c5c5c] leading-relaxed" style={{ lineHeight: "1.45" }}>
                  <strong className="text-[#141414] font-bold">Be specific.</strong> Ideas with a clear problem statement are more likely to be actioned.
                </p>
              </div>

              <div style={{ height: "1px", background: "#1111111a", width: "100%" }} />

              <div className="flex items-start gap-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: "#dce5d3", color: "#446038" }}
                >
                  <Users size={16} />
                </div>
                <p className="text-xs text-[#5c5c5c] leading-relaxed" style={{ lineHeight: "1.45" }}>
                  <strong className="text-[#141414] font-bold">Think about others.</strong> Ideas that benefit many learners move to the top of the review queue.
                </p>
              </div>

              <div style={{ height: "1px", background: "#1111111a", width: "100%" }} />

              <div className="flex items-start gap-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: "#efd3c7", color: "#8f3a20" }}
                >
                  <FileText size={16} />
                </div>
                <p className="text-xs text-[#5c5c5c] leading-relaxed" style={{ lineHeight: "1.45" }}>
                  <strong className="text-[#141414] font-bold">Describe the outcome.</strong> Explain what success looks like, not just what you want built.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM: Submitted Ideas Section */}
        <div className="mt-8 bg-white border border-[#1111111a] rounded-[16px] p-6 shadow-[0_2px_8px_-2px_rgba(42,17,8,0.04)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_28px_-8px_rgba(42,17,8,0.12)]">
          <h3
            className="font-bold text-[#5c5c5c] mb-4"
            style={{ fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase" }}
          >
            Your submitted ideas
          </h3>
          <div className="space-y-3.5">
            {displayIdeas.map((idea: any) => {
              const status = idea.status || "Under review";
              const response = idea.response || "";
              const catName = idea.categoryName || idea.categoryId || "Course / content";
              const dateStr = idea.createdAt ? new Date(idea.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "";

              return (
                <div
                  key={idea.id}
                  style={{
                    border: "1px solid #1111111a",
                    borderRadius: "12px",
                    padding: "18px 20px",
                    background: "#f8f8f6",
                  }}
                  className="space-y-2.5"
                >
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                    <h4 className="text-sm font-bold text-[#141414] leading-snug">
                      {idea.ideaTitle}
                    </h4>
                    <span
                      className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full shrink-0 ${getStatusBadge(status)}`}
                      style={{ borderRadius: "100px" }}
                    >
                      {status}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <span
                      className="px-2.5 py-0.5 text-[11px] text-[#5c5c5c] font-medium"
                      style={{
                        borderRadius: "100px",
                        border: "1px solid #1111111a",
                        background: "#fff",
                      }}
                    >
                      {catName}
                    </span>
                    <span className="text-xs text-[#8c8c8c]">
                      Submitted {dateStr}
                    </span>
                  </div>

                  {response && (
                    <div
                      style={{
                        background: "#fff",
                        border: "1px solid #1111111a",
                        borderRadius: "8px",
                        padding: "10px 14px",
                        fontSize: "13px",
                        color: "#3a3a3a",
                        lineHeight: "1.45",
                        marginTop: "10px",
                      }}
                    >
                      <strong className="font-bold text-[#141414]">Response from Nexus: </strong>
                      {response}
                    </div>
                  )}
                </div>
              );
            })}
            {displayIdeas.length === 0 && (
              <div className="py-6 text-center text-[13px] text-[#5c5c5c]">
                You haven't submitted any ideas yet.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default SubmitIdea;

