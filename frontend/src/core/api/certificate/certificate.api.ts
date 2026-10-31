import { api } from "../../../config/axios";
import { CertificateListResponse, CertificateDetailResponse } from "./certificateApi.types";

export interface ShareCertificateResponse {
  success: boolean;
  data: {
    certificateId: string;
    shareUrl: string;
    token: string;
  };
}

export interface VerifyCertificateData {
  serialNumber: string;
  recipientName: string;
  courseTitle: string;
  issuedAt: string;
  isRevoked: boolean;
  revokedAt: string | null;
  revokedReason?: string | null;
  issuer: string;
}

export interface VerifyCertificateResponse {
  success: boolean;
  data: VerifyCertificateData;
}

export interface PublicCertificatePreviewData {
  serialNumber: string;
  certificateId?: string;
  recipientName: string;
  courseTitle: string;
  issuedAt: string;
  isRevoked: boolean;
  revokedAt: string | null;
  issuer: string;
}

export interface PublicCertificatePreviewResponse {
  success: boolean;
  data: PublicCertificatePreviewData;
}

export const certificateIntegrationApi = {
  getUserCertificates: async (
    userId: string,
    params?: { page?: number; limit?: number; search?: string }
  ): Promise<CertificateListResponse> => {
    const { data } = await api.get<CertificateListResponse>(
      `/certificates/user/${userId}`,
      { params }
    );
    return data;
  },

  getCertificate: async (certificateId: string): Promise<CertificateDetailResponse> => {
    const { data } = await api.get<CertificateDetailResponse>(
      `/certificates/${certificateId}`
    );
    return data;
  },

  shareCertificate: async (certificateId: string): Promise<ShareCertificateResponse> => {
    const { data } = await api.post<ShareCertificateResponse>(
      `/certificates/${certificateId}/share`
    );
    return data;
  },

  verifyCertificate: async (serialNumber: string): Promise<VerifyCertificateResponse> => {
    const { data } = await api.get<VerifyCertificateResponse>(
      `/certificates/verify/${serialNumber}`
    );
    return data;
  },

  getPublicCertificate: async (token: string): Promise<PublicCertificatePreviewResponse> => {
    const { data } = await api.get<PublicCertificatePreviewResponse>(
      `/certificates/public/${token}`
    );
    return data;
  },
};
