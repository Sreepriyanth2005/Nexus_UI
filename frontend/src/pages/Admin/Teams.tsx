import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import {
  useGetTenantById,
  useTenantDashboard,
  useTenantUsersByTenantId,
  useTenantAdminsByTenantId,
} from "../../hooks/tenant";
import { TenantUseManagement } from "./TenantUseManagement";
import { useGroupStore } from "../../store/group.store";
import { 
  getAssignmentReportApi, 
  getAvailableCoursesApi, 
  getAvailableCareerPathsApi, 
  bulkAssignCorporateLearningApi 
} from "../../core/api/corporate-learning.api";
import { getInviteHistoryApi, resendInviteApi, createInviteApi } from "../../core/api/tenantuser.api";
import { Modal } from "../../components/ui/Modal/Modal"; const getStatusStyles = (status: string) => {
  switch (status?.toUpperCase()) {
    case "ACTIVE":
      return "bg-green-50 text-green-700 border-green-200";

    case "PENDING":
      return "bg-yellow-50 text-yellow-700 border-yellow-200";

    case "INACTIVE":
      return "bg-red-50 text-red-700 border-red-200";

    default:
      return "bg-gray-100 text-gray-700 border-gray-200";
  }
};

// Resolves the current tenantId the same way the rest of the app does:
// from the Keycloak session object in localStorage.

import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { Checkbox } from "../../components/ui/Checkbox";
import { Chip } from "../../components/ui/Chip";
import { Progress } from "../../components/ui/Progress";
import { Icon } from "../../components/ui/Icon";

const getTenantId = (): string => {
  try {
    const storedUser = localStorage.getItem("keycloak_session_user");
    if (!storedUser) return "";
    const parsed = JSON.parse(storedUser);
    const user = parsed?.user || parsed;
    return user?.tenantId || user?.tenant?.id || user?.organizationId || "";

  } catch (error) {
    console.error("Failed to get tenantId", error);
    return "";
  }
};

const formatLastActive = (dateString: string | null | undefined, status: string) => {
  if (status === 'INVITED' || status === 'Invited' || status === 'PENDING') return 'Invited';
  if (!dateString || dateString === 'Never') return 'Never';

  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;

  const now = new Date();
  const diffTime = now.getTime() - date.getTime();
  if (diffTime < 0) return 'Today'; 
  
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    if (now.getDate() === date.getDate() && now.getMonth() === date.getMonth() && now.getFullYear() === date.getFullYear()) {
      return 'Today';
    }
    return 'Yesterday';
  }
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 14) return '1 week ago';
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 60) return '1 month ago';
  return `${Math.floor(diffDays / 30)} months ago`;
};

const getStatusProps = (status: string): { hue: any; label: string; textClass: string; dotClass: string } => {
  switch (status?.toUpperCase()) {
    case "ACTIVE": return { hue: "success", label: "Active", textClass: "text-[#2e9f5b]", dotClass: "bg-[#2e9f5b]" };
    case "PENDING": case "INVITED": return { hue: "warning", label: status, textClass: "text-[#c99b2e]", dotClass: "bg-[#c99b2e]" };
    case "INACTIVE": case "SUSPENDED": return { hue: "danger", label: status, textClass: "text-[#c12a1c]", dotClass: "bg-[#c12a1c]" };
    default: return { hue: "muted", label: status || "Unknown", textClass: "text-[#141414]-mute", dotClass: "bg-ink-mute" };
  }
};

const SortIcon = () => (
  <Icon size={12} className="inline ml-1 text-[#141414]-faint opacity-50">
    <path d="M7 10L12 5l5 5M7 14l5 5 5-5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Icon>
);

