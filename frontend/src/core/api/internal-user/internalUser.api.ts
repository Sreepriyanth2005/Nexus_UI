import { api } from "../../../config/axios";

export interface InternalUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  country: string;
  password?: string;
  status?: string;
  roles: string[];
  superAdminExpiryDate?: string | null;
  keycloakInternalPassword?: string | null;
  profile?: {
    firstName?: string;
    lastName?: string;
    countryName?: string;
  };
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string;
  lastLogin?: string;
  department?: string;
  profileImageUrl?: string | null;
  profileCompleteness?: number;
  enrollments?: { courseId?: string | null; careerPathId?: string | null }[];
  courseCompleted?: number;
  certificates?: any[];
  lifecycle?: {
    softDeletedAt?: string | null;
    purgeScheduledAt?: string | null;
    purgedAt?: string | null;
  } | null;
  auditLogs?: any[];
  userAnalytics?: any;
  security?: any;
  ownedCourses?: any[];
  createdCareerPaths?: any[];
  reviewsToApprove?: any[];
  tenant?: any;
}

export interface AdminDepartment {
  id: string;
  name: string;
  description?: string | null;
  status: string;
}

/* ---------------- FORMAT USER ---------------- */

const formatUser = (user: any): InternalUser => ({
  id: user.id,
  email: user.email,
  firstName: user.profile?.firstName || user.firstName || "",
  lastName: user.profile?.lastName || user.lastName || "",
  country: user.profile?.countryName || user.country || "",
  status: user.status || "ACTIVE",
  keycloakInternalPassword: user.keycloakInternalPassword ?? null,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
  lastLogin: user.lastLogin || user.lifecycle?.lastLoginAt || user.firstLoginAt || "",
  department: user.department || (user.adminDepartments && user.adminDepartments[0]?.department?.name) || (user.departmentAssignments && user.departmentAssignments[0]?.department?.name) || "",
  lifecycle: user.lifecycle ?? null,
  profileCompleteness: user.profileCompleteness ?? 0,
  enrollments: user.enrollments || [],
  certificates: user.certificates || [],
  profileImageUrl: (() => {
    // Check assetsStorage for an IMAGE asset
    if (Array.isArray(user.assetsStorage)) {
      const imageAsset = user.assetsStorage.find((a: any) => a.assetType === "IMAGE" && (a.assetContext === "USER" || a.assetContext === "PROFILE"));
      if (imageAsset) {
        if (imageAsset.url) return imageAsset.url;
        if (imageAsset.bucketName && imageAsset.gcsKey) {
          return `https://storage.googleapis.com/${imageAsset.bucketName}/${imageAsset.gcsKey}`;
        }
        return imageAsset.fileName;
      }
    }
    // Fallback to older asset references if they exist
    if (Array.isArray(user.assets)) {
      const imageAsset = user.assets.find((a: any) => a.asset?.assetType === "IMAGE");
      if (imageAsset?.asset?.fileName) return imageAsset.asset.url || imageAsset.asset.fileName;
    }
    return null;
  })(),
  roles: Array.from(
    new Set(
      Array.isArray(user.roles)
        ? user.roles
          .map((r: any) => {
            if (typeof r === "string") return r;
            // Prefer the role code; fall back to name/code on the object itself
            return r?.role?.code || r?.code || r?.name || null;
          })
          .filter(Boolean)
        : []
    )
  ) as string[],
  // Extract expiresAt from the SUPER_ADMIN role assignment (if any)
  superAdminExpiryDate: (() => {
    if (!Array.isArray(user.roles)) return null;
    const superAdminRole = user.roles.find((r: any) => {
      const code = r?.role?.code || r?.code || "";
      return code.toUpperCase() === "SUPER_ADMIN";
    });
    return superAdminRole?.expiresAt ?? null;
  })(),
  auditLogs: (() => {
    const combined = [
      ...(user.auditLogs || []),
      ...(user.rbacAuditLogs || []),
      ...(user.supportAuditLogs || [])
    ].map(log => ({
      ...log,
      timestamp: new Date(log.createdAt).getTime(),
      entityType: log.entityType || log.targetType || log.action,
      entityId: log.entityId || log.targetId || log.ticketId,
    }));
    return combined.sort((a, b) => b.timestamp - a.timestamp).slice(0, 20);
  })(),
  userAnalytics: user.userAnalytics || null,
  security: user.security || null,
  ownedCourses: user.ownedCourses || [],
  createdCareerPaths: user.createdCareerPaths || [],
  reviewsToApprove: user.reviewsToApprove || [],
  tenant: user.tenant || null,
});

