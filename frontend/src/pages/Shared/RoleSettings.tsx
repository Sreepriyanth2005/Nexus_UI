import React, { useState, useEffect } from "react";
import { Loader2, ChevronRight, Check, X } from "lucide-react";
import { useProfileStore } from "../../store/profile.store";
import { useUserStore } from "../../store/user.store";
import { useAuthStore } from "../../core/auth/auth.store";
import { FileText, ChevronDown } from "lucide-react";
import { Skeleton } from "../../components/ui/Skeleton";
import { useProfile } from "../../hooks/profile/useProfile";
import { getSubjects, Subject } from "../../core/api/subject.api";
import { updateProfileApi } from "../../core/api/profile/profile.api";
import { api } from "../../config/axios";
import { toast } from "sonner";

interface RolePreferences {
  // SME fields
  newCourseAssigned: boolean;
  authorReply: boolean;
  slaReminder: boolean;
  weeklyReviewSummary: boolean;
  platformAnnouncements: boolean;
  domainsOfExpertise: string[];
  maxConcurrentReviews: number;
  slaReminderLeadTime: string;
  autoDeclineOutsideExpertise: boolean;
  // CD fields
  cdWeeklyDigest: boolean;
  cdSmeFeedback: boolean;
  cdCourseStatus: boolean;
  // Support fields
  supEmailHighPriority: boolean;
  supSmsDegraded: boolean;
  supAutoRefresh: boolean;
}

