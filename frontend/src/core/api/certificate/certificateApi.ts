import { api } from "../../../config/axios";
import {
  CertificateAdminQueryParams,
  CertificateListResponse,
  CertificateStatsResponse,
  CertificateDetailResponse,
  CertificateRevokePayload,
  CertificateDesignResponse,
  SaveCertificateDesignPayload,
} from "./certificateApi.types";

export const certificateApi = {
  getAdminList: async (params?: CertificateAdminQueryParams): Promise<CertificateListResponse> => {
    const { data } = await api.get<CertificateListResponse>("/certificates/admin/list", { params });
    return data;
  },

  getAdminStats: async (): Promise<CertificateStatsResponse> => {
    const { data } = await api.get<CertificateStatsResponse>("/certificates/admin/stats");
    return data;
  },

  getById: async (certificateId: string): Promise<CertificateDetailResponse> => {
    const { data } = await api.get<CertificateDetailResponse>(`/certificates/${certificateId}`);
    return data;
  },

  revoke: async (
    certificateId: string,
    payload: CertificateRevokePayload
  ): Promise<{ success: boolean; message: string }> => {
    const { data } = await api.post<{ success: boolean; message: string }>(
      `/certificates/${certificateId}/revoke`,
      payload
    );
    return data;
  },

  getDesign: async (): Promise<CertificateDesignResponse> => {
    const { data } = await api.get<CertificateDesignResponse>("/certificates/design");
    return data;
  },

  saveDesign: async (payload: SaveCertificateDesignPayload): Promise<CertificateDesignResponse> => {
    const { data } = await api.post<CertificateDesignResponse>("/certificates/design", payload);
    return data;
  },

  resetDesign: async (): Promise<CertificateDesignResponse> => {
    const { data } = await api.post<CertificateDesignResponse>("/certificates/design/reset");
    return data;
  },

  bulkResend: async (payload: { certificateIds: string[] }): Promise<any> => {
    const { data } = await api.post("/certificates/admin/bulk-resend", payload);
    return data;
  },
};
