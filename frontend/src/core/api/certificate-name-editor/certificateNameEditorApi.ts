import { api } from "../../../config/axios";
import {
  NameConfirmationResponse,
  ConfirmGenerateResponse,
  UpdateNameOtpResponse,
  VerifyOtpResponse,
} from "./certificateNameEditorApi.types";

export const certificateNameEditorApi = {
  getNameConfirmation: async (userId: string): Promise<NameConfirmationResponse> => {
    const { data } = await api.get<NameConfirmationResponse>(`/certificates/name-confirmation/${userId}`);
    return data;
  },

  confirmAndGenerate: async (payload: {
    userId: string;
    courseId: string;
    confirmedName: string;
  }): Promise<ConfirmGenerateResponse> => {
    const { data } = await api.post<ConfirmGenerateResponse>('/certificates/confirm-and-generate', payload);
    return data;
  },

  updateCertificateName: async (name: string): Promise<UpdateNameOtpResponse> => {
    const { data } = await api.patch<UpdateNameOtpResponse>('/profile/me', { certificateName: name });
    return data;
  },

  verifyProfileOtp: async (otp: string): Promise<VerifyOtpResponse> => {
    const { data } = await api.post<VerifyOtpResponse>('/profile/me/verify-otp', { otp });
    return data;
  },

  resendProfileOtp: async (): Promise<{ success: boolean }> => {
    const { data } = await api.post<{ success: boolean }>('/profile/me/resend-otp');
    return data;
  },
};
