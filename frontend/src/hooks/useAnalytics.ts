import {
  useQuery,
} from "@tanstack/react-query";

import {
  getMyAnalytics,
  getProfileCompletion,
} from "../core/api/analytics.api";

export const useMyAnalytics =
  () =>
    useQuery({
      queryKey:
        ["analytics"],

      queryFn:
        getMyAnalytics,
    });

export const useProfileCompletion =
  () =>
    useQuery({
      queryKey:
        ["profile-completion"],

      queryFn:
        getProfileCompletion,
    });