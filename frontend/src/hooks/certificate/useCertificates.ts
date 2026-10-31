import { useQuery, useMutation } from "@tanstack/react-query";
import { certificateIntegrationApi } from "../../core/api/certificate/certificate.api";

export const integrationCertificateKeys = {
  all: ["integrationCertificates"] as const,
  userLists: (userId: string) => [...integrationCertificateKeys.all, "userList", userId] as const,
  userList: (userId: string, params?: any) => [...integrationCertificateKeys.userLists(userId), params] as const,
  details: () => [...integrationCertificateKeys.all, "detail"] as const,
  detail: (id: string) => [...integrationCertificateKeys.details(), id] as const,
  verifications: () => [...integrationCertificateKeys.all, "verification"] as const,
  verification: (serialNumber: string) => [...integrationCertificateKeys.verifications(), serialNumber] as const,
  publicPreviews: () => [...integrationCertificateKeys.all, "publicPreview"] as const,
  publicPreview: (token: string) => [...integrationCertificateKeys.publicPreviews(), token] as const,
};

export const useUserCertificates = (
  userId: string,
  params?: { page?: number; limit?: number; search?: string },
  enabled = true
) => {
  return useQuery({
    queryKey: integrationCertificateKeys.userList(userId, params),
    queryFn: () => certificateIntegrationApi.getUserCertificates(userId, params),
    enabled: enabled && !!userId,
  });
};

export const useCertificate = (certificateId: string, enabled = true) => {
  return useQuery({
    queryKey: integrationCertificateKeys.detail(certificateId),
    queryFn: () => certificateIntegrationApi.getCertificate(certificateId),
    enabled: enabled && !!certificateId,
  });
};

export const useShareCertificate = () => {
  return useMutation({
    mutationFn: (certificateId: string) =>
      certificateIntegrationApi.shareCertificate(certificateId),
  });
};

export const useCertificateVerification = (serialNumber: string, enabled = true) => {
  return useQuery({
    queryKey: integrationCertificateKeys.verification(serialNumber),
    queryFn: () => certificateIntegrationApi.verifyCertificate(serialNumber),
    enabled: enabled && !!serialNumber,
    retry: false, // Don't retry on 404 for invalid certificates
  });
};

export const usePublicCertificate = (token: string, enabled = true) => {
  return useQuery({
    queryKey: integrationCertificateKeys.publicPreview(token),
    queryFn: () => certificateIntegrationApi.getPublicCertificate(token),
    enabled: enabled && !!token,
    retry: false,
  });
};
