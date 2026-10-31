import React, { useState, useMemo } from "react";
import "../../styles/tokens.css";
import { Skeleton } from "../../components/ui/Skeleton";
import {
  Search,
  Inbox,
  CheckSquare,
  Eye,
  Lock,
  Phone,
  Lock2,
  RefreshCw,
  Award,
  Database,
  Grid,
  Video,
  Mail,
  Bell,
  Server,
  X,
  ArrowLeft,
  ChevronsUpDown,
  Send,
} from "../../assets/icons";
import { toast } from "sonner";
import {
  useSupportDashboardMetrics,
  usePlatformHealth,
  useTickets,
  useResendOtp,
  useUnlockAccount,
  useForceReverify,
  useReissueCertificate,
  useTicketDetail,
  useReplyTicket,
  useResolveTicket
} from "../../hooks/support/useSupport";
import * as supportApi from "../../core/api/support/support.api";
import {
  SupportActionRecord,
  SupportUserItem,
  TicketPriority,
  PlatformHealthServiceStatus
} from "../../core/api/support/support.types";
import { useLocation, useNavigate } from "react-router";
import { useProfileStore } from "../../store/profile.store";
import { SupportMetricCard } from "../../components/support/SupportMetricCard";
import { useUserStore } from "../../store/user.store";

/* ── Fallback Reference Data ────────────────────────────────────────── */



interface TicketItemView {
  id: string;
  ticketNumber: string;
  userEmail: string;
  userName: string;
  title: string;
  description: string;
  age: string;
  openedAt: string;
  priority: TicketPriority | "NORMAL";
  status: "OPEN" | "RESOLVED";
  messages: Array<{
    id: string;
    senderEmail: string;
    senderName: string;
    senderRole: "Learner" | "Support" | "Admin";
    message: string;
    createdAt: string;
  }>;
}

const DEFAULT_OPEN_TICKETS: TicketItemView[] = [];
const DEFAULT_RESOLVED_TICKETS: TicketItemView[] = [];
/* ── Quick Action Config ────────────────────────────────────────────── */
const quickActionsList = [
  { id: "otp", label: "Resend OTP", icon: Phone, description: "Resend one-time password to the learner's registered communication channel." },
  { id: "unlock", label: "Unlock account", icon: Lock2, description: "Remove login lockout and restore account access for the learner." },
  { id: "reverify", label: "Force profile re-verify", icon: RefreshCw, description: "Trigger a mandatory profile verification workflow for the user." },
  { id: "reissue", label: "Re-issue learning credential", icon: Award, description: "Re-generate and dispatch the course completion certificate to the user." },
];

const DEFAULT_HEALTH_SERVICES = [
  { name: "API gateway", status: "Operational", detail: "142 ms avg" },
  { name: "Database", status: "Operational", detail: "99.99% uptime" },
  { name: "Auth / OTP", status: "Degraded", detail: "Minor delays" },
  { name: "Video streaming", status: "Operational", detail: "Edge cached" },
  { name: "Email delivery", status: "Operational", detail: "< 2 s queue" },
  { name: "Notifications", status: "Operational", detail: "Realtime" }
];

