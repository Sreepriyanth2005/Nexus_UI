import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import {
  ArrowLeft,
  Award,
  Phone,
  User as UserIcon,
  Check,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { useTicketDetail, useReplyTicket, useResolveTicket, useReissueCertificate, useResendOtp } from "../../hooks/support/useSupport";
import { useUserStore } from "../../store/user.store";

interface ThreadMessage {
  id: string;
  authorName: string;
  badge: "Learner" | "Support";
  time: string;
  content: string;
}

export const SupportTicketDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const { user: currentUser } = useUserStore();

  const currentUserName = currentUser
    ? `${currentUser.firstName || ""} ${currentUser.lastName || ""}`.trim() || currentUser.email || "Support Agent"
    : "Support Agent";

  // Ticket detail query (from backend API)
  const { data: ticketData } = useTicketDetail(id || "");
  const replyMutation = useReplyTicket();
  const resolveMutation = useResolveTicket();
  const reissueMutation = useReissueCertificate();
  const resendOtpMutation = useResendOtp();

  // Local state for interactive thread
  const [messages, setMessages] = useState<ThreadMessage[]>([]);
  const [replyText, setReplyText] = useState("");
  const [isResolved, setIsResolved] = useState(false);

  useEffect(() => {
    if (ticketData?.messages && ticketData.messages.length > 0) {
      setMessages(
        ticketData.messages.map((m: any, idx: number) => ({
          id: m.id || `msg-${idx}`,
          authorName: m.senderName || m.senderEmail || "User",
          badge: m.senderRole === "Support" ? ("Support" as const) : ("Learner" as const),
          time: m.createdAt ? new Date(m.createdAt).toLocaleString() : "Recently",
          content: m.message || "",
        }))
      );
    } else if (ticketData?.description) {
      setMessages([
        {
          id: `msg-${ticketData.id}`,
          authorName: ticketData.userName || ticketData.userEmail || "Learner",
          badge: "Learner",
          time: ticketData.openedAt ? new Date(ticketData.openedAt).toLocaleString() : "Recently",
          content: ticketData.description,
        },
      ]);
    } else {
      setMessages([]);
    }
  }, [ticketData]);

  // Ticket Meta
  const ticketNumber = ticketData?.ticketNumber || (id ? `#${id.slice(0, 8)}` : "—");
  const ticketTitle = ticketData?.subject || (ticketData as any)?.issueDescribe || "Support Request";
  const userEmail = ticketData?.userEmail || "—";
  const userName = ticketData?.userName || userEmail;
  const openedTime = ticketData?.openedAt ? new Date(ticketData.openedAt).toLocaleDateString() : "—";
  const assigneeName = ticketData?.assignedToName || currentUserName;

  const handleSendReply = () => {
    if (!replyText.trim()) {
      toast.error("Please enter a reply message.");
      return;
    }

    const newMessage: ThreadMessage = {
      id: `msg-${Date.now()}`,
      authorName: currentUserName,
      badge: "Support",
      time: "Just now",
      content: replyText.trim(),
    };

    setMessages((prev) => [...prev, newMessage]);
    const replyContent = replyText.trim();
    setReplyText("");

    if (id && replyMutation) {
      replyMutation.mutate({
        id,
        data: {
          message: replyContent,
        },
      });
    }

    toast.success("Reply sent to user");
  };

  const handleMarkResolved = () => {
    setIsResolved(true);
    if (id && resolveMutation) {
      resolveMutation.mutate(id);
    }
    toast.success(`Ticket ${ticketNumber} marked as resolved`);
  };

  const handleReissueProof = () => {
    if (id && reissueMutation) {
      reissueMutation.mutate(id);
    }
    toast.success(`Learning credential re-issued and sent to ${userEmail}`);
  };

  const handleResendOtp = () => {
    if (id && resendOtpMutation) {
      resendOtpMutation.mutate(id);
    }
    toast.success(`New OTP sent to ${userEmail}`);
  };

  return (
    <div className="flex flex-col gap-6 w-full mx-auto select-none font-sans pb-12">
      {/* ── 1. Top Back Navigation ───────────────────────────────── */}
      <div>
        <button
          type="button"
          onClick={() => navigate("/support")}
          className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-[0.08em] text-[#6B6B66] hover:text-[#1C1917] transition cursor-pointer uppercase"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>BACK TO TICKETS</span>
        </button>
      </div>

      {/* ── 2. Page Header ────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#8C8C8C] tracking-[0.14em] uppercase">
            <span>SUPPORT CONSOLE · TICKET</span>
          </div>
          <h1 className="smerep-page-title">
            {ticketNumber}: {ticketTitle}
          </h1>
          <p className="text-xs text-[#6B6B66] font-medium leading-relaxed">
            Reported by <span className="text-[#1C1917] font-semibold">{userEmail}</span>
          </p>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-2.5 shrink-0 self-start md:self-auto">
          <button
            type="button"
            onClick={handleReissueProof}
            className="h-9 px-4 rounded-full text-xs font-bold flex items-center gap-1.5 transition cursor-pointer bg-white hover:bg-[#F5F4F1] text-[#1C1917] border border-[#E5E1DB] shadow-2xs active:scale-[0.98]"
          >
            <Award className="w-3.5 h-3.5 text-[#6B6B66]" />
            <span>Re-issue proof</span>
          </button>

          <button
            type="button"
            onClick={handleMarkResolved}
            disabled={isResolved}
            className={`h-9 px-4 rounded-full text-xs font-bold flex items-center gap-1.5 transition cursor-pointer border shadow-xs active:scale-[0.98] ${
              isResolved
                ? "bg-[#E7F0E2] text-[#166534] border-[#BBF7D0]"
                : "bg-[#FCF7AE] hover:bg-[#F0EA8A] text-[#141414] border-[#C99B2E]/40"
            }`}
          >
            {isResolved ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Resolved</span>
              </>
            ) : (
              <span>Mark resolved</span>
            )}
          </button>
        </div>
      </div>

      {/* ── 3. Ticket Meta Bar (5 Columns) ───────────────────────── */}
      <div className="bg-white border border-[#E5E1DB] rounded-2xl p-5 shadow-xs">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {/* Status */}
          <div>
            <span className="text-[10px] font-bold text-[#8C8C8C] uppercase tracking-wider block mb-1">
              STATUS
            </span>
            <div className="flex items-center">
              {isResolved ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border border-[#BBF7D0] bg-[#F0FDF4] text-[#166534]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E]" />
                  Resolved
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border border-[#FECDD3] bg-[#FFF1F2] text-[#9F1239]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#E11D48]" />
                  Open
                </span>
              )}
            </div>
          </div>

          {/* Priority */}
          <div>
            <span className="text-[10px] font-bold text-[#8C8C8C] uppercase tracking-wider block mb-1">
              PRIORITY
            </span>
            <div className="flex items-center">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border border-[#FECDD3] bg-[#FFF1F2] text-[#9F1239]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#E11D48]" />
                High
              </span>
            </div>
          </div>

          {/* User */}
          <div>
            <span className="text-[10px] font-bold text-[#8C8C8C] uppercase tracking-wider block mb-1">
              USER
            </span>
            <a
              href={`mailto:${userEmail}`}
              className="text-xs font-semibold text-[#C66A52] hover:underline truncate block"
              title={userEmail}
            >
              {userEmail}
            </a>
          </div>

          {/* Opened */}
          <div>
            <span className="text-[10px] font-bold text-[#8C8C8C] uppercase tracking-wider block mb-1">
              OPENED
            </span>
            <span className="text-xs font-semibold text-[#1C1917] block">
              {openedTime}
            </span>
          </div>

          {/* Assigned To */}
          <div>
            <span className="text-[10px] font-bold text-[#8C8C8C] uppercase tracking-wider block mb-1">
              ASSIGNED TO
            </span>
            <span className="text-xs font-semibold text-[#1C1917] block">
              {assigneeName}
            </span>
          </div>
        </div>
      </div>

      {/* ── 4. Main Two-Column Layout (Thread + Quick Actions Rail) ─ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Thread & Reply Box (~75%) */}
        <div className="lg:col-span-9 bg-white border border-[#E5E1DB] rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col gap-6">
          <h2 className="text-sm font-bold text-[#1C1917]">Thread</h2>

          {/* Messages List */}
          <div className="flex flex-col gap-5">
            {messages.length === 0 ? (
              <div className="py-10 text-center text-xs text-[#8C8C8C] font-medium">
                No conversation messages logged on this ticket yet.
              </div>
            ) : (
              messages.map((msg, index) => {
              const isLearner = msg.badge === "Learner";
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col gap-2 pb-5 ${
                    index < messages.length - 1 ? "border-b border-[#E5E1DB]" : ""
                  }`}
                >
                  {/* Author Header */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#1C1917]">
                        {msg.authorName}
                      </span>
                      {isLearner ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border border-[#E5E1DB] bg-[#F5F4F1] text-[#57534E]">
                          Learner
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border border-[#FDE68A] bg-[#FEFCE8] text-[#854D0E]">
                          Support
                        </span>
                      )}
                    </div>

                    <span className="text-xs text-[#8C8C8C] font-normal">
                      {msg.time}
                    </span>
                  </div>

                  {/* Message Content */}
                  <p className="text-xs text-[#57534E] leading-relaxed font-normal">
                    {msg.content}
                  </p>
                </div>
              );
            })
          )}
          </div>

          {/* Reply Area */}
          <div className="flex flex-col gap-3 pt-2">
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Write a reply..."
              rows={4}
              className="w-full p-4 rounded-xl border border-[#E5E1DB] text-xs font-normal text-[#1C1917] placeholder:text-[#8C8C8C] bg-[#FAFAFA]/50 outline-none focus:border-[#D4A72C] focus:bg-white resize-y shadow-2xs transition"
            />

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setReplyText("")}
                disabled={!replyText.trim()}
                className="h-8 px-4 rounded-lg text-xs font-semibold text-[#6B6B66] hover:bg-[#F5F4F1] transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Clear
              </button>

              <button
                type="button"
                onClick={handleSendReply}
                disabled={!replyText.trim()}
                className="h-8 px-4 rounded-lg text-xs font-bold bg-[#FCF7AE] hover:bg-[#F0EA8A] text-[#141414] border border-[#C99B2E]/40 shadow-xs transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
              >
                Send reply
              </button>
            </div>
          </div>
        </div>

        {/* Right Rail: Quick Actions (~25%) */}
        <div className="lg:col-span-3 bg-white border border-[#E5E1DB] rounded-2xl p-5 shadow-xs flex flex-col gap-5">
          <h2 className="text-sm font-bold text-[#1C1917]">Quick actions</h2>

          {/* User Section */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#FEF3C7] border border-[#FDE68A] flex items-center justify-center text-sm font-bold text-[#854D0E] shrink-0">
              LO
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-bold text-[#1C1917] truncate">{userName}</h3>
              <p className="text-[11px] text-[#8C8C8C] truncate">{userEmail}</p>
            </div>
          </div>

          {/* User Tags/Chips */}
          <div className="flex items-center gap-2 -mt-1">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold border border-[#E5E1DC] bg-[#F5F4F1] text-[#57534E]">
              Learner
            </span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold border border-[#E5E1DC] bg-[#F5F4F1] text-[#57534E]">
              Individual
            </span>
          </div>

          {/* Reported Context */}
          <div className="flex items-center gap-2.5 pt-1">
            <div className="w-9 h-9 rounded-lg bg-[#E7F0E2] flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4 text-[#7A9D6A]" />
            </div>
            <div>
              <span className="text-[9px] font-bold text-[#8C8C8C] uppercase tracking-wider block">
                REPORTED CONTEXT
              </span>
              <span className="text-xs font-bold text-[#1C1917]">
                Profile setup
              </span>
            </div>
          </div>

          <div className="border-t border-[#E5E1DB] pt-1 flex flex-col gap-1">
            {/* Action 1: View user profile */}
            <button
              type="button"
              onClick={() => navigate(`/support/users?search=${encodeURIComponent(userEmail)}`)}
              className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg text-xs font-medium text-[#1C1917] hover:bg-[#F5F4F1] transition text-left cursor-pointer"
            >
              <UserIcon className="w-3.5 h-3.5 text-[#6B6B66] shrink-0" />
              <span>View user profile</span>
            </button>

            {/* Action 2: Re-issue learning credential */}
            <button
              type="button"
              onClick={handleReissueProof}
              className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg text-xs font-medium text-[#1C1917] hover:bg-[#F5F4F1] transition text-left cursor-pointer"
            >
              <Award className="w-3.5 h-3.5 text-[#6B6B66] shrink-0" />
              <span>Re-issue learning credential</span>
            </button>

            {/* Action 3: Resend OTP */}
            <button
              type="button"
              onClick={handleResendOtp}
              className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg text-xs font-medium text-[#1C1917] hover:bg-[#F5F4F1] transition text-left cursor-pointer"
            >
              <Phone className="w-3.5 h-3.5 text-[#6B6B66] shrink-0" />
              <span>Resend OTP</span>
            </button>

            {/* Action 4: Mark as resolved */}
            <button
              type="button"
              onClick={handleMarkResolved}
              disabled={isResolved}
              className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg text-xs font-medium text-[#1C1917] hover:bg-[#F5F4F1] transition text-left cursor-pointer disabled:opacity-40"
            >
              <Check className="w-3.5 h-3.5 text-[#6B6B66] shrink-0" />
              <span>Mark as resolved</span>
            </button>
          </div>

          {/* Audit Notice Pill */}
          <div className="mt-1">
            <span className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-medium border border-[#FDE68A] bg-[#FEFCE8] text-[#854D0E] text-center">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D4A72C]" />
              All actions written to audit log
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupportTicketDetail;
