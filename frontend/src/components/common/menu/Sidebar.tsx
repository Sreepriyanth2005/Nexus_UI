import React, { useMemo, useState } from "react";
import { NavLink, useNavigate, useLocation } from "react-router";

import {
  Settings,
  Book,
  FileText,
  Star,
  Clock,
  Check,
  HelpCircle,
  Award,
  Home,
  Grid,
  Users,
  Shield,
  Building,
  Sparkles,
  BarChart2,
  User,
  Heart,
  CheckSquare,
  CreditCard,
  LogOut,
  Monitor,
  ChevronDown,
  Inbox,
  List,
  Bookmark,
  Settings2,
  Plus,
  Lock
} from "../../../assets/icons";

import { useAuthStore } from "../../../core/auth/auth.store";
import { roleMenuConfig } from "./menuConfig";
import { keycloakClient } from "../../../core/auth/keycloak";
import { useUserStore } from "../../../store/user.store";
import { getDashboardPath } from "../../../routes/utils";
import { useAppStore } from "../../../store/app.store";

/* -------------------------------------------------------------------------- */
/*                                  ICON MAP                                  */
/* -------------------------------------------------------------------------- */

const iconMap: Record<string, React.ReactNode> = {
  home: (
    <Home
      className="h-[16px] w-[16px]"
      strokeWidth={1.7}
    />
  ),

  dashboard: (
    <Grid
      className="h-[16px] w-[16px]"
      strokeWidth={1.7}
    />
  ),

  users: (
    <Users
      className="h-[16px] w-[16px]"
      strokeWidth={1.7}
    />
  ),

  roles: (
    <Shield
      className="h-[16px] w-[16px]"
      strokeWidth={1.7}
    />
  ),

  courses: (
    <Book
      className="h-[16px] w-[16px]"
      strokeWidth={1.7}
    />
  ),

  corporate: (
    <Building
      className="h-[16px] w-[16px]"
      strokeWidth={1.7}
    />
  ),

  building: (
    <Building
      className="h-[16px] w-[16px]"
      strokeWidth={1.7}
    />
  ),

  reports: (
    <BarChart2
      className="h-[16px] w-[16px]"
      strokeWidth={1.7}
    />
  ),

  idea: (
    <Sparkles
      className="h-[16px] w-[16px]"
      strokeWidth={1.7}
    />
  ),

  help: (
    <FileText
      className="h-[16px] w-[16px]"
      strokeWidth={1.7}
    />
  ),

  settings: (
    <Settings
      className="h-[16px] w-[16px]"
      strokeWidth={1.7}
    />
  ),

  profile: (
    <User
      className="h-[16px] w-[16px]"
      strokeWidth={1.7}
    />
  ),

  jobs: (
    <List
      className="h-[16px] w-[16px]"
      strokeWidth={1.7}
    />
  ),

  database: (
    <Inbox
      className="h-[16px] w-[16px]"
      strokeWidth={1.7}
    />
  ),

  industry: (
    <Building
      className="h-[16px] w-[16px]"
      strokeWidth={1.7}
    />
  ),

  heart: (
    <Heart
      className="h-[16px] w-[16px]"
      strokeWidth={1.7}
    />
  ),

  completed: (
    <CheckSquare
      className="h-[16px] w-[16px]"
      strokeWidth={1.7}
    />
  ),

  review: (
    <FileText
      className="h-[16px] w-[16px]"
      strokeWidth={1.7}
    />
  ),

  certificates: (
    <Award
      className="h-[16px] w-[16px]"
      strokeWidth={1.7}
    />
  ),

  audit: (
    <List
      className="h-[16px] w-[16px]"
      strokeWidth={1.7}
    />
  ),

  payments: (
    <CreditCard
      className="h-[16px] w-[16px]"
      strokeWidth={1.7}
    />
  ),

  paths: (
    <Star
      className="h-[16px] w-[16px]"
      strokeWidth={1.7}
    />
  ),

  star: (
    <Star
      className="h-[16px] w-[16px]"
      strokeWidth={1.7}
    />
  ),

  briefcase: (
    <Award
      className="h-[16px] w-[16px]"
      strokeWidth={1.7}
    />
  ),

  landmark: (
    <Building
      className="h-[16px] w-[16px]"
      strokeWidth={1.7}
    />
  ),

  logout: (
    <LogOut
      className="h-[16px] w-[16px]"
      strokeWidth={1.7}
    />
  ),

  clock: (
    <Clock
      className="h-[16px] w-[16px]"
      strokeWidth={1.7}
    />
  ),

  check: (
    <Check
      className="h-[16px] w-[16px]"
      strokeWidth={1.7}
    />
  ),

  shield: (
    <Shield
      className="h-[16px] w-[16px]"
      strokeWidth={1.7}
    />
  ),

  helpcircle: (
    <HelpCircle
      className="h-[16px] w-[16px]"
      strokeWidth={1.7}
    />
  ),

  plus: (
    <Plus
      className="h-[16px] w-[16px]"
      strokeWidth={1.7}
    />
  ),

  ticket: (
    <Bookmark
      className="h-[16px] w-[16px]"
      strokeWidth={1.7}
    />
  ),

  platform: (
    <Monitor
      className="h-[16px] w-[16px]"
      strokeWidth={1.7}
    />
  ),

  builder: (
    <Settings2
      className="h-[16px] w-[16px]"
      strokeWidth={1.7}
    />
  ),

  lock: (
    <Lock
      className="h-[16px] w-[16px]"
      strokeWidth={1.7}
    />
  ),
};