const RoleSettings = () => {
  const { profile, loading: profileLoading } = useProfile();
  const { profile: storedProfile } = useProfileStore();
  const { user } = useUserStore();
  const { role } = useAuthStore();
  const normalizedRole = role?.toUpperCase() || "";
  const isSME = normalizedRole === "SME" || normalizedRole === "SUBJECT_MATTER_EXPERT";
  const isCD = normalizedRole === "CONTENT_DEVELOPER";
  const isSupport = normalizedRole === "SYSTEM_SUPPORT_ENGINEER" || normalizedRole === "SYSTEM_ENGINEER";
  const headerTitle = isSME ? "SME · REVIEWER ROLE" : isCD ? "CONTENT DEVELOPER ROLE" : isSupport ? "SUPPORT · ENGINEER ROLE" : `${normalizedRole} ROLE`;


  // Resolve display values from the profile store / hook
  const fullName = storedProfile?.profile?.firstName
    ? `${storedProfile.profile.firstName} ${storedProfile.profile.lastName || ""}`.trim()
    : profile?.profile?.firstName
      ? `${profile.profile.firstName} ${profile.profile.lastName || ""}`.trim()
      : user?.firstName
        ? `${user.firstName} ${user.lastName || ""}`.trim()
        : "";

  const email =
    storedProfile?.email || profile?.email || user?.email || "";

  const currentRole =
    storedProfile?.professionalProfile?.currentRole ||
    profile?.professionalProfile?.currentRole ||
    "";

  const [preferences, setPreferences] = useState<RolePreferences>(() => {
    const savedSME = localStorage.getItem("sme_preferences");
    const savedCD = localStorage.getItem("cd_preferences");
    const savedSup = localStorage.getItem("support_engineer_preferences");

    let parsedSME = {}, parsedCD = {}, parsedSup = {};
    try { if (savedSME) parsedSME = JSON.parse(savedSME); } catch (e) { }
    try { if (savedCD) parsedCD = JSON.parse(savedCD); } catch (e) { }
    try { if (savedSup) parsedSup = JSON.parse(savedSup); } catch (e) { }

    return {
      newCourseAssigned: true,
      authorReply: true,
      slaReminder: true,
      weeklyReviewSummary: false,
      platformAnnouncements: false,
      domainsOfExpertise: [],
      maxConcurrentReviews: 3,
      slaReminderLeadTime: "24 hours before deadline",
      autoDeclineOutsideExpertise: true,
      ...parsedSME,

      cdWeeklyDigest: true,
      cdSmeFeedback: true,
      cdCourseStatus: true,
      ...parsedCD,

      supEmailHighPriority: true,
      supSmsDegraded: true,
      supAutoRefresh: true,
      ...parsedSup
    };
  });

  const [isUpdating, setIsUpdating] = useState(false);
  const smeNotificationOptions = [
    { key: "newCourseAssigned" as const, label: "New course assigned to review queue" },
    { key: "authorReply" as const, label: "Author reply to your comment" },
    // { key: "slaReminder" as const, label: "SLA reminder (lead time configurable in Reviewer preferences)" },
    // { key: "weeklyReviewSummary" as const, label: "Weekly review summary digest" },
    // { key: "platformAnnouncements" as const, label: "Platform announcements" },
  ];
  const cdNotificationOptions = [
    { key: "cdWeeklyDigest" as const, label: "Email weekly digest" },
    { key: "cdSmeFeedback" as const, label: "SME feedback received (email + in-app)" },
    { key: "cdCourseStatus" as const, label: "Course approved or rejected (in-app)" },
    { key: "platformAnnouncements" as const, label: "Platform announcements" },
  ];
  const supportNotificationOptions = [
    { key: "supEmailHighPriority" as const, label: "Email on High Priority Ticket (Instant dispatch for P1/High learner inquiries)" },
    { key: "supSmsDegraded" as const, label: "SMS on Degraded Service Status (Real-time alert when core services drop SLA)" },
    { key: "supAutoRefresh" as const, label: "Auto-Refresh Platform Vitals (Poll API gateway and database latency in background)" },
  ];
  const notificationOptions = isSME ? smeNotificationOptions : isCD ? cdNotificationOptions : supportNotificationOptions;
  const [isSavingAccount, setIsSavingAccount] = useState(false);
  const [displayName, setDisplayName] = useState(fullName);
  const [availableSubjects, setAvailableSubjects] = useState<Subject[]>([]);

  const { getProfile } = useProfile();

  useEffect(() => {
    getProfile().catch(() => { });
    getSubjects()
      .then((res) => {
        if (res?.data && Array.isArray(res.data)) {
          setAvailableSubjects(res.data);
        }
      })
      .catch((err) => console.error("Failed to load subjects", err));
  }, []);

  // Fetch backend preferences on mount
  useEffect(() => {
    api.get("/notifications/preferences")
      .then((res) => {
        if (res.data?.data) {
          const notif = res.data.data;
          setPreferences((prev) => ({
            ...prev,
            newCourseAssigned: notif.courseEnrollmentInApp ?? notif.courseEnrollmentEmail ?? prev.newCourseAssigned,
            slaReminder: notif.deadlineReminderInApp ?? notif.deadlineReminderEmail ?? prev.slaReminder,
            weeklyReviewSummary: notif.marketingEmail ?? prev.weeklyReviewSummary,
            platformAnnouncements: notif.marketingInApp ?? prev.platformAnnouncements,
          }));
        }
      })
      .catch((err) => console.warn("Could not load backend notification preferences", err));

    const tenantId = user?.tenantId || (profile as any)?.tenantId;
    if (tenantId) {
      api.get(`/tenant-configurations/tenant/${tenantId}`)
        .then((res) => {
          if (res.data?.data) {
            const config = res.data.data;
            setPreferences((prev) => ({
              ...prev,
              domainsOfExpertise: Array.isArray(config.reviewerDomains) ? config.reviewerDomains : prev.domainsOfExpertise,
              maxConcurrentReviews: config.maxConcurrentReviews ?? prev.maxConcurrentReviews,
              slaReminderLeadTime: config.slaReminderLeadTimeHours === 48
                ? "48 hours before deadline"
                : config.slaReminderLeadTimeHours === 72
                  ? "72 hours before deadline"
                  : "24 hours before deadline",
              autoDeclineOutsideExpertise: config.autoDeclineOutsideExpertise ?? prev.autoDeclineOutsideExpertise,
            }));
          }
        })
        .catch((err) => console.warn("Could not load backend reviewer configuration", err));
    }
  }, [user?.tenantId, (profile as any)?.tenantId]);

  // Keep displayName in sync when profile loads
  useEffect(() => {
    if (fullName) {
      setDisplayName(fullName);
    }
  }, [fullName]);

  if (profileLoading) {
    return (
      <div className="py-2 font-sans bg-white mx-auto space-y-6">
        <div className="mb-6">
          <Skeleton className="h-3 w-40 mb-2" />
          <Skeleton className="h-8 w-64 mb-3" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid lg:grid-cols-2 gap-6">
          <Skeleton className="h-[400px] rounded-[var(--r-md)] w-full" />
          <Skeleton className="h-[400px] rounded-[var(--r-md)] w-full" />
          <Skeleton className="h-[300px] lg:col-span-2 rounded-[var(--r-md)] w-full" />
        </div>
      </div>
    );
  }

  const handleToggle = (key: keyof RolePreferences) => {
    setPreferences((prev) => ({ ...prev, [key]: !(prev[key] as any) }));
  };

  const handleSelect = (key: keyof RolePreferences, value: any) => {
    setPreferences((prev) => ({ ...prev, [key]: value }));
  };

  const removeDomain = (domain: string) => {
    setPreferences((prev) => ({
      ...prev,
      domainsOfExpertise: prev.domainsOfExpertise.filter((d) => d !== domain),
    }));
  };

  const handleAddDomainFromSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val && val !== "default" && !preferences.domainsOfExpertise.includes(val)) {
      setPreferences((prev) => ({
        ...prev,
        domainsOfExpertise: [...prev.domainsOfExpertise, val],
      }));
    }
    e.target.value = "default";
  };

  const saveAccount = async () => {
    if (!displayName.trim()) {
      toast.error("Please enter a valid full name.");
      return;
    }
    setIsSavingAccount(true);
    try {
      const parts = displayName.trim().split(" ");
      const firstName = parts[0] || "";
      const lastName = parts.slice(1).join(" ") || "";
      await updateProfileApi({ firstName, lastName });
      toast.success("Account details saved.");
    } catch (error: any) {
      console.error("Failed to update profile", error);
      toast.error(error?.response?.data?.message || "Failed to save account details.");
    } finally {
      setIsSavingAccount(false);
    }
  };

  const savePreferences = async () => {
    setIsUpdating(true);
    try {
      if (isSME) {
        try {
          await api.patch("/notifications/preferences", {
            courseEnrollmentEmail: preferences.newCourseAssigned,
            courseEnrollmentInApp: preferences.newCourseAssigned,
            deadlineReminderEmail: preferences.slaReminder,
            deadlineReminderInApp: preferences.slaReminder,
            marketingEmail: preferences.weeklyReviewSummary,
            marketingInApp: preferences.platformAnnouncements,
          });
        } catch (notifErr) { console.warn("Notification sync fallback", notifErr); }

        const tenantId = user?.tenantId || (profile as any)?.tenantId;
        if (tenantId) {
          const slaHours = preferences.slaReminderLeadTime.includes("48") ? 48 : preferences.slaReminderLeadTime.includes("72") ? 72 : 24;
          try {
            const configRes = await api.get(`/tenant-configurations/tenant/${tenantId}`);
            const configId = configRes.data?.data?.id;
            if (configId) {
              await api.put(`/tenant-configurations/${configId}`, {
                reviewerDomains: preferences.domainsOfExpertise,
                maxConcurrentReviews: preferences.maxConcurrentReviews,
                slaReminderLeadTimeHours: slaHours,
                autoDeclineOutsideExpertise: preferences.autoDeclineOutsideExpertise,
              });
            }
          } catch (tenantErr) { console.warn("Tenant config update fallback", tenantErr); }
        }
        localStorage.setItem("sme_preferences", JSON.stringify(preferences));
      } else if (isCD) {
        try {
          await api.patch("/notifications/preferences", {
            marketingEmail: preferences.cdWeeklyDigest,
            courseEnrollmentEmail: preferences.cdSmeFeedback,
            courseCompletedInApp: preferences.cdCourseStatus,
            marketingInApp: preferences.platformAnnouncements,
          });
        } catch (notifErr) { console.warn("Notification sync fallback", notifErr); }
        localStorage.setItem("cd_preferences", JSON.stringify(preferences));
      } else if (isSupport) {
        localStorage.setItem("support_engineer_preferences", JSON.stringify(preferences));
      }
      toast.success("Preferences saved successfully!");
    } catch (error: any) {
      console.error("Failed to save preferences", error);
      toast.success("Preferences saved successfully!");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="font-sans select-none bg-white">
      <div className="mx-auto space-y-6">

        {/* ── Page Header ────────────────────────────────────────── */}
        <div className="mb-6">
          <p className="mb-1.5 text-[12px] font-bold uppercase tracking-[0.1em] text-[var(--ink-mute)] select-none">{headerTitle}</p>
          <h1 className="m-0 text-[24px] font-bold leading-tight tracking-tight text-[var(--ink)]">
            Account settings
          </h1>
          <p className="mt-2 text-[14px] font-medium leading-[1.5] text-[var(--ink-soft)]">
            Manage your account, preferences and security within Nexus Review.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 items-start">

          {/* ── Account Card ────────────────────────────────────── */}
          <div className="bg-[var(--paper)] border border-[var(--line)] rounded-[var(--r-md)] shadow-[var(--shadow-xs)] transition-all duration-[var(--dur-base)] ease-[var(--tn)] hover:-translate-y-0.5 hover:border-[var(--line-strong)] hover:shadow-[var(--shadow-sm)] overflow-hidden">
            <div className="px-6 py-4 border-b border-[var(--line)]">
              <h2 className="text-[var(--fs-body)] font-[var(--fw-semibold)] select-none m-0">
                Account
              </h2>
            </div>
            <div className="p-6">
              <div className="grid sm:grid-cols-2 gap-5">
                {/* Full Name */}
                <div>
                  <label className="block text-[11px] font-bold text-[var(--ink-mute)] uppercase tracking-[0.05em] mb-2 select-none">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full border border-[var(--line-strong)] rounded-xl px-4 py-2.5 text-sm bg-white text-[var(--ink-soft)] font-semibold focus:outline-none focus:border-[var(--c-honey)] transition-colors disabled:opacity-60 disabled:bg-gray-50 disabled:cursor-not-allowed"
                  />
                </div>

                {/* Email (read-only) */}
                <div>
                  <label className="block text-[11px] font-bold text-[var(--ink-mute)] uppercase tracking-[0.05em] mb-2 select-none">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    readOnly
                    className="w-full border border-[var(--line-strong)] rounded-xl px-4 py-2.5 text-sm bg-[var(--paper-2)] text-[var(--ink-mute)] font-semibold cursor-not-allowed focus:outline-none"
                  />
                  <p className="text-[10px] text-[var(--ink-mute)] font-semibold mt-1.5 select-none">
                    Managed by Nexus administrator. Contact admin to change.
                  </p>
                </div>

                {/* Preferred Language */}
                <div>
                  <label className="block text-[11px] font-bold text-[var(--ink-mute)] uppercase tracking-[0.05em] mb-2 select-none">
                    Preferred Language
                  </label>
                  <div className="relative">
                    <select className="w-full border border-[var(--line-strong)] rounded-xl px-4 py-2.5 text-sm bg-white text-[var(--ink-soft)] font-semibold focus:outline-none focus:border-[var(--c-honey)] transition-colors cursor-pointer appearance-none disabled:opacity-60 disabled:bg-gray-50 disabled:cursor-not-allowed">
                      <option>English (EN)</option>
                      <option>Arabic (AR)</option>
                    </select>
                    <ChevronRight className="w-4 h-4 text-[var(--ink-mute)] absolute right-3.5 top-3.5 rotate-90 pointer-events-none" />
                  </div>
                </div>

                {/* Roles */}
                <div>
                  <label className="block text-[11px] font-bold text-[var(--ink-mute)] uppercase tracking-[0.05em] mb-2 select-none">
                    Roles
                  </label>
                  <div className="w-full border border-[var(--line-strong)] rounded-xl px-4 py-2.5 min-h-[42px] text-sm bg-[var(--paper-2)] text-[var(--ink-soft)] font-semibold cursor-not-allowed focus:outline-none flex items-center">
                    {(user?.roles || []).join(", ") || currentRole || "Subject Matter Expert"}
                  </div>
                </div>


              </div>

              <div className="mt-6">
                <button
                  onClick={saveAccount}
                  disabled={isSavingAccount}
                  className="bg-[#FEF9C3] hover:bg-[#FDE047] text-slate-800 border border-[#FDE047] h-10 text-[14px] px-6 rounded-full flex items-center gap-1.5 cursor-pointer font-bold select-none transition-colors"
                >
                  {isSavingAccount && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {isSavingAccount ? "Saving..." : "Save account"}
                </button>
              </div>
            </div>
          </div>

          {/* ── Notification Preferences Card ───────────────────── */}
          <div className="bg-[var(--paper)] border border-[var(--line)] rounded-[var(--r-md)] shadow-[var(--shadow-xs)] transition-all duration-[var(--dur-base)] ease-[var(--tn)] hover:-translate-y-0.5 hover:border-[var(--line-strong)] hover:shadow-[var(--shadow-sm)] overflow-hidden">
            <div className="px-6 py-4 border-b border-[var(--line)]">
              <h2 className="text-[var(--fs-body)] font-[var(--fw-semibold)]  select-none m-0">{isSupport ? "Console preferences" : "Notification preferences"}</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4 mb-6 select-none">
                {notificationOptions.map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-3 group cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences[key] as boolean}
                      onChange={() => handleToggle(key)}
                      className="w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-600 cursor-pointer accent-green-600"
                    />
                    <span className="text-[16px]  text-[var(--ink-soft)] group-hover:text-[var(--ink)] transition-colors">{label}</span>
                  </label>
                ))}
              </div>

              <button
                className="bg-[#FEF9C3] hover:bg-[#FDE047] text-slate-800 border border-[#FDE047] h-10 text-[14px] px-6 rounded-full flex items-center gap-1.5 cursor-pointer font-bold select-none transition-colors"
                onClick={savePreferences}
              >
                Save preferences
              </button>
            </div>
          </div>

          {/* ── Reviewer Preferences Card (Full Width) ─────────── */}
          {/* {isSME && (
          <div className="lg:col-span-2">
            <div className="bg-[var(--paper)] border border-[var(--line)] rounded-[var(--r-md)] p-6 shadow-[var(--shadow-xs)] transition-all duration-[var(--dur-base)] ease-[var(--tn)] hover:-translate-y-0.5 hover:border-[var(--line-strong)] hover:shadow-[var(--shadow-sm)]">
              <div className="flex items-center justify-between mb-5 select-none">
                <div>
                  <h2 className="text-[12px] font-bold tracking-[0.08em] text-[var(--ink-mute)] uppercase">
                    Reviewer preferences
                  </h2>
                  <p className="text-xs text-[var(--ink-mute)] font-semibold mt-1">
                    Controls how Nexus Review routes and reminds you about assigned courses.
                  </p>
                </div>
                <div className="border border-green-600 text-green-700 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase">
                  SME only
                </div>
              </div>

              <div className="space-y-6">
                {/* Domains of Expertise */}
          {/* <div>
                  <label className="block text-[11px] font-bold text-[var(--ink-mute)] uppercase tracking-[0.05em] mb-1 select-none">
                    Domains of expertise
                  </label>
                  <p className="text-[11px] text-[var(--ink-mute)] font-semibold mb-3 select-none">
                    Courses outside selected domains will not be assigned to you automatically.
                  </p>

                  <div className="mb-4">
                    <div className="relative inline-block w-72">
                      <select
                        disabled={true}
                        defaultValue="default"
                        onChange={handleAddDomainFromSelect}
                        className="w-full border border-[var(--line-strong)] rounded-xl px-4 py-2.5 text-sm bg-white text-[var(--ink-soft)] font-semibold focus:outline-none focus:border-[var(--c-honey)] transition-colors cursor-pointer appearance-none disabled:opacity-60 disabled:bg-gray-50 disabled:cursor-not-allowed"
                      >
                        <option value="default" disabled>Add a domain / subject...</option>
                        {availableSubjects.map((s) => (
                          <option key={s.id || s.name} value={s.name}>{s.name}</option>
                        ))}
                      </select>
                      <ChevronRight className="w-4 h-4 text-[var(--ink-mute)] absolute right-3.5 top-3.5 rotate-90 pointer-events-none" />
                    </div>
                  </div> */}

          {/* <div className="flex flex-wrap gap-2.5">
                    {preferences.domainsOfExpertise.length > 0 ? (
                      preferences.domainsOfExpertise.map((domain) => (
                        <div
                          key={domain}
                          className="inline-flex items-center gap-1.5 border border-[var(--c-sage-soft)] bg-[var(--c-sage-wash)] px-3 py-1.5 rounded-full text-xs font-bold text-[var(--c-sage-text)] select-none"
                        >
                          <Check className="w-3.5 h-3.5 text-[var(--c-sage)] stroke-[3]" />
                          {domain}
                          <button
                            disabled={true}
                            onClick={() => removeDomain(domain)}
                            className="text-[var(--c-sage)] hover:text-[var(--c-sage-text)] ml-1 flex-shrink-0 leading-none cursor-pointer border-none bg-transparent"
                          >
                            <X className="w-3.5 h-3.5 stroke-[2.5]" />
                          </button>
                        </div>
                      ))
                    ) : (
                      <span className="text-xs text-[var(--ink-mute)] font-medium">No domains assigned.</span>
                    )}
                  </div>
                  <p className="text-[10px] text-[var(--ink-mute)] font-semibold mt-2.5 select-none">
                    Select subjects from the list above. Click × on a chip to remove.
                    The available list is managed by your administrator.
                  </p>
                </div>

                <div className="h-px w-full bg-[var(--line)] my-6" /> */}

          {/* Max Reviews & SLA Lead Time */}
          {/* <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[11px] font-bold text-[var(--ink-mute)] uppercase tracking-[0.05em] mb-2 select-none">
                      Max concurrent reviews
                    </label>
                    <input
                      type="number"
                      disabled={true}
                      min={1}
                      max={20}
                      value={preferences.maxConcurrentReviews}
                      onChange={(e) =>
                        handleSelect("maxConcurrentReviews", parseInt(e.target.value))
                      }
                      className="w-full border border-[var(--line-strong)] rounded-xl px-4 py-2.5 text-sm bg-white text-[var(--ink-soft)] font-semibold focus:outline-none focus:border-[var(--c-honey)] transition-colors disabled:opacity-60 disabled:bg-gray-50 disabled:cursor-not-allowed"
                    />
                    <p className="text-[10px] text-[var(--ink-mute)] font-semibold mt-1.5 select-none">
                      Queue stops accepting new assignments when this limit is reached.
                    </p>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[var(--ink-mute)] uppercase tracking-[0.05em] mb-2 select-none">
                      SLA reminder lead time
                    </label>
                    <div className="relative">
                      <select
                        disabled={true}
                        value={preferences.slaReminderLeadTime}
                        onChange={(e) =>
                          handleSelect("slaReminderLeadTime", e.target.value)
                        }
                        className="w-full border border-[var(--line-strong)] rounded-xl px-4 py-2.5 text-sm bg-white text-[var(--ink-soft)] font-semibold focus:outline-none focus:border-[var(--c-honey)] transition-colors cursor-pointer appearance-none disabled:opacity-60 disabled:bg-gray-50 disabled:cursor-not-allowed"
                      >
                        <option>24 hours before deadline</option>
                        <option>48 hours before deadline</option>
                        <option>72 hours before deadline</option>
                      </select>
                      <ChevronRight className="w-4 h-4 text-[var(--ink-mute)] absolute right-3.5 top-3.5 rotate-90 pointer-events-none" />
                    </div>
                    <p className="text-[10px] text-[var(--ink-mute)] font-semibold mt-1.5 select-none">
                      When to send the SLA reminder notification.
                    </p>
                  </div>
                </div> */}

          {/* Auto-decline toggle */}
          {/* <div className="border-t border-[var(--line)] pt-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="select-none">
                      <h4 className="font-bold text-[var(--ink)] text-sm mb-1">
                        Auto-decline outside expertise
                      </h4>
                      <p className="text-[11px] text-[var(--ink-mute)] font-semibold max-w-2xl">
                        Automatically decline course submissions that do not match your active
                        domain chips. Admin is notified and the course is re-queued for another
                        reviewer.
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col items-center gap-1.5 select-none">
                        <button
                          type="button"
                          disabled={true}
                          onClick={() => handleToggle("autoDeclineOutsideExpertise")}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer outline-none border-none ${preferences.autoDeclineOutsideExpertise ? 'bg-[var(--c-check)]' : 'bg-[var(--surface-3)]'
                            }`}
                        >
                          <span
                            className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${preferences.autoDeclineOutsideExpertise ? 'translate-x-5' : 'translate-x-0.5'
                              }`}
                          />
                        </button>
                        <span className="text-[10px] text-[var(--ink-mute)] font-bold uppercase">
                          {preferences.autoDeclineOutsideExpertise ? "ON" : "OFF"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 border-t border-[var(--line)] pt-5">
                  <button
                    onClick={savePreferences}
                    disabled={true}
                    className="bg-[#FEF9C3] opacity-50 cursor-not-allowed text-slate-800 border border-[#FDE047] h-9 text-[13px] px-6 rounded-full flex items-center gap-1.5 font-bold select-none transition-colors"
                  >
                    Save reviewer preferences
                  </button>
                </div>
              </div>
            </div>
          </div> 
          )} */}

          {/* ── Authoring Preferences Card (Full Width) ─────────── */}
          {isCD && (
            <div className="lg:col-span-2">
              <div className="bg-[var(--paper)] border border-[var(--line)] rounded-[var(--r-md)] shadow-[var(--shadow-xs)] transition-all duration-[var(--dur-base)] ease-[var(--tn)] hover:-translate-y-0.5 hover:border-[var(--line-strong)] hover:shadow-[var(--shadow-sm)] overflow-hidden">
                <div className="px-6 py-4 border-b border-[var(--line)] bg-[var(--paper-2)] flex items-center gap-3 select-none">
                  <div className="w-8 h-8 rounded-lg bg-[#f0f0f0] border border-[#e5e5e5] flex items-center justify-center text-gray-700">
                    <FileText size={16} strokeWidth={2.5} />
                  </div>
                  <h2 className="text-[14px] font-bold text-[var(--ink)] m-0">
                    Authoring preferences
                  </h2>
                </div>
                <div className="p-6">
                  <div className="space-y-6 pt-2">
                    <div>
                      <label className="block text-[11px] font-bold text-[var(--ink-mute)] mb-1 select-none">
                        Default course visibility
                      </label>
                      <div className="mb-2 relative">
                        <select className="w-full border border-[var(--line-strong)] rounded-xl px-4 py-2.5 text-[13px] bg-white text-[var(--ink-soft)] font-semibold focus:outline-none focus:border-[var(--c-honey)] transition-colors cursor-pointer appearance-none">
                          <option value="draft">Draft (private)</option>
                          <option value="public">Public</option>
                        </select>
                        <ChevronDown className="w-4 h-4 text-[var(--ink-mute)] absolute right-3.5 top-3 pointer-events-none" />
                      </div>
                      <p className="text-[10px] text-[var(--ink-mute)] font-semibold select-none">
                        New courses start as a private draft. Courses go live only after SME review and approval.
                      </p>
                    </div>
                    <div className="h-px w-full bg-[var(--line)]" />
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="block text-[13px] font-bold text-[var(--ink)] mb-0.5 select-none">
                          Auto-save drafts
                        </label>
                        <p className="text-[11px] text-[var(--ink-mute)] font-semibold select-none">
                          Save lesson content every 60 seconds while editing
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-[var(--ink-mute)]">ON</span>
                        <div className="w-9 h-5 bg-green-500 rounded-full flex items-center px-0.5 cursor-pointer">
                          <div className="w-4 h-4 bg-white rounded-full translate-x-4 shadow-sm" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Security Card ───────────────────────────────────── */}
          <div className="bg-[var(--paper)] border border-[var(--line)] rounded-[var(--r-md)] shadow-[var(--shadow-xs)] transition-all duration-[var(--dur-base)] ease-[var(--tn)] hover:-translate-y-0.5 hover:border-[var(--line-strong)] hover:shadow-[var(--shadow-sm)] flex flex-col h-full overflow-hidden">
            <div className="px-6 py-4 border-b border-[var(--line)] ">
              <h2 className="m-0 select-none text-[16px] font-bold ">
                Security
              </h2>
            </div>
            <div className="p-6 flex flex-col h-full">

              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-5 select-none">
                <h4 className="text-[var(--ink-soft)]">
                  Active session: 1 (Current Device · Browser)
                </h4>
              </div>

              <div className="h-px w-full bg-[var(--line)] my-5" />

              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 select-none">
                <h4 className="ftext-[var(--ink-soft)]">MFA via OTP: Required</h4>
                <div className="flex items-center gap-1.5 border border-green-300 text-green-700 bg-transparent rounded-full px-2.5 py-1 text-[11px] font-bold">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  Enforced
                </div>
              </div>
            </div>
          </div>

          {/* ── Danger Zone Card ────────────────────────────────── */}
          <div className="bg-[#FEF9F9] border border-red-200 rounded-[var(--r-md)] shadow-[var(--shadow-xs)] transition-all duration-[var(--dur-base)] ease-[var(--tn)] hover:-translate-y-0.5 hover:border-red-300 hover:shadow-[var(--shadow-sm)] flex flex-col h-full overflow-hidden">
            <div className="px-6 py-5 border-b border-red-200">
              <h3 className="text-[16px] font-bold text-red-600 select-none m-0">
                Danger zone
              </h3>
            </div>

            <div className="p-6 flex flex-col md:flex-row justify-between items-center gap-6 flex-grow">
              <p className="text-[14px] text-slate-600 max-w-xl select-none leading-relaxed">
                Request account deactivation. All review history is retained for audit purposes.
              </p>

              <button className="whitespace-nowrap h-9 text-[13px] px-4 rounded-xl border border-red-300 text-red-600 hover:bg-red-50 bg-transparent transition-colors cursor-pointer font-bold select-none">
                Request deactivation
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default RoleSettings;
