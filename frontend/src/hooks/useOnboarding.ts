import {
  useMutation,
  useQuery,
} from "@tanstack/react-query";

import {
  getMyOnboarding,
  updateOnboardingStep,
  completeOnboarding,
} from "../core/api/onboarding.api";

export const useMyOnboarding =
  () =>
    useQuery({
      queryKey: ["onboarding"],

      queryFn:
        getMyOnboarding,
    });

export const useUpdateOnboardingStep =
  () =>
    useMutation({
      mutationFn:
        updateOnboardingStep,
    });

export const useCompleteOnboarding =
  () =>
    useMutation({
      mutationFn:
        completeOnboarding,
    });