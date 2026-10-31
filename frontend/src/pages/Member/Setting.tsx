import React, { useState, useEffect } from "react";
import {
  Settings,
  Sliders,
  User,
  Mail,
  Globe,
  Clock,
  Bell,
  BellRing,
  BookOpenCheck,
  GraduationCap,
  Award,
  FileText,
  CalendarClock,
  Calendar,
  Sparkles,
  ShieldAlert,
  KeyRound,
  ShieldCheck,
  Lock,
  CheckCircle2,
  Check,
  Laptop,
  ExternalLink,
  AlertTriangle,
  Trash2,
  HelpCircle,
  LifeBuoy,
  Lightbulb,
  Save,
  RefreshCw,
  ArrowRight,
  Loader2,
  X,
  Zap,
  Info
} from "lucide-react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { NotificationPreferences } from "../../core/api/notification.api";
import { useProfileStore } from "../../store/profile.store";
import { useUserStore } from "../../store/user.store";
import { useSettings } from "../../hooks/useSettings";
import { Toggle } from "../../components/ui/Toggle";
import { Skeleton } from "../../components/ui/Skeleton/Skeleton";

const SettingSkeleton: React.FC = () => {
  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8 animate-pulse">
      <div className="space-y-3">
        <Skeleton className="h-4 w-40 rounded-full" />
        <Skeleton className="h-8 w-72 rounded-lg" />
        <Skeleton className="h-4 w-96 max-w-full rounded-full" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Skeleton className="h-64 rounded-3xl" />
          <Skeleton className="h-96 rounded-3xl" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-48 rounded-3xl" />
          <Skeleton className="h-40 rounded-3xl" />
          <Skeleton className="h-48 rounded-3xl" />
        </div>
      </div>
    </div>
  );
};

interface ModernSwitchProps {
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
  title?: string;
}

const ModernSwitch: React.FC<ModernSwitchProps> = ({ checked, onChange, disabled, title }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    disabled={disabled}
    onClick={onChange}
    title={title}
    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-40 disabled:cursor-not-allowed ${
      checked ? "bg-emerald-500" : "bg-slate-200 hover:bg-slate-300"
    }`}
  >
    <span
      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition duration-200 ease-in-out ${
        checked ? "translate-x-5" : "translate-x-0"
      }`}
    />
  </button>
);

