import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getInternalUsers,
  getInternalUserById,
  deleteInternalUser,
  activateInternalUser,
  deactivateInternalUser,
  resetInternalUserPassword,
  assignCourse,
  removeEnrollment,
  reactivateInternalUser,
  resetInternalUserMfa,
  impersonateUser,
  stopImpersonation,
  replaceRoles,
  bulkRoleAssignment,
  setAccountExpiry,
  InternalUser,
  AdminDepartment,
  getAdminDepartments,
} from "../../core/api/internal-user/internalUser.api";
import { useInternalUserUiStore } from "../../store/internal-user/internalUser.store";
import { courseApi } from "../../core/api/course/course.api";
import { getAllCareerPathsApi } from "../../core/api/career-path/career-path.api";
import { UserLifecycleAPI } from "../../core/api/user-lifecycle.api";

export const useUsers = (params?: { role?: string; limit?: number; status?: string; page?: number }) => {
  return useQuery<InternalUser[]>({
    queryKey: ["internal-users", params],
    queryFn: () => getInternalUsers(params),
  });
};

export const useAdminDepartments = () => {
  return useQuery<AdminDepartment[]>({
    queryKey: ["admin-departments"],
    queryFn: () => getAdminDepartments(),
  });
};

export const useUser = (id: string) => {
  return useQuery<InternalUser>({
    queryKey: ["internal-user", id],
    queryFn: () => getInternalUserById(id),
    enabled: !!id,
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteInternalUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["internal-users"] });
    },
  });
};

export const useUpdateUserStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      if (status === "ACTIVE") {
        return activateInternalUser(id);
      }
      return deactivateInternalUser(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["internal-users"] });
    },
  });
};

export const useReactivateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => reactivateInternalUser(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["internal-user", id] });
      queryClient.invalidateQueries({ queryKey: ["internal-users"] });
    },
  });
};

export const useResetPassword = () => {
  return useMutation({
    mutationFn: ({ id, password }: { id: string; password?: string }) =>
      resetInternalUserPassword(id, password),
  });
};

// Alias retained for admin screens that use the explicit admin action name.
export const useAdminResetPassword = useResetPassword;

export const useAdminResetMfa = () => {
  return useMutation({
    mutationFn: (id: string) => resetInternalUserMfa(id),
  });
};

export const useAdminImpersonate = () => {
  return useMutation({
    mutationFn: (id: string) => impersonateUser(id),
  });
};

export const useAdminStopImpersonate = () => {
  return useMutation({
    mutationFn: () => stopImpersonation(),
  });
};

export const useAdminReplaceRoles = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, roles }: { id: string; roles: string[] }) => replaceRoles(id, roles),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["internal-user", id] });
      queryClient.invalidateQueries({ queryKey: ["internal-users"] });
    },
  });
};

export const useAdminBulkRoleAssignment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userIds, roles }: { userIds: string[]; roles: string[] }) => bulkRoleAssignment(userIds, roles),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["internal-users"] });
    },
  });
};

export const useAdminSetAccountExpiry = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, expiryDate }: { id: string; expiryDate: string | null }) => setAccountExpiry(id, expiryDate),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["internal-user", id] });
      queryClient.invalidateQueries({ queryKey: ["internal-users"] });
    },
  });
};

export const useAssignCourse = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: { courseId?: string; careerPathId?: string } }) =>
      assignCourse(userId, data),
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ["internal-user", userId] });
      queryClient.invalidateQueries({ queryKey: ["admin-user-enrollments-progress", userId] });
      queryClient.invalidateQueries({ queryKey: ["internal-users"] });
    },
  });
};

export const useRemoveEnrollment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, contentId }: { userId: string; contentId: string }) =>
      removeEnrollment(userId, contentId),
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ["internal-user", userId] });
      queryClient.invalidateQueries({ queryKey: ["admin-user-enrollments-progress", userId] });
      queryClient.invalidateQueries({ queryKey: ["internal-users"] });
    },
  });
};

export const useAdminChangeStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, status, reason, internalNotes, suspendDurationDays, notifyUser }: { userId: string; status: string; reason?: string; internalNotes?: string; suspendDurationDays?: number; notifyUser?: boolean }) =>
      UserLifecycleAPI.adminChangeStatus(userId, status, reason, internalNotes, suspendDurationDays, notifyUser).then((res) => res.data),
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ["internal-user", userId] });
      queryClient.invalidateQueries({ queryKey: ["internal-users"] });
    },
  });
};

export const useAdminHardPurge = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => UserLifecycleAPI.adminHardPurge(userId).then((res) => res.data),
    onSuccess: (_, userId) => {
      queryClient.invalidateQueries({ queryKey: ["internal-user", userId] });
      queryClient.invalidateQueries({ queryKey: ["internal-users"] });
    },
  });
};

