import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import {
  Loader2,
  User,
  Bell,
  Lock,
  Trash2,
  Check,
  ChevronDown,
  Monitor,
  Smartphone,
  Shield,
  MonitorSmartphone,
  Clock,
  ShieldCheck,
  ExternalLink,
  ArrowLeft,
} from "lucide-react";
import { Skeleton } from "../../components/ui/Skeleton";
import { useProfileStore } from "../../store/profile.store";
import { useUserStore } from "../../store/user.store";
import { useProfile } from "../../hooks/profile/useProfile";
import { useSettings } from "../../hooks/useSettings";
import { NotificationPreferences } from "../../core/api/notification.api";
import {
  getSessionsApi,
  revokeSessionApi,
  logoutAllDevicesApi,
} from "../../core/api/auth.api";
import { getProfileSecurityApi } from "../../core/api/profile/profile.api";
import { SecurityStatus } from "../../types/profile.type";
import { api } from "../../config/axios";
import { getDeviceInfo } from "../../utils/device";
import { toast } from "sonner";

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


// Checkbox Row with green filled checkmark
const CheckRow: React.FC<{
  label: string;
  sublabel?: string;
  checked: boolean;
  onChange: () => void;
  id: string;
}> = ({ label, sublabel, checked, onChange, id }) => (
  <label
    htmlFor={id}
    className="flex items-center gap-3 py-3 border-b border-[#F0F0F0] last:border-0 cursor-pointer select-none group hover:bg-gray-50/60 px-2 -mx-2 rounded-lg transition-colors"
  >
    <div
      className={`w-[16px] h-[16px] rounded flex items-center justify-center transition-colors shrink-0 ${
        checked
          ? "bg-[#2e9f5b] text-white"
          : "border border-[#D1CCC7] bg-white group-hover:border-[#999]"
      }`}
    >
      {checked && <Check className="w-3 h-3 stroke-[3]" />}
    </div>
    <input
      type="checkbox"
      id={id}
      checked={checked}
      onChange={onChange}
      className="sr-only"
    />
    <span className="text-[16px] font-medium text-[#141414]">
      {label}
      {sublabel && <span className="text-[16px] text-[#5C5C5C] font-normal"> {sublabel}</span>}
    </span>
  </label>
);