/* -------------------------------------------------------------------------- */
/*                            SHARED SIDEBAR STYLES                           */
/* -------------------------------------------------------------------------- */

const SIDEBAR = {
  width: "w-[240px]",
  collapsedWidth: "w-[72px]",

  item:
    "group relative flex min-h-[38px] w-full items-center gap-2.5 rounded-xl px-2.5 py-1.5 text-[13px] font-['Manrope',system-ui,sans-serif] font-semibold text-slate-600 leading-[18px] tracking-[-0.01em] transition-all duration-180",

  normal:
    "hover:bg-slate-100/80 hover:text-slate-900 hover:translate-x-1",

  active:
    "relative overflow-hidden bg-blue-50/90 font-bold text-blue-700 shadow-2xs border border-blue-100/90 before:absolute before:left-0 before:top-2 before:bottom-2 before:w-[3.5px] before:rounded-r-md before:bg-blue-600 hover:translate-x-0.5",

  action:
    "relative flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-[13px] font-bold text-blue-700 bg-blue-50/90 border border-blue-200/80 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all duration-180 shadow-2xs hover:shadow-xs hover:translate-x-1",

  icon:
    "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100/70 text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-600 group-hover:scale-105 transition-all duration-180",

  iconActive:
    "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white shadow-xs transition-all duration-180",

  iconAction:
    "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-100/80 text-blue-600 group-hover:bg-white/20 group-hover:text-white transition-all duration-180",

  section:
    "px-3 text-[10px] font-bold uppercase leading-[14px] tracking-[0.12em] text-slate-400 pt-3 pb-1 flex items-center justify-between",
};

/* -------------------------------------------------------------------------- */
/*                                  SIDEBAR                                   */
/* -------------------------------------------------------------------------- */

const Sidebar: React.FC = () => {
  const { role, permissions, setActiveRole } = useAuthStore();
  const { user } = useUserStore();
  const { sidebarOpen } = useAppStore();
  const navigate = useNavigate();
  const location = useLocation();

  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const userRoles = user?.roles || [];

  /* ------------------------------------------------------------------------ */
  /*                                MENU ITEMS                                */
  /* ------------------------------------------------------------------------ */

  const menuItems = useMemo(() => {
    if (!role) return [];

    const normalizedRole = role
      .toUpperCase()
      .replace(/\s+/g, "_");

    const rawItems =
      roleMenuConfig[normalizedRole] ??
      roleMenuConfig[role] ??
      [];

    if (normalizedRole === "SUPER_ADMIN") {
      return rawItems;
    }

    return rawItems
      .filter((item) => {
        if (!item.requiredPermission) {
          return true;
        }

        const reqList = Array.isArray(
          item.requiredPermission
        )
          ? item.requiredPermission
          : [item.requiredPermission];

        return reqList.some((req) =>
          permissions.includes(req.toUpperCase())
        );
      })
      .map((item) => {
        if (item.children) {
          const filteredChildren =
            item.children.filter((child) => {
              if (!child.requiredPermission) {
                return true;
              }

              const reqList = Array.isArray(
                child.requiredPermission
              )
                ? child.requiredPermission
                : [child.requiredPermission];

              return reqList.some((req) =>
                permissions.includes(req.toUpperCase())
              );
            });

          return {
            ...item,
            children: filteredChildren,
          };
        }

        return item;
      })
      .filter(
        (item) =>
          !item.children ||
          item.children.length > 0
      );
  }, [role, permissions]);

  /* ------------------------------------------------------------------------ */
  /*                              MENU HANDLERS                               */
  /* ------------------------------------------------------------------------ */

  const toggleMenu = (label: string) => {
    setOpenMenu((prev) =>
      prev === label ? null : label
    );
  };

  /* ------------------------------------------------------------------------ */
  /*                              ACTIVE MATCHING                             */
  /* ------------------------------------------------------------------------ */

  const checkIsActive = (itemPath?: string) => {
    if (!itemPath) return false;
    const [path, search] = itemPath.split("?");

    const normalizeRoute = (p: string) => {
      if (p === "/studio/settings") return "/settings";
      if (p === "/studio/analytics") return "/studio/reports";
      return p;
    };

    if (normalizeRoute(path) !== normalizeRoute(location.pathname)) return false;

    if (search) {
      const itemParams = new URLSearchParams(search);
      const currentParams = new URLSearchParams(location.search);
      for (const [key, value] of itemParams.entries()) {
        if (currentParams.get(key) !== value) return false;
      }
      return true;
    }

    let hasMoreSpecificMatch = false;
    const checkItem = (i: any) => {
      if (!i.path) return;
      const [iPath, iSearch] = i.path.split("?");
      if (iPath === location.pathname && iSearch) {
        const iParams = new URLSearchParams(iSearch);
        const cParams = new URLSearchParams(location.search);
        let match = true;
        for (const [k, v] of iParams.entries()) {
          if (cParams.get(k) !== v) match = false;
        }
        if (match) hasMoreSpecificMatch = true;
      }
    };

    menuItems.forEach((m) => {
      checkItem(m);
      if (m.children) m.children.forEach(checkItem);
    });

    return !hasMoreSpecificMatch;
  };

  /* ------------------------------------------------------------------------ */
  /*                              ROLE HANDLER                                */
  /* ------------------------------------------------------------------------ */

  const handleRoleChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const nextRole = event.target.value;

    setActiveRole(nextRole);
    navigate(getDashboardPath(nextRole));
  };

  const handleLogout = async () => {
    try {
      await useAuthStore.getState().logout();
      navigate("/login", { replace: true });
    } catch (error) {
      console.error(error);
    }
  };

  /* ------------------------------------------------------------------------ */
  /*                                  RENDER                                  */
  /* ------------------------------------------------------------------------ */

  return (
    <aside
      className={`
        z-40
        flex
        flex-col
        transition-all
        duration-200
        bg-white
        border-r
        border-slate-200/90
        h-[calc(100vh-var(--sidebar-top,64px))]
        pt-3
        pb-3
        sticky
        top-[var(--sidebar-top,64px)]
        overflow-hidden
        ${sidebarOpen ? SIDEBAR.width : SIDEBAR.collapsedWidth}
      `}
    >
      {/* ================================================================== */}
      {/*                      TOP WORKSPACE BRANDING PILL                    */}
      {/* ================================================================== */}

      {sidebarOpen ? (
        <div className="mx-2.5 mb-2 px-3 py-2 rounded-xl bg-slate-50/80 border border-slate-200/70 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-extrabold text-[11px] shadow-xs shrink-0">
              NX
            </div>
            <div className="min-w-0">
              <div className="text-[12px] font-bold text-slate-900 truncate leading-tight">Nexus Portal</div>
              <div className="text-[10px] text-slate-400 font-medium flex items-center gap-1.5 truncate">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                Super Admin
              </div>
            </div>
          </div>
          <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200/60 shrink-0">
            HQ
          </span>
        </div>
      ) : (
        <div className="mx-auto mb-3 w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-extrabold text-xs shadow-xs">
          NX
        </div>
      )}

      {/* ================================================================== */}
      {/*                               NAVIGATION                           */}
      {/* ================================================================== */}

      <nav
        className="
          min-h-0
          flex-1
          overflow-y-auto
          overflow-x-hidden
          px-2
          space-y-0.5
        "
      >
        {menuItems.map((item) => {
          /* ================================================================ */
          /*                           SECTION HEADER                         */
          /* ================================================================ */
          if (item.sectionHeader) {
            return (
              <div key={item.label} className={SIDEBAR.section}>
                {sidebarOpen ? (
                  <>
                    <span>{item.label}</span>
                    <div className="h-px flex-1 ml-2 bg-slate-100" />
                  </>
                ) : (
                  <div className="h-px w-6 mx-auto bg-slate-200/80 my-2" />
                )}
              </div>
            );
          }

          /* ================================================================ */
          /*                           SECTION / PARENT                       */
          /* ================================================================ */

          if (item.children) {
            const isChildActive = item.children.some(child => checkIsActive(child.path));

            return (
              <div key={item.label} className="mb-0.5">
                <button
                  type="button"
                  onClick={() => toggleMenu(item.label)}
                  className={`
                    ${SIDEBAR.item}
                    ${isChildActive ? SIDEBAR.active : SIDEBAR.normal}
                    focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400
                  `}
                >
                  <span className={isChildActive ? SIDEBAR.iconActive : SIDEBAR.icon}>
                    {item.icon ? iconMap[item.icon] ?? null : null}
                  </span>

                  {sidebarOpen && (
                    <span className="min-w-0 flex-1 truncate text-left">
                      {item.label}
                    </span>
                  )}

                  {sidebarOpen && (
                    <ChevronDown
                      className={`
                        h-3.5
                        w-3.5
                        shrink-0
                        text-slate-400
                        transition-transform
                        duration-150
                        ${openMenu === item.label ? "rotate-180" : ""}
                      `}
                      strokeWidth={1.8}
                    />
                  )}
                </button>

                {/* CHILD ITEMS */}
                {sidebarOpen && openMenu === item.label && (
                  <div className="ml-5 mt-1 border-l-2 border-slate-100 pl-2 space-y-0.5">
                    {item.children.map((child) => (
                      <NavLink
                        key={child.path ?? child.label}
                        to={child.path ?? "/"}
                        end
                        className={`
                          relative
                          flex
                          min-h-[34px]
                          items-center
                          rounded-lg
                          px-2.5
                          py-1.5
                          text-[12px]
                          font-medium
                          transition-all
                          duration-150
                          ${checkIsActive(child.path)
                            ? "bg-blue-50 text-blue-700 font-bold"
                            : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900"
                          }
                          focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400
                        `}
                      >
                        {child.label}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            );
          }

          /* ================================================================ */
          /*                           ACTION BUTTON (CTA)                    */
          /* ================================================================ */

          if (item.actionButton) {
            return (
              <NavLink
                key={item.path ?? item.label}
                to={item.path ?? "/"}
                title={!sidebarOpen ? item.label : undefined}
                className={`
                  ${SIDEBAR.action}
                  ${!sidebarOpen ? "justify-center px-0" : ""}
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400
                `}
              >
                <span className={SIDEBAR.iconAction}>
                  {item.icon ? iconMap[item.icon] ?? null : null}
                </span>

                {sidebarOpen && (
                  <span className="min-w-0 flex-1 truncate">
                    {item.label}
                  </span>
                )}

                {sidebarOpen && (
                  <span className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-blue-100 text-blue-700 group-hover:bg-white/25 group-hover:text-white uppercase tracking-wider">
                    NEW
                  </span>
                )}
              </NavLink>
            );
          }

          /* ================================================================ */
          /*                           LOGOUT / SIGN OUT                      */
          /* ================================================================ */

          const isSignOut =
            item.label.toLowerCase().includes("sign out") ||
            item.label.toLowerCase() === "logout";

          if (isSignOut) {
            return (
              <button
                key={item.label}
                onClick={handleLogout}
                title={!sidebarOpen ? item.label : undefined}
                className={`
                  ${SIDEBAR.item}
                  hover:bg-rose-50 hover:text-rose-600 group-hover:text-rose-600
                  ${!sidebarOpen ? "justify-center px-0" : ""}
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400
                `}
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100/70 text-slate-500 group-hover:bg-rose-100/70 group-hover:text-rose-600 group-hover:scale-105 transition-all duration-180">
                  {item.icon ? iconMap[item.icon] ?? null : null}
                </span>
                {sidebarOpen && (
                  <span className="min-w-0 flex-1 truncate text-left text-rose-600 font-semibold">
                    {item.label}
                  </span>
                )}
              </button>
            );
          }

          /* ================================================================ */
          /*                            NORMAL ITEM                           */
          /* ================================================================ */

          const isActive = checkIsActive(item.path);
          const isReviewQueue = item.label.toLowerCase().includes("review");
          const isPurgeQueue =
            item.label.toLowerCase().includes("purge") ||
            item.label.toLowerCase().includes("deletion");

          return (
            <NavLink
              key={item.path ?? item.label}
              to={item.path ?? "/"}
              end
              title={!sidebarOpen ? item.label : undefined}
              className={`
                ${SIDEBAR.item}
                ${isActive ? SIDEBAR.active : SIDEBAR.normal}
                ${!sidebarOpen ? "justify-center px-0" : ""}
                focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400
              `}
            >
              <span className={isActive ? SIDEBAR.iconActive : SIDEBAR.icon}>
                {item.icon ? iconMap[item.icon] ?? null : null}
              </span>

              {sidebarOpen && (
                <span className="min-w-0 flex-1 truncate">
                  {item.label}
                </span>
              )}

              {/* Special Pill Badges */}
              {sidebarOpen && isReviewQueue && (
                <span className="ml-auto text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-amber-50 text-amber-700 border border-amber-200/60">
                  2
                </span>
              )}

              {sidebarOpen && isPurgeQueue && (
                <span className="ml-auto text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-500">
                  Queue
                </span>
              )}

              {sidebarOpen && item.badge && item.badge > 0 && (
                <span className="ml-auto text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-blue-50 text-blue-700 border border-blue-200/60">
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* ================================================================== */}
      {/*                            SIDEBAR FOOTER                          */}
      {/* ================================================================== */}

      {sidebarOpen ? (
        <div className="shrink-0 border-t border-slate-200/80 bg-white px-2.5 pt-2.5 space-y-2">
          {/* User Profile Mini Card */}
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50/80 border border-slate-200/60">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[11px] shrink-0 shadow-xs">
                {user?.firstName?.[0] || "S"}{user?.lastName?.[0] || "A"}
              </div>
              <div className="min-w-0">
                <div className="text-[12px] font-bold text-slate-800 truncate leading-tight">
                  {user?.firstName ? `${user.firstName} ${user.lastName || ''}` : "Super Admin"}
                </div>
                <div className="text-[10px] text-slate-400 font-medium truncate">
                  {user?.email || "superadmin@nexus.org"}
                </div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Sign Out"
              className="w-6 h-6 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Role Context Switcher */}
          {userRoles.length > 1 && (
            <div className="px-0.5">
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Active Context
              </label>
              <div className="relative">
                <select
                  value={role || ""}
                  onChange={handleRoleChange}
                  className="h-8 w-full appearance-none rounded-lg border border-slate-200 bg-white px-2.5 pr-8 text-[12px] font-semibold text-slate-700 outline-none transition-colors hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 cursor-pointer"
                >
                  {userRoles.map((r) => (
                    <option key={r} value={r}>
                      {String(r).replace(/_/g, " ")}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="shrink-0 border-t border-slate-200/80 bg-white p-2 flex justify-center">
          <button
            onClick={handleLogout}
            title="Sign Out"
            className="w-8 h-8 rounded-xl bg-slate-100 text-slate-500 hover:bg-rose-50 hover:text-rose-600 flex items-center justify-center transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
