import React from "react";
import { useNavigate } from "react-router";
import { Search, HelpCircle } from "../../../assets/icons";
import { useProfileStore } from "../../../store/profile.store";
import { useUserStore } from "../../../store/user.store";
import { useAppStore } from "../../../store/app.store";
import nexusLogo from "../../../assets/brand/nexus-logo-ink.svg";
import { NotificationBell } from "../../../features/notifications/components/NotificationBell";

const Header: React.FC = () => {
  const navigate = useNavigate();

  const { setSidebarOpen } = useAppStore();
  const { profile } = useProfileStore();
  const { user } = useUserStore();

  const isStudio = location.pathname.startsWith("/studio") || location.pathname.startsWith("/content-developer");
  const searchPlaceholder = isStudio
    ? "Search content, drafts, courses..."
    : "Search across Nexus";

  const displayName =
    `${profile?.profile?.firstName?.trim() || ""}${profile?.profile?.lastName
      ? ` ${profile.profile.lastName.trim()}`
      : ""
      }`.trim() ||
    user?.email?.split("@")[0] ||
    "User";

  const firstLetter = displayName.charAt(0).toUpperCase();

  return (
    <header
      className="topbar flex h-[60px] w-full items-center border-b border-[var(--line-strong)] z-10 bg-white px-5  shadow-[0_6px_16px_-12px_#0000002e]"
    >
      {/* Left Section */}
      <div className="flex h-full min-w-0 items-center">
        {/* Mobile Sidebar Toggle */}
        <div className="mr-3 flex shrink-0 items-center md:hidden">
          <button
            type="button"
            onClick={() => {
              if (window.innerWidth >= 768) return;
              setSidebarOpen(true);
            }}
            aria-label="Toggle sidebar"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-[#ded5cf] bg-[#f4efe9] text-[#4e4741] transition hover:bg-[#efeae4]"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 6h18M3 12h18M3 18h18" />
            </svg>
          </button>
        </div>

        {/* Brand */}
        <a
          href="/admin"
          onClick={(e) => {
            e.preventDefault();
            navigate("/admin");
          }}
          className="flex h-full w-[196px] shrink-0 items-center text-inherit no-underline"
        >
          <img
            src={nexusLogo}
            alt="Nexus Academy"
            className="block w-[140px] h-[40px] object-contain object-left"
          />
        </a>
      </div>

  {/* Center Search */}
<div className="hidden min-w-0 flex-1 sm:block ml-[28px] max-w-[480px] relative">
  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-mute" />

  <input
    type="text"
    placeholder="Search users, courses, audit..."
    aria-label="Search"
    className="h-[34px] w-full outline-none rounded-full border border-[var(--line-strong,#d1d5db)] text-[var(--fs-meta,13px)] text-[var(--ink,#111827)] bg-white py-0 pr-[14px] pl-[40px] transition-all duration-200 leading-[34px]"
  />
</div>

      {/* Right Actions */}
      <div className="ml-auto flex h-full shrink-0 items-center gap-2">
        {/* Notification */}
        <div className="flex h-[42px] w-[42px] items-center justify-center">
          <NotificationBell />
        </div>

        {/* Help */}
        <a
          href="/help"
          onClick={(e) => {
            e.preventDefault();
            navigate("/help");
          }}
          aria-label="Help"
          title="Help"
          className="hidden h-[42px] w-[42px] place-items-center rounded-full text-ink-soft transition hover:bg-[#f5f5f5] sm:grid no-underline"
        >
          <HelpCircle className="w-5 h-5" />
        </a>

        {/* Profile */}
        <a
          href="/profile"
          onClick={(e) => {
            e.preventDefault();
            navigate("/profile");
          }}
          aria-label="Profile"
          className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-full transition hover:bg-[#f5f5f5] p-[3px] no-underline text-inherit relative"
          style={{
            background:
              "conic-gradient(var(--c-sage, #a5bd97) 0deg calc(var(--pct, 0) * 3.6deg), #2a11081a calc(var(--pct, 0) * 3.6deg) 360deg)",
            ["--pct" as string]: profile?.profileCompleteness || 0,
          }}
        >
          <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-[var(--c-clay-wash,#efd4c7)] text-[11px] font-bold text-ink">
            {profile?.profile?.photoUrl ? (
              <img
                src={profile.profile.photoUrl}
                alt={displayName}
                className="block h-full w-full rounded-full object-cover"
              />
            ) : (
              firstLetter
            )}
          </div>
        </a>
      </div>
    </header>
  );
};

export default Header;