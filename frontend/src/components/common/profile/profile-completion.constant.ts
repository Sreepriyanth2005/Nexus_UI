// src/constants/profile-completion.constant.ts

export const PROFILE_COMPLETENESS_WEIGHTS = {
  fullName: 15,
  certificateName: 5,
  titlePrefix: 2,
  profilePhoto: 10,
  city: 3,
  country: 5,
  dob: 10,
  gender: 5,
  phone: 8,
  websiteUrl: 3,

  currentRole: 5,
  experienceLevel: 5,
  industry: 5,
  learningInterests: 6,
  educationCompletionYear: 5,
  portfolioUrl: 5,
  externalCertificates: 5,
  careerPaths: 8,

  preferences: 5,
  consent: 3,
} as const;

export const MANDATORY_PROFILE_FIELDS = [
  "fullName",
  "email",
  "countryName",
] as const;

export const SENSITIVE_PROFILE_FIELDS = [
  "firstName",
  "lastName",
  "certificateName",
  "dob",
  "mobileNumber",
  "phoneCountryCode",
  "countryName",
  "gender",
  "email",
] as const;

export const PROFILE_COMPLETENESS_TOTAL = Object.values(PROFILE_COMPLETENESS_WEIGHTS).reduce(
  (acc, curr) => acc + curr,
  0
);