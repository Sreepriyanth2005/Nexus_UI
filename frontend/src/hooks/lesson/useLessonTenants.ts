// src/hooks/lesson/useLessonTenants.ts

import {
  useMutation,
  useQuery,
} from "@tanstack/react-query";

import {
  getLessonTenantsApi,
  createLessonTenantApi,
  updateLessonTenantApi,
  deleteLessonTenantApi,
} from "../../core/api/lesson/lesson-tenant.api";

import {
  useLessonTenantStore,
} from "../../store/lesson/lessonTenantStore";

export const useLessonTenants = (
  lessonId: string
) => {
  const {
    tenants,
    setTenants,
    addTenant,
    updateTenant,
    deleteTenant,
  } = useLessonTenantStore();

  const query = useQuery({
    queryKey: [
      "lesson-tenants",
      lessonId,
    ],

    enabled: !!lessonId,

    queryFn: async () => {
      const data =
        await getLessonTenantsApi(
          lessonId
        );

      setTenants(data);

      return data;
    },
  });

  const createMutation =
    useMutation({
      mutationFn: (
        payload: any
      ) =>
        createLessonTenantApi(
          lessonId,
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
        updateLessonTenantApi(
          lessonId,
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
        deleteLessonTenantApi(
          lessonId,
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