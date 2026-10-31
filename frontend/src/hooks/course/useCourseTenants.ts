// src/hooks/course/useCourseTenants.ts

import {
  useMutation,
  useQuery,
} from "@tanstack/react-query";

import {
  getCourseTenantsApi,
  createCourseTenantApi,
  updateCourseTenantApi,
  deleteCourseTenantApi,
} from "../../core/api/course/course-tenant.api";

import {
  useCourseTenantStore,
} from "../../store/course/courseTenantStore";

export const useCourseTenants = (
  courseId: string
) => {
  const {
    tenants,
    setTenants,
    addTenant,
    updateTenant,
    deleteTenant,
  } =
    useCourseTenantStore();

  const query =
    useQuery({
      queryKey: [
        "course-tenants",
        courseId,
      ],

      enabled:
        !!courseId,

      queryFn:
        async () => {
          const data =
            await getCourseTenantsApi(
              courseId
            );

          setTenants(
            data
          );

          return data;
        },
    });

  const createMutation =
    useMutation({
      mutationFn: (
        payload
      ) =>
        createCourseTenantApi(
          courseId,
          payload
        ),

      onSuccess: (
        data
      ) =>
        addTenant(
          data
        ),
    });

  const updateMutation =
    useMutation({
      mutationFn: ({
        tenantId,
        payload,
      }: any) =>
        updateCourseTenantApi(
          courseId,
          tenantId,
          payload
        ),

      onSuccess: (
        data
      ) =>
        updateTenant(
          data
        ),
    });

  const deleteMutation =
    useMutation({
      mutationFn: (
        tenantId: string
      ) =>
        deleteCourseTenantApi(
          courseId,
          tenantId
        ),

      onSuccess: (
        _,
        tenantId
      ) =>
        deleteTenant(
          tenantId
        ),
    });

  return {
    tenants,
    query,
    createMutation,
    updateMutation,
    deleteMutation,
  };
};