import React, { useState } from "react";
import { useNavigate } from "react-router";
import { useProfile } from "../../../hooks/profile/useProfile";
import { api } from "../../../config/axios";

import { useEnrolledCourses } from "../../../hooks/course-details/courseDetails";
import { useProgressDashboard } from "../../../hooks/member-learning/memberLearning";

const DeleteYourAccount: React.FC = () => {
  const navigate = useNavigate();
  const { profile, resendOtp } = useProfile();
  const { data: enrolledCoursesList } = useEnrolledCourses(!!profile);
  const { data: dashboardData } = useProgressDashboard(profile?.id || "", !!profile?.id);

  const [reason, setReason] = useState("");
  const [feedback, setFeedback] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [understood, setUnderstood] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Parse member since date (prioritizing the users db table created_at / createdAt)
  const memberSince = (profile as any)?.created_at || (profile as any)?.createdAt || profile?.firstLoginAt;
  const formattedMemberSince = memberSince
    ? new Date(memberSince).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
    : "Just joined";

  // Calculate dynamic stats
  const coursesEnrolled = dashboardData?.enrolledCourses ?? (enrolledCoursesList ? enrolledCoursesList.length : 0);
  const completed = dashboardData?.completedCourses ?? (enrolledCoursesList 
    ? enrolledCoursesList.filter((c: any) => c.progress?.status === "COMPLETED" || c.status === "COMPLETED").length 
    : 0);
  
  // Use exact dynamic totalLearningTime from the progress engine matching Dashboard
  const totalLearningTimeSecs = dashboardData?.totalLearningTime || 0;
  let hoursLearned = "0 min";
  if (totalLearningTimeSecs > 0) {
    const hours = Math.floor(totalLearningTimeSecs / 3600);
    const minutes = Math.floor((totalLearningTimeSecs % 3600) / 60);
    if (hours > 0) {
      hoursLearned = minutes > 0 ? `${hours} hr ${minutes} m` : `${hours} hrs`;
    } else {
      hoursLearned = `${Math.max(1, minutes)} min`;
    }
  } else {
    // Fallback to completed courses duration if totalLearningTime is 0
    const calculatedHours = enrolledCoursesList 
      ? enrolledCoursesList.reduce((acc: number, curr: any) => {
          if (curr.progress?.status === "COMPLETED" || curr.status === "COMPLETED") {
             return acc + (curr.course?.duration || 2); 
          }
          return acc;
        }, 0)
      : 0;
    if (calculatedHours > 0) {
      hoursLearned = `${calculatedHours}h`;
    }
  }


  const isFormValid = confirmText === "DELETE" && understood;

  const handleDelete = async () => {
    if (isFormValid) {
      try {
        setIsSending(true);

        // Submit feedback and trigger OTP
        await api.post("/profile/me/account/request-delete", {
          Leaving: reason,
          additional_feedback: feedback
        });

        // Only navigate on success
        navigate("/profile/delete/verify");
      } catch (error) {
        console.error("Failed to send OTP:", error);
      } finally {
        setIsSending(false);
      }
    }
  };

  return (
     
    <>
    {/* <div className="min-h-screen bg-[var(--bg)] p-4 md:p-8 flex justify-center font-sans">
      <div className="max-w-[1000px] w-full"> */}
      {/* Back Link */}
      <button
        onClick={() => navigate("/profile")}
        className="text-[var(--ink-mute)] hover:text-[var(--ink)] flex items-center text-[12px] font-bold tracking-wider uppercase mb-6 transition-colors cursor-pointer"
      >
        <span className="mr-2">←</span> Settings
      </button>

      {/* Title & Description */}
      <p className="text-[var(--ink-mute)] text-[12px] font-bold uppercase tracking-wider mb-1.5">Account</p>
      <h1 className="text-[24px] font-bold text-[var(--ink)] mb-1.5 tracking-tight">Delete your account</h1>
      <p className="text-[var(--ink-mute)] mb-6 text-[16px]">
        We are sorry to see you go. Before you continue, please review what happens to your account and data.
      </p>

      {/* Account Summary Box */}
      <div className="bg-[var(--paper-2)] border border-[var(--line)] rounded-[12px] py-[22px] px-[26px] mb-4.5 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-1">
        <h3 className="font-bold text-[var(--ink-mute)] text-[11px] uppercase tracking-wider mb-5">Your account footprint</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-[var(--paper)] border border-[var(--line)] rounded-[8px] p-4 shadow-sm">
            <p className="text-[var(--ink-mute)] text-[12px] font-bold uppercase tracking-wider mb-2">Member Since</p>
            <p className="text-[var(--ink)] text-[16px] font-bold">{formattedMemberSince}</p>
          </div>
          <div className="bg-[var(--paper)] border border-[var(--line)] rounded-[8px] p-4 shadow-sm">
            <p className="text-[var(--ink-mute)] text-[11px] font-bold uppercase tracking-wider mb-2">Courses Enrolled</p>
            <p className="text-[var(--ink)] text-[16px] font-bold">{coursesEnrolled}</p>
          </div>
          <div className="bg-[var(--paper)] border border-[var(--line)] rounded-[8px] p-4 shadow-sm">
            <p className="text-[var(--ink-mute)] text-[11px] font-bold uppercase tracking-wider mb-2">Completed</p>
            <p className="text-[var(--ink)] text-[16px] font-bold">{completed}</p>
          </div>
          <div className="bg-[var(--paper)] border border-[var(--line)] rounded-[8px] p-4 shadow-sm">
            <p className="text-[var(--ink-mute)] text-[11px] font-bold uppercase tracking-wider mb-2">Hours Learned</p>
            <p className="text-[var(--ink)] text-[16px] font-bold">{hoursLearned}</p>
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_1.3fr] gap-6">

        {/* Left Column: Warning Box */}
        <div className="bg-[var(--c-danger-wash)] rounded-[12px] py-[22px] px-[24px] h-fit text-[var(--c-danger)] transition-all duration-300 hover:shadow-md hover:-translate-y-1">
          <h2 className="font-bold mb-6 flex items-center text-[16px]">
            <div className="w-6 h-6 rounded-full border border-[var(--c-danger)] flex items-center justify-center mr-3 shrink-0">
              <span className="font-bold text-[12px]">!</span>
            </div>
            What happens when you delete
          </h2>
          <ul className="space-y-4 text-[16px] leading-relaxed">
            <li className="flex items-start">
              <span className="mr-3 mt-2.5 w-1 h-1 rounded-full bg-[var(--c-danger)] shrink-0"></span>
              <span>Your account is <strong>soft-deleted</strong> immediately. You can restore it within <strong>30 days</strong>.</span>
            </li>
            <li className="flex items-start">
              <span className="mr-3 mt-2.5 w-1 h-1 rounded-full bg-[var(--c-danger)] shrink-0"></span>
              <span>All sessions are terminated and login is disabled.</span>
            </li>
            <li className="flex items-start">
              <span className="mr-3 mt-2.5 w-1 h-1 rounded-full bg-[var(--c-danger)] shrink-0"></span>
              <span>In-progress courses are paused. Progress is preserved during the 30-day grace period.</span>
            </li>
            <li className="flex items-start">
              <span className="mr-3 mt-2.5 w-1 h-1 rounded-full bg-[var(--c-danger)] shrink-0"></span>
              <span>After 30 days, all PII (name, email, contact info) is purged permanently.</span>
            </li>
            <li className="flex items-start">
              <span className="mr-3 mt-2.5 w-1 h-1 rounded-full bg-[var(--c-danger)] shrink-0"></span>
              <span>If you are a <strong>locally certified learner</strong>, your record is <strong>never hard deleted</strong> and is retained permanently by membership number for verification.</span>
            </li>
            <li className="flex items-start">
              <span className="mr-3 mt-2.5 w-1 h-1 rounded-full bg-[var(--c-danger)] shrink-0"></span>
              <span>Access to your issued Course Completed proofs <strong>remains functional</strong> even after your account is deactivated, suspended, dormant, or deleted.</span>
            </li>
            <li className="flex items-start">
              <span className="mr-3 mt-2.5 w-1 h-1 rounded-full bg-[var(--c-danger)] shrink-0"></span>
              <span>If you have a corporate account, your tenant admin is notified.</span>
            </li>
          </ul>
        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-6">
          
          {/* Form Fields Card */}
          <div className="bg-[var(--paper)] border border-[var(--line)] rounded-[12px] py-[24px] px-[26px] space-y-6 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-1">
            
            {/* Reason */}
            <div>
              <label className="flex flex-col sm:flex-row sm:justify-between gap-1 mb-2">
                <span className="text-[11px] font-bold tracking-wider text-[var(--ink-mute)] uppercase">WHY ARE YOU LEAVING?</span>
                <span className="text-[var(--ink-faint)] text-[12px]">(optional, helps us improve)</span>
              </label>
              <select
                className="w-full bg-[var(--paper)] border border-[var(--line-strong)] text-[var(--ink)] rounded-lg h-[44px] px-3 focus:outline-none focus:border-[var(--c-honey)] cursor-pointer"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              >
                <option value="">Choose a reason...</option>
                <option value="not_finding_relevant_courses">Not finding relevant courses</option>
                <option value="too_expensive">Too expensive</option>
                <option value="switching_to_another_platform">Switching to another platform</option>
                <option value="privacy_concerns">Privacy concerns</option>
                <option value="account_no_longer_needed">Account no longer needed</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Feedback */}
            <div>
              <label className="flex flex-col sm:flex-row sm:justify-between gap-1 mb-2">
                <span className="text-[11px] font-bold tracking-wider text-[var(--ink-mute)] uppercase">ADDITIONAL FEEDBACK</span>
                <span className="text-[var(--ink-faint)] text-[12px]">(optional)</span>
              </label>
              <textarea
                className="w-full bg-[var(--paper)] border border-[var(--line-strong)] text-[var(--ink)] rounded-lg p-3 min-h-[120px] focus:outline-none focus:border-[var(--c-honey)] resize-y"
                placeholder="Tell us what we could have done better..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
              />
            </div>

            {/* Divider */}
            <div className="h-px w-full bg-[var(--line)]"></div>

            {/* Confirm Text */}
            <div>
              <label className="text-[11px] font-bold tracking-wider text-[var(--ink-mute)] uppercase mb-2 block">
                TYPE DELETE TO CONFIRM <span className="text-[var(--c-danger)]">*</span>
              </label>
              <input
                type="text"
                placeholder="DELETE"
                className="w-full bg-[var(--paper)] border border-[var(--line-strong)] text-[var(--ink)] rounded-lg h-[44px] px-3 focus:outline-none focus:border-[var(--c-danger)] placeholder:text-gray-300"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
              />
              <p className="text-[var(--ink-mute)] text-[13px] mt-2">Type the word DELETE in capital letters to enable the deletion button</p>
            </div>

            {/* Checkbox */}
            <div className="flex items-start pt-2">
              <input
                type="checkbox"
                id="understand"
                className="mt-1 mr-3 h-4 w-4 rounded border-[var(--line-strong)] text-[var(--c-sage)] focus:ring-[var(--c-sage)] cursor-pointer shrink-0"
                checked={understood}
                onChange={(e) => setUnderstood(e.target.checked)}
              />
              <label htmlFor="understand" className="text-[14px] text-[var(--ink-mute)] cursor-pointer leading-relaxed">
                I understand my account will be deactivated immediately and permanently deleted after 30 days.
              </label>
            </div>
            
          </div>

          {/* Buttons (Outside Card) */}
          <div className="flex flex-col-reverse md:flex-row md:justify-end gap-3">
            <button
              type="button"
              className="px-4.5 py-[11px] rounded-full border border-[var(--line-strong)] text-[var(--ink)] hover:bg-[var(--paper-2)] font-semibold text-[14px] transition-colors bg-[var(--paper)] w-full md:w-auto cursor-pointer shadow-sm"
              onClick={() => navigate("/profile")}
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!isFormValid || isSending}
              className={`px-4.5 py-[11px] rounded-full text-white font-semibold text-[14px] transition-colors flex items-center justify-center gap-2 w-full md:w-auto shadow-sm ${!isFormValid || isSending ? "bg-[#e89090] cursor-not-allowed" : "bg-[var(--c-danger)] hover:bg-[#a62b2b] cursor-pointer"}`}
              onClick={handleDelete}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
              </svg>
              {isSending ? "Sending OTP..." : "Continue to confirmation"}
            </button>
          </div>

        </div>
      </div>
    </>
  );
};

export default DeleteYourAccount;