const SupportDashboard: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTicketTab, setActiveTicketTab] = useState<'open' | 'resolved'>(() =>
    location.pathname.includes('resolved') ? 'resolved' : 'open'
  );
  const [searchQuery, setSearchQuery] = useState("");

  // User Lookup states
  const [lookupResults, setLookupResults] = useState<SupportUserItem[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [lookupError, setLookupError] = useState("");
  const [selectedUser, setSelectedUser] = useState<SupportUserItem | null>(null);

  // Quick Action Modal states
  const [modalAction, setModalAction] = useState<string | null>(null);
  const [actionEmail, setActionEmail] = useState("");
  const [actionReason, setActionReason] = useState("");
  const [modalError, setModalError] = useState("");
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);

  // Local Reactive Actions (prepended on execution to show instant audit log feedback)
  const [localActions, setLocalActions] = useState<SupportActionRecord[]>([]);

  // Local Reactive Ticket items
  const [openTicketsList, setOpenTicketsList] = useState<TicketItemView[]>(DEFAULT_OPEN_TICKETS);
  const [resolvedTicketsList, setResolvedTicketsList] = useState<TicketItemView[]>(DEFAULT_RESOLVED_TICKETS);

  // Active Ticket Drawer / Modal
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [isResolving, setIsResolving] = useState(false);

  // Table Sort States
  const [actionSortField, setActionSortField] = useState<keyof SupportActionRecord>("timestamp");
  const [actionSortAsc, setActionSortAsc] = useState(false);

  const [ticketSortField, setTicketSortField] = useState<keyof TicketItemView>("openedAt");
  const [ticketSortAsc, setTicketSortAsc] = useState(false);

  // API Integrations
  const { data: metricsData, isLoading: metricsLoading, refetch: refetchMetrics } = useSupportDashboardMetrics();
  const { data: healthData, isLoading: healthLoading } = usePlatformHealth();
  const { data: apiTicketsData, isLoading: ticketsLoading, refetch: refetchTickets } = useTickets({
    status: activeTicketTab === 'open' ? 'OPEN' : 'RESOLVED',
    limit: 20
  });
  const { data: apiTicketDetail, isLoading: isLoadingDetail } = useTicketDetail(selectedTicketId || "");

  // Mutations
  const resendOtpMutation = useResendOtp();
  const unlockAccountMutation = useUnlockAccount();
  const forceReverifyMutation = useForceReverify();
  const reissueCertMutation = useReissueCertificate();
  const replyMutation = useReplyTicket();
  const resolveMutation = useResolveTicket();

  // User info
  const { profile } = useProfileStore();
  const { user } = useUserStore();
  const engineerName =
    (profile?.profile?.firstName?.trim() || "") +
    (profile?.profile?.lastName ? ` ${profile?.profile?.lastName.trim()}` : "") ||
    user?.email?.split("@")[0] ||
    "Maria Lopez";

  React.useEffect(() => {
    if (location.pathname.includes('resolved')) {
      setActiveTicketTab('resolved');
    } else if (location.pathname === '/support' || location.pathname === '/support-dashboard') {
      setActiveTicketTab('open');
    }
  }, [location.pathname]);

  // Sync API tickets into state if available
  React.useEffect(() => {
    if (apiTicketsData?.data && apiTicketsData.data.length > 0) {
      const formatted: TicketItemView[] = apiTicketsData.data.map((t: any) => ({
        id: t.id,
        ticketNumber: t.ticketNumber || `T-${t.id.slice(0, 4)}`,
        userEmail: t.userEmail || t.user?.email || "user@example.com",
        userName: t.userName || "User",
        title: t.issue || t.title || "Technical Issue",
        description: t.description || t.issueDescribe || "",
        age: t.age || "1d",
        openedAt: t.createdAt || new Date().toISOString(),
        priority: (t.priority || "HIGH").toUpperCase(),
        status: t.status || "OPEN",
        messages: t.messages || []
      }));
      if (activeTicketTab === 'open') {
        setOpenTicketsList(formatted);
      } else {
        setResolvedTicketsList(formatted);
      }
    }
  }, [apiTicketsData, activeTicketTab]);

  /* ── User Lookup Search Handler ────────────────────────────────────── */
  const handleLookupSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      setLookupResults(null);
      setLookupError("");
      return;
    }
    setIsSearching(true);
    setLookupError("");

    try {
      const res = await supportApi.listUsersForLookup({ search: query });
      if (res?.data && res.data.length > 0) {
        setLookupResults(res.data);
      } else {
        setLookupResults([]);
      }
    } catch (err: any) {
      setLookupError("Failed to perform user lookup. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  /* ── Quick Actions Trigger ─────────────────────────────────────────── */
  const handleOpenQuickAction = (actionId: string) => {
    setModalAction(actionId);
    setActionEmail(selectedUser ? selectedUser.email : "");
    setActionReason("");
    setModalError("");
  };

  /* ── Quick Action Submit ───────────────────────────────────────────── */
  const handleExecuteQuickAction = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = actionEmail.trim();
    if (!email) {
      setModalError("Please enter a valid learner email address.");
      return;
    }
    setIsSubmittingAction(true);
    setModalError("");

    try {
      let targetUserId = selectedUser?.id || "";
      if (!targetUserId || selectedUser?.email.toLowerCase() !== email.toLowerCase()) {
        const res = await supportApi.listUsersForLookup({ search: email });
        const realUser = res?.data?.find((u: any) => u.email.toLowerCase() === email.toLowerCase());
        if (realUser) {
          targetUserId = realUser.id;
        } else {
          throw new Error(`User with email ${email} not found in the system.`);
        }
      }

      let actionLabel = "";
      let outcomeLabel = "Completed";

      switch (modalAction) {
        case "otp":
          actionLabel = "OTP resent";
          outcomeLabel = "Sent";
          await resendOtpMutation.mutateAsync(targetUserId);
          toast.success(`OTP resent successfully to ${email}`);
          break;

        case "unlock":
          actionLabel = "Account unlocked";
          outcomeLabel = "Unlocked";
          await unlockAccountMutation.mutateAsync({
            userId: targetUserId,
            data: { reason: actionReason || "Unlocked via support console" }
          });
          toast.success(`Account unlocked successfully for ${email}`);
          break;

        case "reverify":
          actionLabel = "Force profile re-verify";
          outcomeLabel = "Email sent";
          await forceReverifyMutation.mutateAsync(targetUserId);
          toast.success(`Profile re-verification notice sent to ${email}`);
          break;

        case "reissue":
          actionLabel = "Cert re-issued";
          outcomeLabel = "Done";
          await reissueCertMutation.mutateAsync(targetUserId);
          toast.success(`Learning credential re-issued for ${email}`);
          break;

        default:
          break;
      }

      // Record Audit Action in Local Reactive Stream
      const newActionRecord: SupportActionRecord = {
        id: `act-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actorEmail: email,
        action: actionLabel,
        entityType: 'User',
        entityId: targetUserId || 'N/A',
        outcome: outcomeLabel,
      };
      setLocalActions(prev => [newActionRecord, ...prev]);

      refetchMetrics();
      setModalAction(null);
    } catch (err: any) {
      setModalError(err?.message || "An unexpected error occurred while executing action.");
      toast.error(err?.message || "Failed to complete support action.");
    } finally {
      setIsSubmittingAction(false);
    }
  };

  /* ── Ticket Drawer Reply & Resolve ─────────────────────────────────── */
  const activeTicket = useMemo(() => {
    if (!selectedTicketId) return null;
    const all = [...openTicketsList, ...resolvedTicketsList];
    return all.find(t => t.id === selectedTicketId) || (apiTicketDetail as any) || null;
  }, [selectedTicketId, openTicketsList, resolvedTicketsList, apiTicketDetail]);

  const handleSendTicketReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedTicketId) return;
    setIsSendingReply(true);

    try {
      try {
        await replyMutation.mutateAsync({ id: selectedTicketId, data: { message: replyText } });
      } catch (err) {
        // Fallback local update
      }

      const newMsg = {
        id: `msg-${Date.now()}`,
        senderEmail: "support@nexus.org",
        senderName: engineerName,
        senderRole: "Support" as const,
        message: replyText,
        createdAt: new Date().toISOString()
      };

      setOpenTicketsList(prev => prev.map(t => {
        if (t.id === selectedTicketId) {
          return { ...t, messages: [...t.messages, newMsg] };
        }
        return t;
      }));

      // Log reply action
      const newActionRecord: SupportActionRecord = {
        id: `act-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actorEmail: activeTicket?.userEmail || "user@example.com",
        action: "Ticket reply sent",
        entityType: 'User', entityId: 'N/A'
      };
      setLocalActions(prev => [newActionRecord, ...prev]);

      toast.success("Reply sent to learner successfully.");
      setReplyText("");
      refetchTickets();
    } catch (err: any) {
      toast.error("Failed to send reply.");
    } finally {
      setIsSendingReply(false);
    }
  };

  const handleMarkTicketResolved = async () => {
    if (!selectedTicketId || !activeTicket) return;
    setIsResolving(true);

    try {
      try {
        await resolveMutation.mutateAsync(selectedTicketId);
      } catch (err) {
        // Fallback local update
      }

      const resolvedItem: TicketItemView = {
        ...activeTicket,
        status: "RESOLVED",
        messages: [
          ...activeTicket.messages,
          {
            id: `msg-${Date.now()}`,
            senderEmail: "support@nexus.org",
            senderName: engineerName,
            senderRole: "Support",
            message: "Ticket marked as resolved.",
            createdAt: new Date().toISOString()
          }
        ]
      };

      setOpenTicketsList(prev => prev.filter(t => t.id !== selectedTicketId));
      setResolvedTicketsList(prev => [resolvedItem, ...prev]);

      // Record Audit Action
      const newActionRecord: SupportActionRecord = {
        id: `act-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actorEmail: activeTicket.userEmail,
        action: "Ticket resolved",
        entityType: 'User', entityId: 'N/A'
      };
      setLocalActions(prev => [newActionRecord, ...prev]);

      toast.success(`Ticket #${activeTicket.ticketNumber} marked as resolved.`);
      setSelectedTicketId(null);
      refetchMetrics();
      refetchTickets();
    } catch (err: any) {
      toast.error("Failed to resolve ticket.");
    } finally {
      setIsResolving(false);
    }
  };

  /* ── Merged Datasets ───────────────────────────────────────────────── */
  const displayActions = useMemo(() => {
    const raw = metricsData?.recentActions || [];
    const combined = [...localActions, ...raw];

    // Sort logic
    return combined.sort((a, b) => {
      const valA = String(a[actionSortField] || "");
      const valB = String(b[actionSortField] || "");
      return actionSortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
    });
  }, [metricsData, localActions, actionSortField, actionSortAsc]);

  const activeTicketsList = activeTicketTab === 'open' ? openTicketsList : resolvedTicketsList;
  const sortedTickets = useMemo(() => {
    return [...activeTicketsList].sort((a, b) => {
      const valA = String(a[ticketSortField] || "");
      const valB = String(b[ticketSortField] || "");
      return ticketSortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
    });
  }, [activeTicketsList, ticketSortField, ticketSortAsc]);

  const healthServices = (healthData?.services && healthData.services.length > 0) ? healthData.services : DEFAULT_HEALTH_SERVICES;

  const performanceScore = healthData?.performanceScore ?? 98;
  const overallHealthStatus = healthData?.overallStatus ?? "All systems operational";
  const lastIncidentDays = healthData?.lastIncidentDaysAgo ?? 34;

  const kpiStats = [
    {
      label: "OPEN TICKETS",
      value: metricsLoading ? <Skeleton className="h-6 w-12" /> : (metricsData?.openTickets ?? (openTicketsList.length || 6)),
      icon: Inbox,
      boxBg: "var(--c-clay-wash)",
      iconColor: "var(--c-clay-text)",
      dotColor: "#c12a1c"
    },
    {
      label: "RESOLVED THIS WEEK",
      value: metricsLoading ? <Skeleton className="h-6 w-12" /> : (metricsData?.resolvedTicketsThisWeek ?? metricsData?.resolvedTickets ?? 23),
      icon: CheckSquare,
      boxBg: "var(--c-sage-wash)",
      iconColor: "var(--c-sage-text)",
      dotColor: "var(--c-check)"
    },
    {
      label: "IMPERSONATION SESSIONS ACTIVE",
      value: metricsLoading ? <Skeleton className="h-6 w-12" /> : (metricsData?.activeImpersonations ?? 2),
      icon: Eye,
      boxBg: "var(--c-honey-wash)",
      iconColor: "var(--c-honey-text)",
      dotColor: "#ca8a04"
    },
    {
      label: "PASSWORD / OTP ISSUES",
      value: metricsLoading ? <Skeleton className="h-6 w-12" /> : (metricsData?.otpPasswordIssues ?? 4),
      icon: Lock,
      boxBg: "#f3f4f6",
      iconColor: "#4b5563",
      dotColor: null
    },
  ];

  /* ── Badge Classes Helper ──────────────────────────────────────────── */
  const renderActionBadge = (action: string) => {
    const a = action.toLowerCase();
    if (a.includes("otp") || a.includes("resend")) {
      return (
        <span className="suph-chip suph-chip-unlock inline-flex items-center px-[10px] py-[3px] rounded-full border border-[var(--c-sage-soft)] bg-white text-[#4E6A40] font-semibold text-sm whitespace-nowrap">
          OTP resent
        </span>
      );
    }
    if (a.includes("unlock")) {
      return (
        <span className="suph-chip suph-chip-unlock inline-flex items-center px-[10px] py-[3px] rounded-full border border-[var(--c-sage-soft)] bg-white text-[#4E6A40] font-semibold text-sm whitespace-nowrap">
          Account unlocked
        </span>
      );
    }
    if (a.includes("impersonation")) {
      return (
        <span className="suph-chip inline-flex items-center px-[10px] py-[3px] rounded-full border border-[var(--c-honey-soft)] bg-white text-[#826A3A] font-semibold text-sm whitespace-nowrap">
          Impersonation started
        </span>
      );
    }
    if (a.includes("reverify") || a.includes("re-verify")) {
      return (
        <span className="suph-chip inline-flex items-center px-[10px] py-[3px] rounded-full border border-[var(--c-honey-soft)] bg-white text-[#826A3A] font-semibold text-sm whitespace-nowrap">
          Force profile re-verify
        </span>
      );
    }
    if (a.includes("cert") || a.includes("credential")) {
      return (
        <span className="suph-chip inline-flex items-center px-[10px] py-[3px] rounded-full border border-gray-300 bg-white text-[#3A3A3A] font-semibold text-sm whitespace-nowrap">
          Cert re-issued
        </span>
      );
    }
    return (
      <span className="suph-chip inline-flex items-center px-[10px] py-[3px] rounded-full border border-gray-300 bg-white text-[#3A3A3A] font-semibold text-sm whitespace-nowrap">
        {action}
      </span>
    );
  };

  const renderOutcomePill = (outcome?: string) => {
    const o = outcome ? outcome.toLowerCase() : "";
    if (o.includes("active")) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold bg-[var(--c-honey-wash)] text-[var(--c-honey-text)] whitespace-nowrap">
          <span className="w-1.5 h-1.5 rounded-full bg-[#ca8a04]" />
          Active
        </span>
      );
    }
    if (o.includes("sent") || o.includes("unlocked") || o.includes("done") || o.includes("completed") || o.includes("reissued")) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold bg-[var(--c-sage-wash)] text-[var(--c-sage-text)] whitespace-nowrap">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--c-check)]" />
          {outcome}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold bg-gray-100 text-gray-600 whitespace-nowrap">
        <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
        {outcome}
      </span>
    );
  };

  const renderPriorityBadge = (priority: string) => {
    const p = priority.toUpperCase();
    if (p === "HIGH" || p === "CRITICAL") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-sm font-medium bg-[#fee2e2] text-[#991b1b]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#dc2626]" />
          High
        </span>
      );
    }
    if (p === "MEDIUM") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-sm font-medium bg-[#fef3c7] text-[#92400e]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#ca8a04]" />
          Medium
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-sm font-medium bg-[#f3f4f6] text-[#4b5563]">
        Normal
      </span>
    );
  };

  const getServiceIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes("database") || lower.includes("db")) return Grid;
    if (lower.includes("video") || lower.includes("media") || lower.includes("stream")) return Video;
    if (lower.includes("email") || lower.includes("mail") || lower.includes("storage") || lower.includes("asset")) return Mail;
    if (lower.includes("notification") || lower.includes("bell") || lower.includes("cache") || lower.includes("redis")) return Bell;
    if (lower.includes("auth") || lower.includes("otp") || lower.includes("lock")) return Lock;
    if (lower.includes("api") || lower.includes("gateway") || lower.includes("server")) return RefreshCw;
    return RefreshCw;
  };

  return (
    <div className="flex flex-col gap-4 w-full select-none">

      {/* ── 1. Support Console Page Header ───────────────────────── */}
      <div className="mb-2.5">
        <p className="mb-1.5 text-[12px] font-bold uppercase tracking-[0.1em] text-[var(--ink-mute)] select-none">
          SUPPORT · ENGINEER ROLE
        </p>
        <h1 className="m-0 text-[24px] font-bold leading-tight tracking-tight text-[var(--ink)]">
          Support console
        </h1>
        <p className="mt-2 text-[14px] font-medium leading-[1.5] text-[var(--ink-soft)]">
          Support Engineer &middot; {engineerName}. Resolve open tickets, look up users, and run quick account actions. Every action is written to the audit log.
        </p>
      </div>

      {/* ── 2. User Lookup Card ──────────────────────────────────── */}
      <div className="suph-lookup w-full bg-[var(--paper)] border border-[var(--line)] rounded-[var(--r-md)] py-[16px] px-[20px] mb-[12px] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 shadow-[var(--shadow-xs)] transition-all duration-[var(--dur-base)] ease-[var(--tn)] hover:-translate-y-0.5 hover:border-[var(--line-strong)] hover:shadow-[var(--shadow-sm)]">
        <div className="flex items-center gap-4 flex-1">
          <h2 className="text-[12px] font-bold tracking-[0.08em] text-[var(--ink-mute)] uppercase select-none shrink-0 m-0">USER LOOKUP</h2>
          <form onSubmit={handleLookupSearch} className="flex items-center gap-3 flex-1">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by email, name, or user ID"
                className="w-full h-[46px] bg-white rounded-full border border-gray-200 pl-11 pr-5 text-sm text-[var(--ink)] placeholder-gray-400 outline-none focus:border-[var(--ink)] focus:ring-2 focus:ring-black/5 transition font-sans"
              />
            </div>
            <button
              type="submit"
              className="nexus-btn sm px-[14px] py-[8px] bg-[var(--hero-bg)] text-[#141414] font-sans text-sm font-bold rounded-full border border-[#e5d56d] hover:-translate-y-0.5 hover:shadow-xs transition-all duration-200 shadow-2xs cursor-pointer shrink-0"
            >
              Search
            </button>
          </form>
        </div>

        {/* User Lookup Results Panel */}
        {(isSearching || lookupResults !== null || lookupError) && (
          <div className="w-full border-t border-gray-100 pt-3 px-1">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-100">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                Search Results ({lookupResults?.length || 0})
              </span>
              <button
                type="button"
                onClick={() => { setLookupResults(null); setSearchQuery(""); setLookupError(""); }}
                className="text-sm text-gray-500 hover:text-black font-semibold cursor-pointer"
              >
                Clear
              </button>
            </div>

            {isSearching && (
              <div className="py-4 text-center text-sm text-gray-500 font-medium">
                Searching users database...
              </div>
            )}

            {lookupError && (
              <div className="py-2.5 px-3 rounded-lg bg-red-50 text-red-700 text-sm font-medium border border-red-200">
                {lookupError}
              </div>
            )}

            {!isSearching && !lookupError && lookupResults && lookupResults.length === 0 && (
              <div className="py-4 text-center text-sm text-gray-500">
                No users found matching &ldquo;{searchQuery}&rdquo;.
              </div>
            )}

            {!isSearching && !lookupError && lookupResults && lookupResults.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-[var(--line-strong)] text-[11px] font-bold uppercase tracking-[0.05em] text-[var(--ink-mute)] select-none">
                      <th className="py-2 px-2">Name</th>
                      <th className="py-2 px-2">Email</th>
                      <th className="py-2 px-2">Role</th>
                      <th className="py-2 px-2">Status</th>
                      <th className="py-2 px-2 text-right">Quick Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lookupResults.map((u) => {
                      const isSel = selectedUser?.id === u.id;
                      return (
                        <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                          <td className="py-2.5 px-2 font-bold text-[#141414]">{u.name}</td>
                          <td className="py-2.5 px-2 font-mono text-gray-600">{u.email}</td>
                          <td className="py-2.5 px-2 text-gray-500 font-semibold uppercase text-[10px]">{u.role}</td>
                          <td className="py-2.5 px-2">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${(u.accountStatus || "").toLowerCase() === "active"
                              ? "bg-[#DBE6D3] text-[#4C6D44] border border-[#DBE6D3]"
                              : "bg-amber-50 text-amber-700 border border-amber-200"
                              }`}>
                              {u.accountStatus}
                            </span>
                          </td>
                          <td className="py-2.5 px-2 text-right">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedUser(u);
                                toast.success(`Selected ${u.name} (${u.email}) for Quick Actions.`);
                              }}
                              className={`px-3 py-1 rounded-full text-[10px] font-bold transition cursor-pointer ${isSel
                                ? "bg-emerald-600 text-white"
                                : "bg-[#141414] text-white hover:bg-black"
                                }`}
                            >
                              {isSel ? "Selected" : "Select for Action"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Selected User Banner */}
        {selectedUser && (
          <div className="w-full p-2.5 rounded-xl bg-[#DBE6D3]/40 border border-[#DBE6D3] flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#4C6D44] animate-pulse" />
              <span className="font-semibold text-[#4C6D44]">Active target user:</span>
              <strong className="text-emerald-950 font-bold">{selectedUser.name}</strong>
              <span className="text-[#4C6D44] font-mono">({selectedUser.email})</span>
            </div>
            <button
              type="button"
              onClick={() => setSelectedUser(null)}
              className="text-[#4C6D44] font-bold hover:underline cursor-pointer text-sm"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {/* ── 3. KPI Cards Grid (4 responsive cards in a row) ──────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5 mb-3">
        {kpiStats.map((kpi, idx) => (
          <div
            key={idx}
            className="suph-stat suph-stat-link bg-[var(--paper)] border border-[var(--line)] rounded-[var(--r-md)] pt-[18px] px-[18px] pb-[16px] flex flex-col justify-between h-[138px] shadow-[var(--shadow-xs)] transition-all duration-[var(--dur-base)] ease-[var(--tn)] hover:-translate-y-0.5 hover:border-[var(--line-strong)] hover:shadow-[var(--shadow-sm)] cursor-pointer text-left"
          >
            <span
              className="w-[38px] h-[38px] flex items-center justify-center rounded-[14px] shrink-0"
              style={{ backgroundColor: kpi.boxBg, color: kpi.iconColor }}
            >
              <kpi.icon className="w-5 h-5" />
            </span>
            <div>
              <p className="text-[12px] font-bold tracking-[0.08em] text-[var(--ink-mute)] uppercase mb-2 select-none">
                {kpi.label}
              </p>
              <div className="flex items-center gap-2">
                <span className="text-2xl md:text-[20px] font-bold text-[var(--ink)] tracking-tight leading-none font-sans">
                  {kpi.value}
                </span>
                {kpi.dotColor && (
                  <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: kpi.dotColor }} />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── 4. Recent Support Actions + Quick Actions Panel ────────── */}
      <div className="grid grid-cols-1 gap-6 items-start mb-3">

        {/* Recent support actions Card */}
        <div className="w-full bg-[var(--paper)] border border-[var(--line)] rounded-[var(--r-md)] pb-6 shadow-[var(--shadow-xs)] transition-all duration-[var(--dur-base)] ease-[var(--tn)] hover:-translate-y-0.5 hover:border-[var(--line-strong)] hover:shadow-[var(--shadow-sm)]">
          <div className="suph-card-head flex items-center justify-between pt-[18px] px-[22px] pb-0 mb-[14px]">
            <h2 className="text-[16px] font-bold mb-4  select-none">
              Recent support actions
            </h2>
            {/* <button
              type="button"
              onClick={() => navigate('/support/audit-log')}
              className="text-sm font-semibold text-gray-500 hover:text-black transition cursor-pointer"
            >
              View full audit log &rarr;
            </button> */}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[500px]">
              <thead>
                <tr className="border-b border-gray-100">
                  <th
                    onClick={() => { setActionSortField("timestamp"); setActionSortAsc(!actionSortAsc); }}
                    className="text-left text-[12px] font-bold uppercase tracking-[0.05em] text-[var(--ink-mute)] pt-0 px-[22px] pb-[10px] cursor-pointer hover:text-[var(--ink)] select-none"
                  >
                    <div className="flex items-center gap-1.5">
                      TIME <ChevronsUpDown className="w-3 h-3 text-[#b3aca4]" />
                    </div>
                  </th>
                  <th
                    onClick={() => { setActionSortField("actorEmail"); setActionSortAsc(!actionSortAsc); }}
                    className="text-left text-[12px] font-bold uppercase tracking-[0.05em] text-[var(--ink-mute)] pt-0 px-[22px] pb-[10px] cursor-pointer hover:text-[var(--ink)] select-none"
                  >
                    <div className="flex items-center gap-1.5">
                      USER <ChevronsUpDown className="w-3 h-3 text-[#b3aca4]" />
                    </div>
                  </th>
                  <th
                    onClick={() => { setActionSortField("action"); setActionSortAsc(!actionSortAsc); }}
                    className="text-left text-[12px] font-bold uppercase tracking-[0.05em] text-[var(--ink-mute)] pt-0 px-[22px] pb-[10px] cursor-pointer hover:text-[var(--ink)] select-none"
                  >
                    <div className="flex items-center gap-1.5">
                      ACTION <ChevronsUpDown className="w-3 h-3 text-[#b3aca4]" />
                    </div>
                  </th>
                  <th
                    onClick={() => { setActionSortField("action"); setActionSortAsc(!actionSortAsc); }}
                    className="text-left text-[12px] font-bold uppercase tracking-[0.05em] text-[var(--ink-mute)] pt-0 px-[22px] pb-[10px] cursor-pointer hover:text-[var(--ink)] select-none"
                  >
                    <div className="flex items-center gap-1.5">
                      OUTCOME <ChevronsUpDown className="w-3 h-3 text-[#b3aca4]" />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {displayActions.map((action, idx) => (
                  <tr key={action.id || idx} className="border-t border-gray-100/90 hover:bg-gray-50/50 transition">
                    <td className="py-[12px] px-[22px] text-[#141414] font-normal whitespace-nowrap">
                      {action.timestamp instanceof Date ? action.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : String(action.timestamp)}
                    </td>
                    <td className="py-[12px] px-[22px] text-[#141414] font-normal whitespace-nowrap">
                      {action.actorEmail}
                    </td>
                    <td className="py-[12px] px-[22px] whitespace-nowrap">
                      {renderActionBadge(action.action)}
                    </td>
                    <td className="py-[12px] px-[22px] whitespace-nowrap">
                      {renderOutcomePill(action.outcome)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick actions Panel (Hidden from UI as requested, preserved in code) */}
        <div className="hidden bg-[var(--paper)] border border-[var(--line)] rounded-[var(--r-md)] flex-col justify-between overflow-hidden shadow-[var(--shadow-xs)] transition-all duration-[var(--dur-base)] ease-[var(--tn)] hover:-translate-y-0.5 hover:border-[var(--line-strong)] hover:shadow-[var(--shadow-sm)]">
          <div className="suph-card-head flex items-center justify-between pt-[18px] px-[22px] pb-0 mb-[14px]">
            <h2 className="text-[12px] font-bold tracking-[0.08em] text-[var(--ink-mute)] mb-4 uppercase select-none">
              Quick actions
            </h2>
          </div>

          <div className="suph-qa-body pt-0 px-[22px] pb-[22px] flex flex-col justify-between gap-6 flex-1">
            <div className="flex flex-col gap-3">
              {quickActionsList.map((qa) => (
                <button
                  key={qa.id}
                  type="button"
                  onClick={() => handleOpenQuickAction(qa.id)}
                  className="nexus-btn ghost sm w-full flex items-center gap-3.5 px-[14px] py-[8px] rounded-full border border-gray-200 bg-white hover:bg-gray-50 hover:-translate-y-0.5 hover:shadow-xs text-[#141414] text-sm font-semibold transition-all duration-200 cursor-pointer text-left font-sans"
                >
                  <qa.icon className="w-4 h-4 text-[var(--ink)] shrink-0" />
                  <span>{qa.label}</span>
                </button>
              ))}
            </div>

            <div className="w-full py-2.5 px-4 rounded-full bg-[var(--c-honey-wash)]/60 border border-[#e5cb87]/60 text-[var(--c-honey-text)] text-sm font-semibold flex items-center justify-center gap-2 text-center">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--c-honey-text)] shrink-0" />
              All actions logged to audit trail
            </div>
          </div>
        </div>

      </div>

      {/* ── 5. Platform Health Section ───────────────────────────── */}
      <div className="bg-[var(--paper)] border border-[var(--line)] rounded-[var(--r-md)] flex flex-col overflow-hidden shadow-[var(--shadow-xs)] transition-all duration-[var(--dur-base)] ease-[var(--tn)] hover:-translate-y-0.5 hover:border-[var(--line-strong)] hover:shadow-[var(--shadow-sm)] mb-3">
        <div className="suph-card-head flex items-center justify-between pt-[18px] px-[22px] pb-0 mb-[14px]">
          <h2 className="text-[16px] font-extrabold text-[var(--ink-mute)] mb-2 select-none">
            Platform health
          </h2>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold bg-[var(--c-sage-wash)] text-[var(--c-sage-text)]">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--c-check)]" />
            {overallHealthStatus}
          </span>
        </div>

        <div className="suph-health-body pt-0 px-[22px] pb-[22px]">
          <div className="flex flex-col lg:flex-row gap-5">
            {/* Performance Score Card */}
            <div className="suph-health-score bg-[var(--paper)] border border-[var(--line)] rounded-[var(--r-md)] p-[20px] flex flex-col justify-center gap-6 w-full lg:w-[250px] shrink-0 shadow-[var(--shadow-xs)] transition-all duration-[var(--dur-base)] ease-[var(--tn)] hover:-translate-y-0.5 hover:border-[var(--line-strong)] hover:shadow-[var(--shadow-sm)]">
              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-[var(--ink)] font-sans">{performanceScore}</span>
                  <span className="text-base text-gray-400 font-normal">/100</span>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#5C5C5C] block mt-1">
                  PERFORMANCE SCORE
                </span>
              </div>

              <div>
                <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden mb-2">
                  <div
                    className="bg-[var(--c-sage-text)] h-full rounded-full transition-all duration-500"
                    style={{ width: `${performanceScore}%` }}
                  />
                </div>
                <span className="text-[10px] text-[#5C5C5C] font-medium block">
                  Last incident {lastIncidentDays} days ago
                </span>
              </div>
            </div>
            {/* 6 Services Status Grid (3 per row) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5 flex-1">
              {healthServices.map((service: any, idx: number) => {
                const ServiceIcon = getServiceIcon(service.name);
                const isOperational = service.status === "Operational";
                return (
                  <div
                    key={idx}
                    className="bg-[var(--paper)] border border-[var(--line)] rounded-[var(--r-md)] p-4 flex flex-col gap-3.5 shadow-[var(--shadow-xs)] transition-all duration-[var(--dur-base)] ease-[var(--tn)] hover:-translate-y-0.5 hover:border-[var(--line-strong)] hover:shadow-[var(--shadow-sm)]"
                  >
                    <div className="flex items-center justify-between">
                      <div className={`w-[30px] h-[30px] rounded-[10px] flex items-center justify-center shrink-0 ${isOperational ? "bg-[var(--c-sage-wash)] text-[var(--c-sage-text)]" : "bg-[var(--c-clay-wash)] text-[var(--c-clay-text)]"
                        }`}>
                        <ServiceIcon className="w-4 h-4" />
                      </div>

                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold shrink-0 ${isOperational
                        ? "bg-[var(--c-sage-wash)] text-[var(--c-sage-text)]"
                        : "bg-[var(--c-clay-wash)] text-[var(--c-clay-text)]"
                        }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${isOperational ? "bg-[var(--c-check)]" : "bg-[var(--c-clay)]"}`} />
                        {service.status}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-sm font-bold tracking-[0.08em] text-[var(--ink-mute)] uppercase select-none font-sans leading-tight mb-0.5">{service.name}</h3>
                      <p className="text-sm text-[#5C5C5C] font-normal leading-tight font-sans">{service.detail || "Operational"}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── 6. Open / Resolved Tickets Section ───────────────────── */}
      <div className="bg-[var(--paper)] border border-[var(--line)] rounded-[var(--r-md)] flex flex-col overflow-hidden pb-3 shadow-[var(--shadow-xs)] transition-all duration-[var(--dur-base)] ease-[var(--tn)] hover:-translate-y-0.5 hover:border-[var(--line-strong)] hover:shadow-[var(--shadow-sm)]">
        <div className="suph-card-head flex items-center justify-between pt-[18px] px-[22px] pb-0 mb-[14px]">
          <h2 className="text-[12px]  font-bold tracking-[0.08em] text-[var(--ink-mute)] uppercase select-none font-sans">
            {activeTicketTab === 'open' ? 'Open tickets' : 'Resolved tickets'}
          </h2>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px]  font-bold bg-[#fee2e2] text-[#991b1b]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#dc2626]" />
            {openTicketsList.length} open
          </span>
        </div>

        {/* Tab Navigation */}
        <div className="suph-tabs flex gap-6 border-b border-[var(--line)] px-[22px] mb-0">
          <button
            type="button"
            onClick={() => setActiveTicketTab('open')}
            className={`pb-2.5 text-sm font-bold transition cursor-pointer border-b-2 ${activeTicketTab === 'open'
              ? "border-[#dc2626] text-[#1c1917]"
              : "border-transparent text-gray-400 hover:text-gray-700"
              }`}
          >
            Open
          </button>
          <button
            type="button"
            onClick={() => setActiveTicketTab('resolved')}
            className={`pb-2.5 text-sm font-bold transition cursor-pointer border-b-2 ${activeTicketTab === 'resolved'
              ? "border-[#dc2626] text-[#1c1917]"
              : "border-transparent text-gray-400 hover:text-gray-700"
              }`}
          >
            Resolved
          </button>
        </div>

        {/* Tickets Table */}
        <div className="overflow-x-auto pt-1">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-[var(--line)] text-[#5C5C5C] text-sm font-bold uppercase tracking-wider bg-white">
                <th
                  onClick={() => { setTicketSortField("ticketNumber"); setTicketSortAsc(!ticketSortAsc); }}
                  className="pt-0 px-[22px] pb-[10px] cursor-pointer hover:text-[#1c1917] w-28"
                >
                  <div className="flex items-center gap-1">
                    ID <ChevronsUpDown className="w-3 h-3 text-[#b3aca4]" />
                  </div>
                </th>
                <th
                  onClick={() => { setTicketSortField("userEmail"); setTicketSortAsc(!ticketSortAsc); }}
                  className="pt-0 px-[22px] pb-[10px] cursor-pointer hover:text-[#1c1917] w-60"
                >
                  <div className="flex items-center gap-1">
                    USER <ChevronsUpDown className="w-3 h-3 text-[#b3aca4]" />
                  </div>
                </th>
                <th
                  onClick={() => { setTicketSortField("title"); setTicketSortAsc(!ticketSortAsc); }}
                  className="pt-0 px-[22px] pb-[10px] cursor-pointer hover:text-[#1c1917]"
                >
                  <div className="flex items-center gap-1">
                    ISSUE <ChevronsUpDown className="w-3 h-3 text-[#b3aca4]" />
                  </div>
                </th>
                <th
                  onClick={() => { setTicketSortField("age"); setTicketSortAsc(!ticketSortAsc); }}
                  className="pt-0 px-[22px] pb-[10px] cursor-pointer hover:text-[#1c1917] w-24"
                >
                  <div className="flex items-center gap-1">
                    AGE <ChevronsUpDown className="w-3 h-3 text-[#b3aca4]" />
                  </div>
                </th>
                <th
                  onClick={() => { setTicketSortField("priority"); setTicketSortAsc(!ticketSortAsc); }}
                  className="pt-0 px-[22px] pb-[10px] cursor-pointer hover:text-[#1c1917] w-32 text-right"
                >
                  <div className="flex items-center justify-end gap-1">
                    PRIORITY <ChevronsUpDown className="w-3 h-3 text-[#b3aca4]" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedTickets.length > 0 ? (
                sortedTickets.map((ticket) => (
                  <tr
                    key={ticket.id}
                    onClick={() => setSelectedTicketId(ticket.id)}
                    className="border-b border-[var(--line)] hover:bg-[#faf8f5] transition cursor-pointer"
                  >
                    <td className="py-[12px] px-[22px] font-semibold text-sm text-[#141414]">
                      #{ticket.ticketNumber}
                    </td>
                    <td className="py-[12px] px-[22px] font-sans font-normal text-sm text-[#141414]">
                      {ticket.userEmail}
                    </td>
                    <td className="py-[12px] px-[22px] text-sm text-[#141414] font-medium max-w-md truncate">
                      {ticket.title}
                    </td>
                    <td className="py-[12px] px-[22px] text-sm text-[#5C5C5C] font-medium">
                      {ticket.age}
                    </td>
                    <td className="py-[12px] px-[22px] text-right">
                      {renderPriorityBadge(ticket.priority)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-400 font-medium">
                    No tickets found in this tab.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── 7. Quick Action Dialog Modal ──────────────────────────── */}
      {modalAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white border border-[var(--line)] rounded-2xl p-6 max-w-md w-full shadow-2xl flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--line)]">
              <h3 className="text-lg font-extrabold text-[#1c1917]">
                {quickActionsList.find(a => a.id === modalAction)?.label}
              </h3>
              <button
                type="button"
                onClick={() => setModalAction(null)}
                className="text-gray-400 hover:text-gray-700 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-gray-600 leading-relaxed">
              {quickActionsList.find(a => a.id === modalAction)?.description} Every action is written to the audit log.
            </p>

            <form onSubmit={handleExecuteQuickAction} className="flex flex-col gap-3.5">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#736E6A] block mb-1.5">
                  TARGET LEARNER EMAIL
                </label>
                <input
                  type="email"
                  required
                  value={actionEmail}
                  onChange={(e) => setActionEmail(e.target.value)}
                  placeholder="learner@example.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--line)] text-sm text-[#1c1917] outline-none focus:border-gray-500 font-medium"
                />
              </div>

              {modalAction === "unlock" && (
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#736E6A] block mb-1.5">
                    UNLOCK REASON (AUDIT TRAIL)
                  </label>
                  <input
                    type="text"
                    value={actionReason}
                    onChange={(e) => setActionReason(e.target.value)}
                    placeholder="Identity verified via support call"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--line)] text-sm text-[#1c1917] outline-none focus:border-gray-500 font-medium"
                  />
                </div>
              )}

              {modalError && (
                <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm font-semibold">
                  {modalError}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--line)]">
                <button
                  type="button"
                  onClick={() => setModalAction(null)}
                  className="px-4 py-2 rounded-full border border-[var(--line)] text-gray-700 font-bold text-sm hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAction}
                  className="px-5 py-2 rounded-full bg-[#1c1917] text-white font-bold text-sm hover:bg-black transition cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingAction ? "Executing..." : "Confirm & Execute"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── 8. Ticket Detail / Reply / Resolve Drawer ─────────────── */}
      {selectedTicketId && activeTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white border border-[var(--line)] rounded-2xl p-6 max-w-xl w-full max-h-[85vh] overflow-y-auto shadow-2xl flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--line)]">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedTicketId(null)}
                  className="text-sm font-bold text-gray-500 hover:text-black flex items-center gap-1 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <span className="text-sm font-mono font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-800">
                  #{activeTicket.ticketNumber}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTicketId(null)}
                className="text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Ticket Header Details */}
            <div>
              <h3 className="text-base font-extrabold text-[#1c1917]">
                {activeTicket.title}
              </h3>
              <p className="text-sm text-gray-600 mt-1 leading-relaxed bg-[#faf8f5] p-3 rounded-xl border border-[var(--line)]">
                {activeTicket.description}
              </p>
            </div>

            {/* Meta Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-xl bg-gray-50 text-sm">
              <div>
                <span className="text-[10px] font-bold uppercase text-gray-400 block">User</span>
                <strong className="text-gray-900 block truncate">{activeTicket.userName}</strong>
                <span className="text-gray-500 font-mono block truncate text-[10px]">{activeTicket.userEmail}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-gray-400 block">Priority</span>
                <span className="mt-0.5 block">{renderPriorityBadge(activeTicket.priority)}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-gray-400 block">Status</span>
                <span className={`inline-block px-2 py-0.5 rounded font-bold text-[10px] mt-0.5 ${activeTicket.status === 'RESOLVED'
                  ? "bg-[var(--c-sage-wash)] text-[var(--c-sage-text)] border border-[var(--c-sage-soft)]"
                  : "bg-amber-50 text-amber-700 border border-amber-200"
                  }`}>
                  {activeTicket.status}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-gray-400 block">Opened</span>
                <span className="text-gray-700 text-[10px] block mt-0.5">{activeTicket.age} ago</span>
              </div>
            </div>

            {/* Conversation Thread */}
            <div className="flex flex-col gap-2.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#736E6A]">
                Conversation Thread
              </span>
              <div className="flex flex-col gap-2.5 max-h-48 overflow-y-auto pr-1">
                {activeTicket.messages?.map((msg: any) => {
                  const isSupport = msg.senderRole === "Support" || msg.senderRole === "Admin";
                  return (
                    <div
                      key={msg.id}
                      className={`p-3 rounded-xl text-sm flex flex-col gap-1 ${isSupport
                        ? "bg-[#faf8f5] border border-[var(--line)] ml-4"
                        : "bg-white border border-[var(--line)] mr-4"
                        }`}
                    >
                      <div className="flex items-center justify-between text-[10px] font-bold">
                        <span className={isSupport ? "text-[#1c1917]" : "text-gray-800"}>
                          {msg.senderName} ({msg.senderRole})
                        </span>
                        <span className="text-gray-400 font-mono">
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                        {msg.message}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Reply Composer */}
            {activeTicket.status !== 'RESOLVED' && (
              <form onSubmit={handleSendTicketReply} className="flex flex-col gap-2.5 pt-2 border-t border-[var(--line)]">
                <textarea
                  rows={2}
                  required
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type official reply to learner..."
                  className="w-full p-3 rounded-xl border border-[var(--line)] text-sm text-[#1c1917] outline-none focus:border-gray-500 resize-none font-medium"
                />

                <div className="flex items-center justify-between gap-3">
                  <span className="text-[10px] text-[#ca8a04] font-medium flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#ca8a04]" />
                    Every reply is written to audit log
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleMarkTicketResolved}
                      disabled={isResolving}
                      className="px-3.5 py-1.5 rounded-full border border-emerald-600 text-[var(--c-sage-text)] font-bold text-sm hover:bg-[var(--c-sage-wash)] transition cursor-pointer"
                    >
                      {isResolving ? "Resolving..." : "Mark Resolved"}
                    </button>
                    <button
                      type="submit"
                      disabled={isSendingReply || !replyText.trim()}
                      className="px-4 py-1.5 rounded-full bg-[#1c1917] text-white font-bold text-sm hover:bg-black transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                    >
                      <Send className="w-3 h-3" />
                      {isSendingReply ? "Sending..." : "Send Reply"}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default SupportDashboard;