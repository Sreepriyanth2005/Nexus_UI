import React from "react";
import { Link } from "react-router";
import { Mail, ArrowRight, ShieldAlert, Sparkles, Loader2, Lock } from "lucide-react";
import { DemoRoleSelector } from "./DemoRoleSelector";

interface LoginAccountProps {
  email: string;
  setEmail: (val: string) => void;
  errorMsg: string;
  setErrorMsg: (val: string) => void;
  adminRedirect: boolean;
  setAdminRedirect: (val: boolean) => void;
  handleSubmit: (e: React.FormEvent) => void;
  isPending: boolean;
}

export const LoginAccount: React.FC<LoginAccountProps> = ({
  email,
  setEmail,
  errorMsg,
  setErrorMsg,
  adminRedirect,
  setAdminRedirect,
  handleSubmit,
  isPending,
}) => {
  return (
    <div className="w-full">
      {/* Header Eyebrow & Title */}
      <div className="mb-3.5">
        <div className="flex items-center gap-1.5 mb-1">
          <span className="inline-block text-[11px] font-bold tracking-wider text-cyan-400 uppercase">
            Learner Workspace
          </span>
          <span className="text-slate-600">·</span>
          <span className="text-[10px] text-slate-400 font-medium">Single Sign-On</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
          Welcome to Nexus
        </h2>
        <p className="mt-1 text-xs text-slate-400 leading-relaxed">
          Sign in with your organization or learner email to access courses and pathways.
        </p>
      </div>

      {/* Demo Mode Role Switcher */}
      <DemoRoleSelector onSelectEmail={setEmail} />

      {/* Login Form */}
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3">
        <div>
          <label
            htmlFor="email"
            className="block text-xs font-semibold text-slate-300 mb-1.5"
          >
            Email Address
          </label>
          <div className="relative group">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 group-focus-within:text-cyan-400 transition-colors">
              <Mail className="h-4 w-4" />
            </div>

            <input
              id="email"
              type="email"
              value={email}
              autoComplete="email"
              placeholder="e.g. member@nexus.org"
              onChange={(e) => {
                setEmail(e.target.value);
                setErrorMsg("");
                setAdminRedirect(false);
              }}
              className="w-full rounded-xl border border-white/10 bg-slate-950/70 pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 shadow-inner outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/25"
            />
          </div>

          {/* Validation Error Message */}
          {errorMsg && (
            <div className="mt-2 flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/25 px-3 py-2 text-xs text-red-300">
              <ShieldAlert className="h-4 w-4 text-red-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* Admin Redirect Warning Banner */}
        {adminRedirect && (
          <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-3 text-xs text-blue-200">
            <div className="flex items-center gap-2 font-bold text-cyan-300 mb-1">
              <ShieldAlert className="h-4 w-4" />
              <span>Administrative Persona Detected</span>
            </div>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              This portal is dedicated for learners. For administrator and developer tools:
            </p>
            <Link
              to="/admin/login"
              className="mt-1.5 inline-flex items-center gap-1 font-bold text-cyan-400 hover:text-white underline underline-offset-2 transition-colors text-xs"
            >
              Continue to Staff Portal <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isPending}
          className="mt-1.5 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 font-bold text-white shadow-lg shadow-blue-600/25 transition-all hover:brightness-110 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-xs sm:text-sm"
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin text-white" />
              <span>Verifying credentials...</span>
            </>
          ) : (
            <>
              <span>Send Verification Code</span>
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>

        {/* Legal Disclaimer */}
        <p className="text-center text-[10px] sm:text-[11px] text-slate-400 leading-tight mt-0.5">
          By signing in, you agree to our{" "}
          <a href="#" className="text-slate-300 underline underline-offset-2 hover:text-cyan-400 transition-colors">
            Terms of Service
          </a>{" "}
          and{" "}
          <a href="#" className="text-slate-300 underline underline-offset-2 hover:text-cyan-400 transition-colors">
            Privacy Policy
          </a>
          .
        </p>

        {/* Divider */}
        <div className="relative my-2 sm:my-2.5 flex items-center justify-center">
          <div className="w-full border-t border-white/[0.08]" />
          <span className="absolute bg-[#0b101e] px-3 text-[10px] uppercase tracking-wider text-slate-400">
            Or
          </span>
        </div>

        {/* Bottom Switch Links */}
        <div className="flex flex-col gap-1.5 text-center text-xs">
          <p className="text-slate-400 text-[11px] sm:text-xs">
            New organization member?{" "}
            <Link
              to="/register"
              className="font-bold text-cyan-400 hover:text-cyan-300 transition-colors ml-1"
            >
              Create Learner Account →
            </Link>
          </p>

          <p className="text-slate-400 text-[11px] sm:text-xs">
            Faculty, SME, or Admin?{" "}
            <Link
              to="/admin/login"
              className="font-medium text-slate-300 hover:text-white transition-colors ml-1"
            >
              Staff Sign In
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
};

export default LoginAccount;