/* ---------------- GET ALL ---------------- */

export const getInternalUsers = async (params?: {
  role?: string;
  limit?: number;
  status?: string;
  page?: number;
}): Promise<InternalUser[]> => {
  const res = await api.get("/internal-users", { params });
  return (res.data.data || []).map(formatUser);
};

/* ---------------- GET BY ID ---------------- */

export const getAdminDepartments = async (): Promise<AdminDepartment[]> => {
  const res = await api.get("/internal-users/admin-departments");
  return res.data.data || [];
};

export const getInternalUserById = async (id: string): Promise<InternalUser> => {
  const res = await api.get(`/internal-users/${id}`);
  return formatUser(res.data.data);
};

/* ---------------- CREATE ---------------- */

export const createInternalUser = async (data: Partial<InternalUser>): Promise<InternalUser> => {
  const payload = {
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    password: data.password,
    country: data.country,
    roles: data.roles || [],
    department: data.department,
    superAdminExpiryDate: data.superAdminExpiryDate,
    sendInvitationEmail: true,
  };

  const res = await api.post("/internal-users", payload);
  return formatUser(res.data.data);
};

/* ---------------- UPDATE ---------------- */

export const updateInternalUser = async (id: string, data: Partial<InternalUser>): Promise<InternalUser> => {
  const payload = {
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    country: data.country,
    roles: data.roles || [],
    department: data.department,
    superAdminExpiryDate: data.superAdminExpiryDate,
  };

  const res = await api.put(`/internal-users/${id}`, payload);
  return formatUser(res.data.data);
};

/* ---------------- EXPIRY ---------------- */

export const setAccountExpiry = async (id: string, expiryDate: string | null) => {
  const res = await api.patch(`/internal-users/${id}/expiry`, { expiryDate });
  return res.data;
};

/* ---------------- DELETE ---------------- */

export const deleteInternalUser = async (id: string) => {
  const res = await api.delete(`/internal-users/${id}`);
  return res.data;
};

/* ---------------- ACTIVATE ---------------- */

export const activateInternalUser = async (id: string) => {
  const res = await api.patch(`/internal-users/${id}/activate`);
  return res.data;
};

/* ---------------- ENROLL / ASSIGN COURSE ---------------- */

export const assignCourse = async (userId: string, data: { courseId?: string; careerPathId?: string }) => {
  const res = await api.post(`/internal-users/${userId}/assign-course`, data);
  return res.data;
};

/* ---------------- UNENROLL / REMOVE ENROLLMENT ---------------- */

export const removeEnrollment = async (userId: string, courseId: string) => {
  const res = await api.delete(`/internal-users/${userId}/enrollments/${courseId}`);
  return res.data;
};

/* ---------------- DEACTIVATE ---------------- */

export const deactivateInternalUser = async (id: string) => {
  const res = await api.patch(`/internal-users/${id}/deactivate`);
  return res.data;
};

/* ---------------- SUSPEND ---------------- */

export const suspendInternalUser = async (id: string) => {
  const res = await api.patch(`/internal-users/${id}/suspend`);
  return res.data;
};

/* ---------------- REACTIVATE ---------------- */

export const reactivateInternalUser = async (id: string) => {
  const res = await api.patch(`/internal-users/${id}/reactivate`);
  return res.data;
};



/* ---------------- RESET PASSWORD ---------------- */

export const resetInternalUserPassword = async (id: string, password?: string) => {
  const res = await api.post(`/internal-users/${id}/reset-password`, { password });
  return res.data;
};

/* ---------------- RESET MFA ---------------- */

export const resetInternalUserMfa = async (id: string) => {
  const res = await api.post(`/internal-users/${id}/reset-mfa`);
  return res.data;
};

/* ---------------- IMPERSONATION ---------------- */

export const impersonateUser = async (id: string) => {
  const res = await api.post(`/internal-users/${id}/impersonate`);
  return res.data;
};

export const stopImpersonation = async () => {
  const res = await api.post(`/internal-users/stop-impersonate`);
  return res.data;
};

/* ---------------- ROLES ---------------- */

export const replaceRoles = async (id: string, roles: string[]) => {
  const res = await api.put(`/internal-users/${id}/roles`, { roles });
  return res.data;
};

/* ---------------- BULK ---------------- */

export const bulkRoleAssignment = async (userIds: string[], roles: string[]) => {
  const res = await api.post(`/internal-users/bulk/roles`, { userIds, roles });
  return res.data;
};
