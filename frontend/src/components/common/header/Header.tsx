import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router";
import { useProfileStore } from "../../../store/profile.store";
import { useUserStore } from "../../../store/user.store";
import { useAuthStore } from "../../../core/auth/auth.store";
import { useAppStore } from "../../../store/app.store";
import { getDashboardPath } from "../../../routes/utils";
import nexusLogo from "../../../assets/brand/nexus-logo-ink.svg";
import { NotificationBell } from "../../../features/notifications/components/NotificationBell";
import {
  Search,
  HelpCircle,
  Bookmark,
  User,
  Award,
  BookOpen,
  LogOut,
  ChevronDown,
  CheckCircle2,
  Menu,
  X,
  ShieldCheck,
  CheckSquare,
  Sparkles,
  ArrowRight,
  Settings,
} from "lucide-react";

const Header: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const { setSidebarOpen } = useAppStore();
  const { profile } = useProfileStore();
  const { user } = useUserStore();
  const authRole = useAuthStore((state) => state.role);

  const [searchQuery, setSearchQuery] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [wishlistCount, setWishlistCount] = useState<number>(0);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Role resolution
  const userRoles = (user?.roles || []).map((r: any) =>
    typeof r === "string" ? r : r.name || ""
  );
  const rawRole = authRole || (userRoles.length > 0 ? userRoles[0] : "MEMBER");
  const normalizedRole = typeof rawRole === "string"
    ? rawRole.toUpperCase().replace(/[\s-]+/g, "_")
    : "MEMBER";

  const homePath = getDashboardPath(normalizedRole);

  const isStudio =
    location.pathname.startsWith("/studio") ||
    location.pathname.startsWith("/content-developer");
  const isAdmin =
    location.pathname.startsWith("/admin") ||
    location.pathname.startsWith("/super-admin") ||
    normalizedRole.includes("ADMIN");
  const isSupport = location.pathname.startsWith("/support");

  const searchPlaceholder = isStudio
    ? "Search courses, lessons, drafts..."
    : isAdmin
    ? "Search users, tenants, audit..."
    : isSupport
    ? "Search tickets, logs, users..."
    : "Search courses, skills, paths... (Ctrl+K)";

  // Display Name & Photo
  const displayName =
    `${profile?.profile?.firstName?.trim() || ""}${
      profile?.profile?.lastName ? ` ${profile.profile.lastName.trim()}` : ""
    }`.trim() ||
    user?.firstName ||
    user?.email?.split("@")[0] ||
    "User";

  const firstLetter = displayName.charAt(0).toUpperCase();
  const photoUrl = profile?.profile?.photoUrl || (profile as any)?.photoUrl || (user as any)?.photoUrl;

  // Profile Completeness
  const profilePercentage = Math.min(
    100,
    Math.max(
      0,
      Number(
        profile?.profileCompleteness ??
          (profile as any)?.profile?.completeness ??
          (profile as any)?.completeness ??
          0
      )
    )
  );

  // Read Wishlist Count from local storage
  const readWishlistCount = () => {
    try {
      const raw = localStorage.getItem("member_learning_state");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed?.wishlistIds)) {
          setWishlistCount(parsed.wishlistIds.length);
          return;
        }
      }
      setWishlistCount(0);
    } catch {
      setWishlistCount(0);
    }
  };

  useEffect(() => {
    readWishlistCount();

    const handleStorage = () => readWishlistCount();
    window.addEventListener("storage", handleStorage);
    window.addEventListener("member-learning-state-updated", handleStorage);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("member-learning-state-updated", handleStorage);
    };
  }, []);

  // Global Keyboard Shortcut: Ctrl+K or Cmd+K to focus Search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === "Escape") {
        if (dropdownOpen) setDropdownOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [dropdownOpen]);

  // Click Outside to close Dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };

    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownOpen]);

  // Handle Search Submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;

    if (isStudio) {
      navigate(`/studio?search=${encodeURIComponent(query)}`);
    } else {
      navigate(`/member-learning?search=${encodeURIComponent(query)}`);
    }
  };

  // Handle Logout
  const handleLogout = async () => {
    setDropdownOpen(false);
    try {
      await useAuthStore.getState().logout();
      navigate("/login", { replace: true });
    } catch (err) {
      console.error("Sign out error", err);
      navigate("/login", { replace: true });
    }
  };

  return (
    <header className="topbar flex h-16 w-full items-center justify-between border-b border-gray-200/80 bg-white px-4 sm:px-6 z-30 shadow-[0_1px_3px_0_rgba(0,0,0,0.03)] select-none">
      {/* --- LEFT SECTION: Mobile Toggle & Brand Logo --- */}
      <div className="flex h-full items-center gap-3 shrink-0">
        {/* Mobile Sidebar Hamburger Button */}
        <div className="flex shrink-0 items-center md:hidden">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            aria-label="Toggle sidebar menu"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-gray-50 text-gray-700 transition-colors hover:bg-gray-100 hover:text-black cursor-pointer shadow-2xs"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        {/* Brand Logo */}
        <a
          href={homePath}
          onClick={(e) => {
            e.preventDefault();
            navigate(homePath);
          }}
          className="flex h-full items-center no-underline transition-opacity hover:opacity-90 py-1"
        >
          <img
            src={nexusLogo}
            alt="Nexus Academy"
            className="block h-8 sm:h-9 w-auto max-w-[150px] object-contain"
          />
        </a>

        {/* Role or Context Tag on Medium+ screens */}
        {isStudio && (
          <span className="hidden lg:inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-purple-700 bg-purple-50 border border-purple-200/60 px-2 py-0.5 rounded-md ml-2">
            <Sparkles size={11} /> Studio
          </span>
        )}
      </div>

      {/* --- CENTER SECTION: Global Omnisearch --- */}
      <div className="hidden md:flex flex-1 max-w-xl mx-6">
        <form onSubmit={handleSearchSubmit} className="relative w-full">
          <div className="relative flex items-center w-full">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={searchPlaceholder}
              aria-label="Global search"
              className="h-10 w-full rounded-full border border-gray-200 bg-gray-50/70 hover:bg-gray-50 focus:bg-white text-[13px] text-gray-900 pl-10 pr-20 outline-none transition-all duration-200 placeholder-gray-400 focus:border-[#c99b2e] focus:ring-2 focus:ring-[#c99b2e]/15 shadow-2xs"
            />
            <div className="absolute right-2.5 flex items-center gap-1.5">
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="w-5 h-5 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-200/60 cursor-pointer"
                >
                  <X size={12} />
                </button>
              ) : (
                <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-semibold text-gray-400 bg-white border border-gray-200 rounded shadow-2xs">
                  ⌘K
                </kbd>
              )}
            </div>
          </div>
        </form>
      </div>

      {/* --- RIGHT SECTION: Utility Icons & User Menu --- */}
      <div className="flex h-full items-center gap-1.5 sm:gap-2 ml-auto">
        {/* Wishlist Shortcut Button */}
        <button
          type="button"
          onClick={() => navigate("/wishlist")}
          title="Saved Wishlist"
          aria-label="Saved Wishlist"
          className="relative flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl text-gray-600 hover:text-[#c99b2e] hover:bg-[#fdf5ba]/40 transition-colors cursor-pointer"
        >
          <Bookmark className="w-[18px] h-[18px]" strokeWidth={1.8} />
          {wishlistCount > 0 && (
            <span className="absolute top-1 right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-[#c99b2e] text-[10px] font-bold text-white shadow-2xs">
              {wishlistCount > 9 ? "9+" : wishlistCount}
            </span>
          )}
        </button>

        {/* Notifications */}
        <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl text-gray-600 hover:bg-gray-100 transition-colors">
          <NotificationBell />
        </div>

        {/* Help */}
        <button
          type="button"
          onClick={() => navigate("/help")}
          title="Help & FAQ"
          aria-label="Help & FAQ"
          className="hidden sm:flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer"
        >
          <HelpCircle className="w-[19px] h-[19px]" strokeWidth={1.8} />
        </button>

        {/* Subtle Vertical Divider */}
        <div className="h-6 w-[1px] bg-gray-200 mx-1 hidden sm:block" />

        {/* --- USER PROFILE TRIGGER & DROPDOWN --- */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setDropdownOpen((prev) => !prev)}
            aria-expanded={dropdownOpen}
            aria-haspopup="true"
            className="flex items-center gap-2 rounded-full p-1 sm:px-2.5 sm:py-1.5 hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-all cursor-pointer select-none"
          >
            {/* Avatar with dynamic completeness ring */}
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full p-[2.5px] transition-transform active:scale-95"
              style={{
                background: `conic-gradient(${
                  profilePercentage >= 80 ? "#10b981" : "#c99b2e"
                } 0deg calc(${profilePercentage} * 3.6deg), #e5e7eb calc(${profilePercentage} * 3.6deg) 360deg)`,
              }}
              title={`Profile ${profilePercentage}% complete`}
            >
              <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-[#fdf5ba] text-[12px] font-bold text-[#755a12] border border-white shadow-2xs">
                {photoUrl ? (
                  <img
                    src={photoUrl}
                    alt={displayName}
                    className="h-full w-full rounded-full object-cover"
                  />
                ) : (
                  firstLetter
                )}
              </div>
            </div>

            {/* Name & Role Preview on Desktop */}
            <div className="hidden lg:flex flex-col text-left max-w-[130px]">
              <span className="text-[13px] font-bold text-gray-900 leading-tight truncate">
                {displayName}
              </span>
              <span className="text-[11px] text-gray-500 font-medium capitalize truncate">
                {normalizedRole.toLowerCase().replace(/_/g, " ")}
              </span>
            </div>

            <ChevronDown
              className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 hidden sm:block ${
                dropdownOpen ? "rotate-180 text-gray-700" : ""
              }`}
            />
          </button>

          {/* --- LUXURY DROPDOWN MENU --- */}
          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 rounded-2xl border border-gray-100 bg-white p-2 shadow-xl ring-1 ring-black/5 z-50 animate-in fade-in zoom-in-95 duration-150">
              {/* Dropdown Header: User info */}
              <div className="p-3 bg-gray-50/70 rounded-xl border border-gray-100/80 mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-[#fdf5ba] text-[#755a12] flex items-center justify-center font-bold text-[14px] shrink-0 border border-[#c99b2e]/30 overflow-hidden">
                    {photoUrl ? (
                      <img
                        src={photoUrl}
                        alt={displayName}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      firstLetter
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-bold text-[14px] text-gray-900 truncate">
                      {displayName}
                    </h4>
                    <p className="text-[12px] text-gray-500 truncate">
                      {user?.email || "Signed in"}
                    </p>
                    <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-[#c99b2e] bg-[#fdf5ba] px-2 py-0.5 rounded mt-1">
                      {normalizedRole.replace(/_/g, " ")}
                    </span>
                  </div>
                </div>

                {/* Profile Completeness Bar */}
                <div className="mt-3 pt-2.5 border-t border-gray-200/60">
                  <div className="flex justify-between items-center text-[11px] mb-1">
                    <span className="font-semibold text-gray-600">Profile Completeness</span>
                    <span
                      className={`font-bold ${
                        profilePercentage >= 80 ? "text-emerald-600" : "text-[#c99b2e]"
                      }`}
                    >
                      {profilePercentage}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        profilePercentage >= 80 ? "bg-emerald-500" : "bg-[#c99b2e]"
                      }`}
                      style={{ width: `${profilePercentage}%` }}
                    />
                  </div>
                  {profilePercentage < 80 && (
                    <button
                      type="button"
                      onClick={() => {
                        setDropdownOpen(false);
                        navigate("/complete-profile");
                      }}
                      className="mt-2 w-full flex items-center justify-between text-[11px] font-bold text-[#c99b2e] hover:text-[#9e761c] transition-colors py-0.5"
                    >
                      <span>Complete profile to unlock certificates</span>
                      <ArrowRight size={12} />
                    </button>
                  )}
                </div>
              </div>

              {/* Menu Navigation Links */}
              <div className="space-y-0.5 text-[13px]">
                <button
                  type="button"
                  onClick={() => {
                    setDropdownOpen(false);
                    navigate("/profile");
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-gray-700 hover:text-black hover:bg-gray-100 transition-colors cursor-pointer text-left"
                >
                  <User size={16} className="text-gray-400" />
                  <span>My Profile</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setDropdownOpen(false);
                    navigate("/wishlist");
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-gray-700 hover:text-black hover:bg-gray-100 transition-colors cursor-pointer text-left"
                >
                  <span className="flex items-center gap-2.5">
                    <Bookmark size={16} className="text-gray-400" />
                    <span>Saved Wishlist</span>
                  </span>
                  {wishlistCount > 0 && (
                    <span className="text-[11px] font-bold text-[#c99b2e] bg-[#fdf5ba] px-2 py-0.5 rounded-full">
                      {wishlistCount}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setDropdownOpen(false);
                    navigate("/member-learning");
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-gray-700 hover:text-black hover:bg-gray-100 transition-colors cursor-pointer text-left"
                >
                  <BookOpen size={16} className="text-gray-400" />
                  <span>Course Catalog</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setDropdownOpen(false);
                    navigate("/completed");
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-gray-700 hover:text-black hover:bg-gray-100 transition-colors cursor-pointer text-left"
                >
                  <CheckSquare size={16} className="text-gray-400" />
                  <span>Completed Courses</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setDropdownOpen(false);
                    navigate("/certificates");
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-gray-700 hover:text-black hover:bg-gray-100 transition-colors cursor-pointer text-left"
                >
                  <Award size={16} className="text-gray-400" />
                  <span>My Certificates</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setDropdownOpen(false);
                    navigate("/help");
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-gray-700 hover:text-black hover:bg-gray-100 transition-colors cursor-pointer text-left"
                >
                  <HelpCircle size={16} className="text-gray-400" />
                  <span>Help & Support</span>
                </button>
              </div>

              {/* Divider & Sign Out */}
              <div className="pt-1.5 mt-1.5 border-t border-gray-100">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer text-left font-semibold"
                >
                  <LogOut size={16} className="text-rose-500" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