const Teams: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [tenant, setTenant] = useState<any>(null);
  const [metrics, setMetrics] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"users" | "invites" | "groups" | "configurations">("users");

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [filteredMembers, setFilteredMembers] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(location.state?.selectedUserId || null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const [isAddGroupModalOpen, setIsAddGroupModalOpen] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [savingGroup, setSavingGroup] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Assign Course Modal State
  const [isAssignCourseModalOpen, setIsAssignCourseModalOpen] = useState(false);
  const [availableContent, setAvailableContent] = useState<any[]>([]);
  const [selectedContent, setSelectedContent] = useState<any | null>(null);
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [resendingIds, setResendingIds] = useState<Set<string>>(new Set());

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const { groups, fetchGroups, getGroupMembers, updateGroup } = useGroupStore();

  const loadAvailableContent = async () => {
    const tenantId = getTenantId();
    if (!tenantId) return;
    try {
      setIsLoadingContent(true);
      const [coursesData, pathsData] = await Promise.all([
        getAvailableCoursesApi(tenantId, { limit: 100 }).catch(() => []),
        getAvailableCareerPathsApi(tenantId, { limit: 100 }).catch(() => []),
      ]);

      const coursesList = Array.isArray(coursesData) ? coursesData : (coursesData?.items || []);
      const pathsList = Array.isArray(pathsData) ? pathsData : (pathsData?.items || []);

      let opts: any[] = [
        ...coursesList.map((c: any) => ({
          ...c,
          id: c.id,
          title: c.title,
          contentType: "COURSE",
          isCareerPath: false,
          thumbnailUrl: c.thumbnailUrl || c.coverImage || c.coverImageUrl || c.thumbnailAsset?.signedUrl || c.thumbnailAsset?.url || c.thumbnailAsset?.fileUrl || null,
        })),
        ...pathsList.map((cp: any) => ({
          ...cp,
          id: cp.id,
          title: cp.title,
          contentType: "CAREER_PATH",
          isCareerPath: true,
          thumbnailUrl: cp.coverImageUrl || cp.coverImage || cp.thumbnailUrl || cp.coverImageAsset?.signedUrl || cp.coverImageAsset?.url || cp.coverImageAsset?.fileUrl || null,
        })),
      ];

      // Strictly filter to PUBLISHED content and enforce visibility logic identical to /course-assignment page
      opts = opts.filter((opt: any) => {
        if (opt.status?.toUpperCase() !== "PUBLISHED") return false;

        const visibility = String(opt.visibility || "PUBLIC_CATALOG").toUpperCase();
        if (visibility === "PUBLIC_CATALOG") return false;

        return true;
      });

      setAvailableContent(opts);
    } catch (err) {
      console.error("Failed to load available content", err);
    } finally {
      setIsLoadingContent(false);
    }
  };

  const handleAssignCourseClick = () => {
    if (selectedIds.size === 0) {
      alert("Please select at least one team member to assign a course.");
      return;
    }
    const hasCorporateAdmin = Array.from(selectedIds).some(id => {
      const user = members.find(m => m.id === id);
      const roleStr = (user?.role || user?.roleName || user?.roleCode || '').toUpperCase();
      return roleStr.includes('ADMIN');
    });
    if (hasCorporateAdmin) {
      alert("Corporate Admins cannot be assigned courses.");
      return;
    }
    setSelectedContent(null);
    setIsAssignCourseModalOpen(true);
    loadAvailableContent();
  };

  const handleConfirmAssign = async () => {
    const tenantId = getTenantId();
    if (!tenantId || !selectedContent) return;

    try {
      setIsAssigning(true);
      await bulkAssignCorporateLearningApi(tenantId, {
        items: [{
          contentType: selectedContent.contentType,
          contentId: selectedContent.id,
          requirement: "MANDATORY",
        }],
        scope: "USER",
        userIds: Array.from(selectedIds),
        notifyUsers: true,
      });

      setIsAssignCourseModalOpen(false);
      showToast(`Successfully assigned "${selectedContent.title}" to ${selectedIds.size} team member(s).`);
      setSelectedIds(new Set());
      setSelectedContent(null);
      await loadData();
    } catch (err: any) {
      console.error("Failed to assign course", err);
      alert(err?.response?.data?.message || err?.message || "Failed to assign course. Please try again.");
    } finally {
      setIsAssigning(false);
    }
  };

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === filteredMembers.length && filteredMembers.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredMembers.map(m => m.id)));
    }
  };

  const allSelected = filteredMembers.length > 0 && selectedIds.size === filteredMembers.length;
  const someSelected = selectedIds.size > 0 && !allSelected;

  const { mutateAsync: getTenant } = useGetTenantById();
  const { mutateAsync: getDashboard } = useTenantDashboard();
  const { mutateAsync: fetchTenantUsers } = useTenantUsersByTenantId();
  const { mutateAsync: fetchTenantAdmins } = useTenantAdminsByTenantId();

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const tenantId = getTenantId();
      if (!tenantId) {
        setError("Tenant ID not found. Please log in again.");
        return;
      }

      const [tenantData, dashboardData, rawUsers, rawAdmins, assignmentReport, inviteHistory] = await Promise.all([
        getTenant(tenantId).catch((e) => { console.error('getTenant failed', e); return null; }),
        getDashboard(tenantId).catch((e) => { console.error('getDashboard failed', e); return null; }),
        fetchTenantUsers(tenantId).catch((e) => { console.error('fetchTenantUsers failed', e); return []; }),
        fetchTenantAdmins(tenantId).catch((e) => { console.error('fetchTenantAdmins failed', e); return []; }),
        fetchGroups(tenantId).catch((e) => { console.error('fetchGroups failed', e); return []; }),
        getAssignmentReportApi(tenantId, { limit: 100 }).catch((e) => { console.error('getAssignmentReportApi failed', e); return []; }),
        getInviteHistoryApi(tenantId).catch((e) => { console.error('getInviteHistoryApi failed', e); return { invitations: [] }; })
      ]);

      setTenant(tenantData);

      setMetrics({
        totalUsers: dashboardData?.users?.totalUsers || 0,
        activeUsers: dashboardData?.users?.activeUsers || 0,
        inactiveUsers: dashboardData?.users?.inactiveUsers || 0,
        totalSeats: dashboardData?.seats?.totalSeats || 0,
        allocatedSeats: dashboardData?.seats?.allocatedSeats || 0,
        availableSeats: dashboardData?.seats?.availableSeats || 0,
        invitedUsers: (dashboardData?.users?.totalUsers || 0) - (dashboardData?.users?.activeUsers || 0) - (dashboardData?.users?.inactiveUsers || 0)
      });

      const assignmentItems: any[] = (assignmentReport as any)?.items || (Array.isArray(assignmentReport) ? assignmentReport : []);

      const userAssignmentsMap: Record<string, { count: number; totalProgress: number; items: any[] }> = {};
      for (const item of assignmentItems) {
        const uid = item.userId;
        if (!uid) continue;
        if (!userAssignmentsMap[uid]) {
          userAssignmentsMap[uid] = { count: 0, totalProgress: 0, items: [] };
        }
        userAssignmentsMap[uid].count++;
        userAssignmentsMap[uid].totalProgress += Number(item.progressPercent ?? 0);
        userAssignmentsMap[uid].items.push(item);
      }

      const normalise = (person: any, sourceRole: string) => {
        const uid = person.id || person.userId || "";
        const reportData = userAssignmentsMap[uid];

        let courseCount = Number(person.courseCount ?? 0);
        let progressValue = Number(person.progressPercentage ?? 0);

        if (reportData && reportData.count > 0) {
          courseCount = reportData.count;
          progressValue = Math.round(reportData.totalProgress / reportData.count);
        } else {
          const deliveries = person.corporateAssignmentDeliveries || [];
          const courses = person.courseProgress || [];
          const paths = person.careerPathProgresses || [];

          if (deliveries.length > 0) {
            courseCount = deliveries.length;
            const assignedCourseIds = new Set(deliveries.map((d: any) => d.courseId).filter(Boolean));
            const assignedPathIds = new Set(deliveries.map((d: any) => d.careerPathId).filter(Boolean));

            const relevantCourses = courses.filter((c: any) => assignedCourseIds.has(c.courseId));
            const relevantPaths = paths.filter((p: any) => assignedPathIds.has(p.careerPathId));

            const sum = relevantCourses.reduce((acc: number, c: any) => acc + (c.completed ? 100 : Number(c.progress || 0)), 0)
                      + relevantPaths.reduce((acc: number, p: any) => acc + (p.completed ? 100 : Number(p.progress || 0)), 0);
            
            progressValue = Math.round(sum / courseCount);
          } else {
            courseCount = 0;
            progressValue = 0;
          }
        }

        const invitationsList = inviteHistory?.invitations || [];
        const personEmail = (person.email || "").toLowerCase().trim();
        const userInvitation = invitationsList.find((i: any) => 
          (i.userId && uid && i.userId === uid) || 
          (i.email && personEmail && i.email.toLowerCase().trim() === personEmail) || 
          (i.user && i.user.id && uid && i.user.id === uid)
        );

        return {
          id: uid,
          invitationId: person.invitationId || userInvitation?.id || null,
          name: `${person?.profile?.firstName || person.firstName || ""} ${person?.profile?.lastName || person.lastName || ""}`.trim() || person.name || "N/A",
          email: person.email || "",
          role: person?.roles?.[0]?.role?.name || person?.roleName || person?.role?.name || sourceRole,
          courses: courseCount,
          progressValue: Math.min(100, Math.max(0, progressValue)),
          lastActive: person?.lifecycle?.lastLoginAt || person.lastLoginAt || person.lastActive || "Never",
          status: person.status || "ACTIVE",
          firstLoginAt: person.firstLoginAt || null,
          lifecycle: person.lifecycle || null,
          departmentAssignments: person.departmentAssignments || [],
        };
      };

      const adminRows = (Array.isArray(rawAdmins) ? rawAdmins : []).map(a => normalise(a, "Corporate Admin"));
      const userRows = (Array.isArray(rawUsers) ? rawUsers : []).map(u => normalise(u, "Corporate User"));

      const seen = new Set<string>();
      const merged = [...adminRows, ...userRows].filter((row) => {
        if (!row.id || seen.has(row.id)) return false;
        seen.add(row.id);
        return true;
      });

      setMembers(merged);
    } catch (err) {
      console.error(err);
      setError("Failed to load team data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    let filtered = [...members];
    if (searchTerm) {
      filtered = filtered.filter(m =>
        m.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (statusFilter) {
      filtered = filtered.filter(m => m.status?.toUpperCase() === statusFilter.toUpperCase());
    }
    if (roleFilter) {
      filtered = filtered.filter(m => m.role?.toLowerCase().includes(roleFilter.toLowerCase()));
    }
    setFilteredMembers(filtered);
  }, [members, searchTerm, statusFilter, roleFilter]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white pb-[60px] animate-pulse">
        <div className="w-full">
          {/* Header Skeleton */}
          <div className="mb-[24px] md:mb-[32px] flex flex-col md:flex-row md:items-start justify-between gap-[16px]">
            <div className="w-full max-w-3xl">
              <div className="h-3 bg-gray-200 rounded w-[200px] mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-[150px] mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-[300px]"></div>
            </div>
            <div className="flex flex-wrap gap-[12px] md:mt-[16px]">
              <div className="h-[32px] bg-gray-200 rounded-full w-[100px]"></div>
              <div className="h-[32px] bg-gray-200 rounded-full w-[120px]"></div>
            </div>
          </div>
          {/* Stats Row Skeleton */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-[16px] lg:gap-[24px] mb-[24px] md:mb-[32px]">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="p-[16px] md:p-[20px] bg-white border border-[#1111111a] rounded-[14px] h-[160px]">
                <div className="w-[42px] h-[42px] rounded-[10px] bg-gray-200 mb-[24px]"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-[8px]"></div>
                <div className="h-6 bg-gray-200 rounded w-1/3"></div>
              </div>
            ))}
          </div>
          {/* Filter Row Skeleton */}
          <div className="flex flex-col lg:flex-row lg:items-center gap-[12px] mb-[20px]">
            <div className="h-[40px] bg-gray-200 rounded-[8px] w-full lg:w-[300px]"></div>
            <div className="flex gap-[12px] w-full lg:w-auto">
              <div className="h-[40px] bg-gray-200 rounded-[8px] flex-1 lg:w-[160px]"></div>
              <div className="h-[40px] bg-gray-200 rounded-[8px] flex-1 lg:w-[160px]"></div>
            </div>
            <div className="lg:ml-auto h-[40px] bg-gray-200 rounded-[100px] w-[120px]"></div>
          </div>
          {/* Table Area Skeleton */}
          <div className="bg-white border border-[#1111111a] rounded-[14px] h-[400px]">
            <div className="h-[60px] border-b border-[#1111111a] px-[16px] flex items-center justify-between">
              <div className="h-5 bg-gray-200 rounded w-[150px]"></div>
              <div className="flex gap-2">
                <div className="h-[32px] bg-gray-200 rounded-full w-[80px]"></div>
                <div className="h-[32px] bg-gray-200 rounded-full w-[80px]"></div>
              </div>
            </div>
            <div className="p-[16px]">
              <div className="h-10 bg-gray-200 rounded w-full mb-[10px]"></div>
              <div className="h-10 bg-gray-200 rounded w-full mb-[10px]"></div>
              <div className="h-10 bg-gray-200 rounded w-full mb-[10px]"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  if (error) return (
    <div className="flex h-screen flex-col items-center justify-center gap-4 p-6">
      <p className="text-[16px] font-bold text-[#141414]">{error}</p>
      <Button onClick={loadData}>Retry</Button>
    </div>
  );

  if (selectedUserId) {
    return (
      <div className="min-h-screen bg-white pb-[60px]">
        <TenantUseManagement userId={selectedUserId} onBack={() => {
          if (location.state?.from) {
            navigate(-1);
          } else {
            setSelectedUserId(null);
            loadData();
          }
        }} />
      </div>
    );
  }

  const utilization = metrics && metrics.totalSeats > 0 ? Math.round((metrics.allocatedSeats / metrics.totalSeats) * 100) : 0;
  const tName = tenant?.name || "Bank Muscat";

  const invitedUsersCount = members.filter(m => m.status?.toUpperCase() === 'INVITED' || m.status?.toUpperCase() === 'PENDING').length;
  const activeUsersCount = members.filter(m => m.status?.toUpperCase() === 'ACTIVE').length;
  const inactiveUsersCount = members.filter(m => m.status?.toUpperCase() === 'INACTIVE' || m.status?.toUpperCase() === 'SUSPENDED').length;

  const handleExportCSV = () => {
    const headers = ["Name", "Email", "Role", "Status", "Courses", "Progress", "Last Active"];

    const rows = filteredMembers.map(member => [
      `"${(member.name || "").replace(/"/g, '""')}"`,
      `"${(member.email || "").replace(/"/g, '""')}"`,
      `"${(member.role || "").replace(/"/g, '""')}"`,
      `"${(member.status || "").replace(/"/g, '""')}"`,
      `"${member.courses || 0}"`,
      `"${member.progressValue || 0}%"`,
      `"${(member.lastActive || "Never").replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `team-export-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-white pb-[60px]">
      <div className="w-full">

        {/* Header Region */}
        <div className="mb-[24px] md:mb-[32px]">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-[16px]">
            <div className="max-w-3xl">
              <div className="text-[12px] font-bold text-[#5c5c5c] tracking-[0.06em] uppercase mb-1">
                NEXUS CORPORATE • CORPORATE ADMIN • TEAM VIEW
              </div>
              <h1 className="text-[24px] font-extrabold text-[#141414] leading-tight">My team</h1>
              <p className="text-[16px] text-[#3a3a3a] mt-[6px]">
                Members of {tName} on Nexus Academy. Manage seats, roles and access for everyone in your organisation.
              </p>
            </div>
            <div className="flex flex-wrap gap-[12px] shrink-0 md:mt-[16px]">
              <Button onClick={handleExportCSV} variant="ghost" className="gap-2 text-[#141414] text-[14px] font-bold rounded-[100px] bg-[#FCF7AE] border-[1.5px] border-[#c99b2e8c] hover:bg-[#ebd85b] w-[125.93px] h-[39.3px] px-0 shadow-xs flex justify-center">
                <Icon size={14} className="text-[#141414]">
                  <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </Icon>
                Export CSV
              </Button>
              <Button variant="primary" className="gap-2 text-[#141414] text-[14px] font-bold rounded-[100px] bg-[#FCF7AE] border-[1.5px] border-[#11111129] hover:bg-[#ebd85b] w-[125.93px] h-[39.3px] px-0 shadow-xs flex justify-center" onClick={() => navigate("/create-tenant-user", { replace: true })}>
                Invite people
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-[16px] lg:gap-[24px] mb-[24px] md:mb-[32px]">
          <div className="p-[16px] md:p-[20px] bg-[#fff] border border-[#1111111a] rounded-[14px] flex flex-col shadow-[0_4px_16px_-4px_rgba(42,17,8,0.1)] transition-all duration-200 ease hover:-translate-y-[2px] hover:shadow-[0_4px_16px_-4px_rgba(42,17,8,0.1)]">
            <div className="w-[42px] h-[42px] rounded-[10px] flex items-center justify-center mb-[24px] bg-[#f6ebd1] text-[#a47a28]">
              <Icon size={20}><rect x="3" y="5" width="18" height="14" rx="2" /><line x1="3" y1="10" x2="21" y2="10" /></Icon>
            </div>
            <div className="text-[11px] font-bold uppercase tracking-[0.05em] text-[#5c5c5c] mb-[4px]">Seats Used</div>
            <div className="flex items-baseline gap-[4px] mb-[12px]">
              <div className="text-[28px] font-extrabold text-[#141414] leading-none mb-[4px]">{metrics?.allocatedSeats || 3}</div>
              <span className="text-[14px] font-medium text-[#141414]-mute">/ {metrics?.totalSeats || 10}</span>
            </div>
            <div className="w-full h-[6px] bg-[#e5e5e5] rounded-full mt-auto">
              <div className="h-full bg-[#dca83a] rounded-full" style={{ width: `${utilization || 30}%` }}></div>
            </div>
          </div>

          <div className="p-[16px] md:p-[20px] bg-[#fff] border border-[#1111111a] rounded-[14px] flex flex-col shadow-[0_4px_16px_-4px_rgba(42,17,8,0.1)] transition-all duration-200 ease hover:-translate-y-[2px] hover:shadow-[0_4px_16px_-4px_rgba(42,17,8,0.1)]">
            <div className="w-[42px] h-[42px] rounded-[10px] flex items-center justify-center mb-[24px] bg-[#e6f2e9] text-[#2e9f5b]">
              <Icon size={20}><polyline points="20 6 9 17 4 12" /></Icon>
            </div>
            <div className="text-[11px] font-bold uppercase tracking-[0.05em] text-[#5c5c5c] mb-[4px]">Active</div>
            <div className="text-[28px] font-extrabold text-[#141414] leading-none mb-[4px]">{activeUsersCount}</div>
            <div className="text-[12px] text-[#5c5c5c]">logged in last 30 days</div>
          </div>

          <div className="p-[16px] md:p-[20px] bg-[#fff] border border-[#1111111a] rounded-[14px] flex flex-col shadow-[0_4px_16px_-4px_rgba(42,17,8,0.1)] transition-all duration-200 ease hover:-translate-y-[2px] hover:shadow-[0_4px_16px_-4px_rgba(42,17,8,0.1)]">
            <div className="w-[42px] h-[42px] rounded-[10px] flex items-center justify-center mb-[24px] bg-[#f6ebd1] text-[#a47a28]">
              <Icon size={20}><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></Icon>
            </div>
            <div className="text-[11px] font-bold uppercase tracking-[0.05em] text-[#5c5c5c] mb-[4px]">Invited</div>
            <div className="text-[28px] font-extrabold text-[#141414] leading-none mb-[4px]">{invitedUsersCount}</div>
            <div className="text-[12px] text-[#5c5c5c]">invite not yet accepted</div>
          </div>

          <div className="p-[16px] md:p-[20px] bg-[#fff] border border-[#1111111a] rounded-[14px] flex flex-col shadow-[0_4px_16px_-4px_rgba(42,17,8,0.1)] transition-all duration-200 ease hover:-translate-y-[2px] hover:shadow-[0_4px_16px_-4px_rgba(42,17,8,0.1)]">
            <div className="w-[42px] h-[42px] rounded-[10px] flex items-center justify-center mb-[24px] bg-[#fae2e2] text-[#c12a1c]">
              <Icon size={20}><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></Icon>
            </div>
            <div className="text-[11px] font-bold uppercase tracking-[0.05em] text-[#5c5c5c] mb-[4px]">Inactive</div>
            <div className="text-[28px] font-extrabold text-[#141414] leading-none mb-[4px]">{inactiveUsersCount}</div>
            <div className="text-[12px] text-[#5c5c5c]">no login in 6 months</div>
          </div>
        </div>

        {/* Filter Row */}
        <div className="flex flex-col lg:flex-row lg:items-center gap-[12px] mb-[20px]">
          <div className="w-full lg:w-[300px] relative">
            <Icon size={16} className="absolute left-[14px] top-1/2 -translate-y-1/2 text-[#141414]-mute">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </Icon>
            <Input
              placeholder="Search by name or email"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-[40px] h-[40px] w-full rounded-[8px] border border-[#1111111a] text-[14px] text-[#141414] shadow-[0_4px_16px_-4px_rgba(42,17,8,0.1)]"
            />
          </div>
          <div className="flex items-center gap-[12px] w-full lg:w-auto">
            <Select
              className="flex-1 lg:w-[160px] h-[40px] rounded-[8px] border border-[#1111111a] text-[14px] text-[#141414] shadow-[0_4px_16px_-4px_rgba(42,17,8,0.1)]"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="">All statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INVITED">Invited</option>
              <option value="SUSPENDED">Suspended</option>
            </Select>
            <Select
              className="flex-1 lg:w-[160px] h-[40px] rounded-[8px] border border-[#1111111a] text-[14px] text-[#141414] shadow-[0_4px_16px_-4px_rgba(42,17,8,0.1)]"
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
            >
              <option value="">All roles</option>
              <option value="Corporate User">Corporate User</option>
              <option value="Corporate Admin">Corporate Admin</option>
            </Select>
          </div>

          <div className="w-auto lg:ml-auto">
            <Button variant="primary" className="rounded-[100px] w-[125.93px] h-[39.3px] px-0 flex justify-center items-center bg-[#FFFFFF] border border-[#11111129] text-[14px] font-bold text-[#141414] shadow-[0_4px_16px_-4px_rgba(42,17,8,0.1)] hover:bg-[#f6f6f4]" onClick={() => navigate("/create-tenant-user")}>
              Invite people
            </Button>
          </div>
        </div>

        {/* Table Area */}
        <div className="bg-[#fff] border border-[#1111111a] rounded-[14px] shadow-[0_4px_16px_-4px_rgba(42,17,8,0.1)] hover:-translate-y-[2px] hover:border-[#11111129] transition-all overflow-hidden mb-[24px]">
          {/* Table Header Controls */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between px-[16px] lg:px-[24px] py-[16px] border-b border-[#1111111a] gap-[16px]">
            <div className="flex items-center gap-[12px]">
              <h2 className="text-[16px] font-bold text-[#141414]">Team members</h2>
              <span className="text-[14px] font-medium px-[10px] py-[2px] rounded-[100px] bg-[#eeeeea] text-[#6b6b6b] border border-[#1111111a]">
                {filteredMembers.length} of {members.length}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-[8px]">
              <Button variant="ghost" size="sm" onClick={() => {
                const hasCorporateAdmin = Array.from(selectedIds).some(id => {
                  const user = members.find(m => m.id === id);
                  return user?.role === 'Corporate Admin';
                });
                if (hasCorporateAdmin) {
                  showToast("Corporate Admins cannot be added to a group");
                  return;
                }
                setIsAddGroupModalOpen(true);
              }} className={`rounded-[100px] w-[134.18px] h-[39.3px] px-0 text-[14px] text-center leading-tight transition-colors shadow-[0_4px_16px_-4px_rgba(42,17,8,0.1)] flex justify-center items-center ${selectedIds.size === 0 ? "opacity-50 pointer-events-none bg-[#eeeeea] border border-[#1111111a] text-[#5c5c5c]" : "border border-[#1111111a] hover:bg-[#f6f6f4]"}`}>Add to group</Button>
              <Button variant="ghost" size="sm" onClick={handleAssignCourseClick} className={`rounded-[100px] w-[134.18px] h-[39.3px] px-0 text-[14px] text-center leading-tight transition-colors shadow-[0_4px_16px_-4px_rgba(42,17,8,0.1)] flex justify-center items-center ${selectedIds.size === 0 ? "opacity-50 bg-[#eeeeea] border border-[#1111111a] text-[#5c5c5c]" : "border border-[#1111111a] hover:bg-[#f6f6f4]"}`}>Assign course</Button>
              <Button variant="ghost" size="sm" className={`rounded-[100px] w-[134.18px] h-[39.3px] px-0 text-[14px] text-center font-bold leading-tight transition-colors shadow-[0_4px_16px_-4px_rgba(42,17,8,0.1)] flex justify-center items-center ${selectedIds.size === 0 ? "opacity-50 pointer-events-none bg-[#eeeeea] border border-[#1111111a] text-[#5c5c5c]" : "bg-[#FCF7AE] border border-[#c99b2e8c] text-[#141414] hover:bg-[#ebd85b]"}`} onClick={() => navigate('/bulk-actions', { state: { selectedIds: Array.from(selectedIds), members } })}>Bulk actions {selectedIds.size > 0 ? `(${selectedIds.size})` : ""}</Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#1111111a] text-[12px] font-bold uppercase tracking-wider text-[#141414]-mute">
                  <th className="pl-[24px] pr-[12px] py-[14px] w-[50px]">
                    {someSelected ? (
                      <div className="w-[18px] h-[18px] rounded-[3px] bg-[#7e9b6f] flex items-center justify-center cursor-pointer" onClick={toggleAll}>
                        <div className="w-[10px] h-[2px] bg-[#fff] rounded-full" />
                      </div>
                    ) : (
                      <Checkbox
                        className="!w-[18px] !h-[18px] !rounded-[3px] cursor-pointer"
                        checked={allSelected}
                        onChange={toggleAll}
                      />
                    )}
                  </th>
                  <th className="px-[12px] py-[14px]">Name</th>
                  <th className="px-[12px] py-[14px]">Role</th>
                  <th className="px-[12px] py-[14px]">Courses</th>
                  <th className="px-[12px] py-[14px]">Progress</th>
                  <th className="px-[12px] py-[14px]">Last Active</th>
                  <th className="px-[12px] py-[14px]">Status</th>
                  <th className="pr-[24px] pl-[12px] py-[14px] text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e5e5e5]">
                {filteredMembers.map(member => {
                  const s = getStatusProps(member.status);
                  return (
                    <tr
                      key={member.id}
                      onClick={(e) => {
                        const target = e.target as HTMLElement;
                        if (target.closest('button') || target.closest('input')) return;
                        setSelectedUserId(member.id);
                      }}
                      className="transition-all duration-200 cursor-pointer hover:relative hover:z-10 hover:-translate-y-[1px] hover:shadow-[0_2px_8px_rgba(0,0,0,0.05)] bg-[#fff] hover:bg-[#f6f6f4]"
                    >
                      <td className="pl-[24px] pr-[12px] py-[12px]">
                        <Checkbox
                          className="!w-[18px] !h-[18px] !rounded-[3px] cursor-pointer"
                          checked={selectedIds.has(member.id)}
                          onChange={() => toggleSelection(member.id)}
                        />
                      </td>
                      <td className="px-[12px] py-[12px]">
                        <div className="flex flex-col gap-[2px]">
                          <span className="font-bold text-[#141414] text-[16px]">{member.name}</span>
                          <span className="text-[14px] text-[#141414]-faint">{member.email}</span>
                        </div>
                      </td>
                      <td className="px-[12px] py-[12px]">
                        {member.role === 'Corporate Admin' ? (
                          <Chip status="level" className="!font-bold !text-[12px] !bg-[#141414] !text-white !px-[16px] !py-[6px] !h-auto !rounded-[100px]">{member.role}</Chip>
                        ) : (
                          <span className="text-[12px] font-bold text-[#141414]">{member.role}</span>
                        )}
                      </td>
                      <td className="px-[12px] py-[12px] text-[16px] text-[#141414]">{member.courses}</td>
                      <td className="px-[12px] py-[12px]">
                        <div className="flex items-center gap-[12px] w-[140px]">
                          <div className="flex-1 h-[6px] bg-[#e5e5e5] rounded-full overflow-hidden">
                            <div className="h-full bg-[#dca83a] rounded-full" style={{ width: `${member.progressValue || 0}%` }}></div>
                          </div>
                          <span className="text-[14px] font-bold text-[#141414] w-[32px] text-right">{member.progressValue}%</span>
                        </div>
                      </td>
                      <td className="px-[12px] py-[12px] text-[14px] text-[#141414]-mute">{formatLastActive(member.lastActive, member.status)}</td>
                      <td className="px-[12px] py-[12px]">
                        <div className="flex items-center gap-[6px]">
                          <div className={`w-[6px] h-[6px] rounded-full ${s.dotClass}`} />
                          <span className={`text-[14px] font-bold ${s.textClass}`}>{s.label}</span>
                        </div>
                      </td>
                      <td className="pr-[24px] pl-[12px] py-[12px] text-right">
                        {member.status === 'INVITED' ? (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            disabled={resendingIds.has(member.id)}
                            className="rounded-[100px] h-[32px] px-[16px] text-[12px] bg-[#fff] border border-[#1111111a] shadow-[0_4px_16px_-4px_rgba(42,17,8,0.1)] hover:bg-[#f6f6f4] text-[#141414] disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={async (e) => {
                              e.stopPropagation();
                              if (resendingIds.has(member.id)) return;
                              setResendingIds(prev => new Set(prev).add(member.id));
                              const currentTenantId = getTenantId();
                              if (!currentTenantId) {
                                showToast("Tenant ID not found. Please log in again.");
                                setResendingIds(prev => { const next = new Set(prev); next.delete(member.id); return next; });
                                return;
                              }
                              
                              try {
                                if (!member.invitationId) {
                                  await createInviteApi(currentTenantId, { userId: member.id, type: "CORPORATE_USER" });
                                  showToast("Invitation sent successfully!");
                                  loadData();
                                } else {
                                  await resendInviteApi(currentTenantId, member.invitationId);
                                  showToast("Invitation resent successfully!");
                                }
                              } catch (err: any) {
                                console.error("Failed to resend invite", err);
                                showToast(err?.response?.data?.message || err?.message || "Failed to resend invitation.");
                              } finally {
                                setResendingIds(prev => { const next = new Set(prev); next.delete(member.id); return next; });
                              }
                            }}
                          >
                            {resendingIds.has(member.id) ? "Sending..." : "Resend invite"}
                          </Button>
                        ) : (
                          <button
                            className="text-[14px] font-bold text-[#141414] hover:underline cursor-pointer bg-transparent border-none p-0"
                            onClick={() => setSelectedUserId(member.id)}
                          >
                            Manage
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-[24px] py-[16px] border-t border-[#1111111a] bg-[#fff] text-[14px] text-[#141414]-mute">
            <span>Showing {filteredMembers.length} of {members.length} members</span>
            <div className="flex items-center gap-[12px]">
              <button aria-label="Prev" className="w-[32px] h-[32px] rounded-full border border-[#1111111a] bg-[#fff] hover:bg-[#f6f6f4]-2 flex items-center justify-center text-[#141414]-mute transition-colors cursor-not-allowed opacity-50">
                <Icon size={14}><polyline points="15 18 9 12 15 6" /></Icon>
              </button>
              <span className="font-medium text-[#141414] text-[13px]">1 of 1</span>
              <button aria-label="Next" className="w-[32px] h-[32px] rounded-full border border-[#1111111a] bg-[#fff] hover:bg-[#f6f6f4]-2 flex items-center justify-center text-[#141414]-mute transition-colors cursor-not-allowed opacity-50">
                <Icon size={14}><polyline points="9 18 15 12 9 6" /></Icon>
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Add to Group Modal */}
      <Modal
        open={isAddGroupModalOpen}
        onClose={() => setIsAddGroupModalOpen(false)}
        className="!bg-white !max-w-[420px] !rounded-[16px] !border-none !shadow-[0_24px_48px_-12px_rgba(0,0,0,0.18)] !overflow-visible"
        contentClassName="!overflow-visible"
      >
        <div className="flex flex-col">
          <h2 className="text-[20px] font-bold text-[#141414] mb-[8px]">Add to group</h2>
          <p className="text-[14px] text-[#5c5c5c] mb-[24px]">Select a group to assign the selected members to.</p>

          <label className="text-[11px] font-bold uppercase tracking-[0.05em] text-[#5c5c5c] mb-[8px]">Group</label>
          <div className="relative mb-[32px]">
            <div
              className="w-full h-[44px] rounded-[10px] border border-[#d9d9d9] text-[15px] px-[12px] flex items-center justify-between cursor-pointer bg-white"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              <span className={selectedGroupId ? "text-[#141414]" : "text-[#5c5c5c]"}>
                {selectedGroupId ? (() => {
                  const g = groups.find(grp => grp.id === selectedGroupId);
                  if (!g) return "Select a group...";
                  const memberCount = (g as any)._count?.departmentUsers || g.userIds?.length || 0;
                  return `${g.name} (${memberCount} members)`;
                })() : "Select a group..."}
              </span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`text-[#5c5c5c] transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}>
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </div>

            {isDropdownOpen && (
              <div className="absolute left-0 right-0 top-full mt-[4px] bg-white border border-[#d9d9d9] rounded-[8px] shadow-[0_8px_24px_rgba(0,0,0,0.12)] z-[60] max-h-[220px] overflow-y-auto py-[4px]">
                {groups.map(g => {
                  const memberCount = (g as any)._count?.departmentUsers || g.userIds?.length || 0;
                  return (
                    <div
                      key={g.id}
                      className={`px-[12px] py-[10px] text-[14px] cursor-pointer hover:bg-[#f6f6f4] transition-colors ${selectedGroupId === g.id ? 'bg-[#f0f4ff] text-[#2563eb] font-medium' : 'text-[#141414]'}`}
                      onClick={() => {
                        setSelectedGroupId(g.id as string);
                        setIsDropdownOpen(false);
                      }}
                    >
                      {g.name} ({memberCount} members)
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-[12px]">
            <Button variant="ghost" className="rounded-full h-[40px] px-[20px] font-bold text-[#141414] border border-[#d9d9d9] hover:bg-[#f6f6f6]" onClick={() => setIsAddGroupModalOpen(false)}>Cancel</Button>
            <Button
              variant="primary"
              className="rounded-full h-[40px] px-[20px] bg-[#FCF7AE] border border-[#c99b2e8c] text-[#141414] font-bold hover:bg-[#ebd85b]"
              disabled={!selectedGroupId || savingGroup}
              onClick={async () => {
                if (!selectedGroupId || selectedIds.size === 0) return;

                // Check if any selected user is already assigned to a DIFFERENT group
                const alreadyAssigned = Array.from(selectedIds).some(id => {
                  const user = members.find(m => m.id === id);
                  if (!user) return false;
                  return user.departmentAssignments?.some((da: any) => da.departmentId !== selectedGroupId);
                });

                if (alreadyAssigned) {
                  showToast("The user is already assigned in another group");
                  return;
                }

                const tenantId = getTenantId();
                if (!tenantId) return;
                try {
                  setSavingGroup(true);
                  const existing = await getGroupMembers(tenantId, selectedGroupId);
                  const existingIds = existing.map(u => u.userId || u.id);
                  const newIds = Array.from(new Set([...existingIds, ...selectedIds]));
                  const success = await updateGroup(tenantId, selectedGroupId, { userIds: newIds });
                  if (success) {
                    setIsAddGroupModalOpen(false);
                    setSelectedIds(new Set());
                    fetchGroups(tenantId);
                    const groupName = groups.find(g => g.id === selectedGroupId)?.name || "group";
                    showToast(`Done. Members assigned to "${groupName}".`);
                  } else {
                    showToast("Failed to add users to group.");
                  }
                } catch (err) {
                  console.error(err);
                  showToast("An error occurred while adding to group.");
                } finally {
                  setSavingGroup(false);
                }
              }}
            >
              {savingGroup ? "Saving..." : "Confirm"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Assign Course Modal */}
      <Modal 
        open={isAssignCourseModalOpen} 
        onClose={() => {
          setIsAssignCourseModalOpen(false);
          setSelectedContent(null);
        }} 
        className="!rounded-[24px] !w-[460px] !max-w-[100vw] p-0 bg-white border-none shadow-[0_24px_48px_-12px_rgba(0,0,0,0.18)] overflow-hidden"
        contentClassName="!p-0"
      >
        <div className="p-[40px] flex flex-col">
          <div className="w-full text-left">
            <h2 className="text-[16px] font-bold text-[#111827]">Assign course</h2>
            <p className="text-[16px] font-normal text-[#6b7280] mt-1.5 mb-5">
              Select a course to assign to the selected members.
            </p>
          </div>

          {isLoadingContent ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-sm font-medium text-gray-500">
              <div className="w-6 h-6 border-2 border-[#ca8a04] border-t-transparent rounded-full animate-spin"></div>
              <span>Loading available courses...</span>
            </div>
          ) : availableContent.length === 0 ? (
            <div className="py-12 text-center text-sm font-medium text-gray-500 bg-gray-50 rounded-xl">
              No available courses or career paths found.
            </div>
          ) : (
            <div className="max-h-[340px] overflow-y-auto space-y-[10px] pr-2 custom-scrollbar flex flex-col w-full">
              {availableContent.map((item) => {
                const isSelected = selectedContent?.id === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedContent(item)}
                    className={`flex items-center justify-between px-3 rounded-[12px] border transition-all cursor-pointer w-full max-w-[380.8px] h-[47.6px] shrink-0 ${
                      isSelected
                        ? "border-[#c99b2e] bg-[#faecd0]"
                        : "border-[#e5e7eb] bg-white hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {item.thumbnailUrl ? (
                        <img
                          src={item.thumbnailUrl}
                          alt={item.title}
                          className="w-[44px] h-[30px] rounded-[6px] object-contain shrink-0 border border-[#e5e5e5]"
                        />
                      ) : (
                        <div className="w-[44px] h-[30px] rounded-[6px] bg-gray-100 border border-gray-200 shrink-0 flex items-center justify-center text-gray-400">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                            <line x1="8" y1="21" x2="16" y2="21"></line>
                            <line x1="12" y1="17" x2="12" y2="21"></line>
                          </svg>
                        </div>
                      )}
                      <div className="min-w-0 flex items-center gap-2 flex-wrap">
                        <span className="text-[15px] font-medium text-[#111827] truncate">
                          {item.title}
                        </span>
                        {item.contentType === 'CAREER_PATH' && (
                          <span className="text-[10px] font-bold tracking-wider uppercase text-[#8f3a20] bg-[#efd3c7] px-1.5 py-0.5 rounded-sm shrink-0">
                            Career Path
                          </span>
                        )}
                      </div>
                    </div>
                    {isSelected && (
                      <svg
                        className="w-4 h-4 text-[#c99b2e] shrink-0 mr-1"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex justify-end items-center gap-[12px] mt-[28px] w-full max-w-[380.8px]">
            <button
              type="button"
              onClick={() => {
                setIsAssignCourseModalOpen(false);
                setSelectedContent(null);
              }}
              className="rounded-full border border-[#d9d9d9] px-6 py-2 h-[40px] text-[14px] font-bold text-[#141414] hover:bg-gray-50 transition-colors w-[100px] flex items-center justify-center"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!selectedContent || isAssigning}
              onClick={handleConfirmAssign}
              className="rounded-full bg-[#fcf7ae] border border-[#c99b2e8c] text-[#141414] font-bold px-7 py-2 h-[40px] text-[14px] shadow-sm hover:bg-[#ebd85b] disabled:opacity-40 disabled:cursor-not-allowed transition-all w-[100px] flex items-center justify-center"
            >
              {isAssigning ? "Assigning..." : "Confirm"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[100] bg-[#1a1a1a] text-white px-5 py-3.5 rounded-lg shadow-[0_8px_30px_rgb(0,0,0,0.12)] font-medium text-[14px] tracking-wide animate-fade-in-up flex items-center">
          {toastMessage}
        </div>
      )}

    </div>
  );
};

export default Teams;