import { useQuery, useMutation } from "@tanstack/react-query";
import { courseCompletedApi } from "../../core/api/course-completed/courseCompletedApi";

export const courseCompletedKeys = {
  all: ["courseCompleted"] as const,
  certificates: (userId: string, params?: any) => [...courseCompletedKeys.all, "certificates", userId, params] as const,
  certificate: (id: string) => [...courseCompletedKeys.all, "certificate", id] as const,
  eligibility: (userId: string, courseId: string) => [...courseCompletedKeys.all, "eligibility", userId, courseId] as const,
};

export const useUserCertificates = (userId: string, params?: { page?: number; limit?: number }, enabled = true) => {
  return useQuery({
    queryKey: courseCompletedKeys.certificates(userId, params),
    queryFn: () => courseCompletedApi.getUserCertificates(userId, params),
    enabled: enabled && !!userId,
  });
};

export const useCertificateById = (certificateId: string, enabled = true) => {
  return useQuery({
    queryKey: courseCompletedKeys.certificate(certificateId),
    queryFn: () => courseCompletedApi.getCertificateById(certificateId),
    enabled: enabled && !!certificateId,
  });
};

export const useCheckEligibility = (userId: string, courseId: string, enabled = true) => {
  return useQuery({
    queryKey: courseCompletedKeys.eligibility(userId, courseId),
    queryFn: () => courseCompletedApi.checkEligibility(userId, courseId),
    enabled: enabled && !!userId && !!courseId,
  });
};

export const useDownloadCertificate = () => {
  return useMutation({
    mutationFn: ({ certificateId, userId }: { certificateId: string; userId?: string }) =>
      courseCompletedApi.downloadCertificatePdf(certificateId, userId),
  });
};
