import {
  useQuery,
} from "@tanstack/react-query";

import {
  getRecommendations,
} from "../core/api/recommendation.api";

export const useRecommendations =
  () =>
    useQuery({
      queryKey:
        ["recommendations"],

      queryFn:
        getRecommendations,
    });