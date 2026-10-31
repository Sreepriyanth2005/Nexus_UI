// src/core/mappers/rolesPermissions.mapper.ts

import { InternalUser } from "../api/internal-user/internalUser.api";
import { Role } from "../api/role.api";
import { PermissionDto } from "../api/permission.api";

export interface PlatformUserViewModel {
  id: string;
  name: string;
  email: string;
  role: string;
  roleCode: string;
  lastActive: string;
  courses: number;
  status: string;
  rawRoles: string[];
  /** ISO date string of when the primary role assignment expires. Null = permanent. */
  expiresAt: string | null;
}

export interface PermissionMatrixRow {
  permissionId: string;
  code: string;
  name: string;
  module: string;
  action: string;
  personaAssignments: Record<string, boolean>;
}

export const BASE_PERSONAS = [
  { code: "VISITOR", label: "VISITOR" },
  { code: "MEMBER", label: "LEARNER / MEMBER" },
  { code: "FREE_MEMBER", label: "FREE MEMBER" },
  { code: "CONTENT_DEVELOPER", label: "CONTENT DEV" },
  { code: "SME", label: "SME" },
  { code: "CORPORATE_USER", label: "CORPORATE USER" },
  { code: "CORPORATE_ADMIN", label: "CORPORATE ADMIN" },
  { code: "SYSTEM_SUPPORT_ENGINEER", label: "SUPPORT ENG" },
  { code: "SUPER_ADMIN", label: "SUPER ADMIN" },
];

export function mapUserToViewModel(user: InternalUser): PlatformUserViewModel {
  const firstName = user.firstName || "";
  const lastName = user.lastName || "";
  const name = `${firstName} ${lastName}`.trim() || user.email || "Platform User";

  const rawRoles = Array.isArray(user.roles) ? user.roles : [];
  
  const roleHierarchy = [
    "SUPER_ADMIN", "SUPER ADMIN",
    "CONTENT_DEVELOPER", "CONTENT DEVELOPER",
    "SME", "SUBJECT_MATTER_EXPERT", "SUBJECT MATTER EXPERT",
    "CORPORATE_ADMIN", "CORPORATE", "ORG ADMIN", "ORG_ADMIN",
    "SYSTEM_SUPPORT_ENGINEER", "SUPPORT", "INSTRUCTOR"
  ];

  let primaryRoleCode = rawRoles[0] || "MEMBER";
  if (rawRoles.length > 0) {
    const sortedRoles = [...rawRoles].sort((a, b) => {
      const indexA = roleHierarchy.indexOf(a.toUpperCase());
      const indexB = roleHierarchy.indexOf(b.toUpperCase());
      if (indexA !== -1 && indexB !== -1) return indexA - indexB;
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;
      return 0;
    });
    primaryRoleCode = sortedRoles[0];
  }

  // Formatted role display
  let roleLabel = primaryRoleCode;
  const upperRole = primaryRoleCode.toUpperCase();
  if (upperRole === "SUPER_ADMIN") roleLabel = "Super Admin";
  else if (upperRole === "CONTENT_DEVELOPER") roleLabel = "Content Developer";
  else if (upperRole === "SME") roleLabel = "Subject Matter Expert";
  else if (upperRole === "CORPORATE_ADMIN") roleLabel = "Corporate Admin";
  else if (upperRole === "SYSTEM_SUPPORT_ENGINEER") roleLabel = "Support Engineer";
  else if (upperRole === "INSTRUCTOR") roleLabel = "Instructor";
  else if (upperRole === "MEMBER") roleLabel = "Member";
  else if (upperRole === "VISITOR") roleLabel = "Visitor";

  // Last Active Date fallback
  let lastActive = "2026-03-26";
  if (user.lastLogin) {
    lastActive = new Date(user.lastLogin).toISOString().split("T")[0];
  } else if (user.updatedAt) {
    lastActive = new Date(user.updatedAt).toISOString().split("T")[0];
  }

  return {
    id: user.id,
    name,
    email: user.email,
    role: roleLabel,
    roleCode: primaryRoleCode,
    lastActive,
    courses: 0,
    status: user.status || "ACTIVE",
    rawRoles,
    expiresAt: user.superAdminExpiryDate ?? null,
  };
}

export function formatPermissionName(permission: PermissionDto): string {
  if (permission.description) return permission.description;

  const action = permission.action ? permission.action.toLowerCase() : "";
  const module = permission.module ? permission.module.toLowerCase() : "";

  // Convert "view_course" or "VIEW" + "COURSE" to "View course"
  const formattedAction = action.charAt(0).toUpperCase() + action.slice(1);
  const formattedModule = module.replace(/_/g, " ");
  return `${formattedAction} ${formattedModule}`.trim();
}

export function mapPermissionMatrix(
  permissions: PermissionDto[],
  rolePermissionsMap: Record<string, string[]>, // roleCode/roleId -> permissionIds array
  roles: { code: string; label?: string; name?: string }[] = BASE_PERSONAS
): PermissionMatrixRow[] {
  return permissions.map((perm) => {
    const personaAssignments: Record<string, boolean> = {};

    roles.forEach((persona) => {
      const assignedPermIds = rolePermissionsMap[persona.code] || rolePermissionsMap[persona.code.toLowerCase()] || [];
      // Also check if super admin has full permissions by default
      if (persona.code === "SUPER_ADMIN") {
        personaAssignments[persona.code] = true;
      } else {
        personaAssignments[persona.code] = assignedPermIds.includes(perm.id) || assignedPermIds.includes(perm.code);
      }
    });

    return {
      permissionId: perm.id,
      code: perm.code,
      name: formatPermissionName(perm),
      module: perm.module,
      action: perm.action,
      personaAssignments,
    };
  });
}
