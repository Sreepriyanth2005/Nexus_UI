// src/hooks/profile/useProfileOnboarding.ts

import { useCallback } from "react";
import {getOnboardingProgressApi,resetOnboardingApi,} from "../../core/api/profile/profile.api";
import { useProfileStore } from "../../store/profile.store";

export const useProfileOnboarding = () => {
  const {
    onboarding,
    loading,
    error,

    setOnboarding,

    setLoading,
    setError,
  } = useProfileStore();

  /**
   * ============================================================
   * GET ONBOARDING PROGRESS
   * ============================================================
   */

  const getOnboarding =
    useCallback(async () => {
      try {
        setLoading(true);
        setError(null);

        const data =
          await getOnboardingProgressApi();

        setOnboarding(data);

        return data;
      } catch (err: any) {
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    }, [
      setLoading,
      setError,
      setOnboarding,
    ]);

  /**
   * ============================================================
   * RESET ONBOARDING
   * ============================================================
   */

  const resetOnboarding =
    useCallback(async () => {
      try {
        setLoading(true);
        setError(null);

        const data =
          await resetOnboardingApi();

        setOnboarding(data);

        return data;
      } catch (err: any) {
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    }, [
      setLoading,
      setError,
      setOnboarding,
    ]);

  return {
    onboarding,

    loading,
    error,

    getOnboarding,

    resetOnboarding,
  };
};