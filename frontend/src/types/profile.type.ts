// src/core/api/profile/profile.types.ts

/* ==========================================================================
 * ENUMS
 * ========================================================================== */

export type TitlePrefix =
  | "MR"
  | "MRS"
  | "MS"
  | "MISS"
  | "DR"
  | "PROF";

export type Gender =
  | "MALE"
  | "FEMALE"
  | "OTHER";

export type ExperienceLevel =
  | "BEGINNER"
  | "INTERMEDIATE"
  | "ADVANCED"
  | "EXPERT"


export type ProfileVisibility =
  | "PUBLIC"
  | "PRIVATE";

/* ==========================================================================
 * NOTIFICATION
 * ========================================================================== */

export interface NotificationPreference {
  email?: boolean;
  sms?: boolean;
  push?: boolean;
  marketing?: boolean;
}

/* ==========================================================================
 * CAREER
 * ========================================================================== */

export interface CareerHistory {
  id?: string;
  employer: string;
  jobTitle: string;
  jobDescription?: string;
  startDate: string;
  endDate?: string | null;
  isCurrentJob: boolean;
}

/* ==========================================================================
 * EDUCATION
 * ========================================================================== */

export interface EducationHistory {
  id?: string;
  institutionName: string;
  degree: string;
  fieldOfStudy: string;
  startDate: string;
  endDate?: string | null;
}

/* ==========================================================================
 * PERSONAL LINKS
 * ========================================================================== */

export interface PersonalLink {
  id?: string;
  title: string;
  url: string;
}

/* ==========================================================================
 * CERTIFICATES
 * ========================================================================== */

export interface Certificate {
  id: string;
  title: string;
  issuer?: string;
  assetId?: string;
  url?: string;
  issuedAt?: string;
  createdAt?: string;
}

/* ==========================================================================
 * UPDATE PROFILE REQUEST
 * ========================================================================== */

export interface UpdateProfileRequest {
  firstName?: string | null;
  lastName?: string | null;
  certificateName?: string | null;
  titlePrefix?: TitlePrefix | null;
  city?: string | null;
  countryName?: string | null;
  dob?: string | null;
  gender?: Gender | null;
  websiteUrl?: string | null;
  portfolioUrl?: string | null;
  phoneCountryCode?: string | null;
  mobileNumber?: string | null;
  currentRole?: string | null;
  currentEmployer?: string | null;
  experienceLevel?: ExperienceLevel | null;
  industry?: string | null;
  educationCompletionYear?: number | null;
  learningInterestIds?: string[];
  learningInterests?: string[];
  skills?: string[];
  careerPathIds?: string[];
  preferredLanguage?: string | null;
  locale?: string | null;
  timezone?: string | null;
  profileVisibility?: ProfileVisibility;
  notificationPreference?: NotificationPreference;
  careerHistory?: CareerHistory[];
  educationHistory?: EducationHistory[];
  personalLinks?: PersonalLink[];
}

/* ==========================================================================
 * PROFILE
 * ========================================================================== */

export interface UserProfile {
  id: string;
  email: string;
  emailVerified: boolean;
  tenantId?: string | null;
  tenant?: {
    id: string;
    name: string;
  } | null;
  profileCompleteness: number;
  mandatoryCompletionPercentage: number;
  optionalCompletionPercentage: number;
  isProfileCompleted: boolean;
  onboardingCompletedAt?: string | null;
  firstLoginAt?: string | null;

  profile: {
    firstName?: string;
    lastName?: string;
    certificateName?: string;
    titlePrefix?: TitlePrefix;
    city?: string;
    countryName?: string;
    dob?: string | null;
    gender?: Gender;
    phoneCountryCode?: string;
    mobileNumber?: string;
    phoneVerified?: boolean;
    websiteUrl?: string;
    photoUrl?: string;
    resumeUrl?: string;
    lastProfileUpdatedAt?: string | null;
  };

  professionalProfile: {
    currentRole?: string;
    experienceLevel?: ExperienceLevel;
    industry?: string;
    currentEmployer?: string;
    educationCompletionYear?: number;
    portfolioUrl?: string;
    careerHistory: CareerHistory[];
  };

  personalLinks: PersonalLink[];
  
  careerPaths: {
    id: string;
    name: string;
  }[];

  preferences?: {
    preferredLanguage?: string;
    locale?: string;
    timezone?: string;
    profileVisibility?: ProfileVisibility;
    notificationPreference?: NotificationPreference;
  };

  learningInterests: {
    id: string;
    name: string;
  }[];
  skills?: {
    id: string;
    name: string;
  }[];
}

/* ==========================================================================
 * PROFILE COMPLETION
 * ========================================================================== */

export interface ProfileCompletion {
  mandatoryPercentage: number;
  optionalPercentage: number;
  totalPercentage: number;
  completedFields: string[];
  missingFields: string[];
  isBasicComplete: boolean;
  isFullyComplete: boolean;
}

/* ==========================================================================
 * SECURITY
 * ========================================================================== */

export interface SecurityStatus {
  locked?: boolean;
  otpRequired?: boolean;
  mfaEnabled?: boolean;
  remainingAttempts?: number;
  lockExpiresAt?: string | null;
  lastSensitiveUpdate?: string | null;
}

/* ==========================================================================
 * AUDITS
 * ========================================================================== */

export interface AuditLog {
  id: string;
  fieldName: string;
  oldValue?: string | null;
  newValue?: string | null;
  changedAt: string;
  changedBy?: string;
}

export interface UserAuditLog {
  id: string;
  userId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  oldValue?: any | null;
  newValue?: any | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: string;
}

/* ==========================================================================
 * OTP
 * ========================================================================== */

export interface VerifyProfileOtpRequest {
  otp: string;
}

export interface OtpResponse {
  success: boolean;
  otpRequired?: boolean;
  message?: string;
  expiresIn?: number;
  sensitiveFields?: string[];
}

/* ==========================================================================
 * CERTIFICATE REQUEST
 * ========================================================================== */

export interface UploadCertificateRequest {
  title: string;
  issuer?: string;
  assetId?: string;
  issuedAt?: string;
}

/* ==========================================================================
 * COMMON RESPONSES
 * ========================================================================== */

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface UpdateProfileResponse
  extends ApiResponse<UserProfile> {
  otpRequired: boolean;
}

export interface OnboardingProgress {
  currentStep: number;
  totalSteps: number;
  completedSteps: number[];
  completionPercentage: number;
  completed: boolean;
}