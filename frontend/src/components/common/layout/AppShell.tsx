import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { X } from "lucide-react";
import { useNavigate } from "react-router";

import Header from "../header/Header";
import Sidebar from "../menu/Sidebar";
import { useAppStore } from "../../../store/app.store";
import { useSessionTimeout } from "../../../hooks/useSessionTimeout";
import { useUserStore } from "../../../store/user.store";

type AppShellProps = {
  children: ReactNode;
  mainClassName?: string;
};

export const AppShell = ({ children, mainClassName }: AppShellProps) => {
  useSessionTimeout();
  const navigate = useNavigate();

  const { isImpersonating, user, stopImpersonation } = useUserStore();
  const { sidebarOpen, setSidebarOpen, setIsDesktop } = useAppStore();
  const [isDesktop, setIsDesktopLocal] = useState(() => window.innerWidth >= 768);

  const handleStopImpersonation = async () => {
    try {
      const token = localStorage.getItem("keycloak_token") || "";
      await fetch(`/api/v1/internal-users/stop-impersonate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ targetUserId: user?.id }),
      });
    } catch (err) {
      console.error(err);
    } finally {
      stopImpersonation();
    }
  };

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 768px)");

    const syncViewportState = () => {
      const desktop = mediaQuery.matches;
      setIsDesktopLocal(desktop);
      setIsDesktop(desktop);

      if (desktop) {
        setSidebarOpen(true);
      }
    };

    syncViewportState();

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", syncViewportState);
      return () => mediaQuery.removeEventListener("change", syncViewportState);
    }

    mediaQuery.addListener(syncViewportState);
    return () => mediaQuery.removeListener(syncViewportState);
  }, [setSidebarOpen, setIsDesktop]);

  const sidebarWidth = 228;
  const sidebarOffsetTop = 106;

  return (
    <div className="relative min-h-screen flex flex-col bg-paper-2 text-ink">
      {!isDesktop && (
        <div
          className={`fixed inset-0 z-20 bg-black/15 transition-opacity duration-200 ${sidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="w-full z-30 fixed top-0">
        <Header />
      </div>

      <div className="flex flex-1" style={{ marginTop: '64px', '--sidebar-top': '64px' } as React.CSSProperties}>
        <div
          className={`z-30 transition-transform duration-200 ${isDesktop ? "translate-x-0 relative" : sidebarOpen ? "translate-x-0 fixed inset-y-0 left-0" : "-translate-x-full fixed inset-y-0 left-0"}`}
        >
          <Sidebar />
        </div>

        <main
          className={`transition-all duration-200 flex-1 bg-paper min-w-0 px-7 pt-7 pb-14 relative overflow-y-auto ${mainClassName || ""}`}
        >
          <div className="">
            {isImpersonating && (
              <div className="mb-4 flex items-center justify-center gap-3 bg-[#f3b237] px-4 py-3 text-center text-sm font-semibold text-white">
                <span>
                  You are impersonating {user?.firstName} {user?.lastName}
                </span>
                <button
                  type="button"
                  onClick={handleStopImpersonation}
                  className="rounded-md bg-white px-3 py-1 text-xs font-bold text-[#b27615]"
                >
                  Return to Administrator
                </button>
              </div>
            )}

            {children}

            {/* <main className="flex-1 bg-white p-4 md:p-6 lg:p-7">
            <div className="mx-auto w-full max-w-[1560px]">{children}</div>
          </main> */}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AppShell;
