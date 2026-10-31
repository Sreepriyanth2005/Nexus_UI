import { api } from "../../../config/axios";
import {
  UserCertificatesResponse,
  CompletedCourseResponse,
  EligibilityResponse,
} from "./courseCompletedApi.types";

export const courseCompletedApi = {
  getUserCertificates: async (userId: string, params?: { page?: number; limit?: number }): Promise<UserCertificatesResponse> => {
    const { data } = await api.get<UserCertificatesResponse>(`/certificates/user/${userId}`, { params });
    return data;
  },

  getCertificateById: async (certificateId: string): Promise<CompletedCourseResponse> => {
    const { data } = await api.get<CompletedCourseResponse>(`/certificates/${certificateId}`);
    return data;
  },

  checkEligibility: async (userId: string, courseId: string): Promise<EligibilityResponse> => {
    const { data } = await api.get<EligibilityResponse>(`/certificates/eligibility/${userId}/${courseId}`);
    return data;
  },

  downloadCertificatePdf: async (certificateId: string, userId?: string): Promise<Blob> => {
    const response = await api.get(`/certificates/${certificateId}/download`, {
      params: userId ? { userId } : undefined,
      responseType: 'blob',
    });
    return response.data;
  },
};
