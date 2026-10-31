import React, { useState, useRef } from "react";
import { useNavigate } from "react-router";
import { Button } from "../../components/ui/Button";
import { useProfile } from "../../hooks/profile/useProfile";
import { getSessionsApi } from "../../core/api/auth.api";
import { Skeleton } from "../../components/ui/Skeleton";
import { getTenantByIdApi, Tenant } from "../../core/api/tenant.api";
import { getIndustriesApi } from "../../core/api/industry.api";
import { Spinner } from "../../components/ui/Spinner";
import ProfileVerifyOTP from "../../components/common/profile/ProfileVerifyOTP";

// ─── helpers ─────────────────────────────────────────────────────────────────

const getTenantId = (): string => {
  try {
    const stored = localStorage.getItem("keycloak_session_user");
    if (!stored) return "";
    const parsed = JSON.parse(stored);
    const user = parsed?.user || parsed;
    return user?.tenantId || user?.tenant?.id || user?.organizationId || "";
  } catch {
    return "";
  }
};

// ─── small reusable primitives ────────────────────────────────────────────────

/** Uppercase tracking label, matches the design's field-label style */
const FieldLabel: React.FC<{ children: React.ReactNode; optional?: boolean }> = ({
  children,
  optional,
}) => (
  <label className="block font-sans text-[12px] font-bold tracking-[0.12em] uppercase text-[#5c5c5c] mb-[6px]">
    {children}
    {optional && (
      <span className="ml-1 normal-case font-normal text-[#8c8c8c] tracking-normal">
        (optional)
      </span>
    )}
  </label>
);

/** Standard text input */
const FieldInput: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = ({
  className = "",
  ...props
}) => (
  <input
    className={[
      "w-full h-[40px] px-[14px] font-sans text-[16px] text-[#141414] bg-[#fff]",
      "border border-[#11111129] rounded-[8px] transition-all",
      "placeholder:text-[#8c8c8c]",
      "focus:border-[#5c5c5c] focus:outline-none focus:ring-[4px] focus:ring-[#1111110d]",
      "disabled:bg-[#f5f5f5] disabled:text-[#8c8c8c] disabled:cursor-not-allowed",
      className,
    ].join(" ")}
    {...props}
  />
);

/** Standard select */
const FieldSelect: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = ({
  className = "",
  children,
  ...props
}) => (
  <div className="relative">
    <select
      className={[
        "w-full h-[40px] px-[14px] pr-[36px] font-sans text-[16px] text-[#141414] bg-[#fff]",
        "border border-[#11111129] rounded-[8px] appearance-none cursor-pointer transition-all",
        "focus:border-[#5c5c5c] focus:outline-none focus:ring-[4px] focus:ring-[#1111110d]",
        className,
      ].join(" ")}
      {...props}
    >
      {children}
    </select>
    <svg
      className="pointer-events-none absolute right-[12px] top-1/2 -translate-y-1/2 text-[#5c5c5c]"
      width="14"
      height="14"
      viewBox="0 0 20 20"
      fill="currentColor"
    >
      <path
        fillRule="evenodd"
        d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
        clipRule="evenodd"
      />
    </svg>
  </div>
);

/** Card shell */
const Card: React.FC<{
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "danger" | "readonly";
}> = ({ children, className = "", variant = "default" }) => {
  const map = {
    default: "border-[#1111111a] bg-[#fff]",
    danger: "border-[#f2c7c7] bg-[#f7d9d4]",
    readonly: "border-[#1111111a] bg-[#f9f9f8]",
  };
  return (
    <div
      className={`rounded-[14px] border overflow-hidden ${
        variant !== "readonly" 
          ? "shadow-[0_4px_16px_-4px_rgba(42,17,8,0.1)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_24px_-4px_rgba(42,17,8,0.15)]"
          : ""
      } ${map[variant]} ${className}`}
    >
      {children}
    </div>
  );
};

/** Card header row */
const CardHead: React.FC<{
  title: string;
  badge?: React.ReactNode;
  danger?: boolean;
}> = ({ title, badge, danger }) => (
  <div
    className={`flex items-center justify-between px-[28px] py-[18px] pb-[16px] border-b ${
      danger ? "border-[#f5c4c4]" : "border-[#1111111a]"
    }`}
  >
    <span
      className={`font-sans text-[16px] font-bold ${
        danger ? "text-[#c12a1c]" : "text-[#141414]"
      }`}
    >
      {title}
    </span>
    {badge}
  </div>
);

