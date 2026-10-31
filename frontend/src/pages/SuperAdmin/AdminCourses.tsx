import React from "react";
import { Link, useLocation } from "react-router";

const AdminCourses: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();

  const tabs = [
    { path: "/admin/courses", label: "Courses" },
    { path: "/admin/learning-paths", label: "Learning Paths" },
    { path: "/admin/certificates", label: "Learning Credentials" },
    { path: "/admin/certificate-settings", label: "Certificate Design" },
  ];

  const isCredentialsContext = location.pathname.startsWith("/admin/certificates") || location.pathname.startsWith("/admin/certificate-settings");
  
  const visibleTabs = tabs.filter(tab => 
    tab.path !== "/admin/certificate-settings" || isCredentialsContext
  );

  const isViewing = new URLSearchParams(location.search).get("view") === "true";

  return (
    <div className="flex flex-col h-full bg-white min-h-[calc(100vh-64px)] animate-in fade-in duration-300">
      <div className="w-full">
        {/* Tabs Container */}
        {!isViewing && (
          <div className="tabs border-b border-[#11111129] bg-white mb-[18px]">
            <nav className="relative z-10 -mb-[1px] flex space-x-8 pr-6 overflow-x-auto whitespace-nowrap scrollbar-hide">
              {visibleTabs.map((tab, index) => {
                const isActive = location.pathname.startsWith(tab.path);
                const isFirst = index === 0;
                return (
                  <Link
                    key={tab.path}
                    to={tab.path}
                    className={`pt-[8px] pb-[10px] px-6 text-[16px] border-b-[2px] transition-colors ${
                      isActive
                        ? "border-[#c99b2e] text-ink font-semibold"
                        : "border-transparent text-ink-mute font-medium hover:text-ink hover:border-line"
                    }`}
                  >
                    {tab.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        )}

        {/* Content Area */}
        <div className="p-0">
          {children}
        </div>
      </div>
    </div>
  );
};

export default AdminCourses;
