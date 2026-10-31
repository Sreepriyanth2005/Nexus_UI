import { CertificateDto } from '../certificate/certificateApi.types';

export interface NameConfirmationResponse {
  success: boolean;
  data: {
    currentName: string;
    titlePrefix: string | null;
    displayName: string;
    requiresOtp: boolean;
  };
}

export interface ConfirmGenerateResponse {
  success: boolean;
  message: string;
  isDuplicate: boolean;
  data: CertificateDto;
}

export interface UpdateNameOtpResponse {
  success: boolean;
  data: {
    otpRequired: boolean;
    tempValue?: string;
    message?: string;
  };
}

export interface VerifyOtpResponse {
  success: boolean;
  data: any;
}