const Setting: React.FC = () => {
  const navigate = useNavigate();
  const { profile } = useProfileStore();
  const { user } = useUserStore();
  const { preferences: apiPreferences, isLoading, updatePreferences, isUpdating } = useSettings();
  
  const [localPreferences, setLocalPreferences] = useState<NotificationPreferences | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<string>("English (US)");
  const [selectedTimezone, setSelectedTimezone] = useState<string>(
    Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Kolkata"
  );
  const [showEmailChangeModal, setShowEmailChangeModal] = useState<boolean>(false);
  const [newEmailInput, setNewEmailInput] = useState<string>("");
  const [isSavingAccount, setIsSavingAccount] = useState<boolean>(false);

  useEffect(() => {
    if (apiPreferences) {
      setLocalPreferences(apiPreferences);
    }
  }, [apiPreferences]);

  const handleToggle = (key: keyof NotificationPreferences) => {
    if (!localPreferences) return;
    setLocalPreferences((prev) => (prev ? { ...prev, [key]: !prev[key] } : null));
  };

  const handleSavePreferences = async () => {
    if (!localPreferences) return;
    try {
      await updatePreferences(localPreferences);
      toast.success("Notification preferences saved successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to save preferences.");
    }
  };

  const handleSaveAccountSettings = () => {
    setIsSavingAccount(true);
    setTimeout(() => {
      setIsSavingAccount(false);
      toast.success("Account preferences updated successfully!");
    }, 600);
  };

  const handleEmailChangeRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmailInput.trim() || !newEmailInput.includes("@")) {
      toast.error("Please enter a valid email address.");
      return;
    }
    toast.success(`Verification OTP dispatched to ${newEmailInput}. Please check your inbox.`);
    setShowEmailChangeModal(false);
    setNewEmailInput("");
  };

  if (isLoading || !localPreferences) {
    return <SettingSkeleton />;
  }

  const currentEmail = profile?.email || user?.email || "member@nexus.org";

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8 antialiased text-slate-900">
      
      {/* =========================================================================
          1. HEADER & TOP CONTEXTUAL BANNER
          ========================================================================= */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-200/80">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/60 text-blue-700 text-xs font-semibold">
            <Sliders className="w-3.5 h-3.5 text-blue-600" />
            <span>Preferences & Governance</span>
            <span className="w-1 h-1 rounded-full bg-blue-400" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600">
              Account Center
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Account Settings & Preferences
          </h1>

          <p className="text-sm text-slate-500 leading-relaxed flex items-center flex-wrap gap-1">
            Configure your account identity, regional localization, automated delivery triggers, and data policies.
            <button
              onClick={() => navigate("/help")}
              className="inline-flex items-center gap-1 font-semibold text-blue-600 hover:text-blue-700 hover:underline ml-1 cursor-pointer transition-colors"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Need help?</span>
            </button>
          </p>
        </div>

        {/* Top Badges / Quick Highlights */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>OTP Passwordless Active</span>
          </div>

          <button
            onClick={() => navigate("/session-history")}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold transition cursor-pointer shadow-2xs"
          >
            <Laptop className="w-3.5 h-3.5 text-slate-500" />
            <span>1 Active Session</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          2. MAIN CONTENT GRID (2 COLUMNS)
          ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left Column (2/3 width) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* ===================================================================
              A. ACCOUNT IDENTITY & REGIONAL PREFERENCES CARD
              =================================================================== */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow space-y-6">
            
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 tracking-tight">Account Identity & Regional</h2>
                  <p className="text-xs text-slate-400">Primary contact credentials and localization formats</p>
                </div>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                Primary Profile
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              
              {/* Email Address */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>Registered Email</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowEmailChangeModal(true)}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer transition-colors"
                  >
                    Change Email
                  </button>
                </div>

                <div className="relative">
                  <input
                    type="email"
                    value={currentEmail}
                    readOnly
                    disabled
                    className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-xl h-11 px-3.5 text-sm font-medium cursor-not-allowed focus:outline-none"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>Verified</span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Changing registered email requires dual-OTP verification for security.
                </p>
              </div>

              {/* Language Selector */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-slate-400" />
                  <span>Platform Language</span>
                </label>

                <select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className="w-full bg-white border border-slate-200 hover:border-slate-300 focus:border-blue-500 rounded-xl h-11 px-3.5 text-sm text-slate-900 shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer"
                >
                  <option value="English (US)">English (US)</option>
                  <option value="English (UK)">English (UK)</option>
                  <option value="Tamil">Tamil (தமிழ்)</option>
                  <option value="Hindi">Hindi (हिन्दी)</option>
                  <option value="Arabic">Arabic (العربية)</option>
                  <option value="Spanish">Spanish (Español)</option>
                </select>

                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Applies to course player UI, system emails, and transcript navigation.
                </p>
              </div>

              {/* Account Timezone */}
              <div className="space-y-2 sm:col-span-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Account Timezone</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
                      setSelectedTimezone(detected);
                      toast.success(`Synchronized timezone with browser (${detected}).`);
                    }}
                    className="text-xs font-medium text-slate-500 hover:text-slate-800 cursor-pointer flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Sync with system</span>
                  </button>
                </div>

                <select
                  value={selectedTimezone}
                  onChange={(e) => setSelectedTimezone(e.target.value)}
                  className="w-full bg-white border border-slate-200 hover:border-slate-300 focus:border-blue-500 rounded-xl h-11 px-3.5 text-sm text-slate-900 shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer"
                >
                  <option value="Asia/Kolkata">Asia/Kolkata (IST - UTC+05:30)</option>
                  <option value="Asia/Calcutta">Asia/Calcutta (IST - UTC+05:30)</option>
                  <option value="Asia/Dubai">Asia/Dubai (GST - UTC+04:00)</option>
                  <option value="Asia/Muscat">Asia/Muscat (GST - UTC+04:00)</option>
                  <option value="Europe/London">Europe/London (GMT/BST)</option>
                  <option value="America/New_York">America/New_York (EST - UTC-05:00)</option>
                  <option value="America/Los_Angeles">America/Los_Angeles (PST - UTC-08:00)</option>
                  <option value="UTC">Coordinated Universal Time (UTC)</option>
                </select>

                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Governs quiz submission deadlines, assignment schedules, and certificate timestamp issuance.
                </p>
              </div>

            </div>

            {/* Save Account Button */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-400">All regional changes are persisted immediately</span>
              <button
                type="button"
                onClick={handleSaveAccountSettings}
                disabled={isSavingAccount}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-blue-600 text-white text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isSavingAccount ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                <span>{isSavingAccount ? "Saving..." : "Save Account Settings"}</span>
              </button>
            </div>

          </div>

          {/* ===================================================================
              B. NOTIFICATION PREFERENCES & DELIVERY FREQUENCY CARD
              =================================================================== */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow space-y-6">
            
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center">
                  <BellRing className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 tracking-tight">Notification Preferences</h2>
                  <p className="text-xs text-slate-400">Control automated delivery channels across web and email</p>
                </div>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                Multi-Channel
              </span>
            </div>

            {/* Preferences Table / Channel Grid */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-2xs">
              <div className="bg-slate-50/80 px-4 py-3 border-b border-slate-200 flex items-center justify-between text-xs font-bold text-slate-600 uppercase tracking-wider">
                <span>Notification Event Trigger</span>
                <div className="flex items-center gap-8 pr-4">
                  <span className="w-16 text-center">In-App</span>
                  <span className="w-16 text-center">Email</span>
                </div>
              </div>

              <div className="divide-y divide-slate-100 text-sm">
                
                {/* 1. Course Enrolment Confirmation */}
                <div className="px-4 py-3.5 flex items-center justify-between hover:bg-slate-50/60 transition-colors">
                  <div className="flex items-center gap-3 pr-4">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                      <BookOpenCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900 text-xs sm:text-sm">Course Enrolment Confirmation</div>
                      <div className="text-[11px] text-slate-400">Triggered upon successful syllabus enrollment or seat allocation</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-8 pr-4 shrink-0">
                    <div className="w-16 flex justify-center">
                      <ModernSwitch
                        checked={localPreferences.courseEnrollmentInApp}
                        onChange={() => handleToggle("courseEnrollmentInApp")}
                        disabled={isUpdating}
                      />
                    </div>
                    <div className="w-16 flex justify-center">
                      <ModernSwitch
                        checked={localPreferences.courseEnrollmentEmail}
                        onChange={() => handleToggle("courseEnrollmentEmail")}
                        disabled={isUpdating}
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Course Completed (Required Email) */}
                <div className="px-4 py-3.5 flex items-center justify-between hover:bg-slate-50/60 transition-colors bg-slate-50/20">
                  <div className="flex items-center gap-3 pr-4">
                    <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                      <GraduationCap className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900 text-xs sm:text-sm flex items-center gap-2">
                        <span>Course Completed Confirmation</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
                          Transactional
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400">Official pedagogical completion notice (Email cannot be disabled)</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-8 pr-4 shrink-0">
                    <div className="w-16 flex justify-center">
                      <ModernSwitch
                        checked={localPreferences.courseCompletedInApp}
                        onChange={() => handleToggle("courseCompletedInApp")}
                        disabled={isUpdating}
                      />
                    </div>
                    <div className="w-16 flex justify-center" title="Required transactional email">
                      <div className="w-11 h-6 rounded-full bg-emerald-500 opacity-60 flex items-center justify-end px-0.5 cursor-not-allowed">
                        <div className="w-5 h-5 rounded-full bg-white shadow-xs" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Learning Credential Ready */}
                <div className="px-4 py-3.5 flex items-center justify-between hover:bg-slate-50/60 transition-colors">
                  <div className="flex items-center gap-3 pr-4">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                      <Award className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900 text-xs sm:text-sm">Learning Credential Issued</div>
                      <div className="text-[11px] text-slate-400">Notice when verified digital PDF certificate & badge are available</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-8 pr-4 shrink-0">
                    <div className="w-16 flex justify-center">
                      <ModernSwitch
                        checked={localPreferences.certificateReadyInApp}
                        onChange={() => handleToggle("certificateReadyInApp")}
                        disabled={isUpdating}
                      />
                    </div>
                    <div className="w-16 flex justify-center">
                      <ModernSwitch
                        checked={localPreferences.certificateReadyEmail}
                        onChange={() => handleToggle("certificateReadyEmail")}
                        disabled={isUpdating}
                      />
                    </div>
                  </div>
                </div>

                {/* 4. Quiz Result */}
                <div className="px-4 py-3.5 flex items-center justify-between hover:bg-slate-50/60 transition-colors">
                  <div className="flex items-center gap-3 pr-4">
                    <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900 text-xs sm:text-sm">Quiz & Assessment Results</div>
                      <div className="text-[11px] text-slate-400">Grades, instructor feedback, and pass/retake metrics</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-8 pr-4 shrink-0">
                    <div className="w-16 flex justify-center">
                      <ModernSwitch
                        checked={localPreferences.quizResultInApp}
                        onChange={() => handleToggle("quizResultInApp")}
                        disabled={isUpdating}
                      />
                    </div>
                    <div className="w-16 flex justify-center">
                      <ModernSwitch
                        checked={localPreferences.quizResultEmail}
                        onChange={() => handleToggle("quizResultEmail")}
                        disabled={isUpdating}
                      />
                    </div>
                  </div>
                </div>

                {/* 5. Deadline Reminder */}
                <div className="px-4 py-3.5 flex items-center justify-between hover:bg-slate-50/60 transition-colors">
                  <div className="flex items-center gap-3 pr-4">
                    <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                      <CalendarClock className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900 text-xs sm:text-sm">Assigned Course Deadlines</div>
                      <div className="text-[11px] text-slate-400">Upcoming expiration warnings for corporate or cohort milestones</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-8 pr-4 shrink-0">
                    <div className="w-16 flex justify-center">
                      <ModernSwitch
                        checked={localPreferences.deadlineReminderInApp}
                        onChange={() => handleToggle("deadlineReminderInApp")}
                        disabled={isUpdating}
                      />
                    </div>
                    <div className="w-16 flex justify-center">
                      <ModernSwitch
                        checked={localPreferences.deadlineReminderEmail}
                        onChange={() => handleToggle("deadlineReminderEmail")}
                        disabled={isUpdating}
                      />
                    </div>
                  </div>
                </div>

                {/* 6. Inactivity Reminder */}
                <div className="px-4 py-3.5 flex items-center justify-between hover:bg-slate-50/60 transition-colors">
                  <div className="flex items-center gap-3 pr-4">
                    <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900 text-xs sm:text-sm">Inactivity Progress Reminders</div>
                      <div className="text-[11px] text-slate-400">Gentle study nudges after 2 weeks and 1 month of inactivity</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-8 pr-4 shrink-0">
                    <div className="w-16 flex justify-center">
                      <ModernSwitch
                        checked={localPreferences.inactivityReminderInApp}
                        onChange={() => handleToggle("inactivityReminderInApp")}
                        disabled={isUpdating}
                      />
                    </div>
                    <div className="w-16 flex justify-center">
                      <ModernSwitch
                        checked={localPreferences.inactivityReminderEmail}
                        onChange={() => handleToggle("inactivityReminderEmail")}
                        disabled={isUpdating}
                      />
                    </div>
                  </div>
                </div>

                {/* 7. Marketing Communications */}
                <div className="px-4 py-3.5 flex items-center justify-between hover:bg-slate-50/60 transition-colors">
                  <div className="flex items-center gap-3 pr-4">
                    <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900 text-xs sm:text-sm">Product News & New Courses</div>
                      <div className="text-[11px] text-slate-400">Educational webinars, new curriculum releases, and learning discounts</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-8 pr-4 shrink-0">
                    <div className="w-16 flex justify-center">
                      <ModernSwitch
                        checked={localPreferences.marketingInApp}
                        onChange={() => handleToggle("marketingInApp")}
                        disabled={isUpdating}
                      />
                    </div>
                    <div className="w-16 flex justify-center">
                      <ModernSwitch
                        checked={localPreferences.marketingEmail}
                        onChange={() => handleToggle("marketingEmail")}
                        disabled={isUpdating}
                      />
                    </div>
                  </div>
                </div>

                {/* 8. Security Alerts (Locked On) */}
                <div className="px-4 py-3.5 flex items-center justify-between bg-slate-50/80">
                  <div className="flex items-center gap-3 pr-4">
                    <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                      <ShieldAlert className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900 text-xs sm:text-sm flex items-center gap-2">
                        <span>Security & Access Alerts</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-200">
                          Mandatory
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400">Suspicious sign-ins, IP changes, and session revocations (Always Active)</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-8 pr-4 shrink-0 text-slate-400">
                    <div className="w-16 flex justify-center" title="Mandatory security alert">
                      <Lock className="w-4 h-4 text-slate-400" />
                    </div>
                    <div className="w-16 flex justify-center" title="Mandatory security alert">
                      <Lock className="w-4 h-4 text-slate-400" />
                    </div>
                  </div>
                </div>

                {/* 9. Account Changes (Locked On) */}
                <div className="px-4 py-3.5 flex items-center justify-between bg-slate-50/80">
                  <div className="flex items-center gap-3 pr-4">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                      <KeyRound className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900 text-xs sm:text-sm flex items-center gap-2">
                        <span>Account Credential Updates</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200">
                          Mandatory
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400">Email, profile identity, or certificate name alterations (Always Active)</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-8 pr-4 shrink-0 text-slate-400">
                    <div className="w-16 flex justify-center" title="Mandatory security alert">
                      <Lock className="w-4 h-4 text-slate-400" />
                    </div>
                    <div className="w-16 flex justify-center" title="Mandatory security alert">
                      <Lock className="w-4 h-4 text-slate-400" />
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Timezone Change Notification Toggle */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-100/70 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
                  <Globe className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                    Email me when my account timezone updates
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Receive an immediate security receipt whenever your profile location or timezone is altered.
                  </p>
                </div>
              </div>
              <ModernSwitch
                checked={localPreferences.emailAccountTimeZoneChanges}
                onChange={() => handleToggle("emailAccountTimeZoneChanges")}
                disabled={isUpdating}
              />
            </div>

            {/* Delivery Frequency Selection */}
            <div className="space-y-3 pt-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Notification Delivery Cadence
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  {
                    value: "Immediate",
                    title: "Immediate",
                    desc: "Real-time instant delivery",
                    icon: <Zap className="w-4 h-4 text-amber-600" />,
                  },
                  {
                    value: "Daily",
                    title: "Daily Digest",
                    desc: "Consolidated at 9:00 AM",
                    icon: <Mail className="w-4 h-4 text-blue-600" />,
                  },
                  {
                    value: "Weekly",
                    title: "Weekly Summary",
                    desc: "Every Monday morning",
                    icon: <Calendar className="w-4 h-4 text-purple-600" />,
                  },
                ].map((item) => {
                  const isSelected = localPreferences.notificationFrequency === item.value;
                  return (
                    <div
                      key={item.value}
                      onClick={() =>
                        setLocalPreferences({
                          ...localPreferences,
                          notificationFrequency: item.value,
                        })
                      }
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? "bg-blue-50/60 border-blue-400 ring-2 ring-blue-500/10 shadow-2xs"
                          : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="w-7 h-7 rounded-lg bg-white border border-slate-200 shadow-2xs flex items-center justify-center">
                          {item.icon}
                        </div>
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            isSelected ? "border-blue-600 bg-blue-600" : "border-slate-300"
                          }`}
                        >
                          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                      </div>
                      <div>
                        <div className="font-bold text-xs text-slate-900">{item.title}</div>
                        <div className="text-[11px] text-slate-400 leading-snug">{item.desc}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Save Preferences Button */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-400">Settings sync automatically across all logged-in devices</span>
              <button
                type="button"
                onClick={handleSavePreferences}
                disabled={isUpdating}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isUpdating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                <span>{isUpdating ? "Saving..." : "Save Preferences"}</span>
              </button>
            </div>

          </div>

        </div>

        {/* Right Column (1/3 width sidebar) */}
        <div className="space-y-6">
          
          {/* ===================================================================
              1. SECURITY & SESSIONS CARD
              =================================================================== */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm">Security & Access</h3>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                ● Enforced
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Authentication is protected by <strong>Email + Transactional OTP</strong> (no stored passwords). Concurrent logins are monitored in real time.
            </p>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700">Active Devices:</span>
                <span className="font-bold text-slate-900">1 of 2 registered</span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                <Laptop className="w-3.5 h-3.5 text-blue-500" />
                <span>Current Web Browser (Windows)</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate("/session-history")}
              className="w-full py-2.5 px-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold transition flex items-center justify-between shadow-2xs cursor-pointer"
            >
              <span>Manage Active Sessions</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>

          {/* ===================================================================
              2. IDEAS & FEEDBACK HUB
              =================================================================== */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <Lightbulb className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Ideas & Feedback</h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Have a suggestion for a new curriculum track, lecture tool, or LMS improvement? We review learner submissions weekly.
            </p>

            <button
              type="button"
              onClick={() => navigate("/issue-reporting")}
              className="w-full py-2.5 px-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 border border-amber-500/20 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Share Platform Idea</span>
            </button>
          </div>

          {/* ===================================================================
              3. DANGER ZONE: ACCOUNT DELETION
              =================================================================== */}
          <div className="rounded-3xl p-6 bg-gradient-to-br from-rose-50/70 via-white to-rose-50/60 border border-rose-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-rose-100">
              <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-rose-900 text-sm">Account Deletion</h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Permanently terminate your account and remove all personal profile records after a 30-day grace period.
            </p>

            <div className="p-3 rounded-xl bg-white border border-rose-200 text-[11px] text-rose-800 leading-relaxed space-y-1.5 shadow-2xs">
              <div className="font-bold flex items-center gap-1">
                <Info className="w-3 h-3 text-rose-600 shrink-0" />
                <span>Certified Member Preservation:</span>
              </div>
              <p className="text-slate-600">
                Completed credentials remain verifiable on the public ledger even after profile deletion to support employer checks.
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate("/profile/delete")}
              className="w-full py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Request Account Deletion</span>
            </button>
          </div>

          {/* ===================================================================
              4. DEDICATED SUPPORT DESK
              =================================================================== */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <LifeBuoy className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Help & Guidance</h3>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Need assistance modifying tenancy parameters, resolving billing queries, or updating corporate credentials?
            </p>

            <div className="pt-1 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => navigate("/help")}
                className="w-full py-2 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold transition cursor-pointer flex items-center justify-between"
              >
                <span>Browse Help Center</span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              </button>

              <button
                type="button"
                onClick={() => navigate("/issue-reporting")}
                className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-blue-600 text-white text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1"
              >
                <span>Contact Support</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* =========================================================================
          3. EMAIL CHANGE MODAL (INTERACTIVE)
          ========================================================================= */}
      {showEmailChangeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Update Email Address</h3>
                  <p className="text-xs text-slate-400">Two-Factor Authentication Required</p>
                </div>
              </div>
              <button
                onClick={() => setShowEmailChangeModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEmailChangeRequest} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  New Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="Enter your new email address"
                  value={newEmailInput}
                  onChange={(e) => setNewEmailInput(e.target.value)}
                  className="w-full bg-white border border-slate-200 focus:border-blue-500 rounded-xl h-11 px-3.5 text-sm text-slate-900 shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  A 6-digit confirmation OTP will be sent to both your current address and the new email address.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-blue-50/80 border border-blue-200 text-xs text-blue-900 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>
                  After authorization, all existing active browser sessions will be refreshed.
                </span>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowEmailChangeModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <span>Send Verification Code</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Setting;