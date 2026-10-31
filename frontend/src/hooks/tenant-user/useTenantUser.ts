import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getTenantUsersApi,
  getTenantUserByIdApi,
  deleteTenantUserApi,
  updateTenantUserStatusApi,
  TenantUser,
} from "../../core/api/tenantuser.api";
import { useTenantUserUiStore } from "../../store/tenantUserUi.store";

export const useTenantUsers = () => {
  return useQuery<TenantUser[]>({
    queryKey: ["tenant-users"],
    queryFn: getTenantUsersApi,
  });
};

export const useTenantUser = (id: string) => {
  return useQuery<TenantUser>({
    queryKey: ["tenant-user", id],
    queryFn: () => getTenantUserByIdApi(id),
    enabled: !!id,
  });
};

export const useDeleteTenantUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteTenantUserApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-users"] });
    },
  });
};

export const useUpdateTenantUserStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return updateTenantUserStatusApi(id, status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-users"] });
    },
  });
};

export const useTenantUserFilters = (users: TenantUser[]) => {
  const {
    search,
    personaFilters,
    statusFilters,
    sortBy,
    sortOrder,
    page,
    pageSize,
  } = useTenantUserUiStore();

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

    // Include only MEMBER and CORPORATE_USER roles in the tenant user dashboard.
    // If role is empty, we assume they are standard members.
    const roleStr = (user.roleName || user.roleCode || "").toUpperCase();
    if (
      roleStr !== "" &&
      !roleStr.includes("MEMBER") &&
      !roleStr.includes("CORPORATE")
    ) {
      return false;
    }

    // B. Multi-Persona Filter
    if (personaFilters.length > 0) {
      // Simplistic mapping for now based on roleCode/roleName or department
      const userPersonas: string[] = [];
      const role = (user.roleName || user.roleCode || "").toUpperCase();

      if (role.includes("ADMIN")) userPersonas.push("Admin");
      else if (role.includes("SME")) userPersonas.push("SME");
      else if (role.includes("CONTENT")) userPersonas.push("Content Developer");
      else if (role.includes("SUPPORT")) userPersonas.push("Support");

      if (user.departmentId) {
        userPersonas.push("Corporate user");
      } else {
        userPersonas.push("Individual member");
      }

      const personaMatch = personaFilters.some((filterPersona) => userPersonas.includes(filterPersona));
      if (!personaMatch) {
        return false;
      }
    }

    // C. Multi-Status Filter
    if (statusFilters.length > 0) {
      const userStatus = (user.status || "ACTIVE").toUpperCase();
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

    return true;
  });

  // 2. Apply Sorting
  const sortedUsers = [...filteredUsers];
  if (sortOrder && sortBy) {
    sortedUsers.sort((a, b) => {
      let valA: any = "";
      let valB: any = "";

      switch (sortBy) {
        case "NAME":
          valA = `${a.firstName || ""} ${a.lastName || ""}`.toLowerCase().trim();
          valB = `${b.firstName || ""} ${b.lastName || ""}`.toLowerCase().trim();
          break;
        case "EMAIL":
          valA = (a.email || "").toLowerCase();
          valB = (b.email || "").toLowerCase();
          break;
        case "STATUS":
          valA = (a.status || "").toLowerCase();
          valB = (b.status || "").toLowerCase();
          break;
        case "COURSE_COMPLETED":
          valA = (a as any).courseCompleted || 0;
          valB = (b as any).courseCompleted || 0;
          break;
        case "LAST_LOGIN":
          valA = (a as any).lastLogin ? new Date((a as any).lastLogin).getTime() : 0;
          valB = (b as any).lastLogin ? new Date((b as any).lastLogin).getTime() : 0;
          break;
        default:
          valA = `${a.firstName || ""} ${a.lastName || ""}`.toLowerCase().trim();
          valB = `${b.firstName || ""} ${b.lastName || ""}`.toLowerCase().trim();
          break;
      }

      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
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
