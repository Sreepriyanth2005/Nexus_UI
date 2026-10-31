// src/core/api/recommendation.api.ts

import { api } from "../../config/axios";

/**
 * MY RECOMMENDATIONS
 */
export const getRecommendations =
  async () => {
    const res =
      await api.get(
        "/recommendations/me"
      );

    return res.data;
  };