const ContentDeveloperSetting: React.FC = () => {
  const navigate = useNavigate();
  const { profile } = useProfileStore();
  const { user } = useUserStore();
  const { getProfile, saveProfile } = useProfile();
  const { preferences: apiPreferences, isLoading: isSettingsLoading, updatePreferences } = useSettings();

  const [activeView, setActiveView] = useState<"settings" | "sessions">("settings");

  // Real Profile State
  const [fullName, setFullName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [language, setLanguage] = useState("en");
  const [isSavingAccount, setIsSavingAccount] = useState(false);

  // Notification preferences state
  const [notifPrefs, setNotifPrefs] = useState<Pick<NotificationPreferences,
    'marketingEmail' | 'courseEnrollmentEmail' | 'courseCompletedInApp' | 'marketingInApp'
  >>({
    marketingEmail: true,
    courseEnrollmentEmail: true,
    courseCompletedInApp: true,
    marketingInApp: false,
  });

  // Real Sessions state
  const [sessions, setSessions] = useState<UserDevice[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const currentDeviceInfo = getDeviceInfo();
  const currentDeviceId = currentDeviceInfo.deviceId;

  // Real Security & MFA State
  const [securityStatus, setSecurityStatus] = useState<SecurityStatus | null>(null);
  const [loadingSecurity, setLoadingSecurity] = useState(false);

  // Dynamic Language Options
  const [languageOptions, setLanguageOptions] = useState<{ id: string; name: string }[]>([
    { id: "en", name: "English (EN)" },
    { id: "ar", name: "Arabic (AR)" },
  ]);

  // Fetch security/MFA status & dynamic language options
  useEffect(() => {
    let mounted = true;
    setLoadingSecurity(true);
    getProfileSecurityApi()
      .then((status) => {
        if (mounted && status) {
          setSecurityStatus(status);
        }
      })
      .catch(() => {
        // Security status unavailable
      })
      .finally(() => {
        if (mounted) setLoadingSecurity(false);
      });

    api.get("/enums/data-set/language")
      .then((res) => {
        const items = res.data?.data || res.data;
        if (mounted && Array.isArray(items) && items.length > 0) {
          setLanguageOptions(
            items.map((item: any) => ({
              id: item.code || item.id,
              name: item.name,
            }))
          );
        }
      })
      .catch(() => {
        // Fallback already in initial state
      });

    return () => {
      mounted = false;
    };
  }, []);

  // Sync profile data on mount & changes
  useEffect(() => {
    getProfile().catch(() => {});
  }, [getProfile]);

  useEffect(() => {
    const fName = profile?.profile?.firstName || user?.firstName || "";
    const lName = profile?.profile?.lastName || user?.lastName || "";
    const computedFullName = `${fName} ${lName}`.trim();
    if (computedFullName) {
      setFullName(computedFullName);
    }
    const certName = profile?.profile?.certificateName || computedFullName;
    if (certName) {
      setDisplayName(certName);
    }
    if (profile?.preferences?.preferredLanguage) {
      setLanguage(profile.preferences.preferredLanguage);
    }
  }, [profile, user]);

  // Sync notification preferences from API
  useEffect(() => {
    if (apiPreferences) {
      setNotifPrefs({
        marketingEmail: apiPreferences.marketingEmail ?? true,
        courseEnrollmentEmail: apiPreferences.courseEnrollmentEmail ?? true,
        courseCompletedInApp: apiPreferences.courseCompletedInApp ?? true,
        marketingInApp: apiPreferences.marketingInApp ?? false,
      });
    }
  }, [apiPreferences]);

  // Fetch real sessions from API
  const fetchSessions = useCallback(async () => {
    try {
      setLoadingSessions(true);
      const res = await getSessionsApi();
      if (res?.data && Array.isArray(res.data)) {
        setSessions(res.data);
      } else if (Array.isArray(res)) {
        setSessions(res);
      }
    } catch {
      // Keep state clean if offline
    } finally {
      setLoadingSessions(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const handleToggleNotif = async (key: keyof typeof notifPrefs) => {
    const previous = notifPrefs[key];
    const updated = { ...notifPrefs, [key]: !previous };
    setNotifPrefs(updated);
    try {
      await updatePreferences(updated as Partial<NotificationPreferences>);
      toast.success("Notification preference updated.");
    } catch {
      toast.error("Failed to update notification preferences.");
      setNotifPrefs({ ...notifPrefs, [key]: previous });
    }
  };

  const handleSaveAccount = async () => {
    setIsSavingAccount(true);
    try {
      const parts = fullName.trim().split(" ");
      const firstName = parts[0] || "";
      const lastName = parts.slice(1).join(" ") || "";
      await saveProfile({
        firstName,
        lastName,
        certificateName: displayName.trim() || undefined,
        preferredLanguage: language,
      } as any);
      toast.success("Account settings saved successfully.");
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || "Failed to save account settings");
    } finally {
      setIsSavingAccount(false);
    }
  };

  const handleSignOutSession = async (sessionState: string) => {
    try {
      await revokeSessionApi(sessionState);
      toast.success("Session signed out successfully.");
      await fetchSessions();
    } catch (err: any) {
      toast.error(err.message || "Failed to sign out session");
    }
  };

  const handleSignOutAllOther = async () => {
    try {
      await logoutAllDevicesApi();
      toast.success("All other sessions signed out.");
      await fetchSessions();
    } catch (err: any) {
      toast.error(err.message || "Failed to sign out all other sessions");
    }
  };

  const formatTime = (dateString: string | null) => {
    if (!dateString) return "just now";
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (seconds < 60) return "just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hrs ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days} days ago`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months} weeks ago`;
    return `${Math.floor(months / 12)} years ago`;
  };

  const isMobile = (os: string | null) => {
    if (!os) return false;
    const lower = os.toLowerCase();
    return lower.includes("ios") || lower.includes("android") || lower.includes("iphone") || lower.includes("ipad");
  };

  if (isSettingsLoading && !profile) {
    return (
      <div className="w-full min-w-0 space-y-6 pb-12 font-sans">
        {/* Header Skeleton */}
        <div>
          <Skeleton className="h-3 w-48 bg-gray-200 mb-[6px]" />
          <Skeleton className="h-8 w-64 bg-gray-200 mb-[6px]" />
          <Skeleton className="h-4 w-[400px] bg-gray-200" />
        </div>

        {/* Account Card Skeleton */}
        <div className="bg-white border border-[#EAEAEA] rounded-[20px] p-6 shadow-xs">
          <div className="flex items-center gap-3 mb-6">
            <Skeleton className="h-9 w-9 rounded-lg bg-gray-200 shrink-0" />
            <Skeleton className="h-5 w-24 bg-gray-200" />
          </div>

          <div className="grid md:grid-cols-2 gap-5 mb-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i}>
                <Skeleton className="h-4 w-32 bg-gray-200 mb-1.5" />
                <Skeleton className="h-11 w-full bg-gray-100 rounded-xl" />
              </div>
            ))}
          </div>

          <Skeleton className="h-10 w-32 rounded-full bg-gray-200" />
        </div>
      </div>
    );
  }

  const email = profile?.email || user?.email || "";
  const sessionCount = sessions.length > 0 ? sessions.length : 1;
  const sessionSummary =
    sessions.length > 0
      ? `(${sessions.map((s) => s.browser || s.os || s.deviceName || "Device").filter(Boolean).slice(0, 2).join(", ")})`
      : `(${currentDeviceInfo.browser}, ${currentDeviceInfo.os})`;

  return (
    <div
      className="w-full min-w-0 space-y-6 pb-12 font-sans"
      style={{ fontFamily: "'Manrope', system-ui, -apple-system, sans-serif" }}
    >
      {activeView === "settings" ? (
        <>
          {/* Page header */}
          <div>
            <p className="text-[12px] font-bold uppercase tracking-[1.5px] text-[#5C5C5C] mb-[6px]">
              CONTENT DEVELOPER · PERSONAL ACCOUNT SETTINGS
            </p>
            <h1 className="text-[24px] font-extrabold text-[#141414] leading-tight mb-[6px]">
              Account settings
            </h1>
            <p className="text-[16px] text-[#5C5C5C] font-normal leading-relaxed mb-0">
              Manage your account, preferences and security.
            </p>
          </div>

          {/* Card 1: Account */}
          <div className="bg-white border border-[#EAEAEA] rounded-[20px] p-6 shadow-xs hover:shadow-md hover:-translate-y-0.5 hover:border-[#DCDCDC] transition-all duration-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-9 h-9 rounded-lg bg-[#FAF3E0] flex items-center justify-center shrink-0">
                <User className="w-4 h-4 text-[#8A6318]" />
              </div>
              <h2 className="text-[16px] font-bold text-[#141414]">
                Account
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-5 mb-6">
              <div>
                <label className="block text-[12px] font-semibold text-[#5C5C5C] mb-1.5">Full name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full border border-[#E0E0E0] rounded-xl px-4 py-2.5 text-[16px] font-medium text-[#141414] bg-white focus:outline-none focus:border-[#141414] transition-all hover:border-[#BDBDBD]"
                  placeholder="Your full name"
                />
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-[#5C5C5C] mb-1.5">Email</label>
                <input
                  type="email"
                  value={email}
                  readOnly
                  className="w-full border border-[#EAEAEA] rounded-xl px-4 py-2.5 text-[16px] font-medium text-[#8C8C8C] bg-[#F6F6F4] cursor-not-allowed focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-[#5C5C5C] mb-1.5">Display name (learning credential)</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full border border-[#E0E0E0] rounded-xl px-4 py-2.5 text-[16px] font-medium text-[#141414] bg-white focus:outline-none focus:border-[#141414] transition-all hover:border-[#BDBDBD]"
                  placeholder="Name on certificates"
                />
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-[#5C5C5C] mb-1.5">Language</label>
                <div className="relative">
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full appearance-none border border-[#E0E0E0] rounded-xl px-4 py-2.5 text-[16px] font-medium text-[#141414] bg-white focus:outline-none focus:border-[#141414] transition-all cursor-pointer hover:border-[#BDBDBD]"
                  >
                    {languageOptions.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5C5C5C]" />
                </div>
              </div>
            </div>

            <div>
              <button
                type="button"
                onClick={handleSaveAccount}
                disabled={isSavingAccount}
                className="bg-[#FCF7AE] hover:bg-[#F5EB8A] border border-[#E5DF8A] text-[#141414] text-[14px] font-bold px-5 py-2.5 rounded-full transition-all duration-200 hover:shadow-xs active:scale-98 cursor-pointer disabled:opacity-60 flex items-center gap-2"
              >
                {isSavingAccount && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Save changes
              </button>
            </div>
          </div>

          {/* Card 2: Notification preferences */}
          <div className="bg-white border border-[#EAEAEA] rounded-[20px] p-6 shadow-xs hover:shadow-md hover:-translate-y-0.5 hover:border-[#DCDCDC] transition-all duration-200">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-lg bg-[#dce5d3] flex items-center justify-center shrink-0">
                <Bell className="w-4 h-4 text-[#436437]" />
              </div>
              <h2 className="text-[16px] font-bold text-[#141414]">
                Notification preferences
              </h2>
            </div>

            <div>
              <CheckRow id="notif-sme-feedback" label="SME feedback received" sublabel="(email + in-app)" checked={notifPrefs.courseEnrollmentEmail} onChange={() => handleToggleNotif("courseEnrollmentEmail")} />
              <CheckRow id="notif-course-status" label="Course approved or rejected" sublabel="(in-app)" checked={notifPrefs.courseCompletedInApp} onChange={() => handleToggleNotif("courseCompletedInApp")} />
            </div>
          </div>

          {/* Card 3: Security */}
          <div className="bg-white border border-[#EAEAEA] rounded-[20px] p-6 shadow-xs hover:shadow-md hover:-translate-y-0.5 hover:border-[#DCDCDC] transition-all duration-200">
            <div className="flex items-center gap-3 mb-5" style={{ height: '72.8px' }}>
              <div className="w-9 h-9 rounded-lg bg-[#FDF0EB] flex items-center justify-center shrink-0">
                <Lock className="w-4 h-4 text-[#BA4632]" />
              </div>
              <h2 className="text-[16px] font-bold text-[#141414]">
                Security
              </h2>
            </div>

            <div className="flex items-center justify-between gap-4 pb-4 border-b border-[#F0F0F0]">
              <p className="text-[16px] text-[#141414]">
                Active sessions: <span className="font-bold">{sessionCount}</span> {sessionSummary}
              </p>
              <button
                type="button"
                onClick={() => setActiveView("sessions")}
                className="nexus-btn ghost sm text-[14px] font-bold text-[#141414] bg-[#F6F6F4] hover:bg-[#EAEAE8] border border-[#11111129] px-[14px] py-[8px] rounded-full transition-all duration-200 cursor-pointer shadow-2xs active:scale-95 shrink-0"
              >
                View all
              </button>
            </div>

            <div className="pt-4">
              <p className="text-[16px] text-[#5C5C5C]">
                MFA via OTP:{" "}
                <span className={`font-bold ${(securityStatus?.mfaEnabled || securityStatus?.otpRequired) ? "text-[#141414]" : "text-[#5C5C5C]"}`}>
                  {loadingSecurity
                    ? "Checking..."
                    : (securityStatus?.mfaEnabled || securityStatus?.otpRequired)
                    ? "Required"
                    : "Optional (Not enabled)"}
                </span>{" "}
                <span className="text-[#5C5C5C] font-normal">
                  {(securityStatus?.mfaEnabled || securityStatus?.otpRequired)
                    ? "(enforced for content authoring access)"
                    : "(can be configured in security settings)"}
                </span>
              </p>
            </div>
          </div>

          {/* Card 4: Danger zone */}
          <div className="bg-white border border-[#FCDAD7] rounded-[20px] overflow-hidden shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
            <div className="bg-[#f7d9d4] px-6 flex items-center gap-2.5 border-b border-[#FCDAD7]" style={{ height: '72.8px' }}>
              <Trash2 className="w-4 h-4 text-[#D32F2F]" />
              <h2 className="text-[16px] font-bold text-[#D32F2F]">
                Danger zone
              </h2>
            </div>
            <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-5 bg-white">
              <p className="text-[16px] text-[#3A3A3A] font-normal leading-relaxed">
                Delete account: all data permanently removed in 30 days. Courses you authored remain in the catalogue.
              </p>
              <button
                type="button"
                onClick={() => navigate("/profile/delete")}
                className="shrink-0 bg-[#FDE8E8] text-[#D32F2F] hover:bg-[#C12A1C] hover:text-white hover:border-[#C12A1C] border border-[#FCDAD7] text-[12px] font-bold w-[137.36px] h-[34px] flex items-center justify-center rounded-xl transition-colors cursor-pointer whitespace-nowrap active:scale-98"
              >
                Request deletion
              </button>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Active Sessions View */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <button
                type="button"
                onClick={() => setActiveView("settings")}
                className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#5C5C5C] hover:text-[#141414] mb-3 cursor-pointer group transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
                Back to settings
              </button>
              <div className="sess-eyebrow text-[12px] font-bold uppercase tracking-[1.5px] text-[#5C5C5C] mb-[6px]">
                PROFILE · SECURITY
              </div>
              <h1 className="sess-page-title text-[24px] font-bold text-[#141414] leading-tight mb-[6px]">
                Active sessions
              </h1>
              <p className="sess-page-sub text-[16px] text-[#3A3A3A] font-normal leading-relaxed max-w-2xl">
                Up to 2 devices may be registered, but only one device can be signed in at a time within a single time zone.
              </p>
            </div>
            <button
              type="button"
              onClick={handleSignOutAllOther}
              className="sess-btn-danger-outline text-[12px] font-bold text-[#C12A1C] border border-[#F8C6C2] bg-white hover:bg-[#FDF2F2] h-[34px] px-[14px] rounded-xl transition-all duration-200 cursor-pointer shadow-2xs active:scale-95 whitespace-nowrap self-start md:self-auto"
            >
              Sign out all other sessions
            </button>
          </div>

          <div className="flex flex-col lg:flex-row gap-6 items-start">
            {/* Left Column: Device Cards + Bottom Banner */}
            <div className="flex-1 w-full space-y-4 min-w-0">
              {loadingSessions ? (
                <div className="p-12 text-center text-[#5C5C5C] bg-white rounded-2xl border border-[#EAEAEA]">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-gray-400" />
                  Loading active sessions...
                </div>
              ) : sessions.length === 0 ? (
                /* Fallback single current session detected from browser */
                <div className="bg-white border border-[#EAEAEA] rounded-[16px] p-5 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-[#EAF2E8] text-[#436437]">
                      {currentDeviceInfo.deviceName === "Mobile" ? (
                        <Smartphone className="w-6 h-6" strokeWidth={1.5} />
                      ) : (
                        <Monitor className="w-6 h-6" strokeWidth={1.5} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="sess-name text-[16px] font-bold text-[#141414] mb-[5px] flex items-center gap-2 flex-wrap">
                        <span>
                          {currentDeviceInfo.browser} · {currentDeviceInfo.os}
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white text-[#436437] border border-[#436437] tracking-wide">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#436437]" />
                          This device
                        </span>
                      </div>
                      <div className="sess-meta text-[14px] text-[#5C5C5C] leading-relaxed">
                        {currentDeviceInfo.timezone || "Local Device"} · Signed in active session · Last active just now
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                sessions.map((session, idx) => {
                  const isCurrent = session.deviceId === currentDeviceId || idx === 0;
                  const mobile = isMobile(session.os);

                  return (
                    <div
                      key={session.id || idx}
                      className="bg-white border border-[#EAEAEA] rounded-[16px] p-5 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-between gap-4"
                    >
                      <div className="flex items-start gap-4 flex-1 min-w-0">
                        {/* Device Icon Container */}
                        <div
                          className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                            isCurrent ? "bg-[#EAF2E8] text-[#436437]" : "bg-[#FAF3E0] text-[#8A6318]"
                          }`}
                        >
                          {mobile ? <Smartphone className="w-6 h-6" strokeWidth={1.5} /> : <Monitor className="w-6 h-6" strokeWidth={1.5} />}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="sess-name text-[16px] font-bold text-[#141414] mb-[5px] flex items-center gap-2 flex-wrap">
                            <span>
                              {session.browser || session.deviceName || "Browser"} · {session.os || "Device"}
                            </span>
                            {isCurrent && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white text-[#436437] border border-[#436437] tracking-wide">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#436437]" />
                                This device
                              </span>
                            )}
                          </div>
                          <div className="sess-meta text-[14px] text-[#5C5C5C] leading-relaxed">
                            {session.ipAddress ? `IP ${session.ipAddress}` : "Connected"} · Signed in {formatTime(session.lastLoginAt)} · Last active {formatTime(session.lastSeenAt)}
                          </div>
                        </div>
                      </div>

                      <div>
                        {session.sessionState && (
                          <button
                            type="button"
                            onClick={() => handleSignOutSession(session.sessionState!)}
                            className="border border-[#F8C6C2] text-[#C12A1C] hover:bg-[#FDF2F2] rounded-xl px-4 py-1.5 text-[12px] font-bold transition-colors cursor-pointer shadow-2xs whitespace-nowrap active:scale-95"
                          >
                            {isCurrent ? "Sign out" : "Revoke"}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}

              {/* Bottom Warning Box */}
              <div className="bg-[#FAF3E0] border border-[#F2DEB0] rounded-[16px] p-5 flex items-start gap-3.5 text-[14px] text-[#141414] leading-relaxed">
                <Shield className="w-5 h-5 text-[#8A6318] shrink-0 mt-0.5" strokeWidth={1.5} />
                <p>
                  <strong className="text-[16px] font-bold text-[#141414]">One device at a time:</strong> if you sign in on another device, the new login is declined and you will be asked to sign out here first. To switch devices, sign out of this session, then sign in on the other device.
                </p>
              </div>
            </div>

            {/* Right Column: Security Guidance Sidebar */}
            <div className="w-full lg:w-[320px] shrink-0 bg-white border border-[#EAEAEA] rounded-[20px] p-6 shadow-xs hover:shadow-md transition-all duration-200">
              <h2 className="sess-help-title text-[16px] font-bold text-[#141414] mb-[14px]">
                Keep your account secure
              </h2>

              <ul className="space-y-5">
                <li className="flex items-start gap-3.5">
                  <div className="w-8 h-8 rounded-lg bg-[#FAF3E0] flex items-center justify-center shrink-0 text-[#8A6318]">
                    <ShieldCheck className="w-4 h-4" strokeWidth={1.5} />
                  </div>
                  <p className="text-[14px] text-[#3A3A3A] leading-relaxed">
                    Review your active devices regularly and sign out anything you do not recognise.
                  </p>
                </li>

                <li className="flex items-start gap-3.5">
                  <div className="w-8 h-8 rounded-lg bg-[#FAF3E0] flex items-center justify-center shrink-0 text-[#8A6318]">
                    <MonitorSmartphone className="w-4 h-4" strokeWidth={1.5} />
                  </div>
                  <p className="text-[14px] text-[#3A3A3A] leading-relaxed">
                    Always sign out on shared or public computers, and never save the code on a device that is not yours.
                  </p>
                </li>

                <li className="flex items-start gap-3.5">
                  <div className="w-8 h-8 rounded-lg bg-[#FAF3E0] flex items-center justify-center shrink-0 text-[#8A6318]">
                    <Clock className="w-4 h-4" strokeWidth={1.5} />
                  </div>
                  <p className="text-[14px] text-[#3A3A3A] leading-relaxed">
                    Your account allows up to 2 registered devices, with one active at a time.
                  </p>
                </li>
              </ul>

              <div className="mt-6 pt-5 border-t border-[#F0F0F0]">
                <p className="text-[12px] text-[#5C5C5C] mb-1">
                  See a device you do not recognise?
                </p>
                <button
                  type="button"
                  onClick={() => navigate("/issue-reporting")}
                  className="sess-help-link text-[14px] font-bold text-[#C99B2E] hover:underline cursor-pointer bg-transparent border-none p-0"
                >
                  Report it to support
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ContentDeveloperSetting;
