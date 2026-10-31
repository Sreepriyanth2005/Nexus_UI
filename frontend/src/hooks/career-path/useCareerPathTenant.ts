// src/hooks/career-path/useCareerPathTenant.ts

import {
  useMutation,
  useQuery,
} from "@tanstack/react-query";

import {
  getCareerPathTenantApi,
  assignCareerPathTenantApi,
  removeCareerPathTenantApi,
} from "../../core/api/career-path/careerpath-tenant.api";

import {
  useCareerPathTenantStore,
} from "../../store/career-path/careerPathTenantStore";

export const useCareerPathTenant =
  (
    careerPathId: string
  ) => {
    const store =
      useCareerPathTenantStore();

    const query =
      useQuery({
        queryKey: [
          "career-path-tenant",
          careerPathId,
        ],

        enabled:
          !!careerPathId,

        queryFn:
          async () => {
            const data =
              await getCareerPathTenantApi(
                careerPathId
              );

            store.setTenant(
              data
            );

            return data;
          },
      });

    return {
      query,

      assignMutation:
        useMutation({
          mutationFn: (
            payload
          ) =>
            assignCareerPathTenantApi(
              careerPathId,
              payload
            ),

          onSuccess: (
            data
          ) =>
            store.setTenant(
              data
            ),
        }),

      removeMutation:
        useMutation({
          mutationFn: () =>
            removeCareerPathTenantApi(
              careerPathId
            ),

          onSuccess: () =>
            store.clearTenant(),
        }),
    };
  };