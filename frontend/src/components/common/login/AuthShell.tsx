// src/components/common/login/AuthShell.tsx
import React from "react";
import { Link } from "react-router";
import nexusLogoWhite from "../../../assets/brand/nexus-logo-white.svg";
import {
  Sparkles,
  ShieldCheck,
  BookOpenCheck,
  GraduationCap,
  ArrowRight,
  Shield,
  Lock,
  Cpu,
  CheckCircle2,
  Activity,
} from "lucide-react";

interface AuthShellProps {
  children: React.ReactNode;
  activePortal?: "learner" | "admin" | "register" | "verify";
  pageTitle?: string;
  pageSubtitle?: string;
  badgeText?: string;
}

export const AuthShell: React.FC<AuthShellProps> = ({
  children,
  activePortal = "learner",
  pageTitle,
  pageSubtitle,
  badgeText,
}) => {
  return (
    <div className="relative min-h-screen lg:h-screen lg:max-h-screen w-full bg-[#070a13] text-slate-100 font-sans selection:bg-blue-500 selection:text-white flex flex-col justify-between overflow-x-hidden overflow-y-auto lg:overflow-hidden">
      {/* ── Dynamic Ambient Mesh Background ── */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        {/* Modern Dot Matrix Grid */}
        <div className="absolute inset-0 bg-[radial-gradient(#3b82f618_1px,transparent_1px)] [background-size:24px_24px] opacity-75" />

        {/* Ambient Glowing Orbs */}
        <div className="absolute -top-36 -right-24 w-[650px] h-[650px] rounded-full bg-gradient-to-br from-blue-600/20 via-indigo-600/10 to-transparent blur-3xl animate-pulse duration-1000" />
        <div className="absolute top-1/4 -left-40 w-[550px] h-[550px] rounded-full bg-gradient-to-tr from-cyan-500/15 via-blue-600/10 to-transparent blur-3xl" />
        <div className="absolute -bottom-40 right-1/3 w-[600px] h-[600px] rounded-full bg-gradient-to-t from-purple-600/15 via-indigo-900/10 to-transparent blur-3xl" />

        {/* Subtle geometric line vignette */}
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_0%,rgba(7,10,19,0.85)_100%)]" />
      </div>

      {/* ── Top Header Navigation ── */}
      <header className="relative z-10 w-full shrink-0 border-b border-white/[0.08] bg-[#070a13]/85 backdrop-blur-xl">
        <div className="mx-auto flex h-14 sm:h-16 max-w-7xl items-center justify-between px-6 sm:px-8">
          {/* Logo with Ambient Glow */}
          <Link
            to="/"
            className="group flex items-center gap-3 transition-opacity hover:opacity-95"
            title="Nexus Learning Portal"
          >
            <div className="relative">
              <div className="absolute -inset-1 rounded-lg bg-blue-500/20 blur-sm opacity-0 group-hover:opacity-100 transition-opacity" />
              <img
                src={nexusLogoWhite}
                alt="Nexus Academy"
                className="relative h-8 sm:h-9 w-auto transition-transform duration-200 group-hover:scale-[1.02]"
              />
            </div>
          </Link>

          {/* System Status Pill & Portal Switcher */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden md:flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-medium text-emerald-300">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
              </span>
              <span>Enterprise Cloud v3.2 · 99.99% SLA</span>
            </div>

            <Link
              to="/login"
              className={`rounded-full px-3.5 py-1 text-xs sm:text-sm font-semibold transition-all ${
                activePortal === "learner"
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/20 font-bold"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              Learner Portal
            </Link>

            <Link
              to="/admin/login"
              className={`rounded-full px-3.5 py-1 text-xs sm:text-sm font-semibold transition-all ${
                activePortal === "admin"
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/20 font-bold"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              Admin & Staff
            </Link>

            {activePortal !== "register" && (
              <Link
                to="/register"
                className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3.5 py-1 text-xs sm:text-sm font-medium text-slate-300 transition-all hover:bg-white/10 hover:text-white hover:border-white/20"
              >
                Create Account
                <ArrowRight className="h-3.5 w-3.5 text-cyan-400" />
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* ── Main Content Stage ── */}
      <main className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 items-center px-4 sm:px-8 py-3 lg:py-4">
        <div className="grid w-full grid-cols-1 items-center gap-6 lg:gap-8 xl:gap-12 lg:grid-cols-12">
          {/* ── Left Hero Feature Showcase ── */}
          <div className="hidden lg:flex lg:col-span-6 xl:col-span-7 flex-col justify-center pr-4">
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 self-start rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-cyan-300 backdrop-blur-md mb-3">
              <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
              <span>{badgeText || "Unified Enterprise Talent & Governance Fabric"}</span>
            </div>

            {/* Headline */}
            <h1 className="text-2xl lg:text-3xl xl:text-4xl font-extrabold tracking-tight text-white leading-[1.14] mb-2.5">
              Accelerate Enterprise Learning with{" "}
              <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
                Precision Intelligence
              </span>
            </h1>

            {/* Subtext */}
            <p className="text-xs sm:text-sm text-slate-300/90 leading-relaxed mb-4 max-w-xl">
              A high-performance workspace connecting Super Administrators, Content Developers, Subject Matter Experts (SMEs), and Learners through verifiable credentials and zero-trust controls.
            </p>

            {/* 4 Dedicated Persona Cards with New Icons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl mb-4">
              {/* Card 1: Super Admin */}
              <div className="group rounded-2xl border border-white/10 bg-white/[0.03] p-3 backdrop-blur-md transition-all hover:border-cyan-500/30 hover:bg-white/[0.06] hover:shadow-lg hover:shadow-cyan-500/5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/15 text-cyan-400 mb-2 group-hover:scale-105 transition-transform">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <h3 className="text-xs sm:text-sm font-bold text-white mb-0.5 flex items-center justify-between">
                  <span>Super Admin</span>
                  <span className="text-[10px] font-normal px-1.5 py-0.2 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">Governance</span>
                </h3>
                <p className="text-[11px] text-slate-400 leading-normal line-clamp-2">
                  Multi-tenant isolation, enterprise RBAC policies, and comprehensive audit logs.
                </p>
              </div>

              {/* Card 2: Content Developer */}
              <div className="group rounded-2xl border border-white/10 bg-white/[0.03] p-3 backdrop-blur-md transition-all hover:border-indigo-500/30 hover:bg-white/[0.06] hover:shadow-lg hover:shadow-indigo-500/5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/15 text-indigo-400 mb-2 group-hover:scale-105 transition-transform">
                  <Sparkles className="h-5 w-5" />
                </div>
                <h3 className="text-xs sm:text-sm font-bold text-white mb-0.5 flex items-center justify-between">
                  <span>Content Developer</span>
                  <span className="text-[10px] font-normal px-1.5 py-0.2 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">Studio</span>
                </h3>
                <p className="text-[11px] text-slate-400 leading-normal line-clamp-2">
                  Course builder studio, rich lesson authoring, and assessment publishing tools.
                </p>
              </div>

              {/* Card 3: SME / Reviewer */}
              <div className="group rounded-2xl border border-white/10 bg-white/[0.03] p-3 backdrop-blur-md transition-all hover:border-purple-500/30 hover:bg-white/[0.06] hover:shadow-lg hover:shadow-purple-500/5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/15 text-purple-400 mb-2 group-hover:scale-105 transition-transform">
                  <BookOpenCheck className="h-5 w-5" />
                </div>
                <h3 className="text-xs sm:text-sm font-bold text-white mb-0.5 flex items-center justify-between">
                  <span>Subject Matter Expert</span>
                  <span className="text-[10px] font-normal px-1.5 py-0.2 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20">QA Review</span>
                </h3>
                <p className="text-[11px] text-slate-400 leading-normal line-clamp-2">
                  Structured curriculum queue, rubric evaluations, and final syllabus certification.
                </p>
              </div>

              {/* Card 4: Member (Learner) */}
              <div className="group rounded-2xl border border-white/10 bg-white/[0.03] p-3 backdrop-blur-md transition-all hover:border-emerald-500/30 hover:bg-white/[0.06] hover:shadow-lg hover:shadow-emerald-500/5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400 mb-2 group-hover:scale-105 transition-transform">
                  <GraduationCap className="h-5 w-5" />
                </div>
                <h3 className="text-xs sm:text-sm font-bold text-white mb-0.5 flex items-center justify-between">
                  <span>Member (Learner)</span>
                  <span className="text-[10px] font-normal px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">Learner</span>
                </h3>
                <p className="text-[11px] text-slate-400 leading-normal line-clamp-2">
                  Career pathways, interactive video player, and verifiable blockchain-backed credentials.
                </p>
              </div>
            </div>

            {/* Compliance & Trust Marks */}
            <div className="flex items-center gap-4 xl:gap-6 pt-3 border-t border-white/[0.08] text-[11px] sm:text-xs text-slate-400">
              <span className="flex items-center gap-1.5 font-medium text-slate-300">
                <Shield className="h-3.5 w-3.5 text-cyan-400" />
                SOC 2 Type II
              </span>
              <span className="flex items-center gap-1.5 font-medium text-slate-300">
                <Lock className="h-3.5 w-3.5 text-indigo-400" />
                ISO 27001 Certified
              </span>
              <span className="flex items-center gap-1.5 font-medium text-slate-300">
                <Cpu className="h-3.5 w-3.5 text-emerald-400" />
                99.99% Enterprise SLA
              </span>
            </div>
          </div>

          {/* ── Right Card (Interactive Authentication Container) ── */}
          <div className="col-span-1 lg:col-span-6 xl:col-span-5 flex justify-center w-full">
            <div className="relative w-full max-w-[430px] xl:max-w-[460px]">
              {/* Outer Radiant Glow Effect */}
              <div className="absolute -inset-1.5 rounded-3xl bg-gradient-to-r from-blue-600/30 via-indigo-600/20 to-purple-600/30 blur-xl opacity-70" />

              {/* Elevated Frosted Glass Card */}
              <div className="relative rounded-3xl border border-white/15 bg-[#0b101e]/90 p-5 sm:p-6 shadow-2xl backdrop-blur-2xl ring-1 ring-white/10">
                {/* Decorative Top Accent Glow Line */}
                <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-80" />

                {/* Card Header if provided */}
                {(pageTitle || pageSubtitle) && (
                  <div className="mb-4">
                    {pageTitle && (
                      <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight mb-1">
                        {pageTitle}
                      </h2>
                    )}
                    {pageSubtitle && (
                      <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                        {pageSubtitle}
                      </p>
                    )}
                  </div>
                )}

                {/* Injected Content */}
                {children}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ── Bottom Footer ── */}
      <footer className="relative z-10 w-full shrink-0 border-t border-white/[0.08] bg-[#070a13]/85 py-2.5 sm:py-3">
        <div className="mx-auto flex max-w-7xl flex-col sm:flex-row items-center justify-between gap-2 px-6 text-[11px] sm:text-xs text-slate-400">
          <p>© 2026 Nexus Learning Portal. All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-3 sm:gap-5">
            <Link to="/help" className="hover:text-cyan-300 transition-colors">
              Help Center
            </Link>
            <span>·</span>
            <a href="#" className="hover:text-cyan-300 transition-colors">
              Privacy Policy
            </a>
            <span>·</span>
            <a href="#" className="hover:text-cyan-300 transition-colors">
              Terms of Service
            </a>
            <span>·</span>
            <Link to="/verify" className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors">
              Verify Certificate
            </Link>
          </div>
        </div>
      </footer>

      {/* ── Floating AI Support Widget ── */}
      <button
        type="button"
        aria-label="AI support"
        className="fixed bottom-3 right-3 sm:bottom-4 sm:right-4 z-30 inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-slate-900/95 px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs font-semibold text-slate-100 shadow-xl shadow-black/50 backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 hover:border-cyan-400 hover:bg-slate-800 hover:shadow-cyan-500/20 cursor-pointer"
      >
        <Sparkles className="h-3.5 w-3.5 text-cyan-400 animate-pulse" />
        <span className="hidden sm:inline">AI Learning Assistant</span>
        <span className="sm:hidden">AI Assistant</span>
      </button>
    </div>
  );
};

export default AuthShell;