/** Inline status chip */
const Chip: React.FC<{
  children: React.ReactNode;
  variant?: "muted" | "honey";
}> = ({ children, variant = "muted" }) => {
  const map = {
    muted: "bg-surface-3 text-ink-soft border-line",
    honey: "bg-honey-wash text-honey-text border-honey-soft",
  };
  return (
    <span
      className={`inline-flex items-center rounded-pill border px-2.5 py-0.5 text-[10px] font-bold tracking-widest uppercase ${map[variant]}`}
    >
      {children}
    </span>
  );
};

/** Checkbox row — matches design: full-row green wash when checked */
const CheckRow: React.FC<{
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  card?: boolean;
  hideCheckbox?: boolean;
}> = ({ label, description, checked, onChange, card, hideCheckbox }) => (
  <label
    className={[
      "flex items-center gap-[12px] cursor-pointer select-none transition-colors duration-150",
      card
        ? `rounded-[10px] border px-[16px] py-[14px] ${
            checked
              ? "bg-[#eaf3ec] border-[#b6d9c0]"
              : "bg-[#fff] border-[#11111129] hover:bg-[#f6f6f4]"
          }`
        : `py-[14px] border-b border-[#1111111a] last:border-0 ${
            checked ? "bg-[#eaf3ec] -mx-[28px] px-[28px]" : "hover:bg-[#f9f9f8]"
          }`,
    ].join(" ")}
  >
    {/* custom checkbox */}
    {!hideCheckbox && (
      <span
        className={[
          "flex-shrink-0 flex h-[18px] w-[18px] items-center justify-center rounded-[4px] border-[1.5px] transition-colors duration-150",
          checked
            ? "bg-[#3d7a52] border-[#3d7a52]"
            : "border-[#11111129] bg-[#fff]",
        ].join(" ")}
      >
        {checked && (
          <svg
            viewBox="0 0 12 10"
            fill="none"
            className="h-[10px] w-[10px] text-white"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="1 5 4.5 8.5 11 1" />
          </svg>
        )}
      </span>
    )}
    <span className="flex flex-col gap-[2px] flex-1 justify-center">
      <span className={`font-sans text-[16px] font-medium leading-snug ${checked ? "text-[#1f4d2e]" : "text-[#141414]"}`}>
        {label}
      </span>
      {description && (
        <span className="font-sans text-[12px] text-[#5c5c5c] leading-snug">
          {description}
        </span>
      )}
    </span>
    {checked && (
      <span className="font-sans text-[13px] font-bold text-[#3d7a52]">Active</span>
    )}
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      className="sr-only"
    />
  </label>
);

/** Horizontal info / action row */
const SecRow: React.FC<{
  text: React.ReactNode;
  action?: React.ReactNode;
  borderless?: boolean;
}> = ({ text, action, borderless }) => (
  <div
    className={`flex items-center justify-between gap-4 py-3.5 ${
      borderless ? "" : "border-b border-line last:border-0"
    }`}
  >
    <span className="text-[16px] text-ink leading-snug">{text}</span>
    {action}
  </div>
);

// ─── toast ────────────────────────────────────────────────────────────────────

const Toast: React.FC<{ message: string; visible: boolean }> = ({
  message,
  visible,
}) => (
  <div
    aria-live="polite"
    role="status"
    className={[
      "fixed bottom-6 left-1/2 -translate-x-1/2 z-50",
      "flex items-center gap-2 rounded-pill px-5 py-2.5",
      "bg-ink text-paper text-[13px] font-medium shadow-hover",
      "transition-all duration-300",
      visible
        ? "opacity-100 translate-y-0"
        : "opacity-0 translate-y-3 pointer-events-none",
    ].join(" ")}
  >
    <svg
      className="h-4 w-4 text-sage"
      viewBox="0 0 20 20"
      fill="currentColor"
    >
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
        clipRule="evenodd"
      />
    </svg>
    {message}
  </div>
);

// ─── main page ────────────────────────────────────────────────────────────────

