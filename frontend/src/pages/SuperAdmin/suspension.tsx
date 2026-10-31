import React, { useState } from "react";
import { ArrowLeft, AlertTriangle, RefreshCw, ChevronDown } from "../../assets/icons";
import { toast } from "sonner";
import { useUser, useAdminChangeStatus } from "../../hooks/internal-user/useInternalUser";
import "../../styles/tokens.css";
import { Skeleton } from "../../components/ui/Skeleton/Skeleton";

interface SuspensionPageProps {
  userId: string;
  onBack: () => void;
}

export default function SuspensionPage({ userId, onBack }: SuspensionPageProps) {
  const { data: user, isLoading: isUserLoading } = useUser(userId);
  const { mutateAsync: changeStatus, isPending } = useAdminChangeStatus();

  const [reason, setReason] = useState("");
  const [internalNotes, setInternalNotes] = useState("");
  const [duration, setDuration] = useState("30");
  const [customDate, setCustomDate] = useState("");
  const [confirmAccurate, setConfirmAccurate] = useState(false);
  const [notifyUser, setNotifyUser] = useState(true);

  const handleSuspend = async () => {
    if (!reason) {
      toast.error("Please select a reason.");
      return;
    }

    if (!confirmAccurate) {
      toast.error("Please confirm the suspension record is accurate.");
      return;
    }

    let suspendDurationDays = parseInt(duration, 10);

    if (duration === "custom") {
      if (!customDate) {
        toast.error("Please select a custom end date.");
        return;
      }
      const selectedDate = new Date(customDate);
      const now = new Date();
      const diffTime = selectedDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays <= 0) {
        toast.error("Custom end date must be in the future.");
        return;
      }
      suspendDurationDays = diffDays;
    }
    
    try {
      await changeStatus({
        userId,
        status: "SUSPENDED",
        reason,
        internalNotes,
        suspendDurationDays,
        notifyUser,
      });
      toast.success("User suspended successfully");
      onBack();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to suspend user");
    }
  };

  if (isUserLoading) {
    return (
      <div className="p-6 space-y-6 w-full min-h-screen bg-[var(--surface)]">
        <div className="space-y-2 mb-8">
          <Skeleton className="h-8 w-1/4 rounded-[var(--r-sm)]" />
          <Skeleton className="h-4 w-1/3 rounded-[var(--r-sm)]" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Skeleton className="h-[100px] rounded-[var(--r-lg)]" />
          <Skeleton className="h-[100px] rounded-[var(--r-lg)]" />
          <Skeleton className="h-[100px] rounded-[var(--r-lg)]" />
          <Skeleton className="h-[100px] rounded-[var(--r-lg)]" />
        </div>
        <Skeleton className="h-[400px] w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div>
      {/* =================================================
            HEADER SECTION
        ================================================= */}
      <div className="mb-6 md:mb-8 flex shrink-0 flex-col">
        <button
          onClick={onBack}
          className="asusp-back group flex w-fit items-center text-[length:var(--fs-label)] [font-family:var(--font-serif)] font-[var(--fw-bold)] uppercase tracking-[var(--ls-label)] text-[var(--ink-mute)] transition-colors hover:text-[var(--ink)] mb-[var(--space-9)]"
        >
          <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
          BACK TO USERS
        </button>

        <div>
          <div className="asusp-eyebrow text-[length:var(--fs-label)] [font-family:var(--font-serif)] font-[var(--fw-bold)] tracking-[var(--ls-label)] text-[var(--ink-mute)] uppercase mb-[6px]">
            USER MANAGEMENT · LIFECYCLE ACTION
          </div>

          <div className="flex flex-col">
            <h1 className="asusp-page-title flex items-baseline gap-2 text-[length:var(--fs-h1)] [font-family:var(--font-sans)] font-[var(--fw-extrabold)] text-[var(--ink)] tracking-tight mb-[8px]">
              Suspend account
            </h1>

            <p className="text-[length:var(--fs-body)] [font-family:var(--font-sans)] text-[var(--ink-soft)] leading-relaxed max-w-2xl">
              Review the suspension details below and confirm to update the record and audit log.
            </p>
          </div>
        </div>
      </div>
      {/* =================================================
            MAIN GRID
        ================================================= */}
      <div className="grid grid-cols-1 gap-6 md:gap-8 lg:gap-10 lg:grid-cols-[1fr_360px]">

        {/* LEFT COLUMN: FORM */}
        <div className="space-y-6">
          <div className="rounded-[var(--r-lg)] border border-[var(--line-strong)] bg-[var(--paper)] p-4 sm:py-[18px] sm:px-[22px] shadow-sm">

            {/* User Read-only info */}
            <div className="mb-6.5">
              <label className="asusp-section-label mb-[18px] block text-[length:var(--fs-label)] [font-family:var(--font-serif)] font-[var(--fw-bold)] uppercase tracking-widest text-[var(--ink-faint)]">
                USER
              </label>

              <div className="border-b border-[var(--line-strong)] text-[length:var(--fs-body)] [font-family:var(--font-sans)] text-[var(--ink-mute)]">
                {user?.email} · {user?.roles?.join(", ") || "Learner"} {user?.department ? `· ${user.department}` : ""}
              </div>
            </div>

            <div className="mb-6.5">
              <label className="asusp-section-label mb-[18px] block text-[length:var(--fs-label)] [font-family:var(--font-serif)] font-[var(--fw-bold)] uppercase tracking-widest text-[var(--ink-faint)]">
                DETAILS
              </label>

              {/* Reason */}
              <div className="asusp-field mb-[var(--space-9)]">
                <div className="flex flex-col">
                  <label htmlFor="suspension-reason" className="asusp-label block mb-[8px] text-[length:var(--fs-label)] [font-family:var(--font-serif)] font-[var(--fw-bold)] uppercase tracking-widest text-[var(--ink-mute)]">
                    REASON <span className="text-[var(--c-danger)]">*</span>
                  </label>

                  <div className="relative">
                    <select
                      id="suspension-reason"
                      className="asusp-input appearance-none h-10 w-full rounded-[var(--r-md)] border border-[var(--line-strong)] bg-[var(--paper)] px-[var(--space-8)] pr-9 text-[length:var(--fs-body)] [font-family:var(--font-sans)] text-[var(--ink)] outline-none transition focus:border-[var(--c-honey)] focus:ring-1 focus:ring-[var(--c-honey)]"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                    >
                      <option value="">- select a reason -</option>
                      <option value="Policy violation">Policy violation</option>
                      <option value="Suspected fraud">Suspected fraud</option>
                      <option value="Identity verification pending">Identity verification pending</option>
                      <option value="User request (vacation hold)">User request (vacation hold)</option>
                      <option value="Other">Other</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-[14px] top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--ink-mute)]" />
                  </div>
                </div>
              </div>

              {/* Internal Notes */}
              <div className="asusp-field mb-[var(--space-9)]">
                <div className="flex flex-col">
                  <label htmlFor="suspension-notes" className="asusp-label block mb-[8px] text-[length:var(--fs-label)] [font-family:var(--font-serif)] font-[var(--fw-bold)] uppercase tracking-widest text-[var(--ink-mute)]">
                    INTERNAL NOTES{" "}
                    <span className="font-[var(--fw-regular)] normal-case [font-family:var(--font-serif)] tracking-normal text-[var(--ink-mute)]">
                      (visible to admins only)
                    </span>
                  </label>

                <textarea
                  id="suspension-notes"
                  className="asusp-input min-h-[100px] w-full resize-y rounded-[var(--r-md)] border border-[var(--line-strong)] bg-[var(--paper)] px-[14px] py-[9px] text-[length:var(--fs-body)] [font-family:var(--font-sans)] leading-relaxed text-[var(--ink)] outline-none transition focus:border-[var(--c-honey)] focus:ring-0"
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                  placeholder="Enter internal notes..."
                />
              </div>
            </div>

              {/* Suspension Duration */}
              <div className="asusp-field mb-[var(--space-9)]">
                <div className="flex flex-col">
                  <label htmlFor="suspension-duration" className="asusp-label block mb-[8px] text-[length:var(--fs-label)] [font-family:var(--font-serif)] font-[var(--fw-bold)] uppercase tracking-widest text-[var(--ink-mute)]">
                    SUSPENSION DURATION
                  </label>

                <div className="relative">
                  <select
                    id="suspension-duration"
                    className="asusp-input appearance-none h-10 w-full rounded-[var(--r-md)] border border-[var(--line-strong)] bg-[var(--paper)] px-[var(--space-8)] pr-9 text-[length:var(--fs-body)] [font-family:var(--font-sans)] text-[var(--ink)] outline-none transition focus:border-[var(--c-honey)] focus:ring-1 focus:ring-[var(--c-honey)]"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                  >
                    <option value="7">7 days</option>
                    <option value="30">30 days</option>
                    <option value="90">90 days</option>
                    <option value="0">Permanent</option>
                    <option value="custom">Custom Date</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-[14px] top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--ink-mute)]" />
                </div>
                
                  {duration === "custom" && (
                    <div className="mt-[12px]">
                      <label htmlFor="custom-date" className="asusp-label block mb-[8px] text-[length:var(--fs-label)] [font-family:var(--font-serif)] font-[var(--fw-bold)] uppercase tracking-widest text-[var(--ink-mute)]">
                        SELECT END DATE
                      </label>
                      <input
                      type="date"
                      id="custom-date"
                      min={new Date().toISOString().split('T')[0]}
                      className="asusp-input h-10 w-full rounded-[var(--r-md)] border border-[var(--line-strong)] bg-[var(--paper)] px-[14px] py-0 text-[length:var(--fs-body)] [font-family:var(--font-sans)] text-[var(--ink)] outline-none transition focus:border-[var(--c-honey)] focus:ring-0"
                      value={customDate}
                      onChange={(e) => setCustomDate(e.target.value)}
                    />
                  </div>
                )}
              </div>
              </div>
            </div>

            {/* Confirm Heading */}
            <div className="mb-4 text-[length:var(--fs-label)] [font-family:var(--font-serif)] font-[var(--fw-bold)] uppercase tracking-widest text-[var(--ink-mute)]">
              CONFIRM
            </div>

            {/* Checkboxes */}
            <div className="space-y-4">
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 shrink-0 cursor-pointer rounded border-[var(--line-strong)] accent-[var(--c-check)]"
                  checked={confirmAccurate}
                  onChange={(e) => setConfirmAccurate(e.target.checked)}
                />
                <span className="text-[length:var(--fs-body)] [font-family:var(--font-sans)] leading-6 text-[var(--ink-soft)]">
                  I confirm this suspension record is accurate. Changes will be logged
                  to the audit trail.
                </span>
              </label>

              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 shrink-0 cursor-pointer rounded border-[var(--line-strong)] accent-[var(--c-check)]"
                  checked={notifyUser}
                  onChange={(e) => setNotifyUser(e.target.checked)}
                />
                <span className="text-[length:var(--fs-body)] [font-family:var(--font-sans)] leading-6 text-[var(--ink-soft)]">
                  Send updated notification email to user if reason or duration changes
                </span>
              </label>
            </div>

          </div>
        </div>

        {/* RIGHT COLUMN: SIDEBAR */}
        <div className="space-y-5 md:space-y-6">

          {/* Summary Card */}
          <div className="rounded-[var(--r-lg)] border border-[var(--line-strong)] bg-[var(--paper)] p-4 sm:py-[18px] sm:px-[20px]">
            <div className="asusp-section-label mb-3 text-[length:var(--fs-label)] [font-family:var(--font-serif)] font-[var(--fw-bold)] uppercase tracking-widest text-[var(--ink-mute)]">
              SUSPENSION SUMMARY
            </div>

            <div className="flex flex-col gap-5">
              <div>
                <label className="mb-1 block text-[length:var(--fs-label)] [font-family:var(--font-serif)] font-[var(--fw-bold)] uppercase tracking-widest text-[var(--ink-mute)]">
                  USER
                </label>

                <div className="text-[length:var(--fs-body)] [font-family:var(--font-sans)] leading-6 text-[var(--ink)]">
                  {user?.email}
                </div>
              </div>

              <div>
                <label className="mb-1 block text-[length:var(--fs-label)] [font-family:var(--font-serif)] font-[var(--fw-bold)] uppercase tracking-widest text-[var(--ink-mute)]">
                  REASON
                </label>

                <div className="text-[length:var(--fs-body)] [font-family:var(--font-sans)] leading-6 text-[var(--ink)]">
                  {reason}
                </div>
              </div>

              <div>
                <label className="mb-1 block text-[length:var(--fs-label)] [font-family:var(--font-serif)] font-[var(--fw-bold)] uppercase tracking-widest text-[var(--ink-mute)]">
                  DURATION
                </label>

                <div className="text-[length:var(--fs-body)] [font-family:var(--font-sans)] leading-6 text-[var(--ink)]">
                  {duration === "0" ? "Permanent" : duration === "custom" ? (customDate ? new Date(customDate).toLocaleDateString() : "Not selected") : `${duration} days`}
                </div>
              </div>

              <div>
                <label className="mb-1 block text-[length:var(--fs-label)] [font-family:var(--font-serif)] font-[var(--fw-bold)] uppercase tracking-widest text-[var(--ink-mute)]">
                  NOTIFY USER
                </label>

                <div className="text-[length:var(--fs-body)] [font-family:var(--font-sans)] leading-6 text-[var(--ink)]">
                  {notifyUser ? "Yes" : "No"}
                </div>
              </div>
            </div>
          </div>

          {/* Alert Card */}
          <div className="rounded-[var(--r-lg)] border border-[var(--line-strong)] bg-[var(--c-honey-wash)] p-4 sm:py-[16px] sm:px-[18px]">
            <div className="mb-2.5 flex items-center gap-2 text-[length:var(--fs-label)] [font-family:var(--font-serif)] font-[var(--fw-semibold)] text-[var(--c-honey-text)]">
              <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
              WHAT HAPPENS IMMEDIATELY
            </div>

            <ul className="space-y-3 text-[length:var(--fs-body)] [font-family:var(--font-sans)] leading-[1.4] text-[var(--ink-soft)]">
              <li className="flex items-start">
                <span className="mr-3 mt-[7.5px] h-1 w-1 shrink-0 rounded-full bg-[var(--c-honey)]" />
                <span>User cannot log in until reactivated</span>
              </li>

              <li className="flex items-start">
                <span className="mr-3 mt-[7.5px] h-1 w-1 shrink-0 rounded-full bg-[var(--c-honey)]" />
                <span>Active sessions terminated immediately</span>
              </li>

              <li className="flex items-start">
                <span className="mr-3 mt-[7.5px] h-1 w-1 shrink-0 rounded-full bg-[var(--c-honey)]" />
                <span>In-progress courses paused (data retained)</span>
              </li>

              <li className="flex items-start">
                <span className="mr-3 mt-[7.5px] h-1 w-1 shrink-0 rounded-full bg-[var(--c-honey)]" />
                <span>User retains access to issued learning credentials while suspended</span>
              </li>

              <li className="flex items-start">
                <span className="mr-3 mt-[7.5px] h-1 w-1 shrink-0 rounded-full bg-[var(--c-honey)]" />
                <span>
                  User receives email per template{" "}
                  <span className="ml-1 inline-block rounded-md bg-[#C99B2E2E] px-[6px] py-[1px] text-[length:var(--fs-meta)] [font-family:var(--font-sans)] leading-none text-[#8B6A1F]">
                    account-suspended
                  </span>
                </span>
              </li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3 pt-2">
            <button 
              onClick={handleSuspend}
              disabled={isPending || !confirmAccurate}
              className="w-full flex items-center justify-center gap-2 h-10 rounded-[var(--r-pill)] bg-[var(--c-danger)] text-white font-[var(--fw-semibold)] text-[length:var(--fs-body)] [font-family:var(--font-sans)] hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {isPending && <RefreshCw className="h-4 w-4 animate-spin" />}
              {isPending ? "Updating..." : "Update suspension"}
            </button>

            <button
              onClick={onBack}
              disabled={isPending}
              className="w-full h-10 rounded-[var(--r-pill)] bg-transparent text-[var(--ink)] font-[var(--fw-semibold)] text-[length:var(--fs-body)] [font-family:var(--font-sans)] hover:bg-[var(--paper-2)] transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
          </div>

        </div>
      </div>

    </div>
  );
}
