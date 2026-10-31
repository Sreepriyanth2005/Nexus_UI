import { create } from "zustand";

import {
  getRecommendations,
} from "../core/api/recommendation.api";

type RecommendationState = {
  recommendations:
    any[];

  loading:
    boolean;

  error:
    string | null;

  setRecommendations:
    (
      data: any[]
    ) => void;

  fetchRecommendations:
    () => Promise<void>;
};

export const useRecommendationStore =
  create<RecommendationState>(
    (set) => ({
      recommendations:
        [],

      loading:
        false,

      error:
        null,

      setRecommendations:
        (
          data
        ) =>
          set({
            recommendations:
              data,
          }),

      fetchRecommendations:
        async () => {
          set({
            loading:
              true,

            error:
              null,
          });

          try {
            const response =
              await getRecommendations();

            set({
              recommendations:
                Array.isArray(
                  response?.data
                )
                  ? response.data
                  : [],

              loading:
                false,
            });
          } catch (error: any) {
            set({
              loading:
                false,

              error:
                error.response?.data?.message ||
                error.message ||
                "Failed to fetch recommendations",
            });
          }
        },
    })
  );