const AdminSettings: React.FC = () => {
  const navigate = useNavigate();
  const { profile, getProfile, saveProfile } = useProfile();
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [showOTPModal, setShowOTPModal] = useState(false);

  /* account */
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [language, setLanguage] = useState("English");
  const [mobile, setMobile] = useState("");
  const [sessions, setSessions] = useState<any[]>([]);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [industryName, setIndustryName] = useState<string>("Loading...");

  const tenantId = getTenantId();

  React.useEffect(() => {
    if (tenantId) {
      getTenantByIdApi(tenantId).then(t => {
        setTenant(t);
        if (t.industryId) {
          getIndustriesApi().then(industries => {
            const ind = industries.find(i => i.id === t.industryId);
            if (ind) setIndustryName(ind.name);
            else setIndustryName("Unknown");
          }).catch(err => {
            console.error("Failed to fetch industries", err);
            setIndustryName("Unknown");
          });
        } else {
          setIndustryName("Unknown");
        }
      }).catch(err => {
        console.error("Failed to fetch tenant details", err);
        setIndustryName("Unknown");
      });
    }
  }, [tenantId]);

  React.useEffect(() => {
    Promise.all([
      getProfile(),
      getSessionsApi().then(res => {
        setSessions(res.data || []);
      })
    ]).catch(err => console.error(err))
      .finally(() => setIsPageLoading(false));
  }, [getProfile]);

  React.useEffect(() => {
    if (profile) {
      const p = profile.profile || {};
      setFirstName(p.firstName || "");
      setLastName(p.lastName || "");
      setEmail(profile.email || "");
      setLanguage(profile.preferences?.preferredLanguage || "English");
      setMobile(p.mobileNumber || "");
    }
  }, [profile]);

  /* notification prefs */
  const [notifs, setNotifs] = useState({
    inviteAccepted: true,
    courseCompletion: true,
    weeklySummary: true,
    seatAlerts: false,
    deadlineReminders: true,
    sendInApp: true,
    sendEmail: true,
  });


  /* toast */
  const [toast, setToast] = useState({ visible: false, message: "" });
  const showToast = (msg: string) => {
    setToast({ visible: true, message: msg });
    setTimeout(() => setToast({ visible: false, message: "" }), 3000);
  };

  if (isPageLoading) {
    return (
      <div className="flex flex-col gap-5 w-full">
        {/* Header skeleton */}
        <div className="mb-6">
          <Skeleton className="h-3 w-48 mb-[6px]" />
          <Skeleton className="h-8 w-32 mb-[6px]" />
          <Skeleton className="h-4 w-64" />
        </div>

        {/* Account Card Skeleton */}
        <div className="bg-white border border-[#1111111a] rounded-[14px] overflow-hidden">
          <div className="flex items-center justify-between px-[28px] py-[18px] pb-[16px] border-b border-[#1111111a]">
            <Skeleton className="h-5 w-24" />
          </div>
          <div className="p-[24px] px-[28px] pb-[28px]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-[24px] gap-y-[18px] mb-[22px]">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i}>
                  <Skeleton className="h-4 w-20 mb-2" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </div>
            <Skeleton className="h-[40px] w-32 mt-4 rounded-full" />
          </div>
        </div>

        {/* Notification Preferences Skeleton */}
        <div className="bg-white border border-[#1111111a] rounded-[14px] overflow-hidden">
          <div className="flex items-center justify-between px-[28px] py-[18px] pb-[16px] border-b border-[#1111111a]">
            <Skeleton className="h-5 w-48" />
          </div>
          <div className="px-[28px] pt-[20px] pb-[20px] flex flex-col gap-[10px]">
             {[1, 2, 3, 4, 5].map((i) => (
               <Skeleton key={i} className="h-12 w-full rounded-lg mb-1" />
             ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* ── page head ── */}
      <div className="mb-6">
        <p className="font-sans text-[12px] tracking-[0.08em] uppercase text-[#5c5c5c] font-semibold mb-[6px]">
          Nexus Corporate · Org Admin
        </p>
        <h1 className="font-sans text-[24px] text-[#141414] font-bold leading-[1.2] m-0 mb-[6px]">Settings</h1>
        <p className="text-[16px] text-[#5c5c5c] leading-[1.55] m-0">
          Personal account settings in Nexus Corporate.
        </p>
      </div>

      <div className="flex flex-col gap-5 w-full">

        {/* ═══ 1. Account ═══ */}
        <Card>
          <CardHead title="Account" />
          <div className="p-[24px] px-[28px] pb-[28px]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-[24px] gap-y-[18px] mb-[22px]">
              <div>
                <FieldLabel>First name</FieldLabel>
                <FieldInput
                  id="cset-firstname"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>
              <div>
                <FieldLabel>Last name</FieldLabel>
                <FieldInput
                  id="cset-lastname"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
              <div>
                <FieldLabel>Email</FieldLabel>
                <FieldInput id="cset-email" value={email} disabled type="email" />
              </div>
              <div>
                <FieldLabel>Language</FieldLabel>
                <FieldInput id="cset-lang" value="English" disabled />
              </div>
              <div>
                <FieldLabel optional>Mobile</FieldLabel>
                <FieldInput
                  id="cset-mobile"
                  type="tel"
                  placeholder="+968 XXXX XXXX"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                />
              </div>
            </div>
            <button
              onClick={async () => {
                if (isSavingProfile) return;
                setIsSavingProfile(true);
                try {
                  const result = await saveProfile({
                    firstName: firstName.trim() || undefined,
                    lastName: lastName.trim() || undefined,
                    preferredLanguage: language,
                    mobileNumber: mobile.trim() || undefined
                  });
                  if (result?.otpRequired) {
                    setShowOTPModal(true);
                  } else {
                    showToast("Account settings saved.");
                  }
                } catch (e: any) {
                  const errorMsg = e?.response?.data?.message || e?.message || "Failed to save account settings.";
                  showToast(errorMsg);
                } finally {
                  setIsSavingProfile(false);
                }
              }}
              disabled={isSavingProfile}
              className={`inline-flex items-center gap-[6px] px-[18px] py-[9px] bg-[#FCF7AE] text-[#141414] font-sans text-[14px] font-bold rounded-full border border-[#c99b2e8c] transition-all ${isSavingProfile ? "opacity-70 cursor-not-allowed" : "hover:bg-[#ebd85b]"}`}
            >
              {isSavingProfile ? (
                <>
                  <Spinner size="sm" className="text-[#141414]" /> Saving...
                </>
              ) : (
                "Save changes"
              )}
            </button>
          </div>
        </Card>

        {/* ═══ 2. Notification preferences ═══ */}
        <Card>
          <CardHead title="Notification preferences" />
          <div className="px-[28px] pt-[20px] pb-[4px] flex flex-col gap-[10px]">

            <div className="flex items-center justify-between rounded-[10px] border px-[16px] py-[14px] bg-[#eaf3ec] border-[#b6d9c0]">
              <span className="font-sans text-[16px] font-medium leading-snug text-[#1f4d2e]">
                Email: course completion by team member
              </span>
              <span className="font-sans text-[13px] font-bold text-[#3d7a52]">Active</span>
            </div>

            <CheckRow
              card
              hideCheckbox
              label="Send in-app notification"
              checked={notifs.sendInApp}
              onChange={(v) => setNotifs((p) => ({ ...p, sendInApp: v }))}
            />
            <CheckRow
              card
              hideCheckbox
              label="Send email notification"
              checked={notifs.sendEmail}
              onChange={(v) => setNotifs((p) => ({ ...p, sendEmail: v }))}
            />
          </div>

          <div className="px-[28px] pb-[24px] pt-[18px]">
            <button
              onClick={() => showToast("Notification preferences saved.")}
              className="inline-flex items-center gap-[6px] px-[18px] py-[9px] bg-[#FCF7AE] text-[#141414] font-sans text-[14px] font-bold rounded-full border border-[#c99b2e8c] hover:bg-[#ebd85b] transition-all"
            >
              Save preferences
            </button>
          </div>
        </Card>

        {/* ═══ 3. Security ═══ */}
        <div className="bg-white rounded-[14px] border border-[#1111111a] shadow-[0_4px_16px_-4px_rgba(42,17,8,0.1)] overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_24px_-4px_rgba(42,17,8,0.15)]">
          <div className="px-[28px] py-[18px] pb-[16px] border-b border-[#1111111a]">
            <h3 className="font-sans text-[16px] font-bold text-[#141414] m-0">Security</h3>
          </div>
          <div className="px-[24px] py-[4px]">
            <SecRow
              text={
                <>
                  Active sessions: <strong>{sessions.length}</strong> {sessions.length > 0 && `(${sessions[0].browser || 'Unknown'} · ${sessions[0].os || 'Unknown'})`}
                </>
              }
              action={
                <button onClick={() => navigate('/session-history')} className="font-sans text-[14px] font-semibold text-[#141414] border border-[#11111129] rounded-full px-[16px] py-[6px] hover:bg-[#f6f6f4] transition-all">
                  View all
                </button>
              }
            />
            <SecRow
              text={
                <>
                  Two-step verification:{" "}
                  <strong>Enabled (OTP) - required for admins</strong>
                </>
              }
            />
          </div>
        </div>

        {/* ═══ 4. Tenant information ═══ */}
        <Card variant="readonly">
          <CardHead
            title="Tenant information"
            badge={<span className="border border-[#11111129] text-[#8c8c8c] text-[10px] font-bold tracking-[0.05em] uppercase px-[8px] py-[3px] rounded-[4px]">READ-ONLY</span>}
          />
          <p className="px-[28px] pt-[16px] font-sans text-[16px] text-[#5c5c5c]">
            Managed by Nexus Academy. Contact your account manager to request changes.
          </p>
          <div className="p-[24px] px-[28px] pb-[28px]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-[24px] gap-y-[18px]">
              <div>
                <FieldLabel>Tenant ID</FieldLabel>
                <FieldInput value={tenantId || "Unknown"} disabled />
              </div>
              <div>
                <FieldLabel>Industry</FieldLabel>
                <FieldInput value={industryName} disabled />
              </div>
              <div>
                <FieldLabel>Plan</FieldLabel>
                <FieldInput value="Corporate · Standard" disabled />
              </div>
              <div>
                <FieldLabel>Primary contact</FieldLabel>
                <FieldInput value={tenant?.adminUser ? `${tenant.adminUser.firstName || ''} ${tenant.adminUser.lastName || ''}`.trim() : "Managed by Nexus Academy"} disabled />
              </div>
              <div>
                <FieldLabel>Billing owner</FieldLabel>
                <FieldInput value="Managed by Nexus Academy" disabled />
              </div>
              <div>
                <FieldLabel>Contract start date</FieldLabel>
                <FieldInput value={tenant?.contractStartDate ? new Date(tenant.contractStartDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }) : "Unknown"} disabled />
              </div>
              <div>
                <FieldLabel>Contract end date</FieldLabel>
                <FieldInput value={tenant?.contractEndDate ? new Date(tenant.contractEndDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }) : "Unknown"} disabled />
              </div>
              <div className="md:col-span-2">
                <FieldLabel>SSO / Single sign-on</FieldLabel>
                <div className="flex items-center gap-[10px] mt-[6px]">
                  <span className="inline-flex items-center rounded-full border border-[#eaddaf] bg-[#f8efcd] px-[10px] py-[3px] text-[12px] font-bold tracking-widest uppercase text-[#735914]">
                    Phase 2
                  </span>
                  <span className="font-sans text-[16px] text-[#737373]">
                    Not configured in Phase 1
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Card>


        {/* ═══ 7. Danger zone ═══ */}
        <Card variant="danger">
          <CardHead title="Danger zone" danger />
          <div className="px-[28px] py-[20px]">
            <div className="flex items-center justify-between gap-4">
              <span className="font-sans text-[16px] text-[#3a3a3a] leading-snug">
                Delete your Org Admin account (all corporate users lose access immediately)
              </span>
              <button className="inline-flex items-center gap-[6px] px-[16px] py-[7px] bg-[#fff] text-[#c12a1c] border border-[#c12a1c] font-sans text-[14px] font-bold rounded-full hover:bg-[#fcebea] transition-all flex-shrink-0">
                Request deletion
              </button>
            </div>
          </div>
        </Card>

      </div>

      <ProfileVerifyOTP
        isOpen={showOTPModal}
        onClose={() => setShowOTPModal(false)}
        onSuccess={() => {
          setShowOTPModal(false);
          showToast("Account settings saved.");
          getProfile();
        }}
      />

      {/* global toast */}
      <Toast message={toast.message} visible={toast.visible} />
    </>
  );
};

export default AdminSettings;
