import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { useMutation } from "@tanstack/react-query";
import { Users, Save, X, ArrowLeft, Loader2, Check, Search, Trash2, Edit2, Info, Building2, BookOpen, ChevronDown, UploadCloud } from "lucide-react";
import { TenantUserDetail } from "./TenantUserDetail";
import { TenantUseManagement } from "./TenantUseManagement";

import { useGroupStore } from "../../store/group.store";
import {
  getTenantUsersByTenantIdApi,
  getUsersWithoutDepartmentApi
} from "../../core/api/tenantuser.api";
import { Group } from "../../core/api/group.api";
import { getTenantByIdApi } from "../../core/api/tenant.api";
import { getAssignmentReportApi } from "../../core/api/corporate-learning.api";
import buildingIcon from "../../assets/icons/building.svg";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts";

const formatRelativeTime = (dateStr?: string | Date) => {
  if (!dateStr) return null;
  const date = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
  if (isNaN(date.getTime())) return null;

  const now = new Date();
  const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diffSec < 45) return "Just now";

  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays === 0) {
    if (diffMin < 60) return `${diffMin} min${diffMin > 1 ? "s" : ""} ago`;
    return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  }
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} week${weeks > 1 ? "s" : ""} ago`;
  }
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

// ----------------------------------------------------------------------
// 1. FORM VIEW (Create / Edit Group)
// ----------------------------------------------------------------------
const CreateGroupFormView: React.FC<{
  onBack: () => void;
  editGroup: Group | null;
  tenantName?: string;
}> = ({ onBack, editGroup, tenantName }) => {
  const isEditMode = !!editGroup;

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    userIds: [] as string[],
    assignNoDepartmentUsers: false,
  });

  const [users, setUsers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string; } | null>(null);

  const { createGroup, updateGroup, getGroupMembers } = useGroupStore();

  const tenantId = useMemo(() => {
    try {
      const storedUser = localStorage.getItem('keycloak_session_user');
      if (!storedUser) return "";
      const parsed = JSON.parse(storedUser);
      const user = parsed?.user || parsed;
      return user?.tenantId || user?.tenant?.id || user?.organizationId || "";
    } catch {
      return "";
    }
  }, []);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        if (!tenantId) return;

        const noDeptResponse = await getUsersWithoutDepartmentApi();
        let fetchedUsers = noDeptResponse.users || [];

        if (isEditMode && tenantId && editGroup?.id) {
          const members = await getGroupMembers(tenantId, editGroup.id);
          if (members && members.length > 0) {
            // Member records might be wrapped or flat, we need to extract the user ID
            const memberIds = members.map((m: any) => m.userId || m.id || m.user?.id);

            // Set form data with these member IDs
            setFormData(prev => ({
              ...prev,
              userIds: memberIds.filter(Boolean),
            }));

            // Add members to fetchedUsers so they appear in the UI list if they aren't already
            const existingIds = fetchedUsers.map((u: any) => u.id);
            const additionalMembers = members
              .map((m: any) => m.user || m)
              .filter((u: any) => u && u.id && !existingIds.includes(u.id));

            fetchedUsers = [...fetchedUsers, ...additionalMembers];
          }
        }
        setUsers(fetchedUsers);
      } catch (err) {
        console.error(err);
      }
    };
    loadUsers();
  }, [isEditMode, tenantId, editGroup]);

  useEffect(() => {
    if (isEditMode && editGroup) {
      setFormData({
        name: editGroup.name || "",
        description: editGroup.description || "",
        userIds: editGroup.userIds || [],
        assignNoDepartmentUsers: editGroup.assignNoDepartmentUsers || false,
      });
    }
  }, [isEditMode, editGroup]);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = "Group name is required";
    if (!tenantId) newErrors.tenant = "Tenant ID not found";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const toggleUser = (userId: string) => {
    setFormData((prev) => ({
      ...prev,
      userIds: prev.userIds.includes(userId)
        ? prev.userIds.filter((i) => i !== userId)
        : [...prev.userIds, userId],
    }));
  };

  const removeUser = (userId: string) => {
    setFormData((prev) => ({
      ...prev,
      userIds: prev.userIds.filter((i) => i !== userId),
    }));
  };

  const filteredUsers = users.filter((user) => {
    // Filter out invited users
    if (user.status === "INVITED") return false;

    // Filter out users already in a different group
    const userGroupId = user.departmentId || user.department?.id;
    if (userGroupId) {
      if (!isEditMode) return false;
      if (isEditMode && userGroupId !== editGroup?.id) return false;
    }

    const fullName = `${user.profile?.firstName || user.firstName || ""} ${user.profile?.lastName || user.lastName || ""
      }`.toLowerCase();
    return (
      fullName.includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const selectedUsers = users.filter((u) => formData.userIds.includes(u.id));

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        userIds: formData.userIds,
        assignNoDepartmentUsers: formData.assignNoDepartmentUsers,
      };
      if (isEditMode && editGroup?.id) {
        return updateGroup(tenantId, editGroup.id, payload);
      }
      return createGroup(tenantId, payload);
    },
    onSuccess: (success) => {
      if (success) {
        showToast("success", `Group ${isEditMode ? "updated" : "created"} successfully!`);
        setTimeout(() => {
          onBack();
        }, 1500);
      } else {
        showToast("error", "Failed to save group.");
      }
    },
    onError: (error: any) => {
      showToast("error", error?.response?.data?.message || "An error occurred while saving");
    },
  });

  return (
    <div className="bg-white min-h-[calc(100vh-100px)] -mt-7 -mx-7 px-7 pt-2">
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-xl shadow-lg text-white font-medium ${toast.type === "success" ? "bg-green-600" : "bg-red-600"
            }`}
        >
          {toast.message}
        </div>
      )}

      {/* Back button and Header */}
      <div className="mb-8 mt-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-[var(--ink-mute)] hover:text-[var(--ink)] text-[12px] tracking-[0.1em] uppercase font-semibold mb-5 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" strokeWidth={2} /> GROUPS
        </button>

        <div className="text-[12px] tracking-[0.08em] uppercase font-semibold text-[var(--ink-mute)] mb-2">
          TENANT · {tenantName || "ORGANISATION"}
        </div>

        <h1 className="text-[24px] font-bold text-[var(--ink)] tracking-tight mb-2">
          {isEditMode ? "Edit group" : "Create group"}
        </h1>
        <p className="text-[16px] text-[var(--ink-mute)] max-w-2xl">
          Groups let you organise team members and assign learning together. Members can belong to multiple groups.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* LEFT COLUMN: FORM */}
        <div className="flex-grow flex flex-col gap-6 w-full">

          {/* Card 1: Group identity */}
          <div className="bg-white border border-[var(--surface-3)] rounded-2xl shadow-sm overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
            <div className="flex justify-between items-center px-7 py-5 border-b border-[var(--surface-3)]">
              <h2 className="text-[12px] font-semibold tracking-[0.1em] uppercase text-[var(--ink-mute)]">Group identity</h2>
              <span className="text-[12px] font-semibold tracking-[0.1em] uppercase text-[var(--ink-mute)]">NAME & DESCRIPTION</span>
            </div>
            <div className="p-7 flex flex-col gap-6">
              <div>
                <label className="block text-[12px] font-semibold tracking-[0.1em] uppercase text-[var(--ink-mute)] mb-2.5">
                  Group name <span className="text-[#c99b2e]">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Finance Leadership"
                  className={`w-full h-12 rounded-lg px-4 border ${errors.name ? "border-red-500 bg-red-50" : "border-[var(--surface-3)]"} focus-visible:outline-[var(--honey)] text-[15px] transition-colors`}
                />
                {errors.name && <p className="text-red-600 text-[12px] mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-[12px] font-semibold tracking-[0.1em] uppercase text-[var(--ink-mute)] mb-2.5">
                  Description
                </label>
                <textarea
                  name="description"
                  rows={3}
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Brief note on this group's purpose or membership criteria (optional)"
                  className="w-full rounded-lg border border-[var(--surface-3)] p-4 resize-none focus-visible:outline-[var(--honey)] text-[15px] transition-colors"
                />
                <p className="text-[14px] text-[var(--ink-mute)] mt-1.5">
                  Visible to Corporate Admins only. Not shown to members.
                </p>
              </div>

            </div>
          </div>



          {/* Card 2: Members */}
          <div className="bg-white border border-[var(--surface-3)] rounded-2xl shadow-sm overflow-hidden flex flex-col h-[600px] transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
            <div className="flex justify-between items-center px-7 py-5 border-b border-[var(--surface-3)]">
              <h2 className="text-[12px] font-semibold tracking-[0.1em] uppercase text-[var(--ink-mute)]">Members</h2>
              <span className="text-[12px] font-semibold tracking-[0.1em] uppercase text-[var(--ink-mute)]">Add to group on creation</span>
            </div>

            <div className="p-7 flex flex-col h-full min-h-0">
              {/* Search Input */}
              <div className="relative mb-5 shrink-0">
                <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name or department..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full h-12 rounded-lg border border-[var(--surface-3)] pl-11 pr-4 focus-visible:outline-[var(--honey)] text-[15px] transition-colors"
                />
              </div>

              {/* Users List */}
              <div className="flex-grow overflow-y-auto border border-[var(--surface-3)] rounded-xl divide-y divide-[var(--surface-3)]">
                {filteredUsers.length === 0 ? (
                  <p className="text-[var(--ink-mute)] py-8 text-center text-[15px]">No users found</p>
                ) : (
                  filteredUsers.map((user) => {
                    const isSelected = formData.userIds.includes(user.id);
                    return (
                      <label
                        key={user.id}
                        className="flex items-center gap-4 p-3.5 cursor-pointer hover:bg-gray-50 transition-colors border-b border-transparent hover:border-gray-100"
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleUser(user.id)}
                          className="w-6 h-6 rounded border-gray-300 accent-green-600 cursor-pointer"
                        />
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
                          <span className="text-[14px] font-bold text-gray-600">
                            {(user.profile?.firstName?.[0] || user.firstName?.[0] || "U").toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-grow min-w-0">
                          <p className="font-medium text-[16px] text-[var(--ink)] truncate">
                            {user.profile?.firstName || user.firstName} {user.profile?.lastName || user.lastName}
                          </p>
                          <p className="text-[14px] text-[var(--ink-mute)] truncate">{user.email}</p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-[12px] font-medium text-[var(--ink-mute)]">{user.department?.name || "No Dept"}</p>
                        </div>
                      </label>
                    );
                  })
                )}
              </div>

              <div className="mt-5 text-[12px] font-medium text-[var(--ink)] shrink-0">
                {selectedUsers.length} members selected
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: SUMMARY */}
        <div className="w-full lg:w-[320px] shrink-0 sticky top-8">
          <div className="bg-white border border-[var(--surface-3)] rounded-xl shadow-sm p-7 mb-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
            <h2 className="text-[12px] font-semibold tracking-[0.1em] uppercase text-[var(--ink-mute)] mb-6">New group summary</h2>

            <dl className="flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <dt className="text-[12px] font-semibold tracking-[0.1em] uppercase text-[var(--ink-mute)]">Name</dt>
                <dd className={`text-[16px] ${formData.name ? "text-[var(--ink)] font-medium" : "text-[var(--ink-mute)] italic"}`}>
                  {formData.name || "Not set"}
                </dd>
              </div>

              <div className="flex flex-col gap-1.5">
                <dt className="text-[12px] font-semibold tracking-[0.1em] uppercase text-[var(--ink-mute)]">Members</dt>
                <dd className={`text-[16px] ${selectedUsers.length > 0 ? "text-[var(--ink)] font-medium" : "text-[var(--ink-mute)] italic"}`}>
                  {selectedUsers.length > 0 ? `${selectedUsers.length} selected` : "None selected"}
                </dd>
              </div>
            </dl>
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={() => saveMutation.mutate()}
              className="w-full rounded-full bg-[#fdf2b3] border border-[#e8ce7b] hover:bg-[#f7eaa1] px-[18px] py-[11px] text-[16px] font-semibold text-[#141414] transition-all shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending ? "Saving..." : (isEditMode ? "Save Changes" : "Create group")}
            </button>
            <button
              onClick={onBack}
              className="w-full rounded-full bg-white border border-gray-200 px-[18px] py-[11px] text-[16px] font-medium text-[#141414] hover:bg-gray-50 transition-all shadow-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ----------------------------------------------------------------------
