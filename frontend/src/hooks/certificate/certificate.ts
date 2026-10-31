import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { certificateApi } from "../../core/api/certificate/certificateApi";
import {
  CertificateAdminQueryParams,
  CertificateRevokePayload,
} from "../../core/api/certificate/certificateApi.types";

export const certificateKeys = {
  all: ["certificates"] as const,
  adminLists: () => [...certificateKeys.all, "adminList"] as const,
  adminList: (params?: CertificateAdminQueryParams) =>
    [...certificateKeys.adminLists(), params] as const,
  adminStats: () => [...certificateKeys.all, "adminStats"] as const,
  details: () => [...certificateKeys.all, "detail"] as const,
  detail: (id: string) => [...certificateKeys.details(), id] as const,
};

export const useCertificateAdminList = (params?: CertificateAdminQueryParams) => {
  return useQuery({
    queryKey: certificateKeys.adminList(params),
    queryFn: () => certificateApi.getAdminList(params),
  });
};

export const useCertificateAdminStats = () => {
  return useQuery({
    queryKey: certificateKeys.adminStats(),
    queryFn: () => certificateApi.getAdminStats(),
  });
};

export const useCertificateById = (certificateId: string, enabled = true) => {
  return useQuery({
    queryKey: certificateKeys.detail(certificateId),
    queryFn: () => certificateApi.getById(certificateId),
    enabled: enabled && !!certificateId,
  });
};

export const useCertificateRevoke = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      certificateId,
      payload,
    }: {
      certificateId: string;
      payload: CertificateRevokePayload;
    }) => certificateApi.revoke(certificateId, payload),
    onSuccess: (_, variables) => {
      // Invalidate both lists and stats when revocation occurs
      queryClient.invalidateQueries({ queryKey: certificateKeys.all });
    },
  });
};

export const useCertificateDesign = () => {
  return useQuery({
    queryKey: [...certificateKeys.all, "design"],
    queryFn: () => certificateApi.getDesign(),
  });
};

export const useSaveCertificateDesign = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: any) => certificateApi.saveDesign(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...certificateKeys.all, "design"] });
    },
  });
};

export const useResetCertificateDesign = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => certificateApi.resetDesign(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...certificateKeys.all, "design"] });
    },
  });
};

export const useCertificateBulkResend = () => {
  return useMutation({
    mutationFn: (certificateIds: string[]) => certificateApi.bulkResend({ certificateIds }),
  });
};