export const useUserFilters = (users: InternalUser[]) => {
  const {
    search,
    roleFilters,
    statusFilters,
    tenantFilter,
    dateJoinedFilter,
    lastActiveFilter,
    sortOrder,
    page,
    pageSize,
  } = useInternalUserUiStore();

  // 1. Apply Filtering
  const filteredUsers = users.filter((user) => {
    // A. Search by Name / Email / ID
    if (search !== "") {
      const query = search.toLowerCase();
      const nameMatch =
        user.firstName?.toLowerCase().includes(query) ||
        user.lastName?.toLowerCase().includes(query);
      const emailMatch = user.email?.toLowerCase().includes(query);
      const idMatch = user.id?.toLowerCase().includes(query);

      if (!nameMatch && !emailMatch && !idMatch) {
        return false;
      }
    }

    // B. Multi-Role/Persona Filter
    if (roleFilters.length > 0) {
      // Map user roles to filter keys: Individual member (if no tenant), Corporate user (if tenant), SME, Content Developer, Support, Admin
      const userMappedRoles: string[] = [];
      
      const hasTenant = !!user.department || !!user.lastLogin; // derived indicator of tenant/corporate presence
      
      if (!hasTenant) {
        userMappedRoles.push("MEMBER"); // Individual member
      } else {
        userMappedRoles.push("CORPORATE_USER"); // Corporate user
      }

      user.roles.forEach((role) => {
        const uppercaseRole = role.toUpperCase();
        if (uppercaseRole === "SME") {
          userMappedRoles.push("SME");
        } else if (uppercaseRole === "CONTENT_DEVELOPER") {
          userMappedRoles.push("CONTENT_DEVELOPER");
        } else if (uppercaseRole === "SYSTEM_SUPPORT_ENGINEER" || uppercaseRole === "SUPPORT") {
          userMappedRoles.push("SUPPORT");
        } else if (uppercaseRole === "SUPER_ADMIN" || uppercaseRole === "CORPORATE_ADMIN" || uppercaseRole === "ADMIN") {
          userMappedRoles.push("ADMIN");
        }
      });

      const roleMatch = roleFilters.some((filterRole) => userMappedRoles.includes(filterRole.toUpperCase()));
      if (!roleMatch) {
        return false;
      }
    }

    // C. Multi-Status Filter
    if (statusFilters.length > 0) {
      const userStatus = (user.status || "ACTIVE").toUpperCase();
      // Match with active, suspended, deactivated, locked, invited
      let mappedStatus = "ACTIVE";
      if (userStatus === "INACTIVE" || userStatus === "DEACTIVATE" || userStatus === "DEACTIVATED") {
        mappedStatus = "DEACTIVATED";
      } else if (userStatus === "SUSPENDED") {
        mappedStatus = "SUSPENDED";
      } else if (userStatus === "LOCKED") {
        mappedStatus = "LOCKED";
      } else if (userStatus === "PENDING" || userStatus === "INVITED") {
        mappedStatus = "INVITED";
      }

      const statusMatch = statusFilters.some((filterStatus) => filterStatus.toUpperCase() === mappedStatus);
      if (!statusMatch) {
        return false;
      }
    }

    // D. Tenant Filter (we skip if not defined/available)
    if (tenantFilter !== "") {
      const userTenant = user.department ? user.department.toLowerCase() : "";
      if (!userTenant.includes(tenantFilter.toLowerCase())) {
        return false;
      }
    }

    // E. Date Joined Filter
    if (dateJoinedFilter !== "") {
      if (!user.createdAt) return false;
      const joinedDate = new Date(user.createdAt);
      const diffTime = Math.abs(new Date().getTime() - joinedDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (dateJoinedFilter === "7d" && diffDays > 7) return false;
      if (dateJoinedFilter === "30d" && diffDays > 30) return false;
      if (dateJoinedFilter === "90d" && diffDays > 90) return false;
    }

    // F. Last Active Filter
    if (lastActiveFilter.length > 0) {
      if (!user.lastLogin) {
        return lastActiveFilter.includes("never");
      }
      
      const lastActiveDate = new Date(user.lastLogin);
      const diffTime = Math.abs(new Date().getTime() - lastActiveDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      const activeMatch = lastActiveFilter.some((filterVal) => {
        if (filterVal === "7d") return diffDays <= 7;
        if (filterVal === "30d") return diffDays <= 30;
        if (filterVal === "90d") return diffDays > 90;
        return false;
      });

      if (!activeMatch) {
        return false;
      }
    }

    return true;
  });

  // 2. Apply Sorting
  const sortedUsers = [...filteredUsers];
  if (sortOrder) {
    sortedUsers.sort((a, b) => {
      const nameA = `${a.firstName} ${a.lastName}`.toLowerCase();
      const nameB = `${b.firstName} ${b.lastName}`.toLowerCase();
      if (nameA < nameB) return sortOrder === "asc" ? -1 : 1;
      if (nameA > nameB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
  }

  // 3. Apply Pagination
  const totalItems = sortedUsers.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const startIndex = (page - 1) * pageSize;
  const paginatedUsers = sortedUsers.slice(startIndex, startIndex + pageSize);

  return {
    filteredUsers: sortedUsers,
    paginatedUsers,
    totalItems,
    totalPages,
    page,
    pageSize,
  };
};

// ---------------------------------------------------------------------------
// Admin: Fetch a specific user's enrollments with progress from DB tables
// Workflow:
//   1. Check `enrollment` table for this userId â†’ get courseId / careerPathId
//   2. Check `course_progress` and `careerpath_progress` tables for progress/status
//   3. Cross-reference `courses` and `career_paths` tables for titles
// ---------------------------------------------------------------------------
export const useAdminUserEnrollmentsWithProgress = (userId: string) => {
  return useQuery({
    queryKey: ["admin-user-enrollments-progress", userId],
    queryFn: async () => {
      if (!userId) return [];



      try {
        // Strategy 1: Try the dedicated admin endpoint that joins enrollment + progress + course data
        const res = await courseApi.getAdminUserEnrollmentsWithProgress(userId);
        if (res.data.data && res.data.data.length > 0) {
          return res.data.data;
        }
      } catch {
        // Endpoint doesn't exist yet â€” fall through to strategy 2
      }

      // Strategy 2: Fetch enrollments + progress separately and merge
      try {
        const [courseProgressRes, cpProgressRes, allCoursesRes, allCPRes] = await Promise.allSettled([
          courseApi.getAdminCourseProgress(userId),
          courseApi.getAdminCareerPathProgress(userId),
          courseApi.list({ limit: 100 }),
          getAllCareerPathsApi({ limit: 100 }),
        ]);

        const courseProgressList: any[] = courseProgressRes.status === "fulfilled"
          ? (courseProgressRes.value.data.data || []) : [];
        const cpProgressList: any[] = cpProgressRes.status === "fulfilled"
          ? (cpProgressRes.value.data.data || []) : [];
        
        console.log("=== STRATEGY 2 PROGRESS DEBUG ===");
        console.log("Course Progress List:", courseProgressList);
        console.log("CareerPath Progress List:", cpProgressList);
        console.log("=================================");
        const allCourses: any[] = courseProgressRes.status === "fulfilled"
          ? ((allCoursesRes as any).value?.data?.data || []) : [];
        const allCPs: any[] = cpProgressRes.status === "fulfilled"
          ? ((allCPRes as any).value?.data || []) : [];

        // Build a merged list from course_progress
        const fromCourses = courseProgressList.map((cp: any) => {
          const course = allCourses.find((c: any) => c.id === cp.courseId);
          const progress = cp.completed ? 100 : Number(cp.progress ?? 0);
          return {
            id: cp.courseId,
            courseId: cp.courseId,
            careerPathId: null,
            title: course?.title || "Unknown",
            category: course?.category?.name || "General",
            thumbnailUrl: course?.thumbnailAsset?.fileUrl || null,
            progress,
            status: cp.status || (progress === 100 ? "COMPLETED" : progress > 0 ? "IN_PROGRESS" : "ENROLLED"),
            createdAt: cp.startedAt || cp.createdAt || null,
          };
        });

        // Build a merged list from careerpath_progress
        const fromCPs = cpProgressList.map((cpp: any) => {
          const cp = allCPs.find((c: any) => c.id === cpp.careerPathId);
          const progress = cpp.completed ? 100 : Number(cpp.progress ?? 0);
          return {
            id: cpp.careerPathId,
            courseId: null,
            careerPathId: cpp.careerPathId,
            title: cp?.title || "Unknown",
            category: (cp as any)?.category?.name || "General",
            thumbnailUrl: (cp as any)?.thumbnailAsset?.fileUrl || null,
            progress,
            status: cpp.status || (progress === 100 ? "COMPLETED" : progress > 0 ? "IN_PROGRESS" : "ENROLLED"),
            createdAt: cpp.startedAt || cpp.createdAt || null,
          };
        });

        const merged = [...fromCourses, ...fromCPs];
        if (merged.length > 0) return merged;
      } catch {
        // Fall through to strategy 3
      }

      // Strategy 3: Try the existing /courses/me/enrolled (for logged-in user â€” may not be correct user)
      // but return empty to avoid showing wrong user's data
      return [];
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
  });
};