// 2. DETAILS VIEW (View Group Members)
// ----------------------------------------------------------------------
const GroupDetailsView: React.FC<{
  group: Group;
  onBack: () => void;
  tenantName?: string;
  tenantId: string;
  assignmentsData?: any[];
  onEdit?: () => void;
}> = ({ group, onBack, tenantName, tenantId, assignmentsData = [], onEdit }) => {
  const navigate = useNavigate();
  const { getGroupMembers } = useGroupStore();
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<"members" | "courses" | "progress">("members");

  const memberIds = useMemo(() => members.map((m: any) => m.userId || m.id || m.user?.id), [members]);
  
  const groupAssignments = useMemo(() => {
    return assignmentsData.filter(a => memberIds.includes(a.userId));
  }, [assignmentsData, memberIds]);

  const stats = useMemo(() => {
    const totalAssignments = groupAssignments.length;
    const completedAssignments = groupAssignments.filter(a => a.deliveryStatus === "COMPLETED" || a.progressPercent === 100);
    
    let totalProgress = 0;
    let totalMinutes = 0;
    groupAssignments.forEach(a => {
        totalProgress += (a.progressPercent || 0);
        const dur = a.content?.duration || a.content?.estimatedDuration || a.duration;
        if (typeof dur === "number" && !isNaN(dur)) {
          totalMinutes += dur;
        }
    });

    const avgProgress = totalAssignments > 0 ? Math.round(totalProgress / totalAssignments) : 0;
    const learningHours = totalMinutes > 0 ? `${(totalMinutes / 60).toFixed(1)} hrs` : "-";
    
    const uniqueCourses = new Set(groupAssignments.map(a => a.contentId));

    let nextExpiry = null;
    let nextExpiryDays = null;
    const pendingWithDueDate = groupAssignments
      .filter(a => a.dueDate && a.deliveryStatus !== "COMPLETED")
      .map(a => new Date(a.dueDate))
      .sort((a, b) => a.getTime() - b.getTime());
      
    if (pendingWithDueDate.length > 0) {
       const nextDate = pendingWithDueDate[0];
       nextExpiry = nextDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
       const diffTime = nextDate.getTime() - new Date().getTime();
       const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
       nextExpiryDays = diffDays > 0 ? `in ${diffDays} days` : 'expired';
    }

    return {
      assignedCourses: uniqueCourses.size,
      avgProgress: `${avgProgress}%`,
      coursesCompleted: completedAssignments.length,
      learningHours,
      nextExpiry: nextExpiry || "N/A",
      nextExpirySub: nextExpiryDays || ""
    };
  }, [groupAssignments]);

  const uniqueAssignedCourses = useMemo(() => {
    const courseMap = new Map();
    
    groupAssignments.forEach(a => {
      if (!courseMap.has(a.contentId)) {
        courseMap.set(a.contentId, {
          ...a,
          totalAssigned: 0,
          totalCompleted: 0,
        });
      }
      
      const c = courseMap.get(a.contentId);
      c.totalAssigned += 1;
      if (a.deliveryStatus === "COMPLETED" || a.progressPercent === 100) {
        c.totalCompleted += 1;
      }
    });

    return Array.from(courseMap.values());
  }, [groupAssignments]);

  const trendData = useMemo(() => {
    const weeks: any[] = [];
    const now = new Date();
    
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
      weeks.push({
        name: d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
        date: d,
        completions: 0
      });
    }

    groupAssignments.forEach(a => {
      if ((a.deliveryStatus === "COMPLETED" || a.progressPercent === 100) && (a.updatedAt || a.createdAt)) {
        const compDate = new Date(a.updatedAt || a.createdAt);
        const diffTime = now.getTime() - compDate.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays >= 0 && diffDays <= 90) {
          const weekIndex = 11 - Math.floor(diffDays / 7);
          if (weekIndex >= 0 && weekIndex < 12) {
            weeks[weekIndex].completions += 1;
          }
        }
      }
    });

    let cumulative = 0;
    return weeks.map(w => {
      cumulative += w.completions;
      return {
        name: w.name,
        Completions: cumulative
      };
    });
  }, [groupAssignments]);

  useEffect(() => {
    const loadMembers = async () => {
      try {
        if (group.id) {
          const result = await getGroupMembers(tenantId, group.id);
          setMembers(result || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadMembers();
  }, [group, tenantId]);

  if (selectedUser) {
    return <TenantUseManagement userId={selectedUser.id} onBack={() => setSelectedUser(null)} />;
  }

  return (
    <div className="pt-[8px] pb-[60px] min-h-screen bg-white font-sans w-full">
      {/* Breadcrumb */}
      <button onClick={onBack} className="inline-flex items-center gap-[6px] mb-[12px] text-[12px] font-medium tracking-[0.06em] uppercase text-[#5C5C5C] hover:text-ink transition-colors">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
        Groups
      </button>

      {loading ? (
        <div className="animate-pulse">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-[16px] mb-[24px]">
            <div>
              <div className="h-3 bg-gray-200 rounded w-32 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-48 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-40"></div>
            </div>
            <div className="h-[39.3px] bg-[#fcf7ae] border border-[#e8ce7b] rounded-full w-[144.84px]"></div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-[14px] mb-[28px]">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-white border border-[#eaeaea] rounded-[14px] px-[18px] pt-[18px] pb-[28px] shadow-sm">
                <div className="w-[38px] h-[38px] rounded-[10px] bg-gray-200 mb-[12px]"></div>
                <div className="h-3 bg-gray-200 rounded w-20 mb-2"></div>
                <div className="h-6 bg-gray-200 rounded w-12"></div>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-[24px] border-b border-[#eaeaea] mb-[24px]">
            <div className="h-10 bg-gray-200 rounded w-24"></div>
            <div className="h-10 bg-gray-200 rounded w-24"></div>
            <div className="h-10 bg-gray-200 rounded w-32"></div>
          </div>
          <div className="bg-white border border-[#eaeaea] rounded-[14px] p-6 shadow-sm">
            <div className="flex justify-between mb-4">
              <div className="h-9 bg-gray-200 rounded-full w-[300px]"></div>
              <div className="h-9 bg-gray-200 rounded-full w-[120px]"></div>
            </div>
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-12 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-[16px] mb-[24px]">
            <div>
              <div className="text-[12px] font-medium tracking-[0.06em] uppercase text-[#5C5C5C] mb-[6px]">
                Tenant · {tenantName || "Company"}
              </div>
              <h1 className="text-[24px] font-extrabold text-ink leading-tight mb-[4px]">
                {group.name}
              </h1>
              <p className="text-[16px] text-ink-soft m-0">
                {members.length} members · {stats.assignedCourses} assigned courses
              </p>
            </div>
            <div className="flex-shrink-0 flex items-center gap-[8px]">
              <button
                onClick={() => navigate('/course-assignment')}
                className="inline-flex items-center justify-center gap-[6px] w-[144.84px] h-[39.3px] px-0 bg-[#fcf7ae] border-[1.5px] border-[#c99b2e8c] rounded-[100px] text-ink font-bold text-[14px] shadow-sm hover:brightness-95 transition-all cursor-pointer"
              >
                <span className="text-[16px] leading-none">+</span> Assign course
              </button>
            </div>
          </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-[14px] mb-[28px]">
        {/* Members */}
        <div className="bg-white border border-[#eaeaea] rounded-[14px] px-[18px] pt-[18px] pb-[28px] shadow-sm hover:-translate-y-[4px] hover:shadow-md transition-all duration-75">
          <div className="w-[38px] h-[38px] rounded-[10px] bg-[#f6e8c4] text-[#8b6a1f] grid place-items-center mb-[12px]">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
          </div>
          <div className="text-[12px] font-semibold uppercase tracking-[0.06em] text-[#5C5C5C] mb-[4px]">Members</div>
          <div className="text-[20px] font-bold text-ink leading-none">{members.length}</div>
        </div>

        {/* Assigned Courses */}
        <div className="bg-white border border-[#eaeaea] rounded-[14px] px-[18px] pt-[18px] pb-[28px] shadow-sm hover:-translate-y-[4px] hover:shadow-md transition-all duration-75">
          <div className="w-[38px] h-[38px] rounded-[10px] bg-[#f6e8c4] text-[#8b6a1f] grid place-items-center mb-[12px]">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
          </div>
          <div className="text-[12px] font-semibold uppercase tracking-[0.06em] text-[#5C5C5C] mb-[4px]">Assigned courses</div>
          <div className="text-[20px] font-bold text-ink leading-none">{stats.assignedCourses}</div>
        </div>

        {/* Avg Progress */}
        <div className="bg-white border border-[#eaeaea] rounded-[14px] px-[18px] pt-[18px] pb-[28px] shadow-sm hover:-translate-y-[4px] hover:shadow-md transition-all duration-75">
          <div className="w-[38px] h-[38px] rounded-[10px] bg-[#dce5d3] text-[#4e6a40] grid place-items-center mb-[12px]">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
          </div>
          <div className="text-[12px] font-semibold uppercase tracking-[0.06em] text-[#5C5C5C] mb-[4px]">Avg. progress</div>
          <div className="text-[20px] font-bold text-ink leading-none">{stats.avgProgress}</div>
        </div>

        {/* Course Completed */}
        <div className="bg-white border border-[#eaeaea] rounded-[14px] px-[18px] pt-[18px] pb-[28px] shadow-sm hover:-translate-y-[4px] hover:shadow-md transition-all duration-75">
          <div className="w-[38px] h-[38px] rounded-[10px] bg-[#dce5d3] text-[#4e6a40] grid place-items-center mb-[12px]">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"></polyline></svg>
          </div>
          <div className="text-[12px] font-semibold uppercase tracking-[0.06em] text-[#5C5C5C] mb-[4px]">Course completed</div>
          <div className="text-[20px] font-bold text-ink leading-none">{stats.coursesCompleted}</div>
        </div>

        {/* Learning Hours */}
        <div className="bg-white border border-[#eaeaea] rounded-[14px] px-[18px] pt-[18px] pb-[28px] shadow-sm hover:-translate-y-[4px] hover:shadow-md transition-all duration-75">
          <div className="w-[38px] h-[38px] rounded-[10px] bg-[#dce5d3] text-[#4e6a40] grid place-items-center mb-[12px]">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
          </div>
          <div className="text-[12px] font-semibold uppercase tracking-[0.06em] text-[#5C5C5C] mb-[4px]">Learning hours</div>
          <div className="text-[20px] font-bold text-ink leading-none">{stats.learningHours}</div>
        </div>

        {/* Next Expiry */}
        <div className="bg-white border border-[#eaeaea] rounded-[14px] px-[18px] pt-[18px] pb-[28px] shadow-sm hover:-translate-y-[4px] hover:shadow-md transition-all duration-75">
          <div className="w-[38px] h-[38px] rounded-[10px] bg-[#efd3c7] text-[#b8523e] grid place-items-center mb-[12px]">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
          </div>
          <div className="text-[12px] font-semibold uppercase tracking-[0.06em] text-[#5C5C5C] mb-[2px]">Next expiry</div>
          <div className="text-[20px] font-bold text-red-600 leading-none mb-[4px]">{stats.nextExpiry}</div>
          <div className="text-[11px] font-medium tracking-[0.03em] text-[#5C5C5C] leading-none">{stats.nextExpirySub}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b-[2px] border-[#eaeaea] mb-[24px]">
        <button 
          onClick={() => setActiveTab("members")}
          className={`px-[20px] py-[10px] text-[16px] font-semibold ${activeTab === 'members' ? 'text-[#cd4a32] border-b-[2px] border-[#cd4a32]' : 'text-[#3A3A3A] border-b-[2px] border-transparent'} -mb-[2px] hover:text-ink cursor-pointer`}>
          Members ({members.length})
        </button>
        <button 
          onClick={() => setActiveTab("courses")}
          className={`px-[20px] py-[10px] text-[16px] font-semibold ${activeTab === 'courses' ? 'text-[#cd4a32] border-b-[2px] border-[#cd4a32]' : 'text-[#3A3A3A] border-b-[2px] border-transparent'} -mb-[2px] hover:text-ink cursor-pointer`}>
          Courses ({stats.assignedCourses})
        </button>
        <button 
          onClick={() => setActiveTab("progress")}
          className={`px-[20px] py-[10px] text-[16px] font-semibold ${activeTab === 'progress' ? 'text-[#cd4a32] border-b-[2px] border-[#cd4a32]' : 'text-[#3A3A3A] border-b-[2px] border-transparent'} -mb-[2px] hover:text-ink cursor-pointer`}>
          Progress overview
        </button>
      </div>

      {/* Panel */}
      {activeTab === "members" && (
        <div className="animate-[fade_0.2s_ease-in-out]">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-[16px] mb-[16px]">
            <div className="relative w-full max-w-[300px]">
              <svg className="absolute left-[12px] top-1/2 -translate-y-1/2 text-ink-mute pointer-events-none" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              <input type="search" placeholder="Search members..." className="w-full h-[38px] pl-[36px] pr-[14px] bg-[#F6F6F4] border border-[#d3d3d3] rounded-[100px] text-[14px] text-ink focus:border-[#c99b2e] outline-none transition-colors" />
            </div>
            <div className="flex items-center gap-[8px]">
              <button 
                onClick={() => navigate('/create-tenant-user')}
                className="inline-flex items-center justify-center gap-[6px] px-[14px] py-[8px] bg-white border border-[#eaeaea] rounded-full text-ink font-bold text-[13px] hover:bg-[#f6f6f4] hover:border-ink-mute transition-all"
              >
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                Add member
              </button>
            </div>
          </div>

          {/* Table Card */}
          <div className="bg-white border border-[#eaeaea] rounded-[14px] shadow-sm hover:border-[#d3d3d3] overflow-hidden transition-all duration-200">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-[14px]">
                <thead>
                  <tr className="border-b border-[#eaeaea]">
                    <th className="w-[36px] py-[10px] pl-[16px] pr-[8px]">
                      <input type="checkbox" className="w-[15px] h-[15px] cursor-pointer accent-[#769e6b] align-middle" />
                    </th>
                    <th className="px-[14px] py-[10px] text-[12px] font-semibold text-ink-mute whitespace-nowrap">
                      <button className="inline-flex items-center gap-[5px] hover:text-ink transition-colors font-inherit cursor-pointer bg-transparent border-none p-0 m-0">
                        Member
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="opacity-45"><path d="M7 10l5-5 5 5"></path><path d="M7 14l5 5 5-5"></path></svg>
                      </button>
                    </th>

                    <th className="px-[14px] py-[10px] text-[12px] font-semibold text-ink-mute whitespace-nowrap">
                      <button className="inline-flex items-center gap-[5px] hover:text-ink transition-colors font-inherit cursor-pointer bg-transparent border-none p-0 m-0">
                        Joined
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="opacity-45"><path d="M7 10l5-5 5 5"></path><path d="M7 14l5 5 5-5"></path></svg>
                      </button>
                    </th>
                    <th className="px-[14px] py-[10px] text-[12px] font-semibold text-ink-mute whitespace-nowrap">
                      <button className="inline-flex items-center gap-[5px] hover:text-ink transition-colors font-inherit cursor-pointer bg-transparent border-none p-0 m-0">
                        Progress
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="opacity-45"><path d="M7 10l5-5 5 5"></path><path d="M7 14l5 5 5-5"></path></svg>
                      </button>
                    </th>
                    <th className="px-[14px] py-[10px]"></th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="py-[40px] text-center text-ink-mute">
                        Loading...
                      </td>
                    </tr>
                  ) : members.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-[40px] text-center text-ink-mute">
                        No members assigned to this group yet.
                      </td>
                    </tr>
                  ) : (
                    members.map((m: any, idx) => {
                      const user = m.user || m;
                      const profile = user.profile || user;

                      const joinedDate = user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : "-";
                      
                      const userAssignments = groupAssignments.filter(a => a.userId === user.id);
                      const totalAssigned = userAssignments.length;
                      const totalProgress = userAssignments.reduce((sum, a) => sum + (a.progressPercent || 0), 0);
                      const realProgress = totalAssigned > 0 ? Math.round(totalProgress / totalAssigned) : 0;
                      const progressColorClass = realProgress >= 70 ? "bg-[#769e6b]" : realProgress >= 40 ? "bg-[#c99b2e]" : "bg-[#d93025]";

                      return (
                        <tr key={m.id || user.id} className="border-b border-[#eaeaea] last:border-none hover:bg-[#f6f6f4] transition-colors">
                          <td className="w-[36px] py-[12px] pl-[16px] pr-[8px] align-middle">
                            <input type="checkbox" className="w-[15px] h-[15px] cursor-pointer accent-[#769e6b] align-middle" />
                          </td>
                          <td className="px-[14px] py-[12px] align-middle">
                            <div className="font-semibold text-[16px] text-ink">
                              {profile.firstName || profile.username || "User"} {profile.lastName || ""}
                            </div>
                            <div className="text-[14px] text-ink-mute mt-[2px]">{user.email}</div>
                          </td>

                          <td className="px-[14px] py-[12px] align-middle text-[16px] text-ink-soft">{joinedDate}</td>
                          <td className="px-[14px] py-[12px] align-middle">
                            <div className="flex items-center gap-[8px] min-w-[140px]">
                              <div className="flex-1 h-[6px] rounded-[100px] bg-[#f6f6f4] overflow-hidden min-w-[80px]">
                                <div className={`h-full rounded-[100px] ${progressColorClass} transition-all duration-400`} style={{ width: `${realProgress}%` }}></div>
                              </div>
                              <span className="text-[14px] font-semibold text-ink text-right shrink-0 w-[34px]">{realProgress}%</span>
                            </div>
                          </td>
                          <td className="px-[14px] py-[12px] align-middle text-right">
                            <a href="#" onClick={(e) => { e.preventDefault(); setSelectedUser(user); }} className="inline-flex items-center gap-[4px] text-[12px] font-bold tracking-[0.06em] text-ink-soft hover:text-[#c99b2e] transition-colors uppercase">
                              View <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                            </a>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            <div className="border-t border-[#eaeaea] py-[14px] px-[16px] text-center text-[13px] font-bold tracking-[0.04em] text-ink-mute">
              Showing {members.length} of {members.length} · <button className="font-inherit text-[#c99b2e] bg-transparent border-none p-0 cursor-pointer hover:underline">Load more</button>
            </div>
          </div>
        </div>
      )}

      {/* Courses Tab Content */}
      {activeTab === "courses" && (
        <div className="animate-[fade_0.2s_ease-in-out]">
          <div className="flex items-center justify-between mb-[20px]">
            <h2 className="text-[16px] font-bold text-ink">Courses assigned to this group</h2>
            <button
              onClick={() => navigate('/course-assignment')}
              className="inline-flex items-center justify-center gap-[6px] w-[144.84px] h-[39.3px] px-0 bg-[#fcf7ae] border-[1.5px] border-[#c99b2e8c] rounded-[100px] text-ink font-bold text-[14px] shadow-sm hover:brightness-95 transition-all cursor-pointer"
            >
              <span className="text-[16px] leading-none">+</span> Assign course
            </button>
          </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[20px]">
            {uniqueAssignedCourses.length > 0 ? (
              uniqueAssignedCourses.map((course: any, idx: number) => {
                const completionPercentage = course.totalAssigned > 0 
                  ? Math.round((course.totalCompleted / course.totalAssigned) * 100) 
                  : 0;
                
                const assignedDateStr = course.startDate || course.assignedAt || course.createdAt;
                const deadlineDateStr = course.endDate || course.dueDate;
                const courseDuration = course.content?.duration || course.content?.estimatedDuration || course.duration;
                const courseDifficulty = course.content?.difficulty || course.difficulty || 'All levels';

                return (
                  <div key={course.contentId || idx} className="bg-white border border-[#eaeaea] rounded-[12px] overflow-hidden shadow-sm flex flex-col cursor-pointer hover:border-black hover:shadow-md transition-all group">
                    <div className="h-[220px] bg-gray-200 relative overflow-hidden">
                      <img src={course.coverImageUrl || course.thumbnailUrl || course.content?.coverImageUrl || course.content?.thumbnailUrl || "https://images.unsplash.com/photo-1573164713988-8665fc963095?auto=format&fit=crop&q=80&w=400&h=200"} alt={course.content?.title || course.contentTitle || 'Course'} className="w-full h-full object-cover" />
                    </div>
                    <div className="p-[20px] flex flex-col flex-1 border-b border-[#eaeaea]">
                      <div className="flex items-center justify-between mb-[12px]">
                        <span className="bg-[#f6f6f4] px-[8px] py-[2px] rounded-[4px] text-[12px] font-bold tracking-[0.5px] uppercase text-ink-mute">{courseDifficulty}</span>
                        <span className="flex items-center gap-[4px] text-[13px] text-ink-mute"><svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg> {courseDuration ? `${courseDuration} min` : 'Self-paced'}</span>
                      </div>
                      <h3 className="text-[16px] font-bold text-ink mb-[4px]">{course.content?.title || course.contentTitle || 'Untitled'}</h3>
                      {(course.content?.isCareerPath || course.type === 'CAREER_PATH') && (
                        <p className="text-[12px] font-bold text-[#1e3a8a] mt-1 uppercase tracking-wide">Career Path</p>
                      )}
                      <p className="text-[14px] text-ink-soft mt-auto">By: <span className="font-semibold text-ink">{course.content?.author || 'Nexus Faculty'}</span></p>
                    </div>
                    <div className="px-[20px] py-[10px] flex flex-wrap gap-y-[12px] justify-between text-[14px]">
                      <div>
                        <div className="text-[12px] font-bold uppercase tracking-[0.5px] text-ink-mute mb-[2px]">ASSIGNED</div>
                        <div className="font-semibold text-ink">{assignedDateStr ? new Date(assignedDateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}</div>
                      </div>
                      <div>
                        <div className="text-[12px] font-bold uppercase tracking-[0.5px] text-ink-mute mb-[2px]">DEADLINE</div>
                        <div className="font-semibold text-ink">{deadlineDateStr ? new Date(deadlineDateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'None'}</div>
                      </div>
                      <div>
                        <div className="text-[12px] font-bold uppercase tracking-[0.5px] text-ink-mute mb-[2px]">MANDATORY</div>
                        {course.requirement === "MANDATORY" ? (
                          <div className="inline-flex items-center gap-[4px] bg-white border border-[#eaeaea] rounded-[100px] px-[6px] py-[2px] text-[#769e6b] font-semibold text-[14px]"><span className="w-[6px] h-[6px] rounded-full bg-[#769e6b]"></span> Yes</div>
                        ) : (
                          <div className="inline-flex items-center gap-[4px] bg-white border border-[#eaeaea] rounded-[100px] px-[6px] py-[2px] text-ink-mute font-semibold text-[14px]"> No</div>
                        )}
                      </div>
                      <div className="w-full flex items-end justify-between mt-[4px]">
                        <div>
                          <div className="text-[12px] font-bold uppercase tracking-[0.5px] text-ink-mute mb-[2px]">COMPLETION</div>
                          <div className="font-semibold text-ink">{course.totalCompleted}/{course.totalAssigned} ({completionPercentage}%)</div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-full py-[40px] text-center">
                <p className="text-[15px] font-medium text-ink-mute">No courses assigned to this group yet.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Progress Tab Content */}
      {activeTab === "progress" && (
        <div className="animate-[fade_0.2s_ease-in-out]">
          <div className="bg-white border border-[#eaeaea] rounded-[14px] overflow-hidden shadow-sm">
            <div className="px-[24px] py-[20px] border-b border-[#eaeaea] flex items-center justify-between">
              <h3 className="text-[15px] font-bold text-ink">Group completion trend</h3>
              <span className="text-[11px] font-bold text-ink-mute tracking-[0.5px] uppercase">LAST 90 DAYS</span>
            </div>
            <div className="p-[24px]">
              <div className="w-full h-[300px] rounded-[8px] flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={trendData}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorCompletions" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#c99b2e" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#c99b2e" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis 
                      dataKey="name" 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#8f8f8f', fontSize: 12 }}
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#8f8f8f', fontSize: 12 }}
                      allowDecimals={false}
                    />
                    <CartesianGrid vertical={false} stroke="#eaeaea" />
                    <RechartsTooltip 
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                      itemStyle={{ color: '#141414', fontWeight: 'bold' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="Completions" 
                      stroke="#c99b2e" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorCompletions)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}
      </>
      )}
    </div>
  );
};

// ----------------------------------------------------------------------
// 3. MAIN COMPONENT (List View & Switcher)
// ----------------------------------------------------------------------
const CreateGroup: React.FC = () => {
  const navigate = useNavigate();
  const [view, setView] = useState<"LIST" | "CREATE" | "EDIT" | "DETAILS">("LIST");

  const { groups, fetchGroups, deleteGroup, loading } = useGroupStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; groupId: string | null }>({ isOpen: false, groupId: null });
  const [tenantData, setTenantData] = useState<any>(null);
  const [assignmentsData, setAssignmentsData] = useState<any[]>([]);
  const [isPageLoading, setIsPageLoading] = useState(true);

  const tenantId = useMemo(() => {
    try {
      const storedUser = localStorage.getItem('keycloak_session_user');
      if (!storedUser) return "";
      const parsed = JSON.parse(storedUser);
      const user = parsed?.user || parsed;
      return user?.tenantId || user?.tenant?.id || user?.organizationId || "";
    } catch {
      return "";
    }
  }, []);

  useEffect(() => {
    if (view === "LIST" && tenantId) {
      setIsPageLoading(true);
      Promise.all([
        fetchGroups(tenantId),
        getTenantByIdApi(tenantId).then(setTenantData).catch(console.error),
        getAssignmentReportApi(tenantId).then(r => setAssignmentsData(r?.items || r || [])).catch(console.error)
      ]).finally(() => setIsPageLoading(false));
    } else {
      setIsPageLoading(false);
    }
  }, [view, tenantId, fetchGroups]);

  const filteredGroups = useMemo(() => {
    if (!groups) return [];
    return groups.filter(
      (g) =>
        g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (g.description || "").toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [groups, searchTerm]);

  const handleEdit = (group: Group) => {
    setSelectedGroup(group);
    setView("EDIT");
  };

  const handleViewDetails = (group: Group) => {
    setSelectedGroup(group);
    setView("DETAILS");
  };

  const confirmDelete = (groupId: string) => {
    setDeleteModal({ isOpen: true, groupId });
  };

  const handleDelete = async () => {
    if (deleteModal.groupId && tenantId) {
      await deleteGroup(tenantId, deleteModal.groupId);
      setDeleteModal({ isOpen: false, groupId: null });
    }
  };

  return (
    <div className="min-h-[calc(100vh-100px)] bg-white font-sans -mt-7 -mx-7 px-7 pt-6">

      {/* View Switcher */}
      {view === "CREATE" && (
        <CreateGroupFormView onBack={() => setView("LIST")} editGroup={null} tenantName={tenantData?.name} />
      )}

      {view === "EDIT" && (
        <CreateGroupFormView onBack={() => { setView("LIST"); setSelectedGroup(null); }} editGroup={selectedGroup} tenantName={tenantData?.name} />
      )}

      {view === "DETAILS" && selectedGroup && (
        <GroupDetailsView
          group={selectedGroup}
          onBack={() => { setView("LIST"); setSelectedGroup(null); }}
          tenantName={tenantData?.name}
          tenantId={tenantId}
          assignmentsData={assignmentsData}
          onEdit={() => handleEdit(selectedGroup)}
        />
      )}

      {view === "LIST" && isPageLoading && (
        <div className="mx-auto pb-24 animate-pulse">
          {/* Header Skeleton */}
          <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="h-3 bg-gray-200 rounded w-32 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-48 mb-3"></div>
              <div className="h-4 bg-gray-200 rounded max-w-2xl w-full"></div>
            </div>
            <div>
              <div className="h-[40px] bg-gray-200 rounded-full w-[150px]"></div>
            </div>
          </div>

          {/* Active Groups Skeleton */}
          <div className="rounded-[12px] border border-gray-200 bg-white shadow-sm overflow-hidden mb-8">
            <div className="flex items-center justify-between px-7 py-4 border-b border-gray-200 bg-[#fbfbfb]">
              <div className="h-4 bg-gray-200 rounded w-24"></div>
              <div className="h-6 bg-gray-200 rounded-full w-20"></div>
            </div>
            <div className="divide-y divide-gray-200">
              {[1, 2, 3].map((i) => (
                <div key={i} className="py-5 px-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 bg-gray-200 rounded-xl"></div>
                    <div className="w-[300px]">
                      <div className="h-5 bg-gray-200 rounded w-40 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-64 mb-3"></div>
                      <div className="h-2 bg-gray-200 rounded-full w-40"></div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="h-3 bg-gray-200 rounded w-20"></div>
                    <div className="h-3 bg-gray-200 rounded w-24"></div>
                    <div className="h-4 bg-gray-200 rounded w-24 mt-1"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {view === "LIST" && !isPageLoading && (
        <div className="mx-auto pb-24">
          {/* Header */}
          <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="text-xs font-medium tracking-[0.05em] text-gray-500 mb-1 flex items-center gap-1.5 uppercase">
                TENANT <span className="text-[10px]">·</span> {tenantData?.name || "LOADING..."}
              </div>
              <h1 className="text-[32px] font-semibold text-gray-900 tracking-tight leading-none mb-3">Team groups</h1>
              <p className="text-[16px] text-[#3a3a3a] max-w-2xl leading-relaxed">
                Groups are defined by your organisation's identity provider and synced automatically. You can also create manual groups to organise members independently.
              </p>
            </div>
            <div>
              <button
                onClick={() => setView("CREATE")}
                className="rounded-full bg-[#fcf7ae] px-4 py-[9px] text-[14px] font-bold text-gray-900 border border-[#e8ce7b] hover:bg-[#f7eaa1] transition shadow-[0_4px_14px_rgba(0,0,0,0.06)] flex items-center gap-2 mt-1 cursor-pointer"
              >
                <span className="text-[20px] font-normal leading-none relative top-[-1px]">+</span> Create group
              </button>
            </div>
          </div>

          {/* Active Groups Section */}
          <div className="rounded-[12px] border border-gray-200 bg-white shadow-sm overflow-hidden mb-8 transition-all duration-300 hover:shadow-[0_8px_20px_-6px_rgba(0,0,0,0.1)] hover:-translate-y-[2px]">
            <div className="flex items-center justify-between px-7 py-4 border-b border-gray-200 bg-[#fbfbfb]">
              <h3 className="font-bold text-gray-500 text-xs uppercase tracking-[0.1em]">ACTIVE GROUPS</h3>
              <span className="text-xs font-semibold px-3 py-1 rounded-full border border-green-600/30 text-green-700 bg-green-50/50">
                {filteredGroups.length} active
              </span>
            </div>

            <div className="divide-y divide-gray-200">
              {filteredGroups.length > 0 ? (
                filteredGroups.map((group, idx) => {
                  const groupAssignments = assignmentsData.filter(a => a.departmentId === group.id);
                  const assignmentCount = groupAssignments.length;
                  const totalProgress = groupAssignments.reduce((sum, a) => sum + (a.progressPercent || 0), 0);
                  const avgProgress = assignmentCount > 0 ? Math.round(totalProgress / assignmentCount) : 0;
                  const memberCount = (group as any)._count?.departmentUsers || group.userIds?.length || 0;
                  const updatedTime = formatRelativeTime((group as any).updatedAt || (group as any).createdAt);

                  return (
                    <div
                      key={group.id}
                      onClick={() => handleViewDetails(group)}
                      className="py-5 px-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white relative transition-all duration-300 hover:bg-[#f6f6f6] group/card cursor-pointer"
                      style={{ animation: `fade-in-down 0.4s ease-out ${idx * 0.05}s both` }}
                    >
                      <div className="flex items-center gap-5">
                        <div className="w-[44px] h-[44px] bg-white border border-gray-200 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm overflow-hidden group-hover/card:border-gray-300 transition-colors">
                          <Building2 className="w-5 h-5 text-gray-400 group-hover/card:text-gray-500 transition-colors" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-gray-900 text-base">{group.name}</h4>
                            {group.status && (
                              <span className="text-[11px] font-semibold leading-[19px] px-2 py-0.5 rounded-full bg-gray-100 text-[#446038]">
                                {group.status}
                              </span>
                            )}
                          </div>
                          <div className="text-[12px] font-normal leading-[19px] text-gray-500 mt-1 flex items-center gap-1.5 flex-wrap">
                            {group.description ? (
                              <span className="text-gray-600 max-w-[320px] truncate">{group.description}</span>
                            ) : (
                              <span className="text-gray-400 italic">No description</span>
                            )}
                            {updatedTime && (
                              <>
                                <span className="text-gray-300">•</span>
                                <span className="text-gray-400">Updated {updatedTime}</span>
                              </>
                            )}
                          </div>
                          <div className="mt-3 flex items-center gap-3">
                            <div className="h-2 w-[160px] bg-gray-200 rounded-full overflow-hidden">
                              <div className="h-full bg-[#d4a037] rounded-full transition-all duration-500" style={{ width: `${avgProgress}%` }}></div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="flex flex-col items-end gap-[5px]">
                          <div className="flex items-center gap-1.5 text-[12px] font-semibold leading-[19px] text-gray-500">
                            <Users className="w-4 h-4 text-gray-400" strokeWidth={2} />
                            {memberCount} members
                          </div>
                          <div className="flex items-center gap-1.5 text-[12px] font-semibold leading-[19px] text-gray-500">
                            <BookOpen className="w-4 h-4 text-gray-400" strokeWidth={2} />
                            {assignmentCount} assignments
                          </div>
                          <div className="text-[12px] font-bold text-gray-800 mt-[2px]">{avgProgress}% complete</div>
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewDetails(group);
                          }}
                          className="px-7 py-2.5 border border-gray-200 rounded-full text-[14px] font-bold leading-[22px] text-gray-900 bg-white hover:bg-gray-50 hover:border-black shadow-sm transition ml-3 cursor-pointer"
                        >
                          Manage
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-10 text-center text-gray-500 text-sm">
                  No groups found. Create one to get started.
                </div>
              )}
            </div>
          </div>

          {/* Bottom Banner: Learning & Assignments */}
          <div className="rounded-[12px] border border-gray-200 bg-white px-8 py-7 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mt-8">
            <div className="flex items-center gap-6">
              <div className="w-14 h-14 bg-[#f4f4f4] rounded-full flex items-center justify-center flex-shrink-0">
                <img src={buildingIcon} alt="Building icon" className="w-7 h-7 opacity-80" />
              </div>
              <div>
                <h4 className="font-bold text-gray-500 text-xs uppercase tracking-[0.1em] mb-1.5">GROUP ASSIGNMENTS</h4>
                <h3 className="font-bold text-gray-900 text-[16px] mb-1">Assign learning to your teams</h3>
                <p className="text-[14px] text-gray-500">Assign published courses or career paths directly to groups and track team progress in real time.</p>
              </div>
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto">

              <button
                type="button"
                onClick={() => navigate('/corporate-admin-dashboard')}
                className="px-6 py-2.5 border border-gray-300 rounded-full text-sm font-bold leading-[22px] text-gray-900 hover:bg-gray-50 transition shadow-sm whitespace-nowrap cursor-pointer"
              >
                Back to dashboard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-sm p-8 shadow-2xl text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6 text-red-600">
              <Trash2 className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Delete Group</h3>
            <p className="text-gray-500 mb-8 font-medium">
              Are you sure you want to delete this group? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setDeleteModal({ isOpen: false, groupId: null })}
                className="px-6 py-3 w-1/2 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-6 py-3 w-1/2 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors shadow-lg shadow-red-600/20"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateGroup;