// src/components/common/login/DemoRoleSelector.tsx
// Quick role selector for client demonstrations and prototype navigation.

import React, { useState } from "react";
import { useNavigate } from "react-router";
import { useAuthStore } from "../../../core/auth/auth.store";
import { STATIC_ACCOUNTS, STATIC_DEFAULT_ROLE_DASHBOARDS } from "../../../mock/staticData";
import {
  Zap,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  BookOpenCheck,
  GraduationCap,
  KeyRound,
  CheckCircle2,
} from "lucide-react";

interface DemoRoleSelectorProps {
  onSelectEmail?: (email: string) => void;
  onSelectPassword?: (password: string) => void;
  isAdminLogin?: boolean;
}

export const DemoRoleSelector: React.FC<DemoRoleSelectorProps> = ({
  onSelectEmail,
  onSelectPassword,
  isAdminLogin = false,
}) => {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  const handleInstantLogin = (email: string) => {
    const user = STATIC_ACCOUNTS[email];
    if (!user) return;

    const mockToken = `mock-token-${user.role.toLowerCase()}-${Date.now()}`;
    const mockRefresh = `mock-refresh-${user.role.toLowerCase()}-${Date.now()}`;

    localStorage.setItem("static_current_user", JSON.stringify(user));
    setAuth(mockToken, user.role, user, mockRefresh);

    const targetPath = STATIC_DEFAULT_ROLE_DASHBOARDS[user.role] || "/";
    navigate(targetPath, { replace: true });
  };

  const roles = [
    {
      label: "Super Admin",
      shortLabel: "Super Admin",
      roleCode: "SUPER_ADMIN",
      email: "superadmin@nexus.org",
      icon: ShieldCheck,
      color: "from-blue-500/20 to-cyan-500/10 text-cyan-400 border-cyan-500/30",
      accent: "bg-blue-500",
      badge: "Governance",
      desc: "Platform security, tenant isolation & complete audit compliance",
    },
    {
      label: "Content Developer",
      shortLabel: "Content Developer",
      roleCode: "CONTENT_DEVELOPER",
      email: "developer@nexus.org",
      icon: Sparkles,
      color: "from-indigo-500/20 to-purple-500/10 text-indigo-300 border-indigo-500/30",
      accent: "bg-indigo-500",
      badge: "Authoring",
      desc: "Course studio, interactive lessons & rich assessment authoring",
    },
    {
      label: "SME / Reviewer",
      shortLabel: "SME",
      roleCode: "SME",
      email: "sme@nexus.org",
      icon: BookOpenCheck,
      color: "from-purple-500/20 to-pink-500/10 text-purple-300 border-purple-500/30",
      accent: "bg-purple-500",
      badge: "Curriculum",
      desc: "Peer review queue, assessment sign-off & rubric governance",
    },
    {
      label: "Member (Learner)",
      shortLabel: "Member",
      roleCode: "MEMBER",
      email: "member@nexus.org",
      icon: GraduationCap,
      color: "from-emerald-500/20 to-teal-500/10 text-emerald-300 border-emerald-500/30",
      accent: "bg-emerald-500",
      badge: "Student",
      desc: "Personalized catalog, interactive player & verified credentials",
    },
  ];

  return (
    <div className="mb-4 rounded-2xl border border-blue-500/20 bg-gradient-to-b from-blue-950/30 via-slate-900/60 to-slate-950/80 p-3 sm:p-3.5 text-white shadow-xl backdrop-blur-xl relative overflow-hidden transition-all">
      {/* Ambient background glow */}
      <div className="pointer-events-none absolute -top-12 -right-12 h-28 w-28 rounded-full bg-blue-500/15 blur-2xl" />

      {/* Header bar */}
      <div className="flex items-center justify-between gap-2 mb-2 relative z-10">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400" />
          </span>
          <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
            <Zap className="h-3.5 w-3.5 text-cyan-400" />
            Instant Role Selector
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md bg-white/5 text-slate-300 font-mono border border-white/10">
            <KeyRound className="h-2.5 w-2.5 text-amber-400" />
            OTP: 123456
          </span>

          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-white transition-all cursor-pointer px-2 py-0.5 rounded-lg hover:bg-white/10"
          >
            <span>{isOpen ? "Compact" : "View Roles"}</span>
            {isOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>
        </div>
      </div>

      {/* 4 Quick Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 my-1 relative z-10">
        {roles.map((r) => {
          const IconComponent = r.icon;
          const isCurrent = selectedRole === r.roleCode;
          return (
            <button
              key={r.email}
              type="button"
              onClick={() => {
                setSelectedRole(r.roleCode);
                onSelectEmail?.(r.email);
                onSelectPassword?.("demo123");
              }}
              className={`group flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-[11px] font-medium rounded-xl border transition-all cursor-pointer ${
                isCurrent
                  ? "bg-blue-600/30 border-blue-400 text-white shadow-md shadow-blue-500/20"
                  : "bg-white/[0.04] border-white/10 text-slate-300 hover:bg-white/[0.08] hover:border-white/20 hover:text-white"
              }`}
              title={`Auto-fill as ${r.label}`}
            >
              <IconComponent className="h-3.5 w-3.5 text-cyan-400 group-hover:scale-110 transition-transform shrink-0" />
              <span className="truncate">{r.shortLabel}</span>
            </button>
          );
        })}
      </div>

      {/* Expanded Detailed Role Cards with Direct Launch */}
      {isOpen && (
        <div className="mt-3 pt-3 border-t border-white/10 flex flex-col gap-2 relative z-10 animate-in fade-in slide-in-from-top-1 duration-200">
          <p className="text-[11px] text-slate-400">
            Select a role to populate credentials, or click{" "}
            <strong className="text-cyan-400 font-semibold">Launch</strong> to jump straight into that persona's dashboard:
          </p>

          <div className="grid grid-cols-1 gap-1.5 max-h-[190px] overflow-y-auto pr-1 select-none scrollbar-thin">
            {roles.map((r) => {
              const IconComponent = r.icon;
              return (
                <div
                  key={r.email}
                  className="group flex items-center justify-between p-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/10 transition-all text-xs"
                >
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedRole(r.roleCode);
                      onSelectEmail?.(r.email);
                      onSelectPassword?.("demo123");
                    }}
                    className="flex items-center gap-2.5 text-left flex-1 cursor-pointer mr-2"
                  >
                    <div className={`flex h-7 w-7 items-center justify-center rounded-lg border bg-gradient-to-br ${r.color} shrink-0`}>
                      <IconComponent className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-slate-200 group-hover:text-cyan-300 transition-colors">
                          {r.label}
                        </span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-white/10 text-slate-400 font-medium">
                          {r.badge}
                        </span>
                      </div>
                      <span className="block text-[10px] text-slate-400 font-mono truncate">
                        {r.email}
                      </span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleInstantLogin(r.email)}
                    className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white active:scale-95 transition-all shadow-sm shrink-0 cursor-pointer flex items-center gap-1"
                    title={`Instant login as ${r.label}`}
                  >
                    <span>Launch</span>
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default DemoRoleSelector;
