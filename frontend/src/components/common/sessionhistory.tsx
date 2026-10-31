import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import {
  Laptop,
  Monitor,
  Smartphone,
  Tablet,
  ShieldCheck,
  ShieldAlert,
  KeyRound,
  Fingerprint,
  Lock,
  Globe,
  Wifi,
  MapPin,
  Activity,
  Clock,
  Calendar,
  LogOut,
  Trash2,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Info,
  ExternalLink,
  Copy,
  Check,
  Zap,
  ChevronRight,
  Shield
} from "lucide-react";
import { toast } from "sonner";
import {
  getSessionsApi,
  revokeSessionApi,
  logoutAllDevicesApi,
} from "../../core/api/auth.api";
import { getDeviceInfo } from "../../utils/device";

interface UserDevice {
  id: string;
  deviceId: string;
  deviceName: string | null;
  browser: string | null;
  os: string | null;
  ipAddress: string | null;
  sessionState: string | null;
  lastLoginAt: string | null;
  lastSeenAt: string | null;
}

const SessionHistory: React.FC = () => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<UserDevice[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedIp, setCopiedIp] = useState<string | null>(null);

  // Modal / confirmation state
  const [sessionToRevoke, setSessionToRevoke] = useState<{ id: string; name: string; isCurrent: boolean } | null>(null);
  const [confirmRevokeAll, setConfirmRevokeAll] = useState<boolean>(false);
  const [actionPending, setActionPending] = useState<boolean>(false);

  const currentDeviceInfo = getDeviceInfo();
  const currentDeviceId = currentDeviceInfo.deviceId;

  const fetchSessions = async (showToast = false) => {
    try {
      if (showToast) setIsRefreshing(true);
      else setLoading(true);

      const res = await getSessionsApi();
      const sessionList: UserDevice[] = res.data || [];
      setSessions(sessionList);

      if (showToast) {
        toast.success("Sessions updated successfully.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to load active sessions");
      toast.error(err.message || "Failed to load active sessions");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleRevokeSingle = async () => {
    if (!sessionToRevoke) return;
    try {
      setActionPending(true);
      await revokeSessionApi(sessionToRevoke.id);
      toast.success(
        sessionToRevoke.isCurrent
          ? "You have been signed out from this device."
          : `Session on ${sessionToRevoke.name} was revoked.`
      );
      setSessionToRevoke(null);
      await fetchSessions();
      if (sessionToRevoke.isCurrent) {
        navigate("/login");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to revoke session.");
    } finally {
      setActionPending(false);
    }
  };

  const handleSignOutAllOther = async () => {
    try {
      setActionPending(true);
      await logoutAllDevicesApi();
      toast.success("All other active sessions have been signed out.");
      setConfirmRevokeAll(false);
      await fetchSessions();
    } catch (err: any) {
      toast.error(err.message || "Failed to sign out other sessions.");
    } finally {
      setActionPending(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIp(text);
    toast.success(`Copied IP ${text} to clipboard`);
    setTimeout(() => setCopiedIp(null), 2500);
  };

  const formatRelativeTime = (dateString: string | null, isCurrent: boolean) => {
    if (!dateString) {
      return isCurrent ? "Active right now" : "Recently active";
    }

    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return isCurrent ? "Active right now" : "Recently active";
    }

    const now = new Date();
    const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffSeconds < 60) return "Just now";
    const minutes = Math.floor(diffSeconds / 60);
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hrs ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days} days ago`;

    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getDeviceIcon = (os: string | null, browser: string | null) => {
    const text = `${os || ""} ${browser || ""}`.toLowerCase();
    if (text.includes("iphone") || text.includes("android") || text.includes("mobile")) {
      return <Smartphone className="w-5 h-5 text-indigo-600" />;
    }
    if (text.includes("ipad") || text.includes("tablet")) {
      return <Tablet className="w-5 h-5 text-purple-600" />;
    }
    if (text.includes("mac") || text.includes("apple")) {
      return <Laptop className="w-5 h-5 text-slate-800" />;
    }
    return <Monitor className="w-5 h-5 text-blue-600" />;
  };

  // Calculation for device slots & current session
  const maxDevices = 2;
  const isSessionCurrent = (session: UserDevice) => {
    return Boolean(
      (session as any).isCurrent ||
      session.deviceId === currentDeviceId ||
      (sessions.length === 1)
    );
  };

  const otherSessionsCount = sessions.filter((s) => !isSessionCurrent(s)).length;
  const registeredCount = sessions.length || 1;

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8 animate-pulse">
        <div className="space-y-3">
          <div className="h-4 w-48 bg-slate-200 rounded-full" />
          <div className="h-8 w-72 bg-slate-200 rounded-lg" />
          <div className="h-4 w-full max-w-xl bg-slate-200 rounded-full" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="h-24 bg-slate-200 rounded-2xl" />
          <div className="h-24 bg-slate-200 rounded-2xl" />
          <div className="h-24 bg-slate-200 rounded-2xl" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <div className="h-40 bg-slate-200 rounded-2xl" />
            <div className="h-32 bg-slate-200 rounded-2xl" />
          </div>
          <div className="h-96 bg-slate-200 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error && sessions.length === 0) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 text-center bg-white rounded-3xl border border-rose-200 shadow-sm space-y-4">
        <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-slate-900">Unable to Load Sessions</h3>
        <p className="text-sm text-slate-500">{error}</p>
        <button
          onClick={() => fetchSessions()}
          className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition cursor-pointer"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8 antialiased text-slate-900">
      
      {/* =========================================================================
          1. HEADER WITH BADGES & QUICK ACTIONS
          ========================================================================= */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-200/80">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/60 text-blue-700 text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            <span>Identity & Access Governance</span>
            <span className="w-1 h-1 rounded-full bg-blue-400" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600">
              Single-User Protocol
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Active Sessions & Authorized Devices
          </h1>

          <p className="text-sm text-slate-500 leading-relaxed">
            Manage browser sessions and devices registered to your Nexus Academy account. To protect coursework credibility, up to <strong className="text-slate-700 font-semibold">2 devices</strong> may be linked, with only <strong className="text-slate-700 font-semibold">one concurrent active session</strong> permitted at any time.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => fetchSessions(true)}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold shadow-xs transition-all cursor-pointer"
            title="Refresh session list"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${isRefreshing ? "animate-spin text-blue-600" : ""}`} />
            <span>{isRefreshing ? "Refreshing..." : "Refresh"}</span>
          </button>

          {otherSessionsCount > 0 && (
            <button
              type="button"
              onClick={() => setConfirmRevokeAll(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold shadow-xs transition-all cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out All Other Sessions ({otherSessionsCount})</span>
            </button>
          )}
        </div>
      </div>

      {/* =========================================================================
          2. TOP SECURITY & DEVICE SLOT METRICS (3 STAT TILES)
          ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        {/* Metric 1: Device Slots */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Authorized Device Slots
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Laptop className="w-4 h-4" />
            </div>
          </div>
          
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-2xl font-black text-slate-900">
              {registeredCount} <span className="text-sm font-normal text-slate-400">/ {maxDevices} slots in use</span>
            </span>
          </div>

          {/* Slot visual dots */}
          <div className="flex items-center gap-2 pt-1">
            <div className="flex-1 h-2 rounded-full bg-blue-600" title="Slot 1: Active" />
            <div
              className={`flex-1 h-2 rounded-full ${
                registeredCount >= 2 ? "bg-indigo-600" : "bg-slate-100 border border-dashed border-slate-300"
              }`}
              title={registeredCount >= 2 ? "Slot 2: Active" : "Slot 2: Available"}
            />
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            {registeredCount >= 2
              ? "Maximum registered device capacity reached"
              : "1 available slot for another computer or phone"}
          </p>
        </div>

        {/* Metric 2: Concurrency Policy */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Concurrent Stream Guard
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>

          <div className="flex items-center gap-2 mb-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-base font-bold text-slate-900">
              Active Protection
            </span>
          </div>

          <p className="text-[11px] text-slate-500 leading-relaxed mt-2">
            Single active playback enforced. New sign-ins automatically request sign-out on prior devices.
          </p>
        </div>

        {/* Metric 3: Timezone & Network Check */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Current Environment
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Globe className="w-4 h-4" />
            </div>
          </div>

          <div className="text-base font-bold text-slate-900 truncate mb-1">
            {currentDeviceInfo.timezone || "Local Timezone"}
          </div>

          <p className="text-[11px] text-slate-500 leading-relaxed">
            {currentDeviceInfo.browser} on {currentDeviceInfo.os}
          </p>
        </div>

      </div>

      {/* =========================================================================
          3. MAIN SECTION: DEVICE LIST & SECURITY SIDEBAR
          ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left Column: Device Cards & Switching Blueprint */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span>Active Devices & Sessions</span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                {sessions.length}
              </span>
            </h2>
            <span className="text-xs text-slate-400">
              Auto-refreshes on security events
            </span>
          </div>

          {/* Device Cards */}
          <div className="space-y-4">
            {sessions.map((session) => {
              const isCurrent = isSessionCurrent(session);
              const deviceIcon = getDeviceIcon(session.os, session.browser);
              const ipToDisplay = session.ipAddress || "127.0.0.1";
              const isLocalIp = ipToDisplay === "127.0.0.1" || ipToDisplay === "::1";
              const sessionToken = session.sessionState || session.id || session.deviceId;

              return (
                <div
                  key={session.id || session.deviceId}
                  className={`relative rounded-2xl p-5 sm:p-6 transition-all duration-300 ${
                    isCurrent
                      ? "bg-white border-2 border-blue-500/80 shadow-md ring-4 ring-blue-500/5"
                      : "bg-white border border-slate-200 shadow-xs hover:border-slate-300 hover:shadow-md"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    
                    {/* Device Icon + Info */}
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
                          isCurrent
                            ? "bg-blue-50 border border-blue-200 text-blue-600"
                            : "bg-slate-100 border border-slate-200 text-slate-600"
                        }`}
                      >
                        {deviceIcon}
                      </div>

                      <div className="space-y-1.5 flex-1 min-w-0">
                        
                        {/* Title & Badge */}
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-bold text-base text-slate-900 leading-snug">
                            {session.browser || currentDeviceInfo.browser || "Standard Browser"} · {session.os || currentDeviceInfo.os || "Desktop OS"}
                          </h3>

                          {isCurrent ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              This Device (Current Session)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                              <Lock className="w-3 h-3 text-slate-400" />
                              Secondary Device
                            </span>
                          )}
                        </div>

                        {/* Metadata Details */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-1.5 gap-x-4 pt-1 text-xs text-slate-500">
                          
                          {/* IP Address */}
                          <div className="flex items-center gap-1.5">
                            <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>
                              {isLocalIp ? "Current Network (Localhost)" : `IP: ${ipToDisplay}`}
                            </span>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(ipToDisplay)}
                              className="text-slate-400 hover:text-slate-600 p-0.5 transition cursor-pointer"
                              title="Copy IP address"
                            >
                              {copiedIp === ipToDisplay ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>

                          {/* Last Active Timestamp */}
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>
                              Last active: <strong className="font-medium text-slate-700">{formatRelativeTime(session.lastSeenAt, isCurrent)}</strong>
                            </span>
                          </div>

                          {/* Signed-in Date */}
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>
                              Signed in: <span className="text-slate-600">{formatRelativeTime(session.lastLoginAt, isCurrent)}</span>
                            </span>
                          </div>

                          {/* Security Fingerprint */}
                          <div className="flex items-center gap-1.5 text-slate-400">
                            <Fingerprint className="w-3.5 h-3.5 shrink-0" />
                            <span className="font-mono text-[11px] truncate">
                              ID: {session.deviceId ? `${session.deviceId.slice(0, 12)}...` : "Registered"}
                            </span>
                          </div>

                        </div>

                      </div>
                    </div>

                    {/* Revoke Action */}
                    <div className="shrink-0 sm:self-center pt-2 sm:pt-0">
                      {sessionToken && (
                        <button
                          type="button"
                          onClick={() =>
                            setSessionToRevoke({
                              id: sessionToken,
                              name: `${session.browser || "Browser"} (${session.os || "OS"})`,
                              isCurrent,
                            })
                          }
                          className={`w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            isCurrent
                              ? "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
                              : "bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200"
                          }`}
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>{isCurrent ? "Sign Out" : "Revoke Device"}</span>
                        </button>
                      )}
                    </div>

                  </div>
                </div>
              );
            })}
          </div>

          {/* ===================================================================
              DEVICE SWITCHING BLUEPRINT CARD (Replaces ugly yellow box)
              =================================================================== */}
          <div className="rounded-3xl p-6 bg-gradient-to-br from-amber-50/70 via-orange-50/40 to-amber-50/70 border border-amber-200/80 shadow-xs">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
                <Zap className="w-5 h-5" />
              </div>

              <div className="space-y-3 flex-1">
                <div>
                  <h3 className="font-bold text-slate-900 text-base mb-1">
                    Single Active Session Policy & Device Switching
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    To safeguard exams, assignments, and copyrighted course media, our platform prevents simultaneous multi-screen playback. When you sign in on a second device, follow these easy steps:
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div className="bg-white/90 rounded-xl p-3 border border-amber-200/60 shadow-xs">
                    <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block mb-1">
                      Step 1 • Sign Out
                    </span>
                    <p className="text-xs text-slate-700 leading-snug">
                      Click "Sign Out" above on your current desktop or phone.
                    </p>
                  </div>

                  <div className="bg-white/90 rounded-xl p-3 border border-amber-200/60 shadow-xs">
                    <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block mb-1">
                      Step 2 • New Login
                    </span>
                    <p className="text-xs text-slate-700 leading-snug">
                      Open Nexus on your new device and verify via OTP.
                    </p>
                  </div>

                  <div className="bg-white/90 rounded-xl p-3 border border-amber-200/60 shadow-xs">
                    <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block mb-1">
                      Step 3 • State Sync
                    </span>
                    <p className="text-xs text-slate-700 leading-snug">
                      Your courses, quiz progress, and resume points sync instantly.
                    </p>
                  </div>
                </div>

              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Security Recommendations Sidebar */}
        <div className="space-y-6">
          
          {/* Security Checklist Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
            
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Account Security Guard</h3>
                <p className="text-xs text-slate-400">Governance & Hygiene Policies</p>
              </div>
              <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                Protected
              </span>
            </div>

            <ul className="space-y-4">
              
              <li className="flex items-start gap-3 text-xs leading-relaxed text-slate-600">
                <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <strong className="font-semibold text-slate-900 block mb-0.5">Routine Device Audit</strong>
                  Regularly inspect active sessions and revoke devices you no longer recognize or own.
                </div>
              </li>

              <li className="flex items-start gap-3 text-xs leading-relaxed text-slate-600">
                <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <strong className="font-semibold text-slate-900 block mb-0.5">Public Workstations</strong>
                  Always log out from shared university, cybercafe, or enterprise workstations. Never cache credentials.
                </div>
              </li>

              <li className="flex items-start gap-3 text-xs leading-relaxed text-slate-600">
                <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 mt-0.5">
                  <Fingerprint className="w-4 h-4" />
                </div>
                <div>
                  <strong className="font-semibold text-slate-900 block mb-0.5">OTP Authentication</strong>
                  Transaction verification codes are personal. Never relay OTP codes to third parties.
                </div>
              </li>

              <li className="flex items-start gap-3 text-xs leading-relaxed text-slate-600">
                <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 mt-0.5">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <strong className="font-semibold text-slate-900 block mb-0.5">Session Inactivity Expiry</strong>
                  Inactive sessions expire automatically after 7 days of non-usage to preserve credential safety.
                </div>
              </li>

            </ul>

            <div className="pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => navigate("/settings")}
                className="w-full py-2.5 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center justify-between transition cursor-pointer border border-slate-200"
              >
                <span>Manage Security & Password</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </div>

          </div>

          {/* Unrecognized Device Emergency Card */}
          <div className="bg-gradient-to-br from-rose-50/80 via-white to-rose-50/60 rounded-3xl p-6 border border-rose-200 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5" />
            </div>

            <h3 className="font-bold text-slate-900 text-base">
              Detect an Unfamiliar Session?
            </h3>

            <p className="text-xs text-slate-600 leading-relaxed">
              If an unknown IP address or unauthorized device is active on your profile, revoke it immediately and inform our Security Operations Center.
            </p>

            <button
              type="button"
              onClick={() => navigate("/issue-reporting")}
              className="w-full py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>Report Security Anomaly</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>

      </div>

      {/* =========================================================================
          4. CONFIRMATION MODAL: REVOKE SINGLE SESSION
          ========================================================================= */}
      {sessionToRevoke && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-900">
                {sessionToRevoke.isCurrent ? "Sign out from this device?" : "Revoke device session?"}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                {sessionToRevoke.isCurrent
                  ? "Signing out from your current device will terminate your ongoing player session and return you to the login screen."
                  : `Are you sure you want to disconnect ${sessionToRevoke.name}? The user will be required to re-authenticate with OTP.`}
              </p>
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                disabled={actionPending}
                onClick={() => setSessionToRevoke(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionPending}
                onClick={handleRevokeSingle}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition cursor-pointer shadow-sm"
              >
                {actionPending ? "Processing..." : sessionToRevoke.isCurrent ? "Yes, Sign Out" : "Revoke Access"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          5. CONFIRMATION MODAL: REVOKE ALL OTHER SESSIONS
          ========================================================================= */}
      {confirmRevokeAll && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <ShieldAlert className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-900">
                Disconnect all other devices?
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                This will immediately invalidate the session tokens on all other authorized phones, tablets, or secondary browsers ({otherSessionsCount} devices). Only this browser will remain authenticated.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                disabled={actionPending}
                onClick={() => setConfirmRevokeAll(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionPending}
                onClick={handleSignOutAllOther}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition cursor-pointer shadow-sm"
              >
                {actionPending ? "Revoking..." : "Confirm & Sign Out Others"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default SessionHistory;
