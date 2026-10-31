export interface CertificateUserProfile {
  firstName: string;
  lastName: string;
  certificateName: string;
  titlePrefix: string | null;
}

export interface CertificateUser {
  id: string;
  email: string;
  profile: CertificateUserProfile;
}

export interface CareerPathItem {
  careerPath: {
    id: string;
    title: string;
  };
}

export interface CertificateCourse {
  id: string;
  title: string;
  careerPaths: CareerPathItem[];
}

export interface CertificateLog {
  id: string;
  certificateId: string | null;
  action: string | null;
  createdAt: string;
}

export interface CertificateVerification {
  isRevoked: boolean;
  revokedAt: string | null;
  publicUrl?: string | null;
  verificationToken?: string;
}

export interface CertificateDto {
  id: string;
  userId: string;
  courseId: string;
  fileUrl: string | null;
  issuedAt: string;
  updatedAt: string;
  issuer?: string;
  certificateAssetId: string | null;
  serialNumber?: string | null;
  recipientName?: string | null;
  career_path_id?: string | null;
  careerPathId?: string | null;
  career_paths?: {
    id: string;
    title: string;
  } | null;
  user: CertificateUser;
  course: CertificateCourse;
  logs: CertificateLog[];
  verification: CertificateVerification | null;
}

export interface CertificateListResponse {
  success: boolean;
  data: {
    data: CertificateDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface CertificateStatsData {
  totalIssued: number;
  thisWeek: number;
  pendingIssuance: number;
  revoked: number;
}

export interface CertificateStatsResponse {
  success: boolean;
  data: CertificateStatsData;
}

export interface CertificateDetailResponse {
  success: boolean;
  data: CertificateDto;
}

export interface CertificateAdminQueryParams {
  page?: number;
  limit?: number;
  courseId?: string;
  tenantId?: string;
  status?: 'ACTIVE' | 'REVOKED';
  dateRangeStart?: string;
  dateRangeEnd?: string;
  search?: string;
  sortBy?: 'issuedAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

export interface CertificateRevokePayload {
  comment: string;
}

export interface CertificateDesignDto {
  id: string;
  templateStyle: string;
  orientation: string;
  accentColor: string;
  logoAssetId: string | null;
  logoUrl?: string | null;
  signatoryName: string;
  signatoryTitle: string;
  footerLine: string;
  fieldMappings: any;
  tenantId: string | null;
}

export interface CertificateDesignResponse {
  success: boolean;
  data: CertificateDesignDto;
}

export interface SaveCertificateDesignPayload {
  templateStyle?: string;
  orientation?: string;
  accentColor?: string;
  logoAssetId?: string | null;
  signatoryName?: string;
  signatoryTitle?: string;
  footerLine?: string;
  fieldMappings?: any;
}
