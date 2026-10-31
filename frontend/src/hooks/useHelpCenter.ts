import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { helpCenterApi } from "../core/api/helpCenter.api";
import {
  CreateSubmitIdeaPayload,
  CreateIssueReportPayload,
} from "../core/api/helpCenter.types";

export const helpCenterKeys = {
  all: ["helpCenter"] as const,
  myIdeas: () => [...helpCenterKeys.all, "myIdeas"] as const,
  allIdeas: () => [...helpCenterKeys.all, "allIdeas"] as const,
  myIssueReports: () => [...helpCenterKeys.all, "myIssueReports"] as const,
  allIssueReports: () => [...helpCenterKeys.all, "allIssueReports"] as const,
};

// --- SUBMIT IDEA HOOKS ---

export const useMyIdeas = () => {
  return useQuery({
    queryKey: helpCenterKeys.myIdeas(),
    queryFn: () => helpCenterApi.getMyIdeas(),
  });
};

export const useAllIdeas = () => {
  return useQuery({
    queryKey: helpCenterKeys.allIdeas(),
    queryFn: () => helpCenterApi.getAllIdeas(),
  });
};

export const useSubmitIdea = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateSubmitIdeaPayload) => helpCenterApi.submitIdea(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: helpCenterKeys.myIdeas() });
      queryClient.invalidateQueries({ queryKey: helpCenterKeys.allIdeas() });
    },
  });
};

// --- ISSUE REPORTING HOOKS ---

export const useMyIssueReports = () => {
  return useQuery({
    queryKey: helpCenterKeys.myIssueReports(),
    queryFn: () => helpCenterApi.getMyIssueReports(),
  });
};

export const useAllIssueReports = () => {
  return useQuery({
    queryKey: helpCenterKeys.allIssueReports(),
    queryFn: () => helpCenterApi.getAllIssueReports(),
  });
};

export const useSubmitIssueReport = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateIssueReportPayload) => helpCenterApi.submitIssueReport(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: helpCenterKeys.myIssueReports() });
      queryClient.invalidateQueries({ queryKey: helpCenterKeys.allIssueReports() });
    },
  });
};
