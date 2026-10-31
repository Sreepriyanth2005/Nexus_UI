// src/core/api/onboarding.api.ts

import { api } from "../../config/axios";

/**
 * GET MY ONBOARDING
 */
export const getMyOnboarding = async () => {
  const res = await api.get(
    "/onboarding/me"
  );

  return res.data;
};

/**
 * UPDATE ONBOARDING STEP
 */
export const updateOnboardingStep =
  async (
    stepCode: string
  ) => {
    const res =
      await api.post(
        "/onboarding/step",
        {
          stepCode,
        }
      );

    return res.data;
  };

/**
 * COMPLETE ONBOARDING
 */
export const completeOnboarding =
  async () => {
    const res =
      await api.post(
        "/onboarding/complete"
      );

    return res.data;
  };