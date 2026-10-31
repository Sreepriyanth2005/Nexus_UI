import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { UserLifecycleAPI, UserAccountStatus, ReactivateAccountPayload } from "../core/api/user-lifecycle.api";
import { useUserLifecycleStore } from "../store/userLifecycle.store";

export const useUserLifecycleKeys = {
  all: ["user-lifecycle"] as const,
  status: (params: { email?: string; userId?: string }) =>
    [...useUserLifecycleKeys.all, "status", params.email || params.userId || ""] as const,
};

/**
 * Hook to fetch user lifecycle status (status, deletedAt timestamp) from the database
 */
export const useUserLifecycleStatus = (
  params: { email?: string; userId?: string },
  enabled = true
) => {
  const setAccountStatus = useUserLifecycleStore((state) => state.setAccountStatus);

  const query = useQuery<UserAccountStatus>({
    queryKey: useUserLifecycleKeys.status(params),
    queryFn: () => UserLifecycleAPI.getAccountStatus(params),
    enabled: enabled && Boolean(params.email || params.userId),
    staleTime: 1000 * 60, // 1 minute
  });

  useEffect(() => {
    if (query.data) {
      setAccountStatus(query.data);
    }
  }, [query.data, setAccountStatus]);

  return query;
};

/**
 * Hook to reactivate a deleted or inactive account
 */
export const useReactivateAccount = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ReactivateAccountPayload) =>
      UserLifecycleAPI.reactivateAccount(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: useUserLifecycleKeys.all });
      queryClient.invalidateQueries({ queryKey: ["user"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });
};
