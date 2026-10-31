import { CertificateDto } from '../certificate/certificateApi.types';

export interface CompletedCourseResponse {
  success: boolean;
  data: CertificateDto;
}

export interface UserCertificatesResponse {
  success: boolean;
  data: CertificateDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface EligibilityResponse {
  success: boolean;
  data: {
    eligible: boolean;
    courseCompleted: boolean;
    quizPassed: boolean;
    profileCompleted: boolean;
    missingItems: string[];
  };
}
