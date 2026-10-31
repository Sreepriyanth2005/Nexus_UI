import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { certificateNameEditorApi } from "../../core/api/certificate-name-editor/certificateNameEditorApi";

export const nameEditorKeys = {
  all: ["certificateNameEditor"] as const,
  confirmation: (userId: string) => [...nameEditorKeys.all, "confirmation", userId] as const,
};

export const useGetNameConfirmation = (userId: string, enabled = true) => {
  return useQuery({
    queryKey: nameEditorKeys.confirmation(userId),
    queryFn: () => certificateNameEditorApi.getNameConfirmation(userId),
    enabled: enabled && !!userId,
  });
};

export const useConfirmAndGenerate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: certificateNameEditorApi.confirmAndGenerate,
    onSuccess: () => {
      // Invalidate queries to refresh completed certificate status
      queryClient.invalidateQueries({ queryKey: ["courseCompleted"] });
    },
  });
};

export const useUpdateCertificateName = () => {
  return useMutation({
    mutationFn: certificateNameEditorApi.updateCertificateName,
  });
};

export const useVerifyProfileOtp = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: certificateNameEditorApi.verifyProfileOtp,
    onSuccess: () => {
      // Invalidate name confirmation check
      queryClient.invalidateQueries({ queryKey: nameEditorKeys.all });
      // Invalidate profile queries
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["certificateName"] });
    },
  });
};

export const useResendProfileOtp = () => {
  return useMutation({
    mutationFn: certificateNameEditorApi.resendProfileOtp,
  });
};
