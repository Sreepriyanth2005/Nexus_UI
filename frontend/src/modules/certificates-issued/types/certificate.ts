export type CertificateStatus = 'Active' | 'Revoked';

export interface Certificate {
  id: string;
  issuedDate: string;
  recipientName: string;
  email: string;
  certification: string;
  certificationLabel: string;
  path: string;
  issuer: string;
  verifyUrl: string;
  status: CertificateStatus;
  revokeReason?: string;
}

export interface CertificateStats {
  totalIssued: number;
  thisWeek: number;
  pendingIssuance: number;
  revokedExpired: number;
}

export interface CertificateFilters {
  dateRange: string;
  careerPath: string;
  tenant: string;
  status: string;
}
