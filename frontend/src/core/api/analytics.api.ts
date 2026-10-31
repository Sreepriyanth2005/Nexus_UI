// src/core/api/analytics.api.ts

import { api } from "../../config/axios";

/**
 * MY ANALYTICS
 */
export const getMyAnalytics =
  async () => {
    const res =
      await api.get(
        "/analytics/me"
      );

    return res.data;
  };

/**
 * PROFILE COMPLETION
 */
export const getProfileCompletion =
  async () => {
    const res =
      await api.get(
        "/analytics/profile-completion"
      );

    return res.data;
  };