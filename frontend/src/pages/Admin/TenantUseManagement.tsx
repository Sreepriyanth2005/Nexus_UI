import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import { getTenantUserByIdApi, updateTenantUserStatusApi } from "../../core/api/tenantuser.api";
import { getAssignmentReportApi } from "../../core/api/corporate-learning.api";

import { Tabs } from "../../components/ui/Tabs";
import { Icon } from "../../components/ui/Icon";
import { Chip } from "../../components/ui/Chip";
import { Button } from "../../components/ui/Button";
import { Progress } from "../../components/ui/Progress";

interface TenantUseManagementProps {
  userId: string;
  onBack: () => void;
}

export const TenantUseManagement: React.FC<TenantUseManagementProps> = ({
  userId,
  onBack,
}) => {
  const [user, setUser] = useState<any>(null);
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  const fetchUserData = async () => {
    try {
      setLoading(true);
      setError(null);

      const userResponse = await getTenantUserByIdApi(userId);
      setUser(userResponse);

      const tenantId = (userResponse as any)?.tenantId || (userResponse as any)?.tenant?.id || ""; if (tenantId) {
        const report = await getAssignmentReportApi(tenantId, { userId });
        setDeliveries(report?.items || report || []);
      }
    } catch (err) {
      console.error("Failed to load user management details:", err);
      setError("Failed to load user management data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, [userId]);

  const handleUpdateStatus = async (newStatus: string) => {
    if (!user) return;
    try {
      await updateTenantUserStatusApi(userId, newStatus);
      await fetchUserData();
    } catch (err) {
      console.error("Failed to update user status:", err);
      alert("Failed to update user status. Please try again.");
    }
  };

  if (loading) {
    return (
      <main className="w-full animate-pulse">
        <button
          className="text-gray-300 font-sans text-[12px] tracking-[0.08em] uppercase font-semibold flex items-center gap-[6px] mb-[16px] bg-transparent border-none p-0"
          disabled
        >
          <div className="h-4 w-4 bg-gray-200 rounded"></div>
          <div className="h-4 w-24 bg-gray-200 rounded"></div>
        </button>

        {/* Profile Header Skeleton */}
        <div className="flex flex-wrap items-center gap-[20px] mb-[24px] p-[24px] px-[28px] border border-[#11111129] rounded-[14px] bg-white">
          <div className="w-[68px] h-[68px] rounded-full bg-gray-200 shrink-0"></div>
          
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-[10px] mb-[12px]">
              <div className="h-7 w-48 bg-gray-200 rounded"></div>
              <div className="h-6 w-20 bg-gray-200 rounded-full"></div>
              <div className="h-5 w-32 bg-gray-200 rounded ml-[6px]"></div>
            </div>
            
            <div className="flex flex-wrap gap-[7px]">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-[28px] w-32 bg-gray-200 rounded-full"></div>
              ))}
            </div>
          </div>
          
          <div className="flex flex-wrap justify-start md:justify-end gap-[8px] w-full md:w-auto">
            <div className="h-[34px] w-28 bg-gray-200 rounded-full"></div>
            <div className="h-[34px] w-24 bg-gray-200 rounded-full"></div>
            <div className="h-[34px] w-24 bg-gray-200 rounded-full"></div>
          </div>
        </div>

        {/* Tabs Skeleton */}
        <div className="flex gap-6 border-b border-[#1111111a] mb-[20px] pb-2">
          <div className="h-5 w-20 bg-gray-200 rounded"></div>
          <div className="h-5 w-24 bg-gray-200 rounded"></div>
          <div className="h-5 w-32 bg-gray-200 rounded"></div>
          <div className="h-5 w-24 bg-gray-200 rounded"></div>
        </div>

        {/* Overview KPI Cards Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[16px] mb-[16px]">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white border border-[#1111111a] rounded-[14px] p-[18px] pb-[16px] h-[120px]">
              <div className="w-[38px] h-[38px] rounded-[11px] bg-gray-200 mb-[12px]"></div>
              <div className="h-3 w-32 bg-gray-200 rounded mb-[8px]"></div>
              <div className="h-6 w-16 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </main>
    );
  }

  if (error || !user) {
    return (
      <div className="rounded-[14px] border border-[#c12a1c] bg-[#f7d9d4] p-6 text-center shadow-sm">
        <p className="text-[14px] font-medium text-[#9e2014]">{error || "User not found"}</p>
        <Button onClick={onBack} className="mt-4">Go Back</Button>
      </div>
    );
  }

  // --- Real Data Mappings ---
  const firstName = user.profile?.firstName || "";
  const lastName = user.profile?.lastName || "";
  const fullName = `${firstName} ${lastName}`.trim() || user.name || user.email || "N/A";
  const initials = (`${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase()) || "U";
  const email = user.email || "No email provided";
  const roleName = user.roles?.[0]?.role?.name || "User";
  const countryName = user.profile?.countryName || "";
  const isActive = user.status?.toUpperCase() === "ACTIVE";

  const joinedDateStr = user.createdAt || user.firstLoginAt;
  const joinedDate = joinedDateStr ? new Date(joinedDateStr).toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' }) : "Unknown";

  const lastLoginStr = user.lifecycle?.lastLoginAt || user.lastLoginAt;
  const lastLogin = lastLoginStr ? new Date(lastLoginStr).toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' }) : "Never";
  const lastLoginTime = lastLoginStr ? new Date(lastLoginStr).toLocaleTimeString("en-GB", { hour: '2-digit', minute: '2-digit' }) : "";

  // Metrics calculations
  const completedCoursesCount = deliveries.filter(d => (d?.status || "").toLowerCase() === "completed" || d?.progress === 100).length;

  const overdueCoursesCount = deliveries.filter(d => {
    const isCompleted = (d?.status || "").toLowerCase() === "completed" || d?.progress === 100;
    const deadline = d?.dueDate || d?.deadline;
    return !isCompleted && deadline && new Date(deadline) < new Date();
  }).length;

  const hoursLearned = deliveries.reduce((acc, curr) => acc + (Number(curr?.timeSpent) || Number(curr?.duration) || 0), 0) / 3600; // Assuming time is in seconds, modify if different

  const avgScore = deliveries.length > 0
    ? Math.round(deliveries.reduce((acc, curr) => acc + (Number(curr?.score) || 0), 0) / deliveries.length)
    : 0;

  const userCredentials = deliveries;
  const userActivity = (user.auditLogs || user.activityLog || []).map((log: any) => {
    if (log.time || log.item) return log;

    const actionLabel = log.action ? log.action.replace(/_/g, ' ') : "Unknown Action";

    let icon = "time";
    let color = "bg-[#f6f6f4] text-[#5c5c5c]";

    if (log.action?.includes('CREATE') || log.action?.includes('SUCCESS') || log.action?.includes('COMPLETED')) {
      icon = "check-simple";
      color = "bg-[#dce5d3] text-[#4e6a40]";
    } else if (log.action?.includes('LOGIN')) {
      icon = "login";
      color = "bg-[#e2e8f0] text-[#334155]";
    }

    return {
      action: actionLabel,
      item: log.entityType || "",
      desc: log.oldValue || log.newValue ? "Details updated" : "",
      time: new Date(log.createdAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      icon,
      color
    };
  });

  const handleExportData = () => {
    if (!user) return;

    const wb = XLSX.utils.book_new();

    // Sheet 1: Profile Details
    const profileData = [
      ["Field", "Value"],
      ["Name", fullName],
      ["Email", email],
      ["Role", roleName],
      ["Country", countryName || "N/A"],
      ["Status", isActive ? "Active" : "Inactive"],
      ["Joined Date", joinedDate],
      ["Last Login", `${lastLogin} ${lastLoginTime}`.trim()],
      ["Courses Enrolled", deliveries.length],
      ["Courses Completed", completedCoursesCount],
      ["Courses Overdue", overdueCoursesCount],
      ["Hours Learned", hoursLearned.toFixed(1)],
      ["Average Score", `${avgScore}%`]
    ];
    const wsProfile = XLSX.utils.aoa_to_sheet(profileData);
    XLSX.utils.book_append_sheet(wb, wsProfile, "Profile Details");

    // Sheet 2: Courses
    const coursesData = deliveries.map(d => ({
      "Course Name": d?.contentTitle || d?.course?.title || d?.title || "Untitled Course",
      "Status": d?.deliveryStatus || d?.status || "In progress",
      "Score": d?.score || "-",
      "Progress (%)": d?.progressPercent || d?.progress || 0,
      "Deadline": d?.dueDate || d?.deadline ? new Date(d?.dueDate || d?.deadline).toLocaleDateString("en-CA") : "-"
    }));
    const wsCourses = XLSX.utils.json_to_sheet(coursesData.length > 0 ? coursesData : [{ "Course Name": "No courses found" }]);
    XLSX.utils.book_append_sheet(wb, wsCourses, "Courses");

    // Sheet 3: Activity Log
    const activityData = userActivity.map((act: any) => ({
      "Action": act.action,
      "Item": act.item,
      "Description": act.desc,
      "Time": act.time
    }));
    const wsActivity = XLSX.utils.json_to_sheet(activityData.length > 0 ? activityData : [{ "Action": "No activity found" }]);
    XLSX.utils.book_append_sheet(wb, wsActivity, "Activity Log");

    // Download the file
    XLSX.writeFile(wb, `${fullName.replace(/\s+/g, '_')}_Profile_Data.xlsx`);
  };

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "courses", label: `Courses (${deliveries.length})` },
    { id: "proofs", label: `Learning credentials (${userCredentials.length})` },
    { id: "activity", label: "Activity log" }
  ];

  return (
    <main className="w-full">
      <button
        onClick={onBack}
        className="text-[#5c5c5c] font-sans text-[12px] tracking-[0.08em] uppercase font-semibold flex items-center gap-[6px] mb-[16px] transition-colors hover:text-[#141414] bg-transparent border-none p-0 cursor-pointer"
        aria-label="Back to Team"
      >
        <Icon size={13}>
          <line x1="19" y1="12" x2="5" y2="12"></line>
          <polyline points="12 19 5 12 12 5"></polyline>
        </Icon>
        Tenant users
      </button>

      {/* Profile Header */}
      <div
        className="flex flex-wrap items-center gap-[20px] mb-[24px] p-[24px] px-[28px] border border-[#11111129] rounded-[14px] relative overflow-hidden shadow-[0_6px_22px_-12px_#1111112e]"
        style={{ background: 'radial-gradient(120% 140% at 0% 0%, var(--c-honey-wash, #f6e8c4) 0%, transparent 42%), var(--paper, #ffffff)' }}
      >
        <div className="w-[68px] h-[68px] rounded-full shrink-0 overflow-hidden shadow-[0_0_0_3px_#fff,0_0_0_4px_#c99b2e] bg-[#141414] grid place-items-center text-white text-[24px] font-bold">
          {initials}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-[10px] mb-[12px]">
            <h1 className="font-sans text-[24px] tracking-[-0.02em] text-[#141414] m-0 font-bold leading-[1.1]">
              {fullName}
            </h1>
            <Chip status={isActive ? "success" : "danger"} className="!h-[24px] !px-[10px]">
              <div className="flex items-center gap-[5px] text-[12px]">
                <div className={`w-[6px] h-[6px] rounded-full ${isActive ? 'bg-[#2e9f5b]' : 'bg-[#c12a1c]'}`} />
                {isActive ? "Active" : "Inactive"}
              </div>
            </Chip>
            <span className="font-sans text-[12px] font-bold text-[#141414] ml-[6px]">{roleName}</span>
          </div>

          <div className="flex flex-wrap gap-[7px]">
            <span className="inline-flex items-center gap-[6px] px-[11px] py-[5px] rounded-full bg-white border border-[#11111129] text-[14px] text-[#5c5c5c] font-medium leading-[1.4]">
              <Icon size={13} className="text-[#8c8c8c]"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></Icon>
              {email}
            </span>
            {countryName && (
              <span className="inline-flex items-center gap-[6px] px-[11px] py-[5px] rounded-full bg-white border border-[#11111129] text-[14px] text-[#5c5c5c] font-medium leading-[1.4]">
                <Icon size={13} className="text-[#8c8c8c]"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></Icon>
                {countryName}
              </span>
            )}
            <span className="inline-flex items-center gap-[6px] px-[11px] py-[5px] rounded-full bg-white border border-[#11111129] text-[14px] text-[#5c5c5c] font-medium leading-[1.4]">
              <Icon size={13} className="text-[#8c8c8c]"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></Icon>
              Joined {joinedDate}
            </span>
            <span className="inline-flex items-center gap-[6px] px-[11px] py-[5px] rounded-full bg-white border border-[#11111129] text-[14px] text-[#5c5c5c] font-medium leading-[1.4]">
              <Icon size={13} className="text-[#8c8c8c]"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></Icon>
              Last active: {lastLogin}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap justify-start md:justify-end gap-[8px] w-full md:w-auto">
          <button onClick={handleExportData} className="flex items-center justify-center gap-[6px] w-[130.1px] h-[39.3px] px-[16px] rounded-full bg-[#fdf2b1] border border-[#d6c778] text-[#141414] text-[14px] font-medium hover:bg-[#f5e9a4] transition-colors cursor-pointer">
            <Icon size={14}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></Icon>
            Export data
          </button>
          <button
            className={`flex items-center justify-center w-[89.28px] h-[39.3px] px-[16px] rounded-full border border-[#d9d9d9] text-[14px] font-medium transition-colors ${roleName === "Corporate Admin" ? "bg-[#f9f9f9] text-[#a0a0a0] cursor-not-allowed opacity-50" : "bg-white text-[#141414] hover:bg-[#f6f6f6] cursor-pointer"}`}
            onClick={() => handleUpdateStatus(isActive ? "SUSPENDED" : "ACTIVE")}
            disabled={roleName === "Corporate Admin"}
          >
            {isActive ? "Suspend" : "Activate"}
          </button>
          <button
            className={`flex items-center justify-center w-[130.1px] h-[39.3px] px-[16px] rounded-full border border-[#d9d9d9] text-[14px] font-medium transition-colors ${roleName === "Corporate Admin" || user.status?.toUpperCase() === "INACTIVE" ? "bg-[#f9f9f9] text-[#a0a0a0] cursor-not-allowed opacity-50" : "bg-white text-[#141414] hover:bg-[#f6f6f6] cursor-pointer"}`}
            onClick={() => handleUpdateStatus("INACTIVE")}
            disabled={roleName === "Corporate Admin" || user.status?.toUpperCase() === "INACTIVE"}
          >
            {user.status?.toUpperCase() === "INACTIVE" ? "Deactivated" : "Deactivate"}
          </button>
        </div>
      </div>

      <Tabs
        tabs={tabs}
        value={activeTab}
        onChange={setActiveTab}
        className="mb-[20px] overflow-x-auto"
        tabClassName="!text-[14px]"
      />

      {/* OVERVIEW PANEL */}
      {activeTab === "overview" && (
        <div className="flex flex-col gap-[16px]">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[16px] mb-[16px]">
            <div className="bg-white border border-[#1111111a] rounded-[14px] p-[18px] pb-[16px] shadow-[0_4px_16px_-4px_rgba(42,17,8,0.06)] flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_24px_-4px_rgba(42,17,8,0.12)] cursor-pointer">
              <div className="grid place-items-center w-[38px] h-[38px] rounded-[11px] mb-[12px] bg-[#f6e8c4] text-[#8b6a1f]">
                <Icon size={20}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></Icon>
              </div>
              <div>
                <div className="font-sans text-[12px] tracking-[0.08em] uppercase text-[#5c5c5c] mb-[8px] font-semibold">Courses Enrolled</div>
                <div className="text-[20px] text-[#141414] flex items-baseline gap-[4px] font-extrabold">{deliveries.length}</div>
              </div>
            </div>
            <div className="bg-white border border-[#1111111a] rounded-[14px] p-[18px] pb-[16px] shadow-[0_4px_16px_-4px_rgba(42,17,8,0.06)] flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_24px_-4px_rgba(42,17,8,0.12)] cursor-pointer">
              <div className="grid place-items-center w-[38px] h-[38px] rounded-[11px] mb-[12px] bg-[#dce5d3] text-[#4e6a40]">
                <Icon size={20}><polyline points="20 6 9 17 4 12"></polyline></Icon>
              </div>
              <div>
                <div className="font-sans text-[12px] tracking-[0.08em] uppercase text-[#5c5c5c] mb-[8px] font-semibold">Courses completed</div>
                <div className="text-[20px] text-[#141414] flex items-baseline gap-[4px] font-extrabold">{completedCoursesCount}</div>
              </div>
            </div>
            <div className="bg-white border border-[#1111111a] rounded-[14px] p-[18px] pb-[16px] shadow-[0_4px_16px_-4px_rgba(42,17,8,0.06)] flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_24px_-4px_rgba(42,17,8,0.12)] cursor-pointer">
              <div className="grid place-items-center w-[38px] h-[38px] rounded-[11px] mb-[12px] bg-[#efd3c7] text-[#b8523e]">
                <Icon size={20}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></Icon>
              </div>
              <div>
                <div className="font-sans text-[12px] tracking-[0.08em] uppercase text-[#5c5c5c] mb-[8px] font-semibold">Overdue</div>
                <div className="text-[20px] text-[#b8523e] flex items-baseline gap-[4px] font-extrabold">{overdueCoursesCount}</div>
              </div>
            </div>
            <div className="bg-white border border-[#1111111a] rounded-[14px] p-[18px] pb-[16px] shadow-[0_4px_16px_-4px_rgba(42,17,8,0.06)] flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_24px_-4px_rgba(42,17,8,0.12)] cursor-pointer">
              <div className="grid place-items-center w-[38px] h-[38px] rounded-[11px] mb-[12px] bg-[#dce5d3] text-[#4e6a40]">
                <Icon size={20}><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></Icon>
              </div>
              <div>
                <div className="font-sans text-[12px] tracking-[0.08em] uppercase text-[#5c5c5c] mb-[8px] font-semibold">Hours learned</div>
                <div className="text-[20px] text-[#141414] flex items-baseline gap-[4px] font-extrabold">{hoursLearned.toFixed(1)}<span className="font-medium text-[#5c5c5c] text-[20px]">h</span></div>
              </div>
            </div>
            <div className="bg-white border border-[#1111111a] rounded-[14px] p-[18px] pb-[16px] shadow-[0_4px_16px_-4px_rgba(42,17,8,0.06)] flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_24px_-4px_rgba(42,17,8,0.12)] cursor-pointer">
              <div className="grid place-items-center w-[38px] h-[38px] rounded-[11px] mb-[12px] bg-[#efd3c7] text-[#b8523e]">
                <Icon size={20}><circle cx="12" cy="8" r="6"></circle><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"></path></Icon>
              </div>
              <div>
                <div className="font-sans text-[12px] tracking-[0.08em] uppercase text-[#5c5c5c] mb-[8px] font-semibold">Avg score</div>
                <div className="text-[20px] text-[#141414] flex items-baseline gap-[4px] font-extrabold">
                  {avgScore}
                  <span className="font-medium text-[#5c5c5c] text-[20px]">%</span>
                </div>
              </div>
            </div>
            <div className="bg-white border border-[#1111111a] rounded-[14px] p-[18px] pb-[16px] shadow-[0_4px_16px_-4px_rgba(42,17,8,0.06)] flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_24px_-4px_rgba(42,17,8,0.12)] cursor-pointer">
              <div className="grid place-items-center w-[38px] h-[38px] rounded-[11px] mb-[12px] bg-[#dce5d3] text-[#4e6a40]">
                <Icon size={20}><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></Icon>
              </div>
              <div>
                <div className="font-sans text-[12px] tracking-[0.08em] uppercase text-[#5c5c5c] mb-[8px] font-semibold">Last login</div>
                <div className="text-[20px] text-[#141414] flex items-baseline gap-[4px] font-extrabold">{lastLogin}</div>
                {lastLoginTime && <div className="font-sans text-[12px] text-[#5c5c5c] mt-[5px]">{lastLoginTime}</div>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* COURSES PANEL */}
      {activeTab === "courses" && (
        <div className="bg-white border border-[#1111111a] rounded-[14px] shadow-[0_4px_16px_-4px_rgba(42,17,8,0.06)] overflow-hidden">
          <div className="flex justify-between items-center gap-[12px] p-[18px] px-[20px] pb-[14px] border-b border-[#1111111a]">
            <div className="text-[16px] text-[#141414] font-extrabold">All courses · {deliveries.length} enrolled</div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[14px] border-collapse">
              <thead>
                <tr>
                  <th className="font-sans text-[14px] tracking-[0.08em] uppercase text-[#5c5c5c] text-left border-b border-[#1111111a] py-[12px] px-[20px] whitespace-nowrap font-bold">Course</th>
                  <th className="font-sans text-[14px] tracking-[0.08em] uppercase text-[#5c5c5c] text-left border-b border-[#1111111a] py-[12px] px-[20px] whitespace-nowrap font-bold">Status</th>
                  <th className="font-sans text-[14px] tracking-[0.08em] uppercase text-[#5c5c5c] text-left border-b border-[#1111111a] py-[12px] px-[20px] whitespace-nowrap font-bold">Score</th>
                  <th className="font-sans text-[14px] tracking-[0.08em] uppercase text-[#5c5c5c] text-left border-b border-[#1111111a] py-[12px] px-[20px] whitespace-nowrap font-bold">Progress</th>
                  <th className="font-sans text-[14px] tracking-[0.08em] uppercase text-[#5c5c5c] text-left border-b border-[#1111111a] py-[12px] px-[20px] whitespace-nowrap font-bold">Deadline</th>
                </tr>
              </thead>
              <tbody>
                {deliveries.length > 0 ? deliveries.map((d, i) => {
                  const title = d?.contentTitle || d?.course?.title || d?.title || "Untitled Course";
                  const status = d?.deliveryStatus || d?.status || "In progress";
                  const score = d?.score || "-";
                  const progress = d?.progressPercent || d?.progress || 0;
                  const deadlineRaw = d?.dueDate || d?.deadline;
                  const deadline = deadlineRaw ? new Date(deadlineRaw).toLocaleDateString("en-CA") : "-"; // e.g. 2026-04-30
                  const isCompleted = status.toLowerCase() === "completed" || progress === 100;

                  return (
                    <tr key={i} className="hover:bg-[#f6f6f4] transition-colors cursor-pointer border-b border-[#1111111a] last:border-none">
                      <td className="text-[#141414] text-[16px] py-[16px] px-[20px] align-middle">{title}</td>
                      <td className="text-[#141414] py-[16px] px-[20px] align-middle">
                        {isCompleted ? (
                          <Chip status="success" className="!h-[26px] bg-[#dce5d3] text-[#6d965e] !border-none !rounded-full !px-[12px]">
                            <div className="flex items-center gap-[6px] font-bold text-[12px]">
                              <div className="w-[6px] h-[6px] rounded-full bg-[#6d965e]" />
                              Course completed
                            </div>
                          </Chip>
                        ) : status.toLowerCase() === "dropped" ? (
                          <Chip status="danger" className="!h-[26px] bg-[#ebd1c8] text-[#a85e45] !border-none font-bold !rounded-full !px-[12px]">
                            <div className="flex items-center gap-[6px] text-[12px]">
                              <div className="w-[6px] h-[6px] rounded-full bg-[#a85e45]" />
                              Dropped
                            </div>
                          </Chip>
                        ) : (
                          <Chip status="warning" className="!h-[26px] bg-[#f5e4bd] text-[#916b25] !border-none font-bold !rounded-full !px-[12px] text-[12px]">
                            In progress
                          </Chip>
                        )}
                      </td>
                      <td className="text-[#141414] text-[16px] py-[16px] px-[20px] align-middle">{score}</td>
                      <td className="text-[#141414] py-[16px] px-[20px] align-middle">
                        <div className="flex items-center gap-[12px] min-w-[140px]">
                          <div className="flex-1 h-[6px] bg-[#e5e5e5] rounded-full overflow-hidden">
                            <div className="h-full bg-[#dca83a] rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
                          </div>
                          <span className="text-[12px] font-bold text-[#141414] w-[32px] text-right tabular-nums">{progress}%</span>
                        </div>
                      </td>
                      <td className="text-[#141414] py-[16px] px-[20px] align-middle font-sans tabular-nums text-[16px] font-medium">{deadline}</td>
                    </tr>
                  )
                }) : (
                  <tr>
                    <td colSpan={5} className="py-[32px] text-center text-[#5c5c5c] font-medium">No courses found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PROOFS PANEL */}
      {activeTab === "proofs" && (
        <div className="bg-white border border-[#1111111a] rounded-[14px] shadow-[0_4px_16px_-4px_rgba(42,17,8,0.06)] overflow-hidden">
          <div className="flex justify-between items-center gap-[12px] p-[18px] px-[20px] pb-[14px]">
            <div className="text-[16px] text-[#141414] font-extrabold">Learning credentials · {userCredentials.length}</div>
          </div>
          <div className="flex flex-col">
            {userCredentials.length > 0 ? userCredentials.map((cred: any, i: number) => {
              const isCompleted = (cred.deliveryStatus || cred.status || "").toLowerCase() === "completed" || cred.progressPercent === 100 || cred.progress === 100;
              const title = cred.contentTitle || cred.title || "Course";
              const progress = cred.progressPercent || cred.progress || 0;
              const isNotStarted = !isCompleted && progress === 0;
              const dateStr = cred.assignedAt || cred.startDate || cred.createdAt;
              const date = dateStr ? new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : "N/A";

              const statusLabel = isCompleted ? 'Course completed' : isNotStarted ? 'Course not started' : 'Course in progress';
              const subtitle = `${statusLabel} · ${date} · Score ${progress}%`;

              const downloadExcel = () => {
                const data = [
                  ["Course Name", "Status", "Date", "Score"],
                  [title, isCompleted ? "Completed" : isNotStarted ? "Not Started" : "In Progress", date, `${progress}%`]
                ];
                const csvContent = data.map(e => e.join(",")).join("\n");
                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.setAttribute("href", url);
                link.setAttribute("download", `${title.replace(/\\s+/g, '_')}_credential.csv`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              };

              return (
                <div key={i} className="flex items-center justify-between p-[16px] px-[20px] border-t border-[#1111111a] hover:bg-[#f6f6f4] transition-colors cursor-pointer">
                  <div className="flex items-center gap-[16px]">
                    <div className={`w-[36px] h-[36px] rounded-[8px] flex items-center justify-center shrink-0 border border-[#1111111a] ${isCompleted ? 'bg-[#dce5d3] text-[#4e6a40]' : isNotStarted ? 'bg-[#f6f6f4] text-[#5c5c5c]' : 'bg-[#f5e4bd] text-[#916b25]'}`}>
                      <Icon size={16}>
                        {isCompleted && (
                          <><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></>
                        )}
                        {isNotStarted && (
                          <><circle cx="12" cy="12" r="10"></circle><line x1="8" y1="12" x2="16" y2="12"></line></>
                        )}
                        {!isCompleted && !isNotStarted && (
                          <><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></>
                        )}
                      </Icon>
                    </div>
                    <div className="flex flex-col gap-[2px]">
                      <span className="font-semibold text-[#141414] text-[16px]">{title}</span>
                      <span className="text-[#5c5c5c] text-[14px]">{subtitle}</span>
                    </div>
                  </div>
                  <Button onClick={(e) => { e.stopPropagation(); downloadExcel(); }} variant="ghost" className="rounded-full border border-[#1111111a] h-[34px] px-[16px] text-[14px] font-bold text-[#141414] shadow-sm hover:bg-[#f6f6f4]">
                    Download
                  </Button>
                </div>
              );
            }) : (
              <div className="py-[32px] text-center text-[#5c5c5c] font-medium border-t border-[#1111111a]">
                No learning credentials found.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ACTIVITY PANEL */}
      {activeTab === "activity" && (
        <div className="bg-white border border-[#1111111a] rounded-[14px] shadow-[0_4px_16px_-4px_rgba(42,17,8,0.06)] overflow-hidden">
          <div className="flex justify-between items-center gap-[12px] p-[18px] px-[20px] pb-[14px]">
            <div className="text-[16px] text-[#141414] font-extrabold font-sans">Activity log</div>
          </div>
          <div className="flex flex-col font-sans">
            {userActivity.length > 0 ? userActivity.map((act: any, i: number) => (
              <div key={i} className="flex items-start justify-between p-[18px] px-[20px] border-t border-[#1111111a] hover:bg-[#f6f6f4] transition-colors">
                <div className="flex items-start gap-[16px]">
                  <div className={`w-[36px] h-[36px] rounded-[8px] flex items-center justify-center shrink-0 ${act.color || 'bg-[#f6f6f4] text-[#5c5c5c]'}`}>
                    {act.icon === "time" && <Icon size={18}><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></Icon>}
                    {act.icon === "check" && <Icon size={18}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></Icon>}
                    {act.icon === "check-simple" && <Icon size={18}><polyline points="20 6 9 17 4 12"></polyline></Icon>}
                    {act.icon === "login" && <Icon size={18}><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path><polyline points="10 17 15 12 10 7"></polyline><line x1="15" y1="12" x2="3" y2="12"></line></Icon>}
                    {!act.icon && <Icon size={18}><circle cx="12" cy="12" r="10"></circle></Icon>}
                  </div>
                  <div className="flex flex-col gap-[2px] mt-[1px]">
                    <div className="text-[16px]">
                      <span className="font-bold text-[#141414]">{act.action}</span>
                      {act.item && <span className="text-[#141414] font-semibold"> · {act.item}</span>}
                    </div>
                    <span className="text-[#5c5c5c] text-[14px]">{act.desc}</span>
                  </div>
                </div>
                <div className="text-[#5c5c5c] text-[14px] font-bold uppercase tracking-wider mt-[4px] font-mono">
                  {act.time}
                </div>
              </div>
            )) : (
              <div className="py-[32px] text-center text-[#5c5c5c] font-medium border-t border-[#1111111a]">
                No recent activity found.
              </div>
            )}
          </div>
        </div>
      )}

    </main>
  );
};